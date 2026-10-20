import { afterEach, expect, test } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';
import { accessHttp } from './modules/acceso/routes.js';
import type { AccessService } from './modules/acceso/service.js';

let server: Server;
afterEach(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});
test('origen HTTPS explícito, cookies seguras, CSRF y error JSON para API desconocida', async () => {
  const service = {
    session: async () => null,
    csrf: () => 'csrf-ficticio',
  } as unknown as AccessService;
  const app = createApp({
    access: accessHttp(service, true, false, ['https://piloto.example.invalid']),
    origins: ['https://piloto.example.invalid'],
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error();
  const base = `http://127.0.0.1:${address.port}`;
  const state = await fetch(base + '/api/acceso/estado');
  expect(state.headers.get('set-cookie')).toMatch(/HttpOnly/);
  expect(state.headers.get('set-cookie')).toMatch(/Secure/);
  expect(state.headers.get('cache-control')).toBe('no-store');
  const headers = {
    Cookie: state.headers.get('set-cookie')!.split(';')[0],
    'Content-Type': 'application/json',
    'x-csrf-token': 'csrf-ficticio',
    Origin: 'https://piloto.example.invalid',
  };
  expect(
    (await fetch(base + '/api/pacientes/consulta', { method: 'POST', headers, body: '{}' })).status,
  ).toBe(401);
  expect(
    (
      await fetch(base + '/api/pacientes/consulta', {
        method: 'POST',
        headers: { ...headers, Origin: 'http://localhost:5173' },
        body: '{}',
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await fetch(base + '/api/pacientes/consulta', {
        method: 'POST',
        headers: { ...headers, 'x-csrf-token': 'incorrecto' },
        body: '{}',
      })
    ).status,
  ).toBe(403);
  const missing = await fetch(base + '/api/no-existe');
  expect(missing.status).toBe(404);
  expect(await missing.json()).toEqual({ codigo: 'RUTA_NO_DISPONIBLE' });
});
