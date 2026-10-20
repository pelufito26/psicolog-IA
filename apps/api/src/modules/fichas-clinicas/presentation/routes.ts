import { localOrigins } from '../../../infrastructure/environment.js';
import express, { type ErrorRequestHandler } from 'express';
import type { FichaHandler } from '../application/ficha.js';
export function fichaRoutes(
  state: FichaHandler,
  create: FichaHandler,
  read: FichaHandler,
  editLoad: FichaHandler,
  editSave: FichaHandler,
  origins = localOrigins,
) {
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
  for (const [path, handler] of [
    ['/estado', state],
    ['/consultar', read],
    ['/crear', create],
    ['/edicion', editLoad],
    ['/actualizar', editSave],
  ] as const)
    router.post(path, async (req, res) => {
      try {
        const result = await handler(req.body, res.locals.access?.professional);
        res.status(result.status).json(result.body);
      } catch {
        res.status(503).json({ codigo: 'FICHA_NO_DISPONIBLE' });
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
            : 'FICHA_NO_DISPONIBLE',
    });
  };
  router.use(errors);
  return router;
}
