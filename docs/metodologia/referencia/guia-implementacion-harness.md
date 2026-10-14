# Guía de implementación de un harness

**Procedencia:** acuerdos de proyecto y memoria de D1 pp. 15-19; herramientas y SDD de D2 pp. 3-19; roles y controles de D3 pp. 5-9. La secuencia operativa y la matriz siguientes son complementos portables.

## 1. Diagnóstico antes de cambiar el proyecto

Leer instrucciones existentes, estructura, estado de Git y documentación. Identificar stack, runner, comandos de lint/build y datos sensibles. Registrar qué puede leer/editar el agente, qué herramientas existen y si hay acceso a red. No reemplazar un `AGENTS.md` existente con la plantilla: proponer un diff que conserve sus reglas.

## 2. Preparar contexto mínimo

Adaptar [AGENTS](plantillas/AGENTS.md), [constitución](plantillas/constitution.md) y, si aporta valor, [memoria](plantillas/MEMORY.md). La constitución recoge principios reales del proyecto, no las restricciones del Diario de Estudio. No ejecutar marcadores entre corchetes como comandos. Aprobar la constitución antes de tratarla como norma.

## 3. Acordar permisos y puertas

| Acción | Política inicial sugerida (complemento) |
| --- | --- |
| Leer código y redactar borradores | Permitido dentro del ámbito solicitado |
| Implementar | Solo spec, plan y tareas aprobados |
| Ejecutar tests/lint/build | Comandos revisados y entorno de prueba autorizado |
| Instalar dependencia o usar red nueva | Evaluar necesidad, permisos y autorización vigente |
| Migrar datos o acceder a producción | Aprobación específica y recuperación preparada |
| Publicar, hacer push, merge o desplegar | Autorización explícita para destino y alcance |
| Cambiar secretos o ampliar permisos | Aprobación específica; no registrar valores secretos |
| Destruir datos o sobrescribir cambios ajenos | Detenerse y solicitar decisión concreta |

Traducir esta política a los mecanismos reales de sandbox, aprobaciones y restricciones del cliente. `AGENTS.md` y una skill no configuran por sí mismos esos mecanismos. Si no puede imponerse un límite técnico, comunicar esa limitación y reducir el alcance.

## 4. Conectar herramientas con criterio

Añadir solo capacidades necesarias. Leer las instrucciones y scripts de una skill de terceros antes de instalarla. Para MCP, confirmar proveedor, datos transmitidos y permisos de cada herramienta. Evitar credenciales en Markdown o Git. Los ejemplos `opencode.json` de D2 pp. 7-8 no son configuración de Codex.

## 5. Ensayar el flujo

En un repositorio de prueba y con datos sintéticos: redactar una spec pequeña; revisar dudas; aprobarla; preparar y aprobar plan/tareas; ejecutar una tarea; verificar por requisito. Probar recuperación de una sesión leyendo artefactos y Git. Si hay multiagentes, empezar con una revisión delegada de solo lectura y contrato explícito.

## 6. Git y trazabilidad

Trabajar en una rama enfocada, revisar cambios existentes y no incorporar archivos ajenos automáticamente. Revisar `git diff` antes de seleccionar archivos para commit. Registrar revisión de spec, aprobación humana, tarea y prueba; enlazar el commit después de crearlo. Evitar `git add .` sin inspección. No reescribir historia compartida ni publicar por asumir que una autenticación equivale a consentimiento.

## 7. Cierre operativo

Entregar resumen de cambio, RF cubiertos, verificaciones y límites. Actualizar memoria con hechos comprobados. La revisión humana evalúa el diff y la evidencia; la entrega no reemplaza esa responsabilidad. Mantener pendiente cualquier comprobación que requiera una herramienta o permiso ausente.
