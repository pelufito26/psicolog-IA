# PsicologIA

Aplicación web prevista para profesionales de psicología: pacientes, fichas clínicas y seguimiento mediante sesiones.

## Estado

El prototipo local permite registrar pacientes ficticios y advertir posibles duplicados antes de confirmarlos. Usa una API propia y PostgreSQL en Supabase de desarrollo. Todavía no hay autenticación productiva, fichas ni sesiones en la interfaz; utilizar exclusivamente datos ficticios.

## Documentación

- [Contexto maestro](docs/PROJECT_CONTEXT.md): alcance, dominio, arquitectura y preguntas abiertas.
- [Instrucciones de trabajo](AGENTS.md).
- [Principios del proyecto](docs/constitution.md).
- [Decisiones](docs/DECISIONS.md).
- [Metodología adoptada](docs/metodologia/README.md).
- [Propuesta de Iteración 0](docs/PROPUESTA_ITERACION_0.md): plan de preparación, con decisiones técnicas todavía pendientes.
- [Validación de la etapa 0A](docs/VALIDACION_0A.md).
- [Ejecución y comprobaciones locales](docs/DEVELOPMENT_WORKFLOW.md).
- [Validación de 0B](specs/001-base-tecnica/validation.md).
- [Calidad y CI de 0C](specs/002-calidad-ci/validation.md).
- [Persistencia de desarrollo](docs/DATABASE.md): migración aplicada, cuenta restringida y conexión TLS verificadas.
- [Preparación 0E](docs/REVISION_0E.md).
- [Validación de CU01](specs/004-registrar-paciente/validation.md): registro de pacientes, pruebas y demo.
- [Validación de CU02](specs/005-listar-pacientes/validation.md): listado, búsqueda, edad y paginación del profesional.

Los documentos adicionales y las especificaciones se crearán cuando haya contenido concreto. Antes de implementar cada cambio se aprobarán su especificación y su plan con tareas.
