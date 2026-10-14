# Tareas de calidad y CI

Revisión: 0C-tasks-r1. Spec aprobada: 0C-r1. Plan propuesto: 0C-plan-r1.
Aprobación del lote: el usuario respondió «sip» el 14 de octubre de 2026. Alcance: implementación y verificaciones locales; sin publicación.

- [x] T1 — Resolver compatibilidad y fijar dependencias.
  - Cambiar TypeScript a 6.0.3, instalar versiones del plan y actualizar lockfile sin forzar pares.
  - Hecho cuando: npm ci, tipos, 13 pruebas y build de 0B pasan con Node 24.21.0. Requisitos: RNF-01, RNF-04.
  - Evidencia local: validation.md.
- [x] T2 — Configurar y ensayar lint.
  - Depende de T1. Configuración plana, globales por contexto, reglas React y advertencias como fallo.
  - Hecho cuando: código/configuración propios pasan; infracción temporal comprobada provoca fallo y luego se retira. Correcciones mínimas revisadas. Requisitos: RF-01, RF-06, RNF-06.
  - Evidencia local: validation.md.
- [x] T3 — Configurar y ensayar formato.
  - Depende de T1. Crear reglas, exclusiones y normalización LF; formatear archivos propios.
  - Hecho cuando: check no escribe, un defecto temporal es detectado y write lo corrige; fuentes preservadas y diff mecánico revisado. Requisitos: RF-02–03, RNF-06.
  - Evidencia local: validation.md.
- [x] T4 — Configurar GitHub Actions.
  - Depende de T2–T3. Job y pasos del plan con versiones fijadas y permisos mínimos.
  - Hecho cuando: configuración revisada para disparadores, SHA, límites y propagación de fallos. Requisitos: RF-04–07, RNF-02–05. La revisión local no equivale a ejecución remota.
  - Evidencia local: configuración revisada y validada sintácticamente por Prettier. Evidencia remota: pendiente de publicación autorizada.
- [ ] T5 — Repetir desde copia limpia y documentar resultados.
  - Depende de T4. Ejecutar npm ci y npm run check; actualizar instrucciones, decisiones y validation.md.
  - Hecho cuando para entrega local: comprobaciones pasan y evidencia distingue lo ejecutado de lo pendiente. Requisitos: RF-08, RNF-07.
  - Cierre remoto: tras autorización de publicación, verificar fallo deliberado de CI y revisión final satisfactoria en PR; tras merge del usuario, verificar ejecución en main. No marcar la etapa completa antes.
  - Entrega local completada: npm ci y npm run check pasan desde copia limpia; 13 pruebas, tipos y build satisfactorios. Evidencia: validation.md. El checkbox sigue pendiente por la validación remota que forma parte del cierre.

La aprobación conjunta permite ejecutar el lote secuencialmente dentro del alcance sin repetir la consulta entre tareas. Publicación y merge conservan sus autorizaciones separadas.
