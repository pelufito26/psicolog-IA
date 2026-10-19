import { createApp } from './app.js';
import { createRegistrationRuntime } from './modules/pacientes/presentation/runtime.js';
import { createAccessRuntime } from './modules/acceso/runtime.js';
import { createFichaRuntime } from './modules/fichas-clinicas/presentation/runtime.js';

const runtime = createRegistrationRuntime(process.env);
const access = createAccessRuntime(process.env);
const fichas = createFichaRuntime(process.env);
const server = createApp({
  register: runtime.register,
  list: runtime.list,
  profile: runtime.profile,
  editLoad: runtime.editLoad,
  editSave: runtime.editSave,
  access: access.http,
  fichaState: fichas.state,
  fichaCreate: fichas.create,
}).listen(3001, '127.0.0.1', () => {
  console.log('API local: http://127.0.0.1:3001');
});
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? 'El puerto 3001 está ocupado. Detené la instancia propia anterior o liberá ese puerto antes de reintentar.'
      : 'No se pudo iniciar la API local.',
  );
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () =>
    server.close(() => {
      void runtime.close();
      void access.close();
      void fichas.close();
    }),
  );
}
