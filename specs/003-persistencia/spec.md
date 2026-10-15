# 003 — Persistencia de desarrollo (Iteración 0D)

Estado: aprobada.

Inspección de destino: proyecto psicolog-ia (vrqmpdedckkgxpdleepr), us-east-1, ACTIVE_HEALTHY, PostgreSQL 17.11.0.003. El conector no encontró tablas en public. Solo se consultaron metadatos; no se aplicaron cambios ni se utilizó la contraseña del chat. El usuario confirmó que es exclusivamente desarrollo con datos ficticios.
Revisión: 0D-r1, 14 de octubre de 2026.
Aprobación humana: el usuario respondió «si» al pedido de aprobar 0D-r1 y confirmar el proyecto exclusivamente para desarrollo con datos ficticios. Autoriza preparar el plan; todavía no autoriza aplicar migraciones o crear credenciales.

## Contexto y objetivo

PsicologIA tiene interfaz, API local y controles de calidad. Esta etapa prepara persistencia PostgreSQL en Supabase para el modelo de dominio aprobado, con migraciones reproducibles y conexión exclusiva desde el backend. Se trabaja únicamente en desarrollo y con datos ficticios.

Fuentes: docs/PROJECT_CONTEXT.md (secciones 3–6 y 9), docs/constitution.md y docs/DECISIONS.md. La aprobación del alcance no decide todavía nombres de tablas, tipos, IDs, credenciales o mecanismo de acceso.

## Actores y definiciones

Actor: desarrollador que prepara y verifica la persistencia; todavía no un profesional autenticado usando funciones clínicas.

HU-01: Como desarrollador, quiero crear la estructura acordada desde migraciones y comprobar la persistencia para implementar después CU01 sobre una base verificable.

Entorno de desarrollo: proyecto o base destinada únicamente a PsicologIA con datos ficticios, sin producción ni datos personales reales. Confirmar el destino antes de aplicar cualquier migración.

Comprobación de disponibilidad de 0B: confirma que la API responde; debe seguir funcionando sin credenciales de base. Una comprobación de conexión de esta etapa será independiente y no acreditará autenticación o aislamiento de profesionales.

## Requisitos funcionales

- RF-01: CUANDO se aplican las migraciones aprobadas sobre una base vacía de desarrollo autorizada, LA BASE crea estructuras para Profesional, Paciente, FichaClinica y SesionClinica, con los atributos y cardinalidades del contexto.
- RF-02: CUANDO se repite el procedimiento documentado en otra base vacía de prueba, LAS MIGRACIONES reproducen el mismo esquema y su historial permite identificar las versiones aplicadas.
- RF-03: CUANDO se guarda información de prueba, LA PERSISTENCIA exige identificadores únicos, relaciones válidas, valores obligatorios y las restricciones aprobadas para esta etapa.
- RF-04: SI se intenta crear una segunda ficha del mismo paciente, reasignar su profesional o asociar una sesión a un profesional distinto del paciente, ENTONCES LA PERSISTENCIA rechaza la operación y conserva los datos anteriores.
- RF-05: CUANDO se registran datos ficticios válidos, LA PERSISTENCIA permite pacientes sin ficha ni sesiones, sesiones sin ficha previa y varias sesiones del mismo paciente en una fecha. No bloquea como duplicado único la coincidencia de nombre, apellido y nacimiento.
- RF-06: CUANDO se crea o modifica un registro, LA PERSISTENCIA mantiene automáticamente las fechas acordadas de creación y última modificación. La edad se calcula desde nacimiento y no se guarda como columna.
- RF-07: SI se intenta guardar un email profesional que coincide tras quitar espacios periféricos y comparar sin distinguir mayúsculas, ENTONCES LA PERSISTENCIA rechaza la duplicación.
- RF-08: CUANDO el desarrollador configura las credenciales locales aprobadas y ejecuta la comprobación documentada, EL BACKEND confirma conexión con la base y puede escribir/leer información ficticia de prueba mediante infraestructura desacoplada. Las operaciones de ensayo se revierten o limpian en el entorno de prueba sin borrar información ajena.
- RF-09: SI faltan credenciales, la conexión falla o vence el plazo acordado, ENTONCES LA COMPROBACIÓN informa un fallo controlado sin imprimir secretos; no comunica éxito ni modifica el destino.
- RF-10: CUANDO se ejecuta la API sin configuración de persistencia, LA COMPROBACIÓN de disponibilidad de 0B conserva su contrato. No añadir una dependencia de base al arranque básico.

## Requisitos no funcionales

- RNF-01: Las migraciones y pruebas versionadas contienen exclusivamente estructura y datos ficticios; las credenciales permanecen fuera de Git y del frontend.
- RNF-02: El mecanismo de persistencia queda en infraestructura del backend; el dominio no depende de Supabase, cliente SQL o detalles de almacenamiento. Crear contratos concretos solo donde exista comportamiento necesario, sin módulos vacíos.
- RNF-03: El acceso directo desde navegador o roles públicos a tablas clínicas queda denegado en esta etapa. Aprobar y probar los permisos del mecanismo elegido; no confundir una conexión privilegiada con autorización por profesional.
- RNF-04: No se implementan autenticación productiva, políticas de acceso por identidad real ni simulación de profesional en endpoints clínicos. La API sigue local y no expone operaciones clínicas. Su diseño no presupone que esos controles ya existen.
- RNF-05: Aplicación y ensayo de migraciones requieren un destino identificado, vacío o con datos ficticios cuya intervención esté expresamente autorizada. No ejecutar resets, cambios destructivos o migraciones de producción como parte de una comprobación.
- RNF-06: Cada restricción obligatoria tiene pruebas positivas y negativas con evidencia. Lint, formato, tipos, pruebas y build de las etapas anteriores continúan pasando.
- RNF-07: Las pruebas habituales de GitHub siguen funcionando sin secretos de una cuenta externa. El plan definirá cómo probar restricciones reales de PostgreSQL en entorno desechable y cómo distinguir ese ensayo de la comprobación en Supabase.
- RNF-08: El plan fija plazo de conexión, fechas de referencia y zona horaria de fechas clínicas antes de imponer reglas de fecha no futura; no asumir zona del servidor.

## Validación del modelo

| Comportamiento                                    | Evidencia prevista                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Profesional obligatorio y email normalizado único | Alta válida; rechazo de referencia ausente y de email equivalente    |
| Paciente sin ficha/sesiones                       | Inserción y consulta válidas                                         |
| Una ficha máxima, motivo no vacío                 | Primera ficha válida; segunda o motivo vacío rechazados              |
| Sesión sin ficha y varias en la misma fecha       | Inserciones válidas                                                  |
| Sesión con profesional ajeno                      | Rechazo sin persistir un registro inconsistente                      |
| Profesional de paciente inmutable                 | Intento de reasignación rechazado                                    |
| Datos obligatorios y fechas automáticas           | Casos válidos/ inválidos y verificación de creación/modificación     |
| Nacimiento o sesión futura                        | Ensayo con referencia temporal y zona acordadas en el plan           |
| Coincidencia de posibles duplicados               | La base permite ambos; advertencia/confirmación pertenece a CU01     |
| Permisos públicos                                 | Intento no autorizado rechazado; ensayo de backend permitido         |
| Conexión real                                     | Evidencia del destino de desarrollo y operación de prueba reversible |

Esta matriz no sustituye los casos de uso completos ni decide unilateralmente políticas de teléfonos o normalización de duplicados. En esta etapa se conserva el teléfono como dato obligatorio sin inventar un formato clínico definitivo.

## Decisiones pendientes antes del plan aprobado

1. Confirmar existencia y destino del proyecto Supabase de desarrollo. No pedir que se peguen claves en el chat; acordar configuración local segura.
2. Elegir mecanismo de acceso desde backend y rol de base, alcance de permisos, gestión de conexión y credenciales.
3. Proponer nombres, tipos, IDs, claves y restricciones; revisar inmutabilidad y política de integridad ante eliminación sin implementar eliminación clínica.
4. Definir migraciones/herramientas, prerrequisitos locales y entorno desechable de pruebas.
5. Precisar fechas, zona horaria, actualización de timestamps y formato de valores opcionales.
6. Acordar la correspondencia de restricciones entre base y validaciones futuras, conservando como pendientes los detalles no confirmados de CU01–CU11.

## Fuera de alcance

Pantallas y endpoints de pacientes/fichas/sesiones, autenticación, administración, datos reales, despliegue, políticas legales o de respaldo productivo, reasignaciones, eliminaciones clínicas y versionado de registros. No crear cuenta ni contratar planes automáticamente.

## Puertas y cierre

Primero aprobar esta especificación aclarada; luego aprobar plan, tareas y destino concreto de las migraciones. La aprobación genérica del plan no identifica una base desconocida ni autoriza cambiar permisos nuevos sin revisar su alcance.

Cierre: esquema reproducible, restricciones y permisos probados, conexión Supabase de desarrollo comprobada y evidencia por requisito, con controles previos satisfactorios. Si faltan recursos o herramientas, preservar los artefactos y declarar las comprobaciones pendientes; no afirmar que funciona en Supabase por pasar pruebas simuladas.
