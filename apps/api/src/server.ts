import { createApp } from './app.js';

const server = createApp().listen(3001, '127.0.0.1', () => {
  console.log('API local: http://127.0.0.1:3001');
});
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(error.code === 'EADDRINUSE'
    ? 'El puerto 3001 está ocupado. Detené la instancia propia anterior o liberá ese puerto antes de reintentar.'
    : 'No se pudo iniciar la API local.');
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close());
}
