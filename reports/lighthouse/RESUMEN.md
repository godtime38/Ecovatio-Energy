# Lighthouse — Ecovatio Energy

Medición del 11 de septiembre de 2026 (hora de Santo Domingo), Lighthouse 13.4.1, Chrome headless. URL: http://127.0.0.1:8765/. Tres ejecuciones consecutivas por dispositivo, con perfiles predeterminados de Lighthouse y caché de página reiniciada entre ejecuciones. Las métricas de rendimiento utilizan la simulación de red y CPU de Lighthouse.

## Resultados finales

| Categoría | Móvil (3 pruebas) | Escritorio (3 pruebas) |
|---|---|---|
| Rendimiento | 87 / 87 / 88 | 98 / 99 / 98 |
| Accesibilidad | 100 / 100 / 100 | 100 / 100 / 100 |
| Buenas prácticas | 100 / 100 / 100 | 100 / 100 / 100 |
| SEO | 100 / 100 / 100 | 100 / 100 / 100 |

| Métrica (mediana) | Móvil | Escritorio |
|---|---:|---:|
| Primer contenido, FCP | 1,70 s | 0,41 s |
| Elemento principal, LCP | 3,83 s | 1,07 s |
| Bloqueo total, TBT | 98 ms | 0 ms |
| Cambios de diseño, CLS | 0 | 0 |

Las seis ejecuciones finalizaron sin errores ni advertencias de ejecución.

## Qué se corrigió

- Contraste de etiquetas, textos secundarios, controles seleccionados y enlaces. Enlace de privacidad subrayado.
- Fuente Montserrat alojada localmente con su licencia en assets/fonts/OFL.txt; se retiraron las solicitudes a Google Fonts.
- Miniaturas propias para el carrusel; versiones intermedias para la foto destacada.
- Portada móvil de aproximadamente 107 KB y logo reducido.
- Reserva de dimensiones para logos y fotografías; carga diferida de las marcas.
- El video no oculta la portada hasta que empieza a reproducirse.

## Comparación y límites

La prueba exploratoria móvil anterior a esta ronda de correcciones dio rendimiento 86, accesibilidad 91, FCP 2,7 s, LCP 3,3 s, TBT 0 ms y CLS 0. Es una sola ejecución, no una línea base de tres muestras. Tras las correcciones mejora el primer contenido y se eliminan los avisos de accesibilidad, pero LCP aumenta a 3,83 s y TBT presenta variación. No se afirma una mejora general de todas las métricas.

El LCP móvil sigue siendo el principal pendiente. El informe identifica el título principal como elemento LCP. Antes de optimizar más conviene medir la versión en el alojamiento real con compresión y caché: el servidor local de Python no aplica .htaccess ni reproduce el comportamiento de producción. También queda margen para reducir y separar CSS y JavaScript no utilizados en la primera pantalla.

Las puntuaciones de 100 corresponden a comprobaciones automáticas: no garantizan accesibilidad completa, posicionamiento en buscadores ni validan datos comerciales. TBT no sustituye a INP y estas pruebas no representan Core Web Vitals de usuarios reales.

## Informes completos

- [Móvil 1](final-mobile-1.report.html), [móvil 2](final-mobile-2.report.html), [móvil 3](final-mobile-3.report.html).
- [Escritorio 1](final-desktop-1.report.html), [escritorio 2](final-desktop-2.report.html), [escritorio 3](final-desktop-3.report.html).

Cada informe tiene un JSON del mismo nombre. Para repetir: iniciar el servidor local y ejecutar scripts/lighthouse-audit.ps1, con Lighthouse disponible en .cache/npm y Chrome instalado.
