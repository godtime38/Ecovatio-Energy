# Panel de administración de Ecovatio

La web conserva HTML/CSS/JavaScript. El panel añade funciones Node de Vercel, Supabase Auth, una tabla de contenido y un bucket de archivos. No requiere React ni Next.js.

## Probar en este equipo

Con Node 22 o posterior:

```powershell
npm run admin
```

Abrir http://127.0.0.1:8766/admin/ y pulsar **Entrar al entorno local**. Este acceso sin contraseña solo existe en el servidor de desarrollo, enlazado a 127.0.0.1. Se desactiva obligatoriamente en Vercel. El sitio que refleja estas publicaciones es http://127.0.0.1:8766/; el servidor estático anterior del puerto 8765 no utiliza la base de datos local.

Los registros iniciales proceden de los JSON existentes (14 productos y 9 proyectos). Los cambios locales y sus respaldos se guardan en `.cache/admin/`, excluida de Git y de Vercel. Las fotografías iniciales siguen sirviéndose desde la web. La vista previa guarda primero el borrador. Las pruebas automáticas usan un directorio temporal aislado.

## Activar en Vercel con Supabase

1. Crear un proyecto Supabase. Puede utilizarse el plan Free para comenzar; revisar límites y política de pausas antes del uso comercial continuado.
2. Ejecutar `admin/setup.sql` en el SQL Editor del proyecto. Crea tablas con RLS, historial y bucket `ecovatio-media`. No habilitar escrituras públicas en Storage ni acceso público a las tablas.
3. En Authentication, crear el usuario administrador con correo confirmado y una contraseña propia. Desactivar el registro público si no se necesita. Gestionar invitaciones y recuperación de contraseña desde Supabase; no existe registro abierto en el panel.
4. En las variables de entorno del proyecto Vercel configurar:
   - `SUPABASE_URL`: URL del proyecto.
   - `SUPABASE_ANON_KEY`: clave anon del proyecto, utilizada para autenticar.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave de servidor; **nunca** incluirla en HTML, Git, capturas ni mensajes.
   - `ADMIN_EMAILS`: correos autorizados, separados por comas.
   - `SITE_URL`: origen exacto, por ejemplo `https://www.ecovatioenergy.com`, sin barra final. En Preview usar el origen exacto de esa implementación y preferiblemente un proyecto Supabase separado.
5. Usar la configuración incluida en `vercel.json`: framework Other, build `node scripts/build-vercel.cjs`, salida `public-dist`. Node 22 o posterior. No definir `CMS_LOCAL` en Vercel.
6. Desplegar primero en Preview. Comprobar login, imagen, borrador, vista previa, publicación, retirada y sitemap. Después desplegar en producción.

Sin Supabase configurado, el sitio público sigue utilizando los registros iniciales y el acceso remoto al panel queda deshabilitado. Una vez configurado, un fallo de Supabase devuelve un error temporal; no se reponen registros antiguos que hayan sido retirados.

Las modificaciones locales **no se sincronizan automáticamente** con Supabase. El entorno local sirve para probar. Crear las publicaciones definitivas en el panel conectado. Si se desean conservar fichas creadas localmente, planificar su importación junto con las imágenes antes del cambio a producción.

## Uso diario

- Seleccionar Productos u Obras y proyectos; buscar por nombre y filtrar por estado.
- Crear o editar una ficha. La dirección se genera con el nombre y queda fija después del primer guardado para conservar enlaces.
- Agregar imágenes. El navegador las convierte a WebP, limita a 1600 px y elimina los metadatos originales. Hasta 40 fotos por obra; la primera es portada. Los PDF se limitan a 2 MB.
- Guardar borrador conserva la versión pública anterior. Vista previa muestra el borrador y requiere sesión.
- Publicar actualiza la tarjeta, la ficha y el sitemap en el servidor, sin reconstruir ni editar código. La galería conserva su paginación aleatoria de cuatro tarjetas.
- Retirar de la web conserva un borrador y deja de servir la ficha pública.
- Cerrar sesión. La sesión remota dura como máximo una hora; después hay que volver a entrar.

El mapa de beneficios conserva sus seis ubicaciones editoriales. Los enlaces retirados desaparecen; nuevas ubicaciones en el mapa necesitan coordenadas y una actualización de diseño. Los proyectos nuevos sí aparecen automáticamente en la galería.

## Alcance y operación

Esta primera versión tiene un rol administrador autorizado por correo. Todos los administradores pueden publicar; no incluye aún roles editor/aprobador, gestión de usuarios dentro del panel, borrado de archivos huérfanos ni restauración de versiones desde la interfaz. El historial en Supabase permite recuperar versiones mediante una operación técnica; no sustituye un respaldo externo de base de datos y archivos. No almacena solicitudes comerciales del formulario de contacto.

Las imágenes y PDF del bucket son públicos desde su carga, incluso si la ficha sigue en borrador. Subir únicamente material autorizado para publicación. Los textos de los borradores se mantienen privados.

Aplicar una regla de rate limiting en Vercel para POST `/api/admin?action=login`, además de los controles de Supabase Auth. Verificar HTTPS, dominio canónico y variables por entorno antes de producción. Las claves de servicio se utilizan exclusivamente en las funciones; RLS impide que el navegador acceda directamente al contenido privado.

## Verificación

```powershell
node --test scripts/admin.test.cjs
node scripts/build-vercel.cjs
```

Se cubren aislamiento de borradores, publicación y retirada, conflicto de revisiones, escape HTML, validación de campos/rutas, sesión, origen de solicitudes y rechazo de archivos no permitidos. La integración real con Supabase/Vercel requiere las credenciales y no se considera validada por las pruebas locales.
