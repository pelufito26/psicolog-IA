import express from 'express';
import { createRuntime } from '../apps/api/src/runtime.js';

// One runtime/pool set per warm function instance. No connection during build.
const app = express();
app.disable('x-powered-by');
let runtime: ReturnType<typeof createRuntime> | undefined;
app.use((req, res, next) => {
  try {
    runtime ??= createRuntime(process.env);
    runtime.app(req, res, next);
  } catch {
    res.set('Cache-Control', 'no-store').status(503).json({ codigo: 'PILOTO_NO_CONFIGURADO' });
  }
});
export default app;
