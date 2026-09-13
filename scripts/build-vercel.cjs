const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "public-dist");
fs.mkdirSync(out, { recursive: true });
function inventory(folder) {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? inventory(path.join(folder, e.name))
        : [
            "/" +
              path
                .relative(root, path.join(folder, e.name))
                .split(path.sep)
                .join("/"),
          ],
    );
}
fs.writeFileSync(
  path.join(root, "server", "asset-list.json"),
  JSON.stringify(inventory(path.join(root, "assets"))),
);
for (const name of ["assets", "css", "js", "pages", "proyectos", "sistemas"])
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true });
fs.mkdirSync(path.join(out, "admin"), { recursive: true });
for (const name of ["index.html", "admin.js", "admin.css"])
  fs.copyFileSync(
    path.join(root, "admin", name),
    path.join(out, "admin", name),
  );
for (const name of ["index.html", "robots.txt", "sitemap.xml"])
  fs.copyFileSync(path.join(root, name), path.join(out, name));
console.log(
  "Static output prepared. Private server files, credentials and drafts are excluded.",
);
