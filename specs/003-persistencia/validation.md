# Evidencia de preparación local 0D

Fecha de referencia: 14 de octubre de 2026. Spec 0D-r1, plan 0D-plan-r1 y tareas 0D-tasks-r1. Usuario aprobó T1–T4, sin cambios remotos.

## Verificación

- Dependencias fijadas: pg 8.23.1, @types/pg 8.23.1 y Supabase CLI 2.121.0. Ayuda consultada y migration new generó archivo SQL; no se enlazó o migró el proyecto remoto.
- PostgreSQL real 17.10 aislado: migración aplicada en dos bases nuevas. Ensayos de restricciones, fechas, roles y rollback satisfactorios; resultado final del runner registrado al cerrar la preparación.
- El runner usa exclusivamente loopback, base con nombre recién generado y bandera explícita de entorno desechable. Rechaza grupos de aplicación preexistentes.
- Se probaron email equivalente, duplicado permitido, FKs inválidas, profesional ajeno, ficha única, motivos/anotaciones/teléfono vacíos, fechas futuras, asociaciones/IDs/creación inmutables, sesión retroactiva, misma fecha, timestamps, fecha clínica al cambio de día y ausencia de edad/profesional redundante.
- Roles anon/authenticated rechazados. El grupo backend puede consultar/insertar; DELETE y CREATE rechazados. Los datos de ensayo se revirtieron. El comando de infraestructura se probó mediante SET ROLE sobre conexión local, no mediante una nueva cuenta LOGIN ni TLS remoto.
- Pruebas unitarias de configuración ausente, TLS, errores de conexión/timeout simulados, cuenta privilegiada y fallo de SQL con rollback. Estos mocks prueban manejo de errores, no conexión real a Supabase.
- Lint, formato, tipos, pruebas y build ejecutados; comandos y resultados finales se registran tras terminar.

## Límites

T5 y T6 pendientes: no se crearon tablas, grants, funciones, cuentas o credenciales en Supabase. No se utilizó la contraseña del chat. No hay evidencia Node–Supabase real, certificados remotos o autenticación por profesional. El endpoint health sigue independiente.

El job de integración PostgreSQL de GitHub se preparó localmente; no se ha publicado o ejecutado. No declarar 0D completa hasta aplicar SQL revisado, comprobar conexión real y registrar las verificaciones pendientes.

## Resultado final local — 15 de octubre de 2026

96 ensayos SQL aprobados en dos bases PostgreSQL 17.10 vacías, esquema reproducible y rollback confirmado. 19 pruebas de aplicación aprobadas (12 web y 7 API). Lint, formato, tipos y compilación de ambos workspaces satisfactorios. Se verificó el rechazo controlado de db:check sin configuración, sin secretos en la salida. T1–T4 completadas localmente; T5–T6 y CI remoto pendientes.

## T5 — Aplicación remota aprobada y verificada

El usuario aprobó el SQL concreto para vrqmpdedckkgxpdleepr mediante «si». Se aplicó base_psicologia por la herramienta de migraciones: versión real 20261015140453. El archivo originalmente generado por CLI se renombró a esa versión devuelta por Supabase para mantener alineado el historial; su SQL no cambió.

Se verificaron cuatro tablas con RLS, sin SELECT de anon/authenticated, grupo técnico con SELECT/INSERT/UPDATE y sin DELETE. El asesor de seguridad no devolvió avisos. Un ensayo transaccional probó sesiones sin ficha previa y misma fecha, rechazo de profesional ajeno, segunda ficha y reasignación. Finalizó con ROLLBACK; recuentos posteriores cero.

T5 completada. T6 sigue pendiente: ninguna cuenta LOGIN, contraseña o conexión Node–Supabase creada por esta operación. CI de 0D y publicación siguen pendientes.
