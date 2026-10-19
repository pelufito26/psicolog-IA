# Tareas CU06

CU06-tasks-r1 · Aprobadas junto con CU06-plan-r1 mediante «si».

- [x] T1 — Lectura y aislamiento (R2–R7): contrato de consulta, aplicación y repositorio parametrizado con transacción de solo lectura. Hecho cuando PostgreSQL demuestra contenido/fechas exactos, ausencia diferenciada, aislamiento entre dos profesionales y registros clínicos/personales intactos.
- [x] T2 — API y harness (R1, R5–R7, R9): integrar consultar en rutas/runtime/app/servidor y demo ficticia. Hecho cuando las pruebas verifican sesión completa, CSRF/Origin, contrato/entrada, 404 equivalente, errores genéricos y no-store. Depende de T1.
- [x] T3 — Consulta visible (R1–R4, R6–R10): cliente y vista de solo lectura, acceso desde perfil, textos/fechas, estados/reintento, regreso y limpieza de respuestas tardías. Hecho cuando pruebas de UI/cliente cubren navegación/contexto, seis campos, ausencia/error, identidad y cambios de acceso sin contenido residual. Depende de T2.
- [x] T4 — Cierre local (R1–R10): check y matrices PostgreSQL, recorrido ficticio con teclado/escritorio/móvil, evidencia única, revisión del diff y rama/commit solo CU06. Hecho cuando se documentan resultados y límites y queda fuera AUTH T7, sin publicación. Depende de T3.

Aprobar conjuntamente CU06-plan-r1 y CU06-tasks-r1 autoriza T1–T4 localmente. No incluye CU07, completar AUTH T7, operaciones remotas, correo real, nuevas dependencias/esquema/permisos, push, PR o despliegue.
