# Spec-Driven Development (SDD)

## Derivado del curso

SDD define requisitos, límites y aceptación antes de implementar, y usa esa especificación para guiar y verificar el trabajo (D2, p. 9). El curso distingue spec-first, spec-anchored y spec-as-source, y recomienda empezar con **spec-anchored**: mantener la spec viva durante la evolución (D2, p. 10).

La estructura es `docs/constitution.md` y `specs/NNN-nombre/{spec.md,plan.md,tasks.md}`, además de instrucciones, memoria y tests (D2, p. 11). La spec expresa qué y por qué; el diseño técnico corresponde al plan (D2, pp. 13-16).

## Flujo y aprobaciones

| Fase | Resultado | Puerta humana y condición |
| --- | --- | --- |
| Constitución | Principios breves y verificables | Aprobar antes de adoptar como norma |
| Spec | Objetivo, actores, RF/RNF, límites y dudas | Borrador; todavía no autoriza código |
| Clarificación | Ambigüedades, contradicciones y conflictos | Resolver dudas y aprobar revisión de spec |
| Plan | Diseño, archivos, decisiones y pruebas por RF | Preparar desde spec aprobada |
| Tareas | Unidades pequeñas, dependencias y «Hecho cuando» | Aprobar plan y tareas antes de implementar |
| Implementación | Una tarea, tests y cambio acotado | Ejecutar alcance autorizado y parar al terminar |
| Validación | Cobertura RF por RF y criterio de cierre | Informar fallos y pruebas no ejecutadas |
| Mantenimiento | Diff de spec y actualización dependiente | Aprobar cambio antes del código |

**Curso:** la skill de D2 p. 16 exige aprobación explícita al pasar de fase; el coordinador de D3 p. 6 agrupa las puertas principales en spec y plan/tareas. **Complemento:** acordar y registrar al inicio qué fases se aprueban juntas. Una aprobación puede cubrir varias fases descritas, pero nunca inferirse del silencio ni aplicarse a una revisión modificada. El perfil conservador solicita aprobación al final de cada fase; agrupar puertas requiere acuerdo humano explícito.

## Requisitos EARS (curso, D2 pp. 11, 13 y 16)

- Por evento: `CUANDO ocurre el evento, EL SISTEMA produce la respuesta observable`.
- Por error: `SI se presenta la condición no deseada, ENTONCES EL SISTEMA responde de la forma definida`.
- Por estado: `MIENTRAS se mantiene el estado, EL SISTEMA conserva el comportamiento`.
- Permanente: `EL SISTEMA realiza el comportamiento definido`.

Una frase representa un comportamiento. Evitar «rápido», «bonito» o «seguro» sin criterio comprobable. Separar requisitos funcionales, no funcionales y casos límite. Ver [plantilla](../plantillas/spec.md).

## Plan, tareas y pruebas

**Curso:** plan con archivos y responsabilidades, lógica separada, pseudocódigo, interfaz, decisiones justificadas y alternativa descartada, estrategia de tests y cobertura de RF. Tareas de 20-30 minutos como referencia; si hay más de diez, proponer dividir la spec. Implementar una tarea: test que falla por el comportamiento pendiente → código → tests verdes → marcar y parar (D2, pp. 14-18).

**Adaptación complementaria:** `node --test`, funciones que reciben «hoy», localStorage y vista móvil de 375 px pertenecen al ejemplo. Elegir el runner existente y los tamaños/plataformas definidos por el proyecto. Inyectar reloj o dependencias cuando afecten a la lógica; no imponer fecha local a dominios que requieren UTC. Para documentación o cambios visuales sin prueba automática razonable, acordar una verificación alternativa y documentarla antes de implementar.

Un test verde sin correspondencia con el requisito no demuestra aceptación. Registrar por RF/RNF: tarea, prueba o revisión, comando, resultado, fecha y revisión del código. Si un test no pudo ejecutarse, indicar «no ejecutado» y el motivo; no marcarlo aprobado. Ver [ejemplo trazable](../ejemplos/spec-trazable.md).

## Cambios y cierre (complemento)

Un nuevo requisito altera primero la spec; mostrar su diff y obtener aprobación. Después actualizar cobertura, plan y tareas; repetir las verificaciones afectadas. No cerrar con dudas bloqueantes, tests fallidos o criterios obligatorios sin evidencia. El estado «implementada» no equivale a «desplegada»: merge, publicación y despliegue tienen autorizaciones separadas.
