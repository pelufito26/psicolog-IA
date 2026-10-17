import { expect, test, vi } from 'vitest';
import { createEditar, type EdicionRepository } from './editar.js';
const id = '12345678-1234-4234-8234-123456789abc';
const data = {
  nombre: 'Demo',
  apellido: 'Paciente',
  fechaNacimiento: '2000-02-29',
  telefono: '0000000',
};
const row = { ...data, id, stamp: '2026-10-17 12:00:00.123456+00' };
const secret = Buffer.alloc(32, 7);
const make = () => ({
  load: vi.fn(async () => row),
  update: vi.fn<EdicionRepository['update']>(async () => ({ kind: 'updated' })),
});
test('carga una versión opaca de precisión completa y no expone stamp', async () => {
  const repo = make(),
    edit = createEditar(repo, 'prof', { secret });
  const loaded = await edit.load({ id });
  expect(loaded.body).toMatchObject({ ...data, id });
  expect(loaded.body.stamp).toBeUndefined();
  expect(loaded.body.version).toMatch(/^[A-Za-z0-9_-]{43}$/);
  repo.load.mockResolvedValue({ ...row, stamp: '2026-10-17 12:00:00.123457+00' });
  expect((await edit.load({ id })).body.version).not.toBe(loaded.body.version);
});
test.each([null, [], {}, { id: 'invalido' }, { id, profesional: 'ajeno' }])(
  'rechaza carga inválida %j',
  async (input) => {
    const repo = make();
    expect((await createEditar(repo, 'prof').load(input)).status).toBe(400);
    expect(repo.load).not.toHaveBeenCalled();
  },
);
test('valida campos y normaliza datos antes del guardado', async () => {
  const repo = make(),
    edit = createEditar(repo, 'prof', { secret });
  const version = (await edit.load({ id })).body.version;
  expect((await edit.save({ ...data, id, version, profesional_id: 'ajeno' })).status).toBe(400);
  expect((await edit.save({ ...data, id, version, telefono: '' })).body.codigo).toBe(
    'DATOS_INVALIDOS',
  );
  expect(repo.update).not.toHaveBeenCalled();
  expect(
    (await edit.save({ ...data, id, version, nombre: '  Demo  ', telefono: '(000) 0000' })).status,
  ).toBe(200);
  expect(repo.update).toHaveBeenCalledWith('prof', id, data, row.stamp, false);
});
test('versiones antiguas y resultados atómicos se traducen sin filtraciones', async () => {
  const repo = make(),
    edit = createEditar(repo, 'prof', { secret }),
    version = (await edit.load({ id })).body.version;
  repo.load.mockResolvedValue({ ...row, stamp: 'más reciente' });
  expect((await edit.save({ ...data, id, version })).body.codigo).toBe('EDICION_CONFLICTO');
  expect(repo.update).not.toHaveBeenCalled();
  repo.load.mockResolvedValue(row);
  for (const kind of ['missing', 'conflict'] as const) {
    repo.update.mockResolvedValue({ kind });
    expect((await edit.save({ ...data, id, version })).status).toBe(kind === 'missing' ? 404 : 409);
  }
  repo.load.mockRejectedValue(new Error('privado'));
  expect((await edit.save({ ...data, id, version })).body).toEqual({
    codigo: 'GUARDADO_NO_CONFIRMADO',
  });
});
test('confirmación ligada a datos, paciente, profesional, versión y vencimiento', async () => {
  let now = new Date('2026-10-17T12:00:00Z');
  const repo = make(),
    edit = createEditar(repo, 'prof', { secret, now: () => now });
  repo.update.mockImplementation(async (_p, _id, _d, _v, confirmed) => ({
    kind: confirmed ? 'updated' : 'duplicate',
  }));
  const version = (await edit.load({ id })).body.version;
  const input = { ...data, id, version },
    token = (await edit.save(input)).body.confirmacionDuplicado;
  expect((await edit.save({ ...input, confirmacionDuplicado: token })).status).toBe(200);
  for (const changed of [
    { telefono: '1111111' },
    { id: '12345678-1234-4234-8234-123456789abd' },
    { version: 'X'.repeat(43) },
  ])
    expect(
      (await edit.save({ ...input, ...changed, confirmacionDuplicado: token })).body.codigo,
    ).toBe('CONFIRMACION_INVALIDA');
  expect(
    (await createEditar(repo, 'otro', { secret }).save({ ...input, confirmacionDuplicado: token }))
      .status,
  ).toBe(400);
  expect(
    (await edit.save({ ...input, confirmacionDuplicado: 'eyJleHAiOjF9.firma-alta' })).status,
  ).toBe(400);
  now = new Date(now.getTime() + 600001);
  expect((await edit.save({ ...input, confirmacionDuplicado: token })).status).toBe(400);
});
