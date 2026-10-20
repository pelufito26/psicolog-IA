# Tareas CU07

CU07-tasks-r1 · Aprobadas junto con CU07-plan-r1 mediante «si si».

- [x] T1 — Edición atómica y concurrencia (R1–R5): contratos, validación de seis campos, carga/versionado y repositorio. Hecho cuando PostgreSQL real demuestra actualización propia, optativos vaciados, fechas/identidad/relaciones intactas, ausencia sin alta, rechazo ajeno, conflicto concurrente con precisión completa y rollback/contexto aislado.
- [x] T2 — API y harness (R1, R3–R9): integrar carga/actualización, secreto estable, runtime/rutas/servidor y demo ficticia. Hecho cuando pasan contratos, rechazo de campos/versiones, sesión/CSRF/Origin, 413/no-store y resultados diferenciados sin filtrar información ajena. Depende de T1.
- [x] T3 — Editor y recuperación (R1, R2, R5–R10): cliente, formulario desde CU06, guardar/cancelar, errores/borrador, conflicto y recarga confirmada, respuesta incierta/comprobación y contexto. Hecho cuando pruebas verifican doble envío, salida durante guardado, respuestas tardías/cambios de acceso y que la comprobación no reenvía ni atribuye éxito. Depende de T2.
- [x] T4 — Cierre local y revisión (R1–R10): check, matrices PostgreSQL, demo ficticia con segundo editor y teclado/escritorio/móvil, evidencia, diff y rama/commit CU07. Solicitar revisión independiente con base/HEAD, resolver hallazgos y registrar límites; conservar AUTH T7 aparte. Sin publicación. Depende de T3.

Aprobar conjuntamente CU07-plan-r1 y CU07-tasks-r1 autoriza T1–T4 localmente. Sin nuevas dependencias, esquema/permisos, correo real, operaciones remotas, push, PR o despliegue.
