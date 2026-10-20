# Decisiones de PsicologIA

Las decisiones originales de producto y ARQ-01–03 permanecen en PROJECT_CONTEXT.md. Este registro recoge decisiones posteriores.

## DEC-001 — Adoptar la preparación documental y el método SDD

- Estado: aprobado.
- Fecha: 14 de octubre de 2026.
- Evidencia: el usuario indicó «perfecto, avancemos» después de revisar la propuesta de incorporar la metodología en 0A.
- Alcance: AGENTS.md, constitución, README, referencia metodológica versionada y registro de validación. No incluye implementación técnica ni publicación de estos archivos.
- Método: aprobar la especificación aclarada y luego aprobar conjuntamente plan y tareas. Mantener requisitos, tareas y evidencia vinculados en cada cambio.
- Referencia: pelufito26/desarrollo-ia-metodologia, commit fc42ce6eeba7db41e7faa9edf2e6bff67c634b72.
- Motivo: disponer de contexto recuperable y criterios verificables antes de crear la base técnica.
- Efecto: las especificaciones se crearán con contenido concreto; la copia metodológica es referencia, no una instalación de skills ni de agentes.
- Alternativas: un enlace externo obliga a recuperar la biblioteca en cada entorno; un submódulo añade preparación de checkout. Se adopta una copia documental fijada para lectura local.
- Pendiente: herramienta de paquetes, versión de Node, esquema relacional, acceso a Supabase, simulación del profesional y textos completos de CU01–CU11. Requieren propuestas y aprobación antes de la implementación que dependa de ellos.

## DEC-002 — Base técnica local 0B

Estado: aprobado, 14 de octubre de 2026. El usuario aprobó spec 0B-r1 y después el plan y T1–T5 tras aclarar que la API es el backend propio. Alcance: base local con npm workspaces, Node 24 LTS, frontend React/Vite y API Express, pruebas y compilación; sin Supabase, funciones clínicas o publicación. Versiones y alternativas: specs/001-base-tecnica/plan.md. Evidencia: specs/001-base-tecnica/validation.md. La autorización no incluye push, merge o despliegue de esta etapa.

## DEC-003 — Calidad local y CI de 0C

Estado: aprobado, 14 de octubre de 2026. El usuario aprobó spec 0C-r1 y el plan/tareas 0C-plan-r1 y 0C-tasks-r1 mediante «sip», incluido pasar TypeScript de 7.0.2 a 6.0.3 para satisfacer el soporte declarado de typescript-eslint 8.71.2. Se conservan stack, contratos y Node 24.21.0; las verificaciones de 0B se repiten.

Se adoptan ESLint, Prettier, comando check y workflow de lectura para PR/main, con acciones fijadas por SHA. Autorización: instalación, formato inicial, correcciones mínimas y validación local. Sin publicación, merge, despliegue ni protección de ramas. La evidencia remota de GitHub queda pendiente hasta la publicación autorizada. Versiones, reglas y alternativas en specs/002-calidad-ci/plan.md.

## DEC-004 — Preparación de persistencia 0D

El usuario confirmó el proyecto vrqmpdedckkgxpdleepr como desarrollo con datos ficticios, aprobó spec 0D-r1 y luego T1–T4 del plan 0D-plan-r1 mediante «si». Incluye schema privado, restricciones, zona clínica America/Montevideo, pg y CLI fijados, infraestructura de comprobación y pruebas. No autoriza aplicación remota T5, creación de cuenta/credencial T6 ni publicación. La preparación se validó con PostgreSQL portátil 17.10 en dos bases desechables locales; no se instaló un servicio global. El nombre de migración se generó por CLI. Ver specs/003-persistencia/validation.md.

## DEC-005 — Aplicación aprobada de T5

El 15 de octubre de 2026 el usuario aprobó el archivo SQL concreto y su destino de desarrollo vrqmpdedckkgxpdleepr. Se aplicó la migración base_psicologia con versión remota 20261015140453. Se alineó el nombre local con ese historial sin cambiar el SQL. Permisos e integridad comprobados con datos ficticios y rollback. Esta aprobación no incluye cuenta LOGIN, nueva contraseña o configuración de conexión del backend (T6).

## DEC-006 — Cuenta restringida y conexión T6

Aprobada por el usuario el 15 de octubre de 2026, incluida reanudación tras detener el paso de cifrado interactivo. Cuenta psicologia_app exclusivamente de desarrollo, con LOGIN y membresía del grupo existente, sin borrado ni administración. Credencial nueva local excluida de Git; conexión directa verificada mediante CA oficial y TLS 1.3. Ensayos de backend y permisos reales satisfactorios con rollback. No se autoriza publicación por concluir T6 ni se considera autorización clínica productiva.

## DEC-007 — CU01 y contexto ficticio de desarrollo

Aprobado el 15 de octubre de 2026: el usuario pidió una propuesta basada en el resumen, aprobó CU01-r1 mediante «sisi vamo» y aprobó después CU01-plan-r1/CU01-tasks-r1 mediante «si». Se adoptan teléfono de 7–15 dígitos con + opcional, nombres con espacios normalizados, duplicados por nombre/apellido sin acentos/caso y mismo nacimiento dentro del profesional, advertencia y confirmación explícita. No se atribuyen estas precisiones a un caso original no recuperado.

El profesional ficticio proviene del servidor, habilitado expresamente solo en desarrollo. No equivale a autenticación; el rol SQL técnico no aísla identidades reales. Se autorizaron T1–T6 y la demo en vrqmpdedckkgxpdleepr con un profesional y hasta dos pacientes ficticios. No incluye publicación, merge o despliegue. Implementación sin nuevas dependencias ni cambios al esquema; límites HTTP, token y timeout en el plan. Evidencia en specs/004-registrar-paciente/validation.md.

## DEC-008 — Método proporcional y entregas visibles

Aprobado el 15 de octubre de 2026 mediante «dale, vamos asi»: conservar AGENTS.md como entrada y autoridad, las dos puertas de aprobación, arquitectura, aislamiento, datos ficticios y autorizaciones de publicación/migración. Para funciones pequeñas, especificación breve con requisitos/aceptación/límites; plan y tareas sin duplicar requisitos; evidencia única enlazada a pruebas y CI. Ejecutar el lote aprobado sin consultas rutinarias y resolver decisiones técnicas dentro de su alcance. Consultar nuevas reglas de producto, ampliaciones o efectos no autorizados. Cada entrega agrega un comportamiento visible o resuelve un riesgo concreto. Priorizar el recorrido registrar, encontrar y consultar y luego feedback profesional; no agregar infraestructura sin necesidad. Esta decisión autoriza el ajuste del método y preparar CU02; no aprueba sus reglas propuestas ni su implementación.

## DEC-009 — CU02 aprobado

El 15 de octubre de 2026 el usuario aprobó CU02-r1 mediante «Aprobado». Incluye listado del profesional, edad calculada según Montevideo (29/2 cumple el 1/3 en año no bisiesto), orden normalizado por apellido/nombre/ID, búsqueda parcial literal por nombre o apellido, páginas de 20 y regreso al listado después de CU01. Spec en specs/005-listar-pacientes/spec.md. Plan y tareas requieren su segunda aprobación; esta decisión no autoriza implementación ni amplía CU03 o acceso productivo.

Plan CU02-plan-r1 y tareas CU02-tasks-r1 aprobados posteriormente mediante «avancemos». Autorización del lote local T1–T4, incluida demo de lectura con pacientes ficticios existentes; no nuevas escrituras remotas, publicación o despliegue.

## DEC-010 — Acceso de profesionales en dos pasos por email

El usuario eligió explícitamente contraseña + código por correo y aprobó AUTH-r2 mediante «si». Se descarta la propuesta TOTP de AUTH-r1. Incluye email confirmado, códigos de seis dígitos/cinco minutos/cinco intentos/reenvío a sesenta segundos, verificación de ambos pasos en backend, identidad por usuario Auth y aislamiento por profesional. Excepción limitada: identidad del profesional y correo transaccional reales; pacientes/registro clínico permanecen ficticios. No es MFA nativo AAL2 ni factor independiente del buzón. CU03 queda pospuesto. El usuario eligió comenzar con correo de prueba local al no tener dominio/proveedor. Plan y tareas pendientes de aprobación; no autoriza configuración remota, contratación o envíos reales.

Plan AUTH-plan-r1 y T1–T6 aprobados mediante «oka dale», después de confirmar que primero se usa correo de prueba. Se implementa y verifica localmente; T7, correo real, migración/permisos remotos, publicación y despliegue quedan fuera. Se preparan adaptadores reales sin configurarlos ni transmitir datos reales. El ensayo ficticio no equivale a validar Supabase Auth real.

## DEC-011 — Piloto de acceso con correo real

El 15 de octubre de 2026 el usuario autorizó expresamente aplicar la migración de acceso en vrqmpdedckkgxpdleepr, configurar Auth/correo con redirección local y enviar hasta seis correos de registro, ingreso y recuperación exclusivamente a la dirección de su cuenta Resend, indicada en la conversación y conservada fuera de Git. Sin dominio propio se utiliza onboarding@resend.dev. No incluye contratación, despliegue, pacientes reales, destinatarios adicionales ni publicación.

Antes de la primera aplicación remota se hizo explícita la comprobación del profesional propietario en la política de fichas, a raíz de un rechazo de revisión automática. Se agregaron ensayos de lectura/escritura ajena, cambio de paciente y contexto vacío. La migración aprobada se aplicó con versión remota 20261015213340; se alineó el nombre local. La configuración del proveedor y la prueba de recepción siguen pendientes y no se confunden con la evidencia simulada.

Actualización del 20 de octubre: usuario ingresó personalmente al panel y confirmó guardar SMTP con la clave existente de Resend en Supabase. Se configuraron remitente de prueba, redirección local exacta y plantillas de confirmación/recuperación. El usuario completó registro, confirmación, contraseña+código y logout; dos correos entregados y revocación comprobada en DB. Recuperación diferida expresamente; aislamiento con dos cuentas reales no ensayado. T7 permanece parcial. El usuario autorizó posteriormente consolidar en Git los cambios/evidencia ya realizados y preparar su PR mediante «dale»; no incluye nuevos envíos, migraciones remotas, permisos, recuperación, merge ni despliegue. La aceptación productiva sigue fuera.

## DEC-012 — CU03: datos personales del perfil

El 15 de octubre de 2026 el usuario aprobó CU03-r1 mediante «si». Incluye abrir un paciente propio desde el listado, consultar nombre/apellido/nacimiento/edad/teléfono, volver conservando búsqueda y página, aislamiento por sesión y manejo de estados. Los accesos a ficha clínica y sesiones se difieren hasta implementar sus casos; edición pertenece a CU04. Se acepta desarrollar y verificar con el harness ficticio existente mientras AUTH T7 espera configuración de correo real. Es una propuesta aprobada desde el resumen, no un caso original recuperado. Plan y tareas pendientes de aprobación conjunta; no autoriza implementación ni amplía operaciones remotas o publicación.

Plan CU03-plan-r1 y tareas CU03-tasks-r1 aprobados posteriormente mediante «ok». Se autoriza T1–T4 como lote local: implementación, pruebas y demo ficticia, rama/commit de CU03. Se conservan aparte los cambios pendientes de AUTH T7. No nuevas dependencias, cambios de esquema, operaciones remotas, correos, publicación o despliegue en este lote.

## DEC-013 — CU04: edición de datos personales

El 17 de octubre de 2026 el usuario aprobó CU04-r1 mediante «si». Incluye edición desde el perfil de nombre, apellido, nacimiento y teléfono, reutilizando reglas de CU01 y duplicados con confirmación explícita excluyendo al propio paciente. Profesional/identidad/creación permanecen inmutables; guardado atómico y fecha de modificación automática. Se adopta detectar conflictos concurrentes sin sobrescribir silenciosamente y recargar solo por acción explícita, conservando el borrador ante error/conflicto. Cancelar no escribe; guardar vuelve al perfil actualizado y mantiene el contexto del listado. Propuesta aprobada desde el resumen, no un caso original recuperado. Plan y tareas pendientes de aprobación conjunta; solo demo/datos ficticios, sin autorizar implementación ni operaciones remotas/publicación.

Plan CU04-plan-r1 y tareas CU04-tasks-r1 aprobados posteriormente mediante «si». Autorizado el lote T1–T4 local, incluida implementación, pruebas, demo ficticia y rama/commit exclusivamente de CU04. Los cambios anteriores de AUTH T7 se conservan aparte. Sin nuevas dependencias, esquema, operaciones remotas, correos reales, publicación o despliegue.

## DEC-014 — CU05: creación de ficha clínica

El 19 de octubre de 2026 el usuario confirmó CU05-r1 y precisó «el motivo de la consulta el unico obligatorio», seguido de «dale» para preparar plan/tareas. Motivo obligatorio; antecedentes personales/familiares, medicación, evaluación y observaciones opcionales. Una ficha por paciente, creada desde su perfil y aislada por profesional; conservar textos internos como texto plano y rechazar segunda creación sin sobrescribir. Incluye estado de existencia y regreso confirmado al perfil; consulta completa/edición quedan para CU06/CU07. Propuesta aprobada desde el resumen, no caso original recuperado. Plan y tareas pendientes de aprobación conjunta; solo datos clínicos ficticios y sin autorizar implementación, operaciones remotas o publicación.

Plan CU05-plan-r1 y tareas CU05-tasks-r1 aprobados mediante «perfecto, si». Se autoriza T1–T4 local: módulo, formulario, pruebas, demo exclusivamente ficticia y rama/commit de CU05. Reutilizar el esquema existente; dejar AUTH T7 fuera del commit. Sin dependencias, permisos/esquema nuevos, operaciones remotas, correos reales, publicación o despliegue.

## DEC-015 — CU06: consulta de ficha clínica

El 19 de octubre de 2026 el usuario aprobó CU06-r1 mediante «si». Incluye acceso desde el perfil del paciente propio, identificación por nombre/apellido, seis campos de solo lectura, optativos vacíos como Sin registrar, texto literal con formato interno y fechas de creación/modificación en America/Montevideo. Consulta sin cambios clínicos, distinción entre ausencia/error/paciente no disponible, navegación con contexto conservado y limpieza por pérdida/cambio de acceso. Paciente ajeno e inexistente no se distinguen públicamente. Propuesta aprobada desde el resumen, no caso original recuperado. Plan y tareas pendientes de aprobación conjunta; sin autorizar implementación ni publicación. Solo datos ficticios; AUTH T7, edición CU07, nuevas dependencias/esquema/permisos y operaciones remotas quedan fuera.

Plan CU06-plan-r1 y tareas CU06-tasks-r1 aprobados posteriormente mediante «si». Se autoriza T1–T4 como lote local, incluida implementación, pruebas, demo ficticia y rama/commit solo CU06. Mantener AUTH T7 aparte. Sin publicación, nuevas dependencias, esquema/permisos u operaciones remotas.

## DEC-016 — Revisor independiente del proyecto

El 19 de octubre de 2026 el usuario autorizó «implementemoslo» tras la propuesta de que el principal implemente y un segundo agente revise antes de publicar. Se incorpora un único revisor versionado en .codex/agents/revisor.toml, referido desde AGENTS.md y documentado en docs/SUBAGENTS.md. Revisa alcance explícito, corrección, aislamiento, integridad y evidencia; solo informa, sin editar, publicar, aprobar/mergear o delegar a otros agentes. El principal comprueba y resuelve hallazgos y mantiene las aprobaciones humanas. Sin cambios del producto, configuración global, dependencias, permisos o CI; no autoriza publicación. Los permisos siguen siendo los del padre: no se presenta una instrucción de solo lectura como aislamiento técnico. Primera prueba con CU06, excluyendo AUTH T7 y la propia configuración aún sin commit.

## DEC-017 — CU07: actualización de ficha clínica

El 20 de octubre de 2026 el usuario aprobó CU07-r1 mediante «perfecto». Editar desde CU06 los seis campos existentes, solo motivo obligatorio, optativos vaciables y reglas de texto de CU05. Guardado atómico con identidad/paciente/creación inmutables y modificación automática, sin afectar pacientes ni sesiones. Detectar conflicto concurrente, conservar borrador y recargar solo tras confirmación de descarte. Ante respuesta incierta bloquear otro guardado y permitir comprobar sin atribuir autoría/éxito; para editar de nuevo recargar explícitamente la versión persistida. Navegación/contexto y aislamiento por sesión conservados. Propuesta desde resumen, no caso original recuperado. Plan/tareas pendientes de aprobación conjunta; no autoriza implementación/publicación ni nuevas dependencias, esquema/permisos u operaciones remotas. Solo datos ficticios, AUTH T7 separado.

Plan CU07-plan-r1 y tareas CU07-tasks-r1 aprobados mediante «si si». Se autoriza T1–T4 localmente: implementación, pruebas, demo ficticia, rama/commit y revisión independiente, sin publicación. Conservar AUTH T7 aparte; no ampliar dependencias, esquema/permisos, correo ni operaciones remotas.

## DEC-018 — Lote CU08–CU10: registro y consulta de sesiones

El 20 de octubre de 2026 el usuario pidió agrupar casos para agilizar y aprobó SESIONES-r1 mediante «dale». Se agrupan registro CU08, historial CU09 y detalle CU10; CU11 se difiere. Fecha/anotaciones obligatorias, fecha inicial hoy de Montevideo y retroactivos sin futuro ni nuevas restricciones de antigüedad/nacimiento. Sesiones nuevas de misma fecha/texto permitidas; reenvío de una misma operación sin duplicar y respuesta incierta comprobada por operación. Historial de 20 por página, fecha de sesión descendente y desempate por creación/ID descendentes, sin anotaciones en lista. Alta confirmada abre detalle persistido y vuelve a historial página 1; detalle existente conserva su página. Acceso por propietario, paciente sin ficha admitido, contexto/navegación y textos literales conservados. Precisiones aprobadas desde resumen, sin recuperar originales. Plan/tareas pendientes de aprobación conjunta; sin implementación/publicación, nuevas dependencias, esquema/permisos o efectos remotos. Solo datos ficticios, AUTH T7 separado.

Plan SESIONES-plan-r1 y tareas SESIONES-tasks-r1 aprobados mediante «ok». Se autoriza T1–T6 localmente para CU08–CU10, con pruebas, demo ficticia, revisión independiente y rama/commit. Sin publicación, CU11, nuevas dependencias/esquema/permisos, correo real u operaciones remotas; AUTH T7 aparte.

## DEC-019 — CU11: modificación de sesión clínica

El 20 de octubre de 2026 el usuario aprobó CU11-r1 mediante «si». Editar desde detalle fecha y anotaciones sin límite de antigüedad, validando calendario/no futuro con hoy de Montevideo vigente al guardar. Identidades, paciente, profesional y creación inmutables; modificación automática sin afectar otras sesiones/fichas/pacientes. Conflicto concurrente sin sobrescritura, borrador conservado y recarga con confirmación; respuesta incierta bloquea reenvío y lectura no atribuye autoría. Volver reconsulta historial conservando página aunque cambie posición por fecha; alta idempotente CU08 no revierte una sesión editada. Propuesta desde resumen, no caso original recuperado. Plan/tareas pendientes de aprobación conjunta; sin autorizar implementación/publicación, nuevas dependencias, esquema/permisos, correo u operaciones remotas. Solo datos ficticios; AUTH T7 separado.

Plan CU11-plan-r1 y tareas CU11-tasks-r1 aprobados mediante «si». Se autoriza T1–T4 localmente, con pruebas, demo ficticia, revisión independiente y rama/commit. Sin publicación, dependencias/esquema/permisos nuevos, correo ni efectos remotos; AUTH T7 separado.

## DEC-020 — Integración del MVP

El 20 de octubre de 2026 el usuario aprobó INTEGRACION-r1 mediante «si». Verificar CU01–CU11 como recorrido continuo con PostgreSQL local desechable, dos profesionales ficticios, navegación/contexto, integridad entre módulos y reglas ya aprobadas. Reutilizar la cobertura existente y añadir solo regresiones por huecos concretos; actualizar la guía de arranque/estado. Separar el piloto real (registro, confirmación, contraseña+código y cierre verificados) de las pruebas simuladas. Recuperación diferida explícitamente y AUTH T7 no completada. Conservar los cambios pendientes de AUTH sin incorporarlos incidentalmente. Plan/tareas pendientes de aprobación conjunta; no se autorizan todavía implementación, nuevas dependencias/esquema/permisos, correo/operaciones remotas, publicación ni despliegue.

Plan INTEGRACION-plan-r1 y tareas INTEGRACION-tasks-r1 aprobados conjuntamente mediante «si». Se autoriza T1–T4 localmente: cobertura/recorrido, correcciones de defectos contra reglas vigentes, navegación/guía, pruebas, revisión y commit. Sin nuevas dependencias/esquema/permisos, correo/operaciones remotas, recuperación, publicación o despliegue. AUTH T7 separado.

## DEC-021 — Preparación del piloto online en Vercel

El 20 de octubre de 2026 el usuario confirmó «dale si» a avanzar con el despliegue del MVP actual en Vercel, conservando Supabase, acceso real y pacientes ficticios. Se prepara specs/015-piloto-vercel/spec.md, revisión VERCEL-r1, para concretar ese objetivo. La dirección del trabajo está autorizada; los requisitos de la propuesta no se consideran aprobados antes de presentarlos. Se mantienen las puertas de especificación y plan/tareas de AGENTS.md. No se ha desplegado ni cambiado configuración remota con esta preparación. Recuperación, pacientes reales, apertura a terceros y contratación permanecen fuera; el plan identificará destinos y efectos remotos concretos para ejecutar el alcance aprobado sin pedir autorizaciones repetidas.

VERCEL-r1 aprobada posteriormente mediante «si». El usuario confirmó cuenta personal Vercel con proyectos vinculados a v0; preparar un proyecto nuevo para este piloto, conservando los existentes. VERCEL-plan-r1 y VERCEL-tasks-r1 se presentan para aprobación conjunta, incluida la publicación y los efectos remotos descritos; no se ejecutaron con la preparación documental.

VERCEL-plan-r1 y VERCEL-tasks-r1 aprobados conjuntamente mediante «sip aprobueo». Se autoriza T1–T6, incluida implementación, pruebas, revisión independiente, rama/commit/PR y despliegue manual en proyecto nuevo de la cuenta personal, con secretos de servidor y cambios de redirección/Site URL expresamente descritos. Sin merge, pago, destinatarios adicionales, migraciones/permisos nuevos ni datos clínicos reales. Autenticación personal e identificación del destino se coordinan durante la ejecución.
