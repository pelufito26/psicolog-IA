import express from 'express';
import type { RegistroHandler } from './modules/pacientes/application/registrar.js';
import { pacienteRoutes } from './modules/pacientes/presentation/routes.js';
export function createApp(options: { register?: RegistroHandler; list?: RegistroHandler } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  app.use(
    '/api/pacientes',
    pacienteRoutes(
      options.register ??
        (async () => ({ status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } })),
      options.list ??
        (async () => ({ status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } })),
    ),
  );
  return app;
}
