# Tareas de acceso

AUTH-tasks-r1 · T1–T6 aprobados junto con AUTH-plan-r1 mediante «oka dale». T7 no autorizado.

- [x] T1 — Máquina de estados y contratos de identidad/correo/sesión (A1–A8). Probar contraseña sola, código, vencimientos, reenvíos, límites agregados y estados de recuperación.
- [x] T2 — Persistencia privada local (A2–A6): migración por CLI, sesiones/desafíos/vínculo único/RLS y ensayos de concurrencia, revocación e aislamiento en PostgreSQL desechable. Sin aplicación remota.
- [x] T3 — Backend (A1–A8): SDK fijado, adaptador Auth, cookies opacas, CSRF, endpoints y guardas en CU01/CU02 sin fallback. Probar bypass, tokens directos y fallos parciales. Depende de T1–T2.
- [x] T4 — UI y harness local (A1, A2, A6–A8): registro, confirmación, contraseña, código y recuperación/cierre; demo simulada con identidad/correo ficticios claramente señalados, sin habilitar ese proveedor en servidor normal. Depende de T3.
- [x] T5 — Matriz de seguridad e integración (A1–A8): casos HTTP, PostgreSQL, dos profesionales, reintentos, expiración y cambio de cuenta. Diferenciar pruebas de Auth simulado de futuras pruebas reales.
- [x] T6 — Cierre local: check, test:database, revisión desktop/móvil, diff, evidencia y commit local. Registrar lo no ejecutado; preparar lista de configuración/SQL/permisos/envíos para T7. Sin push.
- [ ] T7 — Posterior, no autorizado: configurar proveedor y Supabase de desarrollo, aplicar SQL revisado y comprobar registro/email/código real con cuentas/destinatarios autorizados. Requiere aprobación concreta. Hasta entonces la función no se declara validada con identidad ni correo reales.

Aprobar T1–T6 habilita el lote local sin consultas rutinarias. No incluye T7, despliegue, publicación ni contratación.
