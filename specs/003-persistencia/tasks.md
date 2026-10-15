# Tareas de persistencia

Revisión: 0D-tasks-r1. Spec aprobada 0D-r1. Plan propuesto 0D-plan-r1.
Aprobación: el usuario aprobó T1–T4 mediante «si». No autoriza T5–T6 ni publicación.

- [x] T1 — Preparar dependencias y SQL de migración.
  - Fijar pg, tipos y CLI, consultar ayuda y generar nombre por migration new.
  - Crear SQL del plan sin contraseñas. Revisar restricciones, grants y triggers.
  - Hecho cuando: migración concreta disponible para revisión, controles locales pasan; sin aplicación remota.
- [x] T2 — Preparar y ejecutar integración PostgreSQL.
  - Depende de T1. Casos válidos/ inválidos, unicidad, referencias, fechas, inmutabilidad y permisos.
  - Hecho cuando: evidencia real en PostgreSQL 17 y reproducibilidad en dos bases vacías. Si no hay instancia disponible, registrar pendiente, no aprobar mediante mocks.
- [x] T3 — Implementar infraestructura y db:check.
  - Depende de T1. Pool limitado, TLS verificado, consultas parametrizadas y rollback del ensayo.
  - Hecho cuando: errores de configuración/red/plazo probados sin imprimir secretos; health de 0B independiente de PostgreSQL.
- [x] T4 — Integrar CI desechable y documentación.
  - Depende de T2–T3. Servicio PostgreSQL 17 sin secretos externos, controles 0C y comandos documentados.
  - Hecho cuando para entrega local: configuración revisada y verificaciones disponibles pasan. La ejecución remota de CI espera autorización de publicar.
- [x] T5 — Aplicar migración revisada en Supabase de desarrollo.
  - Depende de T1–T4 y aprobación del SQL concreto y destino.
  - Reinspeccionar vrqmpdedckkgxpdleepr, mostrar SQL final y aplicar solo cambios aprobados mediante herramienta de migraciones.
  - Hecho cuando: schema e historial coinciden y ensayos reversibles confirman integridad/permisos. Sin resets, eliminaciones o cambios de schemas ajenos.
- [x] T6 — Configurar cuenta técnica y validar conexión real.
  - Depende de T5 y aprobación de creación de acceso concreto.
  - Configurar credencial nueva segura fuera de Git/chat; obtener endpoint real de Connect.
  - Hecho cuando: backend con cuenta restringida realiza db:check sobre proyecto de desarrollo, rollback confirmado y evidencia sin secretos.

Cada tarea requiere evidencia por requisito. T1–T4 pueden aprobarse como lote de preparación. T5–T6 quedan para aprobación concreta posterior. No se marca 0D completa con pruebas de integración o conexión real pendientes. No publicar ni hacer merge automáticamente.
