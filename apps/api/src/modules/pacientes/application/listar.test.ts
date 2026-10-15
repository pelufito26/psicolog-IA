import { expect, test, vi } from 'vitest';
import { createListar, edad } from './listar.js';
test.each([
  ['2000-02-29', '2025-02-28', 24],
  ['2000-02-29', '2025-03-01', 25],
  ['2000-02-29', '2024-02-29', 24],
  ['2026-10-15', '2026-10-15', 0],
])('edad %s a %s', (birth, today, value) => expect(edad(birth, today)).toBe(value));
const row = {
  id: 'a',
  nombre: 'José',
  apellido: 'Álvarez',
  fechaNacimiento: '2000-01-01',
  telefono: '0000000',
};
test('normaliza búsqueda, ordena y devuelve solo proyección pública', async () => {
  const read = vi.fn(async () => [
    { ...row, id: 'b' },
    row,
    { ...row, id: 'c', apellido: 'Zeta', nombre: '100%_literal' },
  ]);
  const list = createListar({ read }, 'prof', () => new Date('2026-10-15T01:00:00Z'));
  const result = await list({ busqueda: ' JOSE ', pagina: 1 });
  expect(read).toHaveBeenCalledWith('prof');
  expect(result.body.pacientes).toEqual(
    ['a', 'b'].map((id) => ({
      id,
      nombre: row.nombre,
      apellido: row.apellido,
      telefono: row.telefono,
      edad: 26,
    })),
  );
  expect((await list({ busqueda: '%_', pagina: 1 })).body.pacientes as unknown[]).toHaveLength(1);
  expect(
    (await list({ busqueda: 'José Álvarez', pagina: 1 })).body.pacientes as unknown[],
  ).toHaveLength(0);
});
test('pagina veinte, con desempate estable y página vacía', async () => {
  const list = createListar(
    {
      read: async () =>
        Array.from({ length: 21 }, (_, i) => ({
          ...row,
          id: String(i).padStart(2, '0'),
        })).reverse(),
    },
    'prof',
  );
  expect((await list({ busqueda: '', pagina: 1 })).body.haySiguiente).toBe(true);
  expect((await list({ busqueda: '', pagina: 2 })).body).toMatchObject({
    pacientes: [{ id: '20' }],
    haySiguiente: false,
    pagina: 2,
  });
  expect((await list({ busqueda: '', pagina: 3 })).body.pacientes).toEqual([]);
});
test.each([
  null,
  [],
  {},
  { busqueda: '', pagina: 0 },
  { busqueda: '', pagina: 1.2 },
  { busqueda: '', pagina: '1' },
  { busqueda: '', pagina: 1, profesional_id: 'otro' },
])('rechaza consulta inválida %j', async (input) => {
  const read = vi.fn();
  expect((await createListar({ read }, 'p')(input)).status).toBe(400);
  expect(read).not.toHaveBeenCalled();
});
test('contexto inexistente y fallos no filtran detalles', async () => {
  expect(
    (await createListar({ read: async () => null }, 'p')({ busqueda: '', pagina: 1 })).status,
  ).toBe(503);
  expect(
    await createListar(
      {
        read: async () => {
          throw new Error('detalle privado');
        },
      },
      'p',
    )({ busqueda: '', pagina: 1 }),
  ).toEqual({ status: 503, body: { codigo: 'CONSULTA_NO_DISPONIBLE' } });
});
