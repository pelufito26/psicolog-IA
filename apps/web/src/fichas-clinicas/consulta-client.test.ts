import { afterEach, expect, test, vi } from 'vitest';
import { consultarFicha, type ConsultaFicha } from './consulta-client';
import { PacienteFichaNoDisponible } from './client';
const id = '12345678-1234-4234-8234-123456789abc';
const body: ConsultaFicha = {
  pacienteId: id,
  nombre: 'Demo',
  apellido: 'Ficticio',
  ficha: {
    id,
    motivoConsulta: 'Motivo\n  ficticio',
    antecedentesPersonales: null,
    antecedentesFamiliares: null,
    medicacion: null,
    evaluacionClinica: null,
    observacionesGenerales: '<script>texto</script>',
    fechaCreacion: '2026-10-19T01:30:00.000Z',
    fechaUltimaModificacion: '2026-10-19T02:00:00.000Z',
  },
};
afterEach(() => vi.unstubAllGlobals());
test('consulta usa cuerpo mínimo, no-store y cancelación; conserva texto y ausencia explícita', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json(body))
    .mockResolvedValueOnce(Response.json({ ...body, ficha: null }));
  vi.stubGlobal('fetch', fetcher);
  const c = new AbortController();
  expect(await consultarFicha(id, c.signal)).toEqual(body);
  const [url, options] = fetcher.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('/api/fichas-clinicas/consultar');
  expect(options.method).toBe('POST');
  expect(options.cache).toBe('no-store');
  expect(JSON.parse(options.body as string)).toEqual({ pacienteId: id });
  c.abort();
  expect(options.signal?.aborted).toBe(true);
  expect((await consultarFicha(id, new AbortController().signal)).ficha).toBeNull();
});
test.each([
  null,
  {},
  { ...body, ficha: undefined },
  { ...body, pacienteId: 'otro' },
  { ...body, nombre: '' },
  { ...body, ficha: { ...body.ficha, id: 'no' } },
  { ...body, ficha: { ...body.ficha, motivoConsulta: ' ' } },
  { ...body, ficha: { ...body.ficha, medicacion: 4 } },
  { ...body, ficha: { ...body.ficha, antecedentesFamiliares: undefined } },
  { ...body, ficha: { ...body.ficha, fechaCreacion: 'ayer' } },
  { ...body, ficha: { ...body.ficha, fechaUltimaModificacion: '2026-10-19' } },
])('rechaza respuesta incompleta o inconsistente %j', async (data) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(data)),
  );
  await expect(consultarFicha(id, new AbortController().signal)).rejects.toThrow();
});
test('404 no revela paciente y fallo no se convierte en ausencia ni reintenta', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({}, { status: 404 }))
    .mockResolvedValueOnce(Response.json({}, { status: 503 }))
    .mockRejectedValueOnce(new Error('red'));
  vi.stubGlobal('fetch', fetcher);
  await expect(consultarFicha(id, new AbortController().signal)).rejects.toBeInstanceOf(
    PacienteFichaNoDisponible,
  );
  for (let n = 0; n < 2; n++)
    await expect(consultarFicha(id, new AbortController().signal)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(3);
});
