import { afterEach, expect, test, vi } from 'vitest';
import { fichaEditor } from './edit-client';
import { PacienteFichaNoDisponible } from './client';
const id = '12345678-1234-4234-8234-123456789abc',
  version = 'a'.repeat(43);
const fields = {
  motivoConsulta: 'Ficticio',
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
  medicacion: '',
  evaluacionClinica: '',
  observacionesGenerales: '',
};
const row = {
  pacienteId: id,
  nombre: 'Demo',
  apellido: 'Ficha',
  ficha: { ...fields, id, version, medicacion: null },
};
afterEach(() => vi.unstubAllGlobals());
test('carga y guardado usan JSON mínimo, no-store y cancelación', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json(row))
    .mockResolvedValueOnce(Response.json({ id, estado: 'actualizada' }));
  vi.stubGlobal('fetch', fetcher);
  const c = new AbortController();
  expect(await fichaEditor.load(id, c.signal)).toEqual(row);
  expect(await fichaEditor.save(id, version, fields, c.signal)).toEqual({ kind: 'saved', id });
  expect(fetcher.mock.calls[0][0]).toBe('/api/fichas-clinicas/edicion');
  expect(fetcher.mock.calls[1][0]).toBe('/api/fichas-clinicas/actualizar');
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ pacienteId: id, version, ...fields });
  expect(fetcher.mock.calls[1][1].cache).toBe('no-store');
  c.abort();
  expect(fetcher.mock.calls[1][1].signal.aborted).toBe(true);
});
test.each([
  {},
  { ...row, ficha: undefined },
  { ...row, pacienteId: 'otro' },
  { ...row, ficha: { ...row.ficha, version: 'no' } },
  { ...row, ficha: { ...row.ficha, medicacion: undefined } },
  { ...row, ficha: { ...row.ficha, motivoConsulta: ' ' } },
])('carga incompleta se rechaza %j', async (data) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(data)),
  );
  await expect(fichaEditor.load(id, new AbortController().signal)).rejects.toThrow();
});
test('carga distingue ausencia autorizada de paciente no disponible', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ ...row, ficha: null }))
      .mockResolvedValueOnce(Response.json({}, { status: 404 })),
  );
  expect((await fichaEditor.load(id, new AbortController().signal)).ficha).toBeNull();
  await expect(fichaEditor.load(id, new AbortController().signal)).rejects.toBeInstanceOf(
    PacienteFichaNoDisponible,
  );
});
test.each([
  [409, 'EDICION_CONFLICTO', 'conflict'],
  [409, 'FICHA_AUSENTE', 'absent'],
  [404, '', 'missing'],
  [413, '', 'too-large'],
  [503, '', 'uncertain'],
  [200, '', 'uncertain'],
] as const)('interpreta resultado %s %s', async (status, codigo, kind) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ codigo }, { status })),
  );
  expect((await fichaEditor.save(id, version, fields, new AbortController().signal)).kind).toBe(
    kind,
  );
});
test('errores por campo se conservan y red incierta no reintenta', async () => {
  const f = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        { codigo: 'DATOS_INVALIDOS', errores: { motivoConsulta: 'Revisar' } },
        { status: 400 },
      ),
    )
    .mockRejectedValueOnce(new Error('red'));
  vi.stubGlobal('fetch', f);
  expect((await fichaEditor.save(id, version, fields, new AbortController().signal)).kind).toBe(
    'invalid',
  );
  expect((await fichaEditor.save(id, version, fields, new AbortController().signal)).kind).toBe(
    'uncertain',
  );
  expect(f).toHaveBeenCalledTimes(2);
});
