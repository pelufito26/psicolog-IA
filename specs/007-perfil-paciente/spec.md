# CU03 — Consultar perfil de paciente

Revisión CU03-r1 · 15 de octubre de 2026 · Aprobada por el usuario mediante «si».

Origen: resumen de CU03 en docs/PROJECT_CONTEXT.md y alcance propuesto en la conversación. No se dispone del caso original completo; las precisiones siguientes son propuestas para validar. Esta entrega cubre los datos personales del perfil; los accesos a ficha clínica y sesiones se incorporarán cuando existan sus casos de uso, sin botones que aparenten funcionar.

## Resultado y alcance

Desde el listado, el profesional abre un paciente propio, consulta sus datos personales y vuelve al mismo contexto de búsqueda y página. Se reutilizan el acceso en dos pasos y las reglas de edad existentes. El correo real pendiente no bloquea el desarrollo: la demo utiliza exclusivamente el harness de identidad/correo ficticios ya existente y pacientes ficticios en PostgreSQL local desechable. El servidor normal conserva sus controles de sesión.

No incluye edición de pacientes (CU04), datos o funciones clínicas, historial de cambios, permisos administrativos, nuevas dependencias, cambios de esquema, migraciones remotas, correos reales ni publicación.

## Requisitos y aceptación

| ID  | Requisito verificable                                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Cada paciente del listado ofrece una acción identificable y operable por teclado para abrir su perfil. Se consulta por su identificador estable; pacientes con nombres iguales no se confunden.                                                                                                                                                                        |
| R2  | El perfil muestra nombre, apellido, fecha de nacimiento, edad calculada y teléfono. Nacimiento se presenta como fecha de calendario en formato día/mes/año, sin desplazamientos por zona horaria. No se muestran identificadores técnicos ni información clínica.                                                                                                      |
| R3  | Edad reutiliza la regla aprobada en CU02: años cumplidos según la fecha actual en America/Montevideo; quien nació el 29/2 cumple el 1/3 en años no bisiestos. No se persiste la edad. Listado y perfil coinciden para la misma fecha.                                                                                                                                  |
| R4  | Volver al listado conserva el filtro aplicado, el texto de búsqueda en edición y la página desde la que se abrió el perfil. Se vuelve a consultar esa página para evitar presentar datos desactualizados. Si queda vacía, se mantiene el comportamiento existente de CU02. No se conserva ese estado tras logout o cambio de cuenta.                                   |
| R5  | Backend y persistencia limitan la consulta al profesional de la sesión comprobada. Alterar el identificador o suministrar otro profesional desde el cliente no concede acceso. Un paciente inexistente y uno ajeno producen la misma respuesta de no disponible, sin datos ni confirmación de existencia; un identificador mal formado se rechaza de forma controlada. |
| R6  | Sin sesión completa vigente, se rechaza la consulta. Logout, vencimiento o cambio de cuenta desmontan el perfil y descartan sus datos; una respuesta pendiente de la cuenta anterior no puede volver a mostrarlos. Se mantienen los controles HTTP/CSRF existentes y no se habilitan accesos alternativos para la demo.                                                |
| R7  | Distinguir carga, perfil disponible, paciente no disponible y error temporal con opción de reintento. Permitir volver al listado incluso ante error. No mostrar datos de un paciente anterior mientras carga otro ni aceptar respuestas tardías tras cambiar de vista.                                                                                                 |
| R8  | La consulta no modifica pacientes ni crea fichas/sesiones. Búsquedas y datos personales no se guardan en logs, URL o almacenamiento persistente del navegador; respuestas privadas sin caché. Vista legible en móvil y escritorio, campos etiquetados y navegación operable por teclado.                                                                               |

## Verificación proporcional

Pruebas de consulta por ID y edad compartida; PostgreSQL desechable con dos profesionales para lectura propia, ajena y sin contexto; HTTP sin sesión, con sesión incompleta/expirada, identificador inválido, ajeno e inexistente. UI: abrir el paciente correcto, conservar búsqueda/página, error/reintento, respuestas tardías y limpieza al cerrar sesión. Recorrido visible listado → perfil → volver, en escritorio y móvil con datos ficticios. Mantener los controles de calidad existentes y registrar límites de la evidencia; no atribuir la simulación a Auth/correo reales.

CU03-r1 y el plan/tareas CU03-plan-r1/CU03-tasks-r1 aprobados. Implementación y evidencia en validation.md.
