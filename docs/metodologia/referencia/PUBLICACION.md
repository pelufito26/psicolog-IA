# Preparación para GitHub

**Complemento.** Destino previsto: repositorio `desarrollo-ia-metodologia`. Este paquete no presume conexión, propietario ni permiso de publicación.

## Antes de publicar

1. Confirmar cuenta u organización y visibilidad deseada.
2. Revisar todo el contenido y los derechos para distribuir las síntesis. Los PDF se excluyen y no se concede una licencia sobre el curso.
3. Elegir una licencia apropiada para los aportes propios cuando se pueda otorgar. No se incluyó una licencia por defecto.
4. Confirmar que no hay secretos ni datos de proyectos particulares.
5. Obtener autorización explícita para crear el repositorio y subir esta versión; la autenticación por sí sola no es autorización.

## Preparación local sugerida

Extraer el ZIP y abrir la carpeta `desarrollo-ia-metodologia`. Revisar archivos antes de inicializar Git. Ejemplo de comandos locales, ejecutados individualmente y tras comprobar el directorio:

```text
git init -b main
git status --short
git add README.md FUENTES.md PUBLICACION.md VERIFICACION.md fuentes-manifest.json .gitignore .gitattributes fundamentos metodologias plantillas skills ejemplos guia-implementacion-harness.md guia-integracion-codex.md
git diff --cached
git commit -m "Añade biblioteca metodológica de desarrollo con IA"
```

El paquete no incluye `.git` ni un historial creado. Después de autorización y conexión, configurar el remoto del propietario confirmado y subir la rama. Si ya existe un repositorio con ese nombre, inspeccionarlo antes de decidir cómo incorporar archivos; no sobrescribirlo.

## Adopción futura

Crear una release revisada y registrar su commit en cada consumidor. Los cambios de esta biblioteca se proponen como actualización explícita de cada proyecto, con revisión humana. No aplicar automáticamente a Arago ni PsicologIA.
