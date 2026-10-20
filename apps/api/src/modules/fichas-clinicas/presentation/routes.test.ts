import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Server } from 'node:http';
import express from 'express';
import { createApp } from '../../../app.js';
import { createFichaRuntime } from './runtime.js';
let server: Server, base: string;
const handler = vi.fn(async () => ({ status: 200, body: { existe: false } }));
beforeEach(async () => {
  handler.mockClear();
  server = createApp({
    fichaState: handler,
    fichaRead: handler,
    fichaCreate: handler,
    access: {
      router: express.Router(),
      guard: (_q, r, next) => {
        r.locals.access = { professional: 'prof' };
        next();
      },
    },
  }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error();
  base = 'http://127.0.0.1:' + address.port;
});
afterEach(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);
test.each(['/estado', '/crear', '/consultar'])(
  'ruta %s tiene origen/JSON/límite y no-store',
  async (path) => {
    for (const [origin, type, body, status] of [
      ['http://127.0.0.1:5173', 'application/json', '{}', 200],
      ['https://ajeno.invalid', 'application/json', '{}', 403],
      ['http://127.0.0.1:5173', 'text/plain', '{}', 415],
      ['http://127.0.0.1:5173', 'application/json', '{', 400],
      [
        'http://127.0.0.1:5173',
        'application/json',
        JSON.stringify({ motivoConsulta: 'x'.repeat(17000) }),
        413,
      ],
    ] as const) {
      const response = await fetch(base + '/api/fichas-clinicas' + path, {
        method: 'POST',
        headers: { origin, 'content-type': type },
        body,
      });
      expect(response.status).toBe(status);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    expect(handler).toHaveBeenCalledWith({}, 'prof');
  },
);
test('runtime sin contexto, producción o conexión falla cerrado', async () => {
  for (const env of [{}, { NODE_ENV: 'production' }]) {
    const runtime = createFichaRuntime(env);
    expect((await runtime.create({})).status).toBe(503);
    expect((await runtime.read({})).status).toBe(503);
    expect((await runtime.read({}, '12345678-1234-4234-8234-123456789abc')).status).toBe(503);
    expect((await runtime.state({}, '12345678-1234-4234-8234-123456789abc')).status).toBe(503);
    await runtime.close();
  }
});
