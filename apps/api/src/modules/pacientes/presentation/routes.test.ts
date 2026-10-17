import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Server } from 'node:http';
import express from 'express';
import { createApp } from '../../../app.js';
import { createRegistrationRuntime } from './runtime.js';
let server: Server;
let base: string;
const handler = vi.fn(async () => ({ status: 201, body: { id: 'test', estado: 'registrado' } }));
beforeEach(async () => {
  handler.mockClear();
  server = createApp({
    register: handler,
    list: handler,
    profile: handler,
    editLoad: handler,
    editSave: handler,
    access: { router: express.Router(), guard: (_req, _res, next) => next() },
  }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error();
  base = 'http://127.0.0.1:' + address.port;
});
afterEach(
  () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
);
test('ruta responde al contrato y origen local permitido', async () => {
  const response = await fetch(base + '/api/pacientes', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:5173' },
    body: '{}',
  });
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ id: 'test', estado: 'registrado' });
});
test.each(['https://ajeno.invalid', 'null'])(
  'rechaza origen %s antes de registrar',
  async (origin) => {
    expect(
      (
        await fetch(base + '/api/pacientes', {
          method: 'POST',
          headers: { origin, 'content-type': 'application/json' },
          body: '{}',
        })
      ).status,
    ).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  },
);
test('rechaza tipo, JSON roto y payload excesivo', async () => {
  expect((await fetch(base + '/api/pacientes', { method: 'POST', body: '{}' })).status).toBe(415);
  expect(
    (
      await fetch(base + '/api/pacientes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await fetch(base + '/api/pacientes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre: 'x'.repeat(17000) }),
      })
    ).status,
  ).toBe(413);
  expect(handler).not.toHaveBeenCalled();
});
test('contexto ausente y producción no conectan ni escriben', async () => {
  for (const env of [
    {},
    { DEV_PATIENT_REGISTRATION: 'true', DEV_PROFESIONAL_ID: 'invalido' },
    {
      NODE_ENV: 'production',
      DEV_PATIENT_REGISTRATION: 'true',
      DEV_PROFESIONAL_ID: '00000000-0000-4000-8000-000000000000',
    },
  ]) {
    const runtime = createRegistrationRuntime(env);
    expect((await runtime.register({})).status).toBe(503);
    await runtime.close();
  }
  expect((await fetch(base + '/api/health')).status).toBe(200);
});

test('consulta hereda protección HTTP y no permite caché', async () => {
  for (const [headers, body, status] of [
    [{ 'content-type': 'application/json' }, '{}', 201],
    [{ 'content-type': 'application/json', origin: 'https://ajeno.invalid' }, '{}', 403],
    [{ 'content-type': 'text/plain' }, '{}', 415],
    [{ 'content-type': 'application/json' }, '{', 400],
    [{ 'content-type': 'application/json' }, JSON.stringify({ busqueda: 'a'.repeat(17000) }), 413],
  ] as const) {
    const response = await fetch(base + '/api/pacientes/consulta', {
      method: 'POST',
      headers,
      body,
    });
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
  }
});
test('consulta deshabilitada en producción y sin contexto', async () => {
  for (const env of [
    {},
    {
      NODE_ENV: 'production',
      DEV_PATIENT_REGISTRATION: 'true',
      DEV_PROFESIONAL_ID: '1addd3b9-c348-48ff-ba6d-6269205dadb1',
    },
  ]) {
    const runtime = createRegistrationRuntime(env);
    expect((await runtime.list({ busqueda: '', pagina: 1 })).status).toBe(503);
    await runtime.close();
  }
});

test('perfil reutiliza protecciones HTTP y no-store', async () => {
  for (const [headers, body, status] of [
    [{ 'content-type': 'application/json' }, '{}', 201],
    [{ 'content-type': 'application/json', origin: 'https://ajeno.invalid' }, '{}', 403],
    [{ 'content-type': 'text/plain' }, '{}', 415],
    [{ 'content-type': 'application/json' }, '{', 400],
    [{ 'content-type': 'application/json' }, JSON.stringify({ id: 'a'.repeat(17000) }), 413],
  ] as const) {
    const response = await fetch(base + '/api/pacientes/perfil', { method: 'POST', headers, body });
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
  }
});
test('perfil no habilita producción o contexto ausente', async () => {
  for (const env of [{}, { NODE_ENV: 'production' }]) {
    const runtime = createRegistrationRuntime(env);
    expect((await runtime.profile({}, '12345678-1234-4234-8234-123456789abc')).status).toBe(503);
    expect((await runtime.profile({})).status).toBe(503);
    await runtime.close();
  }
});

test.each(['/edicion', '/actualizar'])('edición hereda límites y no-store: %s', async (path) => {
  for (const [headers, body, status] of [
    [{ 'content-type': 'application/json' }, '{}', 201],
    [{ 'content-type': 'application/json', origin: 'https://ajeno.invalid' }, '{}', 403],
    [{ 'content-type': 'text/plain' }, '{}', 415],
    [{ 'content-type': 'application/json' }, '{', 400],
    [{ 'content-type': 'application/json' }, JSON.stringify({ nombre: 'x'.repeat(17000) }), 413],
  ] as const) {
    const response = await fetch(base + '/api/pacientes' + path, { method: 'POST', headers, body });
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
  }
});
test('edición sin contexto o producción falla cerrada', async () => {
  for (const env of [{}, { NODE_ENV: 'production' }]) {
    const runtime = createRegistrationRuntime(env);
    expect((await runtime.editLoad({})).status).toBe(503);
    expect((await runtime.editSave({}, '12345678-1234-4234-8234-123456789abc')).status).toBe(503);
    await runtime.close();
  }
});

test('configuración de base ausente conserva errores públicos de edición', async () => {
  const runtime = createRegistrationRuntime({}),
    professional = '12345678-1234-4234-8234-123456789abc';
  expect((await runtime.editLoad({}, professional)).body.codigo).toBe('EDICION_NO_DISPONIBLE');
  expect((await runtime.editSave({}, professional)).body.codigo).toBe('GUARDADO_NO_CONFIRMADO');
  await runtime.close();
});
