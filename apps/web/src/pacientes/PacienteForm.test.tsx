import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { PacienteForm } from './PacienteForm';
import type { SaveResult } from './client';
afterEach(cleanup);
function fill() {
  for (const [label, value] of [
    ['Nombre', 'Paciente'],
    ['Apellido', 'Demo'],
    ['Fecha de nacimiento', '2000-01-01'],
    ['Teléfono', '+59899123456'],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
}
test('vacíos no envían y cancelar no escribe', () => {
  const save = vi.fn(),
    cancel = vi.fn();
  render(<PacienteForm save={save} onCancel={cancel} />);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getAllByText('Completá este campo.')).toHaveLength(4);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(cancel).toHaveBeenCalledOnce();
});
test('guardia de doble clic, éxito limpia y devuelve foco', async () => {
  let resolve!: (value: SaveResult) => void;
  const save = vi.fn(
    () =>
      new Promise<SaveResult>((done) => {
        resolve = done;
      }),
  );
  render(<PacienteForm save={save} onCancel={() => {}} />);
  fill();
  const button = screen.getByRole('button', { name: 'Registrar paciente' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(save).toHaveBeenCalledTimes(1);
  resolve({ kind: 'created', id: 'id' });
  await screen.findByText('Paciente registrado correctamente.');
  expect((screen.getByLabelText('Nombre', { exact: false }) as HTMLInputElement).value).toBe('');
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre', { exact: false })),
  );
});
test('advertencia permite editar y descarta token anterior', async () => {
  const save = vi.fn().mockResolvedValue({ kind: 'duplicate', token: 'token' });
  render(<PacienteForm save={save} onCancel={() => {}} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  await screen.findByText('Posible paciente duplicado');
  fireEvent.click(screen.getByRole('button', { name: 'Volver a editar' }));
  fireEvent.change(screen.getByLabelText('Nombre', { exact: false }), {
    target: { value: 'Otro' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1][1]).toBeUndefined();
});
test('duplicado exige acción explícita y envía el token', async () => {
  const save = vi
    .fn()
    .mockResolvedValueOnce({ kind: 'duplicate', token: 'token' })
    .mockResolvedValueOnce({ kind: 'created', id: 'id' });
  render(<PacienteForm save={save} onCancel={() => {}} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  await screen.findByText('Posible paciente duplicado');
  expect(save).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar de todos modos' }));
  await screen.findByText('Paciente registrado correctamente.');
  expect(save.mock.calls[1][1]).toBe('token');
});
test('errores de servidor conservan datos y asocian campo', async () => {
  const save = vi.fn().mockResolvedValue({
    kind: 'invalid',
    errors: { fechaNacimiento: 'El nacimiento no puede ser futuro.' },
  });
  render(<PacienteForm save={save} onCancel={() => {}} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  await screen.findByText('El nacimiento no puede ser futuro.');
  expect((screen.getByLabelText('Nombre', { exact: false }) as HTMLInputElement).value).toBe(
    'Paciente',
  );
  expect(
    screen.getByLabelText('Fecha de nacimiento', { exact: false }).getAttribute('aria-invalid'),
  ).toBe('true');
});
test('fallo incierto conserva valores sin éxito falso', async () => {
  const save = vi.fn().mockRejectedValue(new Error('detalle privado'));
  render(<PacienteForm save={save} onCancel={() => {}} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  await screen.findByText(/No se pudo confirmar si el registro se guardó/);
  expect(screen.queryByText('detalle privado')).toBeNull();
  expect((screen.getByLabelText('Nombre', { exact: false }) as HTMLInputElement).value).toBe(
    'Paciente',
  );
});
