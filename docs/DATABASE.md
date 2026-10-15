# Persistencia de desarrollo

## Estado y destino

Proyecto destinado únicamente a datos ficticios: psicolog-ia, vrqmpdedckkgxpdleepr, PostgreSQL 17.11. En esta entrega se preparó el SQL y se probó en PostgreSQL portátil local 17.10. La migración ya se aplicó con aprobación del usuario. T6 completada: cuenta restringida y conexión real Node–Supabase verificadas con TLS 1.3 y rollback.

Migración: supabase/migrations/20261015140453_base_psicologia.sql. El nombre fue generado por CLI Supabase 2.121.0 con migration new, según su reloj UTC. El archivo se alineó después con la versión efectiva del historial remoto 20261015140453.

## Modelo

Schema privado psicologia: profesionales, pacientes, fichas_clinicas y sesiones_clinicas. UUID, fechas clínicas date y timestamps timestamptz. Hoy clínico se evalúa en America/Montevideo, aunque la base esté en UTC.

La ficha pertenece a un único paciente y no duplica profesional. La sesión referencia la pareja paciente/profesional. No se persiste edad, no se impide registrar posibles duplicados y no hay unicidad por paciente/fecha de sesión. Cambios de identidad/asociación y fecha de creación se rechazan. No se implementa borrado: referencias RESTRICT y cuenta técnica sin DELETE.

Opcionales clínicos: NULL o texto, sin transformación adicional. El teléfono es texto obligatorio no vacío; no se ha definido regex. Email profesional único tras retirar whitespace periférico y comparar sin mayúsculas mediante lower. Ver plan de 0D para decisiones completas.

## Permisos

La migración crea únicamente un grupo NOLOGIN psicologia_backend con lectura/inserción/actualización sobre esas tablas, sin propiedad ni administración. RLS habilitada con políticas para el grupo técnico. Estas políticas dan acceso a datos ficticios para las pruebas: no representan autorización por profesional y no son aptas para producción.

PUBLIC, anon y authenticated no reciben acceso al schema/tablas/funciones. El schema no se incorpora a la Data API. La migración no crea cuentas LOGIN, contraseñas ni usuarios clínicos; no modifica permisos de schemas del sistema.

## Comprobar PostgreSQL real, fuera de Supabase

Usar una instancia PostgreSQL 17 aislada y descartable, con usuario administrativo de prueba, accesible por loopback. El runner rehúsa hosts remotos y exige TEST_DISPOSABLE_DATABASES=1. No usar DATABASE_URL de aplicación como TEST_DATABASE_URL.

Configurar en el entorno TEST_DATABASE_URL con la conexión de esa instancia local y TEST_DISPOSABLE_DATABASES=1. Ejecutar npm run test:database.

El runner crea dos bases con nombres aleatorios, aplica los mismos archivos e historial de evidencia y prueba integridad, fechas y permisos. Al terminar elimina exclusivamente las bases recién creadas y su rol técnico de prueba; no ejecutarlo contra una instancia con objetos o roles propios. Rechaza un grupo psicologia_backend preexistente. No conecta al proyecto Supabase.

CI configura un servicio PostgreSQL 17 desechable con una contraseña ficticia de prueba que no sirve fuera de ese servicio. No necesita secretos de una cuenta Supabase. La ejecución remota del nuevo job todavía requiere publicación autorizada.

La comprobación local se realizó con embedded-postgres 17.10.0-beta.17, instalado fuera del checkout, y Node aislado. Es PostgreSQL real; el paquete de lanzamiento tiene etiqueta beta. Ese auxiliar no es dependencia del producto, no creó servicios/cuentas globales y no se versiona. El entorno de CI usa la imagen PostgreSQL 17.

## Comprobación de aplicación — verificada con cuenta restringida

Primero compilar con npm run build. npm run db:check ejecuta el backend compilado y carga apps/api/.env si existe. Copiar apps/api/.env.example a .env y completar solo localmente, después de aprobar y configurar una cuenta restringida específica.

DATABASE_URL: endpoint real de Connect en Supabase (directo si hay IPv6; Session pooler para IPv4), usuario LOGIN que herede psicologia_backend y contraseña nueva distinta de postgres. No usar la contraseña del chat.

DATABASE_CA_FILE: si hace falta, ruta al certificado CA obtenido del proyecto. TLS mantiene verificación de certificados. No introducir parámetros ssl/sslmode/sslcert/sslkey/sslrootcert en la URL porque reemplazan la configuración TLS explícita; se rechazan.

El comando exige cuenta no privilegiada perteneciente al grupo y sin propiedad de tablas. Inserta y lee dos registros ficticios mediante parámetros y termina con ROLLBACK; luego cierra el pool. Informa éxito o fallo sin imprimir conexión, datos, contraseña o error interno. Ante fallo, devolverá código 1. Sin .env también falla de manera controlada.

No existe endpoint clínico ni comprobación de DB desde navegador. GET /api/health conserva su contrato sin depender de PostgreSQL.

## Próximo paso

Revisar SQL completo y permisos antes de T5. Reinspeccionar el proyecto y aplicar solamente la migración aprobada mediante historial de migraciones. T6 configura la cuenta LOGIN y credencial fuera de los archivos versionados y prueba el backend contra el destino real. No ejecutar resets, cambios destructivos o instrucciones de producción para completar esta etapa.

## Actualización de estado — T5

Migración aplicada al proyecto de desarrollo con aprobación del usuario. Versión remota 20261015140453, reflejada en el nombre del archivo local; SQL original intacto. Restricciones y permisos verificados mediante ensayos con rollback; tablas vacías. Las menciones de preparación anterior describen el estado previo: ya existe el esquema remoto, pero T6 y la conexión real del backend siguen pendientes.

## Actualización de estado — T6

El usuario aprobó crear la cuenta técnica y retomar el trabajo tras detener el paso interactivo. Se creó psicologia_app, LOGIN miembro de psicologia_backend, sin superusuario, CREATEDB, CREATEROLE, replicación o BYPASSRLS, y con límite de dos conexiones. Credencial aleatoria nueva configurada en apps/api/.env ignorado por Git y restringido al usuario local. El certificado CA oficial se configura únicamente para este cliente, manteniendo rejectUnauthorized:true; origen: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt, usado por el dashboard oficial de Supabase.

Prueba real: npm run db:check confirmó conexión y rollback; pg_stat_ssl confirmó TLSv1.3. DELETE y CREATE rechazados con 42501 al usar la cuenta real. Tablas vacías después de las pruebas. No se utilizó la contraseña compartida en el chat. Transferencia de credencial cifrada; retirados el sobre remoto y los archivos temporales con la contraseña. Los auxiliares de cifrado no son dependencias del producto.

Se registraron operaciones administrativas remotas con versiones 20261015141233 (crear_cuenta_tecnica_desarrollo) y 20261015142029 (cerrar_transferencia_credencial). Son configuración de acceso por entorno, no SQL de esquema reproducible ni contraseñas para Git. No ejecutar supabase db push contra este proyecto sin conciliar previamente esas entradas administrativas; no modificar su historial a ciegas. Para futuros cambios, mantener revisión de migración y aplicación explícita.

## Preparación local de acceso (AUTH)

Migración local 20261015200408_acceso_profesionales.sql pendiente de aprobación/aplicación remota. Añade esquema privado acceso para vínculo estable Auth-profesional, desafíos, sesiones y límites; conserva pacientes y responsables. RLS de pacientes/sesiones requiere app.profesional fijado por transacción por el backend; fichas verifican propiedad a través del paciente. anon/authenticated no reciben acceso. El rol técnico conserva permisos controlados de registro de profesional y gestión de sesiones; sigue siendo una credencial de confianza y RLS no protege contra su robo. No existe ruta administrativa para leer perfiles/pacientes ajenos.

Ensayo de migraciones y controles satisfactorio en dos bases PostgreSQL desechables. Supabase remoto conserva el esquema anterior: no afirmar que estos controles ya estén aplicados allí. T7 exige revisar el SQL y los grants de acceso para psicologia_backend (no administrador) y autorizar el destino antes de aplicarlos. Credenciales existentes intactas. El comando histórico db:check ahora fija contexto de su profesional ficticio dentro de su transacción con rollback; no se repitió contra Supabase en esta etapa.
