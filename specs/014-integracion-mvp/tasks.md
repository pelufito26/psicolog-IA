# Tareas de integración del MVP

INTEGRACION-tasks-r1 · Aprobadas junto con INTEGRACION-plan-r1 mediante «si».

- [x] T1 — Auditar cobertura y preparar base (I1–I7): rama desde main con PR14, inventario de cambios AUTH, matriz de evidencia existente y huecos concretos. Hecho cuando cada comprobación prevista tiene propósito y se distingue evidencia local de piloto real.
- [x] T2 — Recorrido integrado y regresiones (I1–I2, I4–I5): reutilizar/extender HTTP/PostgreSQL existentes con paciente nuevo y dos profesionales; comprobar persistencia y recursos relacionados, corregir defectos dentro de reglas aprobadas. Hecho cuando los riesgos de integración identificados tienen evidencia reproducible sin duplicar pruebas por CU. Depende de T1.
- [x] T3 — Navegación y arranque portable (I3, I6): demo ficticia de escritorio/teclado/móvil, contexto y limpieza de acceso; corregir guía de desarrollo y estado CU01–CU11, requisitos/variables sin secretos y enlaces locales. Hecho cuando recorrido y comandos se describen con sus prerrequisitos reales, sin depender de helpers personales no versionados. Depende de T2.
- [ ] T4 — Verificación y cierre local (I7): check y matrices completas, snapshot sin AUTH cuando corresponda, evidencia única, revisión independiente del cambio funcional y correcciones, diff y commit explícitos. Hecho cuando resultados, límites y pendientes están registrados y el commit conserva fuera los cambios ajenos. Sin publicación. Depende de T3.

Aprobar conjuntamente INTEGRACION-plan-r1 e INTEGRACION-tasks-r1 autoriza T1–T4 localmente, sin consultas rutinarias dentro del lote. No autoriza correo/operaciones remotas, recuperación, dependencias/esquema/permisos nuevos, publicación o despliegue.

T4: verificaciones y snapshot completos; revisión final y commit local en curso. Evidencia: [validation.md](validation.md).
