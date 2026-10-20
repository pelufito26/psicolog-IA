# Evidencia del piloto Vercel

Estado: build de comprobación online, con API cerrada y sin credenciales piloto; aceptación funcional online pendiente. Base: origin/main 6eff8944faadba2a1d68f27c2ff2f4439bb65ca5. Revisiones VERCEL-r1 y VERCEL-plan-r1/VERCEL-tasks-r1 aprobadas en conversación el 20 de octubre de 2026.

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
