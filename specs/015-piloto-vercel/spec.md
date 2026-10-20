# Piloto online del MVP en Vercel

Revisión: VERCEL-r1. Estado: aprobada por el usuario mediante «si» el 20 de octubre de 2026. Plan y tareas aprobados conjuntamente mediante «sip aprobueo».

## Objetivo y alcance

Publicar el MVP existente de PsicologIA en una URL HTTPS estable de Vercel para utilizarlo desde otra PC o celular sin depender de la PC de desarrollo. Conservar CU01–CU11, el monolito modular y los adaptadores reales de autenticación y persistencia. Mantener Supabase y el proveedor de correo actuales; no reescribir el producto ni incorporar funciones nuevas.

El piloto utiliza exclusivamente pacientes e información clínica ficticios. El acceso real inicial corresponde a la cuenta profesional del piloto ya autorizado. Publicar una URL no habilita registros de terceros: el backend debe limitar las cuentas admitidas explícitamente, sin confiar en controles del formulario. No ampliar destinatarios de correo ni instalar un mecanismo de invitaciones en este lote.

La confirmación del usuario «dale si» autoriza preparar esta etapa sobre el MVP actual. No constituye aprobación anticipada de esta revisión todavía no presentada ni del plan técnico.

## Requisitos y aceptación

| ID  | Resultado verificable                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | Una URL HTTPS estable sirve frontend y API bajo el mismo origen. El recorrido no depende de localhost, de un servidor en la PC del desarrollador ni del harness ficticio. Los enlaces de acceso funcionan desde otro dispositivo. Conservar el arranque local documentado.                                                                                                                                                                                                    |
| V2  | Configurar un entorno de despliegue explícito, validado al arrancar. Sustituir las restricciones exclusivamente locales por controles de entorno y origen; no eludirlas simulando desarrollo. Cookies de sesión Secure y HttpOnly en HTTPS, protección CSRF y validación estricta del origen autorizado; conservar no-store en respuestas sensibles. Rechazar orígenes ajenos y configuración incompleta.                                                                     |
| V3  | Conservar registro, confirmación de email, contraseña más código por correo y logout. Enlaces y redirecciones usan la URL estable aprobada, sin comodines para previews. Sin sesión vigente o con sesión revocada, la API deniega datos y operaciones clínicas. La cuenta piloto existente puede ingresar sin recrearse; registro se comprueba con pruebas controladas sin borrar cuentas remotas.                                                                            |
| V4  | Persistir pacientes, fichas, sesiones y sesiones de acceso fuera de la memoria de la función. Las versiones de edición y confirmaciones de duplicados mantienen validez entre instancias y reinicios mediante secretos estables del servidor. Probar dos instancias con la misma configuración, una edición válida y el rechazo de una versión obsoleta, sin perder aislamiento ni admitir tokens de otro recurso o profesional.                                              |
| V5  | Conectar a PostgreSQL con TLS verificado, credencial restringida y gestión de conexiones adecuada al entorno serverless. Mantener el contexto transaccional del profesional y RLS aun con reutilización de conexiones; no usar una cuenta privilegiada como atajo. Verificar persistencia tras reinicio y ausencia de mezcla de contexto entre dos profesionales ficticios. No introducir migraciones ni ampliar privilegios salvo necesidad identificada y alcance aprobado. |
| V6  | Secretos solo en configuración del servidor, sin valores en Git, bundles, errores, capturas ni logs. Previews de PR no reciben credenciales del piloto ni acceso a su base por defecto. Documentar variables por nombre y entornos de destino. No ejecutar migraciones ni pruebas destructivas automáticamente contra Supabase durante el build.                                                                                                                              |
| V7  | Ejecutar CU01–CU11 con datos ficticios en la URL desplegada, incluyendo integridad entre módulos, conflictos y logout; revisar escritorio y móvil. Reutilizar las matrices existentes de dos profesionales y añadir pruebas de los cambios de entorno/instancias. Distinguir aislamiento probado localmente del comprobado remotamente: el segundo requiere cuentas de prueba habilitadas explícitamente y no se declara cubierto por probar una sola cuenta real.            |
| V8  | Registrar evidencia del commit desplegado, CI, configuración sin secretos, recorrido, fallos y verificaciones pendientes. Documentar detección de errores sin datos clínicos, reversión de aplicación y retirada del piloto. La reversión no restaura datos ni revoca por sí sola sesiones. No promover otro commit automáticamente al entorno estable antes de completar sus controles acordados.                                                                            |

## Límites del lote

- Sin pacientes reales ni declaración de aptitud para uso clínico productivo.
- Recuperación de contraseña sigue diferida; no dar por completada AUTH T7.
- Sin apertura general del registro, destinatarios nuevos, dominio de correo, contratación ni planes pagos. Un dominio propio para la aplicación no es requisito: se admite una URL estable de Vercel.
- Sin nuevas reglas clínicas, cambios de casos de uso, framework nuevo o migraciones por conveniencia del despliegue.
- El plan debe concretar proyecto y cuenta de Vercel, topología frontend/API, URL estable, variables, conexión PostgreSQL, protección del piloto y efectos exactos de configuración en Supabase. Los recursos que falten se identifican antes de publicar; no se asumen permisos o costos.
- Conservar el SMTP y presupuesto de correo vigentes. El agotamiento del presupuesto se informa antes de nuevos envíos; nunca se reinicia por cambiar de entorno.

## Puertas y evidencia

VERCEL-r1 aprobada. Preparar y aprobar conjuntamente plan y tareas. Ejecutar el lote acordado sin consultas rutinarias adicionales dentro de su alcance. La publicación y configuración remota deben estar incluidas en ese alcance con destino y efectos concretos; las acciones sensibles que exijan intervención personal se presentan al usuario cuando corresponda.

Antes de publicar cambios funcionales, realizar la revisión independiente prevista en AGENTS.md. La validación diferenciará controles locales/CI, ensayos sobre el despliegue y aceptación del piloto; no equiparar build exitoso con recorrido online verificado.
