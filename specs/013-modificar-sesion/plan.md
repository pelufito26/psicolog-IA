# Plan CU11 — Modificar sesión

CU11-plan-r1 · CU11-r1 aprobada · Aprobado junto con CU11-tasks-r1 mediante «si».

## Backend y persistencia

Extender sesiones-clinicas con `application/editar-sesion.ts`: contratos de carga/actualización propios, reutilizando DatosSesion, validarSesion y hoyClinico del dominio actual. Cargar paciente/profesional/fecha/notas desde persistencia; requerir ambos campos de reemplazo como strings. No importar aplicación de fichas/pacientes: adoptar su patrón de concurrencia sin refactor transversal ni nueva dependencia.

POST `/api/sesiones-clinicas/edicion` recibe únicamente pacienteId/sesionId UUID; devuelve identidad del paciente, profesional, fecha/anotaciones actuales y versión opaca. POST `/actualizar` recibe únicamente pacienteId, sesionId, version, fechaSesion y anotacionesClinicas. El profesional viene del acceso, nunca del cuerpo. Validación de hoy de Montevideo al ejecutar guardado, sin fecha congelada en frontend ni restricciones respecto a nacimiento/antigüedad.

Versión HMAC con secreto estable de proceso, ligada a etiqueta de operación, profesional/paciente/sesión y fecha_ultima_modificacion exacta como texto PostgreSQL. No reducir precisión a Date JS ni usar fecha formateada. Verificador no otorga acceso; tras reiniciar API puede requerir recarga. No añadir secreto persistente o configuración global ni alterar la identidad determinista/idempotencia del alta.

Ampliar `infrastructure/pg-sesiones.ts` con carga en READ ONLY y una consulta coherente de contenido/identidad/timestamp. Guardar en transacción con contexto app.profesional: SELECT autorizado por sesión/paciente/profesional FOR UPDATE OF s, comprobar versión bajo bloqueo y UPDATE de solo fecha/anotaciones por identidad vigente. Trigger actual actualiza modificación; creación/relaciones inmutables. Sin INSERT, cambio de ID o reordenamiento de otras filas. Rollback en conflicto/fallo y descarte de conexión si rollback falla; reutilizar pool/TLS/RLS/grants actuales.

Respuestas: 400 EDICION_INVALIDA o DATOS_INVALIDOS con errores por campo; 404 REGISTRO_NO_DISPONIBLE equivalente para sesión/paciente ajenos, inexistentes o de otro paciente; 409 EDICION_CONFLICTO sin contenido; 200 ID/estado actualizada tras commit; 503 GUARDADO_NO_CONFIRMADO en fallo de actualización y error genérico de carga. Conservar sesión completa/CSRF/Origin, JSON 16 KiB y no-store. Integrar rutas/runtime/app/servidor/harness ficticio sin habilitar simulación en el servidor normal ni quitar bloqueo productivo existente.

## Interfaz y recuperación

Cliente de edición separado `sesiones-clinicas/edit-client.ts`, con contratos explícitos para identidad/fecha/notas/versión y resultados. patientFetch, abort/timeout 12 s y no-store. Validar correspondencia de paciente/sesión antes de renderizar, sin contenido en URL/logs/almacenamiento persistente.

Nueva vista `EditarSesion.tsx` desde botón Editar sesión clínica en DetalleSesion. Precargar ambos campos y mostrar paciente/profesional; no guardar con carga fallida o incompleta. Nota obligatoria, texto literal/multilínea, errores asociados y borrador solo en memoria. El backend determina si una fecha es futura al guardar; conservar fecha cargada y no imponer un max de hoy congelado. Guardar bloquea doble envío/salida durante petición; éxito vuelve a detalle consultado con aviso. Cancelar antes de guardar descarta borrador y consulta detalle sin escribir. Un fallo al leer después del éxito mantiene constancia del guardado confirmado y ofrece reintentar lectura.

Conflicto: bloquear guardar, conservar borrador y ofrecer recarga. Confirmación explícita de descarte antes de obtener/reemplazar contenido/versión; si falla conservar borrador y bloqueo. Respuesta incierta: informar que pudo guardarse, conservar borrador, bloquear reenvío y ofrecer Comprobar sesión actual mediante lectura de CU10. Mostrar contenido guardado separado, sin afirmar que ese intento produjo la modificación. Para continuar editar, misma recarga con confirmación obtiene versión actual. Sin fusión, sobrescritura forzada ni reintento automático; mantener salida con aviso de resultado no confirmado.

Mantener HistorialSesiones y página seleccionada al editar desde detalle. Regreso reconsulta historial ordenado por fecha/creación/ID: la sesión puede moverse de página y no se fija en la posición anterior. Conservar perfil/listado de pacientes y búsqueda/página. Cancelar lecturas y descartar respuestas ante desmontaje, cambio de paciente/sesión/cuenta, logout o expiración; clave por paciente+sesión para no reciclar borradores. Foco/teclado/estados anunciados y estilos acotados para formulario/confirmación/comprobación, sin añadir edición de otros recursos.

## Verificación y cierre

Aplicación/HTTP (R1–R7, R9–R10): campos permitidos, notas vacías/calendario/futuro y medianoche, versión ligada a identidad/profesional/timestamp completo, 404 equivalente y 409; sesión ausente/incompleta/expirada/logout, CSRF/Origin/JSON/413/no-store y errores genéricos. Extender rutas/runtime y matriz de acceso del harness.

PostgreSQL local desechable (R2–R5, R8, R10): sesión antigua, dos guardados de una versión con un éxito/un conflicto; precisión dentro del mismo milisegundo; identidades/creación y pacientes/fichas/otras sesiones intactos, rollback/contexto tras fallo real. Cambio de fecha actualiza orden con empates existentes. Tras editar, reenviar alta original produce conflicto si cambió su contenido, sin duplicación ni restauración; comprobar operación/leer no escribe. Mantener válidas sesiones nuevas de fecha/texto iguales.

UI/cliente (R1–R2, R5–R9): precarga/errores, validar/cancelar/éxito, bloqueo de doble envío y salida pendiente, conflicto/borrador/recarga confirmada/fallida, resultado incierto/comprobar sin reenviar ni atribuir éxito. Pruebas de respuesta tardía por sesión/paciente/acceso; historial página 2 → detalle → editar → detalle → historial conserva página, perfil/listado conservan contexto. Demo ficticia teclado/escritorio/móvil; validar lectura del contenido persistido y fechas.

Ejecutar npm run check y matrices PostgreSQL CU01–CU11/AUTH, sin datos reales. Evidencia única en validation.md con fallos corregidos, pruebas/no ejecutado y límites. Preparar rama/commit solo CU11 desde main con PR13 incorporado después de comprobar su merge. Mantener fuera AUTH T7, seleccionar archivos explícitos y probar snapshot exacto del commit si hay archivos compartidos. Revisión independiente con base/HEAD, resolver hallazgos y registrar límites antes de publicar. Sin dependencias/esquema/permisos nuevos, cambios de AGENTS.md, configuración remota, correos, push/PR o despliegue.

Aprobar plan/tareas habilita T1–T4 como lote local sin consultas rutinarias dentro de este alcance. Publicación y cierre de AUTH requieren autorización separada.
