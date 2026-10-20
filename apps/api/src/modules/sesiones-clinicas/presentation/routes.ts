import { localOrigins } from '../../../infrastructure/environment.js';
import express, { type ErrorRequestHandler } from 'express';
import type { SesionOperations } from '../application/sesiones.js';
export function sesionRoutes(operations: SesionOperations, origins = localOrigins) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!origins.includes(req.get('origin') ?? '')) {
      res.status(403).json({ codigo: 'ORIGEN_NO_PERMITIDO' });
      return;
    }
    if (!req.is('application/json')) {
      res.status(415).json({ codigo: 'TIPO_NO_PERMITIDO' });
      return;
    }
    next();
  });
  router.use(express.json({ limit: '16kb' }));
  for (const [path, key] of [
    ['preparar', 'prepare'],
    ['registrar', 'register'],
    ['comprobar', 'check'],
    ['historial', 'history'],
    ['detalle', 'detail'],
    ['edicion', 'load'],
    ['actualizar', 'save'],
  ] as const)
    router.post('/' + path, async (req, res) => {
      try {
        const r = await operations[key](req.body, res.locals.access?.professional);
        res.status(r.status).json(r.body);
      } catch {
        res.status(503).json({
          codigo:
            key === 'save'
              ? 'GUARDADO_NO_CONFIRMADO'
              : key === 'register'
                ? 'REGISTRO_NO_CONFIRMADO'
                : 'SESIONES_NO_DISPONIBLES',
        });
      }
    });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next;
    const status =
      error?.type === 'entity.too.large' ? 413 : error?.type === 'entity.parse.failed' ? 400 : 503;
    res.status(status).json({
      codigo:
        status === 413
          ? 'CARGA_EXCESIVA'
          : status === 400
            ? 'JSON_INVALIDO'
            : 'SESIONES_NO_DISPONIBLES',
    });
  };
  router.use(errors);
  return router;
}
