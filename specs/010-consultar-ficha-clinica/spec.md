# CU06 — Consultar ficha clínica

CU06-r1 · Aprobada mediante «si», el 19 de octubre de 2026.

## Objetivo y alcance

El profesional con sesión completa vigente abre desde el perfil de un paciente propio la ficha creada en CU05 y consulta su contenido, sin modificarlo. Fuente: resumen de CU06 y modelo de PROJECT_CONTEXT.md, DEC-014 y comportamiento de CU05. No se dispone del caso de uso original completo; las precisiones siguientes fueron aprobadas como CU06-r1, sin atribuirlas a un caso original recuperado.

Incluye lectura de los seis campos y fechas, estados de carga/ausencia/error y navegación al perfil/listado. Quedan fuera edición (CU07), sesiones, exportación, impresión especial, adjuntos, historial de versiones y decisiones clínicas automáticas. Solo datos ficticios y harness local existente; AUTH T7 continúa separado. Sin nuevas dependencias, esquema, permisos, operaciones remotas, correos, publicación o despliegue.

## Requisitos y aceptación

| ID  | Requisito verificable                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Cuando el perfil confirma que existe ficha, ofrece Ver ficha clínica. Al abrir, consulta el contenido actual del paciente seleccionado; no reutiliza contenido de otro paciente ni presenta el borrador de CU05 como información guardada.                                                                                                                                    |
| R2  | La vista identifica al paciente por nombre y apellido y muestra motivo de consulta, antecedentes personales, antecedentes familiares, medicación, evaluación clínica y observaciones generales con rótulos separados. Los cinco optativos vacíos muestran Sin registrar, sin inventar contenido.                                                                              |
| R3  | Mostrar los textos guardados completos, preservando saltos de línea y espacios internos, con ajuste de línea para textos largos. Tratar HTML u otro contenido como texto plano, sin ejecutarlo ni interpretarlo como instrucciones.                                                                                                                                           |
| R4  | Mostrar fecha de creación y última modificación de la ficha con fecha y hora en America/Montevideo. Consultar no modifica estas fechas, la ficha, el paciente ni las sesiones; tampoco crea registros clínicos.                                                                                                                                                               |
| R5  | La identidad del profesional procede exclusivamente de la sesión comprobada. El backend y la persistencia verifican pertenencia a través del paciente. Sin sesión completa vigente no se devuelve contenido; el administrador no obtiene acceso clínico. Paciente ajeno e inexistente responden de forma indistinguible, sin revelar existencia de ficha ni datos personales. |
| R6  | Si el paciente propio no tiene ficha, mostrar Todavía no tiene ficha clínica y permitir volver al perfil para crearla mediante CU05. Distinguir este estado de paciente no disponible y de fallo temporal. Un error no se presenta como ficha vacía ni ofrece crear otra por asumir ausencia.                                                                                 |
| R7  | Distinguir carga, éxito, ausencia, paciente no disponible y error temporal. Ante error de lectura ofrecer reintento explícito y regreso al perfil. Durante carga/error no mostrar contenido de una consulta anterior como si fuera el resultado actual.                                                                                                                       |
| R8  | Volver al perfil conserva el paciente seleccionado. El posterior regreso al listado conserva filtro aplicado, texto sin aplicar y página, como en CU03–CU05. Tras crear una ficha mediante CU05, el perfil permite abrir la ficha confirmada.                                                                                                                                 |
| R9  | Logout, vencimiento o cambio de cuenta eliminan la vista clínica y descartan respuestas pendientes. Al cambiar de paciente tampoco se muestran respuestas tardías del anterior. Mantener protecciones de sesión/CSRF/Origin y respuestas no-store; sin textos clínicos en URL, logs ni almacenamiento persistente del navegador.                                              |
| R10 | Vista de solo lectura operable por teclado, con encabezados y controles identificables, estados anunciados y contenido legible en escritorio/móvil sin desbordamiento horizontal. No ofrece guardar o editar dentro de CU06.                                                                                                                                                  |

## Verificación proporcional

- Aplicación/HTTP (R1, R2, R5–R7, R9): lectura propia, paciente propio sin ficha, ajeno/inexistente equivalentes, sesión ausente/incompleta/expirada, contrato de campos, errores públicos y no-store.
- PostgreSQL local desechable con dos profesionales (R2–R5): contenido y fechas exactos, optativos vacíos, aislamiento y comparación antes/después de ficha/paciente/sesiones para demostrar que la consulta no los modifica.
- Interfaz (R1–R3, R6–R10): seis campos, identificación, texto literal/multilínea, fechas en Montevideo, estados y reintento, navegación/contexto, respuestas tardías y limpieza del acceso.
- Recorrido ficticio listado → perfil → crear (CU05) → perfil → consultar → perfil → listado; teclado y escritorio/móvil. Mantener los controles existentes y registrar evidencia y límites al implementar.

## Puertas siguientes

CU06-r1 y plan/tareas CU06-plan-r1/CU06-tasks-r1 aprobados. El lote T1–T4 habilita implementación y cierre locales; no autoriza publicación. Decisión registrada en DEC-015. Evidencia en validation.md.
