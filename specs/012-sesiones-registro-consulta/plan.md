# Plan — Sesiones CU08–CU10

SESIONES-plan-r1 · SESIONES-r1 aprobada · Aprobado junto con SESIONES-tasks-r1 mediante «ok».

## Módulo y persistencia

Crear `apps/api/src/modules/sesiones-clinicas/` con dominio puro, aplicación, infraestructura y presentación. Validar fecha ISO de calendario existente y no futura respecto al hoy clínico inyectable; anotaciones string no vacías tras trim con formato interno preservado. No introducir límite de antigüedad ni validación respecto al nacimiento. Evitar importar detalles internos de pacientes: usar contratos propios y utilidades pequeñas del módulo; no hacer un refactor transversal para compartir la fecha.

Repositorio parametrizado sobre sesiones_clinicas existente, pool/TLS y contexto app.profesional local a cada transacción, RLS/grants/triggers actuales. Verificar paciente propio antes de operar. Lecturas de contexto/historial/detalle/comprobación en transacciones READ ONLY. Listar por fecha_sesion DESC, fecha_creacion DESC, id DESC, LIMIT 21 y OFFSET para páginas de 20; validar página entera positiva con offset seguro, sin contar/exportar todo el historial. Seleccionar explícitamente IDs/fecha/profesional, sin anotaciones en lista. LEFT JOIN o consulta autorizada de paciente permite distinguir historial vacío de paciente ajeno/inexistente sin filtrar existencia ajena.

Detalle exige ID de sesión, paciente y profesional compatibles en la misma consulta, incluyendo identidad autorizada del paciente y nombre/apellido del profesional. Fecha clínica como YYYY-MM-DD sin conversión a hora local; timestamps técnicos ISO con zona. Sin escrituras de lectura, bloqueos globales ni referencia obligatoria a ficha clínica.

## Guardado sin duplicar reenvíos

El cliente genera un UUID aleatorio operacionId al preparar un envío y congela fecha/textos de ese intento. Backend deriva un UUID de sesión determinista mediante SHA-256 de una etiqueta de operación, profesional de sesión, paciente y operacionId, truncado a 128 bits con bits UUID válidos. El ID lo calcula el servidor; no se admite un sesionId arbitrario para crear. No depende de secreto volátil, por lo que un reinicio no convierte el reenvío en otra sesión. El identificador de operación no contiene datos clínicos ni otorga autorización.

BEGIN, contexto, comprobar paciente propio, INSERT con ese ID y ON CONFLICT(id) DO NOTHING; profesional tomado del servidor y fechas automáticas. Si ya existe, leer solo la fila autorizada de ese paciente/profesional y comparar fecha/anotaciones normalizadas: iguales devuelven el mismo resultado persistido sin UPDATE; diferentes o colisión no visible devuelven conflicto genérico sin revelar datos. La PK existente resuelve reenvíos concurrentes sin migración. Otro operacionId significa nueva sesión, incluso con misma fecha/texto. No deduplicar por contenido. Rollback en rechazo/fallo, descartar conexión si falla rollback; no modificar pacientes, fichas u otras sesiones.

Un endpoint de comprobación deriva el mismo ID y verifica el registro autorizado de esa operación. Si no es visible todavía, informar resultado no confirmado: puede seguir pendiente; nunca asegurar que no hubo escritura. La UI permite comprobar de nuevo o reintentar explícitamente el mismo envío congelado/operacionId, cuya idempotencia evita duplicación. No permite enviarlo como operación nueva ni cambiar el borrador mientras el resultado sea incierto. El resultado persistido se comprueba por identidad de operación, no por similitud de texto/fecha.

## API e integración

Rutas POST bajo `/api/sesiones-clinicas`, con la guarda existente de sesión completa/CSRF, Origin exacto, JSON 16 KiB y no-store. Identidad profesional únicamente del servidor, campos extra/tipos/UUID inválidos rechazados y errores genéricos sin trazas/cuerpos en logs:

- `/preparar`: `{ pacienteId }` → identidad autorizada y hoy clínico para alta, sin crear sesión.
- `/registrar`: `{ pacienteId, operacionId, fechaSesion, anotacionesClinicas }` → 201 al crear, 200 al reconocer el mismo envío, con ID y estado registrada. 400 validación/fecha/campos; 404 paciente ajeno/inexistente equivalente; 409 operación incompatible sin contenido; 503 resultado no confirmado.
- `/comprobar`: `{ pacienteId, operacionId }` → 200 con estado registrada e ID si existe la operación autorizada o no-confirmada si no se encontró todavía. Paciente ajeno/inexistente 404 indistinguible. No crea ni actualiza registros.
- `/historial`: `{ pacienteId, pagina }` → identidad del paciente, entradas con ID/fecha/nombre-apellido profesional, pagina/haySiguiente. 400 entrada inválida, 404 paciente ajeno/inexistente y 503 temporal; vacío autorizado es 200 con entradas vacías.
- `/detalle`: `{ pacienteId, sesionId }` → identidad paciente, ID/fecha/profesional/anotaciones y fechas técnicas. 404 genérico REGISTRO_NO_DISPONIBLE para paciente/sesión ajenos, inexistentes o sesión de otro paciente; sin diferencias que revelen existencia. 400 entrada y 503 fallo temporal.

Integrar handlers en app/servidor/runtime y harness local explícito, sin proveedor simulado en servidor normal. Mantener fallo cerrado sin contexto/configuración y el bloqueo productivo existente. No cambiar dependencias, esquema, permisos, configuración remota o credenciales.

## Interfaz

Crear `apps/web/src/sesiones-clinicas/` con cliente HTTP tipado y vistas HistorialSesiones, RegistrarSesion y DetalleSesion. Validar correspondencia del paciente y contratos antes de renderizar; patientFetch, abort/timeout 12 s y no-store. Textos solo en memoria y renderizados escapados con pre-wrap/ajuste de palabras; sin persistir borradores en navegador.

Añadir Sesiones clínicas al perfil cuando los datos personales estén autorizados. Historial conserva página al abrir/cerrar un detalle existente; regreso al perfil/listado mantiene búsqueda aplicada, texto sin aplicar y página de pacientes. Fechas clínicas se presentan a partir de componentes de YYYY-MM-DD; fechas técnicas con Intl y zona America/Montevideo. Vista identifica al paciente y profesional; no muestra anotaciones en lista ni botones de editar/eliminar.

Formulario preparado con fecha de hoy comprobada por backend, dos campos etiquetados y errores asociados. Cancelar antes de envío vuelve al historial sin escribir; guardar bloquea doble envío y salida mientras está pendiente. Errores de validación/413 permiten corregir conservando borrador; el próximo intento crea una operación nueva solo cuando el rechazo haya sido definitivo. Red/timeout/fallo desconocido mantienen operación y contenido congelados con aviso de incertidumbre y acciones de comprobación/reintento del mismo envío. Un éxito abre detalle consultado de persistencia con aviso; volver desde alta consulta historial página 1. Un fallo al cargar el detalle no revierte ni niega el alta confirmada y permite reintentar lectura.

Distinguir carga, vacío válido, no disponible y error temporal con reintento explícito/regreso. No presentar contenido previo como actual durante cambios de paciente/página/vista. Cancelar peticiones y descartar respuestas/borradores por desmontaje, cambio de paciente/cuenta, logout y expiración; no confundir cierre de vista con anulación de una petición ya enviada. Mantener teclado, foco, estados anunciados y legibilidad móvil. No incorporar CU11.

## Verificación y cierre

Dominio/aplicación y HTTP por CU: fecha/hoy Montevideo y medianoche, anotaciones, contratos, campos no permitidos, permisos, CSRF/Origin/413/no-store. Reenvíos iguales/concurrentes con un registro; misma operación/datos diferentes rechazada; nueva operación con misma fecha/texto válida. Comprobación por operación sin filtrar registros ajenos. Verificar identidad estable tras recrear el servicio y fechas técnicas automáticas.

PostgreSQL 17 desechable con dos profesionales y pacientes con/sin ficha: más de 20 sesiones, mismo día y empates de creación, orden/paginación, detalle exacto, ajeno/inexistente/de otro paciente, fechas/relaciones intactas, rollback y contexto tras fallo. Crear fixtures locales explícitas para empates sin cambiar migraciones. Extender matriz de acceso y matriz de sesiones invocada por run.mjs; si este último comparte AUTH T7, seleccionar solo el import/llamada del lote y verificar snapshot preparado para commit.

UI/cliente: recorrido completo, campos/errores, cancelar, doble envío, incertidumbre/comprobar/reintentar mismo envío, historial sin notas y estados, detalle/fechas/texto, respuesta tardía y limpieza por acceso. Revisión manual ficticia teclado/escritorio/móvil; conservar pruebas CU01–CU07/AUTH, npm run check y matrices PostgreSQL. Registrar requisitos/tareas/resultados/fallos/no ejecutado en una validation.md, sin confundir simulación con correo/Auth productivos.

Rama/commit locales solo del lote desde main con CU07 incorporado, después de verificar su merge remoto. Conservar AUTH T7 fuera, revisar diff y seleccionar archivos explícitos. Revisor independiente con base/HEAD y evidencia, resolver hallazgos y registrar límites. No publicar por concluir implementación o revisión; no modificar AGENTS.md ni ampliar el lote a CU11.

Aprobar plan y tareas habilita T1–T6 como lote local sin consultas rutinarias dentro del alcance. Sin push/PR, merge, despliegue ni operaciones remotas.
