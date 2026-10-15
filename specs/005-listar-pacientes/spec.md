# CU02 — Consultar listado de pacientes

Revisión CU02-r1 · 15 de octubre de 2026 · Aprobada por el usuario mediante «Aprobado», incluidos los criterios propuestos de búsqueda, orden, paginación y cumpleaños del 29/2.

Origen: resumen de CU02 en docs/PROJECT_CONTEXT.md. No se dispone del caso original completo; los detalles siguientes son propuestas explícitas. Esta aprobación no habilita CU03 (perfil).

## Resultado y alcance

El profesional ficticio puede encontrar los pacientes que registró: listado por apellido y búsqueda por nombre o apellido, mostrando nombre, apellido, edad calculada y teléfono. Continúa el contexto local de CU01, sin autenticación productiva ni datos reales. No incluye perfil, edición, ficha o sesiones, nuevas dependencias ni cambios de esquema.

## Requisitos y aceptación

| ID  | Comportamiento verificable                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Al abrir Pacientes, consultar únicamente los del profesional configurado en el servidor. Un identificador enviado por el navegador no puede sustituir ese contexto. Probar con dos profesionales.                                                                                                                            |
| R2  | Mostrar apellido, nombre, edad en años cumplidos y teléfono. Calcular edad al consultar con fecha de America/Montevideo, sin almacenarla. Propuesta para nacidos el 29/2: en años no bisiestos el año se cumple el 1/3.                                                                                                      |
| R3  | Orden ascendente por apellido, luego nombre y finalmente ID para desempate estable. Propuesta: comparar sin distinguir acentos ni mayúsculas, conservando el texto original mostrado.                                                                                                                                        |
| R4  | Un campo «Buscar por nombre o apellido» y botón «Buscar» (también Enter). Propuesta: coincidencia parcial en cualquiera de los dos campos, ignorando acentos, mayúsculas y espacios periféricos; tratar el texto como literal. Búsqueda vacía muestra todos. No buscar por teléfono ni combinar palabras entre ambos campos. |
| R5  | Propuesta: páginas de 20 pacientes con Anterior/Siguiente; buscar reinicia en la primera página. Mantener orden y filtro al navegar; al volver a consultar, reflejar los datos actuales.                                                                                                                                     |
| R6  | Distinguir cargando, lista vacía, búsqueda sin resultados y error con opción de reintento. Nunca mostrar resultados anteriores como si pertenecieran a un filtro nuevo; una respuesta tardía no puede reemplazar una búsqueda posterior. Etiquetas y controles operables por teclado.                                        |
| R7  | Desde el listado se puede abrir Registrar paciente; al guardar o cancelar se vuelve al listado y se actualiza la consulta. Si el paciente no coincide con el filtro activo, no afirmar que falta: conservar el filtro visible y permitir limpiarlo. No abrir un perfil todavía.                                              |
| R8  | Sin contexto válido o ante fallo, comunicar error sin datos internos ni información de otro profesional. Mantener loopback, credenciales solo en backend y restricciones de solicitudes locales. No guardar búsquedas o datos de pacientes en logs o almacenamiento persistente del navegador.                               |

## Verificación y puerta siguiente

Pruebas proporcionales: búsqueda/orden/edad, consulta real en PostgreSQL desechable con dos profesionales, estados de UI y recorrido registrar → encontrar. Mantener check y CI existentes; demo con los dos pacientes ficticios existentes, sin crear más datos remotos para esta etapa. La revisión visual no sustituye las pruebas de aislamiento.

Primera puerta completada. Plan y tareas se preparan para aprobación conjunta antes de implementar. Esta aprobación no autoriza publicación, migración o despliegue.
