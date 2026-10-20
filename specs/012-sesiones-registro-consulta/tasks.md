# Tareas — Sesiones CU08–CU10

SESIONES-tasks-r1 · Aprobadas junto con SESIONES-plan-r1 mediante «ok».

- [x] T1 — Dominio y contratos (CU08, R2–R6): validación de fecha/texto, contratos propios y operación estable. Hecho cuando pruebas demuestran calendario/Montevideo, obligatoriedad/formato, reenvío frente a sesión nueva y errores sin ampliar reglas.
- [x] T2 — Persistencia del lote (CU08–CU10, R4–R11): creación idempotente, comprobación, historial ordenado/paginado y detalle bajo propiedad/contexto. Hecho cuando PostgreSQL demuestra concurrencia/reinicio, ausencia de deduplicación por fecha/texto, paciente sin ficha, más de 20 sesiones, aislamiento, relaciones intactas y rollback. Depende de T1.
- [x] T3 — API protegida y harness (CU08–CU10, R1–R12): rutas/runtime/servidor y matriz HTTP. Hecho cuando pasan contratos, sesión/CSRF/Origin/no-store/413, errores equivalentes y comprobación sin efectos. Depende de T2.
- [x] T4 — Registro y recuperación (CU08, R1–R7, R12): cliente y formulario, fecha inicial, cancelar, guardado y operación congelada ante incertidumbre. Hecho cuando UI verifica doble envío, borrador, validación/413, comprobación/reintento de la misma operación y salida a detalle persistido. Depende de T3.
- [x] T5 — Historial/detalle y navegación (CU09/CU10, R1, R7–R12): vistas, acceso desde perfil, páginas, detalle y limpieza de respuestas. Hecho cuando pruebas verifican orden/fechas, sin notas en lista, contexto al volver y cambios de acceso, sin editar sesiones. Depende de T3 y se integra con T4.
- [x] T6 — Cierre local y revisión (R1–R12): check, matrices PostgreSQL y snapshot sin AUTH T7 si corresponde, demo ficticia teclado/escritorio/móvil, evidencia única, diff/commit y revisión independiente. Resolver hallazgos sin ampliar alcance. Sin publicación. Depende de T4–T5.

La aprobación conjunta habilita T1–T6 localmente para CU08–CU10. No incluye CU11, completar AUTH T7, nuevas dependencias/esquema/permisos, correo real, operaciones remotas, push/PR o despliegue.
