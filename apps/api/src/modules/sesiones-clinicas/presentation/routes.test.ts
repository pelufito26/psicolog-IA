import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createApp } from '../../../app.js';
import { createSesionRuntime } from './runtime.js';
let server: Server, base: string;
const handler = vi.fn(async () => ({ status: 200, body: { ok: true } }));
beforeEach(async () => {
  handler.mockClear();
  server = createApp({
    sesiones: {
      prepare: handler,
      register: handler,
      check: handler,
      history: handler,
      detail: handler,
      load: handler,
      save: handler,
    },
    access: {
      router: express.Router(),
      guard: (_q, r, next) => {
        r.locals.access = { professional: 'prof' };
        next();
      },
    },
  }).listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  const a = server.address();
  if (!a || typeof a === 'string') throw new Error();
  base = 'http://127.0.0.1:' + a.port;
});
afterEach(
  () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
);
test.each(['preparar', 'registrar', 'comprobar', 'historial', 'detalle', 'edicion', 'actualizar'])(
  'ruta %s conserva protecciones y no-store',
  async (path) => {
    for (const [origin, type, body, status] of [
      ['http://127.0.0.1:5173', 'application/json', '{}', 200],
      ['https://otro.invalid', 'application/json', '{}', 403],
      ['http://127.0.0.1:5173', 'text/plain', '{}', 415],
      ['http://127.0.0.1:5173', 'application/json', '{', 400],
      [
        'http://127.0.0.1:5173',
        'application/json',
        JSON.stringify({ anotacionesClinicas: 'x'.repeat(17000) }),
        413,
      ],
    ] as const) {
      const r = await fetch(base + '/api/sesiones-clinicas/' + path, {
        method: 'POST',
        headers: { origin, 'content-type': type },
        body,
      });
      expect(r.status).toBe(status);
      expect(r.headers.get('cache-control')).toBe('no-store');
    }
    expect(handler).toHaveBeenCalledWith({}, 'prof');
  },
);
test('runtime sin contexto/conexión o producción falla cerrado', async () => {
  for (const env of [{}, { NODE_ENV: 'production' }]) {
    const r = createSesionRuntime(env);
    for (const key of [
      'prepare',
      'register',
      'check',
      'history',
      'detail',
      'load',
      'save',
    ] as const) {
      expect((await r.operations[key]({})).status).toBe(503);
      expect((await r.operations[key]({}, '12345678-1234-4234-8234-123456789abc')).status).toBe(
        503,
      );
    }
    await r.close();
  }
});
