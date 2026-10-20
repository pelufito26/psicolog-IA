# Validación AUTH: preparación y piloto real

Actualizado el 20 de octubre de 2026. AUTH-r2/T1–T6 completados. T7 parcial: registro, confirmación, contraseña+código y logout reales comprobados; recuperación diferida por el usuario y aislamiento remoto entre dos identidades sin ensayar.

## Avance remoto de T7

### Configuración retomada el 20 de octubre de 2026

El usuario autorizó continuar T7, ingresó personalmente al panel y confirmó guardar SMTP con la clave existente de Resend. Guardado: smtp.resend.com, puerto 465, usuario resend, remitente de prueba onboarding@resend.dev y nombre PsicologIA. Clave fuera de Git y sin imprimir. Lectura autenticada de Resend: 200, sin dominios propios. Siguen vigentes único destinatario y máximo de seis correos; no se amplía el alcance.

Site URL y única redirección permitida: http://127.0.0.1:5173/, sin comodines. Plantillas guardadas de confirmación/recuperación con enlace local TokenHash y propósito signup/recovery, sin ConfirmationURL predeterminado. Confirm email habilitado, acceso anónimo/vinculación manual deshabilitados. Longitud mínima de contraseña configurada en 12. Sin factores nuevos ni reducción de controles.

Migración 20261015213340 comprobada por MCP; antes del registro, cero usuarios Auth y sesiones propias. db:check real volvió a confirmar conexión TLS/rol restringido y rollback. Se detuvo la demo propia y se inició el servidor normal local con adaptadores reales; UI sin banner/buzón simulado. Sin datos clínicos reales ni nuevas migraciones/permisos.

Primer intento del piloto, luego resuelto: registro realizado personalmente por el usuario, sin compartir contraseña. En ese momento Supabase confirmó una cuenta creada, todavía sin email confirmado. Resend confirma un correo del piloto con estado delivered. Se inspeccionó solo la estructura del enlace, sin imprimir token: origen http://127.0.0.1:5173, ruta /, parámetros token_hash/type y propósito signup. Frontend y health de API respondieron 200. El usuario informó que el enlace abre una página no disponible; pendiente determinar si se abrió desde otro dispositivo y completar confirmación. No se reenvió correo ni se modificó el estado de confirmación desde administración. Quedan ingreso+código, recuperación y logout reales. Guardar SMTP/entregar confirmación no completa T7. Aislamiento de dos profesionales verificado localmente; sin segundo destinatario remoto autorizado.

Capturas fuera de Git: auth-smtp-para-confirmar.png y auth-redirect-local-configurado.png. Sin capturas de credenciales/códigos/bandeja personal. Sin publicación/despliegue durante esa configuración.

El usuario completó confirmación e ingreso en dos pasos y comunicó acceso correcto. Comprobación remota: una cuenta Auth confirmada y una sesión propia vigente; Resend informa dos correos del piloto, ambos delivered (confirmación y código). No se leyeron contraseñas ni códigos. El usuario informó inicialmente un enlace no disponible y luego confirmó que pudo completar todo el flujo; no se determinó el dispositivo del primer intento. Recuperación diferida explícitamente por el usuario; se continúa únicamente con cierre de sesión.

El usuario ejecutó Cerrar sesión y confirmó regreso a Ingresar. Consulta remota posterior: cero sesiones vigentes y una revocada, frente a una vigente/cero revocadas antes de salir. Petición HTTP a ruta de pacientes sin cookie ni CSRF respondió 403 SOLICITUD_NO_PERMITIDA y Cache-Control no-store; esto verifica rechazo por la guarda, sin atribuir un 401 de sesión a esa petición. No se hizo replay manual de la cookie real anterior: no se extrajo ni registró su valor; la revocación efectiva se comprobó en DB y el rechazo de cookies revocadas conserva evidencia de la matriz local. Recuperación permanece diferida, sin enviar más correos. Total del piloto observado: dos correos entregados de seis autorizados.

Comprobación adicional: GET estado anónimo y posterior petición protegida con su cookie/CSRF válidos respondieron 401 INGRESO_REQUERIDO y no-store. Solo se imprimieron estado/código HTTP; sin persistir tokens ni enviar correo. Distingue falta de sesión del rechazo CSRF anterior.

### Preparación del 15 de octubre

Destino autorizado: vrqmpdedckkgxpdleepr, solo desarrollo. Migración acceso_profesionales aplicada con versión 20261015213340. Conteos antes/después conservados: un profesional, cuatro pacientes ficticios, cero fichas y cero sesiones clínicas. Cuatro tablas nuevas con RLS en acceso, sin USAGE para anon/authenticated; asesores de seguridad sin alertas.

La primera aplicación fue rechazada por revisión automática por la comprobación indirecta de propiedad de fichas. Se hizo explícita la condición p.profesional_id = app.profesional y se verificaron lectura propia, lectura/actualización ajena, inserción ajena, paciente inmutable y contexto vacío. PostgreSQL 17 local: 112 ensayos satisfactorios en dos bases desechables, más matrices CU01/CU02/AUTH. Primer intento local bloqueado por conexión EACCES; repetido con acceso local permitido. El nuevo ensayo de cambio de paciente esperaba inicialmente un error RLS, pero el trigger de inmutabilidad lo rechaza antes con 23514; expectativa corregida y comprobada.

Configuración de backend y clave de correo guardadas solo en .env excluido de Git. Cero correos reales enviados en esta preparación; máximo autorizado seis a un único destinatario. Panel Supabase solicita inicio de sesión del usuario para configurar SMTP/plantillas. Demo anterior aún usa proveedor simulado; no se declara prueba real hasta reemplazarla y verificar el flujo completo.

Conexión real del backend con TLS y rol restringido comprobada mediante db:check tras la migración: alta/lectura ficticias dentro de una transacción y rollback confirmados, sin conservar filas de ensayo.

| Alcance | Evidencia                                                                                                                                                                                                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1, A4  | Registro/confirmación con proveedor simulado; login sin confirmación rechazado. Dos altas concurrentes dan un único profesional por identidad y un email coincidente de otra identidad no permite apropiación. Adaptador Supabase probado con SDK simulado, sin confiar en metadata para identidad/permisos.                                      |
| A2–A3   | PostgreSQL real: pendiente sin acceso, sesión/código ligado al intento, 5 intentos, vencimiento, reenvío a 60 s, 5 envíos agregados/15 min y 30 operaciones por origen; consumo concurrente con un único ganador. En DB solo verificadores/hash. Fallo de correo no habilita acceso.                                                              |
| A3, A5  | HTTP contra API real con proveedor ficticio: contraseña sola, Bearer sin sesión propia, cookie revocada y CSRF/origen incorrectos denegados. Dos cuentas registran/consultan sin revelar pacientes ajenos. RLS devuelve cero filas sin contexto y rechaza escritura ajena. Sin acceso directo anon/authenticated ni fallback de profesional Demo. |
| A6–A7   | PostgreSQL y servicio: logout revoca, inactividad expira y recuperación invalida sesiones y contraseña anterior. SDK simulado verifica tipo recovery antes de bloquear/revocar/cambiar password; enlace inválido no cambia credenciales. Límites persisten entre intentos.                                                                        |
| A8      | UI: contraseña sin pacientes visibles, desafío, confirmación, logout y sesión expirada desmontan datos. URL de recuperación se limpia antes del intercambio. Buzón ficticio separado y banner de simulación; servidor normal no monta ese buzón ni permite provider simulado por variables de entorno.                                            |

## Evidencia local original del 15 de octubre

npm run check satisfactorio: lint, formato, tipos, 84 pruebas (33 web y 51 API) y compilación. Matriz PostgreSQL ejecutada en dos bases nuevas desechables con las dos migraciones: 96 ensayos previos más CU01, CU02 y AUTH. La matriz de Auth utiliza identidad/correo ficticios; no se atribuye ese resultado al servicio remoto. No se usaron secretos en CI ni se enviaron emails.

Navegador: registro de profesional ficticio @example.invalid, enlace de confirmación del buzón local, contraseña y código, listado propio vacío y logout. Capturas locales fuera de Git: auth-pendiente.jpg (campo código vacío), auth-ingreso.jpg (acceso completo sin credenciales) y auth-movil.jpg. Viewport móvil comprobado en la pestaña efectiva: 390 px, scrollWidth 375; sin desbordamiento horizontal. No se capturaron buzón, contraseña o código. No se crearon pacientes, cuentas ni permisos remotos.

Fallos resueltos: ruta inicial de CLI incorrecta y escritura de telemetría restringida; se consultó su ayuda y generó migración local con CLI fijada. Tipos de cliente HTTP y payload de UI corregidos. Un caso HTTP intentaba login antes de sesenta segundos: reloj del ensayo ajustado. Revisión de concurrencia detectó verificación simultánea con logout del intento pendiente; se agregó vínculo intento-sesión y bloqueo común por cuenta, y la prueba confirmó que logout invalida también la sesión creada por ese intento. Se corrigió una errata en un caso adicional de prueba y se repitieron controles. El primer intento de viewport actuó sobre otra pestaña; se midió y capturó después la pestaña correcta.

## Estado actual de T7

- Completado: proveedor Resend configurado, migración revisada/aplicada, TLS/rol restringido, SMTP/plantillas/redirección y variables locales fuera de Git.
- Comprobado con servicios reales y participación del usuario: registro, confirmación de email, contraseña seguida de código y cierre con revocación. Dos correos entregados de seis autorizados; sin nuevos envíos en la consolidación.
- Pendiente por decisión del usuario: probar recuperación real de contraseña.
- No ensayado: aislamiento con dos identidades reales; la matriz local sí lo verifica con identidad/correo ficticios y PostgreSQL real. Ampliar destinatarios requiere autorización; no se incluyen cuentas administrativas adicionales.

No declarar T7 completa ni aceptar uso con pacientes reales a partir de este piloto parcial.

## Límites conocidos

Supabase Auth y Resend fueron ensayados únicamente para los flujos y el destinatario indicados. Recuperación real pendiente. No se instaló Docker. El servidor sigue siendo piloto local y bloquea producción. La recuperación propia bloquea la cuenta antes de cambiar password; esa conducta conserva evidencia local simulada, no se atribuye al piloto real. Acciones directas del panel/proveedor (borrar usuarios, cambiar contraseña/email fuera del BFF) necesitan una política adicional de revocación/sincronización antes del uso productivo; revocación inmediata comprobada solo en el flujo propio.

Rol SQL técnico de confianza: RLS por contexto no resiste su robo ni un backend comprometido. No se realizaron pentest, lector de pantalla o móvil físico. La entrega real observada se limita a dos mensajes del piloto. No se promete MFA independiente/AAL2 ni aptitud productiva. Dominio propio, destinatarios adicionales y despliegue siguen fuera del alcance.

## Consolidación en Git del 20 de octubre

El usuario autorizó consolidar cambios y evidencia y preparar PR. La revisión AUTH-r2, plan/tareas y autorizaciones T7 previas siguen vigentes; no hay reglas funcionales nuevas. Base: c183d0bf9542acf804166767960e2d1162c631f6 (PR15 incorporado). Rama docs/consolidar-piloto-auth.

El archivo preparado 20261015200408 se reemplaza por 20261015213340, que coincide con el historial realmente aplicado. Comparación de SQL sin comentarios/espacios: MD5 local/remoto 3e883fce71292e0793d68c75722e9c51. pg_policies confirma USING/WITH CHECK de fichas con profesional propietario explícito. No se aplicó SQL ni se modificaron historial, permisos o configuración remotos para consolidar. Se añaden al runner las comprobaciones locales de acceso a ficha propia/ajena, update ajeno sin filas, paciente inmutable, insert ajeno y contexto vacío, ya ejecutadas antes del piloto.

Solo consultas remotas de lectura para cotejar historial/política; no nuevo login, correo ni datos clínicos. Claves, email personal, contraseñas, tokens/códigos, certificados locales y .env quedan fuera del diff.

Verificación de la consolidación: npm run check completo satisfactorio, con lint/formato/tipos, 363 pruebas (200 web + 163 API) y builds. PostgreSQL 17 local: 112 ensayos generales y matrices CU01–CU11/AUTH más cuatro recorridos integrados, en dos bases vacías reproducibles. No se usaron secretos ni correo real en esos ensayos. El índice contenía exactamente este lote, sin diferencias funcionales respecto de los archivos ejecutados; git diff --check correcto. Selección explícita de siete archivos, incluido rename SQL (ocho rutas contando origen/destino). Comprobación de UTF-8, ausencia del email personal, claves reconocibles y coincidencia del hash SQL satisfactorias; no sustituye una auditoría de seguridad completa.

Revisor independiente revisor_auth, contrato .codex/agents/revisor.toml, base c183d0bf9542acf804166767960e2d1162c631f6 y árbol 65e5a7ea059e362412ed72db546f8d7f3bfd9a90: sin hallazgos accionables P0–P3. Revisó SQL/rename, aislamiento y cobertura, autorizaciones y distinción entre piloto real/simulado y pendientes. Revisión estática: no ejecutó pruebas ni consultó servicios remotos. El delta posterior solo registra estos resultados y la revisión; se comunica para cierre. No implica aceptación humana ni productiva.

No repetido para consolidar: registro/login/logout reales, SMTP/plantillas, recuperación, segundo destinatario, db:check remoto, aplicación de migraciones/permisos o despliegue. No cambia código de la aplicación ni dependencias. Publicación del PR autorizada; su merge y controles remotos se verifican separadamente.
