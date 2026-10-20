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

CU01–CU11 están implementados: pacientes, ficha clínica y sesiones, con altas, consultas y ediciones desde la interfaz. Hay persistencia de desarrollo y un piloto de acceso real con Supabase/Resend; no hay despliegue ni aceptación productiva. Pacientes y contenido clínico siguen siendo exclusivamente ficticios. El estado inicial histórico se conserva en las evidencias de cada etapa, no describe la interfaz actual.

## Calidad local y CI

Ejecutar npm run check para lint, formato, tipos, pruebas y build. Interrumpe al primer fallo. También pueden ejecutarse npm run lint y npm run format:check por separado; no modifican archivos.

Para aplicar formato explícitamente: npm run format:write. Prettier usa dos espacios, comillas simples, punto y coma, ancho 100 y finales LF. Excluye el lockfile generado, secretos, salidas, dependencias, PROJECT_CONTEXT.md y la copia de metodología. Las exclusiones están en .prettierignore. ESLint revisa código/configuración propios incluidos los tests; cualquier advertencia provoca fallo. No se activó lint dependiente de información de tipos: ese control se ejecuta por separado.

TypeScript se ajustó a 6.0.3 porque la integración de lint elegida no soporta 7. Esto mantiene el stack y los contratos de la aplicación; las verificaciones de 0B se vuelven a ejecutar. Consultar DEC-003 y la evidencia de 0C.

El workflow Calidad usa Node desde .node-version y npm 11.13.0 en ubuntu-24.04. Ejecuta instalación, lint, formato, tipos, pruebas y build en PR hacia main y push en main. Tiene permisos de lectura y límite de 15 minutos; no despliega ni incorpora PR automáticamente. Las protecciones de rama no se configuraron. La ejecución de controles está comprobada en GitHub para main; ver evidencias de 0C y 0D.

## Evidencia

La evidencia inicial está en specs/001-base-tecnica/validation.md (13 pruebas en esa etapa). CU11 llegó a 363 pruebas unitarias/de componentes/HTTP y matrices PostgreSQL adicionales. La evidencia del recorrido actual y sus límites se mantiene en specs/014-integracion-mvp/validation.md; no deducir el conteo actual de una evidencia histórica.

## Persistencia de desarrollo (0D)

Ver docs/DATABASE.md para modelo, restricciones y límites. npm run test:database requiere PostgreSQL 17 local desechable y banderas de entorno específicas; no conecta a Supabase. npm run db:check requiere compilar y configurar localmente una cuenta restringida mediante apps/api/.env. No confundir ambos comandos. La migración SQL se aplicó al proyecto de desarrollo y el job PostgreSQL pasó en GitHub tras el merge de PR #4. La cuenta técnica y el rollback del backend se verificaron; consultar DATABASE.md para límites y precauciones del historial.

## CU01 — Registrar paciente en desarrollo local

Spec, plan, tareas y evidencia: specs/004-registrar-paciente/. Compilar con npm run build. El servidor normal requiere la configuración real completa descrita abajo y una sesión de profesional; DEV_PROFESIONAL_ID/DEV_PATIENT_REGISTRATION ya no habilitan acceso. En NODE_ENV=production se rechaza. Reiniciar la API tras cambiar variables. npm run dev:api y npm run start:api cargan opcionalmente apps/api/.env, excluido de Git.

El antiguo seed de CU01 fue una operación de desarrollo acotada; no se ejecuta al clonar ni sirve como login. No crear/reutilizar profesionales ni escribir en Supabase para preparar pruebas: usar el harness ficticio local descrito abajo. La identidad del profesional viene de la sesión comprobada.

Abrir http://127.0.0.1:5173 con la API en 127.0.0.1:3001. POST /api/pacientes acepta JSON de hasta 16 KiB, cuatro campos personales y confirmacionDuplicado opcional. El profesional viene del servidor. Origin presente debe ser localhost o 127.0.0.1 en puerto 5173; no se habilita CORS abierto. La confirmación vence en diez minutos y queda ligada a datos/profesional/proceso. El navegador espera hasta doce segundos y no reintenta escrituras automáticamente. Un fallo de red puede dejar un resultado incierto: una nueva solicitud sin confirmación vuelve a buscar duplicados.

npm run check verifica dominio, API y UI. npm run test:database agrega registro, concurrencia y recorrido integrado a las comprobaciones del esquema en dos bases desechables; no requiere credenciales de Supabase. El harness ficticio está separado del servidor normal; no exponerlo públicamente.

## CU02 — Listado local

Después del ingreso completo, la pantalla inicial muestra Pacientes. POST /api/pacientes/consulta recibe busqueda y pagina en JSON, con sesión, CSRF, profesional comprobado y Origin exacto; las respuestas son no-store. Muestra páginas de 20 con apellido, nombre, edad calculada en Montevideo y teléfono. La búsqueda es parcial y literal en nombre o apellido, sin distinguir acentos/caso; el orden normalizado desempata por nombre e ID. Para nacidos el 29/2, los años no bisiestos cumplen el 1/3. Tras guardar o cancelar un alta, vuelve al listado y consulta de nuevo conservando el filtro. El perfil y su edición están implementados en CU03/CU04.

El prototipo lee los candidatos del profesional y compara/pagina en memoria; revisar esta estrategia antes de escalar. No registrar búsquedas/pacientes ni persistirlos en navegador. La consulta vence a los 12 segundos. Evidencia única: specs/005-listar-pacientes/validation.md. Los tests/CI incluyen paginación y separación de profesionales en PostgreSQL desechable; no crean filas en Supabase.

## Acceso en dos pasos — preparación local

El servidor normal ya no usa DEV_PROFESIONAL_ID/DEV_PATIENT_REGISTRATION como bypass. Para pacientes, fichas y sesiones requiere cookie opaca HttpOnly y CSRF, resuelve el profesional desde su sesión y fija contexto RLS por transacción. GET /api/health permanece público. Sin configuración completa, /api/acceso devuelve 503. Las rutas privadas rechazan antes el CSRF inválido (403); con cookie/CSRF válidos pero sin sesión vigente responden 401. No apuntar el servidor a una base remota sin preparar y aprobar antes su migración de acceso.

Para otro equipo, copiar únicamente la estructura de apps/api/.env.example a un .env local y obtener por un canal seguro los valores del entorno autorizado. Variables: DATABASE_URL, DATABASE_CA_FILE cuando corresponda al TLS, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, AUTH_REDIRECT_URL, AUTH_SECRET (aleatorio, al menos 32 caracteres), AUTH_MAIL_MODE=resend, RESEND_API_KEY y AUTH_FROM. No copiar secretos a Git, frontend, capturas o chat; clonar el repo no transfiere estas credenciales ni habilita acceso remoto. La cuenta SQL del backend debe ser restringida, con la migración de acceso ya conciliada; no ejecutar migraciones automáticamente para arrancar. El servidor usa loopback y no sustituye un despliegue.

npm run check incluye pruebas del adaptador Supabase con respuestas simuladas. npm run test:database agrega migración, sesiones/códigos, revocación, límites y aislamiento mediante PostgreSQL desechable; Auth y correo siguen simulados en ese ensayo. No se necesitan cuentas reales para CI.

Harness visual (solo prueba local): con PostgreSQL 17 aislado, sin rol psicologia_backend preexistente, iniciar después de npm run build:

```powershell
$env:AUTH_TEST_HARNESS='1'
$env:TEST_DATABASE_URL='postgresql://postgres:solo-pruebas-ficticias@127.0.0.1:5432/postgres'
node scripts/auth-tests/demo.mjs
```

La URL es un ejemplo de conexión a una instancia PostgreSQL 17 exclusiva y desechable previamente preparada en ese puerto, con esa credencial ficticia; adaptarla a la instancia local. No es una instrucción de instalación. Se requiere un usuario local capaz de crear/eliminar bases y roles y ausencia del rol psicologia_backend al iniciar. No usar una instancia compartida ni sustituir TEST_DATABASE_URL por DATABASE_URL de Supabase. El repo no instala PostgreSQL/Docker ni contiene el helper portátil particular de esta PC.

El harness crea una base de nombre aleatorio, aplica migraciones y sirve API 127.0.0.1:3001 y buzón 127.0.0.1:3002; requiere puertos libres. Ejecutar dev:web aparte en 5173. Registro admite solo cuentas @example.invalid y contraseñas ficticias. El buzón permite abrir enlaces y leer códigos ficticios; no está montado por server.ts. Banner visible SIMULACIÓN LOCAL. No introducir email o contraseña real. Al terminar por SIGINT/SIGTERM intenta cerrar y retirar exclusivamente su base/rol; ante terminación forzada puede requerir limpieza manual de esa instancia aislada. No usarlo en servidor público o compartido.

Para la matriz automatizada, en la instancia exclusiva anterior y desde la raíz del repo:

```powershell
$env:TEST_DATABASE_URL='postgresql://postgres:solo-pruebas-ficticias@127.0.0.1:5432/postgres'
$env:TEST_DISPOSABLE_DATABASES='1'
npm run test:database
```

Ese comando compila la API, crea dos bases vacías, aplica las migraciones y ejecuta matrices CU01–CU11/AUTH más el recorrido HTTP integrado. La matriz de acceso usa identidad/correo ficticios; el nuevo recorrido crea sus propios pacientes y contrasta snapshots SQL tras cada escritura. Las bases se retiran al terminar. Los usuarios anon/authenticated preexistentes se conservan; preparar/retirar la instancia exclusiva sigue siendo responsabilidad del entorno. No promete provisión automática de PostgreSQL en un equipo nuevo.

La sesión exige código tras contraseña, 5 minutos/5 intentos/60 segundos entre envíos y hasta 5 envíos por cuenta en 15 minutos; origen limitado a 30 operaciones en 15 minutos. La sesión dura hasta 8 horas y vence tras 30 minutos de inactividad; logout la revoca en DB. Código y cookie se almacenan como verificadores/hash, nunca en claro. La recuperación bloquea/revoca antes del cambio; un fallo parcial mantiene la cuenta cerrada hasta repetir correctamente recuperación. Preservar AUTH_SECRET fuera de Git.

Piloto real del 20 de octubre: el usuario comprobó registro/confirmación, contraseña+código por correo y logout. Se observaron dos correos entregados y revocación de la sesión en DB. Supabase Auth usa SMTP Resend para confirmación/recuperación; el backend envía el código propio mediante API Resend. Recuperación real diferida por el usuario: AUTH T7 no se declara completa, y el aislamiento remoto con un segundo destinatario tampoco se ensayó. CI/harness no envían correos. Sin dominio propio, el remitente de prueba está limitado al destinatario autorizado; no implica envío abierto. No ejecutar db push sobre el historial remoto sin conciliar operaciones administrativas. La evidencia detallada de AUTH se mantiene separada de esta integración local.

Los enlaces de confirmación/recuperación apuntan a http://127.0.0.1:5173/ con token_hash y propósito. Deben abrirse en la misma PC donde corre el frontend; desde celular u otra PC, 127.0.0.1 apunta a ese otro dispositivo. No reenviar tokens/códigos por chat. Un enlace de confirmación no sustituye el código de un nuevo ingreso ni habilita por sí solo las rutas clínicas.

## CU03 — Perfil del paciente

El nombre de cada paciente en el listado permite abrir su perfil personal. POST /api/pacientes/perfil recibe solo id en JSON, con sesión completa y CSRF; consulta parametrizada por paciente y profesional y contexto RLS transaccional. Ausente y ajeno responden igual (404); no se muestran datos clínicos. Volver conserva filtro aplicado, texto en edición y página, y actualiza el listado. Datos solo en memoria y respuestas no-store; la edad comparte la regla de CU02.

El harness explícito de scripts/auth-tests/demo.mjs acepta opcionalmente AUTH_TEST_FIXTURE=perfil: crea únicamente en su base local desechable un profesional ficticio confirmado y 21 pacientes para probar dos páginas. Cuenta ficticia: perfil-demo@example.invalid; contraseña de demo: solo-demo-123456; código en el buzón ficticio local. Esta opción no existe en el servidor normal y no envía correos. Mantener los requisitos del harness descritos abajo. Evidencia: specs/007-perfil-paciente/validation.md.

## CU04 — Edición local desde el perfil

Editar datos carga los cuatro campos actuales mediante POST /api/pacientes/edicion y guarda con POST /api/pacientes/actualizar. Mantiene sesión/CSRF y contexto profesional comprobados; ID, profesional y creación no se editan. Se reutilizan las reglas de CU01, con detección de duplicados excluyendo al propio paciente y confirmación ligada a operación, valores, paciente y versión. Guardar vuelve al perfil consultado y Cancelar no escribe; el contexto del listado se conserva.

La versión opaca se calcula con HMAC sobre el timestamp de PostgreSQL con precisión completa. Bajo bloqueo compartido con el alta y bloqueo de fila se vuelve a verificar antes de actualizar: un cambio concurrente devuelve conflicto, conserva el borrador y requiere recarga explícita. Los verificadores dependen del secreto del proceso y se invalidan al reiniciar. Ante respuesta de escritura perdida, revisar el perfil antes de reintentar; no se promete que una cancelación de red revierta un COMMIT.

La fixture ficticia de perfil también permite probar edición; el harness conserva un secreto estable entre peticiones de alta/edición. Pruebas de concurrencia, relaciones clínicas e identidades aisladas solo en PostgreSQL local desechable. Sin cambios de esquema ni operaciones remotas. Evidencia: specs/008-editar-paciente/validation.md.

## CU05 — Crear ficha clínica

El perfil consulta POST /api/fichas-clinicas/estado con pacienteId: devuelve solo existencia, sin contenido clínico. Ofrece crear únicamente tras comprobar que falta; errores no equivalen a ausencia. POST /api/fichas-clinicas/crear recibe pacienteId y motivoConsulta obligatorio, con antecedentesPersonales, antecedentesFamiliares, medicacion, evaluacionClinica y observacionesGenerales opcionales. Se preserva el formato interno como texto plano y los opcionales vacíos se almacenan como NULL.

Módulo fichas-clinicas con contratos propios, sesión/CSRF y propietario del paciente comprobados, contexto RLS transaccional y restricción UNIQUE existente. La creación no sobrescribe fichas ni modifica pacientes/sesiones. JSON total hasta 16 KiB, respuestas no-store y sin textos clínicos en URL/logs/almacenamiento persistente. Ante creación incierta, conservar borrador y comprobar estado sin reenvío automático; existencia no confirma el contenido de una petición perdida. Consulta completa/edición están implementadas en CU06/CU07, descritos abajo.

Demo con la fixture local de pacientes y textos exclusivamente ficticios. npm run check y test:database verifican validación, separación de profesionales, carreras y preservación de datos. No requiere migraciones o dependencias nuevas. Evidencia única: specs/009-crear-ficha-clinica/validation.md.

## CU06 — Consultar ficha clínica

Desde el perfil con ficha existente, Ver ficha clínica abre los seis campos guardados, identificación del paciente y fechas en America/Montevideo. Solo lectura; los optativos vacíos muestran Sin registrar. Volver al perfil y luego al listado conserva filtro, texto sin aplicar y página. La demo existente de AUTH/CU05 permite crear una ficha ficticia y consultarla; no usa correo ni identidad reales. La lectura usa POST /api/fichas-clinicas/consultar con pacienteId, sesión/CSRF/Origin y no-store. Sin ficha se informa ausencia solo tras lectura autorizada exitosa; los fallos no se convierten en ficha vacía. Evidencia: specs/010-consultar-ficha-clinica/validation.md. La edición CU07 está descrita a continuación; AUTH T7 se mantiene separado de las pruebas locales.

## CU07 — Actualizar ficha clínica

Desde CU06, Editar ficha clínica carga la versión vigente y permite reemplazar los seis campos; solo motivo es obligatorio. Guardar vuelve a consultar lo persistido; cancelar antes de enviar no escribe. Dos editores desactualizados no se sobrescriben: se conserva el borrador y recargar exige confirmar el descarte. Ante respuesta incierta se bloquea otro guardado y Comprobar ficha actual lee sin reenviar ni atribuir éxito; para editar otra vez hay que recargar explícitamente. Carga/actualización usan POST /api/fichas-clinicas/edicion y /actualizar, misma sesión/CSRF/Origin/no-store y límite total JSON de 16 KiB. Un reinicio invalida versiones pendientes y requiere recarga. Sin ficha no hay alta implícita. Evidencia y revisión independiente: specs/011-actualizar-ficha-clinica/validation.md. Demo solo local ficticia; AUTH T7 sigue separado.

## Sesiones clínicas — CU08–CU10

Desde el perfil del paciente, Sesiones clínicas abre el historial de 20 por página, sin anotaciones en lista; Ver detalle conserva la página al volver. Registrar sesión admite fecha de hoy o anterior y anotaciones obligatorias, incluso sin ficha clínica. Ante respuesta incierta, Comprobar operación o Reintentar el mismo envío conservan la identidad del intento; no duplican ese envío ni atribuyen éxito por similitud de texto. Alta confirmada abre detalle persistido y vuelve a historial página 1. Cliente/dominio no agregan restricciones respecto a nacimiento o antigüedad.

La demo local explícita existente admite AUTH_TEST_FIXTURE=sesiones, que prepara la cuenta ficticia de perfil y 25 sesiones del paciente Demo 21, sin ficha. Requiere AUTH_TEST_HARNESS=1 y TEST_DATABASE_URL local desechable, igual que scripts/auth-tests/demo.mjs; compilar antes. No usar datos ni conexión remota. Evidencia, revisión y límites: specs/012-sesiones-registro-consulta/validation.md. AUTH T7 continúa separado.

## CU11 — Modificar sesión y recorrido integrado

Editar sesión clínica desde el detalle permite cambiar fecha y anotaciones. Mantiene paciente/profesional/creación; verifica versión con precisión completa bajo bloqueo. Guardado confirmado vuelve al detalle persistido; conflicto conserva borrador y exige recarga confirmada. Respuesta incierta bloquea reenvíos y permite consultar contenido actual sin atribuir autoría. Volver al historial reconsulta el orden y conserva la página aunque la sesión se haya movido por fecha. Reenviar su alta original no restaura contenido anterior ni duplica el registro. Evidencia: specs/013-modificar-sesion/validation.md.

La etapa specs/014-integracion-mvp integra pacientes, ficha y sesiones con snapshots de recursos relacionados, dos profesionales ficticios y navegación completa. La separación de identidad/correo simulados frente a PostgreSQL real y al piloto remoto se mantiene explícita. No amplía alcance productivo ni retoma recuperación.
