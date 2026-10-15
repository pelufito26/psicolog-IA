import express, { type ErrorRequestHandler } from 'express';
import type { RegistroHandler } from '../application/registrar.js';
export function pacienteRoutes(register: RegistroHandler) {
  const router = express.Router();
  router.post(
    '/',
    (req, res, next) => {
      const origin = req.get('origin');
      if (
        origin !== undefined &&
        !['http://127.0.0.1:5173', 'http://localhost:5173'].includes(origin)
      ) {
        res.status(403).json({ codigo: 'ORIGEN_NO_PERMITIDO' });
        return;
      }
      if (!req.is('application/json')) {
        res.status(415).json({ codigo: 'TIPO_NO_PERMITIDO' });
        return;
      }
      next();
    },
    express.json({ limit: '16kb' }),
    async (req, res) => {
      const result = await register(req.body);
      res.status(result.status).json(result.body);
    },
  );
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
            : 'REGISTRO_NO_CONFIRMADO',
    });
  };
  router.use(errors);
  return router;
}
