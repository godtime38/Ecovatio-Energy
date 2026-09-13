const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "ecovatio-admin-test-"));
process.env.CMS_LOCAL = "1";
process.env.CMS_LOCAL_DIR = isolated;
delete process.env.VERCEL;
const cms = require("../server/content.cjs"),
  render = require("../server/render.cjs"),
  auth = require("../server/auth.cjs");
const product = {
  slug: "prueba-panel",
  category: "paneles",
  titulo: "Panel <script>alert(1)</script>",
  tag: "Modelo X",
  descripcion: "Descripción confirmada",
  spec: "600 W",
  img: "/assets/img/paneles/jinko-panel-sin-fondo.webp",
  alt: "Panel de prueba",
  caracteristicas: ["Alta eficiencia"],
  especificaciones: { Potencia: "600 W" },
  documentos: [],
};
test.after(() => fs.rmSync(isolated, { recursive: true, force: true }));
test("borrador, publicación, cambios privados, conflicto y retirada", async () => {
  let r = await cms.mutate({
    kind: "product",
    revision: 0,
    action: "save",
    draft: product,
  });
  assert.equal(r.published, null);
  assert(!render.home(await cms.records()).includes("/sistemas/prueba-panel/"));
  r = await cms.mutate({
    id: r.id,
    kind: "product",
    revision: r.revision,
    action: "publish",
    draft: product,
  });
  assert(render.home(await cms.records()).includes("/sistemas/prueba-panel/"));
  const v = r.revision;
  r = await cms.mutate({
    id: r.id,
    kind: "product",
    revision: v,
    action: "save",
    draft: { ...product, titulo: "Nuevo nombre privado" },
  });
  assert.equal(r.published.titulo, product.titulo);
  assert.equal(r.draft.titulo, "Nuevo nombre privado");
  await assert.rejects(
    () =>
      cms.mutate({
        id: r.id,
        kind: "product",
        revision: v,
        action: "publish",
        draft: product,
      }),
    { status: 409 },
  );
  r = await cms.mutate({
    id: r.id,
    kind: "product",
    revision: r.revision,
    action: "archive",
    draft: r.draft,
  });
  assert.equal(r.published, null);
  assert(!render.home(await cms.records()).includes("/sistemas/prueba-panel/"));
  assert(fs.readdirSync(path.join(isolated, "backups")).length >= 3);
});
test("validación de rutas, XSS y datos de instalación", () => {
  for (const slug of ["../escape", "x/y", "X", "a?b"])
    assert.throws(() => cms.validate("product", { ...product, slug }));
  assert.throws(() =>
    cms.validate("product", { ...product, img: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    cms.validate("product", { ...product, img: "/assets/../../.env" }),
  );
  assert.throws(() =>
    cms.validate("project", {
      slug: "obra",
      ciudad: "Obra",
      categoria: "Residencial",
      kwp: "0",
      paneles: 2,
      anio: "2026",
      images: [],
      alt: "Obra",
    }),
  );
  const html = render.page("product", product);
  assert(!html.includes("<script>alert(1)</script>"));
  assert(html.includes("&lt;script&gt;"));
  assert(render.page("product", product, true).includes("noindex,nofollow"));
});
test("control de sesión y protección de origen", async () => {
  await assert.rejects(() => auth.user({ headers: {} }), { status: 401 });
  assert.throws(
    () =>
      auth.origin({
        headers: {
          host: "127.0.0.1:8766",
          origin: "https://evil.example",
          "x-admin-request": "1",
        },
      }),
    { status: 403 },
  );
  assert.throws(
    () =>
      auth.origin({
        headers: { host: "127.0.0.1:8766", origin: "http://127.0.0.1:8766" },
      }),
    { status: 403 },
  );
  auth.origin({
    headers: {
      host: "127.0.0.1:8766",
      origin: "http://127.0.0.1:8766",
      "x-admin-request": "1",
    },
  });
  let cookie;
  const res = { setHeader: (name, val) => (cookie = val) };
  await auth.login({}, res, { local: true });
  const req = { headers: { cookie: cookie.split(";")[0] } };
  assert.equal(await auth.user(req), "Administrador local");
  auth.logout(req, res);
  await assert.rejects(() => auth.user(req), { status: 401 });
  process.env.VERCEL = "1";
  assert.equal(cms.local(), false);
  delete process.env.VERCEL;
});
test("rechaza HTML y ficheros demasiado grandes", async () => {
  await assert.rejects(() =>
    auth.upload({
      data: Buffer.from("<html><script>alert(1)</script></html>").toString(
        "base64",
      ),
    }),
  );
  await assert.rejects(() => auth.upload({ data: "a".repeat(2800001) }));
});

test("recorrido HTTP: acceso, obra, archivos, vista previa, sitio y retirada", async () => {
  const { spawn } = require("node:child_process");
  const port = 18766,
    base = "http://127.0.0.1:" + port;
  const child = spawn(
    process.execPath,
    [path.join(__dirname, "admin-dev.cjs")],
    {
      env: { ...process.env, PORT: String(port), CMS_LOCAL_DIR: isolated },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Servidor no inició")),
        10000,
      );
      child.stdout.once("data", () => {
        clearTimeout(timeout);
        resolve();
      });
      child.once("error", reject);
    });
    assert.equal((await fetch(base + "/api/admin?action=list")).status, 401);
    assert.equal(
      (await fetch(base + "/.cache/admin/content.json")).status,
      404,
    );
    assert.equal((await fetch(base + "/server/content.cjs")).status, 404);
    const call = (action, body, cookie = "") =>
      fetch(base + "/api/admin?action=" + action, {
        method: "POST",
        headers: {
          Origin: base,
          "X-Admin-Request": "1",
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(body),
      });
    const login = await call("login", { local: true }),
      cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal(login.status, 200);
    const bytes = fs.readFileSync(
      path.join(cms.ROOT, "assets/img/proyectos/punta-cana/1.webp"),
    );
    const uploaded = await call(
      "upload",
      { data: bytes.toString("base64") },
      cookie,
    );
    assert.equal(uploaded.status, 200);
    const { url } = await uploaded.json();
    assert.equal(
      (await fetch(base + url)).headers.get("content-type"),
      "image/webp",
    );
    const draft = {
      slug: "obra-http",
      ciudad: "Obra de prueba HTTP",
      categoria: "Residencial",
      kwp: "5.6",
      paneles: 9,
      anio: "2026",
      images: [url],
      alt: "Instalación de prueba",
      proceso: [{ titulo: "Montaje", descripcion: "Etapa documentada" }],
      equipos: ["9 paneles"],
    };
    let response = await call(
      "save",
      { kind: "project", revision: 0, action: "save", draft },
      cookie,
    );
    assert.equal(response.status, 200);
    let record = await response.json();
    assert.equal((await fetch(base + "/proyectos/obra-http/")).status, 404);
    assert.equal(
      (await fetch(base + "/api/site?mode=project&slug=obra-http&preview=1"))
        .status,
      401,
    );
    const preview = await fetch(
      base + "/api/site?mode=project&slug=obra-http&preview=1",
      { headers: { Cookie: cookie } },
    );
    assert.equal(preview.status, 200);
    assert((await preview.text()).includes("Etapa documentada"));
    response = await call(
      "save",
      {
        id: record.id,
        kind: "project",
        revision: record.revision,
        action: "publish",
        draft,
      },
      cookie,
    );
    assert.equal(response.status, 200);
    record = await response.json();
    assert(
      (await (await fetch(base + "/")).text()).includes("Obra de prueba HTTP"),
    );
    assert.equal((await fetch(base + "/proyectos/obra-http/")).status, 200);
    assert(
      (await (await fetch(base + "/sitemap.xml")).text()).includes(
        "/proyectos/obra-http/",
      ),
    );
    response = await call(
      "save",
      {
        id: record.id,
        kind: "project",
        revision: record.revision,
        action: "archive",
        draft,
      },
      cookie,
    );
    assert.equal(response.status, 200);
    assert.equal((await fetch(base + "/proyectos/obra-http/")).status, 404);
  } finally {
    child.kill();
    await new Promise((resolve) => child.once("exit", resolve));
  }
});
