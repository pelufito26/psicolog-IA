# Revisión de preparación para CU01

Fecha: 15 de octubre de 2026. Resultado: base técnica disponible; requisitos de CU01 pendientes de aprobación.

## Evidencia existente

- 0A: contexto, principios, método y decisiones versionados.
- 0B: pantalla local y API de disponibilidad, con compilación y pruebas.
- 0C: lint, formato, tipos, tests y build ejecutados en GitHub.
- 0D: PostgreSQL 17, migración aplicada a Supabase de desarrollo, cuenta restringida y conexión TLS real comprobadas con rollback. Integración PostgreSQL y controles pasaron en main tras PR #4: https://github.com/pelufito26/psicolog-IA/actions/runs/38751411481 .

Esta revisión utiliza los resultados ya obtenidos; no vuelve a ejecutar pruebas sin cambios que lo justifiquen. Las tablas remotas quedaron vacías después de los ensayos.

## Documentación y límites

DEVELOPMENT_WORKFLOW.md conservaba referencias anteriores a Supabase y CI como pendientes; se actualiza su estado. El archivo DATABASE.md contiene la evidencia posterior de T5 y T6, junto con las restricciones de acceso. Los registros previos de validación son históricos y no demuestran autorización productiva.

El backend técnico accede a las cuatro tablas para ensayos, sin aislamiento por identidad de profesional. Antes de agregar registro de pacientes, debe definirse un contexto de profesional solo de desarrollo, obtenido del servidor y no de un identificador elegido por el navegador.

Las dos entradas administrativas de cuenta/transferencia en el historial remoto no se reproducen con el archivo SQL de esquema. No usar db push automáticamente contra ese proyecto; mantener aplicación explícita de migraciones y conciliar el historial antes de adoptar ese comando.

## CU01

No se encontró especificación completa en los archivos locales revisados ni documentación adicional recuperable del repositorio. El usuario autorizó preparar una propuesta desde el resumen. Por tanto, specs/004-registrar-paciente/spec.md es un borrador nuevo: los detalles agregados requieren aprobación y no se atribuyen a los casos originales.

Pendientes concretos: teléfono válido, normalización y alcance de duplicados, confirmación después de editar datos y contexto del profesional ficticio. La spec propone valores concretos para resolverlos en una sola revisión.

## Cierre

0E todavía no está cerrada: requiere una especificación suficiente de CU01 aprobada. Después se prepara plan y tareas de Iteración 1. No se exige recuperar CU02–CU11 para implementar CU01, aunque su texto será necesario al abordarlos.

No se implementó lógica de pacientes en esta revisión y no se crearon datos, credenciales o migraciones remotas.

## Cierre posterior de 0E

La descripción anterior documenta el estado al iniciar la revisión. Posteriormente el usuario aprobó CU01-r1 y, en una segunda puerta, CU01-plan-r1/CU01-tasks-r1. Quedaron resueltos teléfono, comparación de duplicados, confirmación y contexto ficticio. 0E se cierra con esas aprobaciones; CU01 se implementó y verificó por separado, según specs/004-registrar-paciente/validation.md. La demo posterior creó únicamente un profesional y dos pacientes ficticios; no creó credenciales ni migraciones adicionales.
