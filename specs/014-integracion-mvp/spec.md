# Integración del MVP

INTEGRACION-r1 · 20 de octubre de 2026 · Aprobada mediante «si».

## Resultado y alcance

Comprobar que CU01–CU11 funcionan como un recorrido continuo, con datos ficticios y sin depender de un orden accidental de pruebas o de registros de demostraciones anteriores. Corregir únicamente defectos verificables respecto de las especificaciones aprobadas; no añadir funcionalidades ni reglas nuevas.

Fuentes: PROJECT_CONTEXT.md (iteración de integración), especificaciones aprobadas 004–013 y evidencia de acceso 006. PR14 incorporado en 7bb1528b37399d93eb1dda27a6056fc354bbf177, con calidad e integración PostgreSQL satisfactorias. El piloto real ya comprobó registro, confirmación, contraseña+código y logout; recuperación diferida explícitamente por el usuario. No declarar AUTH T7 completa ni aptitud para datos clínicos reales.

Ensayo reproducible en el harness local y PostgreSQL desechable existentes. Dos profesionales ficticios para aislamiento. La evidencia del piloto Supabase/Resend se documenta como tal, sin atribuir al proveedor real resultados del harness. Sin nuevos correos, destinatarios, dependencias, esquemas, permisos, despliegue o operaciones remotas bajo esta etapa. Los cambios pendientes de AUTH se conservan y se identifican al seleccionar archivos; no publicarlos incidentalmente con integración.

## Requisitos y aceptación

| ID  | Resultado verificable                                                                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | Iniciar con profesional y base ficticios controlados; registrar paciente, encontrarlo, consultar/editar su perfil, crear/consultar/actualizar su ficha y registrar/consultar/editar sesiones. Comprobar después de cada guardado los valores persistidos y la identidad del recurso, sin reemplazar repositorios por mocks en la comprobación de persistencia.                                     |
| I2  | Verificar las ramas que conectan módulos: paciente sin ficha puede tener sesiones; varias sesiones en la misma fecha son válidas; editar perfil conserva ficha/sesiones; editar ficha conserva pacientes/sesiones; editar sesión conserva paciente/ficha/otras sesiones. Aplicar exactamente los campos obligatorios y reglas ya aprobados.                                                        |
| I3  | Conservar contexto al navegar entre listado, perfil, ficha e historial: filtro aplicado, texto sin aplicar, página y paciente seleccionado según cada CU. Guardados vuelven a lecturas persistidas; cambiar fecha de sesión reordena el historial sin perder la página de regreso. Revisar recorrido de escritorio, teclado y móvil.                                                               |
| I4  | Ejecutar el recorrido con dos profesionales y demostrar que ninguno consulta o modifica recursos del otro. Sin sesión vigente no se accede a datos; cerrar/expirar/cambiar cuenta elimina vistas y borradores anteriores y descarta respuestas tardías. Mantener CSRF/Origin/no-store y ausencia de datos clínicos en URL o almacenamiento persistente del navegador.                              |
| I5  | Reutilizar controles existentes de duplicados de pacientes, unicidad de ficha, alta idempotente de sesión y versiones de edición. Ante validación, conflicto o respuesta incierta, conservar borrador y ofrecer la recuperación aprobada, sin doble alta ni sobrescritura silenciosa. Añadir solo pruebas de integración que cubran riesgos entre módulos no demostrados por las pruebas actuales. |
| I6  | Actualizar la guía de arranque y estado del producto para otro equipo: requisitos y comandos existentes, variables por nombre sin valores secretos, diferencia entre servidor real y harness ficticio, requisitos del PostgreSQL desechable y limitación de enlaces 127.0.0.1 a la misma PC. Eliminar afirmaciones obsoletas de módulos no implementados sin reescribir decisiones históricas.     |
| I7  | Registrar una matriz breve de recorrido/requisito/evidencia y defectos corregidos o pendientes. Ejecutar check y matrices PostgreSQL existentes; revisar diff exacto sin cambios ajenos y revisión independiente cuando haya cambios funcionales. Distinguir pruebas locales, piloto real y verificaciones no ejecutadas. No convertir una captura o CI verde en aceptación productiva.            |

## Puertas siguientes

INTEGRACION-r1 aprobada. Plan y tareas aprobados conjuntamente mediante «si» conforme a AGENTS.md y DEC-008. Lote local T1–T4 autorizado; sin publicación, operaciones remotas ni recuperación. Aprobación registrada en DEC-020.
