# Plan de mejoras de Ecovatio Energy

## Ejecutado en el proyecto local

- [x] Corregir retorno de inversión: mostrar el resultado real aunque supere 10 años; limitar solo la barra.
- [x] Unificar supuestos de producción y explicar el modelo simplificado.
- [x] Bloquear envíos duplicados; mostrar estado de envío, error y éxito; conservar datos ante errores.
- [x] Adjuntar consumo, factura y tipo de propiedad cuando el visitante modifica la calculadora.
- [x] Retirar preloader; cargar video solo tras la carga inicial en escritorio, respetando ahorro de datos y movimiento reducido.
- [x] Generar portada de 256 KB, imágenes sociales e icono que faltaban.
- [x] Optimizar fotos de proyectos de 8.166.889 a 2.373.922 bytes (71% menos), conservando originales.
- [x] Mejorar contraste, foco de teclado, FAQ accesible y adaptación móvil.
- [x] Situar proyectos inmediatamente después de la portada.
- [x] Incluir catálogo y galería en HTML para que existan sin JavaScript.
- [x] Unificar canonical y configuración Apache con el dominio público www; actualizar sitemap y robots.
- [x] Quitar dirección y coordenadas no verificadas del schema, y usar HomeAndConstructionBusiness.
- [x] Sustituir estadísticas de portada no documentadas por información del catálogo y servicios.
- [x] Crear páginas informativas de privacidad y condiciones; reparar imagen inexistente en Marcas.

## Validación

- Lighthouse local completado: tres pruebas móviles y tres de escritorio. Ver [resultados y límites](reports/lighthouse/RESUMEN.md).
- Datos comerciales pendientes recopilados en [VALIDACION-COMERCIAL.md](VALIDACION-COMERCIAL.md).

- `node --check js/script.js`.
- `node scripts/verify_site.cjs`: cálculo normal, retorno de 23,1 años, consumo cero, bloqueo de doble envío, error, reintento, éxito y datos de calculadora. Las peticiones son simuladas, sin enviar leads reales.
- Revisión visual local de portada en escritorio y móvil de 390 px; sin desbordamiento horizontal de la página.
- Recarga en móvil: el source de video no tiene src y no inicia la descarga automática.
- `git diff --check`.

## Pendiente antes de publicar

- Validar dirección exacta, certificaciones, garantías y cifras comerciales con la empresa.
- Historia contiene nombres y una narración sin respaldo en el resto del proyecto: se mantiene fuera del sitemap y con noindex hasta validarla.
- Confirmar que la configuración real de alojamiento utiliza Apache y aplica .htaccess. Las reglas locales no cambian el servidor público.
- Revisar que la descripción de tratamiento de datos corresponda a las prácticas operativas de la empresa.
- Medir Lighthouse y Core Web Vitals en el alojamiento definitivo. La reducción de archivos no equivale a una mejora medida de LCP.

## Siguiente etapa editorial

- Páginas de servicios con casos y contenido específico validado.
- Resumir el proceso comercial y aportar pruebas de certificaciones.
- Definir analítica de conversiones y su configuración de privacidad.

No se ha publicado ni modificado el alojamiento. Para revisar: `python -m http.server 8765 --bind 127.0.0.1`.
