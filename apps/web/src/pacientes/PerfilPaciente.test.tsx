import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Pacientes } from './Pacientes';
import { PerfilPaciente } from './PerfilPaciente';
import { PacienteNoDisponible, type Perfil, type ConsultarPerfil } from './profile-client';
import { Acceso } from '../acceso/Acceso';
const row: Perfil = {
  id: 'uno',
  nombre: 'Paciente',
  apellido: 'Demo',
  fechaNacimiento: '2000-02-29',
  edad: 26,
  telefono: '0000000',
};
const page = { pacientes: [row], pagina: 1, haySiguiente: true };
afterEach(cleanup);
test('abre perfil y vuelve conservando página, filtro y texto en edición', async () => {
  const load = vi.fn(async (_q, pagina) => ({ ...page, pagina }));
  const profile = vi.fn<ConsultarPerfil>(async () => row);
  render(<Pacientes load={load} profile={profile} />);
  await screen.findByText('Demo');
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'Demo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Demo');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página 2');
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'sin aplicar' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Paciente Demo' }));
  await screen.findByText('29/02/2000');
  expect(profile.mock.calls[0]?.[0]).toBe('uno');
  fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }));
  await screen.findByText('Demo');
  expect(load.mock.lastCall?.slice(0, 2)).toEqual(['Demo', 2]);
  expect((screen.getByLabelText('Buscar por nombre o apellido') as HTMLInputElement).value).toBe(
    'sin aplicar',
  );
  expect(screen.getByText('Filtro aplicado: Demo')).toBeTruthy();
  expect(screen.getByText('Página 2')).toBeTruthy();
});
test('nombres iguales abren el identificador elegido', async () => {
  const profile = vi.fn(async (id) => ({ ...row, id }));
  render(
    <Pacientes
      load={async () => ({ ...page, pacientes: [row, { ...row, id: 'dos' }] })}
      profile={profile}
    />,
  );
  const buttons = await screen.findAllByRole('button', { name: 'Ver perfil de Paciente Demo' });
  fireEvent.click(buttons[1]!);
  await screen.findByText('29/02/2000');
  expect(profile.mock.calls[0]?.[0]).toBe('dos');
});
test('error temporal permite reintentar; ausencia permite volver sin datos anteriores', async () => {
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('interno'))
    .mockResolvedValueOnce(row)
    .mockRejectedValue(new PacienteNoDisponible());
  const onBack = vi.fn();
  const { rerender } = render(<PerfilPaciente id="uno" load={load} onBack={onBack} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('interno')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('29/02/2000');
  rerender(<PerfilPaciente id="dos" load={load} onBack={onBack} />);
  expect(screen.queryByText('29/02/2000')).toBeNull();
  await screen.findByText('El paciente no está disponible.');
  expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }));
  expect(onBack).toHaveBeenCalledOnce();
});
test('ignora respuesta de otro paciente y cancela al salir', async () => {
  let resolve!: (data: Perfil) => void;
  const load = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Perfil>((done) => {
          resolve = done;
        }),
    )
    .mockResolvedValue({ ...row, id: 'dos', nombre: 'Segundo' });
  const { rerender, unmount } = render(<PerfilPaciente id="uno" load={load} onBack={() => {}} />);
  const signal = load.mock.calls[0]![1] as AbortSignal;
  rerender(<PerfilPaciente id="dos" load={load} onBack={() => {}} />);
  await screen.findByText('Segundo');
  await act(async () => resolve({ ...row, nombre: 'Respuesta anterior' }));
  expect(screen.queryByText('Respuesta anterior')).toBeNull();
  expect(signal.aborted).toBe(true);
  unmount();
  expect((load.mock.calls[1]![1] as AbortSignal).aborted).toBe(true);
});
test.each(['logout', 'expired', 'account'])(
  'descarta un perfil pendiente al cambiar acceso: %s',
  async (change) => {
    let user = 'cuenta-uno';
    const call = vi.fn(async (action: string) => ({
      estado: action === 'salir' ? 'anonimo' : 'autenticado',
      usuario: user,
    }));
    let resolve!: (data: Perfil) => void;
    const profile = vi.fn<ConsultarPerfil>(
      () =>
        new Promise<Perfil>((done) => {
          resolve = done;
        }),
    );
    render(
      <Acceso call={call}>
        <Pacientes load={async () => page} profile={profile} />
      </Acceso>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Ver perfil de Paciente Demo' }));
    await screen.findByText('Cargando perfil…');
    if (change === 'logout') fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    else if (change === 'expired')
      act(() => window.dispatchEvent(new Event('psico-session-expired')));
    else {
      user = 'cuenta-dos';
      act(() => window.dispatchEvent(new Event('focus')));
    }
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Perfil del paciente' })).toBeNull(),
    );
    await act(async () => resolve({ ...row, nombre: 'Datos privados anteriores' }));
    expect(screen.queryByText('Datos privados anteriores')).toBeNull();
    expect((profile.mock.calls[0]![1] as AbortSignal).aborted).toBe(true);
  },
);
