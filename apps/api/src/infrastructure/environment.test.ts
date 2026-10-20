import { expect, test, vi } from 'vitest';
import { environment, resourceSecret } from './environment.js';
import { createEditar, type EdicionRepository } from '../modules/pacientes/application/editar.js';
import { databaseConfig } from './database/connection.js';

export const pilotEnv = {
  NODE_ENV: 'production',
  APP_ENV: 'pilot',
  APP_ORIGIN: 'https://piloto.example.invalid',
  AUTH_REDIRECT_URL: 'https://piloto.example.invalid/',
  PILOT_ALLOWED_EMAIL: 'demo@example.invalid',
  AUTH_SECRET: 'a'.repeat(64),
  RESOURCE_SIGNING_SECRET: 'b'.repeat(64),
};
test('producción requiere piloto explícito; preview cierra aunque tenga secretos', () => {
  expect(environment(pilotEnv).secure).toBe(true);
  for (const delta of [
    { APP_ENV: undefined },
    { APP_ORIGIN: 'http://piloto.example.invalid' },
    { APP_ORIGIN: 'https://piloto.example.invalid/ruta' },
    { AUTH_REDIRECT_URL: 'https://otro.invalid/' },
    { PILOT_ALLOWED_EMAIL: '' },
    { RESOURCE_SIGNING_SECRET: '' },
    { RESOURCE_SIGNING_SECRET: pilotEnv.AUTH_SECRET },
    { VERCEL: '1', VERCEL_ENV: 'preview' },
    { VERCEL: '1', VERCEL_ENV: 'development' },
  ])
    expect(() => environment({ ...pilotEnv, ...delta })).toThrow();
  expect(environment({}).origins).toContain('http://127.0.0.1:5173');
});
test('TLS conserva validación con CA portable y limita el pool piloto', () => {
  const env = {
    ...pilotEnv,
    DATABASE_URL: 'postgresql://fake:fake@localhost/test',
    DATABASE_CA_PEM: 'CA-ficticia',
  };
  expect(databaseConfig(env).ssl).toEqual({ rejectUnauthorized: true, ca: 'CA-ficticia' });
  expect(databaseConfig(env).max).toBe(1);
  expect(() => databaseConfig({ ...env, DATABASE_CA_FILE: 'no-leer' })).toThrow();
  expect(() =>
    databaseConfig({ ...env, DATABASE_URL: env.DATABASE_URL + '?sslmode=disable' }),
  ).toThrow();
});
test('dos instancias editan con versión estable y rechazan cambios obsoletos, ajenos o alterados', async () => {
  const id = '12345678-1234-4234-8234-123456789abc';
  const data = {
    nombre: 'Demo',
    apellido: 'Ficticio',
    fechaNacimiento: '2000-01-01',
    telefono: '0000000',
  };
  let row = { ...data, id, stamp: '2026-10-20 12:00:00.000001+00' };
  const update = vi.fn<EdicionRepository['update']>(async () => ({ kind: 'updated' }));
  const repository: EdicionRepository = { load: async () => row, update };
  const a = createEditar(repository, 'propietario', {
    secret: resourceSecret(pilotEnv, 'pacientes'),
  });
  const b = createEditar(repository, 'propietario', {
    secret: resourceSecret({ ...pilotEnv }, 'pacientes'),
  });
  const version = (await a.load({ id })).body.version;
  expect((await b.save({ ...data, id, version })).status).toBe(200);
  expect(update).toHaveBeenCalledOnce();
  row = { ...row, stamp: '2026-10-20 12:00:00.000002+00' };
  expect((await b.save({ ...data, id, version })).status).toBe(409);
  expect((await b.save({ ...data, id, version: 'x'.repeat(43) })).status).toBe(409);
  const other = createEditar(repository, 'otro', { secret: resourceSecret(pilotEnv, 'pacientes') });
  expect(
    (await other.save({ ...data, id, version: (await a.load({ id })).body.version })).status,
  ).toBe(409);
  expect(update).toHaveBeenCalledOnce();
  expect(resourceSecret(pilotEnv, 'fichas-clinicas')).not.toEqual(
    resourceSecret(pilotEnv, 'pacientes'),
  );
});
