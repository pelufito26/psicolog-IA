# Tareas CU03

CU03-tasks-r1 · Aprobadas junto con CU03-plan-r1 mediante «ok».

- [x] T1 — Consulta de perfil (R2, R3, R5, R8): contrato, caso de uso y SELECT por paciente/profesional con contexto transaccional. Reutilizar edad; probar ID inválido, nombres iguales, propiedad, ausencia y errores. PostgreSQL desechable demuestra aislamiento entre dos profesionales y sin contexto.
- [x] T2 — API protegida y harness (R5, R6, R8): integrar ruta/runtime/servidor y demo ficticia; comprobar sesión incompleta/expirada, CSRF/Origin, no-store y misma respuesta para ajeno/inexistente. Sin accesos alternativos. Depende de T1.
- [x] T3 — Perfil y navegación (R1–R4, R6–R8): cliente, acción por paciente, vista de datos y regreso que refresca conservando búsqueda aplicada, texto en edición y página. Probar carga/404/error/reintento, fechas, respuestas tardías y logout/cambio de cuenta sin datos residuales. Conservar CU01/CU02. Depende de T2.
- [x] T4 — Cierre local (R1–R8): check, matriz PostgreSQL, demo ficticia con teclado/escritorio/móvil, diff y evidencia breve con límites. Preparar rama y commit exclusivamente de CU03, conservando los cambios pendientes de AUTH T7 fuera de ese commit. Sin publicación. Depende de T3.

La aprobación conjunta habilita todo el lote T1–T4 local. No incluye terminar AUTH T7, cambiar Supabase remoto, enviar correos reales, añadir dependencias o esquema, publicar ni desplegar.
