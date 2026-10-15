import { expect, test } from 'vitest';
import { createAccessRuntime } from './runtime.js';
import { createRegistrationRuntime } from '../pacientes/presentation/runtime.js';
test('servidor normal no habilita mocks ni profesional fijo', async () => {
  const access = createAccessRuntime({
    AUTH_TEST_HARNESS: '1',
    DEV_PROFESIONAL_ID: '1addd3b9-c348-48ff-ba6d-6269205dadb1',
    DEV_PATIENT_REGISTRATION: 'true',
  });
  expect(access.http).toBeUndefined();
  await access.close();
  const patients = createRegistrationRuntime({
    DEV_PROFESIONAL_ID: '1addd3b9-c348-48ff-ba6d-6269205dadb1',
    DEV_PATIENT_REGISTRATION: 'true',
  });
  expect((await patients.list({ busqueda: '', pagina: 1 })).status).toBe(503);
  await patients.close();
});
test('piloto deshabilitado en producción aunque exista configuración', async () => {
  const access = createAccessRuntime({
    NODE_ENV: 'production',
    AUTH_SECRET: '0'.repeat(64),
    SUPABASE_URL: 'https://test.invalid',
    SUPABASE_PUBLISHABLE_KEY: 'test',
    AUTH_REDIRECT_URL: 'http://127.0.0.1:5173/',
    AUTH_MAIL_MODE: 'resend',
    RESEND_API_KEY: 'test',
    AUTH_FROM: 'demo@example.invalid',
  });
  expect(access.http).toBeUndefined();
  await access.close();
});
