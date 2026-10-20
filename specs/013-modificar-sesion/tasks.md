# Tareas CU11

CU11-tasks-r1 · Aprobadas junto con CU11-plan-r1 mediante «si».

- [x] T1 — Edición atómica/versionado (R1–R5, R8, R10): contratos, validación y repositorio de sesión propia con versión precisa y bloqueo. Hecho cuando PostgreSQL demuestra sesión antigua, concurrencia, identidad/creación/relaciones intactas, orden actualizado, rollback y alta original sin duplicar/revertir.
- [x] T2 — API protegida y harness (R1–R7, R9–R10): integrar carga/actualización con secreto estable y guardas existentes. Hecho cuando pasan contratos, versión/campos, 404 equivalente, sesión/CSRF/Origin/413/no-store y errores públicos. Depende de T1.
- [x] T3 — Editor y navegación (R1–R2, R5–R9): cliente/vista desde detalle, campos/borrador, guardar/cancelar, conflicto/recarga y comprobación incierta. Hecho cuando UI verifica datos persistidos, doble envío/salida, confirmación/fallo de recarga, limpieza del acceso y contexto del historial/listado. Depende de T2.
- [x] T4a — Cierre local y revisión (R1–R10): check y matrices PostgreSQL, snapshot sin AUTH T7, demo ficticia de escritorio/teclado, evidencia, revisión independiente y commit local. Sin publicación.
- [x] T4b — Comprobación visual móvil: verificada a 390×844, sin desbordamiento horizontal; editor legible, guardado y detalle persistido correctos. Ver validation.md.

Aprobar conjuntamente CU11-plan-r1 y CU11-tasks-r1 autoriza T1–T4 localmente. No incluye completar AUTH T7, nuevas dependencias/esquema/permisos, datos reales, correo real, efectos remotos, push/PR o despliegue.

Evidencia y límites de verificación: [validation.md](validation.md). Lote local verificado; publicación autorizada mediante «muy bien, que sigue? vamo y vamo dale».
