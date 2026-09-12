"""Build crawlable project cards and detail pages from the shared project catalog."""
from pathlib import Path
from html import escape as e
import json, re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT/'assets/data/proyectos.json').read_text(encoding='utf-8'))
projects = data['proyectos']
steps = [
    ('Evaluación del sitio', 'Revisamos el consumo y las condiciones del espacio para definir las necesidades de la instalación.'),
    ('Diseño y selección', 'Dimensionamos el sistema y seleccionamos los equipos según el consumo y las características del lugar.'),
    ('Montaje y conexiones', 'Organizamos la instalación de estructuras, paneles, cableado y protecciones de acuerdo con el diseño.'),
    ('Pruebas y puesta en marcha', 'Verificamos el funcionamiento y explicamos el uso y seguimiento del sistema.')
]

def image(path, alt, lazy=True, css=''):
    medium = str(Path(path).with_stem(Path(path).stem+'-medium'))
    # The card uses an existing derivative; full images remain in the detail gallery.
    src = medium if css == 'portfolio-image' and (ROOT/medium.lstrip('/')).exists() else path
    return f'<img class="{css}" src="{e(src)}" alt="{e(alt)}" width="1440" height="1080" loading="{"lazy" if lazy else "eager"}" decoding="async">'

cards = []
for p in projects:
    slug = p.get('slug') or Path(p['images'][0]).parent.name.lower()
    p['slug'] = slug
    images = [path for path in p['images'] if (ROOT/path.lstrip('/')).is_file()]
    for path in p['images']:
        if path not in images:
            print(f'Skipped unavailable photograph: {path}')
    if not images:
        raise ValueError(f'Project has no photographs: {slug}')
    city = p['ciudad']; power = str(p['kwp']).replace('.', ',')
    url = f'/proyectos/{slug}/'
    title = f'Proyecto solar en {city}'
    desc = f'Instalación {p["categoria"].lower()} de {power} kWp con {p["paneles"]} paneles solares en {city}.'
    cards.append(f'''<article class="portfolio-card" data-category="{e(p['categoria'])}">
      <a class="portfolio-cover" href="{url}" aria-label="Ver proyecto en {e(city)}">{image(images[0],p['alt'],css='portfolio-image')}<span class="portfolio-tag">{e(p['categoria'])}</span></a>
      <div class="portfolio-info"><div class="portfolio-heading"><h3>{e(city)}</h3><span>{e(p['anio'])}</span></div>
      <p class="portfolio-specs">{power} kWp instalados <span>·</span> {p['paneles']} paneles</p>
      <a class="portfolio-link" href="{url}">Explorar proyecto <span aria-hidden="true">↗</span><span class="sr-only"> en {e(city)}</span></a></div></article>''')
    gallery = ''.join(f'<a class="project-photo" href="{e(src)}" data-gallery-image aria-label="Ampliar foto {i+1} de {len(images)}">{image(src, p["alt"]+f" — foto {i+1}",lazy=i>0)}<span>Foto {i+1} / {len(images)} <span aria-hidden="true">↗</span></span></a>' for i,src in enumerate(images))
    process = p.get('proceso')
    process_items = [(x['titulo'],x['descripcion']) for x in process] if process else steps
    process_note = '' if process else '<p class="project-muted">Nuestro proceso habitual de instalación, desde la evaluación hasta la puesta en marcha.</p>'
    timeline = ''.join(f'<li><span class="project-step-number">{i+1:02}</span><div><h3>{e(a)}</h3><p>{e(b)}</p></div></li>' for i,(a,b) in enumerate(process_items))
    extra = ''
    for key, heading in [('necesidad','La necesidad del cliente'),('equipos','Equipos instalados'),('resultados','Resultados del proyecto')]:
        value=p.get(key)
        if value:
            content = '<ul>'+''.join('<li>'+e(str(x))+'</li>' for x in value)+'</ul>' if isinstance(value,list) else '<p>'+e(str(value))+'</p>'
            extra += f'<section class="project-story"><h2>{heading}</h2>{content}</section>'
    page = f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)} | Ecovatio Energy</title><meta name="description" content="{e(desc)}">
<link rel="canonical" href="https://www.ecovatioenergy.com{url}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="https://www.ecovatioenergy.com{url}"><meta property="og:image" content="https://www.ecovatioenergy.com{e(images[0])}">
<link rel="icon" href="/assets/img/favicon.png"><link rel="preload" as="font" type="font/woff2" href="/assets/fonts/montserrat-latin.woff2" crossorigin><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/projects.css">
<script src="/js/script.js" defer></script><script src="/js/projects.js" defer></script></head>
<body class="project-page"><a class="skip-link" href="#project-content">Saltar al contenido</a>
<header class="project-nav"><a href="/" aria-label="Ecovatio Energy, inicio"><img src="/assets/img/logo-small.webp" width="56" height="56" alt="Ecovatio Energy"></a><a href="/#proyectos">← Todos los proyectos</a><button class="theme-toggle" id="theme-toggle" aria-label="Cambiar tema">☾</button></header>
<main id="project-content" class="project-container"><nav class="project-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><a href="/#proyectos">Proyectos</a><span>/</span><span>{e(city)}</span></nav>
<div class="project-intro"><div><p class="eyebrow">{e(p['categoria'])} · {e(p['anio'])}</p><h1>{e(city)}</h1><p class="project-muted">{e(desc)}</p></div><a class="btn btn--primary" href="/?proyecto={quote(city)}#contacto">Quiero un proyecto similar</a></div>
<dl class="project-facts"><div><dt>Potencia instalada</dt><dd>{power} kWp</dd></div><div><dt>Paneles solares</dt><dd>{p['paneles']}</dd></div><div><dt>Tipo de proyecto</dt><dd>{e(p['categoria'])}</dd></div><div><dt>Año</dt><dd>{e(p['anio'])}</dd></div></dl>
<section class="project-gallery-section" aria-labelledby="gallery-title"><div class="project-section-heading"><h2 id="gallery-title">La instalación en imágenes</h2><span class="project-muted">{len(images)} {'fotografía' if len(images)==1 else 'fotografías'}</span></div><div class="project-gallery">{gallery}</div></section>
{extra}<section class="project-story"><p class="eyebrow">Cómo trabajamos</p><h2>{'El proceso de esta instalación' if process else 'De la evaluación a la energía solar'}</h2>{process_note}<ol class="project-steps">{timeline}</ol></section>
<section class="project-cta"><div><h2>Su proyecto comienza aquí.</h2><p>Cuéntenos sobre su consumo y el espacio disponible.</p></div><a class="btn btn--primary" href="/?proyecto={quote(city)}#contacto">Quiero un proyecto similar →</a></section>
<a class="project-return" href="/#proyectos">← Seguir explorando proyectos</a></main>
<footer class="project-footer">Ecovatio Energy · República Dominicana <a href="/pages/privacidad.html">Privacidad</a></footer>
<dialog class="project-lightbox" aria-label="Fotografías del proyecto"><button class="lightbox-close" type="button" aria-label="Cerrar galería">✕</button><img alt=""><div class="lightbox-controls"><button type="button" data-photo-prev aria-label="Foto anterior">←</button><span aria-live="polite" data-photo-count></span><button type="button" data-photo-next aria-label="Foto siguiente">→</button></div></dialog>
</body></html>'''
    destination=ROOT/'proyectos'/slug/'index.html';destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(page,encoding='utf-8')

categories = ['Todos'] + list(dict.fromkeys(p['categoria'] for p in projects))
filters=''.join(f'<button type="button" class="portfolio-filter" data-project-filter="{e(c)}" aria-pressed="{str(i==0).lower()}">{e(c)}</button>' for i,c in enumerate(categories))
section=f'''<section id="proyectos" class="section"><div class="wrap">
<div class="eyebrow">Proyectos Ecovatio</div><h2 class="section-title">Instalaciones reales.<br>Energía que transforma.</h2>
<p class="portfolio-lead">Explore nuestros proyectos y encuentre una solución para su hogar o negocio.</p>
<div class="portfolio-filters" aria-label="Filtrar proyectos" hidden>{filters}</div>
<div class="portfolio-grid">{''.join(cards)}</div><p class="portfolio-count" aria-live="polite">{len(projects)} proyectos</p></div></section>'''
path=ROOT/'index.html';s=path.read_text(encoding='utf-8');s=re.sub(r'<section id="proyectos".*?</section>',lambda _:section,s,count=1,flags=re.S)
if '/css/projects.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/css/projects.css">\n<script src="/js/projects.js" defer></script>\n</head>')
path.write_text(s,encoding='utf-8')
path=ROOT/'sitemap.xml';s=path.read_text(encoding='utf-8');s=re.sub(r'\s*<url><loc>https://www.ecovatioenergy.com/proyectos/.*?</url>','',s)
s=s.replace('</urlset>',''.join(f'  <url><loc>https://www.ecovatioenergy.com/proyectos/{p["slug"]}/</loc></url>\n' for p in projects)+'</urlset>');path.write_text(s,encoding='utf-8')
print(f'Generated {len(projects)} project pages and gallery cards.')
