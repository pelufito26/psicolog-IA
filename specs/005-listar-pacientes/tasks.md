# Tareas CU02

CU02-tasks-r1 · Aprobado junto con CU02-plan-r1 mediante «avancemos». Implementación y evidencia en validation.md.

- [x] T1 — Reglas y consulta (R1–R5, R8): pruebas de edad/búsqueda/orden/páginas y caso de uso, repositorio filtrado por profesional. Hecho cuando PostgreSQL desechable demuestra aislamiento y navegación de más de una página.
- [x] T2 — API local (R1, R8): integrar contrato y contexto existentes; probar entradas inválidas, errores sin filtraciones, origen y no-store. Depende de T1.
- [x] T3 — Listado e integración CU01 (R2–R7): búsqueda, paginación, estados, accesibilidad y regreso tras alta/cancelación; probar respuesta tardía, fallo y filtro conservado. Depende de T2.
- [x] T4 — Cierre (R1–R8): check, test:database, demo desktop/móvil de lectura con pacientes existentes, diff y evidencia breve. Registrar fallos resueltos y verificaciones no ejecutadas; commit local sin push. Depende de T3.

Aprobar el lote autoriza T1–T4 sin consultas intermedias dentro de este alcance. No autoriza nuevas escrituras remotas, publicación o despliegue.
