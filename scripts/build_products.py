"""Generate product detail pages and static cards from sistemas.json."""
from pathlib import Path
from html import escape as e
from urllib.parse import quote, urlsplit
import json, re, unicodedata
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'assets/data/sistemas.json'
data=json.loads(source.read_text(encoding='utf-8'))
guides={
 'paneles':('Generación de energía solar','Los paneles forman parte del sistema de generación. La selección se realiza junto con el inversor, la estructura y las protecciones.', ['Consumo eléctrico y espacio disponible','Potencia y cantidad de módulos','Compatibilidad con inversor y estructura']),
 'baterias':('Almacenamiento y respaldo','La batería almacena energía para utilizarla según la configuración del sistema. El respaldo requiere equipos compatibles y un dimensionamiento acorde con las cargas.', ['Equipos que desea respaldar','Tiempo de autonomía requerido','Compatibilidad con inversor y sistema de gestión']),
 'inversores':('Conversión y gestión de energía','El inversor se selecciona de acuerdo con los paneles, la red eléctrica y el tipo de sistema. Las funciones de respaldo y almacenamiento dependen del modelo.', ['Potencia del campo solar','Tensión y fases de la instalación','Necesidad de baterías y respaldo']),
 'estructuras':('Soporte para la instalación solar','La estructura se selecciona según la superficie, la distribución de paneles y las condiciones del sitio.', ['Tipo y estado de la superficie','Distribución y orientación de módulos','Condiciones de anclaje y cargas del proyecto'])
}
products=[]
for cat in data['categorias']:
 for p in cat['productos']:
  if p['titulo'].strip().lower()=='ajustar':
   p['publicado']=False
   continue
  if p.get('publicado') is False:continue
  slug=p.get('slug') or re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',p['titulo']+'-'+p['tag']).encode('ascii','ignore').decode().lower()).strip('-')
  p['slug']=slug;p['detalle']=f'/sistemas/{slug}/'
  assert (ROOT/p['img'].lstrip('/')).is_file(),p['img']
  products.append((cat,p))
assert len({p['slug'] for _,p in products})==len(products)
source.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
cards=[]
for cat,p in products:
 url=p['detalle'];title=p['titulo'];query=quote(title+' — '+p['tag'])
 cards.append(f'''<article class="product-card" data-category="{e(cat['slug'])}"><a class="product-card__img" href="{url}" aria-label="Ver {e(title)}"><img src="{e(p['img'])}" alt="{e(p.get('alt',title))}" loading="lazy" width="800" height="800"></a><div class="product-card__body"><div class="product-card__tag">{e(p['tag'])}</div><h3 class="product-card__title">{e(title)}</h3><p class="product-card__desc">{e(p['descripcion'])}</p><a class="product-card__link" href="{url}">Explorar producto →</a></div></article>''')
 purpose,explanation,checklist=guides[cat['slug']]
 features=p.get('caracteristicas') or [p['descripcion']]
 if isinstance(features,str):features=[features]
 specs=p.get('especificaciones') or {}
 rows=''.join(f'<div><dt>{e(str(k))}</dt><dd>{e(str(v))}</dd></div>' for k,v in specs.items())
 related=''.join(f'<a href="{q["detalle"]}"><img src="{e(q["img"])}" width="160" height="160" loading="lazy" alt=""><span>{e(q["titulo"])}<small>{e(q["tag"])}</small></span><span aria-hidden="true">↗</span></a>' for c,q in products if c['slug']==cat['slug'] and q is not p)
 docs=''
 for doc in p.get('documentos',[]):
  address=doc['url']
  if not (address.startswith('/') and not address.startswith('//')) and urlsplit(address).scheme!='https':raise ValueError('Document must be local or HTTPS')
  docs+=f'<li><a href="{e(address)}">{e(doc["titulo"])}</a></li>'
 docs=f'<section id="documentacion" class="product-detail-section"><h2>Documentación</h2><ul>{docs}</ul></section>' if docs else ''
 warranty=p.get('garantia') or 'Solicite las condiciones de garantía y la ficha técnica del modelo seleccionado junto con su cotización.'
 page=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)} | Ecovatio Energy</title><meta name="description" content="{e(p['descripcion'])}"><link rel="canonical" href="https://www.ecovatioenergy.com{url}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(p['descripcion'])}"><meta property="og:type" content="website"><meta property="og:url" content="https://www.ecovatioenergy.com{url}"><meta property="og:image" content="https://www.ecovatioenergy.com{e(p['img'])}">
<link rel="icon" href="/assets/img/favicon.png"><link rel="preload" as="font" type="font/woff2" href="/assets/fonts/montserrat-latin.woff2" crossorigin><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/projects.css"><link rel="stylesheet" href="/css/products.css"><script src="/js/script.js?v=products-1" defer></script></head>
<body><a class="skip-link" href="#producto">Saltar al contenido</a><header class="project-nav"><a href="/" aria-label="Ecovatio Energy, inicio"><img src="/assets/img/logo-small.webp" width="56" height="56" alt="Ecovatio Energy"></a><a href="/#sistemas">← Todos los sistemas</a><button class="theme-toggle" id="theme-toggle" aria-label="Cambiar tema">☾</button></header>
<main id="producto" class="project-container"><nav class="project-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><a href="/#sistemas">Sistemas</a><span>/</span><span>{e(cat['nombre'])}</span></nav>
<section class="product-overview"><a class="product-detail-photo" href="{e(p['img'])}" aria-label="Ampliar imagen de {e(title)}"><img src="{e(p['img'])}" alt="{e(p.get('alt',title))}" width="800" height="800" fetchpriority="high"><span>Ampliar imagen ↗</span></a><div><p class="eyebrow">{e(cat['nombre'])}</p><h1>{e(title)}</h1><p class="product-model">{e(p['tag'])}</p><p class="product-summary">{e(p['descripcion'])}</p><a class="btn btn--primary" href="/?producto={query}#contacto">Consultar este producto →</a><p class="product-help">Le ayudamos a elegir la configuración adecuada para su instalación.</p></div></section>
<nav class="product-detail-nav" aria-label="Información del producto"><a href="#caracteristicas">Características</a><a href="#aplicaciones">Aplicaciones</a><a href="#seleccion">Selección e instalación</a><a href="#garantia">Garantía y consulta</a></nav>
<div class="product-detail-columns"><section id="caracteristicas" class="product-detail-section"><p class="eyebrow">El producto</p><h2>Características y datos</h2><ul class="product-feature-list">{''.join('<li>'+e(str(x))+'</li>' for x in features)}</ul><dl class="product-spec-table"><div><dt>Categoría</dt><dd>{e(cat['nombre'])}</dd></div><div><dt>Referencia del catálogo</dt><dd>{e(p['tag'])}</dd></div>{rows}</dl></section>
<section id="aplicaciones" class="product-detail-section"><p class="eyebrow">Su función en el sistema</p><h2>{purpose}</h2><p>{explanation}</p><p>La solución final se define tras revisar las necesidades y condiciones de su proyecto.</p></section></div>
<section id="seleccion" class="product-detail-section"><p class="eyebrow">Antes de elegir</p><h2>Una selección que encaje con su proyecto.</h2><div class="product-checks">{''.join(f'<div><span>{i+1:02}</span><h3>{e(x)}</h3></div>' for i,x in enumerate(checklist))}</div><p>Comparta su consumo, los equipos que utiliza y la información de su instalación. Nuestro equipo revisará el dimensionamiento, la compatibilidad y el alcance de montaje en la propuesta.</p></section>
{docs}<section id="garantia" class="product-detail-section"><h2>Garantía, disponibilidad y cotización</h2><p>{e(warranty)}</p><details><summary>¿Puedo incorporarlo a un sistema existente?</summary><p>La compatibilidad depende del modelo y de los equipos instalados. Indíquenos sus referencias para revisar su caso antes de seleccionar el producto.</p></details><details><summary>¿La cotización incluye instalación?</summary><p>Solicite que la propuesta detalle los equipos, materiales y trabajos incluidos, de acuerdo con las necesidades de su proyecto.</p></details></section>
{('<section class="product-detail-section"><h2>Más opciones en '+e(cat['nombre'])+'</h2><div class="product-related">'+related+'</div></section>') if related else ''}
<section class="project-cta"><div><h2>¿Es el producto para su proyecto?</h2><p>Conversemos sobre su consumo y su instalación.</p></div><a class="btn btn--primary" href="/?producto={query}#contacto">Solicitar cotización →</a></section><a class="project-return" href="/#sistemas">← Volver a sistemas</a></main><footer class="project-footer">Ecovatio Energy · República Dominicana <a href="/pages/privacidad.html">Privacidad</a></footer></body></html>'''
 destination=ROOT/'sistemas'/p['slug']/'index.html';destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(page,encoding='utf-8')
home=ROOT/'index.html';s=home.read_text(encoding='utf-8')
s=re.sub(r'(<div class="product-grid" id="sistemas-grid">).*?(?=\s*<div class="product-pager")',lambda m:m[1]+'\n'+ '\n'.join(cards)+'\n</div>\n',s,count=1,flags=re.S)
home.write_text(s,encoding='utf-8')
path=ROOT/'sitemap.xml';s=path.read_text(encoding='utf-8');s=re.sub(r'\s*<url><loc>https://www.ecovatioenergy.com/sistemas/.*?</url>','',s);s=s.replace('</urlset>',''.join(f'  <url><loc>https://www.ecovatioenergy.com{p["detalle"]}</loc></url>\n' for _,p in products)+'</urlset>');path.write_text(s,encoding='utf-8')
print(f'Built {len(products)} product pages, static cards and sitemap entries.')
