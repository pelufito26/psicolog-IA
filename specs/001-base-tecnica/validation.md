# Evidencia de 0B

Fecha: 14 de octubre de 2026. Spec: 0B-r1; plan: 0B-plan-r1; tareas: 0B-tasks-r1.
Runtime: Node 24.21.0 aislado; npm 11.13.0. No se cambió el runtime global.

| Requisitos | Evidencia y resultado |
|---|---|
| RF-01, RNF-01 | Copia limpia sin node_modules ni dist: npm ci completado, 175 paquetes instalados y auditoría sin vulnerabilidades informadas |
| RF-02, RNF-06 | Pruebas de renderizado y navegador: identidad, preparación y estado legibles; revisión visual sin cortes en viewport disponible |
| RF-03 | Prueba HTTP de Express: 200, content-type JSON y cuerpo exacto {"status":"ok"} |
| RF-04 | Prueba de transición y navegador con API compilada activa: «API disponible» |
| RF-05 | Pruebas de red, HTTP 503, JSON inválido, objeto inesperado y null; navegador con API apagada: mensaje de disponibilidad no confirmada conservando pantalla |
| RF-06 | Temporizadores controlados: termina a cinco segundos incluso si fetch ignora abort; cancelación y limpieza verificadas, sin solicitud con señal previamente abortada; desmontaje no actualiza pantalla |
| RF-07 | npm run typecheck y npm run build: ambos workspaces pasan; repetidos desde copia limpia |
| RF-08 | Backend compilado ejecutado localmente: pantalla recibe y valida su respuesta a través del proxy |
| RNF-02–05 | Sin variables secretas, datos clínicos, conexión externa de aplicación o dependencia de Supabase; bind y proxy de loopback; frontend independiente del código API; dist/node_modules excluidos |
| RNF-07 | 13 pruebas pasan (12 web, 1 API), revisión visual y comprobaciones anteriores documentadas |

Pruebas iniciales con contratos vacíos: ocho fallos en cliente y tres en interfaz por comportamiento ausente; API respondió 404 en lugar de 200 antes de añadir la ruta. Los fallos iniciales de imports ausentes y la restricción de red del sandbox no se consideran evidencia de comportamiento. La prueba HTTP se repitió con autorización técnica y entonces confirmó el 404 esperado antes de implementar.

La primera instalación mediante npm.cmd tomó Node global 24.16.0 y mostró aviso de motor. El ensayo limpio se ejecutó con Node aislado explícito y completó npm ci, pruebas, tipos y build sin ese aviso. Los scripts y dependencias de aplicación no dependen de la carpeta del runtime aislado.

Límites: no prueba aislamiento entre profesionales, base de datos, seguridad clínica, CI ni despliegue. La revisión visual cubre el viewport del navegador disponible, no una matriz de dispositivos. Los archivos compilados requieren la configuración local documentada. No se ha publicado esta etapa.
