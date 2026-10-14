# PsicologIA — Propuesta de preparación e Iteración 0

Estado: propuesta para revisión, 14 de octubre de 2026. No autoriza implementación.

Actualización: la etapa documental 0A y su adaptación metodológica fueron aprobadas e incorporadas localmente. Ver DECISIONS.md (DEC-001) y VALIDACION_0A.md. Las etapas técnicas 0B–0E siguen como propuesta; la publicación de los cambios documentales está pendiente.

## Evidencia y límites

El repositorio del producto contiene README.md y docs/PROJECT_CONTEXT.md. El README de la raíz habla de «esta carpeta» como documentación y enumera documentos previstos aún inexistentes. El archivo de contexto conserva las decisiones proporcionadas por el usuario.

El repositorio pelufito26/desarrollo-ia-metodologia ya es accesible. Se revisaron README.md, fundamentos/harness-engineering.md, guia-implementacion-harness.md, guia-integracion-codex.md, metodologias/sdd.md y plantillas/AGENTS.md. Los CU01–CU11 disponibles son resúmenes; no reemplazan sus especificaciones completas.

## Propuesta de AGENTS.md en la raíz

```markdown
# Trabajo en PsicologIA

- Leer docs/PROJECT_CONTEXT.md antes de proponer o implementar cambios. Es la fuente inicial de decisiones aprobadas.
- Consultar la especificación completa del caso de uso involucrado cuando esté disponible. Si falta información necesaria, señalarla y pedir validación; no inventar reglas.
- Distinguir decisiones aprobadas, propuestas y preguntas pendientes. Registrar las nuevas decisiones aprobadas en docs/DECISIONS.md cuando exista.
- Implementar únicamente el alcance autorizado. Los planes y estructuras propuestas no autorizan crear código, dependencias ni archivos vacíos.
- Mantener el monolito modular y separar presentación, aplicación, dominio e infraestructura. El dominio no depende de frameworks ni de Supabase.
- Usar exclusivamente datos ficticios hasta verificar autenticación y autorización reales. No exponer públicamente operaciones clínicas del prototipo.
- Cada profesional accede solo a sus pacientes; el administrador no accede a datos personales ni clínicos. Verificar autorización en el backend cuando se implemente.
- No versionar secretos ni incluir credenciales privilegiadas en el frontend.
- Trabajar en cambios pequeños, preferentemente mediante rama y PR. Ejecutar verificaciones proporcionales al cambio y comunicar sus resultados y límites.
- Actualizar la documentación afectada por cada decisión aprobada. Evitar duplicar el contexto maestro.
```

## Documentación mínima propuesta

1. Conservar PROJECT_CONTEXT.md como fuente inicial; no dividirlo ni copiar sus secciones ahora.
2. Crear AGENTS.md tras aprobar su contenido, como entrada breve a esa fuente.
3. Corregir README.md para describir el repositorio, enlazar el contexto y distinguir documentación existente de prevista.
4. Crear DECISIONS.md con las primeras decisiones nuevas aprobadas: identificador, estado, fecha, motivo e impacto. Referenciar ARQ-01–03 del contexto en vez de transcribirlas.
5. Crear USE_CASES.md al recuperar los textos completos de CU01–CU11, conservando su contenido y señalando diferencias con el resumen para validación.
6. Crear DEVELOPMENT_WORKFLOW.md cuando existan comandos reales de instalación, comprobación y ejecución que se puedan verificar.

PRODUCT.md, DOMAIN.md, ARCHITECTURE.md y SECURITY.md pueden incorporarse cuando haya detalle nuevo suficiente. Su creación no es requisito para empezar y no deben ser archivos vacíos ni copias del contexto.

## Confirmado y pendiente

Confirmado: alcance del MVP, modelo de dominio y reglas documentadas, monolito modular, React/Vite/TypeScript, Node/Express/TypeScript, Supabase PostgreSQL, Vitest, ESLint/Prettier y GitHub Actions para lint y pruebas. Autenticación productiva y administración de cuentas quedan para una fase posterior.

Pendiente de aprobación antes de implementar lo que dependa de ello:

- Herramienta de paquetes, versión de Node y organización de dependencias del repositorio.
- Esquema relacional, estrategia de identificadores, restricciones, índices y migraciones.
- Mecanismo de acceso del backend a Supabase y gestión de credenciales.
- Forma segura de representar al profesional actual en el prototipo sin simular protección inexistente.
- Convenciones mínimas de API, validaciones, errores y configuración.
- Validación telefónica, normalización exacta de duplicados y desempate del historial.
- Textos completos de los casos de uso y aprobación de la adaptación de la metodología revisada.

Estas decisiones pueden resolverse por etapas. Teléfono, duplicados y desempate deben estar definidos antes de sus respectivos casos de uso; no bloquean una propuesta documental o un esqueleto técnico autorizado.

## Iteración 0 propuesta, en cambios pequeños

### 0A — Documentación y decisiones iniciales

Aprobar la adaptación metodológica descrita al final de esta propuesta, AGENTS.md y README; registrar decisiones nuevas necesarias para 0B. Recuperar los casos de uso en paralelo. Verificación: enlaces válidos, estados explícitos y ausencia de requisitos inventados.

### 0B — Esqueleto técnico

Tras autorización: preparar apps/web y apps/api con el stack aprobado, configuración de TypeScript y herramienta de paquetes elegida. Crear paquetes compartidos solo si existe una necesidad concreta; no crear módulos vacíos anticipadamente. Verificación: frontend y backend arrancan localmente, compilan y la API responde a una comprobación básica de disponibilidad sin datos clínicos.

### 0C — Calidad y CI

Configurar lint, formato y Vitest; documentar comandos comprobados y ejecutar lint, compilación/comprobación de tipos y pruebas en GitHub Actions. No añadir pruebas que solo repitan configuración. Verificación: una prueba básica relevante funciona localmente y CI detecta un fallo deliberado durante la configuración, sin conservar ese fallo.

### 0D — Persistencia y límites del prototipo

Aprobar el esquema y acceso a Supabase antes de escribir migraciones. Preparar configuración mediante variables de entorno y ejemplos sin secretos; comprobar la conexión desde el backend. Mantener los datos y el entorno de prueba separados, y el uso local con datos ficticios hasta disponer de controles reales. Verificación: migraciones reproducibles en entorno de desarrollo, conexión comprobada, ausencia de secretos versionados y ninguna clave privilegiada en el frontend. La conexión no demuestra autorización entre profesionales.

### 0E — Revisión de preparación para CU01

Comprobar instrucciones reproducibles desde una copia limpia, CI y migraciones. Resolver la especificación y criterios de aceptación de CU01, incluido teléfono y duplicados. Presentar el plan de CU01 para autorización separada; no implementar el registro de pacientes dentro de Iteración 0.

## Criterio de cierre de Iteración 0

El proyecto arranca localmente siguiendo instrucciones verificadas, las comprobaciones pasan, la configuración no contiene secretos y las migraciones acordadas son reproducibles. Las limitaciones de seguridad están documentadas y el prototipo solo usa datos ficticios. Existe una especificación suficiente y aprobada para abordar CU01. No se declara que el sistema sea apto para datos reales ni que tenga aislamiento de usuarios verificado.

## Próximo cambio recomendado

Aprobar primero 0A: AGENTS.md y corrección del README, más el registro de decisiones nuevas que efectivamente se aprueben. Luego presentar opciones concretas para las decisiones técnicas de 0B y 0D. Esta propuesta no crea infraestructura, cuentas, tablas ni código del producto.

## Adaptación propuesta tras revisar la biblioteca metodológica

La biblioteca es una referencia general y declara expresamente que todavía no se ha aplicado a PsicologIA. Su lectura no instala un harness ni una skill.

- Añadir docs/constitution.md con principios verificables propios de PsicologIA: privacidad, datos ficticios, aislamiento por profesional, reglas de dominio y separación de responsabilidades. Referenciar el contexto para el detalle y aprobar el documento antes de usarlo como norma.
- Trabajar por especificación mantenida: specs/NNN-nombre/spec.md explica objetivo, alcance, requisitos identificados y aceptación; plan.md describe diseño y verificaciones; tasks.md recoge tareas pequeñas con dependencias y criterios de cierre. No crear estas carpetas vacías: redactarlas al abordar cada cambio.
- Acordar dos puertas principales: aprobación de la especificación aclarada y aprobación conjunta del plan y tareas. La autorización para implementar debe indicar el alcance; no repetir aprobaciones ya vigentes. Publicación, merge, despliegue y cambios de permisos conservan sus autorizaciones específicas cuando correspondan.
- Registrar evidencia por requisito: tarea, prueba o revisión, resultado y versión comprobada. Una comprobación no ejecutada queda pendiente, no aprobada.
- Materializar una copia seleccionada y versionada de la biblioteca si se aprueba, registrando el commit de origen obtenido de GitHub. Mantenerla como referencia y separar las normas propias del proyecto; no adoptar automáticamente futuras actualizaciones.
- Usar MEMORY.md solo si aporta recuperación de estado entre sesiones, con hechos y pendientes, sin duplicar decisiones ni guardar secretos.
- Posponer instalación de la skill SDD y cualquier configuración multiagente. Revisar su contenido y necesidad antes de proponerlas; esta revisión no las activa.

El borrador de AGENTS.md de esta propuesta se ampliará, una vez aprobada esta adaptación, con enlaces a la constitución, biblioteca disponible y especificación activa, además del acuerdo de puertas. Los comandos verificados se añadirán cuando realmente existan.

Fuentes revisadas: https://github.com/pelufito26/desarrollo-ia-metodologia . Esta propuesta sigue siendo un borrador local; no modifica el contexto aprobado ni instala herramientas.
