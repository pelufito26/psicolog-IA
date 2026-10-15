# Validación CU01 — Registrar paciente

Fecha: 15 de octubre de 2026. Alcance aprobado: CU01-r1, CU01-plan-r1 y CU01-tasks-r1 (T1–T6). Rama local: feat/cu01-registrar-paciente. Publicación y CI de esta rama todavía no ejecutadas.

## Resultados

- npm run check: satisfactorio con Node 24.21.0 y npm 11.13.0; lint, formato, tipos, 21 pruebas web y 29 API (50 en total), compilación de ambos workspaces.
- Ensayo PostgreSQL 17.10 portátil: satisfactorio en dos bases nuevas desechables. Conserva 96 aserciones SQL previas y agrega alta, advertencia sin escritura, confirmación, profesional ajeno, fecha distinta, profesional inexistente y solicitudes concurrentes. En concurrencia, una alta y una advertencia. No usa Supabase ni secretos en CI.
- Navegador local: formulario, error por fecha vacía conservando campos, alta persistida, limpieza y foco en nombre; advertencia y confirmación de duplicado, seguidas de segundo éxito. Revisión visual desktop y viewport móvil 390 × 844 sin desbordamiento horizontal (scrollWidth 375, innerWidth 390). Capturas locales fuera de Git: cu01-exito.jpg, cu01-duplicado.jpg y cu01-movil.jpg en la carpeta del proyecto.
- Consulta de lectura posterior en Supabase de desarrollo: exactamente un profesional, dos pacientes, cero fichas y cero sesiones. Ambos pacientes pertenecen al profesional demo. No se modificaron filas ajenas.

## Trazabilidad

| Requisito | Evidencia                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF-01–03  | paciente.test.ts: vacíos, calendario, bisiestos, hoy/mañana Montevideo, nombres y teléfono; PacienteForm.test.tsx: etiquetas y errores; navegador: fecha obligatoria     |
| RF-04–06  | registrar.test.ts y scripts/database-tests/pacientes.mjs: persistencia, duplicados, token alterado/vencido y profesional ajeno; demo real de alta y confirmación         |
| RF-07     | PacienteForm.test.tsx: cancelar sin llamar al servicio, volver a editar y descartar token al cambiar datos                                                               |
| RF-08–09  | PacienteForm.test.tsx y client.test.ts: doble clic, errores públicos, datos conservados, timeout y ausencia de reintentos/suceso falso                                   |
| RF-10     | routes.test.ts y PostgreSQL: contexto ausente/inválido, producción, identidad enviada por cliente y profesional inexistente                                              |
| RF-11     | Esquema y ensayos PostgreSQL: ID/timestamps generados, sin edad ni alta automática de ficha/sesiones; conteos remotos de demo                                            |
| RF-12     | UI y navegador: confirmación, formulario vacío y foco en nombre después de persistir                                                                                     |
| RNF-01–03 | Revisión: contexto servidor, filtros por profesional, loopback, TLS heredado, .env ignorado y dominio sin frameworks; API rechaza identidad/origen/JSON/tamaño indebidos |
| RNF-04–07 | UI etiquetada, aria-describedby/invalid/status, botones nativos; check y PostgreSQL; límites y contrato en plan/workflow                                                 |

Pruebas redactadas antes de implementar reglas y rutas: se observó fallo con comportamiento ausente y luego verde. Durante integración se corrigieron un import de Express, selección ambigua de status en tests y formato. El runner PostgreSQL se ajustó para ejecutar CU01 después del rollback de fixtures previas y evitar bloqueo de lectura del profesional. Todos quedaron resueltos antes del cierre.

La automatización del control date del navegador no conservó la fecha con fill; se completó mediante su acción accesible setValue y se verificó el valor antes del envío. El clic DOM de confirmación falló sin enviar y se completó con el botón accesible; se verificaron éxito y conteos antes de cerrar. Una consulta de evidencia usó un nombre de timestamp inexistente; falló sin escribir y se corrigió a una consulta de lectura sin orden. Estos fallos de ensayo no se presentan como pruebas exitosas.

## Demo autorizada y límites

Proyecto vrqmpdedckkgxpdleepr, exclusivamente desarrollo. Profesional ficticio: 1addd3b9-c348-48ff-ba6d-6269205dadb1 (Profesional Demo PsicologIA, profesional-demo@example.invalid). Pacientes ficticios Paciente Demo, nacimiento 2000-01-01, teléfono sintético +00000000000:

- 7cec6fe5-6a2e-4763-9786-db358d9b7129.
- 7bd002b7-50af-4498-b145-929fbacf4d8c (duplicado confirmado).

No se borran automáticamente. No crear más pacientes bajo la autorización de este lote. El seed solo configura el profesional y el contexto local y exige destino explícito; no cambia permisos ni esquema.

La separación por profesional se comprobó en aplicación con datos sintéticos de dos profesionales. No demuestra autenticación o autorización productiva: el backend usa una identidad ficticia fija y un rol técnico SQL. No hay listado, perfil, fichas, sesiones, despliegue ni pacientes reales. No se ensayó con lector de pantalla ni navegadores móviles físicos; la revisión móvil fue de viewport. Un timeout de escritura puede ser incierto; no hay promesa de idempotencia global.

CI remoto de CU01 pendiente hasta publicación autorizada. Instrucciones de ejecución y variables en docs/DEVELOPMENT_WORKFLOW.md. 0E queda cerrada por las aprobaciones previas; no habilita CU02–CU11.
