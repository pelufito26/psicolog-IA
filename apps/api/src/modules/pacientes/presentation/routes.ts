import { localOrigins } from '../../../infrastructure/environment.js';
import express, { type ErrorRequestHandler } from 'express';
import type { RegistroHandler } from '../application/registrar.js';
export type PatientHandler = (input: unknown, professional?: string) => ReturnType<RegistroHandler>;
export function pacienteRoutes(
  register: PatientHandler,
  list: PatientHandler,
  profile: PatientHandler,
  editLoad: PatientHandler,
  editSave: PatientHandler,
  origins = localOrigins,
) {
  const router = express.Router();
  const route = (path: string, handler: PatientHandler) =>
    router.post(
      path,
      (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        const origin = req.get('origin');
        if (origin !== undefined && !origins.includes(origin)) {
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
        const result = await handler(req.body, res.locals.access?.professional);
        res.status(result.status).json(result.body);
      },
    );
  route('/', register);
  route('/consulta', list);
  route('/perfil', profile);
  route('/edicion', editLoad);
  route('/actualizar', editSave);
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
