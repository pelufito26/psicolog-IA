# Trabajo en PsicologIA

- Leer docs/PROJECT_CONTEXT.md y docs/constitution.md. El contexto conserva las decisiones del producto; la constitución define los principios adoptados.
- Consultar docs/metodologia/README.md para el método y su versión. Para cambios de producto, mantener una especificación con requisitos y aceptación, seguida de plan y tareas en specs/NNN-nombre/.
- Usar la especificación indicada en la solicitud; no asumir una activa. No inventar reglas cuando falten los casos de uso completos.
- Puertas acordadas: aprobación de la especificación aclarada y aprobación conjunta del plan y tareas antes de implementar. Respetar el alcance autorizado y no volver a pedir aprobaciones ya vigentes.
- Registrar decisiones nuevas en docs/DECISIONS.md. Las propuestas y preguntas pendientes no son normas aprobadas.
- Implementar cambios pequeños. Verificar cada requisito mediante pruebas o revisión proporcional y registrar evidencia, fallos y verificaciones no ejecutadas.
- Conservar cambios ajenos. Revisar el diff y seleccionar archivos explícitamente antes de un commit. Publicar, migrar, desplegar o ampliar permisos solo con autorización vigente para el destino y alcance.
- Usar exclusivamente datos ficticios durante el prototipo. No versionar secretos ni incluir credenciales privilegiadas en el frontend.
- Mantener el dominio independiente de frameworks y persistencia, y la separación de datos por profesional. El administrador no accede a información personal o clínica de pacientes.
- La biblioteca de referencia no instala skills, agentes ni controles técnicos. No añadirlos sin necesidad y autorización aplicable.
- Base local y calidad: consultar docs/DEVELOPMENT_WORKFLOW.md. Comprobación completa: npm run check (lint, formato, tipos, pruebas y build). npm run format:write modifica únicamente el alcance de formato acordado; npm run format:check y npm run lint no escriben. Prerrequisitos: Node 24.21+ dentro de la línea 24 y npm 11. Las pruebas de API utilizan un puerto local efímero. Workflow de GitHub preparado; ver su evidencia remota antes de declararlo validado.

- Revisión independiente: antes de publicar cambios funcionales, delegar una revisión al subagente revisor definido en .codex/agents/revisor.toml, con base/HEAD, especificación y evidencia explícitos. Seguir docs/SUBAGENTS.md; el revisor no edita ni aprueba/publica, y no reemplaza las puertas humanas. No delegar en cadena.
