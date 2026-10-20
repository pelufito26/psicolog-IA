import { afterEach, expect, test, vi } from 'vitest';
import { sesionAPI, fechaClinica, fechaTecnica, SesionNoDisponible } from './client';
const p = '12345678-1234-4234-8234-123456789abc',
  id = '22345678-1234-4234-8234-123456789abc';
const identity = { pacienteId: p, nombre: 'Demo', apellido: 'Sesiones' },
  entry = {
    id,
    fechaSesion: '2000-01-01',
    profesional: { nombre: 'Profesional', apellido: 'Demo' },
  };
const details = {
  ...identity,
  sesion: {
    ...entry,
    anotacionesClinicas: '<b>Literal</b>\n  línea',
    fechaCreacion: '2026-10-20T01:30:00Z',
    fechaUltimaModificacion: '2026-10-20T02:00:00Z',
  },
};
const data = { operacionId: id, fechaSesion: '2000-01-01', anotacionesClinicas: 'Nota' };
afterEach(() => vi.unstubAllGlobals());
test('cinco operaciones usan POST JSON mínimo, no-store, cancelación y fechas sin desplazamiento', async () => {
  const f = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ ...identity, hoy: '2026-10-20' }))
    .mockResolvedValueOnce(
      Response.json({ ...identity, sesiones: [entry], pagina: 2, haySiguiente: false }),
    )
    .mockResolvedValueOnce(Response.json(details))
    .mockResolvedValueOnce(Response.json({ id, estado: 'registrada' }, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ id, estado: 'registrada' }));
  vi.stubGlobal('fetch', f);
  const c = new AbortController();
  await sesionAPI.prepare(p, c.signal);
  await sesionAPI.history(p, 2, c.signal);
  expect(await sesionAPI.detail(p, id, c.signal)).toEqual(details);
  expect(await sesionAPI.register(p, data, c.signal)).toEqual({ kind: 'saved', id });
  expect(await sesionAPI.check(p, id, c.signal)).toEqual({ estado: 'registrada', id });
  expect(f.mock.calls.map((x) => x[0])).toEqual(
    ['preparar', 'historial', 'detalle', 'registrar', 'comprobar'].map(
      (x) => '/api/sesiones-clinicas/' + x,
    ),
  );
  expect(JSON.parse(f.mock.calls[3][1].body)).toEqual({ pacienteId: p, ...data });
  for (const [, options] of f.mock.calls) {
    expect(options.method).toBe('POST');
    expect(options.cache).toBe('no-store');
  }
  c.abort();
  expect(f.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fechaClinica('2000-01-01')).toBe('01/01/2000');
  expect(fechaTecnica('2026-10-20T01:30:00Z')).toMatch(/19\/10\/2026.*22:30/);
});
test.each([
  { ...identity, sesiones: [], pagina: 3, haySiguiente: false },
  {
    ...identity,
    sesiones: [{ ...entry, fechaSesion: '2026-02-30' }],
    pagina: 1,
    haySiguiente: false,
  },
  { ...identity, pacienteId: id, sesiones: [], pagina: 1, haySiguiente: false },
  { ...identity, sesiones: [], pagina: 1 },
  {
    ...identity,
    sesiones: Array.from({ length: 21 }, () => entry),
    pagina: 1,
    haySiguiente: false,
  },
])('historial inválido se rechaza %j', async (b) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(b)),
  );
  await expect(sesionAPI.history(p, 1, new AbortController().signal)).rejects.toThrow();
});
test.each([
  { ...details, sesion: { ...details.sesion, id: p } },
  { ...details, sesion: { ...details.sesion, anotacionesClinicas: '' } },
  { ...details, sesion: { ...details.sesion, fechaCreacion: 'ayer' } },
  { ...details, sesion: { ...details.sesion, profesional: { nombre: '', apellido: 'Demo' } } },
])('detalle inválido se rechaza', async (b) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(b)),
  );
  await expect(sesionAPI.detail(p, id, new AbortController().signal)).rejects.toThrow();
});
test('lectura distingue no disponible, temporal y no confirmado sin inferir vacío', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 404 }))
      .mockResolvedValueOnce(Response.json({}, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ estado: 'no-confirmada' }))
      .mockResolvedValueOnce(Response.json({ estado: 'registrada' })),
  );
  const signal = new AbortController().signal;
  await expect(sesionAPI.history(p, 1, signal)).rejects.toBeInstanceOf(SesionNoDisponible);
  await expect(sesionAPI.history(p, 1, signal)).rejects.toThrow();
  expect(await sesionAPI.check(p, id, signal)).toEqual({ estado: 'no-confirmada' });
  await expect(sesionAPI.check(p, id, signal)).rejects.toThrow();
});
test.each([
  [200, { id, estado: 'registrada' }, 'saved'],
  [400, { codigo: 'DATOS_INVALIDOS', errores: { fechaSesion: 'Revisar' } }, 'invalid'],
  [409, { codigo: 'OPERACION_INCOMPATIBLE' }, 'conflict'],
  [413, {}, 'too-large'],
  [404, {}, 'missing'],
  [503, {}, 'uncertain'],
] as const)('registro interpreta %s sin reintentar', async (status, body, kind) => {
  const f = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal('fetch', f);
  expect((await sesionAPI.register(p, data, new AbortController().signal)).kind).toBe(kind);
  expect(f).toHaveBeenCalledOnce();
});
