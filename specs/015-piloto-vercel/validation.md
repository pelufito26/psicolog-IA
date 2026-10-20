# Evidencia del piloto Vercel

Estado vigente: piloto online configurado en https://psicologia-piloto.vercel.app; T5 completada, ingreso personal online confirmado y T6 parcial; recorrido clínico y logout online diferidos por el usuario. Las secciones de preparación conservan la secuencia de fallos y comprobaciones; la habilitación final se detalla al cierre del documento. Base: origin/main 6eff8944faadba2a1d68f27c2ff2f4439bb65ca5. Revisiones VERCEL-r1 y VERCEL-plan-r1/VERCEL-tasks-r1 aprobadas en conversación el 20 de octubre de 2026.

## Verificaciones locales

- npm run check: lint, formato, tipos, 200 pruebas web + 169 API y builds correctos. Primer intento dentro del sandbox falló en conexiones HTTP locales EACCES; repetido con permiso de red local, sin cambiar los tests, completó correctamente.
- PostgreSQL 17 desechable: 112 ensayos generales en dos bases vacías, matrices CU01–CU11/AUTH y cuatro recorridos HTTP de integración correctos. Añadidas comprobaciones de filtro de sesiones por cuenta permitida y edición de un paciente entre dos instancias independientes con secreto de despliegue derivado: guardado válido y versión anterior rechazada. Identidad/correo ficticios, persistencia PostgreSQL real; sin escribir en Supabase remoto.
- Nuevas pruebas: producción explícita, preview cerrado aun con secretos, orígenes/redirección inválidos, CA portable/TLS, claves independientes por módulo, versiones entre instancias/obsoletas/ajenas/alteradas, rechazo de otras cuentas antes de proveedor, reenvío/verificación de intentos ajenos, cookies Secure/HttpOnly, CSRF y API desconocida JSON 404.

## Matriz V1–V8

| Requisito | Evidencia disponible                                                          | Pendiente                                                                                                |
| --------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| V1        | Entrada Express sin listener, configuración de rutas/build Vercel.            | Empaquetado y URL estable, recorrido desde otro dispositivo.                                             |
| V2        | environment.test.ts, pilot-http.test.ts y regresiones HTTP existentes.        | Cabeceras/cookies/orígenes sobre HTTPS desplegado.                                                       |
| V3        | restricted-identity.test.ts, matrices AUTH y filtro de sesiones PostgreSQL.   | Login/código/logout reales en nueva URL; registro real no se repetirá. Recuperación diferida.            |
| V4        | Secretos estables por módulo, pruebas de dos instancias y edición PostgreSQL. | Persistencia y recorrido en despliegue.                                                                  |
| V5        | Pool compartido por instancia, TLS validado, matrices RLS locales.            | Endpoint pooler/CA/rol/límite real de conexión y persistencia remota.                                    |
| V6        | Preview cierra por entorno, credenciales fuera de frontend, .vercel ignorado. | Inspección del paquete desplegable y variables del proyecto exacto.                                      |
| V7        | Matrices de integración locales con dos profesionales ficticios.              | Recorrido online CU01–CU11, escritorio/móvil y logout. Dos cuentas reales no autorizadas para este lote. |
| V8        | Guía docs/DEPLOYMENT.md, publicación manual sin promoción Git automática.     | Revisión independiente, SHA/CI, PR, IDs/alias y retirada/reversión documentadas del destino real.        |

## Destino y operaciones remotas

Cuenta visible de Vercel: pelufito26s-projects, confirmada por el usuario como su cuenta personal. Existen proyectos anteriores, incluido psicologia-mvp; no se reutilizan ni modifican. Proyecto nuevo previsto: psicologia-piloto. Aún no creado. ID/alias pendientes. La CLI oficial 64.7.0 se instaló en carpeta auxiliar fuera del checkout, sin dependencias del producto ni instalación global; autorización de dispositivo pendiente de intervención del usuario.

Sin cambios remotos de Supabase/SMTP ni envíos de correo. Los despliegues de comprobación siguientes no tienen credenciales piloto. Revisión independiente y CI remota realizadas según actualizaciones siguientes. No marcar T5/T6 completas por resultados locales.

## Preparación del proveedor

Proyecto nuevo creado en scope pelufito26s-projects: psicologia-piloto, ID prj_kHqfQnMiiWlw7mssC7tzRzOGH2hf. Sin repositorio conectado ni variables del piloto. CLI autenticada por autorización personal del usuario. Protección de despliegue del proveedor permanece habilitada; no se debilitó para las pruebas. Rol remoto comprobado solo mediante lectura: psicologia_app, CONNECTION LIMIT 2, sin superusuario ni BYPASSRLS. URL actual de DB es directa, todavía no se cambió al pooler.

Build local Vercel: dos intentos fallaron con spawn cmd.exe ENOENT tras npm ci, también con ComSpec/PATH explícitos. No constituye fallo confirmado del código ni empaquetado exitoso. El instalador del builder local anunció Node 24.16.0 frente al mínimo declarado 24.21.0; falta comprobar el runtime real del build remoto y resolver compatibilidad antes de aceptar el piloto. No se elude el control ni se declara equivalente a CI.

La revisión automática rechazó inicialmente build --yes por posible descarga automática de secretos. Se verificó mediante env ls que Production no tenía variables del piloto; después se autorizaron pull de ajustes/entorno vacío y build sin --yes. Los archivos locales de Vercel están ignorados y excluidos de Git. CLI link generó un token OIDC del propio proyecto en archivo ignorado; no se imprimió ni se usa como credencial de Supabase.

Revisión independiente de base 6eff8944faadba2a1d68f27c2ff2f4439bb65ca5 a árbol 6e1d1c40a5a293e3cd7294bf7dceb4246d05a0bc: sin hallazgos accionables P0–P3. Solo lectura; empaquetado/routing real, CI y aceptación online pendientes. Se añadió tsconfig.deploy.json al typecheck para incluir también la entrada de función; comprobación correcta. Revisión del delta final pendiente.

## Actualización del despliegue de comprobación

PR abierto y adjuntado: https://github.com/pelufito26/psicolog-IA/pull/17, sin merge. Revisión independiente del delta 6e1d1c40a5a293e3cd7294bf7dceb4246d05a0bc a 40a1d14486763a87ca1ebe51e74425f830e00a68 sin hallazgos accionables; incluye .vercelignore y typecheck de la entrada. Commit b36dfc229fadd973146cb4fadd2274afe9014535 pasó ambos controles remotos, Controles de calidad e Integración PostgreSQL 17.

Dry-run: 164 archivos, sin rutas de entorno/.git/.vercel entre los archivos enviados. Primer build remoto dpl_AJ18ZFvY99JpztDHomCfoqYaeqNi llegó a READY pero la función devolvió 500 ERR_REQUIRE_ESM; no se presentó como piloto aceptado. Fallo reproducido: api/index.js CommonJS intentaba cargar runtime.js ESM. Corregido declarando type:module en el package raíz; scripts existentes .mjs conservan su interpretación. npm ci --engine-strict evita tolerar una versión de Node incompatible y el build registra versiones sin secretos.

Revisión independiente de b36dfc2 a árbol 06587f43f72766d68811327e7047329364a834e9 sin hallazgos accionables; check completo repetido correcto. Commit d70cc1e992b012fcf84f21db655472c2874f444f pasó ambos controles de CI. Segundo build dpl_EZDJn4TJd66E66g6C6jrS2jrrjdF usa Node 24.21.0 y npm 11.19.0; build completo correcto. Se resolvió la duda de versión: el builder local de Windows anunciaba 24.16.0, el remoto cumple el mínimo 24.21.0 sin reducir el requisito.

Alias real verificado: https://psicologia-piloto.vercel.app. HTTP de ese alias: / devuelve 200 HTML con raíz de aplicación; /api/health y /api/no-existe devuelven 503 application/json, Cache-Control:no-store y PILOTO_NO_CONFIGURADO. Esto demuestra invocación sin el fallo ESM y cierre por falta de configuración, no conexión a la base ni funcionamiento de CU01–CU11. Routing completo después de habilitar configuración sigue pendiente.

Pooler oficial obtenido del panel: aws-0-us-east-1.pooler.supabase.com:6543, usuario restringido existente con sufijo de proyecto. Prueba de solo lectura con TLS rechazó la cadena sin la CA (SELF_SIGNED_CERT_IN_CHAIN); usando la CA ya verificada conectó correctamente con rejectUnauthorized=true. Rol remoto psicologia_app, límite 2, sin superusuario/BYPASSRLS. Sin ampliar permisos, cambiar contraseñas ni modificar datos. El despliegue deberá usar DATABASE_CA_PEM con esa CA.

La revisión automática bloqueó la transferencia de credenciales a Vercel porque pidió confirmación expresa del payload y proyecto exactos, aun estando descritos en el plan aprobado. Se solicitó al usuario para Production de psicologia-piloto: credencial DB restringida, CA, clave Resend existente, email piloto y dos secretos nuevos; también Site URL/redirección HTTPS exactas en Supabase conservando local. Se comprobó después del bloqueo que Production seguía sin variables. Hasta recibir respuesta no se transfieren credenciales ni se cambia Supabase.

Regresión adicional de V4: confirmación de duplicados emitida por una instancia y aceptada por otra con secreto estable, rechazo si cambian profesional o datos. environment.test.ts: cuatro pruebas correctas. Esta prueba adicional no altera el código de la aplicación desplegada; CI del próximo commit pendiente.

## Habilitación autorizada del piloto

El usuario confirmó expresamente la pregunta sobre credenciales y redirecciones: «Sí, autorizo esas credenciales y redirecciones en ese proyecto». Se conservó el destino exacto: cuenta pelufito26s-projects, proyecto nuevo psicologia-piloto, solo Production. No se volvió a pedir la aprobación del plan.

Dos intentos de transferencia con la CLI devolvieron Invalid JSON (400), sin guardar variables; sesión y ausencia de variables comprobadas. Se usó entonces la API REST oficial con la sesión CLI autorizada, mismo payload y destino, obteniendo 201 y cero claves fallidas. Se guardaron 13 variables cifradas, incluidos credencial DB restringida/CA, clave Resend existente, email piloto y dos secretos criptográficos nuevos. Valores y respuesta con credenciales no se imprimieron; claves estables locales fuera de Git. Verificación de metadata: 13 en Production, cero en Preview y cero en Development. Escaneo de HTML y dos assets públicos JS/CSS contra credenciales y claves de firma: cero coincidencias.

En Supabase se guardó Site URL https://psicologia-piloto.vercel.app/ y se añadió únicamente esa redirección exacta. Se conservó http://127.0.0.1:5173/; panel confirma dos URLs y guardado final. Captura fuera de Git: ../vercel-supabase-urls.png. SMTP, remitente, roles y esquema permanecieron iguales. Sin migración ni ampliación de permisos.

Commit desplegado c88d93bc4a287311f644132038c1b52488599d32; ambos controles CI completados success, incluida la prueba adicional (200 web + 170 API). Revisión independiente del delta d70cc1e a árbol a1f56dc15edbc8b2a245db9ee1007cb2a6a8f275 sin hallazgos accionables. Build remoto con credenciales de servidor dpl_2tWGNxXjZ5WC3TpegqFXTaVbFCRy, Node 24.21.0/npm 11.19.0 y alias estable https://psicologia-piloto.vercel.app. Revisión de código y CI corresponden al SHA exacto; la aceptación online no se infiere del build.

Comprobaciones HTTP sobre alias estable con sesión anónima creada solo para pruebas, sin extraer cookies del navegador del usuario:

- /api/health: 200 JSON status ok.
- /api/no-existe: 404 JSON RUTA_NO_DISPONIBLE; no devuelve la SPA.
- /api/acceso/estado: 200, anonimo, no-store; cookie HttpOnly/Secure/SameSite=Strict. La consulta utiliza el pooler y la configuración real del servidor.
- Consulta clínica con CSRF válido y sin sesión autenticada: 401 INGRESO_REQUERIDO.
- Origen ajeno o CSRF incorrecto: 403 SOLICITUD_NO_PERMITIDA, no-store.
- Ingreso con identidad ficticia fuera de la cuenta admitida: 401 CREDENCIALES_INVALIDAS, sin invocar identidad/correo según el control probado localmente.

Lectura del proveedor antes de solicitar login al usuario: cuatro mensajes al destinatario aprobado, cuatro entregados; el conteo previo histórico era dos y no se atribuye aquí el origen de la diferencia. Se toma conservadoramente ese conteo para el presupuesto: quedan dos de los seis autorizados. El agente no envió registros, recuperación ni códigos en estas comprobaciones. Se pidió un único ingreso personal en la URL online, con aviso antes de reenviar. Login/código reales online, CU01–CU11, móvil/otro dispositivo y logout todavía pendientes de la intervención del usuario. No se inspeccionan contraseña, OTP ni sesión real del navegador mientras completa ese paso.

## Ingreso online confirmado y recorrido diferido

El usuario respondió «Sí, ingresé y veo mis pacientes» al pedido de ingresar en la URL Vercel con su cuenta existente y código por correo. Verificación adicional de solo lectura: una sesión vigente, una revocada; cinco mensajes al destinatario aprobado, cinco entregados. No se leyeron contraseñas, códigos, tokens ni cookies de su navegador. Se conserva conservadoramente un correo restante del presupuesto total de seis; no usarlo automáticamente.

La pestaña original ya no estaba disponible en el navegador compartido. Una nueva pestaña del mismo piloto mostró Ingresar, por lo que no se afirmó acceso a la sesión real que el usuario abrió en otro navegador. Se propuso un recorrido manual con el paciente ficticio PruebaVercel, ficha, sesión, recarga y logout. El usuario eligió expresamente «Prefiero probarlo después». No se creó ese paciente ni se ejecutaron escrituras clínicas o logout remoto en su nombre. El ejemplo es un guion pendiente, no un registro persistido ni evidencia de aceptación.

Comprobación adicional limitada a la pantalla anónima: viewport DOM 390x844, scrollWidth 375 (sin desbordamiento horizontal en esa medición). La captura del navegador no ofrece correspondencia visual suficiente con esas dimensiones, por lo que no se usa como aceptación móvil. Se restauró el viewport. No se probó el recorrido clínico en móvil ni en otro dispositivo; tampoco logout online o persistencia de nuevos registros después de recargar. Las matrices locales y el logout local previo conservan su evidencia, sin sustituir estas comprobaciones remotas pendientes.

Estado de aceptación: V1–V6 tienen configuración/controles técnicos descritos y login real online corroborado por el usuario y conteos, sin completar automáticamente todas sus variantes. V7/T6 sigue parcial por decisión del usuario; V8 registra esta limitación. Piloto disponible con pacientes ficticios; no aceptación productiva, no pacientes reales y AUTH T7 sigue parcial por recuperación diferida y ausencia de dos cuentas reales.
