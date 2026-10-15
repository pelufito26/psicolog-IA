# Plan CU02

CU02-plan-r1 · Spec CU02-r1 aprobada · Aprobado junto con CU02-tasks-r1 mediante «avancemos».

## Implementación

- Extender el módulo pacientes existente. Dominio: edad según fecha Montevideo y normalización de búsqueda/orden, reutilizando CU01. Aplicación: validar consulta, filtrar, ordenar y paginar. Infraestructura: SELECT parametrizado con profesional obligatorio; presentación: ruta y listado React. Sin dependencias ni migraciones nuevas.
- POST /api/pacientes/consulta recibe JSON `{ busqueda: string, pagina: number }` (página desde 1). POST permite conservar el texto de búsqueda fuera de URL/historial y logs de acceso; es una operación de lectura. Rechazar campos desconocidos, tipos inválidos y página no entera/positiva. Responder 200 con pacientes `{ id, nombre, apellido, edad, telefono }`, página y haySiguiente; página válida fuera de rango devuelve colección vacía. No devolver nacimiento, contexto profesional ni datos clínicos.
- Reutilizar contexto, pool TLS, bandera de desarrollo y bloqueo en producción de CU01. Aplicar misma protección Origin/JSON/16 KiB, respuestas sin caché (`Cache-Control: no-store`) y errores públicos: 400 consulta inválida, 403 origen, 413 tamaño, 415 tipo y 503 contexto/consulta no disponible. Sin registrar payload o resultados.
- Para el volumen del prototipo, obtener solo candidatos del profesional y aplicar comparación Unicode y paginación en aplicación, sin extensiones SQL. Orden por claves normalizadas apellido/nombre y luego ID con comparación determinista. Limitación explícita: lectura completa del conjunto del profesional; no es solución de escala. No añadir índices o extensiones sin necesidad comprobada.
- UI inicial: listado con búsqueda enviada por botón/Enter, filtro aplicado visible y Limpiar, Anterior/Siguiente y estados vacíos/error/progreso. Separar texto en edición del filtro aplicado. Plazo de consulta 12 segundos; cancelación y control de respuestas tardías. Sin persistir datos en navegador. Tabla o presentación adaptable y controles accesibles.
- Integrar CU01 con callback de éxito: volver al listado actualizado tras guardar o cancelar. Mostrar confirmación de alta en el listado, conservar filtro y reiniciar página al volver; no alterar validaciones ni confirmación de duplicados. Perfil queda fuera de alcance.

## Comprobación y entrega

Pruebas ligadas a R1–R8: edad/29 de febrero, comparación literal (incluidos `%` y `_`), orden/desempate/páginas; PostgreSQL desechable con más de 20 pacientes y dos profesionales; API y UI, cancelación/respuestas tardías y navegación CU01. Ejecutar check y test:database; demo visual desktop/móvil con los dos pacientes remotos existentes, solo lectura. El alta/regreso se prueba con datos desechables o servicios simulados; no crear más pacientes remotos.

Registrar una sola validation.md con evidencia y límites. Guardar el cambio en rama local revisable, conservando el ajuste metodológico ya aprobado. No modificar AGENTS.md, contexto maestro, esquema, permisos ni credenciales. Publicación/PR y despliegue requieren autorización posterior.
