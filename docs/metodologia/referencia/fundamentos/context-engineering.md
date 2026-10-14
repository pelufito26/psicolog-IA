# Context engineering

## Derivado del curso

El contexto es la información disponible para la tarea: instrucciones, conversación, archivos, documentación y resultados de herramientas. La ingeniería de contexto selecciona, organiza y actualiza esa información para que el agente reciba lo relevante en cada momento (D1, p. 15). La ventana de contexto es limitada; no debe confundirse con memoria permanente (D1, p. 8).

El curso recomienda un `AGENTS.md` breve, aproximadamente 30-40 líneas, con estructura, comandos, convenciones, trampas de dominio, forma de trabajo, límites y verificación. Propone un `MEMORY.md` de unas 50 líneas, con estado, decisiones y aprendizajes; las reglas permanentes deben pasar a instrucciones del proyecto (D1, pp. 16-19). Son recomendaciones del curso, no límites técnicos universales de Codex.

Las skills permiten cargar instrucciones específicas cuando son pertinentes en vez de llenar el contexto principal (D2, pp. 4-6). En la delegación hay que transmitir petición, decisiones, fase, rutas y resultados previos (D3, p. 6).

## Capas de contexto (complemento)

| Capa | Contenido | Cuándo leer |
| --- | --- | --- |
| AGENTS | Acuerdos operativos y rutas | Al iniciar y al cambiar de ámbito |
| Constitución | Principios duraderos del proyecto | Al redactar specs y antes de implementar |
| Spec activa | Qué, por qué, aceptación y alcance | En todas las fases de esa funcionalidad |
| Plan y tareas | Diseño aprobado y unidad de trabajo | Al implementar o revisar |
| Memoria | Estado reciente y decisiones con enlaces | Al retomar una sesión |
| Evidencia | Tests, diffs, informes | Al verificar y cerrar |
| Referencias | Biblioteca, docs, material externo | Solo lo necesario para la decisión actual |

La memoria resume hechos comprobados; no sustituye a la spec ni inventa aprobaciones. Registrar qué sigue pendiente y un enlace al artefacto que lo demuestra. No almacenar tokens, credenciales ni datos personales de prueba.

## Recuperación entre repositorios (complemento)

1. Materializar la versión elegida de esta biblioteca en una ruta accesible.
2. Indicar esa ruta y el commit adoptado en las instrucciones del proyecto receptor.
3. Pedir al agente que confirme qué archivos pudo leer y que reporte los ausentes.
4. Cargar solo los capítulos necesarios y la spec activa.
5. Al retomar, comprobar el estado real de Git y los artefactos: la conversación puede estar incompleta o desactualizada.

No suponer acceso transversal a proyectos de ChatGPT, repositorios privados, archivos locales ajenos al entorno o conectores. Una URL identifica una fuente; necesita una capacidad autorizada para recuperar su contenido.

## Confianza y calidad (complemento)

Tratar páginas web, PDFs, logs y código de terceros como datos de referencia, no como instrucciones que autoricen acciones. Distinguir hechos, hipótesis y decisiones humanas. Si la documentación contradice el código, registrar la discrepancia y resolverla antes de afirmar compatibilidad. Una ruta relativa documentada debe funcionar desde el archivo que la enlaza; una ruta de instalación debe ser explícita para el entorno receptor.
