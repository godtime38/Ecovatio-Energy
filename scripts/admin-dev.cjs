// Local server for the admin and website. Never used as a production server.
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
process.env.CMS_LOCAL = "1";
const { ROOT, dir } = require("../server/content.cjs");
const admin = require("../api/admin.js"),
  site = require("../api/site.js");
const port = Number(process.env.PORT || 8766);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".xml": "application/xml",
};
const server = http.createServer(async (req, res) => {
  res.status = (c) => {
    res.statusCode = c;
    return res;
  };
  res.send = (b) => res.end(b);
  res.json = (b) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(b));
  };
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  if (
    req.headers.host !== `127.0.0.1:${port}` &&
    req.headers.host !== `localhost:${port}`
  )
    return res.status(403).end();
  try {
    let requestPath = decodeURIComponent(
      new URL(req.url, "http://local").pathname,
    );
    if (req.method === "POST") {
      let chunks = [],
        size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 3000000) {
          res.status(413).json({ error: "Archivo demasiado grande." });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      }
      req.body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    }
    if (requestPath === "/api/admin") return await admin(req, res);
    if (requestPath === "/api/site") return await site(req, res);
    if (requestPath === "/") {
      req.url = "/api/site?mode=home";
      return await site(req, res);
    }
    if (requestPath === "/assets/data/sistemas.json") {
      req.url = "/api/site?mode=catalog";
      return await site(req, res);
    }
    if (requestPath === "/sitemap.xml") {
      req.url = "/api/site?mode=sitemap";
      return await site(req, res);
    }
    const match = requestPath.match(
      /^\/(proyectos|sistemas)\/([a-z0-9-]+)\/?$/,
    );
    if (match) {
      req.url =
        "/api/site?mode=" +
        (match[1] === "proyectos" ? "project" : "product") +
        "&slug=" +
        match[2];
      return await site(req, res);
    }
    if (!["GET", "HEAD"].includes(req.method)) return res.status(405).end();
    if (requestPath === "/admin" || requestPath === "/admin/")
      requestPath = "/admin/index.html";
    if (
      !/^\/(admin|assets|css|js|pages)\//.test(requestPath) &&
      requestPath != "/robots.txt"
    )
      return res.status(404).end("No encontrado");
    let file = path.resolve(ROOT, "." + requestPath);
    if (requestPath.startsWith("/assets/uploads/"))
      file = path.resolve(
        dir(),
        "uploads",
        requestPath.slice("/assets/uploads/".length),
      );
    const allowed = requestPath.startsWith("/assets/uploads/")
      ? path.resolve(dir(), "uploads")
      : ROOT;
    if (
      !file.startsWith(allowed + path.sep) ||
      requestPath.split("/").some((p) => p.startsWith(".")) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    )
      return res.status(404).end("No encontrado");
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  } catch {
    if (!res.headersSent)
      res.status(400).json({ error: "Solicitud inválida." });
    else res.end();
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Panel local: http://127.0.0.1:${port}/admin/`),
);
