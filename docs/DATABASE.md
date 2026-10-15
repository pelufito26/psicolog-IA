# Persistencia de desarrollo

## Estado y destino

Proyecto destinado únicamente a datos ficticios: psicolog-ia, vrqmpdedckkgxpdleepr, PostgreSQL 17.11. En esta entrega se preparó el SQL y se probó en PostgreSQL portátil local 17.10. No se aplicó la migración al proyecto, no se crearon credenciales y no se comprobó conexión Node–Supabase.

Migración: supabase/migrations/20261015025410_base_psicologia.sql. El nombre fue generado por CLI Supabase 2.121.0 con migration new, según su reloj UTC. No implica que haya sido aplicada.

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

## Comprobación de aplicación — pendiente de cuenta segura

Primero compilar con npm run build. npm run db:check ejecuta el backend compilado y carga apps/api/.env si existe. Copiar apps/api/.env.example a .env y completar solo localmente, después de aprobar y configurar una cuenta restringida específica.

DATABASE_URL: endpoint real de Connect en Supabase (directo si hay IPv6; Session pooler para IPv4), usuario LOGIN que herede psicologia_backend y contraseña nueva distinta de postgres. No usar la contraseña del chat.

DATABASE_CA_FILE: si hace falta, ruta al certificado CA obtenido del proyecto. TLS mantiene verificación de certificados. No introducir parámetros ssl/sslmode/sslcert/sslkey/sslrootcert en la URL porque reemplazan la configuración TLS explícita; se rechazan.

El comando exige cuenta no privilegiada perteneciente al grupo y sin propiedad de tablas. Inserta y lee dos registros ficticios mediante parámetros y termina con ROLLBACK; luego cierra el pool. Informa éxito o fallo sin imprimir conexión, datos, contraseña o error interno. Ante fallo, devolverá código 1. Sin .env también falla de manera controlada.

No existe endpoint clínico ni comprobación de DB desde navegador. GET /api/health conserva su contrato sin depender de PostgreSQL.

## Próximo paso

Revisar SQL completo y permisos antes de T5. Reinspeccionar el proyecto y aplicar solamente la migración aprobada mediante historial de migraciones. T6 configura la cuenta LOGIN y credencial fuera de los archivos versionados y prueba el backend contra el destino real. No ejecutar resets, cambios destructivos o instrucciones de producción para completar esta etapa.
