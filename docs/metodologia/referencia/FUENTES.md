# Fuentes y procedencia

## Fuentes primarias del curso

Autoría indicada en las portadas: **El Nuevo Programador**. Documentos aportados por el usuario en el proyecto «Desarrollo de Software con IA — Metodología». No se ha inferido una fecha de publicación ni una licencia. Los nombres siguientes permiten identificar los originales; no son enlaces rotos a archivos incluidos.

| ID | Archivo original | Páginas | Contenido usado |
| --- | --- | ---: | --- |
| D1 | Apuntes-Curso-Desarrollo-IA-Dia-1.pdf | 20 | LLM y límites (7-11); agente y harness (12, 15); AGENTS y memoria (16-19) |
| D2 | Apuntes-Curso-Desarrollo-IA-Dia-2.pdf | 20 | Comandos y skills (3-6); MCP y pruebas de interfaz (7-9); SDD, EARS y plantillas (9-19) |
| D3 | Apuntes-Curso-Desarrollo-IA-Dia-3.pdf | 11 | Agentes y delegación (3-4); roles, permisos y aprobación (5-9); loops, grafos, AgentOps (10) |

Las huellas SHA-256 se registran en `fuentes-manifest.json`. Permiten comprobar que se consultó la misma edición sin distribuir el original. La extracción de texto se usó para leer las secciones metodológicas; gráficos y datos de mercado de D1 no se reproducen ni se verifican aquí.

## Matriz de procedencia

| Archivo o familia | Derivado del curso | Complemento / adaptación |
| --- | --- | --- |
| fundamentos/harness-engineering.md | D1 12, 15-19; D2 3-9 | Controles verificables, separación entre política y enforcement |
| fundamentos/context-engineering.md | D1 8, 15-19; D2 4-6; D3 6 | Fuentes no confiables, versionado de contexto, recuperación |
| fundamentos/multiagentes.md | D3 3-10 | Contratos de entrega, colisiones Git, aplicación sin multiagentes |
| metodologias/sdd.md | D2 9-19; D3 6-9 | Registro de aprobación por revisión; RNF y evidencia trazable |
| guia-implementacion-harness.md | D1 15-19; D2 7-9, 12-19; D3 5-9 | Secuencia portable, matriz de permisos y Git |
| guia-integracion-codex.md | Ideas de D1 16-19 y D2 4-7 | Todo comportamiento específico de Codex se apoya en documentación oficial |
| skills/sdd/SKILL.md | D2 13-19; D3 6-9 | Skill autocontenida, runner adaptable y registro de aprobaciones |
| plantillas/ | D1 16-19; D2 12-16 | Metadatos, matriz de trazabilidad, comandos por completar |
| ejemplos/, PUBLICACION.md, VERIFICACION.md | Ilustran el método | Contenido propio, no ejemplo original del curso |

## Documentación oficial de Codex consultada

Consulta: **14-10-2026**. Las antiguas URLs de `developers.openai.com/codex` consultadas redirigieron a ChatGPT Learn. No usar la documentación de Agents API como si describiera la instalación local de Codex.

- [Build skills](https://learn.chatgpt.com/docs/build-skills): formato, descubrimiento local e invocación; se usa en la guía de integración.
- [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): descubrimiento y composición de instrucciones.
- [Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security): controles del entorno y autorizaciones.

**Complemento:** las instrucciones Markdown expresan acuerdos de trabajo. El control efectivo de escritura, red y ejecución corresponde al entorno y a su configuración, no a una promesa en el texto.
