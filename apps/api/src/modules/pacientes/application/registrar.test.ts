import { expect, test, vi } from 'vitest';
import { createRegistrar, type RegistroRepository } from './registrar.js';
const data = {
  nombre: 'José',
  apellido: 'Prueba',
  fechaNacimiento: '2000-01-01',
  telefono: '+59899123456',
};
test('advierte sin confirmar y token autoriza solo mismos datos/contexto', async () => {
  const repository: RegistroRepository = {
    register: vi.fn(async (_p, _d, confirmed) =>
      confirmed ? { kind: 'created', id: 'id' } : { kind: 'duplicate' },
    ),
  };
  let clock = new Date('2026-10-15T12:00:00Z');
  const handler = createRegistrar(repository, 'professional', {
    now: () => clock,
    secret: Buffer.alloc(32, 1),
  });
  const warning = await handler(data);
  expect(warning.status).toBe(409);
  const token = warning.body.confirmacionDuplicado;
  expect((await handler({ ...data, confirmacionDuplicado: token })).status).toBe(201);
  expect(
    (await handler({ ...data, nombre: 'Otro', confirmacionDuplicado: token })).body.codigo,
  ).toBe('CONFIRMACION_INVALIDA');
  expect((await handler({ ...data, confirmacionDuplicado: 'alterado' })).status).toBe(409);
  const other = createRegistrar(repository, 'other', {
    now: () => clock,
    secret: Buffer.alloc(32, 1),
  });
  expect((await other({ ...data, confirmacionDuplicado: token })).status).toBe(409);
  clock = new Date('2026-10-15T12:10:00Z');
  expect((await handler({ ...data, confirmacionDuplicado: token })).status).toBe(409);
});
test('no consulta DB con identidad enviada o datos inválidos', async () => {
  const register = vi.fn();
  const handler = createRegistrar({ register }, 'p');
  expect((await handler({ ...data, profesional_id: 'x' })).status).toBe(400);
  expect(register).not.toHaveBeenCalled();
});
test('error y profesional inexistente no comunican éxito', async () => {
  const handler = createRegistrar(
    {
      register: async () => {
        throw new Error('secreto');
      },
    },
    'p',
  );
  expect(await handler(data)).toEqual({ status: 503, body: { codigo: 'REGISTRO_NO_CONFIRMADO' } });
  expect(
    (await createRegistrar({ register: async () => ({ kind: 'missing' }) }, 'p')(data)).body.codigo,
  ).toBe('DESARROLLO_NO_CONFIGURADO');
});
