# Validación CU11

20 de octubre de 2026. CU11-r1 y plan/tareas r1 aprobados mediante «si». Implementación ficticia local; publicación de CU11 autorizada posteriormente mediante «muy bien, que sigue? vamo y vamo dale».

## Resultado y evidencia

Edición desde detalle de fecha/anotaciones propias. Versión HMAC sobre timestamp completo, bloqueo de fila y actualización atómica; sin dependencias, migraciones, permisos o configuración remota nuevos.

Base `c246d06d11a3f4ec91bd6478de7b0974d948f292` (PR13 incorporado), rama `feat/modificar-sesion`. Árbol funcional revisado: `bd1766b4d27b4c6463b021f01ce74f484eb4c172`. Delta de cierre solo documental.

| Requisitos | Evidencia                                                                                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1–R3      | `application/editar-sesion.test.ts` y `edit-client.test.ts`: carga/contrato, campos extra, identidades, versión ligada a profesional/paciente/sesión, errores públicos. Matrices PostgreSQL/HTTP: sesión ajena/inexistente/de otro paciente equivalentes.                         |
| R2         | Aplicación: sesión de 1900, calendario inválido/año cero/futuro, medianoche Montevideo al guardar, trim/texto literal/multilínea. UI sin max congelado.                                                                                                                           |
| R4–R5      | `scripts/database-tests/sesiones.mjs`: dos guardados concurrentes producen 200/409; precisión .123456/.123457; creación/identidades/relaciones/otras sesiones/pacientes/fichas intactos; error real 23514 revierte y contexto vacío.                                              |
| R5–R7      | `EditarSesion.test.tsx`: doble envío/salida bloqueada; conflicto conserva borrador; recarga confirmada/cancelada/fallida y versión nueva; resultado incierto consulta sin reenviar/atribuir éxito. Validación/413/404; fallo de detalle tras éxito conserva confirmación.         |
| R8         | UI historial página 2 → detalle → editar → detalle → historial reconsulta página 2. Manual: fecha movió sesión a página 1; listado conservó filtro Perfil, página 2 y texto sin aplicar.                                                                                          |
| R9         | Siete rutas HTTP con Origin, CSRF, JSON/413/no-store; AUTH con anónimo, contraseña pendiente, expiración, logout y dos profesionales. UI paciente/sesión/desmontaje/logout/expiración/cuenta descartan borrador/respuestas tardías. Etiquetas, foco, errores y teclado revisados. |
| R10        | PostgreSQL: alta original tras edición responde 409, sin duplicar/restaurar; lecturas/comprobación no escriben; nueva operación de contenido igual admitida. Regresión CU01–CU10.                                                                                                 |

`npm run check`: lint, formato, tipos, **363 pruebas (200 web + 163 API)** y builds correctos en working tree y snapshot sin AUTH T7. Node 24.21.0, dependencias locales existentes.

PostgreSQL 17 local: matrices CU01–CU11/AUTH correctas en dos bases vacías reproducibles. Working tree: 112 ensayos generales. Snapshot exacto del árbol funcional sin AUTH T7: **96 ensayos generales**, más matrices funcionales completas. Resultado completo inspeccionado; sin base remota. Snapshot de archivos del índice, con dependencias locales y API compilada del mismo código funcional.

## Navegación visual y limitaciones

Harness ficticio API :3001, buzón :3002, Vite :5173, todos loopback; base de demo nueva aislada. Sesión antigua de paciente sin ficha: notas multilínea/HTML literal, guardar con Enter, detalle persistido, creación conservada y modificación actualizada. Teclado cambió fecha 01/01/2000 → 01/02/2000, moviendo sesión desde página 2 al inicio; volver conservó página 2. Perfil/listado mantuvieron filtro/página/texto sin aplicar. Cancelar volvió al detalle sin escribir.

Capturas fuera de Git: `cu11-detalle-desktop.png` y `cu11-editor-desktop.png`, en carpeta de trabajo.

**Limitación inicial resuelta:** capacidad documentada solicitó 390×844, pero DOM/captura siguieron en 1280×720, incluso en pestaña nueva. Se restauró viewport y cerraron pestañas auxiliares. En el primer intento no se declaró validación visual móvil. Se conserva estilo adaptable y textarea al ancho disponible; revisión estática no sustituye esa comprobación.

Fallos resueltos:

- Prueba previa CU10 exigía ausencia de Editar: actualizada a CU11 manteniendo ausencia de Eliminar; siguiente check completo correcto.
- Vite conservó módulo nuevo sin exportación en caché; reinicio y recarga resolvieron página en blanco, con navegación posterior correcta.
- Demo anterior rechazó rol backend preexistente: se usó instancia nueva, sin borrar la anterior.
- `fill` del date cambió valor visible sin actualizar estado React: detectado leyendo persistencia; interacción nativa ArrowUp/Enter sí persistió y permitió verificar orden. No se declaró guardada una fecha que no ocurrió.

## Revisión independiente y alcance

`revisor_cu11`, sin contexto conversacional heredado y cumpliendo `.codex/agents/revisor.toml`, revisó base/árbol contra spec/plan/tareas: **sin hallazgos accionables P0–P3**. Incluyó acceso, trigger, HMAC preciso, bloqueo, conflictos/recuperación y navegación/pruebas. Solo lectura estática; sin pruebas ni modificaciones propias. Evidencia final y delta documental comunicados para cierre. No implica aprobación humana ni aptitud productiva.

No ejecutado: Supabase remoto, correo real, AUTH T7, despliegue o CI remota de esta rama al ejecutar las verificaciones locales. Solo datos ficticios. Cambios ajenos AUTH T7 excluidos del índice/commit; selección parcial de DECISIONS y exclusión de run.mjs.

Hallazgo documental P3 del cierre: T4 aparecia completa pese a movil pendiente. Se separo T4a (cierre local verificado y commit) de T4b (movil pendiente), manteniendo explicito el trabajo no ejecutado.

## Cierre móvil y publicación

En el siguiente turno se aplicó correctamente el viewport 390×844: DOM confirmó innerWidth 390, innerHeight 844 y scrollWidth 375, sin desbordamiento horizontal. Captura inspeccionada: campos/etiquetas y acciones legibles. Se guardaron notas ficticias desde móvil y se verificó confirmación más detalle persistido, fecha/creación conservadas y modificación actualizada. Capturas externas `cu11-editor-movil.png` y `cu11-detalle-movil.png`. Se restauró viewport y cerró buzón auxiliar. T4b completada; no cambia código funcional ni invalida las 363 pruebas/matrices anteriores.

La revisión documental P3 previa queda resuelta y la verificación móvil pendiente ya se realizó. El usuario autorizó avanzar con el PR de CU11; no incluye merge, despliegue ni cambios pendientes de AUTH.
