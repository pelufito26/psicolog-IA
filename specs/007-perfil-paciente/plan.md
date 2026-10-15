# Plan CU03

CU03-plan-r1 · Spec CU03-r1 aprobada · Aprobado junto con CU03-tasks-r1 mediante «ok».

## Implementación

- Extender el módulo pacientes existente con consulta de perfil por ID. Contrato de repositorio para obtener un único paciente del profesional; consulta SQL parametrizada por ambos identificadores, con app.profesional fijado dentro de la misma transacción desde la sesión comprobada. Reutilizar pool, TLS y RLS existentes; sin consultar todo el listado para obtener un perfil. Ausencia y propiedad ajena tienen el mismo resultado.
- Caso de uso: validar objeto con únicamente id y UUID válido, devolver solo id, nombre, apellido, fechaNacimiento (fecha de calendario), edad y telefono. El ID se usa internamente para identificar el resultado, sin mostrarlo en pantalla. Reutilizar una única función pura de edad para listado/perfil y hoyMontevideo; cualquier extracción conserva el comportamiento de CU02 y sus pruebas. Dominio sin dependencias de HTTP o persistencia.
- POST /api/pacientes/perfil recibe JSON `{ id: string }`, con la guarda de sesión y CSRF de pacientes ya existente. El profesional nunca proviene del cuerpo. Respuestas: 200 con perfil; 400 PERFIL_INVALIDO ante entrada inválida; 404 PACIENTE_NO_DISPONIBLE idéntico para ausente/ajeno; 503 PERFIL_NO_DISPONIBLE ante fallo temporal. Conservar 401 por sesión y controles de Origin, JSON, límite 16 KiB y no-store. No registrar cuerpos, identificadores ni resultados; sin datos personales en URL.
- Integrar la consulta en createApp, runtime y servidor normales mediante dependencias existentes; integrar también el harness explícito y aislado. No habilitar proveedor simulado por entorno en el servidor normal ni añadir rutas de bypass, cookies alternativas o acceso directo desde frontend a persistencia.
- UI: acción Ver perfil en cada fila con nombre accesible que identifica al paciente. Vista con encabezado, datos personales etiquetados y Volver al listado; fecha DD/MM/AAAA formada desde sus componentes de calendario. Mantener en memoria filtro aplicado, texto en edición y página; al volver refrescar esa página sin utilizar el reinicio de página del flujo CU01. Conservar el comportamiento de registrar/guardar/cancelar actual.
- Cliente de perfil mediante patientFetch: CSRF y expiración compartidos, validación de respuesta/ID coincidente, timeout de 12 segundos y cancelación. Separar 404 de error temporal; carga y reintento siempre permiten volver. Cancelar e ignorar respuestas al cambiar paciente/vista o desmontar por logout/cambio de identidad; no retener el perfil anterior como resultado actual. Sin almacenamiento persistente o navegación que incluya datos personales.

## Verificación y entrega

Cubrir R1–R8 con pruebas proporcionales de caso de uso, HTTP/cliente y UI. PostgreSQL desechable: dos profesionales, nombres iguales con IDs distintos, lectura propia, ajena, inexistente y sin contexto; verificar la consulta concreta de perfil, no solo el listado. Comprobar sesión incompleta/expirada, CSRF/origen y ausencia de diferencias públicas entre ajeno e inexistente. Edad y fecha: regla compartida, 29/2 y cambio de día en Montevideo sin desplazamiento del nacimiento.

UI: abrir paciente correcto, conservar texto en edición diferente del filtro aplicado y página mayor que uno, refrescar al volver, carga/error/404/reintento, respuesta tardía y logout con solicitud pendiente. Recorrido local listado → perfil → volver y revisión de teclado/escritorio/móvil, usando datos ficticios y el harness existente. No sustituye la prueba de identidad/correo reales de AUTH T7, que permanece pendiente por separado.

Ejecutar npm run check y la matriz test:database con PostgreSQL local desechable disponible, documentando comandos y resultados en una única validation.md. Revisar diff y preparar rama/commit local con selección explícita de archivos de CU03; conservar y excluir del commit los cambios anteriores de AUTH T7, incluida su migración. Sin modificar AGENTS.md, esquema, credenciales o configuración remota; sin push, PR ni despliegue bajo este lote.

Aprobar este plan y sus tareas habilita T1–T4 como lote local, sin consultas rutinarias adicionales dentro del alcance.
