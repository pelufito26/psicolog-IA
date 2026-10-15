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

Hay persistencia Supabase de desarrollo verificada y registro local de pacientes ficticios (CU01). No hay despliegue ni autenticación productiva. Fichas y sesiones todavía no están implementadas en la interfaz.

## Calidad local y CI

Ejecutar npm run check para lint, formato, tipos, pruebas y build. Interrumpe al primer fallo. También pueden ejecutarse npm run lint y npm run format:check por separado; no modifican archivos.

Para aplicar formato explícitamente: npm run format:write. Prettier usa dos espacios, comillas simples, punto y coma, ancho 100 y finales LF. Excluye el lockfile generado, secretos, salidas, dependencias, PROJECT_CONTEXT.md y la copia de metodología. Las exclusiones están en .prettierignore. ESLint revisa código/configuración propios incluidos los tests; cualquier advertencia provoca fallo. No se activó lint dependiente de información de tipos: ese control se ejecuta por separado.

TypeScript se ajustó a 6.0.3 porque la integración de lint elegida no soporta 7. Esto mantiene el stack y los contratos de la aplicación; las verificaciones de 0B se vuelven a ejecutar. Consultar DEC-003 y la evidencia de 0C.

El workflow Calidad usa Node desde .node-version y npm 11.13.0 en ubuntu-24.04. Ejecuta instalación, lint, formato, tipos, pruebas y build en PR hacia main y push en main. Tiene permisos de lectura y límite de 15 minutos; no despliega ni incorpora PR automáticamente. Las protecciones de rama no se configuraron. La ejecución de controles está comprobada en GitHub para main; ver evidencias de 0C y 0D.

## Evidencia

Ver specs/001-base-tecnica/validation.md. Instalación limpia, 13 pruebas, typecheck, build, contrato HTTP del backend compilado y estados de conexión en navegador fueron comprobados con Node 24.21.0.

## Persistencia de desarrollo (0D)

Ver docs/DATABASE.md para modelo, restricciones y límites. npm run test:database requiere PostgreSQL 17 local desechable y banderas de entorno específicas; no conecta a Supabase. npm run db:check requiere compilar y configurar localmente una cuenta restringida mediante apps/api/.env. No confundir ambos comandos. La migración SQL se aplicó al proyecto de desarrollo y el job PostgreSQL pasó en GitHub tras el merge de PR #4. La cuenta técnica y el rollback del backend se verificaron; consultar DATABASE.md para límites y precauciones del historial.

## CU01 — Registrar paciente en desarrollo local

Spec, plan, tareas y evidencia: specs/004-registrar-paciente/. Compilar con npm run build. Configurar DATABASE_URL y DATABASE_CA_FILE en apps/api/.env (ignorado por Git), según DATABASE.md. DEV_PROFESIONAL_ID debe ser el UUID de un profesional ficticio existente; DEV_PATIENT_REGISTRATION=true habilita el flujo. En NODE_ENV=production se rechaza. Reiniciar la API tras cambiar variables. npm run dev:api y npm run start:api cargan opcionalmente ese .env desde el workspace del backend.

El seed es una operación remota explícita, separada de tests/CI. Solo con autorización vigente para el proyecto de desarrollo:

```powershell
node --env-file=apps/api/.env scripts/seed-demo.mjs --project vrqmpdedckkgxpdleepr
```

Crea o reutiliza exclusivamente el profesional con email profesional-demo@example.invalid y configura el contexto local; no crea pacientes. La demo autorizada de CU01 ya creó dos pacientes ficticios desde el formulario. No repetir escrituras de demo sin revisar el alcance. El seed no concede permisos ni modifica el esquema.

Abrir http://127.0.0.1:5173 con la API en 127.0.0.1:3001. POST /api/pacientes acepta JSON de hasta 16 KiB, cuatro campos personales y confirmacionDuplicado opcional. El profesional viene del servidor. Origin presente debe ser localhost o 127.0.0.1 en puerto 5173; no se habilita CORS abierto. La confirmación vence en diez minutos y queda ligada a datos/profesional/proceso. El navegador espera hasta doce segundos y no reintenta escrituras automáticamente. Un fallo de red puede dejar un resultado incierto: una nueva solicitud sin confirmación vuelve a buscar duplicados.

npm run check verifica dominio, API y UI. npm run test:database agrega pruebas de registro y concurrencia a las comprobaciones del esquema en dos bases desechables; no requiere credenciales de Supabase. No usar este contexto ficticio como autenticación ni exponer el servidor públicamente.

## CU02 — Listado local

La pantalla inicial muestra Pacientes. POST /api/pacientes/consulta recibe busqueda y pagina en JSON, con el mismo contexto local, bandera y protección Origin de CU01; las respuestas son no-store. Muestra páginas de 20 con apellido, nombre, edad calculada en Montevideo y teléfono. La búsqueda es parcial y literal en nombre o apellido, sin distinguir acentos/caso; el orden normalizado desempata por nombre e ID. Para nacidos el 29/2, los años no bisiestos cumplen el 1/3. Tras guardar o cancelar un alta, vuelve al listado y consulta de nuevo conservando el filtro. No incluye perfil.

El prototipo lee los candidatos del profesional y compara/pagina en memoria; revisar esta estrategia antes de escalar. No registrar búsquedas/pacientes ni persistirlos en navegador. La consulta vence a los 12 segundos. Evidencia única: specs/005-listar-pacientes/validation.md. Los tests/CI incluyen paginación y separación de profesionales en PostgreSQL desechable; no crean filas en Supabase.

## Acceso en dos pasos — preparación local

El servidor normal ya no usa DEV_PROFESIONAL_ID/DEV_PATIENT_REGISTRATION como bypass. Para pacientes requiere cookie opaca HttpOnly y CSRF, resuelve el profesional desde su sesión y fija contexto RLS por transacción. GET /api/health permanece público. Sin configuración completa, /api/acceso devuelve 503 y pacientes 401; no apuntar el nuevo servidor a una base remota sin preparar y aprobar antes su migración de acceso.

npm run check incluye pruebas del adaptador Supabase con respuestas simuladas. npm run test:database agrega migración, sesiones/códigos, revocación, límites y aislamiento mediante PostgreSQL desechable; Auth y correo siguen simulados en ese ensayo. No se necesitan cuentas reales para CI.

Harness visual (solo prueba local): con PostgreSQL 17 aislado, sin rol psicologia_backend preexistente, iniciar después de npm run build:

```powershell
$env:AUTH_TEST_HARNESS='1'
$env:TEST_DATABASE_URL='postgresql://postgres:solo-pruebas-ficticias@127.0.0.1:55433/postgres'
node scripts/auth-tests/demo.mjs
```

La URL anterior es exclusivamente el ejemplo de la instancia portátil de esta PC; cada entorno configura su PostgreSQL desechable. El harness crea una base de nombre aleatorio, aplica migraciones y sirve API 127.0.0.1:3001 y buzón 127.0.0.1:3002; requiere puertos libres. Ejecutar dev:web aparte en 5173. Registro admite solo cuentas @example.invalid y contraseñas ficticias. El buzón permite abrir enlaces y leer códigos ficticios; no está montado por server.ts. Banner visible SIMULACIÓN LOCAL. No introducir email o contraseña real. Al terminar por SIGINT/SIGTERM intenta cerrar y retirar exclusivamente su base/rol; ante terminación forzada puede requerir limpieza manual de esa instancia aislada. No usarlo en servidor público o compartido.

La sesión exige código tras contraseña, 5 minutos/5 intentos/60 segundos entre envíos y hasta 5 envíos por cuenta en 15 minutos; origen limitado a 30 operaciones en 15 minutos. La sesión dura hasta 8 horas y vence tras 30 minutos de inactividad; logout la revoca en DB. Código y cookie se almacenan como verificadores/hash, nunca en claro. La recuperación bloquea/revoca antes del cambio; un fallo parcial mantiene la cuenta cerrada hasta repetir correctamente recuperación. Preservar AUTH_SECRET fuera de Git.

T7 pendiente: cuenta de proveedor de correo, destinatarios autorizados, remitente/dominio o remitente de prueba válido, SMTP Supabase para confirmación/recuperación, plantilla con token_hash y propósito y redirección local exacta, claves publicables/servidor fuera de Git, SQL y permisos revisados. El adaptador real usa Supabase y API Resend desde backend. No se han creado cuentas ni enviado emails reales. No ejecutar db push sobre el historial remoto sin conciliar las operaciones administrativas de 0D. Ver specs/006-acceso-profesionales/validation.md.
