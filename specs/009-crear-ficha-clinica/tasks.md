# Tareas CU05

CU05-tasks-r1 · Aprobadas junto con CU05-plan-r1 mediante «perfecto, si».

- [x] T1 — Módulo y persistencia (R2–R7): validación de motivo/optativos, contratos, estado y creación atómica por paciente propio. PostgreSQL local demuestra una sola ficha bajo concurrencia/reintentos, rechazo ajeno, texto y relaciones intactos, rollback y contexto aislado.
- [x] T2 — API protegida y harness (R1, R4–R9): integrar rutas/runtime/servidor y simulación explícita; probar sesión/CSRF/Origin, campos no permitidos, límites/no-store y equivalencia de ausente/ajeno sin revelar contenido. Depende de T1.
- [x] T3 — Perfil y formulario (R1–R3, R5, R8–R10): estado de ficha, seis campos con único obligatorio, guardar/cancelar, validación/borrador, conflicto, respuesta incierta y comprobación explícita de estado. Probar doble envío, respuestas tardías, cambio de cuenta y contexto conservado del listado. Depende de T2.
- [x] T4 — Cierre local (R1–R10): check, matriz PostgreSQL y demo ficticia con teclado/escritorio/móvil; diff/evidencia y rama/commit solo de CU05, excluyendo AUTH T7. Registrar fallos resueltos y límites; sin publicación. Depende de T3.

La aprobación conjunta habilita T1–T4 localmente. No incluye CU06/CU07, completar AUTH T7, dependencias/esquema nuevos, operaciones remotas, correo real, publicación o despliegue.
