import { afterEach, expect, test, vi } from 'vitest';
import { fichaAPI, PacienteFichaNoDisponible, labelsFicha, type FichaInput } from './client';
const fields = Object.fromEntries(
  Object.keys(labelsFicha).map((k) => [k, k === 'motivoConsulta' ? 'Motivo ficticio' : '']),
) as FichaInput;
afterEach(() => vi.unstubAllGlobals());
test('estado y creación usan JSON, cancelación y no-store', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ existe: false }))
    .mockResolvedValueOnce(Response.json({ id: 'f', estado: 'creada' }, { status: 201 }));
  vi.stubGlobal('fetch', fetcher);
  const c = new AbortController();
  expect(await fichaAPI.state('paciente', c.signal)).toBe(false);
  expect(await fichaAPI.create('paciente', fields, c.signal)).toEqual({ kind: 'created', id: 'f' });
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/fichas-clinicas/estado');
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/fichas-clinicas/crear');
  const options = fetcher.mock.calls[1]?.[1] as RequestInit;
  expect(options.cache).toBe('no-store');
  expect(JSON.parse(options.body as string)).toEqual({ pacienteId: 'paciente', ...fields });
  c.abort();
  expect(options.signal?.aborted).toBe(true);
});
test.each([{}, { existe: 'false' }, null])(
  'estado inválido no equivale a ausencia: %j',
  async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body)),
    );
    await expect(fichaAPI.state('p', new AbortController().signal)).rejects.toThrow();
  },
);
test('404 de estado no revela contenido', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 404 })),
  );
  await expect(fichaAPI.state('p', new AbortController().signal)).rejects.toBeInstanceOf(
    PacienteFichaNoDisponible,
  );
});
test.each([
  [409, { codigo: 'FICHA_YA_EXISTE' }, 'exists'],
  [413, {}, 'too-large'],
  [404, {}, 'missing'],
  [400, { codigo: 'DATOS_INVALIDOS', errores: { motivoConsulta: 'Obligatorio' } }, 'invalid'],
  [503, {}, 'uncertain'],
])('interpreta creación %s', async (status, body, kind) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(body, { status: status as number })),
  );
  expect((await fichaAPI.create('p', fields, new AbortController().signal)).kind).toBe(kind);
});
test('red incierta no se reintenta ni se afirma éxito', async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error('red'));
  vi.stubGlobal('fetch', fetcher);
  expect((await fichaAPI.create('p', fields, new AbortController().signal)).kind).toBe('uncertain');
  expect(fetcher).toHaveBeenCalledOnce();
});
