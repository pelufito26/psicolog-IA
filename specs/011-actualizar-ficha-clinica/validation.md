# Validación CU07

20 de octubre de 2026 · CU07-r1 y CU07-plan-r1/CU07-tasks-r1 aprobados. Datos exclusivamente ficticios.

## Evidencia por requisitos

| Requisitos          | Verificación y resultado                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1–R5               | Aplicación y PostgreSQL local: carga de edición, seis campos presentes, motivo obligatorio, vaciado de cinco optativos a NULL, texto literal/multilínea, rechazo de identidad/fechas/campos extra y comparación de versión HMAC ligada a profesional/paciente/ficha/timestamp completo. Aprobado.                                                                                              |
| R3–R5               | PostgreSQL 17 en dos bases vacías: dos guardados con misma versión producen 200/409; reenvío rechazado; versiones dentro del mismo milisegundo diferenciadas; ausencia sin INSERT, acceso ajeno rechazado, creación/identidades y pacientes/sesiones intactos, rollback y contexto limpio tras fallo real. Aprobado.                                                                           |
| R1, R3, R6–R9       | HTTP con guardas reales del harness: sesión ausente/incompleta/expirada/logout, CSRF/Origin, JSON/límite, no-store, errores públicos y ajeno/inexistente equivalentes para edición/actualización. Aprobado.                                                                                                                                                                                    |
| R1, R2, R5–R10      | UI/cliente: precarga, cancelar, validación/413 con borrador, bloqueo de doble envío y salida durante guardado, conflicto, recarga confirmada y fallo que conserva texto, incertidumbre con comprobación sin reenviar/atribuir éxito, limpieza de respuestas tardías por paciente/cuenta/logout/expiración. Aprobado.                                                                           |
| R2, R5, R6, R8, R10 | Navegador ficticio: crear ficha inicial, abrir dos editores, primero guarda motivo multilínea y vacía antecedente, CU06 confirma lo persistido y actualiza modificación conservando creación. Segundo editor recibe conflicto sin sobrescribir y conserva borrador; recarga mediante confirmación por teclado trae datos guardados. Cancelar tras recarga vuelve sin nuevo guardado. Aprobado. |
| R10                 | Vuelta por teclado consulta → perfil → listado conserva filtro Perfil, texto sin aplicar y página 2. Móvil 390 × 844, scrollWidth 375, sin desbordamiento. Viewport restaurado. Aprobado.                                                                                                                                                                                                      |

`npm run check` aprobado: lint, formato, tipos, **252 pruebas (134 web y 118 API)** y build. Matrices PostgreSQL CU01–CU07/AUTH aprobadas en dos bases vacías; 112 ensayos generales sobre el árbol de trabajo (incluyen ensayos pendientes de AUTH T7, excluidos del commit CU07).

Capturas fuera de Git en C:/Users/user/Desktop/PsicologIA/: cu07-actualizada.png, cu07-conflicto-movil.png y cu07-recarga-movil.png. Solo datos ficticios. La revisión manual cubrió éxito, cancelación, conflicto/recarga y navegación; respuestas inciertas, fallos y cambios de acceso se probaron automáticamente, sin forzar esos fallos desde el navegador.

## Revisión independiente

El subagente revisor_cu07 leyó el contrato de .codex/agents/revisor.toml y revisó el árbol congelado 0854562ba7c12c6417a76b56fff6c16fab60a712 frente a base 102e362f38d095cbca171e1522095a2924dd0c51, sin cambios AUTH T7. Resultado: sin hallazgos accionables P0–P3. Revisó aplicación, SQL, rutas/runtime, cliente/editor, navegación y pruebas; comprobó versión textual bajo bloqueo, borrador protegido y descarte de respuestas tardías. Revisión estática; no ejecutó pruebas/navegador ni verificó capturas. La evidencia de cierre se añadió después de esa revisión; no cambia el código revisado. No sustituye pruebas ni aprobación humana.

## Fallos resueltos y límites

- Una prueba detectó que un campo opcional presente con undefined podía pasar a NULL. Se exige que los seis campos de reemplazo sean strings: una omisión/tipo incorrecto no se convierte en borrado accidental. La prueba pasó tras corregir aplicación.
- Un literal nuevo en una prueba de CU06 quedó con un carácter de reemplazo por la codificación del transporte del script; se corrigió y pasó. No se cambiaron los textos del producto para acomodar la prueba.
- La fixture de precisión modifica únicamente dos timestamps de ensayo con session_replication_role local al administrador de la base desechable; se restaura al COMMIT/ROLLBACK. No cambia migraciones ni permisos/configuración de desarrollo remota.
- Auth/correo simulados; PostgreSQL 17 real local. No se validó recepción de correo ni acceso productivo: AUTH T7 continúa pendiente y separado. Reiniciar API invalida verificadores en memoria; se requiere recarga explícita.
- Sin migraciones/dependencias/permisos nuevos, datos reales, envíos, push/PR o despliegue. Fuente técnica revisada para bloqueo de fila: [PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html).

La copia exacta del índice excluyendo AUTH T7 también pasó PostgreSQL 17: 96 ensayos generales sobre dos bases vacías, con todas las matrices CU01–CU07/AUTH. El código preparado para commit coincide con el árbol revisado; solo se agregaron los documentos de cierre.

Revisión documental final: el revisor detectó P3 por caracteres de reemplazo en la frase de aprobación de DEC-017 y señaló encabezados pendientes desactualizados. Se corrigieron los textos a UTF-8 y el estado de spec/plan/tasks conforme a la aprobación vigente. Código y pruebas permanecen iguales.
