const fs = require("node:fs"),
  path = require("node:path"),
  cms = require("../server/content.cjs"),
  render = require("../server/render.cjs"),
  auth = require("../server/auth.cjs");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const q = new URL(req.url, "http://localhost").searchParams,
      mode = q.get("mode") || "home",
      preview = q.get("preview") === "1";
    if (req.method !== "GET")
      return res.status(405).send("Método no permitido");
    if (preview) {
      await auth.user(req);
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    const all =
      !cms.local() && !process.env.SUPABASE_URL
        ? cms.seeds()
        : await cms.records();
    if (mode === "catalog") {
      return res.status(200).json({
        categorias: cms.categories.map((c) => ({
          ...c,
          productos: all
            .filter(
              (r) =>
                r.kind === "product" &&
                r.published &&
                r.published.category === c.slug,
            )
            .map((r) => r.published),
        })),
      });
    }
    res.setHeader(
      "Content-Type",
      mode === "sitemap"
        ? "application/xml; charset=utf-8"
        : "text/html; charset=utf-8",
    );
    if (mode === "sitemap") {
      let xml = fs
        .readFileSync(path.join(cms.ROOT, "sitemap.xml"), "utf8")
        .replace(
          /\s*<url>\s*<loc>https:\/\/www.ecovatioenergy.com\/(proyectos|sistemas)\/.*?<\/url>/gs,
          "",
        );
      return res.status(200).send(
        xml.replace(
          "</urlset>",
          all
            .filter((r) => r.published)
            .map(
              (r) =>
                `<url><loc>https://www.ecovatioenergy.com${render.url(r.kind, r.slug)}</loc></url>`,
            )
            .join("") + "</urlset>",
        ),
      );
    }
    if (mode === "home") return res.status(200).send(render.home(all));
    const record = all.find((r) => r.kind === mode && r.slug === q.get("slug"));
    const p = preview ? record?.draft : record?.published;
    if (!p)
      return res
        .status(404)
        .send(
          '<h1>Contenido no disponible</h1><a href="/">Volver al inicio</a>',
        );
    return res.status(200).send(render.page(mode, p, preview, all));
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res
      .status(e.status || 503)
      .send(
        '<h1>No pudimos cargar este contenido</h1><p>Inténtelo de nuevo en unos momentos.</p><a href="/">Volver al inicio</a>',
      );
  }
};
