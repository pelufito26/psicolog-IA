# Desarrollo asistido por IA: biblioteca metodológica

Versión inicial: 0.1.0 · Preparada el 14 de octubre de 2026.

Biblioteca general para dirigir desarrollo asistido por IA con requisitos, contexto, permisos, pruebas y supervisión humana. Nombre previsto del repositorio: `desarrollo-ia-metodologia`. Este paquete no se ha aplicado a Arago ni PsicologIA, no instala configuración y no publica un repositorio.

## Procedencia

**Curso** significa síntesis o adaptación fiel de los apuntes de El Nuevo Programador, Días 1, 2 y 3. **Complemento** identifica decisiones editoriales, prácticas de Git y trazabilidad, generalizaciones del ejemplo y adaptación a Codex. Las referencias D1/D2/D3 remiten a páginas físicas del PDF, contadas desde la portada. Consulta [fuentes y matriz de procedencia](FUENTES.md).

Las plantillas y la skill son adaptaciones ejecutables del método, no transcripciones ni archivos oficiales del curso. El curso usa OpenCode y el Diario de Estudio; sus comandos y restricciones técnicas no se presentan como universales. Las afirmaciones de mercado, porcentajes y rankings de los apuntes no se usan como evidencia de esta metodología.

## Recorrido recomendado

1. Entender [harness engineering](fundamentos/harness-engineering.md), [context engineering](fundamentos/context-engineering.md) y [multiagentes](fundamentos/multiagentes.md).
2. Seguir [SDD](metodologias/sdd.md), desde la constitución hasta la validación y mantenimiento.
3. Preparar un entorno mediante la [guía de implementación del harness](guia-implementacion-harness.md).
4. Elegir una forma de reutilización en la [guía de integración con Codex](guia-integracion-codex.md).
5. Adaptar las [plantillas](plantillas/README.md) al repositorio receptor y revisar la [skill SDD](skills/sdd/SKILL.md).

## Uso desde otro repositorio

La biblioteca debe estar disponible como archivos legibles en ese entorno: copia versionada, submódulo o checkout accesible. Un enlace al proyecto de ChatGPT o a GitHub no carga automáticamente su contenido en Codex. Una referencia escrita en `AGENTS.md` tampoco configura permisos ni garantiza acceso a la ruta.

Ejemplo de petición una vez que los archivos estén presentes:

```text
Lee docs/metodologia/README.md y docs/metodologia/metodologias/sdd.md.
Usa esa versión como referencia para redactar la spec de esta solicitud.
No implementes código. Señala dudas y espera mi aprobación de la spec.
```

## Contenido y límites

- Fundamentos y método con citas a los apuntes.
- Guías prácticas, plantillas de AGENTS/constitution/spec/plan/tasks, memoria e informe de validación.
- Skill autocontenida para copiar a una ubicación reconocida por Codex.
- Ejemplo completo de trazabilidad, permisos conceptuales y controles de publicación.
- Verificación del paquete en [VERIFICACION.md](VERIFICACION.md).

Los PDF originales no se distribuyen: se conservan como referencias privadas en el proyecto de origen. No se otorga una licencia sobre el material del curso ni se presupone permiso para redistribuirlo. Antes de publicación pública, confirmar derechos sobre la síntesis y elegir una licencia para los aportes propios; ver [publicación](PUBLICACION.md).

## Mantenimiento (complemento)

Versionar cambios de método; registrar el commit adoptado en cada repositorio receptor. Actualizar la biblioteca no cambia por sí solo las reglas de esos proyectos. Revisar documentación oficial de Codex al actualizar la integración: las rutas y capacidades pueden variar por cliente y versión.
