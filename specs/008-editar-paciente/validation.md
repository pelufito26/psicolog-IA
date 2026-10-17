# Validación CU04

17 de octubre de 2026 · CU04-r1, CU04-plan-r1 y CU04-tasks-r1 aprobados mediante «si». Rama local feat/editar-paciente. Sin publicación ni operaciones remotas en este lote.

| Requisitos | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1–R3      | Aplicación valida campos permitidos y reutiliza CU01; carga solo datos personales y versión opaca. UI comprueba precarga, validaciones asociadas, conservación del borrador y Cancelar sin escribir. La edad y reglas del alta conservan sus pruebas existentes.                                                                                                                                                   |
| R4         | Verificador de duplicado ligado a operación/profesional/paciente/datos/versión, con diez minutos de vigencia. Unidad prueba cambios de contexto, versión, vencimiento y rechazo de formato de alta; PostgreSQL confirma exclusión del propio paciente, advertencia sin escritura, confirmación y rechazo de repetición tras éxito. UI invalida la confirmación al editar campos.                                   |
| R5–R7      | Matriz PostgreSQL con dos profesionales: misma respuesta ante ajeno/inexistente, fila ajena intacta, una sola escritura entre dos versiones iguales y coordinación entre alta/edición. Conserva ID/profesional/creación, cambia modificación, preserva íntegramente ficha/sesión ficticias y revierte un UPDATE inválido sin cambios parciales. Versiones se calculan desde timestamp::text sin conversión a Date. |
| R6–R8      | Borrador conservado ante conflicto/error; recarga explícita y sin reintentos automáticos de escritura. Guardar vuelve a consultar el perfil y muestra confirmación; conservar búsqueda/página al regresar. Navegador con dos pestañas: una guarda teléfono ficticio y la otra rechaza su versión anterior sin sobrescribir.                                                                                        |
| R9–R10     | HTTP con Auth/correo ficticios y sesión del servicio: carga/guardado requieren ambos pasos y rechazan CSRF/Origin, logout y sesión expirada; no-store y límites JSON. UI descarta guardado pendiente ante logout, expiración y cambio de cuenta. Desktop/móvil y regreso por Tab/Enter; campos etiquetados y errores asociados.                                                                                    |

## Comprobaciones

npm run check satisfactorio: lint, formato, tipos, 141 pruebas (66 web y 75 API) y compilación. PostgreSQL 17 mediante el wrapper local .postgres-test-0d/run-auth.mjs: dos bases nuevas, matrices CU01/CU02/CU03/CU04/AUTH satisfactorias; el árbol de trabajo incluye 112 comprobaciones generales previas además de las matrices funcionales. Auth/correo siguen simulados, sin secretos en CI.

Verificación final adicional: copia exacta del índice preparado para commit, exportada a .cu04-staged-check sin los cambios pendientes de AUTH T7. Matrices CU01/CU02/CU03/CU04/AUTH satisfactorias en dos bases nuevas, incluidas la comprobación de versión después de una advertencia de duplicado y las respuestas HTTP de ajeno/inexistente. En esa copia hay 96 comprobaciones generales previas; la diferencia corresponde a ensayos de fichas de T7 excluidos de CU04. El contador general no suma las aserciones de las matrices funcionales.

La primera ejecución de HTTP fue bloqueada con EACCES en loopback; se repitió con acceso local permitido. Se ajustó una prueba HTTP para consultar edición con su cuerpo permitido, verificando directamente el mismo 404 para ajeno/inexistente en ambas rutas. No se modificó el esquema para implementar CU04.

## Demo y límites

Nueva instancia PostgreSQL local aislada en puerto 55436 y fixture de 21 pacientes ficticios; datos de demos anteriores conservados. Vite 5173, API ficticia 3001, buzón ficticio 3002. Cuenta y correo de demo del harness existentes; no se crearon identidades reales ni se enviaron emails.

Recorrido observado: filtro Perfil, página 2 y texto de búsqueda en edición → Demo 21 → editar/cancelar (sin cambio) → advertencia de duplicado y volver a editar → guardar teléfono ficticio → perfil confirmado → regreso por teclado, conservando filtro/página/texto. Otra pestaña con versión anterior recibe conflicto y ofrece recarga explícita. La recarga y sustitución del borrador se comprueban además en UI automatizada; no se considera verificación del valor la lectura DOM del teléfono, que el navegador no expone en su observación de campos.

Viewport móvil efectivo 390×844, scrollWidth 375; formulario legible sin desbordamiento. Capturas locales fuera de Git: cu04-edicion-desktop.png, cu04-edicion-movil.png, cu04-conflicto-movil.png y cu04-guardado-desktop.png. No incluyen credenciales ni códigos.

Limitaciones: no historial/fusión de cambios, no prueba en móvil físico/lector de pantalla ni aceptación clínica/productiva. Un reinicio invalida versiones/confirmaciones pendientes por secreto de proceso; recargar es necesario. Un timeout o cancelación de red no garantiza revertir un COMMIT; la UI comunica incertidumbre y propone revisar antes de reintentar. La serialización de duplicados por profesional y su búsqueda en memoria mantienen las limitaciones del prototipo.

AUTH T7 y sus archivos pendientes se conservan fuera del commit CU04. No se cambia AGENTS.md, secretos, dependencias, esquema/permisos/configuración remotos; no push, PR o despliegue en este lote.
