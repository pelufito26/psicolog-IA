# Multiagentes y subagentes

## Derivado del curso

Un agente personalizado tiene una función, instrucciones, permisos y opcionalmente un modelo. Un subagente recibe una tarea delegada y devuelve un resultado al principal. Un sistema multiagente coordina especialidades por turnos o en paralelo (D3, pp. 3-4).

El flujo didáctico es coordinador → planificador → implementador → revisor. El coordinador transmite contexto y solicita aprobaciones; el planificador redacta specs, planes y tareas sin tocar código; el implementador ejecuta una tarea con tests primero; el revisor detecta problemas y valida requisito por requisito sin editar (D3, pp. 5-9).

El ejemplo exige aprobar spec y plan con tareas; detenerse con tests fallidos; corregir como máximo dos veces antes de informar; cambiar primero los requisitos documentados (D3, p. 6). El curso también introduce loops, grafos de dependencias, AgentOps y fábricas de software (D3, p. 10), sin que ello obligue a construir una infraestructura de automatización.

## Roles portables (complemento)

| Rol | Entrega | Restricción deseada |
| --- | --- | --- |
| Coordinador | Estado, contexto, solicitud de decisión | No implementa ni amplía alcance |
| Planificador | Spec/plan/tareas y dudas | Escritura limitada a documentación autorizada |
| Implementador | Cambio acotado y evidencia | Solo tarea activa y rutas aprobadas |
| Revisor | Hallazgos y matriz de cobertura | Sin edición; tests permitidos tras revisar efectos |

Estas son políticas conceptuales. Los YAML `mode: primary/subagent`, `permissions`, la invocación `@planner` y `.opencode/agents` de los PDFs son formatos de OpenCode; no instalar esos archivos como configuración de Codex. Comprobar las capacidades reales del cliente. Si no hay delegación, una persona o un solo agente pueden ejecutar los roles secuencialmente.

## Contrato de delegación (complemento)

Cada encargo debe indicar: objetivo; fase; petición del usuario; decisiones aprobadas y revisión de los artefactos; rutas a leer y editar; dependencias; verificaciones; formato de entrega y condición de parada. La entrega debe identificar archivos y revisión trabajados, resultados ejecutados, bloqueos y decisiones no cubiertas. No asumir que todos los agentes ven la conversación ni que están aislados por defecto.

Delegar solo cuando esté autorizado y aporte una ventaja concreta. Buen paralelo: revisiones independientes de accesibilidad, requisitos y tests. Mala división: dos implementadores editando los mismos archivos sin coordinación. Separar ramas o worktrees si el entorno lo permite; un worktree separa archivos, pero no garantiza aislamiento de puertos, datos ni servicios.

El coordinador reúne hallazgos, elimina duplicados y resuelve contradicciones con evidencia. Tres opiniones coincidentes no sustituyen una prueba. Antes de integrar, revisar el diff completo y ejecutar las verificaciones de la versión combinada.
