# Plan de calidad y CI

Revisión: 0C-plan-r1, 14 de octubre de 2026.
Spec aprobada: 0C-r1. Estado: aprobado. El usuario respondió «sip» al pedido de aprobación conjunta del plan y tareas, incluido TypeScript 6.0.3. Alcance: T1–T5 locales; publicación y ejecución remota pendientes.

## Compatibilidad y decisiones

La base usa TypeScript 7.0.2. typescript-eslint 8.71.2 declara soporte >=4.8.4 <6.1.0 tanto en documentación como en sus pares de npm. No instalar ignorando ese conflicto. Se propone cambiar exclusivamente TypeScript a 6.0.3 y comprobar nuevamente tipos, 13 pruebas y compilación. Se conserva TypeScript estricto, stack, contratos y comportamiento. Registrar esta revisión de la decisión de 0B; no reescribir su evidencia histórica.

Alternativa: mantener TypeScript 7 y diferir el lint completo hasta que su integración tenga soporte. Se descarta en este plan porque deja sin cumplir la revisión TypeScript prevista para 0C. Si se exige conservar 7, revisar el plan antes de implementar.

Dependencias de desarrollo propuestas, versiones exactas consultadas en npm:

| Paquete                     | Versión | Propósito                                  |
| --------------------------- | ------- | ------------------------------------------ |
| typescript                  | 6.0.3   | Compilador compatible con integración lint |
| eslint                      | 10.12.0 | Revisión estática                          |
| @eslint/js                  | 10.0.1  | Reglas recomendadas JavaScript             |
| typescript-eslint           | 8.71.2  | Parser y reglas TypeScript                 |
| eslint-plugin-react-hooks   | 7.1.1   | Reglas de hooks                            |
| eslint-plugin-react-refresh | 0.5.7   | Convenciones de exportación para Vite      |
| globals                     | 17.13.0 | Globales de Node/navegador                 |
| prettier                    | 3.9.10  | Formato reproducible                       |
| eslint-config-prettier      | 10.1.8  | Evitar conflictos entre lint y formato     |

Se conservan Node 24.21.0 en .node-version y npm 11.13.0. No cambiar instalaciones globales ni usar --force o --legacy-peer-deps. Cualquier incompatibilidad adicional que requiera cambiar stack o alcance vuelve a revisión.

## Lint y formato

eslint.config.mjs con configuración plana: reglas recomendadas de JavaScript y TypeScript, sin análisis dependiente de tipos en esta primera etapa; las comprobaciones de tipos siguen separadas. Añadir reglas de hooks para componentes React y comprobación de exportaciones de React Refresh en código de interfaz, sin aplicarla a tests.

Definir globales de navegador en apps/web/src; Node en API y configuración. Revisar todos los .ts/.tsx propios, incluidos tests, y configuración JavaScript. No exigir lint sobre Markdown/JSON. Advertencias causan fallo mediante --max-warnings 0. Resolver infracciones con cambios mínimos de claridad o configuración justificada; no desactivar reglas globalmente para conseguir un resultado verde.

Prettier: comillas simples, punto y coma, sangría de dos espacios, ancho 100, coma final estándar y finales LF. Usar .gitattributes para normalizar texto propio y evitar discrepancias Windows/Linux. Excluir la referencia metodológica de la normalización para preservar su contenido.

Alcance de formato: código y configuración propios, .github, Markdown propio y JSON propio. Excluir node_modules, dist, coverage, archivos locales/secretos, package-lock.json generado, docs/metodologia/referencia/ y docs/PROJECT_CONTEXT.md (fuente inicial preservada). Las exclusiones no ocultan código de aplicación.

Comandos:

- npm run lint: revisión sin escritura.
- npm run format:check: comprobación sin escritura.
- npm run format:write: aplicación explícita de formato sobre el alcance anterior.
- npm run check: lint, formato, tipos, pruebas y build, secuencialmente y con interrupción al primer fallo.

Los comandos de 0B permanecen disponibles. El formato inicial producirá cambios mecánicos en archivos propios; revisar que no alteren contenido de requisitos ni comportamiento.

## Workflow

Crear .github/workflows/ci.yml con nombre «Calidad». Disparadores: pull_request hacia main y push en main. No usar pull_request_target ni ejecutar código con privilegios de escritura.

Un job en ubuntu-24.04, tiempo máximo de 15 minutos, permisos contents: read. Checkout sin persistir credenciales y setup-node leyendo .node-version. Fijar ambas acciones a los SHA completos correspondientes a las versiones revisadas, registrados al final de este documento.

Verificar Node/npm del entorno; fijar npm 11.13.0 dentro del runner efímero. Esto no modifica el equipo del usuario. Sin caché inicialmente: instalación limpia por npm ci en cada ejecución. Después, pasos con nombres separados para lint, formato, tipos, pruebas y build. No usar continue-on-error. Los pasos posteriores se omiten si uno falla y el job informa fallo.

No añadir upload-artifact, despliegue, merge, secretos ni cambios de protección de ramas. Pasar los checks no impedirá por sí solo que alguien haga merge manual.

## Archivos

Configuración raíz: package.json, lockfile, eslint.config.mjs, .prettierrc.json, .prettierignore y .gitattributes. Workflow: .github/workflows/ci.yml. Código propio de apps solo para formato y correcciones mínimas detectadas por lint; no nuevas funciones. Documentación: AGENTS.md, README.md, DEVELOPMENT_WORKFLOW.md, DECISIONS.md y evidencia de esta spec.

PROJECT_CONTEXT.md y docs/metodologia/referencia se conservan intactos. No modificar la evidencia histórica de 0B para fingir que usó TypeScript 6.

## Verificación y cobertura

| Requisitos            | Comprobación                                                                                                                                    | Tarea |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| RF-01, RNF-01, RNF-04 | Instalación compatible y lint: pasa código final, falla infracción temporal identificada                                                        | T1–T2 |
| RF-02–03, RNF-06      | Formato incorrecto temporal: check falla sin cambiar hash; write corrige; referencias intactas                                                  | T3    |
| RF-04–07, RNF-02–05   | Workflow revisado; después de publicación autorizada, observar PR con fallo deliberado y revisión final satisfactoria; observar main tras merge | T4–T5 |
| RF-08, RNF-07         | Copia limpia: npm ci y npm run check; registrar comandos y resultados por revisión                                                              | T5    |

Las infracciones temporales locales se eliminan antes de entregar. La prueba remota, si se autoriza publicación de la etapa, se realiza en la misma rama de PR: publicar primero una infracción controlada, observar fallo, corregir y publicar la revisión final. No hacer merge de la revisión defectuosa, no forzar pushes y explicar ambos resultados. La ejecución push/main solo se valida después del merge autorizado por el usuario.

## Riesgos y autorizaciones

El cambio TypeScript puede exponer incompatibilidades; si las comprobaciones de 0B fallan, corregir solo dentro de este alcance o comunicar el bloqueo antes de ampliarlo. Prettier puede generar un diff amplio; separar cambios mecánicos y preservar las fuentes.

La aprobación de plan y T1–T5 autoriza instalación y verificación local, incluido formato inicial y ajustes de lint. No autoriza push, prueba remota o merge: requieren la autorización de publicación vigente para 0C. La etapa tendrá «validada localmente, remoto pendiente» hasta observar las ejecuciones reales.

Fuentes: https://typescript-eslint.io/users/dependency-versions/ , https://prettier.io/docs/cli y https://prettier.io/docs/ignore . Versiones y pares consultados en npm; releases de acciones consultados en sus repositorios oficiales.

Acciones fijadas propuestas:

- actions/checkout v7.0.1: 3d3c42e5aac5ba805825da76410c181273ba90b1.
- actions/setup-node v7.1.0: 949feb2413d6458794dcd2491c4babbbce0c15c1.
