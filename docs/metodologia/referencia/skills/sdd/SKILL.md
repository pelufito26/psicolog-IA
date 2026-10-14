---
name: sdd
description: Redactar, revisar y mantener specs, planes y tareas SDD; implementar o validar una tarea de una spec aprobada. Usar para trabajo explícitamente guiado por especificaciones, no para cambios ajenos a ese flujo.
---

# SDD portable

Skill autocontenida basada en los apuntes de El Nuevo Programador: Día 2, pp. 9-19; Día 3, pp. 6-9. Las reglas de evidencia y adaptación del runner son complementarias. No requiere OpenCode, MCP, subagentes ni un stack particular.

## Contexto y alcance

Identificar la fase y la spec activa; leer las instrucciones aplicables, `docs/constitution.md`, la spec y los artefactos de la fase. Leer `MEMORY.md` si existe. Si falta contexto necesario, informarlo; no inventar archivos leídos, decisiones o aprobaciones. Conservar cambios ajenos.

Usar `specs/NNN-nombre/spec.md`, `plan.md` y `tasks.md` salvo estructura equivalente ya acordada. La spec expresa qué y por qué; el plan contiene diseño técnico. No imponer HTML/JS, localStorage, fechas locales ni `node --test`: son decisiones del ejemplo del curso. Elegir comandos y herramientas existentes y comprobar sus efectos.

## Puertas humanas

El curso pide aprobación explícita entre fases; su ejemplo coordinado agrupa spec y plan/tareas. Antes de iniciar, identificar el perfil acordado: aprobación por fase o agrupación autorizada. Si no hay acuerdo, pedir aprobación al final de cada fase. No pedir de nuevo lo ya autorizado para la misma revisión y alcance.

La autorización debe cubrir los artefactos vigentes: registrar quién aprobó, cuándo, revisión y alcance, basándose en una decisión humana real. No autocertificar aprobación. No implementar con spec sin aprobar, dudas bloqueantes ni plan/tareas sin aprobar. Un cambio material requiere nueva aprobación de los artefactos afectados. Publicar, migrar datos, ampliar permisos o desplegar requiere la autorización específica del entorno y del usuario.

## Fases

1. **Constitución:** proponer principios cortos, verificables y propios del proyecto; presentar para aprobación antes de adoptarlos.
2. **Spec:** redactar objetivo, actores, historias, definiciones necesarias, RF, RNF medibles, casos límite, fuera de alcance, cierre y dudas. Preguntar por decisiones bloqueantes; el curso propone hasta cinco preguntas iniciales de una en una. No forzar supuestos para cumplir ese número.
3. **Clarificación:** detectar ambigüedades, contradicciones, casos límite y conflictos con constitución. No resolver decisiones de producto por cuenta propia. Revisar de nuevo después del plan si aparecen dudas.
4. **Plan:** desde spec aprobada, definir archivos/responsabilidades, diseño o pseudocódigo, interfaz si aplica, decisiones y alternativas, pruebas y cobertura por requisito.
5. **Tareas:** unidades pequeñas en orden de dependencia; cada una con ID, RF/RNF, dependencias y «Hecho cuando». Usar 20-30 minutos como referencia orientativa; si superan diez, proponer dividir la spec. Presentar plan y tareas para aprobación.
6. **Implementación:** ejecutar solo la tarea solicitada. Para lógica verificable, crear test, comprobar fallo por la causa esperada, implementar y ejecutar las pruebas pertinentes. Para cambios sin test automático razonable, acordar verificación alternativa. No avanzar con fallos ni ampliar el plan. Marcar tarea solo con evidencia suficiente y detenerse al terminarla.
7. **Validación:** recorrer RF y RNF obligatorios; indicar prueba, resultado real y revisión de código. Verificar interfaz con herramienta disponible o revisión manual autorizada. Si falta una herramienta, registrar «no ejecutado» y no declarar cumplido ese criterio. Revisar criterios de cierre y constitución; no corregir en una tarea de revisión salvo autorización.
8. **Cambio:** actualizar primero la spec y mostrar diff; tras aprobación, revisar plan/tareas, implementar y revalidar. Mantener la spec viva.

## EARS

- `RF-1: CUANDO [evento], EL SISTEMA [respuesta observable].`
- `RF-2: SI [condición no deseada], ENTONCES EL SISTEMA [respuesta].`
- `RF-3: MIENTRAS [estado], EL SISTEMA [comportamiento].`
- `RF-4: EL SISTEMA [comportamiento permanente].`

Una frase por comportamiento. Sustituir adjetivos vagos por criterios comprobables.

## Evidencia y entrega

En cada fase, resumir estado, artefactos, revisión, dudas, autorización pendiente y siguiente paso. Actualizar memoria si existe y está dentro del alcance. No guardar secretos.

Al implementar o validar, entregar tarea, requisitos cubiertos, archivos cambiados, comandos ejecutados y resultados, controles no ejecutados y motivo. Asociar requisito → tarea → prueba → revisión Git. Distinguir evidencia de recomendaciones opcionales.

En validación, emitir `VEREDICTO: APROBADO` solo con todos los criterios obligatorios demostrados; en otro caso `VEREDICTO: CAMBIOS NECESARIOS`, separando fallos y verificaciones pendientes. La aceptación humana y el despliegue son decisiones separadas.

Detenerse ante falta de autorización, contradicción bloqueante, plan imposible, permisos insuficientes o pruebas fallidas. El ejemplo del curso limita a dos vueltas de corrección; usar ese límite salvo acuerdo distinto. Si hay delegación autorizada, pasar objetivo, fase, decisiones, rutas, permisos y evidencia; no asumir contexto compartido ni configurar agentes con YAML de OpenCode.
