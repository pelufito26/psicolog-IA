# Ejemplo didáctico: validar una cantidad

**Complemento:** ejemplo propio para mostrar el método, no tomado del Diario de Estudio. No es una spec aprobada ni evidencia de pruebas ejecutadas.

## Spec ilustrativa

Objetivo: evitar registrar cantidades inválidas en un formulario. Actor: persona que registra una cantidad.

- RF-1: CUANDO la persona confirma una cantidad entera entre 1 y 99, EL SISTEMA muestra esa cantidad en el resumen.
- RF-2: SI la cantidad está vacía o no es un entero entre 1 y 99, ENTONCES EL SISTEMA muestra «Introduce un entero entre 1 y 99» sin modificar el resumen previo.
- RNF-1: El control de cantidad y la acción de confirmar pueden operarse con teclado y tienen nombres accesibles.

Casos límite: 0, 1, 99, 100, decimal, vacío, texto no numérico; repetir envío inválido después de uno válido. Fuera de alcance: persistencia y sincronización. Cierre: requisitos demostrados, sin errores de consola en el flujo, revisión humana del resultado.

## Plan y tareas ilustrativos

Separar validación de entrada y actualización de interfaz. Usar el runner y componentes existentes del proyecto. Decisión: validar también al confirmar; la validación visual inmediata no basta para proteger el estado. Alternativa descartada: confiar solo en restricciones HTML.

- T1: lógica de validación y tests de límites; RF-1/RF-2. Hecho cuando cada entrada se clasifica según la spec.
- T2: integrar formulario y mensaje; depende de T1; RF-1/RF-2/RNF-1. Hecho cuando el resumen previo se conserva ante error y el flujo funciona con teclado.

## Matriz ilustrativa

| Requisito | Tarea | Verificación prevista | Estado |
| --- | --- | --- | --- |
| RF-1 | T1/T2 | Casos 1 y 99; envío válido actualiza resumen | No ejecutado |
| RF-2 | T1/T2 | Casos inválidos; resumen previo conservado y mensaje exacto | No ejecutado |
| RNF-1 | T2 | Navegación con teclado y revisión de nombres accesibles | No ejecutado |

Para una ejecución real faltan constitución del proyecto, aprobación de spec, aprobación de plan/tareas y evidencia de la revisión de código. El agente no debe convertir este ejemplo en autorizaciones ni resultados de tests.
