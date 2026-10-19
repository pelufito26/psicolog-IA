# Validación CU06

19 de octubre de 2026 · CU06-r1 y CU06-plan-r1/CU06-tasks-r1 aprobados. Datos exclusivamente ficticios.

## Evidencia

| Requisitos        | Verificación y resultado                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1, R2, R5–R7, R9 | Aplicación/rutas/runtime y matriz HTTP AUTH: consulta propia con/sin ficha; UUID/campos extra; sesión ausente, incompleta, expirada y logout; CSRF/Origin, JSON/límite y no-store; ajeno/inexistente indistinguibles. Aprobado.                                                                                                                                |
| R2–R5             | PostgreSQL 17 real local, dos bases vacías reproducibles: textos y fechas exactos, optativos NULL, identificación propia, aislamiento entre dos profesionales y contexto tras errores. Comparación de todas las columnas de fichas/pacientes/sesiones antes/después de las lecturas sin modificaciones. Aprobado.                                              |
| R1–R3, R6–R10     | Pruebas de cliente/UI: contrato incompleto/inconsistente rechazado, seis campos, textos literales/multilínea, optativos, fechas en Montevideo con cambio de día UTC, ausencia/error/reintento, vuelta al perfil/listado, cancelación y respuestas tardías por paciente/cuenta/logout/expiración. Aprobado.                                                     |
| R1–R4, R8, R10    | Navegador local: listado con filtro Perfil, página 2 y texto sin aplicar → perfil Demo 21 → crear ficha ficticia → perfil → consultar → perfil → listado. Se mostraron los textos guardados y las fechas; regreso por teclado conservó los tres valores de contexto. Móvil 390 × 844, scrollWidth 375, sin desbordamiento incluso con palabra larga. Aprobado. |

`npm run check` aprobado: lint, formato, tipos, **208 pruebas (107 web y 101 API)** y compilación. PostgreSQL sobre el árbol de trabajo: **112 ensayos generales**, más matrices CU01–CU06/AUTH en dos bases nuevas. Los ensayos generales incluyen cambios pendientes de AUTH T7; estos se excluyen del commit CU06.

Capturas fuera de Git: `C:/Users/user/Desktop/PsicologIA/cu06-consulta-desktop.png` y `C:/Users/user/Desktop/PsicologIA/cu06-consulta-movil.png`. Muestran exclusivamente datos ficticios. Viewport restaurado tras la comprobación.

## Fallos resueltos y límites

- Primer chequeo: faltaba declarar fichaRead en las opciones de createApp. Corregido y verificado por tipos/HTTP.
- Primera prueba de fechas esperaba año completo pero Intl con dateStyle short lo abreviaba. Se fijaron componentes explícitos con año numérico y zona America/Montevideo; pasó el ensayo de cambio de día.
- Primera matriz PostgreSQL esperaba null para un profesional vacío invocado directamente contra el repositorio. PostgreSQL rechaza el UUID vacío con 22P02; se corrigió el ensayo para exigir ese fallo cerrado y comprobar rollback/contexto posterior. No se relajó la validación del runtime ni la autorización.
- Revisión manual de escritorio/móvil limitada al flujo exitoso y navegación; errores y pérdida/cambio de acceso se verificaron automáticamente. Identidad y correo simulados, PostgreSQL real. AUTH T7 y correo real siguen pendientes.
- Sin CU07, migraciones, dependencias nuevas, permisos o escrituras remotas, pacientes reales, envíos, publicación o despliegue. La consulta usa el esquema privado y RLS existentes; referencia revisada: [RLS oficial](https://supabase.com/docs/guides/database/postgres/row-level-security). Changelog oficial consultado sin introducir cambios de proveedor.

La copia exacta del índice, excluyendo AUTH T7, también pasó PostgreSQL 17: 96 ensayos generales sobre dos bases vacías y matrices CU01–CU06/AUTH completas. El commit no depende de los cambios pendientes.
