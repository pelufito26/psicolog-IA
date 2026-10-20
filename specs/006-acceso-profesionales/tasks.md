# Tareas de acceso

AUTH-tasks-r1 · T1–T6 aprobados junto con AUTH-plan-r1 mediante «oka dale». T7 aprobado posteriormente para desarrollo y hasta seis correos al único destinatario indicado por el usuario; ver DEC-011.

- [x] T1 — Máquina de estados y contratos de identidad/correo/sesión (A1–A8). Probar contraseña sola, código, vencimientos, reenvíos, límites agregados y estados de recuperación.
- [x] T2 — Persistencia privada local (A2–A6): migración por CLI, sesiones/desafíos/vínculo único/RLS y ensayos de concurrencia, revocación e aislamiento en PostgreSQL desechable. Sin aplicación remota.
- [x] T3 — Backend (A1–A8): SDK fijado, adaptador Auth, cookies opacas, CSRF, endpoints y guardas en CU01/CU02 sin fallback. Probar bypass, tokens directos y fallos parciales. Depende de T1–T2.
- [x] T4 — UI y harness local (A1, A2, A6–A8): registro, confirmación, contraseña, código y recuperación/cierre; demo simulada con identidad/correo ficticios claramente señalados, sin habilitar ese proveedor en servidor normal. Depende de T3.
- [x] T5 — Matriz de seguridad e integración (A1–A8): casos HTTP, PostgreSQL, dos profesionales, reintentos, expiración y cambio de cuenta. Diferenciar pruebas de Auth simulado de futuras pruebas reales.
- [x] T6 — Cierre local: check, test:database, revisión desktop/móvil, diff, evidencia y commit local. Registrar lo no ejecutado; preparar lista de configuración/SQL/permisos/envíos para T7. Sin push.
- [ ] T7 — Parcial: migración aplicada y SMTP/plantillas/redirección configurados. Registro, confirmación e ingreso con código reales verificados con el usuario. Cierre real comprobado: regreso a Ingresar, cero sesiones vigentes y una revocada durante el ensayo. Dos correos entregados al único destinatario autorizado. Recuperación real diferida explícitamente; aislamiento con dos identidades reales sin ensayar. Los flujos indicados sí tienen evidencia real, pero T7 y aceptación completa AUTH siguen pendientes.

Aprobar T1–T6 habilita el lote local sin consultas rutinarias. No incluye T7, despliegue, publicación ni contratación.

Consolidación posterior autorizada el 20 de octubre: alinear archivo SQL con la migración aplicada, versionar sus pruebas de aislamiento y el estado/evidencia del piloto, verificar y preparar PR. No requiere nuevas reglas de producto ni repite las puertas ya aprobadas de AUTH-r2/T7. Sin nuevos correos, aplicación remota, permisos, recuperación, merge o despliegue.
