import { afterEach, expect, test, vi } from 'vitest';
import { consultar } from './list-client';
afterEach(() => vi.unstubAllGlobals());
test('consulta mantiene búsqueda fuera de URL, sin caché y con cancelación', async () => {
  const fetcher = vi.fn(
    async () =>
      new Response(JSON.stringify({ pacientes: [], pagina: 2, haySiguiente: false }), {
        status: 200,
      }),
  );
  vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  expect(await consultar('José', 2, controller.signal)).toEqual({
    pacientes: [],
    pagina: 2,
    haySiguiente: false,
  });
  const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('/api/pacientes/consulta');
  expect(options.cache).toBe('no-store');
  expect(JSON.parse(options.body as string)).toEqual({ busqueda: 'José', pagina: 2 });
  controller.abort();
  expect(options.signal?.aborted).toBe(true);
});
test.each([
  new Response('{}', { status: 503 }),
  new Response(JSON.stringify({ pacientes: [{ edad: -1 }], pagina: 1, haySiguiente: false })),
])('rechaza error o respuesta inválida', async (response) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response),
  );
  await expect(consultar('', 1, new AbortController().signal)).rejects.toThrow();
});
