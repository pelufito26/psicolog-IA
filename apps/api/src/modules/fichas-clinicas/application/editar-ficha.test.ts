import { expect, test, vi } from 'vitest';
import { createEditarFicha, type EditFichaRepository, type EdicionFicha } from './editar-ficha.js';
const patient = '12345678-1234-4234-8234-123456789abc';
const fields = {
  motivoConsulta: ' Motivo ficticio\n  otra línea ',
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
  medicacion: '',
  evaluacionClinica: '',
  observacionesGenerales: '<b>Texto ficticio</b>',
};
const row: EdicionFicha = {
  pacienteId: patient,
  nombre: 'Demo',
  apellido: 'Ficha',
  ficha: { ...fields, id: patient, stamp: '2026-10-20 12:00:00.000001+00' },
};
function repo() {
  return {
    loadEdit: vi.fn<EditFichaRepository['loadEdit']>(async () => row),
    update: vi.fn<EditFichaRepository['update']>(async (_p, _id, _data, matches) =>
      matches(row.ficha!.id, row.ficha!.stamp)
        ? { kind: 'updated', id: patient }
        : { kind: 'conflict' },
    ),
  };
}
test('carga protege timestamp y versión liga profesional, paciente, ficha y microsegundos', async () => {
  const r = repo(),
    secret = Buffer.alloc(32, 7),
    service = createEditarFicha(r, 'prof', secret);
  const loaded = await service.load({ pacienteId: patient });
  const f = loaded.body.ficha as Record<string, unknown>;
  expect(f.stamp).toBeUndefined();
  expect(f.version).toMatch(/^[\w-]{43}$/);
  const input = { pacienteId: patient, version: f.version, ...fields };
  expect((await service.save(input)).status).toBe(200);
  expect(r.update.mock.calls[0][2]).toMatchObject({
    motivoConsulta: 'Motivo ficticio\n  otra línea',
    medicacion: null,
  });
  expect((await createEditarFicha(r, 'otro', secret).save(input)).status).toBe(409);
  expect(
    (await service.save({ ...input, pacienteId: '22345678-1234-4234-8234-123456789abc' })).status,
  ).toBe(409);
  const compare = r.update.mock.calls[0][3];
  expect(compare(row.ficha!.id, '2026-10-20 12:00:00.000002+00')).toBe(false);
  expect(compare('otra-ficha', row.ficha!.stamp)).toBe(false);
  expect((await createEditarFicha(r, 'prof', Buffer.alloc(32, 8)).save(input)).status).toBe(409);
});
test.each([null, [], {}, { pacienteId: 'no' }, { pacienteId: patient, version: 'no' }])(
  'carga rechaza %j',
  async (input) => {
    const r = repo();
    expect((await createEditarFicha(r, 'p').load(input)).status).toBe(400);
    expect(r.loadEdit).not.toHaveBeenCalled();
  },
);
test.each([
  { version: 'no' },
  { id: 'otro' },
  { profesional: 'otro' },
  { fechaCreacion: 'hoy' },
  { fechaUltimaModificacion: 'ayer' },
  { antecedentesFamiliares: undefined },
  { medicacion: null },
  { motivoConsulta: ' ' },
])('guardado rechaza datos %j', async (changes) => {
  const r = repo();
  expect(
    (
      await createEditarFicha(r, 'p').save({
        pacienteId: patient,
        version: 'a'.repeat(43),
        ...fields,
        ...changes,
      })
    ).status,
  ).toBe(400);
  expect(r.update).not.toHaveBeenCalled();
});
test('ausencia propia, paciente no disponible y fallo no se confunden', async () => {
  const r = repo(),
    service = createEditarFicha(r, 'prof');
  r.loadEdit
    .mockResolvedValueOnce({ ...row, ficha: null })
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error('privado'));
  expect((await service.load({ pacienteId: patient })).body.ficha).toBeNull();
  expect((await service.load({ pacienteId: patient })).status).toBe(404);
  expect((await service.load({ pacienteId: patient })).body).toEqual({
    codigo: 'EDICION_NO_DISPONIBLE',
  });
  for (const [kind, status, codigo] of [
    ['missing', 404, 'PACIENTE_NO_DISPONIBLE'],
    ['absent', 409, 'FICHA_AUSENTE'],
    ['conflict', 409, 'EDICION_CONFLICTO'],
  ] as const) {
    r.update.mockResolvedValueOnce({ kind });
    expect(await service.save({ pacienteId: patient, version: 'a'.repeat(43), ...fields })).toEqual(
      { status, body: { codigo } },
    );
  }
  r.update.mockRejectedValueOnce(new Error('privado'));
  expect(
    (await service.save({ pacienteId: patient, version: 'a'.repeat(43), ...fields })).body,
  ).toEqual({ codigo: 'GUARDADO_NO_CONFIRMADO' });
});
