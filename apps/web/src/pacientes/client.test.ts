import { afterEach, expect, test, vi } from 'vitest';
import { savePaciente, uncertain } from './client';
const data = {
  nombre: 'Prueba',
  apellido: 'Demo',
  fechaNacimiento: '2000-01-01',
  telefono: '1234567',
};
afterEach(() => vi.useRealTimers());
test('acepta éxito solo con contrato completo', async () => {
  expect(
    await savePaciente(
      data,
      undefined,
      undefined,
      vi.fn().mockResolvedValue(new Response('{"id":"id","estado":"registrado"}', { status: 201 })),
    ),
  ).toEqual({ kind: 'created', id: 'id' });
  expect(
    await savePaciente(
      data,
      undefined,
      undefined,
      vi.fn().mockResolvedValue(new Response('{}', { status: 201 })),
    ),
  ).toEqual({ kind: 'error', message: uncertain });
});
test('timeout finaliza y no reintenta escritura', async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(() => new Promise<Response>(() => {}));
  const promise = savePaciente(data, undefined, undefined, fetcher);
  await vi.advanceTimersByTimeAsync(12000);
  expect(await promise).toEqual({ kind: 'error', message: uncertain });
  expect(fetcher).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
test('traduce advertencia y errores de campo', async () => {
  expect(
    await savePaciente(
      data,
      undefined,
      undefined,
      vi.fn().mockResolvedValue(
        new Response('{"codigo":"POSIBLE_DUPLICADO","confirmacionDuplicado":"t"}', {
          status: 409,
        }),
      ),
    ),
  ).toEqual({ kind: 'duplicate', token: 't' });
  expect(
    await savePaciente(
      data,
      undefined,
      undefined,
      vi.fn().mockResolvedValue(
        new Response('{"codigo":"DATOS_INVALIDOS","errores":{"nombre":"Inválido"}}', {
          status: 400,
        }),
      ),
    ),
  ).toEqual({ kind: 'invalid', errors: { nombre: 'Inválido' } });
});
