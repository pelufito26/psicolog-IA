# Revisor independiente

El usuario autorizó incorporar un único subagente revisor el 19 de octubre de 2026 (DEC-016). Su definición versionable está en `.codex/agents/revisor.toml`, dentro del checkout del repositorio. No pertenece a `apps/`, no se ejecuta en el producto y no es una dependencia de instalación o de CI. No modifica la biblioteca metodológica de referencia.

## Uso

El agente principal implementa y ejecuta los controles correspondientes. Antes de publicar un cambio funcional solicita una revisión independiente, indicando:

- Base y HEAD concretos (SHA) o diff/archivos exactos, sin incluir cambios ajenos pendientes.
- Especificación aprobada y requisitos afectados.
- Evidencia existente: pruebas, revisión visual y límites/no ejecutado.

Ejemplo de encargo: «Usá el subagente revisor para revisar CU06, base 1cccca2ac889e4fa9cd38ea533ccd021e916018f y HEAD 73c9dfd, contra specs/010-consultar-ficha-clinica. Solo lectura. Devolvé hallazgos con archivo/línea, impacto y evidencia; excluí AUTH T7 pendiente».

El revisor devuelve hallazgos al principal; no edita, ejecuta builds/tests que escriben, publica comentarios ni aprueba un PR. El principal comprueba cada hallazgo, corrige dentro del alcance autorizado y verifica lo afectado. Si cambia el diff, solicita revisión de las correcciones y del nuevo HEAD. Registrar base/HEAD, hallazgos, resolución, comprobaciones y límites en la evidencia del cambio. Sin hallazgos significa que no se detectaron problemas accionables en ese alcance; no reemplaza pruebas, controles de GitHub o aprobación humana.

Usar uno, sin cadena de subagentes. No se delegan decisiones de producto ni se inventan aprobaciones. Si no está disponible el subagente, informar y dejar la revisión independiente pendiente; una autorrevisión no se presenta como independiente. Si el usuario pide una excepción, registrar su alcance explícito.

## Configuración y portabilidad

Los archivos TOML de `.codex/agents/` definen agentes del proyecto según la [documentación oficial de subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents). El nombre es `revisor`; no se fija modelo ni esfuerzo para heredar los del principal. No se modifica configuración global, proveedores, MCP ni concurrencia. En otro equipo se obtiene al clonar el repo con un cliente Codex compatible; este archivo por sí solo no corre procesos ni revisa PR de GitHub automáticamente.

El archivo desactiva capacidades compatibles de apps/plugins/memoria/solicitud de permisos para el agente personalizado. El sandbox y las aprobaciones se heredan del chat principal: las instrucciones de no editar son un contrato de comportamiento, no un sandbox de solo lectura independiente. No se configura `sandbox_mode` en el TOML porque no sustituye los permisos del padre. Para aislamiento técnico estricto se necesita una sesión realmente de solo lectura; no se amplían permisos para conseguirlo.

El mecanismo de subagentes de este chat permite crear un agente con un encargo, pero no ofrece seleccionar un tipo personalizado por nombre. Para la prueba actual se le pidió leer el TOML y cumplirlo; no se afirma que el runtime haya cargado sus flags de capacidades. La carga nativa del perfil depende del cliente y debe distinguirse de esa delegación verificada.

## Primera comprobación

Sintaxis TOML comprobada con `tomllib`, sin dependencias nuevas. Se delegó una revisión real del commit CU06 a un agente separado, sin contexto conversacional heredado y con base/HEAD, especificación y límites explícitos. El resultado y su alcance se registran en `docs/revisiones/2026-10-19-cu06.md` al terminar. No se cambió código del producto para instalar el revisor; no se publicó la configuración.
