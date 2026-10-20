# Plan de acceso en dos pasos

Actualización del 20 de octubre de 2026: el piloto T7 ya verificó registro, confirmación, contraseña+código y cierre con servicios reales; recuperación diferida por el usuario y aislamiento remoto entre dos cuentas sin ensayar. Se autorizó consolidar en Git el SQL aplicado, pruebas/evidencia y preparar PR. El plan original siguiente conserva el alcance de la preparación aprobada; no presenta operaciones posteriores como pendientes de autorización ni declara T7 completa. La consolidación no añade operaciones remotas, correos, permisos o despliegue.

AUTH-plan-r1 · Spec AUTH-r2 aprobada · T1–T6 aprobados por el usuario mediante «oka dale», después de elegir correo de prueba local. T7 aprobado posteriormente con alcance acotado en DEC-011; no amplía la autorización a producción.

## Arquitectura y cierre de bypass

Usar la API Express como intermediario de autenticación y sesión (BFF). Supabase Auth valida contraseña y administra registro, confirmación y recuperación; el navegador no recibe tokens Supabase. Añadir solo en backend @supabase/supabase-js 2.118.0, versión consultada en npm y compatible con Node 24; fijar versión y lockfile. Cliente sin persistencia/autorefresco compartido entre usuarios. Dominio depende de interfaces de identidad/correo/reloj, no del SDK.

Después de validar contraseña y email confirmado, crear intento pendiente ligado al usuario Auth y a un secreto opaco en cookie HttpOnly. Generar código con crypto.randomInt, guardar verificador HMAC con clave del servidor fuera de DB/Git, y enviar al email devuelto por Auth. No aceptar tokens Supabase como credencial alternativa de las rutas de pacientes ni intercambiar un OTP passwordless por sesión propia. No conceder acceso Data API a tablas privadas. Un login directo en Supabase sin pasar el desafío propio sigue sin dar acceso al producto.

Verificar y consumir el desafío en transacción con bloqueo de fila; un único ganador ante concurrencia. Estado de envío pendiente/aceptado/fallido: un fallo de correo no habilita acceso; tras respuesta incierta se permite reenvío limitado e invalidación anterior. Código de seis dígitos, cinco minutos, cinco intentos; 60 segundos de espera y máximo cinco envíos por cuenta en 15 minutos (persistidos, compartidos entre intentos). Máximo 30 solicitudes de inicio/reenvío/verificación por origen en 15 minutos, sin confiar en X-Forwarded-For. Denegar al agotarse límites, sin resetear por nuevo login. No loguear destinatarios/códigos; claves de contadores por cuenta normalizadas con HMAC.

Después del código, rotar cookie pendiente por sesión aleatoria de 256 bits. En DB guardar hash, usuario, profesional, vencimientos y revocación. Cookie HttpOnly, SameSite=Strict, Path=/, sin Domain; Secure obligatorio con HTTPS, excepción local HTTP solo en loopback de desarrollo. Nunca en localStorage/URL. Sesión máxima de ocho horas e inactividad de treinta minutos, renovable dentro de ese máximo tras validar estado. Cada operación consulta sesión vigente en backend; logout revoca en DB inmediatamente, limpia cookie y datos de UI. No emitir JWT propio ni aceptar flags de cliente. Bloquear CSRF con Origin exacto y token CSRF ligado a sesión, JSON y no CORS abierto; respuestas no-store. Health conserva acceso sin datos.

Recuperación: sesión específica de recuperación sin permiso sobre pacientes; verificar token y propósito de recuperación con Supabase antes de actualizar contraseña. Revocar sesiones/desafíos propios del usuario después del cambio y exigir login nuevo con código. Registro/reenvío/recuperación responden genéricamente. Confirmación o recuperación nunca crea una sesión completa de pacientes. Mantener tokens de verificación fuera de logs y retirarlos de la URL tras intercambio; no registrar query strings en esos endpoints.

## Persistencia e identidad

Preparar migración nueva usando la CLI fijada: vínculo único usuario Auth ↔ profesional, desafíos, sesiones y contadores en esquema privado. No vincular por email ni asignar datos Demo. Alta del profesional idempotente tras identidad/email comprobados, por ID Auth, con restricciones únicas y transacción; campos de nombre son datos de perfil, nunca permisos. Un conflicto con email existente no habilita apropiación y queda como error de vinculación.

La migración conservará pacientes existentes y sus responsables. La preparación se ensaya en PostgreSQL desechable; no aplicar sobre Supabase en este lote. Revisar RLS/grants de cada tabla y definir contexto por transacción obtenido exclusivamente de la sesión comprobada; mantener restricciones de escritura/propiedad. anon/authenticated siguen sin acceso directo. Rol backend restringido y sin bypass; RLS por contexto como defensa adicional frente a errores del repositorio, no como defensa contra robo de la credencial del backend. El plan no concede administración al rol ni crea funciones SECURITY DEFINER para sortear permisos. Cambios de privilegios remotos se presentarán con el SQL concreto antes de aplicarlos.

En la aplicación autenticada eliminar fallback a DEV_PROFESIONAL_ID. Pruebas anteriores usan dependencias/contextos inyectados en el harness, sin ruta HTTP de bypass en el servidor normal. No instalar infraestructura nueva global ni modificar AGENTS.md.

## UI y correo por etapas

Registro → confirmar email → contraseña → código → listado. Estados de vencimiento, reenvío limitado, errores y cierre de sesión; limpiar cuenta anterior. Formularios de contraseña y códigos no se incluyen en capturas ni logs.

Primera entrega: adaptadores de prueba de identidad y buzón en memoria únicamente dentro del harness, con cuentas ficticias y banner de simulación. El servidor normal falla cerrado si falta proveedor/configuración; no incluye endpoints para leer códigos reales. Pruebas y demo simulada son evidencia del flujo propio, no del funcionamiento real de Supabase Auth o de la entrega de email.

Preparar adaptador real Supabase y contrato de correo sustituible. Resend es recomendación de proveedor, todavía no contratado/elegido operativamente; su API podrá enviar códigos desde backend y SMTP podrá cubrir correos de Supabase. Nada de claves en frontend. Sin SMTP real por ahora ni dependencia de correo innecesaria.

No se encontró Docker en PATH: no prometer ensayo Auth local real hasta disponer de runtime compatible. No instalarlo automáticamente. La prueba integrada con Supabase real y correo real se hará como lote posterior: proveedor/dominio o remitente de prueba autorizado, destinatarios, configuración, SQL/permisos y límites de envíos explícitos. No crear membresías administrativas para permitir correo. No desplegar públicamente ni cargar pacientes reales.

## Verificación

Pruebas de máquina de estados, códigos con reloj controlado, fuerza bruta/reenvíos y consumo concurrente; HTTP directo sin contraseña/código, token Supabase o cookie falsa; aislamiento de dos profesionales; registro idempotente y fallo parcial; CSRF, logout, recuperación y expiración. PostgreSQL real desechable para restricciones/RLS/sesiones; mocks de Auth y correo identificados explícitamente. CI no tiene secretos ni envía emails. Mantener check y test:database, demo desktop/móvil simulada y una validation.md con límites y verificaciones reales pendientes.

Aprobar T1–T6 permite preparación e implementación local con datos ficticios y pruebas; no completar la aceptación remota de AUTH-r2 por simulación. T7 requiere autorización posterior concreta. No publicación/PR, migración remota, permisos, contratación ni envío real bajo este plan.
