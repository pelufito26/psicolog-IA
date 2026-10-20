import { afterEach, expect, test, vi } from 'vitest';
import { sesionEditor } from './edit-client';
import { SesionNoDisponible } from './client';
const patient = '12345678-1234-4234-8234-123456789abc',
  id = '22345678-1234-4234-8234-123456789abc';
const fields = { fechaSesion: '1900-01-01', anotacionesClinicas: '<b>Ficticio</b>\n  línea' };
const body = {
  pacienteId: patient,
  nombre: 'Demo',
  apellido: 'Sesión',
  sesion: {
    id,
    ...fields,
    profesional: { nombre: 'Profesional', apellido: 'Demo' },
    version: 'a'.repeat(43),
  },
};
afterEach(() => vi.unstubAllGlobals());
test('carga/guardado POST mínimo, cache no-store, cancelación y versión; contenido literal', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json(body))
    .mockResolvedValueOnce(Response.json({ id, estado: 'actualizada' }));
  vi.stubGlobal('fetch', fetcher);
  const c = new AbortController();
  expect(await sesionEditor.load(patient, id, c.signal)).toEqual(body);
  expect(await sesionEditor.save(patient, id, body.sesion.version, fields, c.signal)).toEqual({
    kind: 'saved',
    id,
  });
  expect(fetcher.mock.calls[0][0]).toBe('/api/sesiones-clinicas/edicion');
  expect(fetcher.mock.calls[1][0]).toBe('/api/sesiones-clinicas/actualizar');
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
    pacienteId: patient,
    sesionId: id,
    version: body.sesion.version,
    ...fields,
  });
  for (const [, options] of fetcher.mock.calls) {
    expect(options.method).toBe('POST');
    expect(options.cache).toBe('no-store');
  }
  c.abort();
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
});
test.each([
  { ...body, pacienteId: id },
  { ...body, nombre: '' },
  { ...body, sesion: { ...body.sesion, id: patient } },
  { ...body, sesion: { ...body.sesion, fechaSesion: '2026-02-30' } },
  { ...body, sesion: { ...body.sesion, version: 'wrong' } },
  { ...body, sesion: { ...body.sesion, profesional: null } },
  { ...body, sesion: { ...body.sesion, anotacionesClinicas: ' ' } },
])('carga inválida rechazada %j', async (b) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(b)),
  );
  await expect(sesionEditor.load(patient, id, new AbortController().signal)).rejects.toThrow();
});
test('404 de carga tipado y errores temporales no habilitan editor', async () => {
  const f = vi
    .fn()
    .mockResolvedValueOnce(Response.json({}, { status: 404 }))
    .mockResolvedValueOnce(Response.json({}, { status: 503 }));
  vi.stubGlobal('fetch', f);
  await expect(sesionEditor.load(patient, id, new AbortController().signal)).rejects.toBeInstanceOf(
    SesionNoDisponible,
  );
  await expect(sesionEditor.load(patient, id, new AbortController().signal)).rejects.toThrow();
});
test.each([
  [413, {}, 'too-large'],
  [404, {}, 'missing'],
  [409, { codigo: 'EDICION_CONFLICTO' }, 'conflict'],
  [400, { codigo: 'DATOS_INVALIDOS', errores: { fechaSesion: 'Error' } }, 'invalid'],
  [400, { codigo: 'DATOS_INVALIDOS', errores: { fechaSesion: 5 } }, 'uncertain'],
  [200, { id: patient, estado: 'actualizada' }, 'uncertain'],
  [503, {}, 'uncertain'],
  [401, {}, 'uncertain'],
] as const)('respuesta de guardado %s → %s', async (status, b, kind) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(b, { status })),
  );
  expect(
    (
      await sesionEditor.save(
        patient,
        id,
        body.sesion.version,
        fields,
        new AbortController().signal,
      )
    ).kind,
  ).toBe(kind);
});
test('red/respuesta inválida inciertas sin reenvíos', async () => {
  const f = vi
    .fn()
    .mockRejectedValueOnce(new Error('red'))
    .mockResolvedValueOnce(new Response('{', { status: 200 }));
  vi.stubGlobal('fetch', f);
  for (let i = 0; i < 2; i++)
    expect(
      (
        await sesionEditor.save(
          patient,
          id,
          body.sesion.version,
          fields,
          new AbortController().signal,
        )
      ).kind,
    ).toBe('uncertain');
  expect(f).toHaveBeenCalledTimes(2);
});
