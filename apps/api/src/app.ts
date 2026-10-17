import express, { type RequestHandler } from 'express';
import { pacienteRoutes, type PatientHandler } from './modules/pacientes/presentation/routes.js';
export function createApp(
  options: {
    register?: PatientHandler;
    list?: PatientHandler;
    profile?: PatientHandler;
    editLoad?: PatientHandler;
    editSave?: PatientHandler;
    access?: { router: express.Router; guard: RequestHandler };
  } = {},
) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  if (options.access) app.use('/api/acceso', options.access.router);
  else
    app.use('/api/acceso', (_req, res) =>
      res.status(503).json({ codigo: 'ACCESO_NO_CONFIGURADO' }),
    );
  app.use(
    '/api/pacientes',
    options.access?.guard ??
      ((_req, res) => {
        res.status(401).json({ codigo: 'INGRESO_REQUERIDO' });
      }),
    pacienteRoutes(
      options.register ??
        (async () => ({ status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } })),
      options.list ??
        (async () => ({ status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } })),
      options.profile ?? (async () => ({ status: 503, body: { codigo: 'PERFIL_NO_DISPONIBLE' } })),
      options.editLoad ??
        (async () => ({ status: 503, body: { codigo: 'EDICION_NO_DISPONIBLE' } })),
      options.editSave ??
        (async () => ({ status: 503, body: { codigo: 'GUARDADO_NO_CONFIRMADO' } })),
    ),
  );
  return app;
}
