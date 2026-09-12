# Fichas de productos

Las tarjetas de inicio, páginas de detalle y entradas de sitemap se generan con:

```powershell
python scripts/build_products.py
```

Fuente: `assets/data/sistemas.json`. Se conserva el catálogo existente y se añaden `slug` y `detalle` para rutas estables. Los campos `caracteristicas` (lista), `especificaciones` (objeto), `garantia` (texto) y `documentos` (lista con `titulo` y `url`) permiten ampliar cada ficha con información validada. Los documentos admiten rutas locales o HTTPS.

Las especificaciones mostradas proceden del catálogo, no de una nueva verificación del fabricante. No se añaden precios, inventario, certificaciones ni plazos de garantía supuestos. Los artículos que describen una marca o gama requieren elegir el modelo antes de confirmar compatibilidad.

La entrada «Ajustar», con imagen de batería en inversores, se conserva con `publicado: false`; no aparece como producto identificado. Corregir su identificación antes de habilitarla.

«Consultar este producto» lleva al formulario con una referencia visible y un campo `producto_referencia`, incluido en el envío habitual del formulario. No se envían consultas automáticamente.

Verificado: generación de 14 páginas, enlaces e imágenes locales, consulta desde Pytes y referencia visible en formulario, ancho móvil de 390 px, sintaxis JavaScript y pruebas existentes del formulario/calculadora. No se enviaron leads reales. Los resultados Lighthouse anteriores no se atribuyen a estas páginas nuevas.
