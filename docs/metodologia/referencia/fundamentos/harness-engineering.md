# Harness engineering

## Derivado del curso

Un agente utiliza un modelo para encadenar decisiones y acciones orientadas a un objetivo. Puede leer, planificar, usar herramientas, editar y comprobar según sus permisos y bajo supervisión. El harness o arnés es el sistema que rodea al modelo y gestiona contexto, herramientas y ejecución. Los guardarraíles limitan acciones y validan resultados mediante permisos, aprobaciones y controles (D1, pp. 12 y 15).

La diferencia práctica respecto de una conversación simple es el ciclo de actuación y verificación. El curso organiza ese trabajo con instrucciones del proyecto, memoria breve, documentación, planificación, skills, MCP y pruebas (D1, pp. 16-19; D2, pp. 3-9). La responsabilidad del proyecto sigue siendo humana (D3, p. 10).

## Componentes y aplicación general (complemento)

| Componente | Pregunta que resuelve | Evidencia observable |
| --- | --- | --- |
| Objetivo y spec | ¿Qué resultado está autorizado? | Requisitos y aprobación de la revisión activa |
| Contexto | ¿Con qué información trabaja? | Rutas disponibles y fuentes identificadas |
| Herramientas | ¿Qué acciones puede ejecutar? | Inventario de capacidades reales |
| Permisos | ¿Dónde y con qué alcance actúa? | Restricciones del entorno comprobadas |
| Verificación | ¿Cómo se demuestra el resultado? | Tests, revisión y evidencia por requisito |
| Memoria y Git | ¿Qué queda entre sesiones? | Estado, decisiones y cambios versionados |

Un buen bucle: leer → proponer → obtener las aprobaciones necesarias → ejecutar una tarea → verificar → registrar → detenerse o continuar dentro del alcance autorizado. Si las pruebas fallan, no declarar terminada la tarea. Si aparece un nuevo requisito, volver a la spec.

Una instrucción «solo lectura» en un prompt no elimina permisos de escritura. Usar restricciones reales cuando estén disponibles y comprobarlas con una prueba inocua en un área desechable. No probar bloqueos con datos reales ni acciones destructivas.

## Guardarraíles proporcionales (complemento)

- Definir rutas editables, comandos de verificación y uso de red antes de implementar.
- Reservar aprobaciones específicas para cambios de alcance, migraciones, secretos, publicación, merge y despliegue según la política acordada.
- No pedir otra vez una autorización que ya cubre la acción y la revisión vigentes; registrar su alcance.
- Comprobar los efectos de un comando de tests: puede escribir archivos, acceder a red o modificar servicios.
- Fijar un límite de reparación. El ejemplo multiagente del curso permite dos vueltas de corrección y luego informa al usuario (D3, p. 6).

## Errores frecuentes

Confiar en un test que no se ejecutó; instalar una skill de terceros sin revisar sus scripts; conceder permisos globales por comodidad; confundir aprobación de un plan con permiso para desplegar. MCP aporta capacidades externas (D2, p. 7), pero su uso requiere revisar permisos, datos y credenciales en el entorno receptor.

Continúa con la [guía de implementación](../guia-implementacion-harness.md).
