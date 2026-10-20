import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { RegistrarSesion } from './RegistrarSesion';
import { HistorialSesiones } from './HistorialSesiones';
import { DetalleSesion } from './DetalleSesion';
import { SesionNoDisponible, type SesionAPI, type Guardado, type Detalle } from './client';
import { Pacientes } from '../pacientes/Pacientes';
import { Acceso } from '../acceso/Acceso';
const identity = { pacienteId: 'p', nombre: 'Demo', apellido: 'Sesiones' },
  entry = {
    id: 's',
    fechaSesion: '2000-01-01',
    profesional: { nombre: 'Profesional', apellido: 'Demo' },
  };
const detail: Detalle = {
  ...identity,
  sesion: {
    ...entry,
    anotacionesClinicas: '<b>Solo texto ficticio</b>\n  línea',
    fechaCreacion: '2026-10-20T01:30:00Z',
    fechaUltimaModificacion: '2026-10-20T02:00:00Z',
  },
};
const patient = {
  id: 'p',
  nombre: 'Demo',
  apellido: 'Sesiones',
  fechaNacimiento: '2000-01-01',
  edad: 26,
  telefono: '0000000',
};
const api = () => ({
  prepare: vi.fn<SesionAPI['prepare']>(async () => ({ ...identity, hoy: '2026-10-20' })),
  register: vi.fn<SesionAPI['register']>(async () => ({ kind: 'saved', id: 's' })),
  check: vi.fn<SesionAPI['check']>(async () => ({ estado: 'no-confirmada' })),
  history: vi.fn<SesionAPI['history']>(async (_p, pagina) => ({
    ...identity,
    pagina,
    haySiguiente: false,
    sesiones: [],
  })),
  detail: vi.fn<SesionAPI['detail']>(async () => detail),
});
const write = (v: string) =>
  fireEvent.change(screen.getByLabelText('Anotaciones clínicas *'), { target: { value: v } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }));
afterEach(cleanup);
test('preparación fallida no permite alta y reintentar consulta el hoy autorizado', async () => {
  const service = api();
  service.prepare.mockRejectedValueOnce(new Error('red'));
  render(<RegistrarSesion pacienteId="p" api={service} onBack={() => {}} onSaved={() => {}} />);
  await screen.findByText('No se pudo preparar el registro de sesión.');
  expect(screen.queryByRole('button', { name: 'Guardar sesión' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar preparación' }));
  expect(((await screen.findByLabelText('Fecha de sesión *')) as HTMLInputElement).value).toBe(
    '2026-10-20',
  );
  expect(service.register).not.toHaveBeenCalled();
});
test('respuesta tardía del historial no reemplaza otra página', async () => {
  const service = api();
  let done!: (h: Awaited<ReturnType<SesionAPI['history']>>) => void;
  service.history
    .mockResolvedValueOnce({ ...identity, pagina: 1, haySiguiente: true, sesiones: [entry] })
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          done = r;
        }),
    )
    .mockResolvedValue({ ...identity, pagina: 1, haySiguiente: true, sesiones: [entry] });
  const { rerender } = render(<HistorialSesiones pacienteId="p" api={service} onBack={() => {}} />);
  await screen.findByText('Página de sesiones 1');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(screen.queryByText('01/01/2000')).toBeNull();
  rerender(<HistorialSesiones pacienteId="otro" api={service} onBack={() => {}} />);
  await screen.findByText('Página de sesiones 1');
  await act(async () => done({ ...identity, pagina: 2, haySiguiente: false, sesiones: [] }));
  expect(screen.queryByText('Página de sesiones 2')).toBeNull();
  expect(service.history.mock.calls[1][2].aborted).toBe(true);
});
test('fecha de backend y dos campos obligatorios, validar/cancelar no escribe', async () => {
  const service = api(),
    back = vi.fn();
  render(<RegistrarSesion pacienteId="p" api={service} onBack={back} onSaved={() => {}} />);
  expect(screen.queryByLabelText('Fecha de sesión *')).toBeNull();
  const date = (await screen.findByLabelText('Fecha de sesión *')) as HTMLInputElement;
  expect(date.value).toBe('2026-10-20');
  save();
  await screen.findByText('Ingresá las anotaciones clínicas.');
  write('Texto ficticio');
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar y volver al historial' }));
  expect(back).toHaveBeenCalledOnce();
  expect(service.register).not.toHaveBeenCalled();
});
test('formulario abierto durante medianoche no congela el día y el backend rechaza futuro sin perder notas', async () => {
  const service = api(),
    saved = vi.fn();
  service.prepare.mockResolvedValue({ ...identity, hoy: '2026-10-19' });
  service.register
    .mockResolvedValueOnce({
      kind: 'invalid',
      errors: { fechaSesion: 'La fecha de sesión no puede ser futura.' },
    })
    .mockResolvedValueOnce({ kind: 'saved', id: 's' });
  render(<RegistrarSesion pacienteId="p" api={service} onBack={() => {}} onSaved={saved} />);
  const date = (await screen.findByLabelText('Fecha de sesión *')) as HTMLInputElement;
  expect(date.value).toBe('2026-10-19');
  expect(date.hasAttribute('max')).toBe(false);
  write('Borrador cruzando medianoche');
  fireEvent.change(date, { target: { value: '2026-10-21' } });
  save();
  await screen.findByText('La fecha de sesión no puede ser futura.');
  expect((screen.getByLabelText('Anotaciones clínicas *') as HTMLTextAreaElement).value).toBe(
    'Borrador cruzando medianoche',
  );
  fireEvent.change(date, { target: { value: '2026-10-20' } });
  save();
  await waitFor(() => expect(saved).toHaveBeenCalledWith('s'));
  expect(service.register.mock.calls[1][1].fechaSesion).toBe('2026-10-20');
});
test('validación y 413 preservan borrador y un envío bloquea doble click/salida', async () => {
  const service = api(),
    back = vi.fn(),
    saved = vi.fn();
  let done!: (r: Guardado) => void;
  service.register
    .mockResolvedValueOnce({ kind: 'invalid', errors: { fechaSesion: 'Revisar fecha' } })
    .mockResolvedValueOnce({ kind: 'too-large' })
    .mockImplementation(
      () =>
        new Promise((r) => {
          done = r;
        }),
    );
  render(<RegistrarSesion pacienteId="p" api={service} onBack={back} onSaved={saved} />);
  await screen.findByLabelText('Anotaciones clínicas *');
  write('Borrador ficticio');
  save();
  await screen.findByText('Revisar fecha');
  save();
  await screen.findByText(/16 KiB/);
  expect((screen.getByLabelText('Anotaciones clínicas *') as HTMLTextAreaElement).value).toBe(
    'Borrador ficticio',
  );
  save();
  save();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar y volver al historial' }));
  expect(service.register).toHaveBeenCalledTimes(3);
  expect(back).not.toHaveBeenCalled();
  await act(async () => done({ kind: 'saved', id: 's' }));
  expect(saved).toHaveBeenCalledWith('s');
});
test('incertidumbre congela operación y borrador; comprobar y reintentar usa el mismo envío', async () => {
  const service = api(),
    saved = vi.fn();
  service.register
    .mockResolvedValueOnce({ kind: 'uncertain' })
    .mockResolvedValueOnce({ kind: 'saved', id: 's' });
  service.check
    .mockRejectedValueOnce(new Error('red'))
    .mockResolvedValueOnce({ estado: 'no-confirmada' });
  render(<RegistrarSesion pacienteId="p" api={service} onBack={() => {}} onSaved={saved} />);
  await screen.findByLabelText('Anotaciones clínicas *');
  write('Borrador congelado');
  save();
  await screen.findByText(/No se pudo confirmar/);
  const first = service.register.mock.calls[0][1];
  expect((screen.getByLabelText('Anotaciones clínicas *') as HTMLTextAreaElement).disabled).toBe(
    true,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar operación' }));
  await screen.findByText(/No se pudo comprobar/);
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar operación' }));
  await screen.findByText(/todavía no está confirmado/);
  expect(saved).not.toHaveBeenCalled();
  expect(service.register).toHaveBeenCalledOnce();
  expect(service.check.mock.calls[0][1]).toBe(first.operacionId);
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar el mismo envío' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith('s'));
  expect(service.register.mock.calls[1][1]).toEqual(first);
});
test('comprobación confirmada abre resultado sin reenviar', async () => {
  const service = api(),
    saved = vi.fn();
  service.register.mockResolvedValue({ kind: 'uncertain' });
  service.check.mockResolvedValue({ estado: 'registrada', id: 's' });
  render(<RegistrarSesion pacienteId="p" api={service} onBack={() => {}} onSaved={saved} />);
  await screen.findByLabelText('Anotaciones clínicas *');
  write('Nota');
  save();
  await screen.findByText(/No se pudo confirmar/);
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar operación' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith('s'));
  expect(service.register).toHaveBeenCalledOnce();
});
test('historial error no es vacío, reintenta y páginas/detalle conservan contexto', async () => {
  const service = api();
  service.history
    .mockRejectedValueOnce(new Error('red'))
    .mockImplementation(async (_p, pagina) => ({
      ...identity,
      pagina,
      haySiguiente: pagina === 1,
      sesiones: [entry],
    }));
  render(<HistorialSesiones pacienteId="p" api={service} onBack={() => {}} />);
  await screen.findByText('No se pudo consultar el historial.');
  expect(screen.queryByText('Todavía no hay sesiones.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar historial' }));
  await screen.findByText('01/01/2000');
  expect(screen.queryByText(/Solo texto ficticio/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página de sesiones 2');
  fireEvent.click(screen.getByRole('button', { name: /Ver detalle de sesión/ }));
  await screen.findByText('<b>Solo texto ficticio</b> línea');
  expect(screen.getByRole('button', { name: 'Editar sesión clínica' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Eliminar/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al historial' }));
  await screen.findByText('Página de sesiones 2');
});
test('crear desde perfil sin ficha abre detalle persistido y regreso conserva listado', async () => {
  const service = api(),
    list = vi.fn(async (_q: string, pagina: number) => ({
      pacientes: [patient],
      pagina,
      haySiguiente: true,
    }));
  render(
    <Pacientes
      load={list}
      profile={async () => patient}
      fichas={{ state: async () => false, create: async () => ({ kind: 'exists' }) }}
      sesiones={service}
    />,
  );
  await screen.findByRole('button', { name: 'Ver perfil de Demo Sesiones' });
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'Sesiones' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Filtro aplicado: Sesiones');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página 2');
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'sin aplicar' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Demo Sesiones' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Sesiones clínicas' }));
  await screen.findByText('Todavía no hay sesiones.');
  fireEvent.click(screen.getByRole('button', { name: 'Registrar sesión clínica' }));
  await screen.findByLabelText('Anotaciones clínicas *');
  write('Borrador no usado como detalle');
  save();
  await screen.findByText('Sesión clínica registrada correctamente.');
  await screen.findByText('<b>Solo texto ficticio</b> línea');
  expect(screen.queryByText('Borrador no usado como detalle')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al historial' }));
  await screen.findByText('Página de sesiones 1');
  fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Volver al listado' }));
  await screen.findByText('Página 2');
  expect(list.mock.lastCall?.slice(0, 2)).toEqual(['Sesiones', 2]);
  expect((screen.getByLabelText('Buscar por nombre o apellido') as HTMLInputElement).value).toBe(
    'sin aplicar',
  );
});
test('detalle literal, fecha clínica estable y no disponible diferente de error', async () => {
  const service = api();
  service.detail
    .mockRejectedValueOnce(new Error('red'))
    .mockResolvedValueOnce(detail)
    .mockRejectedValueOnce(new SesionNoDisponible());
  const { container, rerender } = render(
    <DetalleSesion pacienteId="p" sesionId="s" api={service} onBack={() => {}} />,
  );
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar detalle' }));
  await screen.findByText('<b>Solo texto ficticio</b> línea');
  expect(container.querySelector('b')).toBeNull();
  expect(screen.getByText('01/01/2000')).toBeTruthy();
  expect(container.querySelector('time')?.textContent).toMatch(/19\/10\/2026.*22:30/);
  rerender(<DetalleSesion pacienteId="p" sesionId="otro" api={service} onBack={() => {}} />);
  expect(screen.queryByText('<b>Solo texto ficticio</b> línea')).toBeNull();
  await screen.findByText('El registro no está disponible.');
});
test.each(['logout', 'expired', 'account', 'patient'])(
  'descarta guardado pendiente al cambiar %s',
  async (mode) => {
    let user = 'uno',
      done!: (r: Guardado) => void;
    const service = api();
    service.register.mockImplementation(
      () =>
        new Promise((r) => {
          done = r;
        }),
    );
    const call = vi.fn(async (action: string) => ({
        estado: action === 'salir' ? 'anonimo' : 'autenticado',
        usuario: user,
      })),
      saved = vi.fn();
    const { rerender } = render(
      <Acceso call={call}>
        <RegistrarSesion pacienteId="p" api={service} onBack={() => {}} onSaved={saved} />
      </Acceso>,
    );
    await screen.findByLabelText('Anotaciones clínicas *');
    write('Anotación ficticia sensible de prueba');
    save();
    if (mode === 'logout') fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    else if (mode === 'expired')
      act(() => window.dispatchEvent(new Event('psico-session-expired')));
    else if (mode === 'account') {
      user = 'dos';
      act(() => window.dispatchEvent(new Event('focus')));
    } else
      rerender(
        <Acceso call={call}>
          <RegistrarSesion pacienteId="otro" api={service} onBack={() => {}} onSaved={saved} />
        </Acceso>,
      );
    await waitFor(() => expect(service.register.mock.calls[0][2].aborted).toBe(true));
    await act(async () => done({ kind: 'saved', id: 's' }));
    expect(saved).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Anotación ficticia sensible de prueba')).toBeNull();
  },
);
test('detalle pendiente de otro paciente se descarta', async () => {
  const service = api();
  let done!: (r: Detalle) => void;
  service.detail
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          done = r;
        }),
    )
    .mockResolvedValue({ ...detail, pacienteId: 'otro', nombre: 'Otro' });
  const { rerender } = render(
    <DetalleSesion pacienteId="p" sesionId="s" api={service} onBack={() => {}} />,
  );
  rerender(<DetalleSesion pacienteId="otro" sesionId="otra" api={service} onBack={() => {}} />);
  await screen.findByRole('heading', { name: 'Otro Sesiones' });
  await act(async () => done(detail));
  expect(screen.queryByRole('heading', { name: 'Demo Sesiones' })).toBeNull();
  expect(service.detail.mock.calls[0][2].aborted).toBe(true);
});
