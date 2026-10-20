# Plan de integración del MVP

INTEGRACION-plan-r1 · Especificación INTEGRACION-r1 aprobada · Aprobado junto con INTEGRACION-tasks-r1 mediante «si».

## Base y alcance de comprobación

Partir de main con PR14 incorporado y conservar los cambios pendientes de AUTH T7. Antes de editar, inventariar la cobertura existente de aplicación, HTTP/PostgreSQL y UI contra I1–I7; registrar qué demuestra cada prueba y localizar únicamente huecos de integración. No aumentar el número de pruebas repitiendo las matrices por CU.

Preparar rama local de integración. Conservar código, migración renombrada y evidencia parcial de AUTH fuera del commit; los archivos compartidos DECISIONS.md y scripts/database-tests/run.mjs requieren selección parcial si se modifican. Sin acciones remotas, envío de correos ni recuperación.

## Recorrido con persistencia real local

Reutilizar scripts/database-tests/run.mjs, sus dos bases vacías, rol backend/contexto RLS y servicios HTTP reales. La identidad y el correo son ficticios; PostgreSQL y los repositorios son reales. Mantener fail-closed y guardas del servidor normal. Usar los contratos públicos de cada módulo, sin introducir accesos internos desde un dominio a otro.

Si la auditoría confirma un hueco, añadir un escenario de integración en scripts/database-tests/integracion.mjs y conectarlo al runner existente, o ampliar el escenario existente equivalente. Flujo continuo con un paciente nuevo: alta → búsqueda/perfil → sesión sin ficha → creación/lectura/edición de ficha → edición personal → nueva sesión de igual fecha → detalle/edición de sesión → historial. Comparar valores e identidades leídos mediante API y snapshots SQL de recursos relacionados antes/después de cada modificación; comprobar las relaciones que deben permanecer intactas. No usar mocks de repositorio ni datos dejados por otra matriz.

Dos profesionales ficticios con sesiones independientes: probar accesos cruzados a los IDs del recorrido y sesión ausente/revocada. Reutilizar casos existentes de duplicados, unicidad, reenvíos, concurrencia, respuesta incierta y CSRF; añadir un caso solo si el recorrido expone un riesgo no demostrado. Las pruebas de UI con servicios simulados demuestran navegación/estados, no persistencia o proveedor real.

Defectos: reproducirlos contra un requisito aprobado, corregir de forma acotada en el módulo responsable y añadir la regresión pertinente. Si requieren nuevas reglas, dependencias, esquema/permisos o ampliar efectos, registrar el pendiente y pedir aclaración antes de esa ampliación; continuar el resto del lote autorizado.

## Navegación y documentación

Ejecutar manualmente el recorrido completo en el harness ficticio existente: desktop/teclado y viewport móvil comprobado por dimensiones reales. Verificar filtros, texto sin aplicar, página de pacientes/historial, identidad del paciente, lecturas tras guardar y limpieza al cerrar/cambiar acceso. Capturas fuera de Git, sin contraseñas, códigos, tokens o datos reales. Si el servidor real propio ocupa el puerto, sustituirlo temporalmente para la demo local y restaurarlo al terminar; no detener procesos ajenos ni dejar una simulación presentada como acceso real.

Actualizar docs/DEVELOPMENT_WORKFLOW.md para el estado actual CU01–CU11, comandos vigentes y separación entre arranque real y demo. Explicar Node/npm, npm ci/check, PostgreSQL local desechable y variables por nombre, sin incorporar helpers particulares del equipo como si estuvieran versionados. Documentar la limitación de 127.0.0.1 y los límites del piloto: registro/confirmación/contraseña+código/logout reales verificados, recuperación diferida y datos clínicos ficticios. Eliminar afirmaciones obsoletas de estado actual sin alterar especificaciones o decisiones históricas.

## Evidencia y cierre

Mantener specs/014-integracion-mvp/validation.md como matriz breve I1–I7 → pruebas/recorrido → resultado, con fallos y no ejecutado. Ejecutar npm run check y matrices PostgreSQL existentes; cuando archivos compartidos con AUTH difieran, comprobar snapshot exacto del índice sin esos cambios ajenos. No ejecutar db:check remoto en esta etapa ni usar secretos de Supabase en la integración local.

Revisión independiente con base/árbol exactos, especificación y evidencia si cambia código funcional o pruebas de integración. Resolver hallazgos y revisar el delta final; registrar límites. Seleccionar archivos explícitos, comprobar formato/diff/separación de AUTH y crear commit local. Publicación/PR, merge y despliegue quedan para autorización posterior.
