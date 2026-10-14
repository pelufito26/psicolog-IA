# Integración de la biblioteca con Codex

**Complemento:** esta guía adapta el método; no forma parte de los apuntes. Documentación oficial consultada el 14-10-2026. Confirmar comportamiento en el cliente instalado antes de adoptar cambios.

## Poner el conocimiento al alcance

| Opción | Ventaja | Condición |
| --- | --- | --- |
| Copia en `docs/metodologia/` | Funciona sin acceso externo y en entornos remotos | Registrar versión/commit y actualizar manualmente |
| Submódulo Git en `docs/metodologia/` | Fija un commit de la biblioteca | Inicializar el submódulo en cada checkout y entorno |
| Checkout local separado | Una biblioteca para varios repositorios | Ruta legible y permisos; no portable a nube sin materializarla |

La copia versionada es el punto de partida más simple. Mantener constitución y specs propias en el repositorio receptor. El contenido común orienta el método; no sustituye las reglas específicas del proyecto. Un proyecto de ChatGPT no es un sistema de archivos compartido universal con Codex. No prometer acceso por nombre de proyecto o enlace a un chat.

## Instrucciones del repositorio

Codex descubre `AGENTS.md` mediante una cadena global y del proyecto; puede usar `AGENTS.override.md`, y las instrucciones más cercanas al directorio de trabajo prevalecen dentro de esa cadena. Hay un límite configurable de tamaño combinado. Revisar reglas existentes y reiniciar la sesión cuando corresponda. Fuente: [AGENTS.md oficial](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Añadir, tras revisar el diff, una referencia como:

```markdown
## Metodología
- Biblioteca: docs/metodologia/README.md (versión/commit adoptado: completar).
- Para tareas SDD, lee docs/metodologia/metodologias/sdd.md.
- Lee docs/constitution.md y specs/NNN-nombre/ antes de implementar.
- No asumas una spec activa: usa la indicada en la tarea o solicita aclaración.
```

Esto da instrucciones de lectura, no acceso a archivos ni permisos nuevos. Pedir a Codex que enumere las fuentes efectivamente leídas antes del ensayo.

## Instalar la skill cuando se decida adoptarla

El paquete fuente mantiene `skills/sdd/`. **Esa carpeta por sí sola no implica descubrimiento automático.** Copiar el directorio completo a `<repositorio>/.agents/skills/sdd/` para ámbito de repositorio. La documentación actual también describe `~/.agents/skills` para ámbito de usuario. Esta sesión dispone de skills bajo `.codex/skills`; no extrapolar esa ruta a todos los clientes. Preferir la ruta de repositorio documentada y comprobar el catálogo. Fuente: [Build skills](https://learn.chatgpt.com/docs/build-skills).

La skill incluida es autocontenida: puede copiarse sola sin romper referencias a esta biblioteca. Las plantillas se copian por separado desde `plantillas/` si se desean. Revisar colisiones con otras skills llamadas `sdd`; Codex no fusiona dos skills del mismo nombre. La instalación global cambia su disponibilidad en otros proyectos y debe decidirse expresamente.

En CLI/IDE, la documentación describe `$sdd` y `/skills`; en superficies de ChatGPT describe selección mediante `@`. Usar el selector real del cliente. Si no se descubre la skill, comprobar la ruta y reiniciar; alternativamente pedir lectura explícita de su `SKILL.md`, sin afirmar que quedó instalada. La selección implícita depende de su descripción y no garantiza activación.

## Peticiones portables por fase

Estos textos son prompts, no comandos slash instalados:

```text
Usa la skill sdd disponible. Redacta specs/001-nombre/spec.md para [solicitud].
Lee la constitución y las instrucciones del repositorio. No escribas código.
Aclara las decisiones de producto pendientes y presenta el borrador.
```

```text
Revisa specs/001-nombre/spec.md: ambigüedades, contradicciones,
casos límite y conflictos con la constitución. Solo detecta problemas.
```

```text
Con la spec revisión [identificador] aprobada por mí, prepara plan.md y tasks.md.
No implementes. Muestra cobertura por RF y espera aprobación del plan y tareas.
```

```text
Implementa solo T1 del plan y tareas revisión [identificador] aprobados.
Usa el runner verificado del proyecto, tests primero cuando corresponda.
Registra evidencia y detente al terminar T1 o ante un bloqueo.
```

```text
Valida la revisión [identificador] requisito por requisito.
Indica tests ejecutados, resultados y controles no ejecutados. No corrijas todavía.
```

## Diferencias con OpenCode

No copiar `.opencode/commands`, `agent: plan`, `$ARGUMENTS`, `mode: subagent` o reglas `permissions` esperando comportamiento equivalente. Un encabezado YAML no crea un rol en Codex. Las fases pueden ejecutarse en un solo chat sin automatización. La delegación y los permisos se configuran mediante las capacidades de la versión y entorno utilizados; esta guía no instala agentes ni servidores MCP.

## Controles y prueba de integración

Separar autorización humana del flujo y permisos de ejecución. Elegir un entorno restringido y revisar acceso a escritura, red y comandos según la [guía oficial de aprobaciones](https://learn.chatgpt.com/docs/agent-approvals-security). No desactivar controles para resolver una incompatibilidad.

Ensayo: abrir un repositorio de prueba; confirmar lectura de biblioteca y AGENTS; comprobar skill en catálogo si se instaló; pedir solo una spec; verificar que no se implementó código; aprobar una revisión concreta; ejecutar una tarea pequeña y revisar diff/evidencia. Este paquete fue verificado como archivos, no instalado ni ensayado en repositorios del usuario.
