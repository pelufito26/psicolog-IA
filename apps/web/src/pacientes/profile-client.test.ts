import { afterEach, expect, test, vi } from 'vitest';
import { consultarPerfil, PacienteNoDisponible } from './profile-client';
const row = {
  id: 'id-ficticio',
  nombre: 'Demo',
  apellido: 'Paciente',
  edad: 26,
  fechaNacimiento: '2000-01-01',
  telefono: '0000000',
};
afterEach(() => vi.unstubAllGlobals());
test('consulta por cuerpo, sin caché, valida identidad y propaga cancelación', async () => {
  const fetcher = vi.fn(async () => Response.json(row));
  vi.stubGlobal('fetch', fetcher);
  const c = new AbortController();
  expect(await consultarPerfil(row.id, c.signal)).toEqual(row);
  const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('/api/pacientes/perfil');
  expect(options.cache).toBe('no-store');
  expect(JSON.parse(options.body as string)).toEqual({ id: row.id });
  c.abort();
  expect(options.signal?.aborted).toBe(true);
});
test.each([
  { ...row, id: 'otro' },
  { ...row, edad: -1 },
  { ...row, fechaNacimiento: '2000-02-30' },
  { ...row, fechaNacimiento: 'no-fecha' },
])('rechaza perfil inconsistente %j', async (body) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(body)),
  );
  await expect(consultarPerfil(row.id, new AbortController().signal)).rejects.toThrow();
});
test('distingue no disponible de fallo temporal', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 404 })),
  );
  await expect(consultarPerfil(row.id, new AbortController().signal)).rejects.toBeInstanceOf(
    PacienteNoDisponible,
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 503 })),
  );
  await expect(consultarPerfil(row.id, new AbortController().signal)).rejects.not.toBeInstanceOf(
    PacienteNoDisponible,
  );
});
