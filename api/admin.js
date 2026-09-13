const cms = require("../server/content.cjs"),
  auth = require("../server/auth.cjs");
module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const url = new URL(req.url, "http://localhost"),
      action = url.searchParams.get("action") || "list";
    if (req.method === "GET" && action === "status") {
      let name = null;
      try {
        name = await auth.user(req);
      } catch {}
      return res
        .status(200)
        .json({
          local: cms.local(),
          user: name,
          configured:
            cms.local() ||
            !!(
              process.env.SUPABASE_URL &&
              process.env.SUPABASE_ANON_KEY &&
              process.env.SUPABASE_SERVICE_ROLE_KEY &&
              process.env.ADMIN_EMAILS &&
              process.env.SITE_URL
            ),
        });
    }
    if (req.method === "POST") {
      auth.origin(req);
      const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (action === "login")
        return res.status(200).json(await auth.login(req, res, b));
      await auth.user(req);
      if (action === "logout") {
        auth.logout(req, res);
        return res.status(200).json({ ok: true });
      }
      if (action === "upload")
        return res.status(200).json(await auth.upload(b));
      if (action === "save") return res.status(200).json(await cms.mutate(b));
    } else if (req.method === "GET") {
      await auth.user(req);
      if (action === "list")
        return res
          .status(200)
          .json({
            records: await cms.records(),
            categories: cms.categories.map(({ slug, nombre }) => ({
              slug,
              nombre,
            })),
          });
    }
    return res.status(405).json({ error: "Operación no disponible." });
  } catch (e) {
    return res
      .status(e.status || 500)
      .json({
        error: e.status
          ? e.message
          : "No se pudo completar la operación. Inténtelo de nuevo.",
      });
  }
};
