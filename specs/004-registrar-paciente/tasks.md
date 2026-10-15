# Tareas CU01

Revisión: CU01-tasks-r1. Spec CU01-r1 aprobada. Plan CU01-plan-r1 aprobado.
Aprobación conjunta: el usuario respondió «si» al lote T1–T6, incluida la demo ficticia. Evidencia en validation.md.

- [x] T1 — Reglas y pruebas unitarias: calendario/Montevideo, nombres, teléfono y normalización. Hecho cuando los casos positivos y negativos pasan sin dependencias de frameworks.
- [x] T2 — Caso de uso, repositorio y confirmación. Depende de T1. Probar transacción, duplicados, token ligado al payload/profesional y fallos sin escritura.
- [x] T3 — Ruta y contexto local. Depende de T2. Integrar POST, configuración, origen/JSON/tamaño y cierre de pool. Probar rechazo de identidad del cliente y health independiente.
- [x] T4 — Formulario y estados. Depende del contrato T3. Validación por campo, envío único, advertencia, edición, confirmación, timeout y éxito accesibles.
- [x] T5 — Integración y demo. Depende de T3–T4. Ensayos PostgreSQL desechable y seed explícito. Aprobar el lote permite crear en Supabase de desarrollo un profesional ficticio y hasta dos pacientes ficticios para la demo, sin borrar ni modificar filas ajenas.
- [x] T6 — Verificación y documentación. Depende de T5. Navegador desktop/móvil, check y test:database; registrar evidencia por requisito, decisiones e instrucciones y cierre de 0E sin afirmar autenticación productiva.

Registrar evidencia y commits reales. Cambios de alcance requieren revisión. No publicar ni incorporar automáticamente.
