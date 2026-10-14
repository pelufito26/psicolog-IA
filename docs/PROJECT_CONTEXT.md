# PsicologIA — Contexto maestro para Codex Desktop

**Estado:** Documento de transferencia inicial, 14 de octubre de 2026  
**Repositorio del producto:** https://github.com/pelufito26/psicolog-IA  
**Repositorio metodológico de referencia:** https://github.com/pelufito26/desarrollo-ia-metodologia  
**Destino recomendado:** `docs/PROJECT_CONTEXT.md`

> **Regla de interpretación:** Este documento reúne las decisiones confirmadas durante el análisis de PsicologIA. No reemplaza los textos completos de los casos de uso cuando estén disponibles. Ante omisiones o contradicciones, **no inventar reglas**: señalar la cuestión y solicitar validación. No implementar código hasta recibir autorización explícita.

## 1. Propósito del producto

PsicologIA es una aplicación web orientada a profesionales de psicología para administrar pacientes, sus fichas clínicas y el seguimiento de la atención mediante registros de sesiones. El MVP prioriza una gestión clínica estructurada y sencilla. El proyecto se construirá incrementalmente y se utilizarán herramientas de desarrollo asistido por IA, especialmente Codex.

### Dentro del alcance del MVP
- Alta, consulta y modificación de datos de pacientes.
- Creación, consulta y actualización de una ficha clínica por paciente.
- Registro, consulta y modificación de sesiones clínicas; historial cronológico por paciente.
- Diseño preparado para múltiples profesionales, aunque la autenticación y administración real de cuentas se difieren.

### Fuera del alcance inicial
- Agenda, turnos, recordatorios, facturación y cobros.
- Automatización de decisiones clínicas mediante IA.
- Eliminación permanente de datos y versionado completo de fichas o sesiones.
- Registro/autenticación productiva, gestión de roles y panel administrativo funcional en la primera etapa.
- Reasignación de pacientes entre profesionales.

**Restricción crítica:** Hasta implementar y verificar autenticación y autorización reales, trabajar exclusivamente con **datos ficticios**, sin exposición pública de operaciones o información clínica. No cargar datos reales de pacientes en el prototipo.

## 2. Casos de uso acordados

| ID | Nombre | Alcance funcional confirmado |
|---|---|---|
| CU01 | Registrar paciente | Nombre, apellido, fecha de nacimiento y teléfono obligatorios; detectar posibles duplicados y advertir, permitiendo continuar bajo confirmación explícita. |
| CU02 | Consultar listado de pacientes | Listado del profesional, ordenado por apellido; búsqueda por nombre o apellido; mostrar nombre, apellido, edad calculada y teléfono. |
| CU03 | Consultar perfil de paciente | Mostrar datos personales y accesos a ficha clínica y sesiones. |
| CU04 | Modificar datos de paciente | Actualizar datos personales permitidos; no cambiar profesional responsable en MVP. |
| CU05 | Crear ficha clínica | Una ficha como máximo por paciente; motivo de consulta obligatorio; campos separados para antecedentes personales, antecedentes familiares, medicación, evaluación clínica y observaciones generales. |
| CU06 | Consultar ficha clínica | Acceso a ficha del paciente por el profesional responsable. |
| CU07 | Actualizar ficha clínica | Editar campos de la ficha sin modificar sesiones; actualizar fecha de última modificación. |
| CU08 | Registrar sesión clínica | Fecha de sesión y anotaciones clínicas obligatorias; fecha actual o anterior, nunca futura; admitir registro retroactivo y varias sesiones en una misma fecha. |
| CU09 | Consultar historial de sesiones | Mostrar fecha de sesión y profesional responsable; orden descendente por fecha de sesión. |
| CU10 | Consultar detalle de sesión | Consultar el registro de una sesión del paciente. |
| CU11 | Modificar registro de sesión | Editar fecha y anotaciones sin límite de antigüedad; sobrescribir los valores en MVP, dejando preparada una evolución futura hacia versiones. |

**Importante:** Esta tabla es un resumen verificable de decisiones, **no** una especificación completa de flujos principales, alternativos y de excepción. Recuperar los documentos originales de CU01–CU11 antes de convertir estos resúmenes en criterios de aceptación exhaustivos.

## 3. Modelo de dominio v1.0

### 3.1 Profesional
- `idProfesional`: identificador único.
- `nombre`: obligatorio.
- `apellido`: obligatorio.
- `email`: obligatorio, único globalmente; comparación insensible a mayúsculas/minúsculas y tras quitar espacios periféricos.
- `fechaCreacion`: automática, inmutable.
- `fechaUltimaModificacion`: automática al crear y actualizar.

### 3.2 Paciente
- `idPaciente`: identificador único.
- `nombre`: obligatorio.
- `apellido`: obligatorio.
- `fechaNacimiento`: obligatoria, no futura.
- `telefono`: obligatorio, con formato válido.
- `profesionalResponsable`: referencia obligatoria a un único profesional; inmutable en el MVP.
- `fechaCreacion`: automática.
- `fechaUltimaModificacion`: automática al crear y actualizar.
- **Edad:** valor derivado de `fechaNacimiento`; no persistir.
- **Posibles duplicados:** detectar por nombre, apellido y fecha de nacimiento normalizados (mayúsculas, acentos y espacios); mostrar advertencia, pero permitir continuar tras confirmación.
- Puede existir sin ficha clínica y sin sesiones.

### 3.3 FichaClinica
- `idFichaClinica`: identificador único.
- `paciente`: referencia obligatoria.
- `motivoConsulta`: obligatorio y no vacío.
- `antecedentesPersonales`: opcional.
- `antecedentesFamiliares`: opcional.
- `medicacion`: opcional.
- `evaluacionClinica`: opcional.
- `observacionesGenerales`: opcional.
- `fechaCreacion`: automática.
- `fechaUltimaModificacion`: automática al crear y actualizar.
- Máximo **una** ficha por paciente.
- El profesional se determina indirectamente a través del paciente; no añadir una referencia redundante a Profesional sin nueva decisión aprobada.

### 3.4 SesionClinica
- `idSesionClinica`: identificador único.
- `paciente`: referencia obligatoria.
- `profesionalResponsable`: referencia obligatoria; debe coincidir siempre con el profesional responsable del paciente.
- `fechaSesion`: obligatoria, hoy o fecha pasada, nunca futura.
- `anotacionesClinicas`: obligatorias y no vacías.
- `fechaCreacion`: automática.
- `fechaUltimaModificacion`: automática al crear y actualizar.
- Un paciente puede tener múltiples sesiones, incluso en la misma fecha.
- La sesión puede registrarse retroactivamente y sin ficha clínica previa.
- La edición permite cambiar fecha y anotaciones, sin límite de antigüedad; no permite cambiar identidad de sesión ni paciente. Se sobrescriben los valores existentes en el MVP.

### 3.5 Relaciones y cardinalidades
- `Profesional (1) → (0..N) Paciente`; cada paciente pertenece exactamente a un profesional.
- `Paciente (1) → (0..1) FichaClinica`.
- `Paciente (1) → (0..N) SesionClinica`.
- `Profesional (1) → (0..N) SesionClinica`, con igualdad obligatoria respecto del profesional asignado al paciente.

## 4. Reglas de negocio confirmadas

- **RN-MD-01:** Cada paciente tiene exactamente un profesional responsable.
- **RN-MD-02:** El profesional de cada sesión debe coincidir con el profesional responsable del paciente.
- **RN-MD-03:** El paciente registra fechas automáticas de creación y última modificación.
- **RN-MD-04:** Paciente, FichaClinica y SesionClinica mantienen fechas de creación y modificación automáticas.
- **RN-MD-05:** Máximo una ficha clínica por paciente.
- **RN-MD-06:** Se permiten múltiples sesiones del mismo paciente en una misma fecha.
- **RN-MD-07:** Profesional registra fechas automáticas de creación y modificación.
- **RN-MD-08:** El email de Profesional es único globalmente con normalización acordada.
- **RN-MD-09:** No se permite reasignar pacientes a otro profesional en el MVP.
- **RN-MD-10:** El administrador no tiene acceso a datos de pacientes, incluidos datos personales, fichas y sesiones.
- **RN-MD-11:** La relación FichaClinica–Profesional se obtiene indirectamente a través de Paciente.

**Reglas adicionales de CU:** Validaciones obligatorias, fecha no futura, duplicados advertidos pero permitidos, sesiones retroactivas, edición de sesiones sin límite y orden descendente del historial, según sección 2.

## 5. Seguridad y privacidad

- Cada profesional solo puede acceder a sus propios pacientes y a la información clínica asociada.
- El administrador puede administrar profesionales y configuración general **en una fase futura**, pero no puede consultar datos personales ni clínicos de pacientes.
- La separación de datos y autorización debe verificarse en el backend y, cuando corresponda, mediante políticas de base de datos; **no basta** ocultar elementos de interfaz.
- No colocar claves privilegiadas de Supabase en el frontend ni versionar secretos.
- No usar datos clínicos reales durante el prototipado sin revisar previamente controles de acceso, cumplimiento normativo aplicable, contratos, respaldos, auditoría y seguridad operativa.
- El diseño debe prever autenticación y autorización posteriores, sin fingir que ya existen.

## 6. Decisiones arquitectónicas aprobadas

### ARQ-01 — Monolito modular
- Organización por módulos funcionales: `pacientes`, `fichas-clinicas`, `sesiones-clinicas`, `profesionales`.
- Separación interna por responsabilidades: presentación, aplicación, dominio e infraestructura.
- El dominio no depende de Express, React, Supabase ni mecanismos de persistencia concretos.
- La capa de aplicación orquesta casos de uso; infraestructura implementa repositorios y servicios externos.
- Evitar acoplar módulos a detalles internos de otros módulos; usar contratos explícitos.

### ARQ-02 — Persistencia real desacoplada
- PostgreSQL gestionado por Supabase desde las primeras iteraciones, inicialmente con plan gratuito.
- Repositorios/interfaces para aislar la persistencia de la lógica de negocio.
- Preparar migraciones versionadas.
- Autenticación real pospuesta; prototipo únicamente con datos ficticios.

### ARQ-03 — Stack técnico
- **Frontend:** React + Vite + TypeScript.
- **Backend:** Node.js + Express + TypeScript.
- **Base de datos:** Supabase PostgreSQL.
- **Pruebas:** Vitest.
- **Calidad:** ESLint y Prettier.
- **Versionado:** Git y GitHub.
- **CI/CD:** GitHub Actions, comenzando por lint y pruebas.
- **Desarrollo asistido por IA:** Codex y `AGENTS.md`.
- No incorporar Redux, microservicios ni Kubernetes en la primera etapa sin una justificación y aprobación nuevas.

### Estructura inicial propuesta, aún no implementada

```text
psicolog-IA/
├── AGENTS.md
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── supabase/
│   └── migrations/
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── PRODUCT.md
│   ├── USE_CASES.md
│   ├── DOMAIN.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── SECURITY.md
│   └── DEVELOPMENT_WORKFLOW.md
└── .github/
    └── workflows/
```

Esta estructura es **propuesta de organización**, no un mandato de crear archivos vacíos ni de implementar funcionalidades prematuramente.

## 7. Estrategia de desarrollo incremental

- **Iteración 0 — Fundación:** estructura de repositorio, frontend/backend iniciales, conexión segura a Supabase, esquema/migraciones, pruebas básicas, lint/formato y CI.
- **Iteración 1 — CU01:** registrar paciente de extremo a extremo.
- **Iteración 2 — CU02–CU04:** listado, perfil y modificación.
- **Iteración 3 — CU05–CU07:** ficha clínica.
- **Iteración 4 — CU08–CU11:** sesiones e historial.
- **Iteración 5 — Integración:** pruebas de flujos, validaciones y revisión del MVP.

Las iteraciones son un plan inicial, sujeto a revisión antes de implementar.

## 8. Harness engineering y Codex

El repositorio `desarrollo-ia-metodologia` es una **referencia metodológica**, no una dependencia de ejecución. Codex debe revisar su contenido real, identificar prácticas relevantes y proponer su adopción para PsicologIA. **No afirmar que ya se revisó ni copiarlo indiscriminadamente.** Si Codex no puede acceder al repositorio, debe comunicarlo y solicitar una copia o acceso.

Principios del harness:
1. `AGENTS.md` debe ser breve y servir de entrada a la documentación, no duplicarla completa.
2. La documentación aprobada y versionada es la fuente de verdad; las conversaciones son insumos de análisis.
3. Antes de implementar un CU, consultar su especificación, dominio, reglas de negocio, arquitectura y seguridad.
4. Toda implementación debe incluir criterios de aceptación verificables y pruebas apropiadas.
5. Distinguir decisiones aprobadas, propuestas y preguntas abiertas; registrar nuevas decisiones aprobadas.
6. Trabajar en cambios pequeños y revisables; preferir ramas y pull requests.
7. No añadir dependencias, abstracciones o agentes/subagentes sin una necesidad concreta.
8. No asumir que Codex recuerda conversaciones de ChatGPT ni que tiene acceso automático a otros repositorios.

## 9. Cuestiones abiertas: NO decidir unilateralmente

- Recuperar y verificar el texto completo de los 11 casos de uso (flujos principales, alternativos, excepciones y criterios de aceptación).
- Definir esquema relacional definitivo: nombres de tablas y columnas, tipos, índices, restricciones, estrategia de IDs y migraciones.
- Definir el mecanismo concreto de acceso del backend a Supabase y sus credenciales, sin exponer secretos.
- Precisar el diseño de autenticación, autorización y administración para una fase posterior; establecer cómo se simulará de forma segura el profesional actual durante el prototipo.
- Definir reglas concretas de validación de teléfonos y comportamiento exacto de normalización para duplicados.
- Determinar desempate estable de sesiones que comparten `fechaSesion`; **propuesta no confirmada:** `fechaCreacion` descendente y luego identificador.
- Definir convenciones de API, gestión de errores, configuración de entornos, política de respaldos y despliegue cuando corresponda.
- Revisar la metodología real de `desarrollo-ia-metodologia` antes de adoptar instrucciones específicas.

## 10. Primera tarea recomendada para Codex Desktop

1. Abrir el repositorio `pelufito26/psicolog-IA`.
2. Leer este documento íntegramente.
3. Inspeccionar el estado actual del repositorio y, si existe acceso, el repositorio metodológico de referencia.
4. Proponer un `AGENTS.md` y una estructura documental mínima, evitando duplicación de contenido.
5. Detectar información faltante, conflictos y decisiones que requieren aprobación.
6. Proponer el plan de la Iteración 0 con pasos pequeños y pruebas.
7. **No implementar código ni modificar el esquema de datos hasta obtener aprobación.**

### Prompt inicial sugerido

> Leé `docs/PROJECT_CONTEXT.md` y revisá el repositorio actual. Si tenés acceso, estudiá `https://github.com/pelufito26/desarrollo-ia-metodologia` y proponé qué prácticas de harness engineering conviene incorporar. Prepará una propuesta de `AGENTS.md`, documentación y plan de Iteración 0. Separá decisiones confirmadas de pendientes. No escribas código ni implementes funcionalidades todavía: primero mostrame el plan para aprobarlo.

---

**Control de cambios:** Este documento consolida decisiones existentes y debe actualizarse cuando se aprueben nuevas decisiones. Los detalles no documentados no deben tratarse como requisitos confirmados.
