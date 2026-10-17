import { afterEach, expect, test, vi } from 'vitest';
import { cargarEdicion, guardarEdicion } from './edit-client';
const row = {
  id: 'uno',
  version: 'X'.repeat(43),
  nombre: 'Demo',
  apellido: 'Perfil',
  fechaNacimiento: '2000-01-01',
  telefono: '0000000',
};
afterEach(() => vi.unstubAllGlobals());
test('carga y guardado mantienen cuerpo privado, cancelación y no-store', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json(row))
    .mockResolvedValueOnce(Response.json({ id: 'uno', estado: 'actualizado' }));
  vi.stubGlobal('fetch', fetcher);
  const c = new AbortController();
  expect(await cargarEdicion('uno', c.signal)).toEqual(row);
  expect(await guardarEdicion(row, 'confirmar', c.signal)).toEqual({ kind: 'updated' });
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/pacientes/edicion');
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/pacientes/actualizar');
  const options = fetcher.mock.calls[1]?.[1] as RequestInit;
  expect(options.cache).toBe('no-store');
  expect(JSON.parse(options.body as string)).toEqual({
    ...row,
    confirmacionDuplicado: 'confirmar',
  });
  c.abort();
  expect(options.signal?.aborted).toBe(true);
});
test.each([
  { ...row, id: 'ajeno' },
  { ...row, version: 'timestamp' },
  { ...row, fechaNacimiento: '2000-02-30' },
])('rechaza carga inconsistente %j', async (body) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(body)),
  );
  await expect(cargarEdicion('uno', new AbortController().signal)).rejects.toThrow();
});
test.each([
  [409, { codigo: 'EDICION_CONFLICTO' }, 'conflict'],
  [404, { codigo: 'PACIENTE_NO_DISPONIBLE' }, 'missing'],
  [409, { codigo: 'POSIBLE_DUPLICADO', confirmacionDuplicado: 'token' }, 'duplicate'],
  [400, { codigo: 'DATOS_INVALIDOS', errores: { nombre: 'Revisá' } }, 'invalid'],
  [400, { codigo: 'CONFIRMACION_INVALIDA' }, 'confirmation'],
  [503, {}, 'uncertain'],
])('interpreta resultado %s %j', async (status, body, kind) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(body, { status: status as number })),
  );
  expect((await guardarEdicion(row, undefined, new AbortController().signal)).kind).toBe(kind);
});
test('fallo de red se informa incierto y no se reintenta', async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error('red'));
  vi.stubGlobal('fetch', fetcher);
  expect((await guardarEdicion(row, undefined, new AbortController().signal)).kind).toBe(
    'uncertain',
  );
  expect(fetcher).toHaveBeenCalledOnce();
});
