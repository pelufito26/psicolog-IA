import { expect, test, vi } from 'vitest';
import { createFicha, type FichaRepository } from './ficha.js';
import { validarFicha } from '../domain/ficha.js';
const patient = '12345678-1234-4234-8234-123456789abc';
test.each(['', '   ', '\r\n\t'])('rechaza motivo vacío %j', (motivoConsulta) => {
  expect(validarFicha({ motivoConsulta }).errors?.motivoConsulta).toBeTruthy();
});
test('solo motivo es obligatorio y conserva formato interno como texto', () => {
  expect(validarFicha({ motivoConsulta: '  Ejemplo\n  segunda línea  ' }).data).toEqual({
    motivoConsulta: 'Ejemplo\n  segunda línea',
    antecedentesPersonales: null,
    antecedentesFamiliares: null,
    medicacion: null,
    evaluacionClinica: null,
    observacionesGenerales: null,
  });
  const text = '<script>texto ficticio</script>\n  no se ejecuta';
  expect(
    validarFicha({ motivoConsulta: 'Motivo', observacionesGenerales: ' ' + text + ' ' }).data
      ?.observacionesGenerales,
  ).toBe(text);
  expect(validarFicha({ motivoConsulta: 'Motivo', medicacion: '   ' }).data?.medicacion).toBeNull();
});
test.each([
  { motivoConsulta: 12 },
  { motivoConsulta: 'Motivo', medicacion: false },
  { motivoConsulta: 'Motivo', profesional: 'ajeno' },
  { motivoConsulta: 'Motivo', id: 'no' },
  { motivoConsulta: 'Motivo', fechaCreacion: 'hoy' },
])('rechaza tipos/campos no permitidos %j', (fields) =>
  expect(validarFicha(fields).errors).toBeTruthy(),
);
const repo = () => ({
  read: vi.fn<FichaRepository['read']>(async () => null),
  state: vi.fn<FichaRepository['state']>(async () => false),
  create: vi.fn<FichaRepository['create']>(async () => ({ kind: 'created', id: 'ficha' })),
});
test('estado solo comunica existencia del paciente propio', async () => {
  const r = repo(),
    service = createFicha(r, 'prof');
  expect(await service.state({ pacienteId: patient })).toEqual({
    status: 200,
    body: { existe: false },
  });
  expect(r.state).toHaveBeenCalledWith('prof', patient);
  r.state.mockResolvedValue(true);
  expect((await service.state({ pacienteId: patient })).body).toEqual({ existe: true });
  r.state.mockResolvedValue(null);
  expect((await service.state({ pacienteId: patient })).status).toBe(404);
  r.state.mockRejectedValue(new Error('privado'));
  expect((await service.state({ pacienteId: patient })).body).toEqual({
    codigo: 'FICHA_NO_DISPONIBLE',
  });
});
test.each([null, [], {}, { pacienteId: 'invalido' }, { pacienteId: patient, extra: true }])(
  'estado rechaza entrada inválida %j',
  async (input) => {
    const r = repo();
    expect((await createFicha(r, 'prof').state(input)).status).toBe(400);
    expect(r.state).not.toHaveBeenCalled();
  },
);
test('crear valida, usa profesional del servidor y traduce conflictos sin textos', async () => {
  const r = repo(),
    service = createFicha(r, 'prof'),
    input = { pacienteId: patient, motivoConsulta: ' Motivo ficticio ' };
  expect((await service.create({ ...input, motivoConsulta: ' ' })).status).toBe(400);
  expect(r.create).not.toHaveBeenCalled();
  expect(await service.create(input)).toEqual({
    status: 201,
    body: { id: 'ficha', estado: 'creada' },
  });
  expect(r.create.mock.calls[0]?.[0]).toBe('prof');
  expect(r.create.mock.calls[0]?.[2].motivoConsulta).toBe('Motivo ficticio');
  r.create.mockResolvedValue({ kind: 'exists' });
  expect(await service.create(input)).toEqual({ status: 409, body: { codigo: 'FICHA_YA_EXISTE' } });
  r.create.mockResolvedValue({ kind: 'missing' });
  expect((await service.create(input)).status).toBe(404);
  r.create.mockRejectedValue(new Error('privado'));
  expect((await service.create(input)).body).toEqual({ codigo: 'CREACION_NO_CONFIRMADA' });
});

test('consulta distingue ausencia de paciente, ficha vacía y contenido sin modificarlo', async () => {
  const r = repo(),
    service = createFicha(r, 'prof');
  expect(await service.read({ pacienteId: patient })).toEqual({
    status: 404,
    body: { codigo: 'PACIENTE_NO_DISPONIBLE' },
  });
  const data = { pacienteId: patient, nombre: 'Demo', apellido: 'Ficticio', ficha: null };
  r.read.mockResolvedValue(data);
  expect(await service.read({ pacienteId: patient })).toEqual({ status: 200, body: data });
  expect(r.read).toHaveBeenCalledWith('prof', patient);
  expect(r.create).not.toHaveBeenCalled();
  r.read.mockRejectedValue(new Error('texto privado'));
  expect(await service.read({ pacienteId: patient })).toEqual({
    status: 503,
    body: { codigo: 'FICHA_NO_DISPONIBLE' },
  });
});
test.each([null, [], {}, { pacienteId: 'no' }, { pacienteId: patient, profesional: 'otro' }])(
  'consulta rechaza entrada %j',
  async (input) => {
    const r = repo();
    expect((await createFicha(r, 'prof').read(input)).status).toBe(400);
    expect(r.read).not.toHaveBeenCalled();
  },
);
