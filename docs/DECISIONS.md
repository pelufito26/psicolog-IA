# Decisiones de PsicologIA

Las decisiones originales de producto y ARQ-01–03 permanecen en PROJECT_CONTEXT.md. Este registro recoge decisiones posteriores.

## DEC-001 — Adoptar la preparación documental y el método SDD

- Estado: aprobado.
- Fecha: 14 de octubre de 2026.
- Evidencia: el usuario indicó «perfecto, avancemos» después de revisar la propuesta de incorporar la metodología en 0A.
- Alcance: AGENTS.md, constitución, README, referencia metodológica versionada y registro de validación. No incluye implementación técnica ni publicación de estos archivos.
- Método: aprobar la especificación aclarada y luego aprobar conjuntamente plan y tareas. Mantener requisitos, tareas y evidencia vinculados en cada cambio.
- Referencia: pelufito26/desarrollo-ia-metodologia, commit fc42ce6eeba7db41e7faa9edf2e6bff67c634b72.
- Motivo: disponer de contexto recuperable y criterios verificables antes de crear la base técnica.
- Efecto: las especificaciones se crearán con contenido concreto; la copia metodológica es referencia, no una instalación de skills ni de agentes.
- Alternativas: un enlace externo obliga a recuperar la biblioteca en cada entorno; un submódulo añade preparación de checkout. Se adopta una copia documental fijada para lectura local.
- Pendiente: herramienta de paquetes, versión de Node, esquema relacional, acceso a Supabase, simulación del profesional y textos completos de CU01–CU11. Requieren propuestas y aprobación antes de la implementación que dependa de ellos.
