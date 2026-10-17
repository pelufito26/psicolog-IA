import { expect, test, vi } from 'vitest';
import { createPerfil } from './perfil.js';
const id = '12345678-1234-4234-8234-123456789abc';
const row = {
  id,
  nombre: 'Demo',
  apellido: 'Paciente',
  fechaNacimiento: '2000-02-29',
  telefono: '0000000',
};
test.each([
  null,
  [],
  {},
  { id: 'otro' },
  { id: 1 },
  { id, profesional: 'ajeno' },
  { id: id + "'" },
])('rechaza entrada inválida sin consultar: %j', async (input) => {
  const find = vi.fn();
  expect((await createPerfil({ find }, 'prof')(input)).status).toBe(400);
  expect(find).not.toHaveBeenCalled();
});
test('proyecta solo los datos personales y edad con el día de Montevideo', async () => {
  const find = vi.fn(async () => ({ ...row, secreto: 'no exponer' }));
  const result = await createPerfil(
    { find },
    'prof',
    () => new Date('2025-03-01T02:59:59Z'),
  )({ id });
  expect(find).toHaveBeenCalledWith('prof', id);
  expect(result).toEqual({ status: 200, body: { ...row, edad: 24 } });
  expect(
    (await createPerfil({ find }, 'prof', () => new Date('2025-03-01T03:00:00Z'))({ id })).body
      .edad,
  ).toBe(25);
});
test('ausencia y fallos no filtran información interna', async () => {
  expect(await createPerfil({ find: async () => null }, 'prof')({ id })).toEqual({
    status: 404,
    body: { codigo: 'PACIENTE_NO_DISPONIBLE' },
  });
  expect(
    await createPerfil(
      {
        find: async () => {
          throw new Error('dato privado');
        },
      },
      'prof',
    )({ id }),
  ).toEqual({ status: 503, body: { codigo: 'PERFIL_NO_DISPONIBLE' } });
});
