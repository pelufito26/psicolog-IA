# 004 — Registrar paciente (CU01 / Iteración 1)

Estado: aprobada. Revisión: CU01-r1, 15 de octubre de 2026.
Aprobación humana: el usuario respondió «sisi vamo» al pedido de aprobar CU01-r1. Plan y tareas aprobados posteriormente mediante «si»; ver plan.md, tasks.md y validation.md.
Procedencia: resumen de CU01 y modelo/reglas de docs/PROJECT_CONTEXT.md. El usuario autorizó redactar una propuesta nueva; no se recuperó el caso de uso original completo.

## Objetivo y actor

Permitir a un profesional registrar un paciente mediante la interfaz local y conservar sus datos en PostgreSQL, con validación y advertencia de posibles duplicados.

En esta etapa el actor se representa mediante un profesional ficticio configurado del lado del servidor. No equivale a un usuario autenticado ni habilita datos reales.

## Confirmado en el contexto

Nombre, apellido, fecha de nacimiento y teléfono obligatorios; nacimiento no futuro; un profesional responsable obligatorio e inmutable; edad derivada; timestamps automáticos. Los posibles duplicados se advierten y pueden registrarse tras confirmación explícita.

Registrar paciente no crea ficha ni sesiones. No permite reasignaciones, eliminación, agenda, cobros o decisiones clínicas automatizadas.

## Detalles aprobados en CU01-r1

1. Teléfono internacional sin país obligatorio: aceptar un signo + inicial opcional, dígitos ASCII, espacios, guiones y paréntesis; exigir de 7 a 15 dígitos tras quitar separadores. Guardar dígitos y el + inicial si existe. No comprobar que el número exista ni imponer prefijo uruguayo. El mínimo de 7 es una propuesta de producto, no una regla universal.
2. Nombre/apellido: recortar extremos y convertir secuencias de espacios a uno; rechazar vacío, conservar acentos y mayúsculas escritos. No limitar a letras, para admitir apóstrofos, guiones y otros nombres. No añadir límites de longitud de negocio no acordados.
3. Duplicado: comparar nombre y apellido con descomposición Unicode NFD, retirada de marcas diacríticas, espacios normalizados y mayúsculas; exigir misma fecha de nacimiento. La normalización es para comparar, no para cambiar el nombre mostrado.
4. Buscar duplicados únicamente entre pacientes del profesional actual. No revelar existencia o datos de pacientes de otros profesionales.
5. Antes de guardar un duplicado, mostrar advertencia genérica y los datos que el usuario está intentando registrar, sin listado de terceros. Ofrecer «Volver a editar» y «Registrar de todos modos». Si cambian los datos, la confirmación anterior deja de servir y se vuelve a comprobar.
6. Contexto local: backend configurado con un único profesional ficticio existente. El navegador no selecciona profesional ni envía una identidad que pueda sustituir ese contexto. Si falta, no registrar nada y explicar que la configuración de desarrollo está incompleta.
7. Tras éxito, mostrar confirmación y dejar el formulario limpio para un nuevo registro. La consulta/listado de pacientes se aborda en CU02; no se agrega aquí.

Estos detalles no se consideran decisiones aprobadas por aparecer en el documento. Aprobar CU01-r1 los incorpora al alcance.

## Requisitos

- RF-01: CUANDO el actor abre Registrar paciente, LA INTERFAZ presenta nombre, apellido, fecha de nacimiento y teléfono con etiquetas y obligatoriedad visibles.
- RF-02: SI falta un campo obligatorio o el valor incumple las reglas propuestas, ENTONCES EL SISTEMA informa el problema en ese campo, conserva los valores introducidos y no crea un paciente. El backend valida aunque se omitan los controles de interfaz.
- RF-03: SI nacimiento no es una fecha calendario válida o es posterior a hoy en America/Montevideo, ENTONCES EL SISTEMA rechaza el registro; hoy se acepta y la zona del navegador no cambia el criterio.
- RF-04: CUANDO los datos son válidos y no hay coincidencias según la comparación acordada, EL SISTEMA guarda exactamente un paciente asociado al profesional del servidor y confirma el resultado solo después de persistir.
- RF-05: SI hay posible duplicado, ENTONCES EL SISTEMA advierte y espera confirmación explícita sin crear el nuevo paciente todavía.
- RF-06: CUANDO el actor confirma registrar de todos modos los mismos datos advertidos, EL SISTEMA permite guardar ese paciente y confirma el resultado. La confirmación no se aplica a datos modificados.
- RF-07: CUANDO el actor vuelve a editar o cancela el registro, EL SISTEMA conserva los datos para edición o abandona el formulario según la acción, sin crear un paciente.
- RF-08: MIENTRAS se procesa la solicitud, LA INTERFAZ muestra progreso y deshabilita nuevos envíos; un doble clic no inicia dos solicitudes. No reintentar automáticamente una escritura si la respuesta se pierde.
- RF-09: SI falla el backend o la base de datos, ENTONCES LA INTERFAZ informa que no pudo confirmar el registro, conserva datos y no muestra éxito. No exponer SQL, credenciales o trazas. Si el resultado de una escritura es incierto por fallo de red, comunicarlo y volver a comprobar posibles duplicados antes de una nueva escritura.
- RF-10: SI no hay contexto válido del profesional ficticio, ENTONCES EL BACKEND rechaza el registro sin crear un profesional automáticamente ni usar un valor arbitrario.
- RF-11: CUANDO se registra el paciente, LA PERSISTENCIA genera ID y timestamps, no guarda edad y permite que el paciente no tenga ficha ni sesiones.
- RF-12: CUANDO el registro se confirma, LA INTERFAZ muestra éxito y reinicia el formulario; no necesita implementar listado o perfil para demostrar el guardado.

## Requisitos no funcionales

- RNF-01: Solo desarrollo local con datos ficticios. Backend obtiene profesional del servidor; rechazar intentos de sustituir su identidad desde el cliente. La consulta de duplicados se filtra por ese mismo contexto.
- RNF-02: No afirmar autenticación real o aislamiento productivo. Mantener loopback, acceso a DB exclusivo del backend, TLS y credenciales fuera de Git/frontend; definir protección de solicitudes locales y orígenes en el plan.
- RNF-03: Lógica de validación/normalización en dominio o aplicación sin depender de Express, React o pg. Infraestructura implementa persistencia y presentación muestra estados. No incorporar una capa compartida si no hace falta.
- RNF-04: Errores y resultados son legibles por texto; formulario operable por teclado y errores asociados a campos. No depender de color. La advertencia requiere una acción inequívoca.
- RNF-05: Incluir pruebas de reglas, confirmación ligada a datos, separación por profesional, persistencia y estados de interfaz. Los controles existentes y pruebas PostgreSQL siguen pasando.
- RNF-06: Pruebas habituales/CI usan PostgreSQL desechable y datos sintéticos, sin secretos Supabase. El ensayo manual de desarrollo no toca datos ajenos.
- RNF-07: El plan define plazo de solicitudes, límites técnicos de payload y contrato de error; esos límites no se presentan como reglas clínicas ni se añaden silenciosamente a la spec.

## Casos de aceptación

| Escenario                                                                     | Resultado esperado                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Campos vacíos o solo espacios                                                 | Errores asociados, sin persistencia                                  |
| Fecha imposible, mañana o hoy                                                 | Rechazar las dos primeras; aceptar hoy según Montevideo              |
| Teléfono con +, separadores y dígitos válidos                                 | Guardar representación normalizada propuesta                         |
| Teléfono con letras, + interior o fuera de longitud                           | Rechazar sin escribir                                                |
| Datos válidos sin coincidencia                                                | Registro persistido con profesional configurado, éxito visible       |
| Nombre con acentos/mayúsculas/espacios distintos pero comparación equivalente | Advertencia si coincide apellido y nacimiento dentro del profesional |
| Mismo nombre/apellido con fecha diferente                                     | No advertir por esa sola coincidencia                                |
| Coincidencia en otro profesional                                              | No revelar coincidencia ni datos ajenos                              |
| Duplicado sin confirmar o volver a editar                                     | No crear                                                             |
| Duplicado confirmado sin cambios                                              | Permitir creación                                                    |
| Edición posterior a advertencia                                               | Revalidar y no reutilizar confirmación anterior                      |
| Doble clic mientras se envía                                                  | Una solicitud activa                                                 |
| Fallo de conexión, API o persistencia                                         | Valores conservados, sin éxito falso ni datos internos               |
| Identidad manipulada o contexto ausente                                       | Rechazo sin escritura                                                |
| Alta válida                                                                   | Sin edad almacenada y sin ficha/sesiones creadas                     |

## Fuera de alcance

CU02–CU11, autenticación, selección libre de profesionales, cambios de datos, reasignaciones, eliminación, carga de pacientes reales, publicación del prototipo, teléfono verificado por SMS y deduplicación automática.

## Puertas y estado

CU01-r1 y su plan/tareas fueron aprobados por separado antes de implementar. La entrega local y demo están verificadas en validation.md. Publicación, merge y despliegue requieren autorización vigente.
