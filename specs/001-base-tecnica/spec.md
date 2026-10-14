# 001 — Base técnica local (Iteración 0B)

Estado: aprobada.
Revisión: 0B-r1, 14 de octubre de 2026.
Aprobación humana: el usuario respondió «si» a la solicitud de aprobar el alcance de 0B-r1, el 14 de octubre de 2026. Autoriza preparar plan y tareas; la implementación espera la aprobación conjunta de ambos.

## Contexto y objetivo

PsicologIA dispone de contexto y metodología aprobados, pero todavía no tiene una aplicación ejecutable. Esta etapa debe permitir arrancar localmente una interfaz y una API, comprobar su comunicación y generar sus compilaciones sin incorporar operaciones clínicas.

Fuentes: docs/PROJECT_CONTEXT.md, docs/constitution.md, docs/DECISIONS.md y docs/metodologia/referencia/metodologias/sdd.md. Se conserva el stack aprobado: React + Vite + TypeScript y Node.js + Express + TypeScript.

## Actor e historia

Actor: persona que desarrolla o revisa el proyecto en un entorno local.

HU-01: Como desarrollador, quiero instalar, ejecutar y comprobar la base del frontend y backend para comenzar los casos de uso sobre una estructura reproducible.

## Definiciones

- Base técnica: interfaz inicial, comprobación de disponibilidad de la API, configuración y documentación de ejecución.
- Disponibilidad: el proceso de API puede atender solicitudes. No demuestra conexión con base de datos, autenticación ni aptitud para datos reales.
- Local: procesos accesibles únicamente desde el propio equipo por defecto; no se prepara un despliegue público.

## Requisitos funcionales

- RF-01: CUANDO el desarrollador sigue las instrucciones desde una copia limpia del repositorio con los prerrequisitos documentados, EL PROYECTO permite instalar las dependencias sin archivos locales no versionados obligatorios.
- RF-02: CUANDO se inicia la interfaz con el comando documentado, EL SISTEMA muestra una pantalla identificada como PsicologIA y como base técnica en preparación, sin formularios ni datos clínicos.
- RF-03: CUANDO se consulta la comprobación de disponibilidad de la API en ejecución, EL SISTEMA responde HTTP 200 y un cuerpo JSON documentado que no contiene secretos ni datos personales.
- RF-04: CUANDO se abre la interfaz con la API disponible, EL SISTEMA consulta su disponibilidad y muestra el estado confirmado por la respuesta.
- RF-05: SI la API no responde, responde con error o devuelve un formato inesperado, ENTONCES LA INTERFAZ muestra que no pudo confirmar su disponibilidad y sigue siendo utilizable. No muestra éxito sin respuesta válida.
- RF-06: MIENTRAS la consulta está pendiente, LA INTERFAZ muestra un estado de comprobación. La consulta finaliza con resultado o error dentro de un plazo definido en el plan, sin espera indefinida.
- RF-07: CUANDO se ejecutan los comandos documentados de comprobación de tipos y compilación, EL PROYECTO verifica y genera las salidas de frontend y backend sin errores.
- RF-08: CUANDO se ejecuta el backend compilado siguiendo las instrucciones, LA API ofrece la misma comprobación de disponibilidad que en desarrollo.

## Requisitos no funcionales

- RNF-01: La instalación usa un archivo de bloqueo versionado y una versión soportada de Node documentada; la herramienta y las versiones se justificarán en el plan antes de instalar.
- RNF-02: La base no requiere Supabase, credenciales externas ni datos de pacientes para arrancar y comprobar su disponibilidad.
- RNF-03: Los procesos se vinculan a la interfaz local del equipo por defecto. La configuración no habilita acceso público ni orígenes externos arbitrarios.
- RNF-04: No se versionan secretos, dependencias descargadas, salidas de compilación ni archivos de configuración local con valores privados.
- RNF-05: El frontend no importa código del backend. Esta etapa no introduce lógica clínica acoplada a frameworks ni paquetes compartidos sin una necesidad concreta.
- RNF-06: El estado de disponibilidad se expresa en texto, no solo mediante color; el error no deja la pantalla vacía ni expone detalles internos.
- RNF-07: Los requisitos de respuesta de API y los estados de interfaz tienen pruebas o revisión reproducible proporcionadas al cambio. La evidencia identifica resultado, revisión y requisitos cubiertos; no se declara una prueba no ejecutada como aprobada.

## Casos límite y aceptación

| Escenario                              | Resultado esperado                                                 | Requisitos    |
| -------------------------------------- | ------------------------------------------------------------------ | ------------- |
| Instalación desde copia limpia         | Instrucciones suficientes y dependencia bloqueada reproducible     | RF-01, RNF-01 |
| Frontend y API activos                 | Identidad visible y disponibilidad confirmada por respuesta válida | RF-02–04      |
| API apagada                            | Mensaje legible de disponibilidad no confirmada                    | RF-05, RNF-06 |
| Respuesta incorrecta o error HTTP      | No se informa éxito; pantalla permanece utilizable                 | RF-05         |
| Solicitud que no termina               | Estado pendiente seguido de error al vencer el plazo acordado      | RF-06         |
| Backend compilado                      | Arranca y responde como la API de desarrollo                       | RF-07–08      |
| Inspección de archivos y configuración | Sin datos reales ni secretos; servicios locales por defecto        | RNF-02–05     |

Si un puerto está ocupado, las instrucciones deben permitir identificar y resolver el conflicto; no detener procesos ajenos automáticamente ni cambiar la configuración silenciosamente.

## Fuera de alcance

Supabase y migraciones (0D); autenticación y simulación de profesional; registro/listado de pacientes; fichas y sesiones; diseño final de interfaz; despliegue; instalación de skills o multiagentes. La configuración completa de lint, formato y GitHub Actions pertenece a 0C; aquí solo se incorporan las verificaciones necesarias para demostrar estos requisitos.

## Decisiones que debe presentar el plan

Herramienta de paquetes y versión de Node; organización de dependencias; versiones compatibles del stack; comandos de ejecución; puertos y mecanismo de comunicación local entre interfaz y API; ruta y formato de la comprobación de disponibilidad; plazo de la consulta; archivos afectados y pruebas por requisito. Todavía no están aprobadas y no se introducen aquí como decisiones consumadas.

Los detalles de teléfono, duplicados, esquema relacional y casos de uso completos no bloquean esta base porque no incorpora comportamiento clínico.

## Cierre y próxima puerta

Todos los requisitos obligatorios deben tener evidencia satisfactoria. La documentación debe permitir repetir instalación, arranque y compilación desde una copia limpia. No se cierra con fallos o comprobaciones obligatorias pendientes.

Primera puerta: aprobar esta revisión o corregir su alcance. Luego preparar plan.md y tasks.md con las decisiones concretas para aprobación conjunta. No implementar antes de esa segunda puerta.
