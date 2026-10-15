# Plan de persistencia de desarrollo

Revisión: 0D-plan-r1. Spec aprobada: 0D-r1. Fecha: 14 de octubre de 2026.
Estado: T1–T4 aprobadas por el usuario mediante «si», el 14 de octubre de 2026. Aplicación remota T5 y creación de acceso T6 pendientes de aprobación concreta.
Destino identificado: psicolog-ia, vrqmpdedckkgxpdleepr, us-east-1, PostgreSQL 17.11. El usuario confirmó uso exclusivo de desarrollo con datos ficticios. Inspección inicial: sin tablas de aplicación; zona de base UTC. Reinspeccionar antes de aplicar.

## Esquema propuesto

Schema privado psicologia, no incorporado a los schemas expuestos de la Data API. Nombres snake_case en español, identificadores UUID generados con gen_random_uuid(). No depender de auth.users en esta fase.

| Tabla             | Columnas de dominio propuestas                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| profesionales     | id, nombre, apellido, email                                                                                                                 |
| pacientes         | id, profesional_id, nombre, apellido, fecha_nacimiento, telefono                                                                            |
| fichas_clinicas   | id, paciente_id, motivo_consulta, antecedentes_personales, antecedentes_familiares, medicacion, evaluacion_clinica, observaciones_generales |
| sesiones_clinicas | id, paciente_id, profesional_id, fecha_sesion, anotaciones_clinicas                                                                         |

Todas incluyen fecha_creacion y fecha_ultima_modificacion como timestamptz. Nacimiento y sesión son date; teléfono y campos clínicos son text. IDs y referencias obligatorios; campos opcionales de ficha admiten NULL y texto vacío sin inventar reglas de transformación. No almacenar edad ni profesional_id en fichas.

Campos obligatorios de texto rechazan vacío o solo espacios. Email profesional: índice único sobre lower del valor tras retirar espacios periféricos (incluido whitespace), con expresión SQL acordada en pruebas; no añadir validación de formato de email no confirmada. Teléfono: obligatorio y no vacío, sin regex nacional ni normalización definitiva todavía.

## Integridad y fechas

- FK pacientes.profesional_id hacia profesionales.id.
- UNIQUE paciente_id en ficha, con FK al paciente.
- UNIQUE (id, profesional_id) en pacientes y FK compuesta (paciente_id, profesional_id) de sesión hacia esa pareja. Impide profesional ajeno incluso ante escrituras directas.
- No imponer UNIQUE de nombre/apellido/nacimiento ni de paciente/fecha_sesion.
- Todas las FK con ON DELETE RESTRICT y sin cascadas. El backend no recibe DELETE. Esto protege integridad y no implementa eliminación clínica.
- Triggers SECURITY INVOKER con referencias cualificadas mantienen timestamps, preservan fecha_creacion e impiden cambios de IDs, paciente_id de fichas/sesiones y profesional_id de pacientes/sesiones. La inmutabilidad adicional de asociaciones de ficha evita trasladar información clínica sin una decisión explícita.
- fecha_ultima_modificacion se inicializa al crear y se actualiza al modificar, con reloj de base; no se usa como versión ni historial.
- Propuesta para fechas clínicas: hoy se define en America/Montevideo, independientemente del UTC del servidor. Validar fecha_nacimiento y fecha_sesion al insertar o cambiar esos campos mediante trigger; no usar una restricción que dependa de CURRENT_DATE para filas históricas. Las pruebas cubrirán límites de día y mañana.
- Índices: pacientes(profesional_id), sesiones(paciente_id, fecha_sesion DESC), sesiones(profesional_id). La unicidad de ficha cubre su FK. No inventar desempate del historial ni índices para búsquedas todavía no definidas.

No aplicar estas decisiones de esquema o zona hasta aprobar el plan.

## Acceso y permisos propuestos

No añadir cliente Supabase ni claves al frontend. Usar SQL PostgreSQL desde infraestructura del backend mediante pg 8.23.1 y @types/pg 8.23.1, fijados en el lockfile.

Crear grupo NOLOGIN psicologia_backend sin SUPERUSER, CREATEDB, CREATEROLE, BYPASSRLS ni propiedad de objetos. Permitir únicamente USAGE del schema y SELECT/INSERT/UPDATE de sus cuatro tablas. RLS habilitada como defensa adicional; políticas limitadas a ese grupo para el acceso técnico de desarrollo. Estas políticas no acreditan aislamiento entre profesionales y no se reutilizarán como autorización productiva.

Denegar acceso a schema/tablas/funciones para PUBLIC, anon y authenticated y comprobarlo con esos roles. No modificar grants globales de schemas de Supabase. Funciones de triggers sin SECURITY DEFINER y sin EXECUTE público cuando no sea necesario.

Una cuenta LOGIN de backend heredará el grupo anterior y tendrá credencial distinta a postgres. Crear/configurar esa cuenta y contraseña es un paso separado con alcance concreto; no incluir contraseñas en migraciones, herramientas visibles, Git o este documento. No usar la contraseña expuesta en el chat. Hasta configurar la cuenta segura, las pruebas SET ROLE demuestran permisos del grupo, pero no se declara conexión real del backend.

Los permisos de migración corresponden al conector administrativo y no a esa cuenta del backend. No se añade un administrador de producto.

## Conexión y comprobación

Usar host/puerto/usuario reales copiados de Connect en Supabase, no construir el host del pooler por región. Conexión directa si hay IPv6 disponible; Session pooler si el entorno necesita IPv4. No usar transaction pooling para migraciones o ensayos que dependen de sesiones.

Configurar DATABASE_URL y, si corresponde, certificado CA en archivo local excluido de Git del backend. Ejemplo versionado solo con marcadores vacíos; ninguna variable VITE_ contiene credenciales. TLS verifica certificados; no usar rejectUnauthorized:false. Confirmar CA/configuración contra el certificado del proyecto.

Pool máximo de dos conexiones, timeout de conexión de cinco segundos, statement_timeout de cinco segundos e idle timeout de diez segundos. Cerrar el pool al terminar la comprobación. Cliente creado bajo demanda: disponibilidad de 0B no consulta PostgreSQL ni necesita configuración.

Comando explícito db:check (no endpoint web) identifica configuración ausente, conecta con la cuenta restringida, hace SELECT 1 e inserta/consulta datos ficticios únicos dentro de transacción que termina con ROLLBACK. Salida: éxito/fallo y código de proceso, sin URL, contraseña, valores clínicos o errores internos completos. Consultas parametrizadas. No implementar CRUD de pacientes ni repositorios clínicos completos antes de CU01.

## Migraciones y pruebas reales

CLI Supabase 2.121.0 como dependencia de desarrollo fijada. Consultar --help de los comandos antes de utilizarlos. Crear cada archivo mediante supabase migration new; no inventar nombres de timestamp.

Preparar migración SQL revisable que crea schema, tablas, restricciones, grupo y permisos sin credenciales. Para el Supabase remoto, usar apply_migration después de aprobación del SQL y destino, conservando contenido e historial del archivo. No iterar creando objetos remotos a ciegas. No ejecutar resets, DROP o SQL destructivo en el proyecto.

Pruebas de esquema mediante PostgreSQL 17 real: CI usa servicio desechable postgres:17 con credenciales sintéticas, sin secretos Supabase. Un runner Node con pg aplica migraciones en una base vacía y comprueba restricciones/roles con transacciones y savepoints; repetir en otra base desechable permite comparar estructura. Los datos ficticios de cada ensayo se revierten.

El equipo no tiene Docker, psql ni CLI detectados. No instalar Docker o PostgreSQL globalmente de forma implícita. Pruebas unitarias/controles existentes funcionan localmente; el ensayo PostgreSQL puede ejecutarse en CI tras autorización de publicación, o en instancia PostgreSQL 17 de prueba que el usuario habilite. No llamar «prueba de PostgreSQL real» a mocks.

La conexión a Supabase se verifica aparte con db:check y configuración local segura. Si faltan credenciales o red, ese requisito permanece pendiente; el conector por sí solo no demuestra que Node pueda conectarse.

## Archivos previstos

- supabase/migrations/: archivos generados por CLI, SQL sin secretos.
- apps/api/src/infrastructure/database/: pool/configuración y comando de comprobación con pruebas de errores.
- scripts/database-tests/: ensayos de migraciones, integridad, fechas, permisos y reproducibilidad.
- package.json y workspaces: pg, tipos y CLI fijados; comandos separados de unitarios/integración.
- .github/workflows/ci.yml: job PostgreSQL desechable, sin acceso al proyecto externo.
- docs/DATABASE.md y DEVELOPMENT_WORKFLOW.md: schema, límites y comandos comprobados; DECISIONS.md y validation.md: decisiones y evidencia.
- .env.example del backend: marcadores sin credenciales, cubierto por exclusión existente.

No modificar PROJECT_CONTEXT.md, referencias ni comportamiento frontend. Los archivos SQL propios se revisan como SQL; no añadir formateador SQL o exenciones generales para pasar controles.

## Verificación y tareas

T1: preparar dependencias y migración revisable. T2: pruebas reales de restricciones y fechas. T3: infraestructura/comando con errores controlados. T4: CI desechable y documentación. T5: aprobar SQL concreto y aplicar al proyecto identificado. T6: configurar cuenta restringida, comprobar conexión real y registrar evidencia.

Cobertura: RF-01–02 por aplicación en dos bases vacías; RF-03–07 por casos positivos/negativos de cada tabla y regla; RF-08–09 por transacción de db:check y fallos de configuración/red/timeout; RF-10 por regresión de health sin credenciales; RNF por revisión de permisos, SQL, secretos, matrices y controles de 0C.

## Puertas y límites de autorización

Aprobar plan y T1–T4 permite preparar código, SQL y pruebas dentro de la rama local. SQL remoto y nuevas credenciales se concretan antes del paso final: mostrar migración exacta y permisos para aprobar T5–T6. No ejecutar esos pasos por aprobar un diseño general.

Publicar la rama/CI requiere autorización para 0D; el merge sigue reservado al usuario. No modificar tablas existentes, cuentas ajenas ni schemas del sistema. Si aparece contenido nuevo al reinspeccionar el destino, detener la aplicación remota y revisar compatibilidad.

Fuentes: documentación oficial Supabase sobre conexión, schemas y roles; node-postgres SSL; PostgreSQL 17 Constraints; skills Supabase/Postgres. Las guías recomiendan cuenta distinta de postgres y las FK compuestas permiten exigir la pertenencia de sesión. No se atribuyen controles productivos a esta base de desarrollo.
