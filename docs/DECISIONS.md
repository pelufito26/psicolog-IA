# Decisiones de PsicologIA

Las decisiones originales de producto y ARQ-01–03 permanecen en PROJECT_CONTEXT.md. Este registro recoge decisiones posteriores.

## DEC-001 — Adoptar la preparación documental y el método SDD

- Estado: aprobado.
- Fecha: 14 de octubre de 2026.
- Evidencia: el usuario indicó «perfecto, avancemos» después de revisar la propuesta de incorporar la metodología en 0A.
- Alcance: AGENTS.md, constitución, README, referencia metodológica versionada y registro de validación. No incluye implementación técnica ni publicación de estos archivos.
- Método: aprobar la especificación aclarada y luego aprobar conjuntamente plan y tareas. Mantener requisitos, tareas y evidencia vinculados en cada cambio.
- Referencia: pelufito26/desarrollo-ia-metodologia, commit fc42ce6eeba7db41e7faa9edf2e6bff67c634b72.
- Motivo: disponer de contexto recuperable y criterios verificables antes de crear la base técnica.
- Efecto: las especificaciones se crearán con contenido concreto; la copia metodológica es referencia, no una instalación de skills ni de agentes.
- Alternativas: un enlace externo obliga a recuperar la biblioteca en cada entorno; un submódulo añade preparación de checkout. Se adopta una copia documental fijada para lectura local.
- Pendiente: herramienta de paquetes, versión de Node, esquema relacional, acceso a Supabase, simulación del profesional y textos completos de CU01–CU11. Requieren propuestas y aprobación antes de la implementación que dependa de ellos.

## DEC-002 — Base técnica local 0B

Estado: aprobado, 14 de octubre de 2026. El usuario aprobó spec 0B-r1 y después el plan y T1–T5 tras aclarar que la API es el backend propio. Alcance: base local con npm workspaces, Node 24 LTS, frontend React/Vite y API Express, pruebas y compilación; sin Supabase, funciones clínicas o publicación. Versiones y alternativas: specs/001-base-tecnica/plan.md. Evidencia: specs/001-base-tecnica/validation.md. La autorización no incluye push, merge o despliegue de esta etapa.

## DEC-003 — Calidad local y CI de 0C

Estado: aprobado, 14 de octubre de 2026. El usuario aprobó spec 0C-r1 y el plan/tareas 0C-plan-r1 y 0C-tasks-r1 mediante «sip», incluido pasar TypeScript de 7.0.2 a 6.0.3 para satisfacer el soporte declarado de typescript-eslint 8.71.2. Se conservan stack, contratos y Node 24.21.0; las verificaciones de 0B se repiten.

Se adoptan ESLint, Prettier, comando check y workflow de lectura para PR/main, con acciones fijadas por SHA. Autorización: instalación, formato inicial, correcciones mínimas y validación local. Sin publicación, merge, despliegue ni protección de ramas. La evidencia remota de GitHub queda pendiente hasta la publicación autorizada. Versiones, reglas y alternativas en specs/002-calidad-ci/plan.md.

## DEC-004 — Preparación de persistencia 0D

El usuario confirmó el proyecto vrqmpdedckkgxpdleepr como desarrollo con datos ficticios, aprobó spec 0D-r1 y luego T1–T4 del plan 0D-plan-r1 mediante «si». Incluye schema privado, restricciones, zona clínica America/Montevideo, pg y CLI fijados, infraestructura de comprobación y pruebas. No autoriza aplicación remota T5, creación de cuenta/credencial T6 ni publicación. La preparación se validó con PostgreSQL portátil 17.10 en dos bases desechables locales; no se instaló un servicio global. El nombre de migración se generó por CLI. Ver specs/003-persistencia/validation.md.

## DEC-005 — Aplicación aprobada de T5

El 15 de octubre de 2026 el usuario aprobó el archivo SQL concreto y su destino de desarrollo vrqmpdedckkgxpdleepr. Se aplicó la migración base_psicologia con versión remota 20261015140453. Se alineó el nombre local con ese historial sin cambiar el SQL. Permisos e integridad comprobados con datos ficticios y rollback. Esta aprobación no incluye cuenta LOGIN, nueva contraseña o configuración de conexión del backend (T6).

## DEC-006 — Cuenta restringida y conexión T6

Aprobada por el usuario el 15 de octubre de 2026, incluida reanudación tras detener el paso de cifrado interactivo. Cuenta psicologia_app exclusivamente de desarrollo, con LOGIN y membresía del grupo existente, sin borrado ni administración. Credencial nueva local excluida de Git; conexión directa verificada mediante CA oficial y TLS 1.3. Ensayos de backend y permisos reales satisfactorios con rollback. No se autoriza publicación por concluir T6 ni se considera autorización clínica productiva.

## DEC-007 — CU01 y contexto ficticio de desarrollo

Aprobado el 15 de octubre de 2026: el usuario pidió una propuesta basada en el resumen, aprobó CU01-r1 mediante «sisi vamo» y aprobó después CU01-plan-r1/CU01-tasks-r1 mediante «si». Se adoptan teléfono de 7–15 dígitos con + opcional, nombres con espacios normalizados, duplicados por nombre/apellido sin acentos/caso y mismo nacimiento dentro del profesional, advertencia y confirmación explícita. No se atribuyen estas precisiones a un caso original no recuperado.

El profesional ficticio proviene del servidor, habilitado expresamente solo en desarrollo. No equivale a autenticación; el rol SQL técnico no aísla identidades reales. Se autorizaron T1–T6 y la demo en vrqmpdedckkgxpdleepr con un profesional y hasta dos pacientes ficticios. No incluye publicación, merge o despliegue. Implementación sin nuevas dependencias ni cambios al esquema; límites HTTP, token y timeout en el plan. Evidencia en specs/004-registrar-paciente/validation.md.

## DEC-008 — Método proporcional y entregas visibles

Aprobado el 15 de octubre de 2026 mediante «dale, vamos asi»: conservar AGENTS.md como entrada y autoridad, las dos puertas de aprobación, arquitectura, aislamiento, datos ficticios y autorizaciones de publicación/migración. Para funciones pequeñas, especificación breve con requisitos/aceptación/límites; plan y tareas sin duplicar requisitos; evidencia única enlazada a pruebas y CI. Ejecutar el lote aprobado sin consultas rutinarias y resolver decisiones técnicas dentro de su alcance. Consultar nuevas reglas de producto, ampliaciones o efectos no autorizados. Cada entrega agrega un comportamiento visible o resuelve un riesgo concreto. Priorizar el recorrido registrar, encontrar y consultar y luego feedback profesional; no agregar infraestructura sin necesidad. Esta decisión autoriza el ajuste del método y preparar CU02; no aprueba sus reglas propuestas ni su implementación.

## DEC-009 — CU02 aprobado

El 15 de octubre de 2026 el usuario aprobó CU02-r1 mediante «Aprobado». Incluye listado del profesional, edad calculada según Montevideo (29/2 cumple el 1/3 en año no bisiesto), orden normalizado por apellido/nombre/ID, búsqueda parcial literal por nombre o apellido, páginas de 20 y regreso al listado después de CU01. Spec en specs/005-listar-pacientes/spec.md. Plan y tareas requieren su segunda aprobación; esta decisión no autoriza implementación ni amplía CU03 o acceso productivo.

Plan CU02-plan-r1 y tareas CU02-tasks-r1 aprobados posteriormente mediante «avancemos». Autorización del lote local T1–T4, incluida demo de lectura con pacientes ficticios existentes; no nuevas escrituras remotas, publicación o despliegue.
