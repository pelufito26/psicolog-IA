# Plan del piloto en Vercel

VERCEL-plan-r1 · Especificación VERCEL-r1 aprobada · Aprobado junto con VERCEL-tasks-r1 mediante «sip aprobueo».

## Destinos y alcance

Partir del main remoto con PR16 incorporado, conservando esta documentación y cualquier cambio ajeno. Crear rama de trabajo y revisar diferencias antes de modificar código. Reutilizar el monorepo pelufito26/psicolog-IA, sin reescritura ni nuevos casos de uso.

El usuario confirmó que dispone de cuenta personal Vercel con proyectos vinculados a v0. Identificar su scope autenticado antes de crear recursos. Crear únicamente un proyecto nuevo llamado psicologia-piloto si está disponible en ese scope. Si existe uno con ese nombre, no modificarlo sin verificar que corresponde a esta etapa. Registrar scope/ID/nombre y alias HTTPS asignado en la evidencia sin secretos. No tocar otros proyectos ni v0, no crear equipos ni activar planes pagos. Si el plan disponible no admite el uso previsto, informar el requisito antes de contratar o desplegar.

Supabase destino: proyecto existente vrqmpdedckkgxpdleepr. Mantener esquema, roles, SMTP, destinatario y presupuesto aprobados. Mantener localmente los pacientes ficticios del harness; no copiarlos por defecto al remoto. Las pruebas online crearán datos clínicos inequívocamente ficticios bajo la cuenta piloto existente.

## Topología y adaptación local

Un proyecto Vercel con raíz del repositorio, frontend Vite compilado en apps/web/dist y una función Node 24 que exporte la aplicación Express existente. Añadir un punto de entrada mínimo en api/ y vercel.json: rutas /api y /api/* a la función, estáticos al build web, fallback de SPA solo fuera de /api. Verificar método, path, query y cookies sin alteración; un error de API nunca devuelve index.html. No utilizar Services beta, Edge, contenedores o un segundo proveedor. Vite con funciones Node y Express exportado están documentados por Vercel; validar el empaquetado real antes de enviar secretos.

Separar construcción de aplicación/runtimes del listener local. Inicialización reutilizable por instancia de función, sin abrir un pool por petición; el servidor local conserva su arranque y cierre. Build sin conexión a Supabase, migraciones, correo ni secretos del piloto. Conservar Node 24 y lockfile. Si se necesita CLI, comprobar versión/comandos con --help y fijar una versión compatible; no cambiar configuración global ni instalar herramientas sin relación con la tarea.

Crear configuración explícita local/piloto, con APP_ORIGIN HTTPS exacto y AUTH_REDIRECT_URL consistente. En piloto activar cookies Secure, HttpOnly, SameSite y CSRF existentes; pasar los orígenes autorizados a los módulos en lugar de aceptar localhost o confiar ciegamente en Host/X-Forwarded-Host. No utilizar encabezados del cliente para autorizar profesional o construir redirecciones. Fallar cerrado si faltan configuración o módulos necesarios. Mantener harness ficticio exclusivamente local.

Restringir en backend el email admitido mediante PILOT_ALLOWED_EMAIL, configurado fuera de Git con la dirección ya autorizada. Normalizar de acuerdo con las reglas de acceso y comprobar registro, ingreso, reenvíos y recuperación expuestos, además de autorización de sesiones; rechazar otras identidades antes de invocar proveedores o enviar correo. Conservar respuestas que no revelen existencia de cuentas. No depender de restricciones de Resend para limitar acceso ni implementar invitaciones. La recuperación sigue sin ensayo real y no se añade funcionalidad en este lote.

Configurar RESOURCE_SIGNING_SECRET estable, independiente de AUTH_SECRET, con derivación separada por propósito/módulo y vinculación a recurso/profesional/versión. Sustituir claves aleatorias por proceso en el piloto. Nunca persistir secretos en frontend; no prometer que versiones emitidas antes del cambio de clave sigan siendo válidas. Probar compatibilidad entre dos instancias y rechazo de tokens ajenos o alterados.

## Persistencia y variables

Usar pg con el pooler de Supabase en modo transacción y el usuario restringido existente, sujeto a comprobar que ese usuario y endpoint funcionan sin ampliar permisos. Mantener BEGIN/contexto local a transacción/COMMIT o ROLLBACK en el mismo cliente; impedir fuga de contexto cuando el pool reutiliza conexiones. No introducir sentencias preparadas con nombre incompatibles con el pooler. Revisar todos los pools por instancia y ajustar su presupuesto conjunto al límite real de la cuenta técnica; max por pool no equivale al total de conexiones del despliegue. Si la configuración existente no basta, documentar el límite y detener ese efecto antes de ampliar permisos/capacidad.

Mantener rejectUnauthorized=true. Admitir DATABASE_CA_PEM en servidor para evitar depender de una ruta de archivo de la PC; conservar DATABASE_CA_FILE para local y validar configuraciones incompatibles. Utilizar la CA verificada del destino cuando sea necesaria; nunca desactivar TLS para resolver errores. Verificar credencial no privilegiada y conexión mediante consulta acotada; no ejecutar matrices desechables contra el proyecto remoto.

Variables del servidor en entorno Production del proyecto nuevo: APP_ENV, APP_ORIGIN, AUTH_REDIRECT_URL, PILOT_ALLOWED_EMAIL, AUTH_SECRET, RESOURCE_SIGNING_SECRET, DATABASE_URL, DATABASE_CA_PEM si corresponde, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, AUTH_MAIL_MODE, RESEND_API_KEY y AUTH_FROM. Revisar durante implementación si alguna variable actual adicional es necesaria; no habilitar una identidad clínica fija en piloto. Generar los secretos nuevos criptográficamente fuera de Git y conservarlos estables. Transferir solo credenciales existentes autorizadas al proyecto exacto, sin mostrarlas. Ninguna variable sensible usa prefijo VITE_.

Previews sin estas credenciales, sin conexión a la base piloto, sin configuración de Auth para sus dominios y con API cerrada si falta configuración. Despliegue estable manual del commit revisado y con CI verde; no conectar promoción automática de main ni crear workflows con secretos de despliegue en este lote. El PR por sí solo no publica la aplicación con acceso a Supabase.

## Secuencia remota del lote

1. Identificar la cuenta y crear el proyecto vacío sin importar automáticamente main. Obtener el alias estable asignado por Vercel; no inventar una URL ni usar la URL efímera de una revisión. Si hace falta un primer despliegue para asignarlo, usar un build sin credenciales cuya API cierre el acceso.
2. Tras check, matrices y revisión independiente sin hallazgos pendientes, publicar rama/PR del alcance en pelufito26/psicolog-IA. Adjuntar el PR al chat. No mergear en nombre del usuario. Un despliegue manual puede usar el commit revisado de esa rama; registrar SHA exacto y CI correspondiente.
3. Guardar las variables de servidor solo en Production del proyecto identificado. Esto incluye almacenar en Vercel la credencial restringida de DB y la clave existente de Resend; no otorgar acceso global a otros proyectos. No imprimir ni persistir valores en documentación/logs. Usar intervención personal o confirmación puntual cuando el mecanismo de transferencia de secretos lo exija.
4. En Supabase, conservar SMTP y plantillas existentes. Añadir la redirección HTTPS exacta del piloto y cambiar Site URL a su alias estable; conservar redirección local exacta para desarrollo. Documentar que las plantillas con SiteURL enviarán desde entonces al piloto. No añadir comodines, previews, usuarios, destinatarios o migraciones.
5. Publicar el commit revisado en el alias estable. Comprobar rutas, HTTPS, cookies y rechazo de acceso anónimo/orígenes no autorizados antes de usar datos ficticios. El usuario ingresa personalmente contraseña/código; no extraer su sesión ni leer códigos. Usar como máximo los correos restantes del presupuesto anterior; comprobar saldo antes de enviar.
6. Completar recorrido CU01–CU11 con la cuenta piloto y datos ficticios, revisar escritorio/móvil y logout. Solicitar solo el paso humano necesario para confirmar uso desde otro dispositivo. No recrear cuenta remota ni afirmar registro nuevo o aislamiento de dos cuentas remotas si no se probaron. Una verificación no ejecutada queda pendiente explícita.

## Verificación y cierre

Pruebas proporcionales: configuración inválida y previews cerrados, whitelist antes de proveedores, rutas API/SPA, cookies/CSRF/orígenes, secretos estables entre instancias, TLS y pool/contexto RLS. Reutilizar npm run check y matrices PostgreSQL desechables existentes con dos profesionales, más la regresión de dos instancias. Build/empaquetado Vercel debe demostrar que incluye imports ESM/pg y no contiene archivos .env o credenciales del servidor en estáticos.

Registrar V1–V8 en validation.md con commit, CI, evidencia local/remota y pendientes. Revisor independiente con base/árbol exacto, especificación y resultados antes de publicar cambios funcionales; resolver hallazgos. Seleccionar explícitamente archivos para commit. Actualizar docs/DEPLOYMENT.md con operación, variables por nombre, arranque local, límites del correo y pasos de reversión. Para el primer despliegue, retirada segura significa cerrar el acceso/retirar alias o despliegue sin borrar datos; conservar los secretos mientras existan sesiones válidas. No restaurar DB ni revocar sesiones incidentalmente. Si hay versión previa compatible, comprobar su configuración antes de promoverla. Registrar logs de errores sanitizados sin cuerpos, claves, códigos o anotaciones clínicas.

## Referencias verificadas

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers

La aprobación conjunta autoriza el lote T1–T6, incluidos rama/commit/PR, proyecto nuevo y despliegue manual con los efectos remotos descritos. No incluye merge, contratación, pacientes reales, nuevos destinatarios, recuperación real ni modificaciones de proyectos ajenos. Identificación del scope y alias es una comprobación de destino, no una autorización abierta a cualquier cuenta.
