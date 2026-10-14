# Principios de PsicologIA

Estado: adoptados en la etapa 0A, 14 de octubre de 2026.

1. La documentación aprobada guía el desarrollo. PROJECT_CONTEXT.md conserva las decisiones iniciales; DECISIONS.md registra las posteriores. Señalar contradicciones y omisiones antes de implementar comportamiento que dependa de ellas.
2. Trabajar con especificaciones mantenidas y verificables. Aprobar la especificación aclarada y luego el plan junto con las tareas. Una autorización cubre solo la revisión y el alcance acordados.
3. Mantener el alcance del MVP y el modelo de dominio documentados. No introducir nuevas reglas, dependencias o abstracciones sin una necesidad justificada dentro del alcance autorizado.
4. Mantener un monolito modular, con presentación, aplicación, dominio e infraestructura separados. El dominio no depende de React, Express o Supabase.
5. Cada profesional accede únicamente a sus pacientes y registros asociados. El administrador no accede a datos personales o clínicos. Cuando se implemente acceso real, verificar estas restricciones en el backend y los controles de persistencia aplicables.
6. Hasta verificar autenticación y autorización reales, utilizar datos ficticios y evitar exposición pública de operaciones clínicas. No tratar el prototipo como apto para pacientes reales.
7. No versionar secretos ni enviar credenciales privilegiadas al frontend.
8. Los cambios deben ser pequeños y revisables. La aceptación requiere evidencia correspondiente al requisito; registrar explícitamente lo que no se pudo comprobar.
9. Las instrucciones y la biblioteca no sustituyen los permisos técnicos. Publicación, migraciones, despliegue y cambios de permisos requieren autorización vigente para sus efectos.

Estos principios sintetizan el contexto aprobado y la adaptación metodológica aceptada. No fijan todavía esquema relacional, herramientas de paquetes ni mecanismo de acceso a Supabase.
