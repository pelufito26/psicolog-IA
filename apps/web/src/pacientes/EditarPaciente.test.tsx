import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { EditarPaciente } from './EditarPaciente';
import { Pacientes } from './Pacientes';
import { Acceso } from '../acceso/Acceso';
import { PacienteNoDisponible } from './profile-client';
import type { Edicion, EditResult, LoadEdicion, SaveEdicion } from './edit-client';
const row: Edicion = {
  id: 'uno',
  version: 'X'.repeat(43),
  nombre: 'Demo',
  apellido: 'Perfil',
  fechaNacimiento: '2000-01-01',
  telefono: '0000000',
};
const load = async () => ({ ...row });
afterEach(cleanup);
const saveButton = () => screen.getByRole('button', { name: 'Guardar cambios' });
test('precarga y cancelar no escriben, incluso con borrador', async () => {
  const save = vi.fn<SaveEdicion>(),
    onClose = vi.fn();
  render(<EditarPaciente id="uno" load={load} save={save} onClose={onClose} />);
  expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();
  await screen.findByDisplayValue('Demo');
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '1111111' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onClose).toHaveBeenCalledWith(false);
  expect(save).not.toHaveBeenCalled();
});
test('validaciones y advertencia conservan borrador; cambiar datos invalida confirmación', async () => {
  const save = vi
      .fn<SaveEdicion>()
      .mockResolvedValueOnce({ kind: 'invalid', errors: { telefono: 'Revisá teléfono' } })
      .mockResolvedValue({ kind: 'duplicate', token: 'confirmar' }),
    onClose = vi.fn();
  render(<EditarPaciente id="uno" load={load} save={save} onClose={onClose} />);
  await screen.findByDisplayValue('Demo');
  fireEvent.click(saveButton());
  await screen.findByText('Revisá teléfono');
  expect((screen.getByLabelText(/Nombre/) as HTMLInputElement).value).toBe('Demo');
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '1111111' } });
  fireEvent.click(saveButton());
  await screen.findByText('Posible paciente duplicado');
  fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Otro' } });
  expect(screen.queryByText('Posible paciente duplicado')).toBeNull();
  fireEvent.click(saveButton());
  await screen.findByText('Posible paciente duplicado');
  expect(save.mock.calls[2]?.[1]).toBeUndefined();
  save.mockResolvedValue({ kind: 'updated' });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar de todos modos' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
  expect(save.mock.lastCall?.[1]).toBe('confirmar');
});
test('conflicto conserva borrador y solo recarga mediante acción explícita', async () => {
  const loader = vi
      .fn<LoadEdicion>()
      .mockResolvedValueOnce(row)
      .mockResolvedValue({ ...row, nombre: 'Actual', version: 'Y'.repeat(43) }),
    save = vi.fn<SaveEdicion>().mockResolvedValue({ kind: 'conflict' });
  render(<EditarPaciente id="uno" load={loader} save={save} onClose={() => {}} />);
  await screen.findByDisplayValue('Demo');
  fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Borrador' } });
  fireEvent.click(saveButton());
  await screen.findByText(/cambios más recientes/);
  expect((screen.getByLabelText(/Nombre/) as HTMLInputElement).value).toBe('Borrador');
  expect(loader).toHaveBeenCalledOnce();
  fireEvent.click(saveButton());
  expect(save).toHaveBeenCalledOnce();
  fireEvent.click(
    screen.getByRole('button', { name: 'Descartar borrador y cargar datos actuales' }),
  );
  await screen.findByDisplayValue('Actual');
  expect(loader).toHaveBeenCalledTimes(2);
});
test('un solo envío pendiente y respuesta incierta no se reintenta automáticamente', async () => {
  let done!: (result: EditResult) => void;
  const save = vi.fn<SaveEdicion>(
    () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  );
  render(<EditarPaciente id="uno" load={load} save={save} onClose={() => {}} />);
  await screen.findByDisplayValue('Demo');
  const form = saveButton().closest('form')!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(save).toHaveBeenCalledOnce();
  await act(async () => done({ kind: 'uncertain' }));
  await screen.findByText(/No se pudo confirmar el guardado/);
  expect(save).toHaveBeenCalledOnce();
  expect((screen.getByLabelText(/Nombre/) as HTMLInputElement).value).toBe('Demo');
});
test('carga temporal reintenta y ausencia no permite guardar', async () => {
  const loader = vi
    .fn<LoadEdicion>()
    .mockRejectedValueOnce(new Error('privado'))
    .mockRejectedValue(new PacienteNoDisponible());
  render(<EditarPaciente id="uno" load={loader} onClose={() => {}} />);
  await screen.findByText('No se pudo cargar la edición.');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('El paciente no está disponible.');
  expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();
  expect(screen.queryByText('privado')).toBeNull();
});
test('guardar consulta perfil actualizado y volver conserva página y búsqueda', async () => {
  let telefono = row.telefono;
  const list = vi.fn(async (_q, pagina) => ({
    pacientes: [{ ...row, edad: 26 }],
    pagina,
    haySiguiente: true,
  }));
  const profile = vi.fn(async () => ({ ...row, telefono, edad: 26 }));
  const save: SaveEdicion = async (data) => {
    telefono = data.telefono;
    return { kind: 'updated' };
  };
  render(<Pacientes load={list} profile={profile} editor={{ load, save }} />);
  await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' });
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'Perfil' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página 2');
  fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Demo Perfil' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Editar datos' }));
  await screen.findByDisplayValue('Demo');
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '1111111' } });
  fireEvent.click(saveButton());
  await screen.findByText('Datos del paciente actualizados.');
  await screen.findByText('1111111');
  expect(profile).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }));
  await screen.findByText('Página 2');
  expect(list.mock.lastCall?.slice(0, 2)).toEqual(['Perfil', 2]);
});
test.each(['logout', 'expired', 'account'])(
  'cambio de acceso descarta guardado pendiente: %s',
  async (mode) => {
    let user = 'uno',
      done!: (result: EditResult) => void;
    const call = vi.fn(async (action: string) => ({
      estado: action === 'salir' ? 'anonimo' : 'autenticado',
      usuario: user,
    }));
    const save = vi.fn<SaveEdicion>(
      () =>
        new Promise((resolve) => {
          done = resolve;
        }),
    );
    render(
      <Acceso call={call}>
        <Pacientes
          load={async () => ({ pacientes: [{ ...row, edad: 26 }], pagina: 1, haySiguiente: false })}
          profile={async () => ({ ...row, edad: 26 })}
          editor={{ load, save }}
        />
      </Acceso>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Editar datos' }));
    await screen.findByDisplayValue('Demo');
    fireEvent.click(saveButton());
    if (mode === 'logout') fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    else if (mode === 'expired')
      act(() => window.dispatchEvent(new Event('psico-session-expired')));
    else {
      user = 'dos';
      act(() => window.dispatchEvent(new Event('focus')));
    }
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Editar datos del paciente' })).toBeNull(),
    );
    await act(async () => done({ kind: 'updated' }));
    expect(screen.queryByText('Datos del paciente actualizados.')).toBeNull();
    expect(save.mock.calls[0]?.[2].aborted).toBe(true);
  },
);
