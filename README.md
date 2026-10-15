# PsicologIA

Aplicación web prevista para profesionales de psicología: pacientes, fichas clínicas y seguimiento mediante sesiones.

## Estado

El prototipo incluye listado y registro de pacientes ficticios y preparación local de acceso con contraseña y código por correo. El flujo de acceso está verificado con identidad/correo simulados y PostgreSQL real desechable; la prueba integrada con Supabase Auth y email real sigue pendiente. El servidor normal deniega pacientes sin configuración y sesión completas. No hay uso clínico productivo, fichas o sesiones en la interfaz.

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
- [Acceso en dos pasos](specs/006-acceso-profesionales/validation.md): alcance local, matriz de seguridad y pendientes de email real.

Los documentos adicionales y las especificaciones se crearán cuando haya contenido concreto. Antes de implementar cada cambio se aprobarán su especificación y su plan con tareas.
