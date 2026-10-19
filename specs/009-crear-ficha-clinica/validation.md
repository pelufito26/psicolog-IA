# Validación CU05

Implementación local de CU05-r1 y CU05-plan-r1, aprobadas. Datos exclusivamente ficticios.

- `npm run check`: aprobado; lint, formato, tipos, 181 pruebas (87 web y 94 API) y compilación.
- PostgreSQL 17 local: dos bases nuevas; 112 aserciones generales y matrices CU01–CU05/AUTH aprobadas sobre el árbol de trabajo. Incluye pruebas pendientes de AUTH T7, que se excluyen del commit CU05.
- Dominio/API: motivo obligatorio y cinco optativos; rechazo de campos extra; sesión, CSRF y Origin; respuestas sin contenido clínico; ausencia y paciente ajeno indistinguibles.
- Persistencia real: creación concurrente produce una ficha y un conflicto; reintentos no sobrescriben; texto multilínea conservado, optativos vacíos a NULL, relaciones intactas, rollback y contexto por profesional aislado.
- Interfaz: validación conserva borrador; doble envío bloqueado; error incierto requiere comprobar estado antes de reintentar; expiración/cambio de cuenta descartan respuestas tardías.
- Navegador local: creación con solo motivo, cancelación sin guardar, conflicto desde segunda pestaña sin sobrescritura y retorno con filtro, texto sin aplicar y página 2 conservados. Teclado y móvil de 390 × 844 verificados, sin desbordamiento horizontal.
- Evidencia visual fuera del repositorio: `cu05-formulario-desktop.png`, `cu05-formulario-movil.png`, `cu05-conflicto-movil.png` y `cu05-ficha-creada.png`, en la carpeta local PsicologIA.

Durante la comprobación se corrigió un error de tipos en la unión discriminada de resultados del repositorio. La verificación final pasó.

Límites: JSON de hasta 16 KiB, texto plano; consulta del contenido (CU06) y actualización (CU07) quedan fuera. Encontrar una ficha tras una respuesta incierta no confirma que ese borrador haya sido guardado. Correo simulado; sin envío real, nuevas migraciones, permisos remotos, publicación ni despliegue.

La copia exacta del índice, excluyendo AUTH T7, también pasó PostgreSQL 17: 96 ensayos generales sobre dos bases vacías y todas las matrices CU01–CU05/AUTH. Se verificó el aislamiento del commit sin depender de los cambios pendientes.
