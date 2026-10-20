# Piloto online en Vercel

Estado: piloto desplegado en https://psicologia-piloto.vercel.app, API/configuración anónima verificadas; ingreso real online confirmado; recorrido clínico y logout online diferidos por el usuario. Especificación y alcance: specs/015-piloto-vercel/. Solo pacientes ficticios; acceso inicial limitado a la cuenta profesional autorizada. Recuperación real pendiente. No representa habilitación para uso clínico productivo.

## Arquitectura y entrega

Proyecto nuevo psicologia-piloto en pelufito26s-projects, cuenta personal del usuario; no reutilizar ni modificar proyectos de v0. Raíz del repositorio, frontend Vite en apps/web/dist, API Express exportada por api/index.ts en Node 24. vercel.json dirige /api/* a la función y el resto a la SPA. Conservar método/path/query/cookies; errores desconocidos de API responden JSON 404. Vite sirve estáticos y no recibe secretos del servidor.

La función crea una sola aplicación y un pool compartido de máximo una conexión por instancia, con TLS verificado, timeouts y rol restringido. No conecta ni migra durante build. El pooler en modo transacción debe funcionar con el usuario restringido existente y su límite de conexiones; varias instancias pueden esperar o recibir un error temporal, nunca se amplían permisos para eludir ese límite. El contexto del profesional se establece dentro de cada transacción y se descarta al finalizar. Una instancia nueva usa las mismas claves estables para versiones y confirmaciones.

## Configuración del servidor

Guardar solo en Production del proyecto exacto, fuera de Git. No usar prefijo VITE_ para estos valores.

| Variable                 | Uso                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| APP_ENV                  | pilot para el despliegue; local opcional en desarrollo.                                          |
| APP_ORIGIN               | Origen HTTPS exacto del alias estable, sin barra final.                                          |
| AUTH_REDIRECT_URL        | Mismo origen con barra final.                                                                    |
| PILOT_ALLOWED_EMAIL      | Cuenta del piloto normalizada; mantener fuera de Git.                                            |
| AUTH_SECRET              | Secreto estable de acceso, mínimo 32 caracteres, generado criptográficamente.                    |
| RESOURCE_SIGNING_SECRET  | Otro secreto estable independiente, mínimo 32 caracteres; versiones y confirmaciones por módulo. |
| DATABASE_URL             | Endpoint del pooler y credencial restringida existentes; sin parámetros que sustituyan TLS.      |
| DATABASE_CA_PEM          | CA verificada en PEM cuando el destino la requiera. No combinar con DATABASE_CA_FILE.            |
| SUPABASE_URL             | URL HTTPS del proyecto autorizado.                                                               |
| SUPABASE_PUBLISHABLE_KEY | Clave pública de Auth, usada aquí por servidor; nunca clave privilegiada.                        |
| AUTH_MAIL_MODE           | resend.                                                                                          |
| RESEND_API_KEY           | Clave existente de envío aprobada, sin exponerla en salidas.                                     |
| AUTH_FROM                | Remitente piloto existente.                                                                      |

Vercel aporta NODE_ENV/VERCEL/VERCEL_ENV; no simular desarrollo para abrir el piloto. Preview queda cerrado aunque se hayan copiado variables por error. No transferir credenciales a Preview/Development ni descargar variables remotas dentro de archivos versionados. Los builds y pruebas de CI no necesitan secretos reales. La carpeta .vercel está ignorada porque puede contener configuración local y credenciales descargadas.

No cambiar claves en cada despliegue: cambiar AUTH_SECRET invalida desafíos/CSRF existentes; cambiar RESOURCE_SIGNING_SECRET invalida versiones/confirmaciones anteriores y requiere recargar. Conservar cookies HttpOnly, Secure y SameSite, CSRF y origen exacto. El email se comprueba en backend antes de operaciones de identidad/correo; reenvíos e intentos anteriores también se restringen. Las sesiones se filtran por la cuenta permitida al consultarlas. Otras cuentas no adquieren acceso por conocer la URL.

## Supabase y correo

Proyecto autorizado: vrqmpdedckkgxpdleepr. Configurar Site URL al alias HTTPS estable y añadir solo su redirección exacta. Conservar la redirección local exacta; no agregar comodines ni URLs efímeras de preview. Las plantillas que usan SiteURL apuntarán al piloto después del cambio, incluso si la solicitud partió del entorno local. SMTP y remitente permanecen iguales.

El proveedor de prueba limita destinatarios; este lote no abre registro general. Hay un presupuesto histórico de seis correos reales al único destinatario aprobado, con dos entregas registradas antes de esta etapa; comprobar consumo real antes de enviar más. No borrar/recrear la cuenta ni repetir registro real para obtener evidencia. El usuario introduce personalmente contraseña y código. Recuperación no se ensaya; el piloto rechaza la aplicación de una contraseña recuperada y mantiene pendiente esa aceptación.

## Publicación y controles

No hay promoción automática de Git configurada: vercel.json deshabilita despliegues Git y el proyecto nuevo no se importa con despliegue automático. Publicar manualmente un commit concreto con CI verde y revisión independiente. Preparar PR y adjuntarlo al chat; el usuario conserva el merge. No ejecutar migraciones como parte del build ni apuntar matrices de DB desechables a Supabase.

Antes de acceso clínico, comprobar HTTPS/rutas/cookies, sesión ausente/revocada y orígenes ajenos. Completar CU01–CU11 solo con datos ficticios, en escritorio/móvil, persistencia y logout. La evidencia de dos profesionales locales no demuestra dos cuentas reales online. Registrar SHA, alias real, resultados y pendientes en specs/015-piloto-vercel/validation.md. No copiar logs con contraseñas, códigos, cookies, claves, cuerpos de solicitudes o anotaciones clínicas. Revisar errores y disponibilidad con metadatos mínimos, sin añadir servicios de telemetría o contratos nuevos.

## Retirada y reversión

Para el primer despliegue no hay versión online previa: retirar el alias o bloquear el piloto sin borrar recursos de Supabase. Antes de una versión posterior, conservar SHA/despliegue anterior y su compatibilidad de variables; promover una versión compatible solo con autorización vigente. Un rollback de aplicación no restaura datos, no revoca sesiones y no debe cambiar secretos incidentalmente. Retirar las redirecciones o restaurar Site URL local solo como parte de una retirada coordinada y documentada; no borrar las cuentas ni datos del piloto para deshacer un error de aplicación.

Desarrollo local: seguir docs/DEVELOPMENT_WORKFLOW.md; el listener local continúa en 127.0.0.1:3001 y el frontend en 127.0.0.1:5173. Mantener .env ignorado en apps/api. No usar el harness como backend del despliegue.
