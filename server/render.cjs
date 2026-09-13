const fs = require("node:fs"),
  path = require("node:path");
const { ROOT, categories } = require("./content.cjs");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const bundledAssets = new Set(require("./asset-list.json"));
function cardImage(src) {
  const medium = src.replace(/(\.[^.]+)$/, "-medium$1");
  return bundledAssets.has(medium) ? medium : src;
}
const url = (kind, slug) =>
  `/${kind === "project" ? "proyectos" : "sistemas"}/${slug}/`;
function productCards(items) {
  return items
    .map(
      (p) =>
        `<article class="product-card" data-category="${esc(p.category)}"><a class="product-card__img" href="${url("product", p.slug)}"><img src="${esc(p.img)}" alt="${esc(p.alt)}" width="800" height="800" loading="lazy"></a><div class="product-card__body"><div class="product-card__tag">${esc(p.tag)}</div><h3 class="product-card__title">${esc(p.titulo)}</h3><p class="product-card__desc">${esc(p.descripcion)}</p><a class="product-card__link" href="${url("product", p.slug)}">Explorar producto →</a></div></article>`,
    )
    .join("");
}
function projectCards(items) {
  return items
    .map(
      (p) =>
        `<article class="portfolio-card" data-category="${esc(p.categoria)}"><a class="portfolio-cover" href="${url("project", p.slug)}" aria-label="Ver proyecto en ${esc(p.ciudad)}"><img class="portfolio-image" src="${esc(cardImage(p.images[0]))}" alt="${esc(p.alt)}" width="1440" height="1080" loading="lazy"><span class="portfolio-tag">${esc(p.categoria)}</span></a><div class="portfolio-info"><div class="portfolio-heading"><h3>${esc(p.ciudad)}</h3><span>${esc(p.anio)}</span></div><p class="portfolio-specs">${esc(p.kwp)} kWp instalados · ${esc(p.paneles)} paneles</p><a class="portfolio-link" href="${url("project", p.slug)}">Explorar proyecto ↗</a></div></article>`,
    )
    .join("");
}
function home(records) {
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const projects = records
      .filter((r) => r.kind === "project" && r.published)
      .map((r) => r.published),
    products = records
      .filter((r) => r.kind === "product" && r.published)
      .map((r) => r.published);
  let filters = ["Todos", ...new Set(projects.map((p) => p.categoria))]
    .map(
      (c, i) =>
        `<button type="button" class="portfolio-filter" data-project-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`,
    )
    .join("");
  html = html.replace(
    /<section id="proyectos".*?<\/section>/s,
    () =>
      `<section id="proyectos" class="section"><div class="wrap"><div class="eyebrow">Proyectos Ecovatio</div><h2 class="section-title">Instalaciones reales.<br>Energía que transforma.</h2><p class="portfolio-lead">Explore nuestros proyectos y encuentre una solución para su hogar o negocio.</p><div class="portfolio-filters" aria-label="Filtrar proyectos" hidden>${filters}</div><div class="portfolio-grid">${projectCards(projects)}</div><p class="portfolio-count" aria-live="polite">${projects.length} proyectos</p></div></section>`,
  );
  html = html.replace(
    /(<div class="product-grid" id="sistemas-grid">).*?(?=\s*<div class="product-pager")/s,
    (_, s) => s + productCards(products) + "</div>",
  );
  html = html.replace(
    /<a href="\/proyectos\/([^/]+)\/"[^>]*class="energy-map__pin">.*?<\/a>/gs,
    (a, slug) => (projects.some((p) => p.slug === slug) ? a : ""),
  );
  html = html.replace(
    /(<div class="stat__value">)\d+(<\/div>\s*<div class="stat__label">proyectos en nuestra galería)/,
    (_, a, b) => a + projects.length + b,
  );
  return html;
}
const guides = {
  paneles: [
    "Generación de energía solar",
    "Los paneles forman parte del sistema de generación. La selección se realiza junto con el inversor, la estructura y las protecciones.",
    [
      "Consumo eléctrico y espacio disponible",
      "Potencia y cantidad de módulos",
      "Compatibilidad con inversor y estructura",
    ],
  ],
  baterias: [
    "Almacenamiento y respaldo",
    "La batería almacena energía para utilizarla según la configuración del sistema. El respaldo requiere equipos compatibles y un dimensionamiento acorde con las cargas.",
    [
      "Equipos que desea respaldar",
      "Tiempo de autonomía requerido",
      "Compatibilidad con inversor y sistema de gestión",
    ],
  ],
  inversores: [
    "Conversión y gestión de energía",
    "El inversor se selecciona de acuerdo con los paneles, la red eléctrica y el tipo de sistema. Las funciones de respaldo y almacenamiento dependen del modelo.",
    [
      "Potencia del campo solar",
      "Tensión y fases de la instalación",
      "Necesidad de baterías y respaldo",
    ],
  ],
  estructuras: [
    "Soporte para la instalación solar",
    "La estructura se selecciona según la superficie, la distribución de paneles y las condiciones del sitio.",
    [
      "Tipo y estado de la superficie",
      "Distribución y orientación de módulos",
      "Condiciones de anclaje y cargas del proyecto",
    ],
  ],
};
function page(kind, p, preview = false, others = []) {
  const isProject = kind === "project",
    title = isProject ? p.ciudad : p.titulo,
    link = url(kind, p.slug),
    section = isProject ? "proyectos" : "sistemas",
    desc = isProject
      ? `Instalación ${p.categoria.toLowerCase()} de ${p.kwp} kWp con ${p.paneles} paneles solares en ${p.ciudad}.`
      : p.descripcion,
    photo = isProject ? p.images[0] : p.img,
    cta = `/?${isProject ? "proyecto" : "producto"}=${encodeURIComponent(title)}#contacto`;
  let content = "";
  if (isProject) {
    const steps = p.proceso?.length
      ? p.proceso
      : [
          {
            titulo: "Evaluación del sitio",
            descripcion: "Revisamos el consumo y las condiciones del espacio.",
          },
          {
            titulo: "Diseño y selección",
            descripcion:
              "Dimensionamos el sistema y seleccionamos los equipos.",
          },
          {
            titulo: "Montaje y conexiones",
            descripcion:
              "Organizamos la instalación de estructuras, paneles y protecciones.",
          },
          {
            titulo: "Pruebas y puesta en marcha",
            descripcion:
              "Verificamos el funcionamiento y explicamos el uso del sistema.",
          },
        ];
    content = `<div class="project-intro"><div><p class="eyebrow">${esc(p.categoria)} · ${esc(p.anio)}</p><h1>${esc(title)}</h1><p class="project-muted">${esc(desc)}</p></div><a class="btn btn--primary" href="${cta}">Quiero un proyecto similar</a></div><dl class="project-facts">${[
      ["Potencia instalada", p.kwp + " kWp"],
      ["Paneles solares", p.paneles],
      ["Tipo de proyecto", p.categoria],
      ["Año", p.anio],
    ]
      .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join(
        "",
      )}</dl><section class="project-gallery-section"><div class="project-section-heading"><h2>La instalación en imágenes</h2><span>${p.images.length} fotografías</span></div><div class="project-gallery">${p.images.map((src, i) => `<a class="project-photo" href="${esc(src)}" data-gallery-image aria-label="Ampliar foto ${i + 1}"><img src="${esc(src)}" alt="${esc(p.alt)} — foto ${i + 1}" width="1440" height="1080" loading="${i ? "lazy" : "eager"}"><span>Foto ${i + 1} / ${p.images.length} ↗</span></a>`).join("")}</div></section>${[
      ["necesidad", "La necesidad del cliente"],
      ["equipos", "Equipos instalados"],
      ["resultados", "Resultados del proyecto"],
    ]
      .map(([k, label]) =>
        p[k]?.length
          ? `<section class="project-story"><h2>${label}</h2>${Array.isArray(p[k]) ? "<ul>" + p[k].map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "<p>" + esc(p[k]) + "</p>"}</section>`
          : "",
      )
      .join(
        "",
      )}<section class="project-story"><p class="eyebrow">Cómo trabajamos</p><h2>${p.proceso?.length ? "El proceso de esta instalación" : "De la evaluación a la energía solar"}</h2>${p.proceso?.length ? "" : '<p class="project-muted">Nuestro proceso habitual de instalación.</p>'}<ol class="project-steps">${steps.map((s, i) => `<li><span class="project-step-number">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(s.titulo)}</h3><p>${esc(s.descripcion)}</p></div></li>`).join("")}</ol></section>`;
  } else {
    const cat = categories.find((c) => c.slug === p.category),
      [purpose, explanation, checks] = guides[p.category];
    content = `<section class="product-overview"><a class="product-detail-photo" href="${esc(photo)}"><img src="${esc(photo)}" alt="${esc(p.alt)}" width="800" height="800" fetchpriority="high"><span>Ampliar imagen ↗</span></a><div><p class="eyebrow">${esc(cat?.nombre)}</p><h1>${esc(title)}</h1><p class="product-model">${esc(p.tag)}</p><p class="product-summary">${esc(desc)}</p><a class="btn btn--primary" href="${cta}">Consultar este producto →</a><p class="product-help">Le ayudamos a elegir la configuración adecuada para su instalación.</p></div></section><nav class="product-detail-nav" aria-label="Información del producto"><a href="#caracteristicas">Características</a><a href="#aplicaciones">Aplicaciones</a><a href="#seleccion">Selección e instalación</a><a href="#garantia">Garantía y consulta</a></nav><section id="caracteristicas" class="product-detail-section"><h2>Características y datos</h2><ul class="product-feature-list">${(p.caracteristicas?.length ? p.caracteristicas : [p.descripcion]).map((x) => "<li>" + esc(x) + "</li>").join("")}</ul><dl class="product-spec-table">${Object.entries(
      p.especificaciones || {},
    )
      .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join(
        "",
      )}</dl></section><section id="aplicaciones" class="product-detail-section"><h2>${purpose}</h2><p>${explanation}</p><p>La solución final se define tras revisar las necesidades y condiciones de su proyecto.</p></section><section id="seleccion" class="product-detail-section"><h2>Una selección que encaje con su proyecto.</h2><div class="product-checks">${checks.map((x, i) => `<div><span>${String(i + 1).padStart(2, "0")}</span><h3>${x}</h3></div>`).join("")}</div><p>Comparta su consumo, los equipos que utiliza y la información de su instalación. Nuestro equipo revisará el dimensionamiento, la compatibilidad y el alcance de montaje en la propuesta.</p></section>${p.documentos?.length ? '<section class="product-detail-section"><h2>Documentación</h2><ul>' + p.documentos.map((d) => `<li><a href="${esc(d.url)}">${esc(d.titulo)}</a></li>`).join("") + "</ul></section>" : ""}<section id="garantia" class="product-detail-section"><h2>Garantía, disponibilidad y cotización</h2><p>${esc(p.garantia || "Solicite las condiciones de garantía y la ficha técnica del modelo seleccionado junto con su cotización.")}</p></section>`;
  }
  if (!isProject) {
    content +=
      '<section class="product-detail-section"><details><summary>¿Puedo incorporarlo a un sistema existente?</summary><p>La compatibilidad depende del modelo y de los equipos instalados. Indíquenos sus referencias para revisar su caso antes de seleccionar el producto.</p></details><details><summary>¿La cotización incluye instalación?</summary><p>Solicite que la propuesta detalle los equipos, materiales y trabajos incluidos, de acuerdo con las necesidades de su proyecto.</p></details></section>';
    const related = others
      .filter(
        (r) =>
          r.kind === "product" &&
          r.published?.category === p.category &&
          r.slug !== p.slug,
      )
      .map((r) => r.published);
    if (related.length)
      content +=
        '<section class="product-detail-section"><h2>Más opciones en ' +
        esc(categories.find((c) => c.slug === p.category)?.nombre) +
        '</h2><div class="product-related">' +
        related
          .map(
            (q) =>
              `<a href="${url("product", q.slug)}"><img src="${esc(q.img)}" alt="" width="160" height="160" loading="lazy"><span>${esc(q.titulo)}<small>${esc(q.tag)}</small></span><span aria-hidden="true">↗</span></a>`,
          )
          .join("") +
        "</div></section>";
  }
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Ecovatio Energy</title><meta name="description" content="${esc(desc)}">${preview ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="https://www.ecovatioenergy.com${link}">`}<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:image" content="${esc(photo.startsWith("/") ? "https://www.ecovatioenergy.com" + photo : photo)}"><meta property="og:url" content="https://www.ecovatioenergy.com${link}"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/projects.css"><link rel="stylesheet" href="/css/products.css"><script src="/js/script.js" defer></script><script src="/js/projects.js" defer></script></head><body><a class="skip-link" href="#detail-content">Saltar al contenido</a><header class="project-nav"><a href="/"><img src="/assets/img/logo-small.webp" width="56" height="56" alt="Ecovatio Energy"></a><a href="/#${section}">← Todos los ${section}</a><button class="theme-toggle" id="theme-toggle" aria-label="Cambiar tema">☾</button></header><main id="detail-content" class="project-container"><nav class="project-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><a href="/#${section}">${isProject ? "Proyectos" : "Sistemas"}</a><span>/</span><span>${esc(title)}</span></nav>${preview ? '<p class="project-reference">Vista previa del borrador · todavía no publicado</p>' : ""}${content}<section class="project-cta"><div><h2>Su proyecto comienza aquí.</h2><p>Conversemos sobre su consumo y su instalación.</p></div><a class="btn btn--primary" href="${cta}">Solicitar cotización →</a></section></main><footer class="project-footer">Ecovatio Energy · República Dominicana <a href="/pages/privacidad.html">Privacidad</a></footer>${isProject ? '<dialog class="project-lightbox" aria-label="Fotografías del proyecto"><button class="lightbox-close" type="button" aria-label="Cerrar galería">✕</button><img alt=""><div class="lightbox-controls"><button type="button" data-photo-prev aria-label="Foto anterior">←</button><span data-photo-count aria-live="polite"></span><button type="button" data-photo-next aria-label="Foto siguiente">→</button></div></dialog>' : ""}</body></html>`;
}
module.exports = { home, page, url, esc };
