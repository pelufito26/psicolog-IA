# Validación de 0C

Spec: 0C-r1. Plan: 0C-plan-r1. Tareas: 0C-tasks-r1.
Fecha: 14 de octubre de 2026.
Estado: validada localmente; evidencia remota pendiente.

## Alcance

ESLint y Prettier configurados con versiones fijadas. TypeScript ajustado a 6.0.3 según aprobación; no se cambió el runtime global ni el comportamiento de la aplicación. Se preparó .github/workflows/ci.yml sin publicarlo.

## Resultados

| Requisitos            | Evidencia local observada                                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF-01                 | Lint pasa con cero advertencias. Variable temporal no usada: falla con ubicación y regla @typescript-eslint/no-unused-vars; defecto retirado.                                                                                                                                                          |
| RF-02–03              | Archivo temporal mal formateado: check devuelve fallo sin cambiar su SHA256; write corrige y el siguiente check pasa. Archivo temporal retirado.                                                                                                                                                       |
| RF-08, RNF-01, RNF-04 | Copia limpia sin dependencias ni salidas: npm ci instala 301 paquetes, auditoría informa cero vulnerabilidades; npm run check pasa con Node 24.21.0 y npm 11.13.0. TypeScript 6.0.3 conserva 13 pruebas aprobadas, tipos y build de ambos workspaces.                                                  |
| RNF-02–05             | Workflow con pull_request/main y push/main, contents: read, checkout sin persistir credenciales, sin secretos/caché/publicación/despliegue y timeout de 15 minutos. Pasos secuenciales sin continue-on-error. SHA e inputs confirmados en action.yml de ambos repositorios oficiales (runtime node24). |
| RNF-06                | Revisión de código: cambios mecánicos de Prettier sin cambios funcionales. git diff no registra cambios en PROJECT_CONTEXT.md ni docs/metodologia/referencia/. Lockfile y salidas excluidos del formato.                                                                                               |
| RNF-07                | Esta matriz conserva la distinción entre ensayos locales y resultados remotos pendientes.                                                                                                                                                                                                              |

El conjunto completo comprende lint, format:check, typecheck, 13 pruebas y build. Primera ejecución local satisfactoria y repetición desde copia limpia satisfactoria. Prettier acepta la sintaxis YAML del workflow; esto no prueba la ejecución de GitHub Actions.

No se añadieron pruebas que repitan la configuración. Los ensayos de defectos comprueban las herramientas efectivamente configuradas. git diff --check pasa.

## Remoto pendiente

RF-04–07: observar instalación y controles sobre una PR, ensayo de fallo deliberado autorizado y revisión final satisfactoria. Observar push/main después de merge. El archivo de workflow no sustituye esa evidencia. No se publica, modifica protecciones ni declara 0C completa en esta entrega local.
