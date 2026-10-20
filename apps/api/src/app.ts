import express, { type RequestHandler } from 'express';
import { pacienteRoutes, type PatientHandler } from './modules/pacientes/presentation/routes.js';
import { fichaRoutes } from './modules/fichas-clinicas/presentation/routes.js';
import type { FichaHandler } from './modules/fichas-clinicas/application/ficha.js';
import { sesionRoutes } from './modules/sesiones-clinicas/presentation/routes.js';
import type { SesionOperations } from './modules/sesiones-clinicas/application/sesiones.js';
export function createApp(
  options: {
    origins?: string[];
    register?: PatientHandler;
    list?: PatientHandler;
    profile?: PatientHandler;
    editLoad?: PatientHandler;
    editSave?: PatientHandler;
    fichaState?: FichaHandler;
    fichaRead?: FichaHandler;
    fichaEditLoad?: FichaHandler;
    fichaEditSave?: FichaHandler;
    fichaCreate?: FichaHandler;
    sesiones?: SesionOperations;
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
  const guard: RequestHandler =
    options.access?.guard ??
    ((_req, res) => {
      res.set('Cache-Control', 'no-store').status(401).json({ codigo: 'INGRESO_REQUERIDO' });
    });
  const unavailable = async () => ({ status: 503, body: { codigo: 'SESIONES_NO_CONFIGURADAS' } });
  app.use(
    '/api/sesiones-clinicas',
    guard,
    sesionRoutes(
      options.sesiones ?? {
        prepare: unavailable,
        register: unavailable,
        check: unavailable,
        history: unavailable,
        detail: unavailable,
        load: unavailable,
        save: unavailable,
      },
      options.origins,
    ),
  );
  app.use(
    '/api/pacientes',
    guard,
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
      options.origins,
    ),
  );
  app.use(
    '/api/fichas-clinicas',
    guard,
    fichaRoutes(
      options.fichaState ??
        (async () => ({ status: 503, body: { codigo: 'FICHA_NO_CONFIGURADA' } })),
      options.fichaCreate ??
        (async () => ({ status: 503, body: { codigo: 'FICHA_NO_CONFIGURADA' } })),
      options.fichaRead ??
        (async () => ({ status: 503, body: { codigo: 'FICHA_NO_CONFIGURADA' } })),
      options.fichaEditLoad ??
        (async () => ({ status: 503, body: { codigo: 'FICHA_NO_CONFIGURADA' } })),
      options.fichaEditSave ??
        (async () => ({ status: 503, body: { codigo: 'GUARDADO_NO_CONFIRMADO' } })),
      options.origins,
    ),
  );
  app.use('/api', (_req, res) => {
    res.set('Cache-Control', 'no-store').status(404).json({ codigo: 'RUTA_NO_DISPONIBLE' });
  });
  return app;
}
