# Evidencia del piloto Vercel

Estado: implementación local en curso; no hay despliegue aceptado todavía. Base: origin/main 6eff8944faadba2a1d68f27c2ff2f4439bb65ca5. Revisiones VERCEL-r1 y VERCEL-plan-r1/VERCEL-tasks-r1 aprobadas en conversación el 20 de octubre de 2026.

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

Sin cambios remotos de Supabase/SMTP, envíos de correo o despliegues con esta evidencia. Revisión independiente y CI remota pendientes. No marcar T5/T6 completas por resultados locales.

## Preparación del proveedor

Proyecto nuevo creado en scope pelufito26s-projects: psicologia-piloto, ID prj_kHqfQnMiiWlw7mssC7tzRzOGH2hf. Sin repositorio conectado ni variables del piloto. CLI autenticada por autorización personal del usuario. Protección de despliegue del proveedor permanece habilitada; no se debilitó para las pruebas. Rol remoto comprobado solo mediante lectura: psicologia_app, CONNECTION LIMIT 2, sin superusuario ni BYPASSRLS. URL actual de DB es directa, todavía no se cambió al pooler.

Build local Vercel: dos intentos fallaron con spawn cmd.exe ENOENT tras npm ci, también con ComSpec/PATH explícitos. No constituye fallo confirmado del código ni empaquetado exitoso. El instalador del builder local anunció Node 24.16.0 frente al mínimo declarado 24.21.0; falta comprobar el runtime real del build remoto y resolver compatibilidad antes de aceptar el piloto. No se elude el control ni se declara equivalente a CI.

La revisión automática rechazó inicialmente build --yes por posible descarga automática de secretos. Se verificó mediante env ls que Production no tenía variables del piloto; después se autorizaron pull de ajustes/entorno vacío y build sin --yes. Los archivos locales de Vercel están ignorados y excluidos de Git. CLI link generó un token OIDC del propio proyecto en archivo ignorado; no se imprimió ni se usa como credencial de Supabase.

Revisión independiente de base 6eff8944faadba2a1d68f27c2ff2f4439bb65ca5 a árbol 6e1d1c40a5a293e3cd7294bf7dceb4246d05a0bc: sin hallazgos accionables P0–P3. Solo lectura; empaquetado/routing real, CI y aceptación online pendientes. Se añadió tsconfig.deploy.json al typecheck para incluir también la entrada de función; comprobación correcta. Revisión del delta final pendiente.
