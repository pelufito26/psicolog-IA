# Tareas CU04

CU04-tasks-r1 · Aprobadas junto con CU04-plan-r1 mediante «si».

- [x] T1 — Aplicación y persistencia (R2–R7): carga de edición/versionado y actualización atómica con reglas CU01, bloqueo compartido, duplicado excluyendo al propio paciente y confirmación ligada a operación/datos/versión. Probar propiedad, precisión, conflictos, concurrencia y rollback en PostgreSQL local desechable.
- [x] T2 — API protegida y harness (R1, R5, R7, R9): integrar contratos, runtime/servidor y demo explícita; verificar sesión/CSRF/Origin, campos extra, errores públicos, no-store y confirmaciones ajenas/reutilizadas. Sin bypass. Depende de T1.
- [x] T3 — Edición desde el perfil (R1–R4, R6–R10): precarga, errores/borrador, advertencia/confirmación, conflicto y recarga explícita, guardar/cancelar, perfil actualizado y listado conservado. Probar respuestas tardías, cambio de cuenta y fallo incierto sin reintento automático; conservar CU01–CU03. Depende de T2.
- [x] T4 — Cierre local (R1–R10): check, matriz PostgreSQL y demo ficticia con teclado/escritorio/móvil; diff/evidencia y commit solo de CU04 en rama local. Registrar fallos resueltos, verificaciones no ejecutadas y límites. Conservar cambios anteriores de AUTH T7 fuera del commit; sin publicación. Depende de T3.

La aprobación conjunta habilita T1–T4 localmente. No autoriza terminar AUTH T7, operaciones remotas, correos, pacientes reales, nuevas dependencias/esquema ni publicación/despliegue.
