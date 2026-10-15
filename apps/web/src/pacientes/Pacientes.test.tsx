import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Pacientes } from './Pacientes';
import type { Listado } from './list-client';
afterEach(cleanup);
const page: Listado = {
  pacientes: [{ id: 'a', nombre: 'Paciente', apellido: 'Demo', edad: 26, telefono: '0000000' }],
  pagina: 1,
  haySiguiente: true,
};
test('busca por Enter, conserva filtro al paginar y limpia', async () => {
  const load = vi.fn(async (_q, pagina) => ({ ...page, pagina }));
  render(<Pacientes load={load} />);
  await screen.findByText('Demo');
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: ' Demo ' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Buscar' }).closest('form')!);
  await waitFor(() => expect(load.mock.lastCall?.slice(0, 2)).toEqual(['Demo', 1]));
  await screen.findByText('Demo');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await waitFor(() => expect(load.mock.lastCall?.slice(0, 2)).toEqual(['Demo', 2]));
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
  await waitFor(() => expect(load.mock.lastCall?.slice(0, 2)).toEqual(['', 1]));
});
test('ignora respuesta antigua y distingue error y reintento', async () => {
  let resolve!: (value: Listado) => void;
  const load = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Listado>((done) => {
          resolve = done;
        }),
    )
    .mockRejectedValueOnce(new Error('privado'))
    .mockResolvedValue({ ...page, pacientes: [] });
  render(<Pacientes load={load} />);
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'otro' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByRole('alert');
  resolve(page);
  await waitFor(() => expect(screen.queryByText('Demo')).toBeNull());
  expect(screen.queryByText('privado')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('No hay resultados para esta búsqueda.');
});
test('cancelar y guardar regresan al listado actualizado sin perder filtro', async () => {
  const load = vi.fn(async () => page),
    save = vi.fn(async () => ({ kind: 'created' as const, id: 'nuevo' }));
  render(<Pacientes load={load} save={save} />);
  await screen.findByText('Demo');
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  await screen.findByText('Demo');
  expect(load).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  for (const [label, value] of [
    ['Nombre', 'Demo'],
    ['Apellido', 'Paciente'],
    ['Fecha de nacimiento', '2000-01-01'],
    ['Teléfono', '0000000'],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar paciente' }));
  await screen.findByText('Paciente registrado correctamente.');
  await screen.findByText('Demo');
  expect(load).toHaveBeenCalledTimes(3);
  expect(save).toHaveBeenCalledOnce();
});
test('lista vacía ofrece registrar', async () => {
  render(<Pacientes load={async () => ({ ...page, pacientes: [] })} />);
  await screen.findByText('Todavía no hay pacientes registrados.');
  expect(screen.getByRole('button', { name: 'Registrar paciente' })).toBeTruthy();
});
