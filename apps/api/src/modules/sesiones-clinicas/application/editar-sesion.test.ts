import { expect, test, vi } from 'vitest';
import { createEditarSesion, type EditSesionRepository } from './editar-sesion.js';
const patient = '12345678-1234-4234-8234-123456789abc',
  id = '22345678-1234-4234-8234-123456789abc';
const identity = { pacienteId: patient, sesionId: id };
const fields = {
  fechaSesion: '1900-01-01',
  anotacionesClinicas: '  <b>Ficticio</b>\n  segunda línea  ',
};
const stamp = '2026-10-20 12:00:00.123456+00';
function setup() {
  const repository: EditSesionRepository = {
    loadEdit: vi.fn(async () => ({
      pacienteId: patient,
      nombre: 'Demo',
      apellido: 'Sesión',
      sesion: {
        id,
        ...fields,
        profesional: { nombre: 'Demo', apellido: 'Profesional' },
        stamp,
      },
    })),
    update: vi.fn(async (_p, _patient, _id, _data, matches) =>
      matches(stamp) ? 'updated' : 'conflict',
    ),
  };
  const now = vi.fn(() => new Date('2026-10-21T02:59:59Z'));
  const service = createEditarSesion(repository, 'professional', Buffer.alloc(32, 5), now);
  return { repository, service, now };
}
async function input(service: ReturnType<typeof createEditarSesion>) {
  const r = await service.load(identity);
  return { ...identity, ...fields, version: (r.body.sesion as { version: string }).version };
}
test('carga oculta timestamp; edición antigua solo pasa campos normalizados al repositorio', async () => {
  const { service, repository } = setup();
  const loaded = await service.load(identity);
  expect(loaded.body.sesion).not.toHaveProperty('stamp');
  const b = await input(service);
  expect(await service.save(b)).toEqual({ status: 200, body: { id, estado: 'actualizada' } });
  expect(repository.update).toHaveBeenCalledWith(
    'professional',
    patient,
    id,
    { fechaSesion: '1900-01-01', anotacionesClinicas: '<b>Ficticio</b>\n  segunda línea' },
    expect.any(Function),
  );
});
test('versión liga profesional, paciente, sesión y precisión completa; reinicio requiere recarga', async () => {
  const { service, repository } = setup();
  const b = await input(service);
  for (const changed of [{ pacienteId: id }, { sesionId: patient }, { version: 'a'.repeat(43) }])
    expect((await service.save({ ...b, ...changed })).status).toBe(409);
  const other = createEditarSesion(repository, 'other', Buffer.alloc(32, 5));
  expect((await other.save(b)).status).toBe(409);
  expect(
    (await createEditarSesion(repository, 'professional', Buffer.alloc(32, 6)).save(b)).status,
  ).toBe(409);
  vi.mocked(repository.update).mockImplementationOnce(async (_p, _patient, _id, _data, matches) =>
    matches(stamp.replace('123456', '123457')) ? 'updated' : 'conflict',
  );
  expect((await service.save(b)).status).toBe(409);
});
test('hoy se evalúa al guardar, incluyendo medianoche de Montevideo', async () => {
  const { service, now, repository } = setup(),
    b = await input(service);
  expect((await service.save({ ...b, fechaSesion: '2026-10-21' })).status).toBe(400);
  expect(repository.update).not.toHaveBeenCalled();
  now.mockReturnValue(new Date('2026-10-21T03:00:00Z'));
  expect((await service.save({ ...b, fechaSesion: '2026-10-21' })).status).toBe(200);
});
test.each([
  { fechaSesion: '2026-02-30' },
  { fechaSesion: '0000-01-01' },
  { fechaSesion: '2099-01-01' },
  { anotacionesClinicas: '  ' },
  { anotacionesClinicas: null },
  { fechaSesion: undefined },
])('datos inválidos %j no escriben', async (changed) => {
  const { service, repository } = setup();
  expect((await service.save({ ...(await input(service)), ...changed })).status).toBe(400);
  expect(repository.update).not.toHaveBeenCalled();
});
test.each(['profesionalId', 'fechaCreacion', 'fechaUltimaModificacion', 'id', 'operacionId'])(
  'campo extra %s rechazado',
  async (key) => {
    const { service, repository } = setup();
    expect((await service.load({ ...identity, [key]: 'extra' })).status).toBe(400);
    expect((await service.save({ ...(await input(service)), [key]: 'extra' })).status).toBe(400);
    expect(repository.update).not.toHaveBeenCalled();
  },
);
test('faltantes/ajenos equivalentes y errores públicos no filtran trazas', async () => {
  const { service, repository } = setup(),
    b = await input(service);
  vi.mocked(repository.loadEdit).mockResolvedValueOnce(null);
  vi.mocked(repository.update).mockResolvedValueOnce('missing');
  expect(await service.load(identity)).toEqual(await service.save(b));
  vi.mocked(repository.loadEdit).mockRejectedValueOnce(new Error('secret'));
  vi.mocked(repository.update).mockRejectedValueOnce(new Error('secret'));
  expect(await service.load(identity)).toEqual({
    status: 503,
    body: { codigo: 'EDICION_NO_DISPONIBLE' },
  });
  expect(await service.save(b)).toEqual({
    status: 503,
    body: { codigo: 'GUARDADO_NO_CONFIRMADO' },
  });
});
