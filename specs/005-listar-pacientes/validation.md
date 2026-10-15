# Validación CU02

15 de octubre de 2026 · CU02-r1 y CU02-plan-r1/CU02-tasks-r1 aprobados · Rama feat/cu02-listar-pacientes.

| Requisitos | Evidencia ejecutada                                                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1, R8     | PostgreSQL desechable: dos profesionales con pacientes y uno vacío; ningún resultado ajeno, contexto inexistente rechazado. API: contexto/producción, Origin, JSON, tamaño y no-store. Proyección sin nacimiento ni profesional.                                                                         |
| R2–R5      | listar.test.ts: años cumplidos, 29/2, búsqueda normalizada/literal, orden por claves e ID, 21 registros y página fuera de rango. PostgreSQL confirma edad en Montevideo, orden, 20+1 resultados y coincidencia literal `%_`.                                                                             |
| R6–R7      | Pacientes.test.tsx: búsqueda enviada, filtro/página, limpieza, error/reintento, vacíos y respuesta tardía ignorada; cancelar y guardar vuelven al listado con nueva consulta. list-client.test.ts: búsqueda en JSON, no-cache, señal de cancelación y rechazo de respuestas inválidas.                   |
| R6–R8      | Navegador local: búsqueda «demo» devuelve los dos Paciente Demo de 26 años; abrir Registrar y cancelar conserva el filtro y actualiza. Desktop y viewport 390×844: tabla legible, scrollWidth 375 ≤ innerWidth 390. Capturas cu02-listado.jpg y cu02-movil.jpg fuera de Git, en la carpeta del proyecto. |

Controles: npm run check satisfactorio (lint, formato, tipos, 28 pruebas web + 45 API = 73, build). PostgreSQL 17 portátil satisfactorio en dos bases nuevas: 96 ensayos previos más escenarios CU01/CU02. CI conserva el mismo runner; ejecución remota de esta rama pendiente hasta publicación autorizada.

Fallos corregidos: formato necesitó una segunda pasada; TypeScript detectó una opción de selector de test incorrecta. pg advirtió consultas simultáneas durante la inicialización del rol de pruebas; ambos fixtures usan ahora onConnect asíncrono, esperado por el pool, y el ensayo pasó sin advertencia. Para la demo se identificó y reinició exclusivamente la API propia anterior; Vite existente se reutilizó.

Demo remota solo de lectura; no se crearon ni modificaron pacientes, profesionales, esquema, credenciales o permisos. Había registros adicionales cargados después de CU01; se conservaron y no se incluyeron en capturas compartidas. Alta/regreso se ensaya con servicio simulado; no se repitió un alta real en esta etapa. La paginación de varias páginas se prueba en PostgreSQL desechable y UI, no creando filas remotas.

Límites: contexto fijo de desarrollo, sin autenticación productiva; búsqueda/orden/paginación en memoria tras SELECT limitado al profesional, adecuado al prototipo y sin garantía de escala. No perfil ni edición. Timeout de lectura a 12 s por AbortSignal; no se hizo ensayo cronometrado de red real. No se probó con lector de pantalla ni dispositivo móvil físico. No se publicó la rama ni se abrió PR.
