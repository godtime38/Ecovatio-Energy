"use strict";
const $ = (s) => document.querySelector(s),
  E = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
let records = [],
  categories = [],
  kind = "product",
  editing = null,
  media = [],
  documents = [],
  local = false,
  dirty = false,
  busy = false;
async function api(action, body) {
  const response = await fetch("/api/admin?action=" + action, {
    method: body ? "POST" : "GET",
    headers: body
      ? { "Content-Type": "application/json", "X-Admin-Request": "1" }
      : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "No se pudo completar la operación.");
  return data;
}
function notice(text, success = false) {
  $("#editor-status").textContent = text;
  $("#editor-status").classList.toggle("success", success);
}
async function boot() {
  try {
    const state = await api("status");
    local = state.local;
    $("#login").hidden = !!state.user;
    $("#app").hidden = !state.user;
    $("#credentials").hidden = local;
    $("#credentials")
      .querySelectorAll("input")
      .forEach((i) => (i.required = !local));
    $("#local-explanation").hidden = !local;
    $("#login-button").textContent = local
      ? "Entrar al entorno local →"
      : "Entrar al panel →";
    $("#login-button").disabled = !state.configured;
    $("#login-status").textContent = state.configured
      ? ""
      : "Falta conectar Supabase. Consulta la guía de configuración del panel.";
    if (state.user) {
      $("#user-label").textContent = state.user;
      $("#environment").textContent = local
        ? "Guardado en este equipo"
        : "Conectado a Supabase";
      await refresh();
    }
  } catch (e) {
    $("#login").hidden = false;
    $("#login-status").textContent =
      "El panel necesita su servidor. Inícialo con npm run admin o configura Vercel.";
  }
}
async function refresh() {
  const data = await api("list");
  records = data.records;
  categories = data.categories;
  render();
}
function pending(r) {
  return (
    !r.published || JSON.stringify(r.draft) !== JSON.stringify(r.published)
  );
}
function render() {
  const items = records.filter((r) => r.kind === kind),
    q = $("#search").value.toLowerCase(),
    filter = $("#status-filter").value;
  $("#page-title").textContent =
    kind === "product" ? "Productos" : "Obras y proyectos";
  $("#page-description").textContent =
    kind === "product"
      ? "Toda la información que tus clientes necesitan para elegir."
      : "Cuenta la historia de cada instalación, desde el inicio hasta el resultado.";
  $("#new-item").textContent =
    kind === "product" ? "+ Nuevo producto" : "+ Nuevo proyecto";
  $("#total").textContent = items.length;
  $("#published").textContent = items.filter((r) => r.published).length;
  $("#drafts").textContent = items.filter(pending).length;
  const filtered = items.filter(
    (r) =>
      JSON.stringify([r.draft.titulo, r.draft.tag, r.draft.ciudad])
        .toLowerCase()
        .includes(q) &&
      (filter === "all" ||
        (filter === "published" && r.published) ||
        (filter === "draft" && pending(r))),
  );
  $("#list").innerHTML = filtered.length
    ? filtered
        .map((r) => {
          const p = r.draft;
          return `<article class="content-row"><img src="${E(p.img || p.images?.[0])}" alt=""><div><h3>${E(p.titulo || p.ciudad)}</h3><p>${E(p.tag || p.categoria)}${p.anio ? " · " + E(p.anio) : ""}</p></div><span class="badge ${pending(r) ? "draft" : ""}">${!r.published ? "Borrador" : pending(r) ? "Cambios pendientes" : "Publicado"}</span><button data-edit="${E(r.id)}">Editar ↗</button></article>`;
        })
        .join("")
    : '<div class="empty"><h3>No hay resultados</h3><p>Cambia los filtros o crea un nuevo registro.</p></div>';
  $("#list")
    .querySelectorAll("[data-edit]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          openEditor(records.find((r) => r.id === b.dataset.edit))),
    );
}
function field(
  label,
  key,
  value = "",
  type = "text",
  required = false,
  wide = false,
) {
  return `<label class="${wide ? "wide" : ""}">${label}${required ? " *" : ""}<${type === "textarea" ? "textarea" : "input"} name="${key}" ${type === "textarea" ? 'rows="3"' : `type="${type}" value="${E(value)}"`} ${required ? "required" : ""}>${type === "textarea" ? E(value) + "</textarea>" : ""}</label>`;
}
function select(label, key, value, options) {
  return `<label>${label} *<select name="${key}" required>${options.map(([v, t]) => `<option value="${E(v)}" ${v === value ? "selected" : ""}>${E(t)}</option>`).join("")}</select></label>`;
}
function section(title, description = "") {
  return `<div class="wide field-section"><h3>${title}</h3>${description ? "<p>" + description + "</p>" : ""}</div>`;
}
function openEditor(record) {
  editing = record ? structuredClone(record) : null;
  const p = record?.draft || {};
  media = kind === "product" ? (p.img ? [p.img] : []) : [...(p.images || [])];
  documents = structuredClone(p.documentos || []);
  dirty = false;
  $("#editor-kind").textContent =
    kind === "product" ? "PRODUCTO" : "OBRA / PROYECTO";
  $("#editor-title").textContent = record
    ? p.titulo || p.ciudad
    : kind === "product"
      ? "Nuevo producto"
      : "Nuevo proyecto";
  let fields = section(
    "01 · Información principal",
    "Los campos marcados con * son obligatorios.",
  );
  if (kind === "product") {
    fields +=
      field("Nombre del producto", "titulo", p.titulo, "text", true) +
      field("Marca / modelo o referencia", "tag", p.tag, "text", true) +
      select(
        "Categoría",
        "category",
        p.category || "paneles",
        categories.map((c) => [c.slug, c.nombre]),
      ) +
      field("Resumen corto", "spec", p.spec) +
      field(
        "Descripción",
        "descripcion",
        p.descripcion,
        "textarea",
        true,
        true,
      );
  } else {
    fields +=
      field(
        "Nombre / ubicación del proyecto",
        "ciudad",
        p.ciudad,
        "text",
        true,
      ) +
      select(
        "Tipo de instalación",
        "categoria",
        p.categoria || "Residencial",
        ["Residencial", "Comercial", "Industrial", "Agrícola"].map((c) => [
          c,
          c,
        ]),
      ) +
      field("Potencia instalada (kWp)", "kwp", p.kwp, "number", true) +
      field("Cantidad de paneles", "paneles", p.paneles, "number", true) +
      field(
        "Año de instalación",
        "anio",
        p.anio || new Date().getFullYear(),
        "number",
        true,
      );
  }
  fields +=
    field(
      "Dirección de la ficha (se genera al escribir el nombre)",
      "slug",
      p.slug,
      "text",
      true,
    ) +
    section(
      "02 · Imágenes",
      kind === "project"
        ? "La primera foto será la portada. Puedes cambiar el orden y agregar hasta 40 imágenes."
        : "Agrega una imagen clara del producto. Las fotos se optimizan a WebP antes de subir.",
    ) +
    `<div class="wide"><div id="image-list" class="image-list"></div><label class="upload-label">${kind === "project" ? "Agregar fotografías" : "Elegir imagen"}<input id="upload-images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" ${kind === "project" ? "multiple" : ""}></label></div>` +
    field(
      "Descripción de las imágenes para accesibilidad",
      "alt",
      p.alt,
      "text",
      true,
      true,
    );
  if (kind === "product") {
    fields +=
      section(
        "03 · Ficha técnica",
        "Agrega únicamente información confirmada por el fabricante.",
      ) +
      field(
        "Características (una por línea)",
        "caracteristicas",
        (p.caracteristicas || []).join("\n"),
        "textarea",
        false,
        true,
      ) +
      `<div class="wide"><label>Especificaciones</label><div id="spec-rows"></div><button type="button" id="add-spec">+ Agregar dato técnico</button></div>` +
      field(
        "Condiciones de garantía",
        "garantia",
        p.garantia,
        "textarea",
        false,
        true,
      ) +
      section(
        "04 · Documentación",
        "Puedes adjuntar fichas técnicas o garantías en PDF de hasta 2 MB.",
      ) +
      `<div class="wide"><div id="documents"></div><label class="upload-label">Agregar PDF<input id="upload-doc" type="file" accept="application/pdf"></label></div>`;
  } else {
    fields +=
      section("03 · La historia del proyecto") +
      field(
        "Necesidad del cliente",
        "necesidad",
        p.necesidad,
        "textarea",
        false,
        true,
      ) +
      field(
        "Equipos instalados (uno por línea)",
        "equipos",
        (p.equipos || []).join("\n"),
        "textarea",
        false,
        true,
      ) +
      field(
        "Resultados documentados",
        "resultados",
        p.resultados,
        "textarea",
        false,
        true,
      ) +
      section(
        "04 · Proceso de instalación",
        "Describe las etapas de esta obra. Si lo dejas vacío se mostrará el proceso habitual, identificado como tal.",
      ) +
      `<div class="wide"><div id="step-rows"></div><button type="button" id="add-step">+ Agregar etapa</button></div>`;
  }
  $("#fields").innerHTML = fields;
  const slug = $("[name=slug]");
  slug.readOnly = !!record;
  slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
  if (!record) {
    const name = $("[name=" + (kind === "product" ? "titulo" : "ciudad") + "]");
    name.addEventListener("input", () => {
      if (!slug.dataset.manual)
        slug.value = name.value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
    });
    slug.oninput = () => (slug.dataset.manual = "1");
  }
  if (kind === "project") {
    $("[name=kwp]").step = "any";
    $("[name=kwp]").min = ".01";
    $("[name=paneles]").min = "1";
    $("[name=anio]").min = "2000";
    $("[name=anio]").max = "2099";
    $("#add-step").onclick = () => {
      addRow("step");
      dirty = true;
    };
    (p.proceso || []).forEach((s) => addRow("step", s.titulo, s.descripcion));
  } else {
    $("#add-spec").onclick = () => {
      addRow("spec");
      dirty = true;
    };
    Object.entries(p.especificaciones || {}).forEach(([k, v]) =>
      addRow("spec", k, v),
    );
    $("#upload-doc").onchange = uploadDocument;
    renderDocuments();
  }
  $("#upload-images").onchange = uploadImages;
  $("#archive").hidden = !record?.published;
  notice("");
  renderImages();
  $("#editor").showModal();
}
function addRow(type, a = "", b = "") {
  const row = document.createElement("div");
  row.className = "repeat-row";
  row.innerHTML =
    field(type === "spec" ? "Dato" : "Etapa", "row-key", a, "text", true) +
    field(
      type === "spec" ? "Valor" : "Descripción",
      "row-value",
      b,
      type === "spec" ? "text" : "textarea",
      true,
    ) +
    '<button type="button" aria-label="Eliminar fila">Quitar</button>';
  row.querySelector("button").onclick = () => {
    row.remove();
    dirty = true;
  };
  $("#" + type + "-rows").append(row);
}
function renderImages() {
  $("#image-list").innerHTML = media
    .map(
      (src, i) =>
        `<div class="image-item"><img src="${E(src)}" alt="Imagen ${i + 1}"><small>${i === 0 ? "Portada" : "Foto " + (i + 1)}</small><button type="button" data-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="Mover foto ${i + 1} antes">← Mover</button><button type="button" data-remove="${i}" aria-label="Quitar foto ${i + 1}">Quitar</button></div>`,
    )
    .join("");
  $("#image-list")
    .querySelectorAll("[data-up]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          let i = +b.dataset.up;
          [media[i - 1], media[i]] = [media[i], media[i - 1]];
          dirty = true;
          renderImages();
        }),
    );
  $("#image-list")
    .querySelectorAll("[data-remove]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          media.splice(+b.dataset.remove, 1);
          dirty = true;
          renderImages();
        }),
    );
}
function renderDocuments() {
  $("#documents").innerHTML = documents
    .map(
      (d, i) =>
        `<div class="repeat-row"><label>Título del documento<input data-doc="${i}" value="${E(d.titulo)}" required></label><a href="${E(d.url)}" target="_blank" rel="noopener">Ver PDF ↗</a><button type="button" data-delete-doc="${i}">Quitar</button></div>`,
    )
    .join("");
  $("#documents")
    .querySelectorAll("[data-doc]")
    .forEach(
      (i) =>
        (i.oninput = () => {
          documents[+i.dataset.doc].titulo = i.value;
          dirty = true;
        }),
    );
  $("#documents")
    .querySelectorAll("[data-delete-doc]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          documents.splice(+b.dataset.deleteDoc, 1);
          dirty = true;
          renderDocuments();
        }),
    );
}
function setBusy(value) {
  busy = value;
  $("#edit-form")
    .querySelectorAll("button,input[type=file]")
    .forEach((b) => (b.disabled = value));
  if (!value) renderImages();
}
async function encoded(file, image) {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("La imagen original debe pesar menos de 20 MB.");
  let blob = file;
  if (image) {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 60000000) {
      bitmap.close();
      throw new Error("La imagen es demasiado grande. Reduce sus dimensiones.");
    }
    const factor = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * factor);
    canvas.height = Math.round(bitmap.height * factor);
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
  }
  if (!blob || blob.size > 2000000)
    throw new Error(
      "El archivo debe pesar menos de 2 MB después de optimizar.",
    );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}
async function uploadImages(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  if (kind === "project" && media.length + files.length > 40)
    return notice("Máximo 40 fotografías.");
  setBusy(true);
  notice("Optimizando y subiendo imágenes…");
  try {
    for (const file of files) {
      const result = await api("upload", { data: await encoded(file, true) });
      if (kind === "product") media = [result.url];
      else media.push(result.url);
      dirty = true;
    }
    renderImages();
    notice(
      "Imágenes listas. Guarda el borrador para conservar la ficha.",
      true,
    );
  } catch (e) {
    notice(e.message);
    renderImages();
  } finally {
    event.target.value = "";
    setBusy(false);
  }
}
async function uploadDocument(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (documents.length >= 10) return notice("Máximo 10 documentos.");
  setBusy(true);
  try {
    const result = await api("upload", { data: await encoded(file, false) });
    documents.push({
      titulo: file.name.replace(/\.pdf$/i, ""),
      url: result.url,
    });
    dirty = true;
    renderDocuments();
    notice("Documento cargado.", true);
  } catch (e) {
    notice(e.message);
  } finally {
    event.target.value = "";
    setBusy(false);
  }
}
function collect() {
  const fd = new FormData($("#edit-form")),
    p = Object.fromEntries(fd);
  delete p["row-key"];
  delete p["row-value"];
  p.alt = fd.get("alt");
  const rows = (selector) =>
    Array.from(document.querySelectorAll(selector + " .repeat-row")).map(
      (row) => [
        row.querySelector("[name=row-key]").value,
        row.querySelector("[name=row-value]").value,
      ],
    );
  if (kind === "product") {
    p.img = media[0] || "";
    p.caracteristicas = p.caracteristicas
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const specifications = rows("#spec-rows").map(([key, value]) => [key.trim(), value]);
    if (new Set(specifications.map(([key]) => key)).size !== specifications.length)
      throw new Error("Hay datos técnicos con el mismo nombre. Revísalos antes de guardar.");
    p.especificaciones = Object.fromEntries(specifications);
    p.documentos = documents;
  } else {
    p.images = media;
    p.equipos = p.equipos
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    p.proceso = rows("#step-rows").map(([titulo, descripcion]) => ({
      titulo,
      descripcion,
    }));
  }
  return p;
}
async function save(action, preview = false) {
  if (busy || !$("#edit-form").reportValidity()) return;
  if (!media.length) return notice("Agrega una imagen antes de guardar.");
  if (
    action === "archive" &&
    !confirm("¿Retirar esta ficha de la web? Se conservará como borrador.")
  )
    return;
  setBusy(true);
  notice("Guardando…");
  try {
    const record = await api("save", {
      id: editing?.id,
      kind,
      revision: editing?.revision || 0,
      action,
      draft: collect(),
    });
    editing = record;
    dirty = false;
    $("[name=slug]").readOnly = true;
    $("#archive").hidden = !record.published;
    await refresh();
    notice(
      action === "publish"
        ? local
          ? "Publicado en la web local."
          : "Publicado en la web."
        : action === "archive"
          ? "Retirado de la web."
          : "Borrador guardado.",
      true,
    );
    if (preview) {
      $("#preview-frame").src =
        "/api/site?mode=" +
        kind +
        "&slug=" +
        encodeURIComponent(record.slug) +
        "&preview=1";
      $("#preview-dialog").showModal();
    }
  } catch (e) {
    notice(e.message);
  } finally {
    setBusy(false);
  }
}
$("#login-form").onsubmit = async (e) => {
  e.preventDefault();
  $("#login-button").disabled = true;
  try {
    const fd = new FormData(e.target);
    await api(
      "login",
      local
        ? { local: true }
        : { email: fd.get("email"), password: fd.get("password") },
    );
    e.target.reset();
    await boot();
  } catch (error) {
    $("#login-status").textContent = error.message;
  } finally {
    $("#login-button").disabled = false;
  }
};
$("#logout").onclick = async () => {
  try {
    await api("logout", {});
    await boot();
  } catch (e) {
    $("#status").textContent = e.message;
  }
};
document.querySelectorAll("[data-kind]").forEach(
  (b) =>
    (b.onclick = () => {
      kind = b.dataset.kind;
      document
        .querySelectorAll("[data-kind]")
        .forEach((x) => x.classList.toggle("active", x === b));
      $("#search").value = "";
      $("#status-filter").value = "all";
      render();
    }),
);
$("#search").oninput = render;
$("#status-filter").onchange = render;
$("#new-item").onclick = () => openEditor(null);
$("#fields").oninput = () => (dirty = true);
$("#save-draft").onclick = () => save("save");
$("#preview").onclick = () => save("save", true);
$("#archive").onclick = () => save("archive");
$("#edit-form").onsubmit = (e) => {
  e.preventDefault();
  save("publish");
};
function closeEditor() {
  if (busy) return;
  if (!dirty || confirm("Hay cambios sin guardar. ¿Cerrar y descartarlos?")) {
    $("#editor").close();
    dirty = false;
  }
}
$("#close-editor").onclick = closeEditor;
$("#editor").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeEditor();
});
$("#close-preview").onclick = () => {
  $("#preview-dialog").close();
  $("#preview-frame").src = "about:blank";
};
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
boot();
