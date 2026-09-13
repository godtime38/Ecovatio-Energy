const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const ROOT = path.resolve(__dirname, "..");
const bundledAssets = new Set(require("./asset-list.json"));
const local = () => process.env.CMS_LOCAL === "1" && !process.env.VERCEL;
const dir = () =>
  process.env.CMS_LOCAL_DIR || path.join(ROOT, ".cache", "admin");
const categories = JSON.parse(
  fs.readFileSync(path.join(ROOT, "assets/data/sistemas.json"), "utf8"),
).categorias;
function seeds() {
  return [
    ...categories
      .flatMap((c) =>
        c.productos.map((p) => ({
          id: "product:" + p.slug,
          kind: "product",
          slug: p.slug,
          draft: { ...p, category: c.slug },
          published: p.publicado === false ? null : { ...p, category: c.slug },
          revision: 0,
        })),
      )
      .filter((r) => r.slug),
    ...JSON.parse(
      fs.readFileSync(path.join(ROOT, "assets/data/proyectos.json"), "utf8"),
    ).proyectos.map((p) => {
      let slug = p.slug || p.images[0].split("/").at(-2).toLowerCase();
      p = { ...p, images: p.images.filter((src) => bundledAssets.has(src)) };
      return {
        id: "project:" + slug,
        kind: "project",
        slug,
        draft: { ...p, slug },
        published: { ...p, slug },
        revision: 0,
      };
    }),
  ];
}
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
async function remote(route, options = {}) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    fail("Falta conectar Supabase en las variables del servidor.", 503);
  const r = await fetch(process.env.SUPABASE_URL + route, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 409)
    fail("Otra persona guardó este registro. Recargue antes de continuar.", 409);
  if (!r.ok)
    fail(
      "No se pudo guardar o consultar Supabase. Revise la configuración e intente de nuevo.",
      503,
    );
  return r.status === 204 ? null : r.json();
}
async function records() {
  let overrides = [];
  if (local()) {
    const f = path.join(dir(), "content.json");
    if (fs.existsSync(f)) overrides = JSON.parse(fs.readFileSync(f));
  } else {
    for (let offset = 0; ; offset += 500) {
      const page = await remote(
        "/rest/v1/cms_entries?select=*&order=id&limit=500&offset=" + offset,
      );
      overrides.push(...page);
      if (page.length < 500) break;
    }
  }
  return [
    ...new Map([...seeds(), ...overrides].map((r) => [r.id, r])).values(),
  ];
}
function text(value, name, required = false, max = 8000) {
  if (value === undefined || value === null) value = "";
  if (typeof value !== "string" || value.length > max) fail("Revise " + name);
  value = value.trim();
  if (required && !value) fail("Complete " + name);
  return value;
}
function asset(value, pdf = false) {
  value = text(value, "archivo", true, 1000);
  if (!(pdf ? /\.pdf$/i : /\.(webp|png|jpe?g|avif|svg)$/i).test(value))
    fail(pdf ? "Seleccione un PDF." : "Seleccione una imagen válida.");
  if (/\.svg$/i.test(value) && !bundledAssets.has(value))
    fail("SVG no permitido");
  if (
    value.startsWith("/assets/") &&
    !value.includes("..") &&
    !/[%\\?#<>"\s]/.test(value)
  )
    return value;
  let u;
  try {
    u = new URL(value);
  } catch {
    fail("Seleccione un archivo válido de la biblioteca.");
  }
  if (
    u.protocol !== "https:" ||
    u.origin !==
      new URL(process.env.SUPABASE_URL || "https://invalid.local").origin ||
    !u.pathname.startsWith("/storage/v1/object/public/ecovatio-media/")
  )
    fail("El archivo debe pertenecer a la biblioteca de Ecovatio.");
  return value;
}
function lines(value, name) {
  if (!Array.isArray(value) || value.length > 40) fail("Revise " + name);
  return value.map((v) => text(v, name, true, 2000));
}
function validate(kind, raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    fail("Contenido inválido");
  const p = {};
  p.slug = text(raw.slug, "dirección", true, 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
    fail("La dirección solo admite letras minúsculas, números y guiones.");
  p.alt = text(raw.alt, "descripción de imagen", true, 300);
  if (kind === "product") {
    if (!categories.some((c) => c.slug === raw.category))
      fail("Categoría inválida");
    p.category = raw.category;
    for (const k of ["titulo", "tag", "descripcion"])
      p[k] = text(raw[k], k, true);
    p.spec = text(raw.spec, "resumen");
    p.img = asset(raw.img);
    p.detalle = "/sistemas/" + p.slug + "/";
    p.garantia = text(raw.garantia, "garantía");
    p.caracteristicas = lines(raw.caracteristicas || [], "características");
    p.especificaciones = {};
    if (
      !raw.especificaciones ||
      typeof raw.especificaciones !== "object" ||
      Array.isArray(raw.especificaciones)
    )
      raw.especificaciones = {};
    for (const [k, v] of Object.entries(raw.especificaciones)) {
      if (Object.keys(p.especificaciones).length >= 40)
        fail("Máximo 40 especificaciones");
      Object.defineProperty(
        p.especificaciones,
        text(k, "especificación", true, 100),
        { value: text(v, "valor", true, 500), enumerable: true },
      );
    }
    if (
      !Array.isArray(raw.documentos || []) ||
      (raw.documentos || []).length > 10
    )
      fail("Máximo 10 documentos");
    p.documentos = (raw.documentos || []).map((d) => ({
      titulo: text(d.titulo, "título del documento", true, 150),
      url: asset(d.url, true),
    }));
  } else if (kind === "project") {
    p.ciudad = text(raw.ciudad, "nombre del proyecto", true, 180);
    if (
      !["Residencial", "Comercial", "Industrial", "Agrícola"].includes(
        raw.categoria,
      )
    )
      fail("Categoría inválida");
    p.categoria = raw.categoria;
    p.kwp = text(String(raw.kwp), "potencia", true, 30);
    if (!Number.isFinite(+p.kwp) || +p.kwp <= 0)
      fail("La potencia debe ser mayor que cero");
    p.paneles = Number(raw.paneles);
    if (!Number.isInteger(p.paneles) || p.paneles < 1 || p.paneles > 1000000)
      fail("Revise la cantidad de paneles");
    p.anio = text(String(raw.anio), "año", true, 4);
    if (!/^20\d{2}$/.test(p.anio)) fail("Revise el año");
    p.images = lines(raw.images || [], "fotografías").map((x) => asset(x));
    if (!p.images.length) fail("Agregue al menos una foto");
    for (const k of ["necesidad", "resultados"]) p[k] = text(raw[k], k);
    p.equipos = lines(raw.equipos || [], "equipos");
    if (!Array.isArray(raw.proceso || []) || (raw.proceso || []).length > 20)
      fail("Revise el proceso");
    p.proceso = (raw.proceso || []).map((s) => ({
      titulo: text(s.titulo, "etapa", true, 150),
      descripcion: text(s.descripcion, "descripción de etapa", true, 3000),
    }));
  } else fail("Tipo inválido");
  return p;
}
let lock = Promise.resolve();
async function mutate(body) {
  const work = async () => {
    const all = await records(),
      old = all.find((r) => r.id === body.id);
    if (old && old.revision !== body.revision)
      fail(
        "Otra persona actualizó este contenido. Recargue antes de guardar.",
        409,
      );
    if (!old && (body.id || body.revision !== 0)) fail("Contenido no encontrado", 404);
    const draft = validate(body.kind, body.draft);
    const id = body.kind + ":" + draft.slug;
    if (old && old.id !== id)
      fail("La dirección de un registro existente no se puede cambiar.");
    if (!old && all.some((r) => r.id === id))
      fail("Esa dirección ya existe", 409);
    if (!["save", "publish", "archive"].includes(body.action))
      fail("Acción inválida");
    const record = {
      id,
      kind: body.kind,
      slug: draft.slug,
      draft,
      published:
        body.action === "publish"
          ? structuredClone(draft)
          : body.action === "archive"
            ? null
            : old?.published || null,
      revision: (old?.revision || 0) + 1,
      updated_at: new Date().toISOString(),
    };
    if (local()) {
      fs.mkdirSync(dir(), { recursive: true });
      const f = path.join(dir(), "content.json");
      const overrides = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : [];
      const out = overrides.filter((r) => r.id !== id).concat(record);
      if (fs.existsSync(f)) {
        fs.mkdirSync(path.join(dir(), "backups"), { recursive: true });
        fs.copyFileSync(
          f,
          path.join(
            dir(),
            "backups",
            Date.now() + "-" + crypto.randomUUID() + ".json",
          ),
        );
      }
      fs.writeFileSync(f + ".tmp", JSON.stringify(out, null, 2));
      fs.renameSync(f + ".tmp", f);
    } else if (old?.revision) {
      const result = await remote(
        "/rest/v1/cms_entries?id=eq." +
          encodeURIComponent(id) +
          "&revision=eq." +
          old.revision,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(record),
        },
      );
      if (!result.length)
        fail("El contenido cambió. Recargue antes de guardar.", 409);
    } else {
      await remote("/rest/v1/cms_entries", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(record),
      });
    }
    return record;
  };
  if (!local()) return work();
  const next = lock.then(work);
  lock = next.catch(() => {});
  return next;
}
module.exports = {
  ROOT,
  local,
  dir,
  categories,
  seeds,
  records,
  mutate,
  validate,
  asset,
  remote,
  fail,
};
