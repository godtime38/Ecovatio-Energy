const crypto = require("node:crypto"),
  fs = require("node:fs"),
  path = require("node:path");
const { local, dir, fail, remote } = require("./content.cjs");
const sessions = new Map();
function cookie(req) {
  const value = (req.headers.cookie || "")
    .split(";")
    .find((x) => x.trim().startsWith("ec_admin="));
  return value ? value.trim().slice(9) : "";
}
function setCookie(res, token, age = 3600) {
  res.setHeader(
    "Set-Cookie",
    `ec_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${local() ? "" : "; Secure"}`,
  );
}
async function user(req) {
  const token = cookie(req);
  if (!token) fail("Inicie sesión para continuar.", 401);
  if (local()) {
    const s = sessions.get(token);
    if (!s || s < Date.now()) fail("La sesión terminó. Vuelva a entrar.", 401);
    return "Administrador local";
  }
  const r = await fetch(process.env.SUPABASE_URL + "/auth/v1/user", {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + token,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) fail("La sesión terminó. Vuelva a entrar.", 401);
  const u = await r.json();
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  if (!u.email || !allowed.includes(u.email.toLowerCase()))
    fail("Este usuario no tiene permiso para administrar.", 403);
  return u.email;
}
function origin(req) {
  const expected = local()
    ? `http://${req.headers.host}`
    : process.env.SITE_URL;
  if (
    !expected ||
    req.headers.origin !== expected ||
    req.headers["x-admin-request"] !== "1"
  )
    fail("Solicitud no autorizada.", 403);
}
async function login(req, res, body) {
  if (local()) {
    if (body.local !== true) fail("Use el acceso local.");
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + 3600000);
    setCookie(res, token);
    return { user: "Administrador local" };
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    fail("Falta conectar Supabase.", 503);
  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    body.password.length > 1000
  )
    fail("Introduzca correo y contraseña.");
  const r = await fetch(
    process.env.SUPABASE_URL + "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: body.email, password: body.password }),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!r.ok)
    fail(
      "No se pudo iniciar sesión. Revise sus credenciales o inténtelo más tarde.",
      401,
    );
  const data = await r.json();
  if (
    !(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .includes(data.user.email?.toLowerCase())
  )
    fail("Usuario sin permiso para administrar.", 403);
  setCookie(res, data.access_token, Math.min(data.expires_in || 3600, 3600));
  return { user: data.user.email };
}
function logout(req, res) {
  sessions.delete(cookie(req));
  setCookie(res, "", 0);
}
async function upload(body) {
  if (typeof body.data !== "string" || body.data.length > 2800000)
    fail("El archivo debe pesar menos de 2 MB.");
  const buf = Buffer.from(body.data, "base64");
  if (buf.length > 2000000 || buf.length < 12)
    fail("Archivo inválido o demasiado grande.");
  let ext, mime;
  if (
    buf.subarray(0, 4).toString() === "RIFF" &&
    buf.subarray(8, 12).toString() === "WEBP"
  ) {
    ext = "webp";
    mime = "image/webp";
  } else if (buf.subarray(0, 5).toString() === "%PDF-") {
    ext = "pdf";
    mime = "application/pdf";
  } else fail("Seleccione una imagen convertida a WebP o un documento PDF.");
  const name = crypto.randomUUID() + "." + ext;
  if (local()) {
    fs.mkdirSync(path.join(dir(), "uploads"), { recursive: true });
    fs.writeFileSync(path.join(dir(), "uploads", name), buf);
    return { url: "/assets/uploads/" + name };
  }
  const r = await fetch(
    process.env.SUPABASE_URL + "/storage/v1/object/ecovatio-media/" + name,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": mime,
        "Cache-Control": "max-age=31536000",
      },
      body: buf,
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!r.ok)
    fail("No se pudo subir el archivo. Compruebe el almacenamiento.", 503);
  return {
    url:
      process.env.SUPABASE_URL +
      "/storage/v1/object/public/ecovatio-media/" +
      name,
  };
}
module.exports = { user, origin, login, logout, upload };
