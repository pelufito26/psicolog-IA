# Plan de base técnica local

Estado: aprobado. Revisión: 0B-plan-r1, 14 de octubre de 2026.
Especificación aprobada: 0B-r1. Aprobación de plan y tareas: el usuario confirmó «oka, si, esta bien» después de la presentación conjunta y la aclaración sobre la API. Alcance: implementación local de T1–T5; sin publicación.

Resolución de T1: runtime aislado Node 24.21.0 disponible en npm, tipos Node 24.19.2, React/React DOM 19.3.0, Express 5.0.6 y Testing Library DOM 10.4.2. No se modificó Node global. La documentación de releases anuncia 24.22.0, pero el paquete Node disponible en npm al consultar llegaba a 24.21.0; no se afirma que este último sea el parche más reciente publicado por Node.

## Decisiones propuestas

- Usar npm 11 con workspaces apps/web y apps/api y un package-lock.json en la raíz. Ya está disponible en el equipo (11.13.0); no hace falta otro gestor ni un coordinador de monorepo.
- Usar Node 24 LTS. El equipo dispone de 24.16.0, compatible con los motores consultados. Antes del ensayo final comprobar el parche de seguridad vigente de la línea 24 y fijar la versión usada en la documentación y .node-version. No sustituir la instalación global sin autorización; si hace falta, utilizar un runtime aislado del proyecto o informar el requisito.
- ESM y TypeScript estricto. Backend compilado con tsc y ejecutado por Node; desarrollo con tsx watch. Frontend con Vite y plugin React. No añadir framework adicional, router, paquetes compartidos ni módulos clínicos vacíos.
- Versiones propuestas, consultadas en npm el 14-10-2026: react/react-dom 19.3.1, vite 8.3.4, @vitejs/plugin-react 6.1.2, typescript 7.0.2, express 5.3.0, vitest 5.0.4 y tsx 4.23.15. Fijar versiones exactas y archivo de bloqueo. Resolver tipos y dependencias pares requeridas por esas versiones, comprobando motores y compatibilidad antes de instalar; no instalar pares opcionales innecesarios. Si surge incompatibilidad que cambie el diseño, informar y revisar el plan.
- Pruebas de interfaz: jsdom 30.1.2 y @testing-library/react 16.3.3, con su dependencia requerida @testing-library/dom. Utilizar aserciones estándar de Vitest; no incorporar jest-dom si no aporta una necesidad. No añadir Supertest: comprobar la API mediante fetch nativo y servidor efímero en las pruebas.

## Contratos y funcionamiento

API: escuchar en 127.0.0.1:3001. GET /api/health devuelve HTTP 200, Content-Type JSON y {"status":"ok"}. No consulta base de datos ni servicios externos.

Frontend: escuchar en 127.0.0.1:5173 con puerto estricto. Consultar /api/health mediante el proxy local de Vite a 127.0.0.1:3001. Aplicar el mismo proxy al preview local; el archivo compilado no configura por sí solo una API pública. No habilitar CORS abierto ni escuchar en todas las interfaces.

Interfaz: título PsicologIA, texto «Base técnica en preparación» y región de estado accesible. Estados: «Comprobando API…», «API disponible» y «No se pudo confirmar la disponibilidad de la API». No representar disponibilidad como autenticación o preparación clínica. Una sola consulta al montar, sin sondeo continuo; cancelar al desmontar.

Cliente de disponibilidad: plazo de 5 segundos mediante AbortController y temporizador cancelable. Éxito únicamente con HTTP exitoso y JSON cuyo status sea exactamente ok. Error HTTP, fallo de red, JSON inválido, status inesperado y vencimiento conducen al estado de error. No exponer respuestas o trazas al usuario. Inyectar fetch en pruebas y controlar temporizadores para reproducir fallos sin tocar servicios reales.

Separar creación de la aplicación Express de su inicio. Las pruebas usan puerto efímero en loopback y cierran el servidor. La comprobación de disponibilidad es infraestructura técnica; no crear artificialmente una capa de dominio sin lógica de negocio.

## Archivos previstos

| Rutas | Responsabilidad |
|---|---|
| package.json, package-lock.json, .node-version, .gitignore | Workspaces, versión de runtime, reproducibilidad y exclusiones |
| apps/api/package.json, tsconfig.json, src/app.ts, src/server.ts, src/app.test.ts | API, arranque separado y prueba HTTP |
| apps/web/package.json, tsconfig.json, vite.config.ts, index.html | Configuración de interfaz y proxy local |
| apps/web/src/main.tsx, App.tsx, App.test.tsx, styles.css | Pantalla y estados verificables |
| apps/web/src/health.ts, health.test.ts | Consulta, validación de respuesta, cancelación y plazo |
| docs/DEVELOPMENT_WORKFLOW.md, README.md, AGENTS.md | Instrucciones y comandos realmente comprobados |
| specs/001-base-tecnica/validation.md, tasks.md, docs/DECISIONS.md | Evidencia y decisiones aprobadas |

Añadir configuración auxiliar de tipos y pruebas solo si es necesaria para estos componentes. No modificar PROJECT_CONTEXT.md ni la copia de metodología.

## Comandos previstos, todavía no verificados

Desde la raíz: npm ci, npm run dev:web, npm run dev:api (dos terminales), npm run typecheck, npm run build, npm test, npm run start:api y npm run preview:web. En PowerShell usar npm.cmd si la política local bloquea npm.ps1; no cambiar esa política.

Los scripts raíz delegan a los workspaces. Las comprobaciones de tipos y build deben fallar si falla cualquiera de ellos; las pruebas se ejecutan una vez, sin watch. Los comandos de instalación escriben node_modules y pueden ejecutar scripts de dependencias; se usará el registro oficial, sin instalaciones globales. No incluyen migraciones, publicación o despliegue.

## Cobertura y verificación

| Requisitos | Evidencia prevista | Tarea |
|---|---|---|
| RF-01, RNF-01 | npm ci y ejecución desde una copia limpia sin dependencias preexistentes; versiones documentadas | T1, T5 |
| RF-02, RNF-06 | Prueba de renderizado y revisión en navegador de título, estado y legibilidad | T3, T5 |
| RF-03 | Prueba HTTP real de código 200, JSON y ausencia de información extra | T2 |
| RF-04 | Prueba de transición y comprobación en navegador con API activa | T3, T4, T5 |
| RF-05 | Pruebas de fallo de red, error HTTP, JSON inválido y status inesperado; navegador con API apagada | T3, T5 |
| RF-06 | Prueba de estado pendiente, vencimiento a 5 segundos y limpieza al desmontar | T3 |
| RF-07 | typecheck y build de ambos workspaces | T4, T5 |
| RF-08 | Arranque de backend compilado y consulta HTTP | T4, T5 |
| RNF-02–05 | Revisión de dependencias, diff, exclusiones y bind local; ejecución sin credenciales ni Supabase | T1–T5 |
| RNF-07 | Matriz de validation.md con comandos, resultados y revisión comprobada | T5 |

Las pruebas cubren comportamiento, no archivos o configuración replicados. Escribir primero las pruebas pertinentes para API y manejo de estados, confirmar fallo por comportamiento pendiente y luego implementar. El ensayo de copia limpia puede escribir en un directorio temporal autorizado, sin alterar los archivos de trabajo.

## Riesgos, recuperación y alcance de autorización

No matar procesos ajenos si los puertos están ocupados. Explicar el conflicto y usar otro puerto solo mediante configuración explícita y documentada coherente en API/proxy. El acceso de red de instalación puede requerir aprobación técnica del entorno; no equivale a permiso de publicar.

El trabajo se realizará en rama local desde main, conservando cambios ajenos y seleccionando archivos para los commits. No hacer merge, push ni despliegue sin autorización vigente para este cambio. Recuperación: detener los procesos propios y revisar/revertir el cambio en la rama; no borrar datos o reescribir historia compartida.

Propuesta de autorización: aprobar este plan y T1–T5 como un lote de implementación. Eso permite avanzar secuencialmente sin solicitar aprobación entre tareas si no cambia el alcance, registrando y verificando cada una. No autoriza Supabase, funciones clínicas o publicación.

## Fuentes comprobadas

- https://nodejs.org/en/blog/release (línea 24 LTS).
- https://vite.dev/guide/ (prerrequisitos y desarrollo).
- https://vitest.dev/guide/ (runner).
- https://expressjs.com/en/guide/migrating-5/ (Express 5).
- https://docs.npmjs.com/cli/v11/using-npm/workspaces/ (workspaces).
- Metadatos oficiales del registro npm mediante npm view, sin instalar paquetes.
