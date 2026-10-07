"""Generate service detail pages and connect the existing service cards."""
from pathlib import Path
from html import escape as e
from urllib.parse import urlencode
import json,re
ROOT=Path(__file__).resolve().parents[1]
services=json.loads((ROOT/'assets/data/servicios.json').read_text(encoding='utf8'))['servicios']
projects=json.loads((ROOT/'assets/data/proyectos.json').read_text(encoding='utf8'))['proyectos']
base='https://www.ecovatioenergy.com'
for s in services:
    url='/servicios/'+s['slug']+'/'
    cta='/?'+urlencode({'servicio':s['nombre'],'interes':s['interes']})+'#contacto'
    related=[p for p in projects if p['categoria']==s['categoria_proyectos']][:2] if s['categoria_proyectos'] else []
    photo=related[0]['images'][0] if related else projects[0]['images'][0]
    caption='Instalación de nuestra galería en '+(related[0]['ciudad'] if related else projects[0]['ciudad'])+'.'
    blocks=''.join(f'<article class="service-scope"><span>{i+1:02}</span><h3>{e(x)}</h3></article>' for i,x in enumerate(s['alcance']))
    related_html=''
    if related:
        cards=''.join(f'<a class="service-work" href="/proyectos/{p.get("slug") or Path(p["images"][0]).parent.name.lower()}/"><img src="{e(p["images"][0])}" alt="{e(p["alt"])}" loading="lazy" width="720" height="480"><div><span>{e(p["categoria"])}</span><h3>{e(p["ciudad"])}</h3><p>{e(str(p["kwp"]))} kWp · {p["paneles"]} paneles</p><strong>Explorar proyecto ↗</strong></div></a>' for p in related)
        related_html=f'<section class="service-section"><p class="eyebrow">Instalaciones reales</p><h2>Proyectos para conocer nuestro trabajo.</h2><div class="service-works">{cards}</div></section>'
    others=''.join(f'<a href="/servicios/{x["slug"]}/">{e(x["nombre"])} <span aria-hidden="true">↗</span></a>' for x in services if x is not s)
    steps=[('Cuéntenos su necesidad','Comparta la información indicada y el objetivo de su consulta.'),('Evaluamos el caso','Revisamos los datos y coordinamos una visita si es necesaria.'),('Definimos la propuesta','Detallamos equipos o trabajos, condiciones y alcance para su revisión.'),('Coordinamos el servicio','Tras aprobar la propuesta, acordamos la ejecución y los siguientes pasos.')]
    page=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(s['nombre'])} solar en República Dominicana | Ecovatio Energy</title><meta name="description" content="{e(s['descripcion'])}"><link rel="canonical" href="{base+url}"><meta property="og:type" content="website"><meta property="og:title" content="{e(s['nombre'])} | Ecovatio Energy"><meta property="og:description" content="{e(s['descripcion'])}"><meta property="og:url" content="{base+url}"><meta property="og:image" content="{base+photo}"><link rel="icon" href="/assets/img/favicon.png"><link rel="preload" as="font" type="font/woff2" href="/assets/fonts/montserrat-latin.woff2" crossorigin><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/projects.css"><link rel="stylesheet" href="/css/services.css"><script src="/js/script.js" defer></script></head><body><a class="skip-link" href="#servicio">Saltar al contenido</a><header class="project-nav"><a href="/" aria-label="Ecovatio Energy, inicio"><img src="/assets/img/logo-small.webp" alt="Ecovatio Energy" width="56" height="56"></a><a href="/#servicios">← Todos los servicios</a><button class="theme-toggle" id="theme-toggle" aria-label="Cambiar tema">☾</button></header>
<main id="servicio" class="project-container"><nav class="project-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><a href="/#servicios">Servicios</a><span>/</span><span>{e(s['nombre'])}</span></nav>
<section class="service-hero"><div><p class="eyebrow">{e(s['nombre'])} · República Dominicana</p><h1>{e(s['titulo'])}</h1><p class="service-lead">{e(s['descripcion'])}</p><a class="btn btn--primary" href="{e(cta)}">Solicitar asesoría <span aria-hidden="true">→</span></a><p class="service-note">Una propuesta según su instalación y sus necesidades.</p></div><figure><img src="{e(photo)}" alt="{e(caption)}" width="1440" height="1080" fetchpriority="high"><figcaption>{e(caption)}</figcaption></figure></section>
<nav class="service-tabs" aria-label="Contenido del servicio"><a href="#alcance">Qué evaluamos</a><a href="#proceso-servicio">Cómo trabajamos</a><a href="#preparar">Qué preparar</a><a href="#preguntas">Preguntas frecuentes</a></nav>
<section id="alcance" class="service-section"><div class="service-section-head"><div><p class="eyebrow">Una solución para usted</p><h2>¿Para quién es este servicio?</h2></div><p>{e(s['publico'])}</p></div><div class="service-scopes">{blocks}</div><p class="service-note">El alcance definitivo, los equipos y los trabajos incluidos se detallan en la cotización.</p></section>
<section id="proceso-servicio" class="service-section"><p class="eyebrow">Paso a paso</p><h2>De su consulta a una propuesta clara.</h2><ol class="project-steps">{''.join(f'<li><span class="project-step-number">{i+1:02}</span><div><h3>{e(title)}</h3><p>{e(desc)}</p></div></li>' for i,(title,desc) in enumerate(steps))}</ol></section>
<section id="preparar" class="service-preparation"><div><p class="eyebrow">Antes de conversar</p><h2>Información que nos ayuda a empezar.</h2><p>Con estos datos podremos orientar mejor su evaluación.</p></div><ul>{''.join('<li>'+e(x)+'</li>' for x in s['preparar'])}</ul></section>
{related_html}<section id="preguntas" class="service-section service-faq"><p class="eyebrow">Resolvemos sus dudas</p><h2>Preguntas sobre {e(s['nombre'].lower())}.</h2>{''.join('<details><summary>'+e(q['pregunta'])+'</summary><p>'+e(q['respuesta'])+'</p></details>' for q in s['preguntas'])}</section>
<section class="project-cta"><div><p class="eyebrow">Demos el próximo paso</p><h2>Conversemos sobre su caso.</h2><p>Su consulta llevará indicado el servicio que le interesa.</p></div><a class="btn btn--primary" href="{e(cta)}">Solicitar asesoría →</a></section><section class="service-section"><h2>Explore otros servicios.</h2><div class="service-more">{others}</div></section></main><footer class="project-footer">Ecovatio Energy · República Dominicana <a href="/pages/privacidad.html">Privacidad</a></footer></body></html>'''
    dest=ROOT/'servicios'/s['slug']/'index.html';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(page,encoding='utf8')
home=ROOT/'index.html';html=home.read_text(encoding='utf8')
start=html.index('<section id="servicios"');end=html.index('</section>',start)
section=html[start:end]
section=re.sub(r'\s*<a class="service-card__link".*?</a>','',section)
for s in services:
    pattern=r'(<h3 class="service-card__title">'+re.escape(s['nombre'])+r'</h3>\s*<div class="service-card__desc">.*?</div>)'
    section,n=re.subn(pattern,lambda m:m[1]+f'\n<a class="service-card__link" href="/servicios/{s["slug"]}/">Explorar servicio <span aria-hidden="true">↗</span><span class="sr-only">: {e(s["nombre"])}</span></a>',section,flags=re.S)
    assert n==1,s['nombre']
html=html[:start]+section+html[end:]
if '/css/services.css' not in html:html=html.replace('</head>','<link rel="stylesheet" href="/css/services.css">\n</head>')
html=html.replace('/js/projects.js?v=random-projects-1','/js/projects.js?v=service-contact-1')
home.write_text(html,encoding='utf8')
sitemap=ROOT/'sitemap.xml';xml=sitemap.read_text(encoding='utf8');xml=re.sub(r'\s*<url><loc>https://www.ecovatioenergy.com/servicios/.*?</url>','',xml)
xml=xml.replace('</urlset>',''.join(f'<url><loc>{base}/servicios/{s["slug"]}/</loc></url>\n' for s in services)+'</urlset>');sitemap.write_text(xml,encoding='utf8')
print(f'Generated {len(services)} service pages, card links and sitemap entries.')
