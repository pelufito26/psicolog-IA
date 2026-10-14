import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from './App';

afterEach(cleanup);
test('muestra identidad, estado pendiente y éxito', async () => {
  let resolve!: () => void;
  const checker = vi.fn(() => new Promise<void>(done => { resolve = done; }));
  render(<App checker={checker} />);
  expect(screen.getByRole('heading', { name: 'PsicologIA' })).toBeTruthy();
  expect(screen.getByText('Base técnica en preparación')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe('Comprobando API…');
  resolve();
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('API disponible'));
  expect(checker).toHaveBeenCalledTimes(1);
});
test('conserva pantalla y comunica el error sin detalles internos', async () => {
  render(<App checker={() => Promise.reject(new Error('detalle interno'))} />);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('No se pudo confirmar la disponibilidad de la API'));
  expect(screen.queryByText('detalle interno')).toBeNull();
  expect(screen.getByRole('heading', { name: 'PsicologIA' })).toBeTruthy();
});
test('aborta al desmontar y tolera respuesta tardía', async () => {
  let signal!: AbortSignal;
  let resolve!: () => void;
  const view = render(<App checker={value => { signal = value!; return new Promise<void>(done => { resolve = done; }); }} />);
  view.unmount();
  expect(signal.aborted).toBe(true);
  resolve();
  await Promise.resolve();
  expect(screen.queryByRole('status')).toBeNull();
});
