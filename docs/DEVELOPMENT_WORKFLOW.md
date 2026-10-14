# Desarrollo local

## Preparación

Usar Node 24.21.0 o un parche posterior de la línea 24 y npm 11 (comprobado con npm 11.13.0). La versión de referencia está en .node-version. Confirmar con node --version y npm --version; usar un gestor de versiones o un runtime aislado si el Node del equipo es anterior. No cambiar políticas de PowerShell: si bloquea npm.ps1, usar npm.cmd.

Desde la raíz del checkout:

```text
npm ci
npm run typecheck
npm test
npm run build
```

La instalación necesita acceso al registro npm y escribe node_modules. No requiere .env, Supabase ni credenciales. El lockfile fija las dependencias. Tests y compilación utilizan procesos locales, y las pruebas de API abren temporalmente un puerto en loopback.

## Ejecutar en desarrollo

En una terminal: npm run dev:api.

En otra: npm run dev:web.

Abrir http://127.0.0.1:5173 . La pantalla muestra «API disponible» si GET http://127.0.0.1:3001/api/health responde 200 y JSON {"status":"ok"}. Esto solo comprueba el backend, no autenticación o base de datos.

Detener la API propia con Ctrl+C y recargar la pantalla permite verificar el mensaje de conexión no confirmada. La consulta tiene plazo de cinco segundos y la interfaz continúa visible.

## Ejecutar la compilación

Después de npm run build, ejecutar npm run start:api y, en otra terminal, npm run preview:web. Preview usa también 127.0.0.1:5173 y el proxy hacia la API local. Detener antes el servidor de desarrollo para liberar su puerto.

El backend compilado queda en apps/api/dist y la interfaz en apps/web/dist. Esas salidas no se versionan. La compilación del frontend no configura por sí sola un servicio público ni autorización de pacientes.

## Conflictos y alcance

Los puertos 3001 y 5173 son fijos y locales. Si están ocupados, cerrar únicamente las instancias propias anteriores o identificar quién los utiliza antes de intervenir. No se detienen procesos ajenos automáticamente ni se cambia de puerto silenciosamente.

No hay despliegue, Supabase, autenticación o funciones clínicas.

## Calidad local y CI

Ejecutar npm run check para lint, formato, tipos, pruebas y build. Interrumpe al primer fallo. También pueden ejecutarse npm run lint y npm run format:check por separado; no modifican archivos.

Para aplicar formato explícitamente: npm run format:write. Prettier usa dos espacios, comillas simples, punto y coma, ancho 100 y finales LF. Excluye el lockfile generado, secretos, salidas, dependencias, PROJECT_CONTEXT.md y la copia de metodología. Las exclusiones están en .prettierignore. ESLint revisa código/configuración propios incluidos los tests; cualquier advertencia provoca fallo. No se activó lint dependiente de información de tipos: ese control se ejecuta por separado.

TypeScript se ajustó a 6.0.3 porque la integración de lint elegida no soporta 7. Esto mantiene el stack y los contratos de la aplicación; las verificaciones de 0B se vuelven a ejecutar. Consultar DEC-003 y la evidencia de 0C.

El workflow Calidad usa Node desde .node-version y npm 11.13.0 en ubuntu-24.04. Ejecuta instalación, lint, formato, tipos, pruebas y build en PR hacia main y push en main. Tiene permisos de lectura y límite de 15 minutos; no despliega ni incorpora PR automáticamente. Las protecciones de rama no se configuraron. La ejecución remota no se considera comprobada hasta observarla en GitHub.

## Evidencia

Ver specs/001-base-tecnica/validation.md. Instalación limpia, 13 pruebas, typecheck, build, contrato HTTP del backend compilado y estados de conexión en navegador fueron comprobados con Node 24.21.0.
