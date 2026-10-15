# Plan CU01 — Registrar paciente

Revisión: CU01-plan-r1, 15 de octubre de 2026. Spec aprobada: CU01-r1.
Estado: aprobado conjuntamente con CU01-tasks-r1 mediante «si», después de la aprobación de CU01-r1. Incluye T1–T6 y la demo ficticia acotada; no publicación.

## Entrega visible

Formulario de nombre, apellido, nacimiento y teléfono; errores por campo, progreso, advertencia de posible duplicado, confirmación explícita y éxito. Conservar valores ante errores; editar invalida confirmación. Tras éxito limpiar y enfocar primer campo. Cancelar vuelve a pantalla inicial sin escribir. Mantener aviso de datos ficticios y health discreto. Sin listado, perfil o login.

## Contrato API

POST /api/pacientes recibe JSON con nombre, apellido, fechaNacimiento (YYYY-MM-DD), telefono y opcional confirmacionDuplicado. Rechazar propiedades desconocidas, incluidas identidades de profesional.

| Resultado                             | Respuesta                                                   |
| ------------------------------------- | ----------------------------------------------------------- |
| Guardado confirmado                   | 201, id y estado registrado                                 |
| Campos inválidos                      | 400, codigo DATOS_INVALIDOS y errores por campo             |
| Duplicado sin confirmar               | 409, codigo POSIBLE_DUPLICADO y token confirmacionDuplicado |
| Token inválido o vencido              | 409, codigo CONFIRMACION_INVALIDA; revisar y reenviar       |
| Configuración/profesional ausentes    | 503, codigo DESARROLLO_NO_CONFIGURADO                       |
| Error de persistencia                 | 503, codigo REGISTRO_NO_CONFIRMADO                          |
| Tipo no JSON o payload mayor a 16 KiB | 415 o 413, mensaje público sin detalles internos            |

16 KiB es límite técnico de payload, no una regla clínica por campo. Validar calendario real y hoy en America/Montevideo mediante reloj inyectable; no usar zona del navegador. Aplicar exactamente las reglas aprobadas de nombre/teléfono/duplicados.

Cliente: plazo de 12 segundos con cancelación y guardia inmediata contra doble clic; sin reintentos automáticos. Ante pérdida de respuesta de escritura, indicar que el resultado no pudo confirmarse, conservar valores y volver a comprobar duplicados al reenviar. No prometer entrega exactamente una vez.

## Separación y persistencia

Backend en modules/pacientes: domain (tipos/validación/normalización), application (caso de uso y contrato de repositorio), infrastructure (pg y SQL parametrizado), presentation (Express). Frontend en src/pacientes: formulario, cliente y pruebas. No crear paquete compartido ni añadir dependencias: reutilizar Node crypto, Express, pg, React y Vitest.

Repositorio: BEGIN, bloqueo asesor transaccional por profesional, validar existencia del profesional, consultar candidatos por ese profesional y fecha de nacimiento, comparar claves normalizadas en aplicación, advertir o INSERT, COMMIT. Rollback antes de commit ante error/advertencia; liberar conexión. El bloqueo reduce carreras entre altas del mismo contexto y no impide duplicados confirmados. No transmitir coincidencias ni consultar pacientes de otros profesionales.

Token HMAC con secreto aleatorio de proceso (no contraseña DB), ligado al profesional y cuatro valores normalizados; vence a los 10 minutos. Firma en tiempo constante. Editar payload, cambiar profesional o reiniciar servidor exige nueva revisión. No es autenticación. No persistir datos de formulario en localStorage, logs o URL.

## Contexto local y seguridad

DEV_PROFESIONAL_ID identifica un profesional ficticio existente; DEV_PATIENT_REGISTRATION=true habilita el flujo. Deshabilitar en NODE_ENV=production. El navegador no decide identidad. No crear un profesional automáticamente si falta. Health conserva su contrato sin DB.

Mantener loopback y proxy. Rechazar Origin presente salvo http://127.0.0.1:5173 y http://localhost:5173; rechazar null y no abrir CORS. Clientes locales de prueba sin Origin pueden usar JSON. Esto no sustituye autenticación.

Reutilizar configuración TLS y pool de 0D bajo demanda; cerrar pool al detenerse y manejar errores sin datos personales. Cargar .env opcional del backend tanto en dev como compilado. Sin nuevos permisos, claves públicas o migraciones.

## Demo y pruebas

CI y ensayos habituales: PostgreSQL desechable y datos sintéticos. Ampliar el runner de 0D para CU01 sin secretos Supabase.

Preparar seed explícito, deshabilitado en producción y restringido al proyecto de desarrollo confirmado. Aprobar el lote permite una demo en ese Supabase con un profesional «Profesional Demo PsicologIA» (email example.invalid) y hasta dos pacientes «Paciente Demo», incluido duplicado confirmado. No modificar filas ajenas ni borrar automáticamente datos: la cuenta no tiene DELETE. Documentar IDs sin credenciales.

| Requisitos        | Evidencia                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| RF-01–03, RF-11   | Validaciones unitarias: vacíos, bisiesto, hoy/mañana, teléfono, acentos y espacios                                  |
| RF-04–07          | Caso de uso y PostgreSQL: alta, advertencia sin escritura, confirmación, payload/token alterado y profesional ajeno |
| RF-08–09          | UI: doble clic, errores, timeout, valores conservados y ausencia de éxito falso                                     |
| RF-10, RNF-01–02  | API: contexto ausente/manipulado, producción, orígenes, JSON y tamaño                                               |
| RF-12, RNF-04     | Navegador y tests: éxito, reinicio/foco, teclado y errores accesibles                                               |
| RNF-03, RNF-05–07 | Revisión de límites, npm run check y npm run test:database                                                          |

Escribir pruebas pertinentes antes de implementar reglas/rutas y comprobar fallos por comportamiento ausente. Revisar desktop y ancho móvil; registrar pendientes si el navegador no está disponible.

Archivos adicionales: app.ts/server.ts, App.tsx/styles.css, .env.example, scripts de seed/ensayo, documentación y decisiones. No modificar SQL ya aplicado, PROJECT_CONTEXT.md o biblioteca.

## Autorización y cierre

T1–T6 pueden aprobarse como lote local, incluida la demo ficticia acotada anterior, sin consultar entre tareas mientras se conserve el alcance. Conservar los cambios documentales de 0E ya presentes.

No autoriza publicar, merge o despliegue. Cierre: formulario y advertencia operables, guardado probado y evidencia de controles. CI remoto se observa cuando se autorice publicar.
