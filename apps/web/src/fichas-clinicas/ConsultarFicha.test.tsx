import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ConsultarFicha } from './ConsultarFicha';
import { Pacientes } from '../pacientes/Pacientes';
import { Acceso } from '../acceso/Acceso';
import { PacienteFichaNoDisponible } from './client';
import type { ConsultaFicha, ConsultarFicha as Loader } from './consulta-client';
const data: ConsultaFicha = {
  pacienteId: 'p',
  nombre: 'Demo',
  apellido: 'Perfil',
  ficha: {
    id: 'f',
    motivoConsulta: 'Motivo ficticio\n  segunda línea',
    antecedentesPersonales: null,
    antecedentesFamiliares: null,
    medicacion: null,
    evaluacionClinica: null,
    observacionesGenerales: '<script>solo texto</script>',
    fechaCreacion: '2026-10-19T01:30:00.000Z',
    fechaUltimaModificacion: '2026-10-19T02:00:00.000Z',
  },
};
const patient = {
  id: 'p',
  nombre: 'Demo',
  apellido: 'Perfil',
  fechaNacimiento: '2000-01-01',
  edad: 26,
  telefono: '0000000',
};
afterEach(cleanup);
test('lectura completa, texto literal y fechas Montevideo sin controles de escritura', async () => {
  const back = vi.fn();
  const { container } = render(
    <ConsultarFicha pacienteId="p" load={async () => data} onBack={back} />,
  );
  expect(screen.getByText('Cargando ficha clínica…')).toBeTruthy();
  await screen.findByRole('heading', { name: 'Demo Perfil' });
  expect(screen.getByText('Motivo ficticio segunda línea').textContent).toBe(
    data.ficha?.motivoConsulta,
  );
  expect(screen.getAllByText('Sin registrar')).toHaveLength(4);
  expect(screen.getByText('<script>solo texto</script>')).toBeTruthy();
  expect(container.querySelector('script')).toBeNull();
  expect(container.querySelectorAll('dt')).toHaveLength(8);
  const times = [...container.querySelectorAll('time')];
  expect(times[0].textContent).toMatch(/18\/10\/2026.*22:30/);
  expect(times[1].textContent).toMatch(/18\/10\/2026.*23:00/);
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('button', { name: /guardar/i })).toBeNull();
  expect(screen.getByRole('button', { name: 'Editar ficha clínica' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));
  expect(back).toHaveBeenCalledOnce();
});
test('distingue error, reintento, sin ficha y paciente no disponible', async () => {
  const load = vi
    .fn<Loader>()
    .mockRejectedValueOnce(new Error('privado'))
    .mockResolvedValueOnce({ ...data, ficha: null })
    .mockRejectedValueOnce(new PacienteFichaNoDisponible());
  const { rerender } = render(<ConsultarFicha pacienteId="p" load={load} onBack={() => {}} />);
  await screen.findByRole('alert');
  expect(screen.queryByText(/Todavía no tiene/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Crear ficha clínica' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
  await screen.findByText(/Todavía no tiene ficha clínica/);
  rerender(<ConsultarFicha pacienteId="otro" load={load} onBack={() => {}} />);
  expect(screen.queryByRole('heading', { name: 'Demo Perfil' })).toBeNull();
  await screen.findByText('El paciente no está disponible.');
});
test('cambiar paciente aborta consulta y descarta respuesta tardía', async () => {
  let done!: (d: ConsultaFicha) => void;
  const load = vi
    .fn<Loader>()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          done = resolve;
        }),
    )
    .mockResolvedValue({ ...data, pacienteId: 'otro', nombre: 'Otro', ficha: null });
  const { rerender } = render(<ConsultarFicha pacienteId="p" load={load} onBack={() => {}} />);
  rerender(<ConsultarFicha pacienteId="otro" load={load} onBack={() => {}} />);
  await screen.findByRole('heading', { name: 'Otro Perfil' });
  expect(load.mock.calls[0][1].aborted).toBe(true);
  await act(async () => done(data));
  expect(screen.queryByText(/Motivo ficticio/)).toBeNull();
  expect(screen.getByRole('heading', { name: 'Otro Perfil' })).toBeTruthy();
});
test('crear, consultar y regresar conserva filtro, borrador de búsqueda y página', async () => {
  let exists = false;
  const fichas = {
    state: vi.fn(async () => exists),
    create: vi.fn(async () => {
      exists = true;
      return { kind: 'created' as const, id: 'f' };
    }),
  };
  const load = vi.fn(async (_q: string, pagina: number) => ({
    pacientes: [patient],
    pagina,
    haySiguiente: true,
  }));
  const read = vi.fn<Loader>(async () => data);
  render(<Pacientes load={load} profile={async () => patient} fichas={fichas} fichaLoad={read} />);
  await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' });
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'Perfil' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Filtro aplicado: Perfil');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página 2');
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'sin aplicar' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Demo Perfil' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Crear ficha clínica' }));
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Borrador diferente al servidor' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha clínica' }));
  await screen.findByText('Motivo ficticio segunda línea');
  expect(screen.queryByText('Borrador diferente al servidor')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Volver al listado' }));
  await screen.findByText('Página 2');
  expect(load.mock.lastCall?.slice(0, 2)).toEqual(['Perfil', 2]);
  expect((screen.getByLabelText('Buscar por nombre o apellido') as HTMLInputElement).value).toBe(
    'sin aplicar',
  );
});
test.each(['logout', 'expired', 'account'])(
  'limpia contenido y respuestas pendientes al cambiar acceso %s',
  async (mode) => {
    let user = 'uno',
      done!: (d: ConsultaFicha) => void;
    const read = vi
      .fn<Loader>()
      .mockResolvedValueOnce(data)
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            done = resolve;
          }),
      );
    const call = vi.fn(async (action: string) => ({
      estado: action === 'salir' ? 'anonimo' : 'autenticado',
      usuario: user,
    }));
    render(
      <Acceso call={call}>
        <Pacientes
          load={async () => ({ pacientes: [patient], pagina: 1, haySiguiente: false })}
          profile={async () => patient}
          fichas={{ state: async () => true, create: async () => ({ kind: 'exists' }) }}
          fichaLoad={read}
        />
      </Acceso>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha clínica' }));
    await screen.findByText('Motivo ficticio segunda línea');
    fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha clínica' }));
    expect(screen.queryByText('Motivo ficticio segunda línea')).toBeNull();
    if (mode === 'logout') fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    else if (mode === 'expired')
      act(() => window.dispatchEvent(new Event('psico-session-expired')));
    else {
      user = 'dos';
      act(() => window.dispatchEvent(new Event('focus')));
    }
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Consultar ficha clínica' })).toBeNull(),
    );
    await act(async () => done(data));
    expect(read.mock.calls[1][1].aborted).toBe(true);
    expect(screen.queryByText(/Motivo ficticio/)).toBeNull();
  },
);
