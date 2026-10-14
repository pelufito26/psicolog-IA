# 002 — Calidad y comprobaciones automáticas (Iteración 0C)

Estado: aprobada.
Revisión: 0C-r1, 14 de octubre de 2026.
Aprobación humana: el usuario respondió «ok» a la solicitud de aprobar 0C-r1. Autoriza preparar plan y tareas; implementación y publicación todavía pendientes.

## Contexto y objetivo

La base 0B tiene pruebas, comprobación de tipos y compilación ejecutables localmente, pero el repositorio todavía no configura lint, formato o GitHub Actions. Se busca repetir automáticamente los controles de cada cambio y hacer visibles sus resultados antes de incorporar una PR.

Fuentes: AGENTS.md, docs/PROJECT_CONTEXT.md, docs/constitution.md, docs/DEVELOPMENT_WORKFLOW.md y evidencia de specs/001-base-tecnica/validation.md.

## Actores e historia

Desarrollador y revisor del repositorio.

HU-01: Como revisor, quiero ver resultados automáticos de calidad, pruebas y compilación de una PR para evaluar su incorporación con evidencia reproducible.

## Definiciones

- Lint: revisión estática de errores y prácticas de código mediante ESLint; no sustituye pruebas o revisión humana.
- Formato: convenciones reproducibles mediante Prettier, con comprobación sin escritura y aplicación explícita.
- CI: ejecución de controles en GitHub Actions para la revisión exacta del cambio.
- Resultado satisfactorio: todos los controles obligatorios pasan. Que CI pase no demuestra seguridad clínica ni cumplimiento de funcionalidades no cubiertas.

## Requisitos funcionales

- RF-01: CUANDO se ejecuta el comando documentado de lint, EL PROYECTO revisa código TypeScript/React y configuración propia incluidos en su alcance, informa errores con ubicación y devuelve un resultado de fallo si hay infracciones.
- RF-02: CUANDO se ejecuta la comprobación de formato, EL PROYECTO detecta diferencias respecto de las convenciones acordadas y falla sin modificar archivos.
- RF-03: CUANDO se ejecuta explícitamente el comando de aplicación de formato, EL PROYECTO formatea únicamente archivos propios dentro del alcance acordado. No altera referencias metodológicas, salidas generadas ni contenido fuera de ese alcance.
- RF-04: CUANDO se abre o actualiza una PR dirigida a main, EL REPOSITORIO ejecuta instalación reproducible, lint, comprobación de formato, tipos, pruebas y build sobre la revisión de esa PR.
- RF-05: CUANDO se incorpora un cambio en main, EL REPOSITORIO ejecuta los mismos controles sobre esa revisión.
- RF-06: SI falla un control obligatorio, ENTONCES LA EJECUCIÓN de CI informa fallo; no se declara satisfactoria por haber pasado otro control.
- RF-07: CUANDO un revisor consulta la ejecución, GITHUB muestra los controles y sus resultados o registros asociados a la revisión comprobada.
- RF-08: CUANDO el desarrollador sigue las instrucciones locales desde una copia limpia, EL PROYECTO permite repetir los controles de CI con los comandos documentados y las mismas convenciones.

## Requisitos no funcionales

- RNF-01: La configuración conserva npm workspaces, archivo de bloqueo y Node 24 aprobado. No cambia el stack, contratos de disponibilidad ni comportamiento visible de 0B.
- RNF-02: CI no requiere secretos, credenciales Supabase, datos de pacientes, servicios de producción ni permiso de escritura al repositorio. La aplicación y sus pruebas usan únicamente datos sintéticos.
- RNF-03: La automatización no publica artefactos de aplicación, hace merge, despliega ni cambia permisos o protecciones del repositorio.
- RNF-04: Las versiones de herramientas y acciones adoptadas quedan registradas y fijadas de forma reproducible; validar compatibilidad antes de instalar.
- RNF-05: Cada ejecución tiene un tiempo máximo definido en el plan; un bloqueo o vencimiento no queda como éxito.
- RNF-06: Las exclusiones de lint/formato son explícitas y justificadas. No se silencian errores mediante exclusiones indiscriminadas. La copia documental de metodología se preserva íntegra.
- RNF-07: La evidencia registra comandos, resultados y revisión comprobada. La validación remota se mantiene pendiente hasta que se publique el cambio con autorización y se observe GitHub Actions.

## Casos de aceptación

| Escenario                                                      | Resultado esperado                                                       | Requisitos     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------- |
| Código propio con infracción de lint introducida temporalmente | Lint falla y señala el problema; retirar la infracción antes de entregar | RF-01, RF-06   |
| Archivo propio con formato incorrecto                          | Comprobación falla sin escribir; aplicación explícita lo corrige         | RF-02–03       |
| Controles locales de la revisión final                         | Lint, formato, tipos, pruebas y build pasan                              | RF-08          |
| PR hacia main y cambios en main                                | Se disparan los controles acordados para la revisión correspondiente     | RF-04–05       |
| Fallo deliberado en revisión de ensayo autorizada              | CI falla; la revisión final corregida pasa                               | RF-06–07       |
| Inspección del workflow y sus efectos                          | Permisos mínimos, sin secretos o despliegue y tiempo limitado            | RNF-02–05      |
| Revisión de cambios                                            | Sin modificaciones en referencias ni funcionalidad clínica añadida       | RNF-01, RNF-06 |

La prueba deliberada remota no se incorpora a main. Si no puede ejecutarse de forma autorizada, documentar el límite y mantener pendiente la aceptación remota correspondiente.

## Fuera de alcance

Supabase y migraciones, autenticación, funciones clínicas, despliegue, cobertura mínima porcentual impuesta sin justificación, auditoría de seguridad completa, instalación de skills y multiagentes. Tampoco se configuran reglas para impedir merge desde GitHub: CI informa resultados; imponer checks obligatorios cambia protecciones y requiere una decisión separada.

## Decisiones que presentará el plan

Versiones compatibles de ESLint, sus integraciones TypeScript/React y Prettier; reglas concretas y política de advertencias; alcance y exclusiones de formato/lint; nombres de comandos; runner de CI; acciones y revisiones fijadas; versión de npm/Node; tiempo máximo; estructura de controles y ensayo de fallo. No se consideran aprobadas por redactar esta especificación.

## Puertas y cierre

Primero aprobar esta revisión, luego preparar plan y tareas para aprobación conjunta. Implementar localmente dentro del alcance aprobado. Publicar la rama y PR únicamente con autorización vigente para este cambio.

El cierre local requiere todos los controles locales satisfactorios, instrucciones verificadas y cambios revisados. La etapa completa requiere además observar los disparadores y resultados remotos obligatorios; separar claramente esa evidencia de la comprobación local del archivo de workflow.
