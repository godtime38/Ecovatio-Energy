# Páginas de proyectos

Las fichas y las tarjetas de inicio se generan desde `assets/data/proyectos.json`:

```powershell
python scripts/build_projects.py
```

El generador actualiza las nueve páginas, la sección de proyectos de inicio y sus entradas en el sitemap. No modifica las otras secciones. Las fotografías que no existen se omiten con un aviso, sin borrar su referencia del catálogo.

Campos opcionales para enriquecer cada proyecto con información validada:

- `slug`: ruta estable; por defecto se toma el nombre de la carpeta de fotos.
- `necesidad`: texto sobre la necesidad del cliente.
- `equipos`: lista de modelos o equipos confirmados.
- `resultados`: texto con producción o ahorro documentado.
- `proceso`: lista de objetos con `titulo` y `descripcion` para las etapas de ese proyecto.

Si no hay `proceso`, se muestran cuatro etapas claramente presentadas como el proceso habitual de la empresa. Necesidad, equipos y resultados no se publican hasta disponer de contenido. Las imágenes en `images` forman la galería completa; no se atribuyen a etapas sin documentación.

Pendiente de aportar: `/assets/img/proyectos/Monte-plata/4.png`, que figura en el catálogo pero no está en el disco. Monte Plata muestra sus tres imágenes disponibles.

Validado: filtros, navegación a Baní, ampliación de fotografías, avance a la segunda foto, cierre con Escape, transferencia de proyecto al formulario y diseño móvil de 390 px. No se enviaron formularios externos. Las mediciones Lighthouse anteriores preceden a esta nueva galería.
