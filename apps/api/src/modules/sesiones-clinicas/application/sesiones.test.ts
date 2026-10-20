import { expect, test, vi } from 'vitest';
import { createSesiones, operationSessionId, type SesionRepository } from './sesiones.js';
import { hoyClinico, validarSesion } from '../domain/sesion.js';
const patient = '12345678-1234-4234-8234-123456789abc',
  op = '22345678-1234-4234-8234-123456789abc';
const input = {
  pacienteId: patient,
  operacionId: op,
  fechaSesion: '2026-10-19',
  anotacionesClinicas: '  Texto ficticio\n  segunda línea  ',
};
const repo = () => ({
  prepare: vi.fn<SesionRepository['prepare']>(async () => ({
    pacienteId: patient,
    nombre: 'Demo',
    apellido: 'Sesión',
  })),
  register: vi.fn<SesionRepository['register']>(async () => 'created'),
  check: vi.fn<SesionRepository['check']>(async () => ({ registrada: false })),
  history: vi.fn<SesionRepository['history']>(async () => null),
  detail: vi.fn<SesionRepository['detail']>(async () => null),
});
test('hoy clínico cambia a medianoche Montevideo y valida calendario sin reglas nuevas', () => {
  expect(hoyClinico(new Date('2026-10-20T02:59:59Z'))).toBe('2026-10-19');
  expect(hoyClinico(new Date('2026-10-20T03:00:00Z'))).toBe('2026-10-20');
  expect(
    validarSesion(
      { fechaSesion: '0001-01-01', anotacionesClinicas: ' Ficticio\n  texto ' },
      '2026-10-20',
    ).data,
  ).toEqual({ fechaSesion: '0001-01-01', anotacionesClinicas: 'Ficticio\n  texto' });
  expect(
    validarSesion({ fechaSesion: '2024-02-29', anotacionesClinicas: '<b>Texto</b>' }, '2026-10-20')
      .data?.anotacionesClinicas,
  ).toBe('<b>Texto</b>');
});
test.each(['2026-02-29', '2026-02-30', '2026-13-01', '0000-01-01', '2026-10-21', 'ayer', ''])(
  'rechaza fecha %s',
  (fechaSesion) =>
    expect(
      validarSesion({ fechaSesion, anotacionesClinicas: 'Texto' }, '2026-10-20').errors
        ?.fechaSesion,
    ).toBeTruthy(),
);
test.each(['', '  ', '\n\t', null, 42])('rechaza notas %j', (anotacionesClinicas) =>
  expect(
    validarSesion({ fechaSesion: '2000-01-01', anotacionesClinicas }, '2026-10-20').errors
      ?.anotacionesClinicas,
  ).toBeTruthy(),
);
test('ID estable tras recrear servicio, namespace propio y distinto envío separado', async () => {
  const r = repo(),
    now = () => new Date('2026-10-20T12:00:00Z'),
    s = createSesiones(r, 'prof', now);
  expect((await s.register(input)).status).toBe(201);
  r.register.mockResolvedValueOnce('replayed');
  expect((await createSesiones(r, 'prof', now).register(input)).status).toBe(200);
  expect(r.register.mock.calls[0][2]).toBe(r.register.mock.calls[1][2]);
  expect(r.register.mock.calls[0][3].anotacionesClinicas).toBe('Texto ficticio\n  segunda línea');
  expect(operationSessionId('prof', patient, op)).not.toBe(operationSessionId('otro', patient, op));
  expect(operationSessionId('prof', patient, op)).not.toBe(operationSessionId('prof', op, op));
  expect(operationSessionId('prof', patient, op)).not.toBe(
    operationSessionId('prof', patient, patient),
  );
  expect(operationSessionId('PROF', patient.toUpperCase(), op)).toBe(
    operationSessionId('prof', patient, op),
  );
});
test.each([
  null,
  [],
  {},
  { ...input, profesional: 'otro' },
  { ...input, sesionId: patient },
  { ...input, fechaCreacion: 'ayer' },
  { ...input, operacionId: 'no' },
])('registro rechaza %j', async (body) => {
  const r = repo();
  expect((await createSesiones(r, 'prof').register(body)).status).toBe(400);
  expect(r.register).not.toHaveBeenCalled();
});
test('contratos, ausencia, conflicto y fallos no filtran contenido', async () => {
  const r = repo(),
    s = createSesiones(r, 'prof', () => new Date('2026-10-20T12:00:00Z'));
  expect((await s.prepare({ pacienteId: patient })).body.hoy).toBe('2026-10-20');
  expect((await s.check({ pacienteId: patient, operacionId: op })).body).toEqual({
    estado: 'no-confirmada',
  });
  r.check.mockResolvedValueOnce({ registrada: true });
  expect((await s.check({ pacienteId: patient, operacionId: op })).body).toEqual({
    estado: 'registrada',
    id: operationSessionId('prof', patient, op),
  });
  r.register
    .mockResolvedValueOnce('conflict')
    .mockResolvedValueOnce('missing')
    .mockRejectedValueOnce(new Error('privado'));
  expect((await s.register(input)).body).toEqual({ codigo: 'OPERACION_INCOMPATIBLE' });
  expect((await s.register(input)).status).toBe(404);
  expect((await s.register(input)).body).toEqual({ codigo: 'REGISTRO_NO_CONFIRMADO' });
  expect((await s.detail({ pacienteId: patient, sesionId: op })).body).toEqual({
    codigo: 'REGISTRO_NO_DISPONIBLE',
  });
  for (const pagina of [0, -1, 1.5, Number.MAX_SAFE_INTEGER, NaN, '1'])
    expect((await s.history({ pacienteId: patient, pagina })).status).toBe(400);
  expect(r.history).not.toHaveBeenCalled();
  r.prepare.mockRejectedValueOnce(new Error('privado'));
  expect((await s.prepare({ pacienteId: patient })).body).toEqual({
    codigo: 'SESIONES_NO_DISPONIBLES',
  });
});
