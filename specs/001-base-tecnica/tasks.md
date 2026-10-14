# Tareas de base técnica local

Revisión: 0B-tasks-r1. Spec: 0B-r1 aprobada. Plan: 0B-plan-r1 propuesto.
Plan y lote T1–T5 aprobados por el usuario el 14 de octubre de 2026. Implementación local completada; ver validation.md.

- [x] T1 — Preparar workspaces y dependencias.
  - Dependencias: ninguna. Requisitos: RF-01, RNF-01–05.
  - Rutas: configuración raíz y package.json/tsconfig de apps/web y apps/api.
  - Comprobar parche Node y pares requeridos; fijar versiones y lockfile, excluyendo salidas y secretos. No cambiar instalaciones globales.
  - Hecho cuando: instalación reproducible, motores compatibles, estructura mínima y exclusiones revisadas.
  - Evidencia: validation.md. Commit local: registrar mediante historial Git; sin publicación.

- [x] T2 — Crear y comprobar la API de disponibilidad.
  - Dependencias: T1. Requisitos: RF-03, RNF-02–05, RNF-07.
  - Rutas: apps/api/src/app.ts, server.ts y app.test.ts.
  - Hecho cuando: GET /api/health responde 200 y JSON acordado; servidor escucha en loopback y la prueba HTTP cierra su servidor efímero. Confirmar fallo de la prueba antes de implementar.
  - Evidencia: validation.md. Commit local: registrar mediante historial Git; sin publicación.

- [x] T3 — Crear interfaz y consulta con errores controlados.
  - Dependencias: T1. Requisitos: RF-02, RF-04–06, RNF-05–07.
  - Rutas: apps/web/src e index.html.
  - Hecho cuando: se verifican texto inicial, estado pendiente, éxito válido, errores de red/HTTP/formato, plazo de 5 segundos y cancelación sin actualizaciones tras desmontar. La interfaz mantiene texto accesible.
  - Evidencia: validation.md. Commit local: registrar mediante historial Git; sin publicación.

- [x] T4 — Integrar desarrollo y compilación.
  - Dependencias: T2 y T3. Requisitos: RF-04, RF-07–08, RNF-03.
  - Rutas: vite.config.ts, scripts y configuración de compilación.
  - Hecho cuando: frontend consulta API por proxy local; dev y preview usan puertos locales estrictos; typecheck/build pasan y el backend compilado responde al contrato. No incluir despliegue.
  - Evidencia: validation.md. Commit local: registrar mediante historial Git; sin publicación.

- [x] T5 — Ensayar desde copia limpia y documentar evidencia.
  - Dependencias: T4. Requisitos: RF-01–08, RNF-01–07.
  - Rutas: docs/DEVELOPMENT_WORKFLOW.md, README.md, AGENTS.md, docs/DECISIONS.md y specs/001-base-tecnica/validation.md.
  - Hecho cuando: npm ci, pruebas, tipos y build son reproducibles; interfaz comprobada con API activa e inactiva; contrato del backend compilado comprobado; diff sin secretos o archivos ajenos. Actualizar instrucciones con comandos reales y registrar toda evidencia.
  - Si no se puede observar la interfaz, registrar la revisión visual como pendiente y no declarar cumplidos todos los criterios.
  - Evidencia: validation.md. Commit local: registrar mediante historial Git; sin publicación.

El lote T1–T5 puede aprobarse conjuntamente. Si se aprueba, ejecutar en orden, comprobar cada resultado y continuar dentro del alcance autorizado. No marcar tareas por intención ni publicar por haber terminado la implementación.
