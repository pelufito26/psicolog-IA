import { afterEach, expect, test, vi } from 'vitest';
import { checkHealth } from './health';

afterEach(() => vi.useRealTimers());
test('acepta únicamente respuesta válida', async () => {
  await expect(
    checkHealth({ fetcher: vi.fn().mockResolvedValue(new Response('{"status":"ok"}')) }),
  ).resolves.toBeUndefined();
});
test.each([
  new Response('{"status":"ok"}', { status: 503 }),
  new Response('no-json'),
  new Response('{"status":"unknown"}'),
  new Response('null'),
])('rechaza error HTTP o formato inesperado', async (response) => {
  await expect(checkHealth({ fetcher: vi.fn().mockResolvedValue(response) })).rejects.toThrow();
});
test('rechaza fallo de red', async () => {
  await expect(
    checkHealth({ fetcher: vi.fn().mockRejectedValue(new Error('red')) }),
  ).rejects.toThrow();
});
test('termina tras cinco segundos incluso si fetch ignora abort', async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(() => new Promise<Response>(() => {}));
  const pending = expect(checkHealth({ fetcher })).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(5000);
  await pending;
  expect((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].signal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
test('cancela y limpia el temporizador', async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const pending = expect(
    checkHealth({
      signal: controller.signal,
      fetcher: vi.fn(() => new Promise<Response>(() => {})),
    }),
  ).rejects.toThrow();
  controller.abort();
  await pending;
  expect(vi.getTimerCount()).toBe(0);
});
test('no inicia una solicitud ya cancelada', async () => {
  const controller = new AbortController();
  controller.abort();
  const fetcher = vi.fn();
  await expect(checkHealth({ signal: controller.signal, fetcher })).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
