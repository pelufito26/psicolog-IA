import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { EditarSesion } from './EditarSesion';
import { DetalleSesion } from './DetalleSesion';
import { HistorialSesiones } from './HistorialSesiones';
import { Acceso } from '../acceso/Acceso';
import { SesionNoDisponible, type SesionAPI, type Guardado } from './client';
import type { SesionEditor } from './edit-client';
const identity = { pacienteId: 'p', nombre: 'Demo', apellido: 'Sesión' };
const data = {
  ...identity,
  sesion: {
    id: 's',
    fechaSesion: '1900-01-01',
    anotacionesClinicas: '<b>Nota ficticia</b>\n  línea',
    profesional: { nombre: 'Profesional', apellido: 'Demo' },
    version: 'a'.repeat(43),
  },
};
const detail = {
  ...identity,
  sesion: {
    ...data.sesion,
    fechaCreacion: '2026-10-20T12:00:00Z',
    fechaUltimaModificacion: '2026-10-20T12:00:00Z',
  },
};
function setup() {
  const api = {
    load: vi.fn<SesionEditor['load']>(async () => data),
    save: vi.fn<SesionEditor['save']>(async () => ({ kind: 'saved', id: 's' })),
  };
  const read = vi.fn<SesionAPI['detail']>(async () => detail),
    close = vi.fn();
  return { api, read, close };
}
const notes = () => screen.getByLabelText('Anotaciones clínicas *') as HTMLTextAreaElement;
const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de sesión' }));
const write = (text = 'Borrador ficticio') =>
  fireEvent.change(notes(), { target: { value: text } });
afterEach(cleanup);
test.each(['logout', 'expired', 'account'] as const)(
  'acceso %s descarta editor y respuesta tardía',
  async (mode) => {
    const { api, close } = setup();
    let resolve!: (r: Guardado) => void;
    api.save.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    let user = 'one';
    const call = vi.fn(async (action: string) => ({
      estado: action === 'salir' ? 'anonimo' : 'autenticado',
      usuario: user,
    }));
    render(
      <Acceso call={call}>
        <EditarSesion pacienteId="p" sesionId="s" api={api} onClose={close} />
      </Acceso>,
    );
    await screen.findByLabelText('Fecha de sesión *');
    write();
    save();
    if (mode === 'logout') fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    else if (mode === 'expired')
      act(() => window.dispatchEvent(new Event('psico-session-expired')));
    else {
      user = 'two';
      act(() => window.dispatchEvent(new Event('focus')));
    }
    await waitFor(() => expect(api.save.mock.calls[0][4].aborted).toBe(true));
    await act(async () => resolve({ kind: 'saved', id: 's' }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Borrador ficticio')).toBeNull();
  },
);
test('precarga ambos campos sin max congelado, valida, cancela sin escribir', async () => {
  const { api, read, close } = setup();
  render(<EditarSesion pacienteId="p" sesionId="s" api={api} read={read} onClose={close} />);
  await screen.findByLabelText('Fecha de sesión *');
  expect(notes().value).toBe(data.sesion.anotacionesClinicas);
  expect(screen.getByLabelText('Fecha de sesión *').getAttribute('max')).toBeNull();
  write(' ');
  save();
  await screen.findByText('Ingresá las anotaciones clínicas.');
  expect(api.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar y volver al detalle' }));
  expect(close).toHaveBeenCalledWith(false);
});
test('doble envío bloqueado, cancelar deshabilitado mientras guarda y solo éxito confirmado cierra', async () => {
  const { api, close } = setup();
  let resolve!: (r: Guardado) => void;
  api.save.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(<EditarSesion pacienteId="p" sesionId="s" api={api} onClose={close} />);
  await screen.findByLabelText('Fecha de sesión *');
  write();
  save();
  save();
  fireEvent.submit(notes().closest('form')!);
  expect(api.save).toHaveBeenCalledOnce();
  expect(
    (screen.getByRole('button', { name: 'Cancelar y volver al detalle' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await act(async () => resolve({ kind: 'saved', id: 's' }));
  expect(close).toHaveBeenCalledWith(true);
});
test.each(['conflict', 'uncertain'] as const)(
  '%s conserva borrador, bloquea reenvío, recarga requiere confirmación y fallo conserva',
  async (kind) => {
    const { api, read, close } = setup();
    api.save.mockResolvedValueOnce({ kind });
    render(<EditarSesion pacienteId="p" sesionId="s" api={api} read={read} onClose={close} />);
    await screen.findByLabelText('Fecha de sesión *');
    write();
    save();
    await screen.findByRole('button', { name: 'Recargar datos guardados' });
    expect(notes().value).toBe('Borrador ficticio');
    save();
    expect(api.save).toHaveBeenCalledOnce();
    if (kind === 'uncertain') {
      fireEvent.click(screen.getByRole('button', { name: 'Comprobar sesión actual' }));
      await screen.findByText(
        'Esta lectura no confirma que el intento anterior haya guardado tu borrador.',
      );
      expect(read).toHaveBeenCalledOnce();
      expect(api.save).toHaveBeenCalledOnce();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Recargar datos guardados' }));
    expect(api.load).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Conservar borrador' }));
    expect(notes().value).toBe('Borrador ficticio');
    api.load.mockRejectedValueOnce(new Error('red'));
    fireEvent.click(screen.getByRole('button', { name: 'Recargar datos guardados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar descarte y recargar' }));
    await screen.findByText(
      'No se pudo cargar la edición. El borrador se conserva si ya estaba abierto.',
    );
    expect(notes().value).toBe('Borrador ficticio');
    expect(
      (screen.getByRole('button', { name: 'Guardar cambios de sesión' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    api.load.mockResolvedValueOnce({
      ...data,
      sesion: { ...data.sesion, version: 'b'.repeat(43), anotacionesClinicas: 'Contenido vigente' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Recargar datos guardados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar descarte y recargar' }));
    await waitFor(() => expect(notes().value).toBe('Contenido vigente'));
    save();
    await waitFor(() => expect(close).toHaveBeenCalledWith(true));
    expect(api.save.mock.calls[1][2]).toBe('b'.repeat(43));
  },
);
test.each(['too-large', 'invalid', 'missing'] as const)(
  'respuesta %s conserva borrador y no inventa éxito',
  async (kind) => {
    const { api, close } = setup();
    api.save.mockResolvedValueOnce(
      kind === 'invalid'
        ? { kind, errors: { anotacionesClinicas: 'Error del servidor' } }
        : { kind },
    );
    render(<EditarSesion pacienteId="p" sesionId="s" api={api} onClose={close} />);
    await screen.findByLabelText('Fecha de sesión *');
    write();
    save();
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Cancelar y volver al detalle' }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
    expect(notes().value).toBe('Borrador ficticio');
    expect(close).not.toHaveBeenCalled();
    if (kind === 'invalid') await screen.findByText('Error del servidor');
  },
);
test('carga ausente no habilita editor; temporal permite reintento', async () => {
  const { api, close } = setup();
  api.load.mockRejectedValueOnce(new Error('red'));
  render(<EditarSesion pacienteId="p" sesionId="s" api={api} onClose={close} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Reintentar carga' }));
  await screen.findByLabelText('Fecha de sesión *');
  expect(api.save).not.toHaveBeenCalled();
  cleanup();
  api.load.mockRejectedValueOnce(new SesionNoDisponible());
  render(<EditarSesion pacienteId="p" sesionId="s" api={api} onClose={close} />);
  await screen.findByText('El registro no está disponible.');
  expect(screen.queryByLabelText('Fecha de sesión *')).toBeNull();
});
test.each(['session', 'patient', 'unmount'] as const)(
  'cambio %s descarta borrador y respuesta tardía de guardado',
  async (change) => {
    const { api, close } = setup();
    let resolve!: (r: Guardado) => void;
    api.save.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const view = render(<EditarSesion pacienteId="p" sesionId="s" api={api} onClose={close} />);
    await screen.findByLabelText('Fecha de sesión *');
    write();
    save();
    const signal = api.save.mock.calls[0][4];
    if (change === 'unmount') view.unmount();
    else
      view.rerender(
        <EditarSesion
          pacienteId={change === 'patient' ? 'other' : 'p'}
          sesionId={change === 'session' ? 'other' : 's'}
          api={api}
          onClose={close}
        />,
      );
    await act(async () => resolve({ kind: 'saved', id: 's' }));
    expect(signal.aborted).toBe(true);
    expect(close).not.toHaveBeenCalled();
    if (change !== 'unmount') expect(notes().value).toBe(data.sesion.anotacionesClinicas);
  },
);
test('éxito vuelve a detalle persistido; fallo de lectura conserva confirmación', async () => {
  const { api } = setup();
  const service = {
    detail: vi
      .fn<SesionAPI['detail']>()
      .mockResolvedValueOnce(detail)
      .mockRejectedValueOnce(new Error('red'))
      .mockResolvedValue({
        ...detail,
        sesion: { ...detail.sesion, anotacionesClinicas: 'Persistido' },
      }),
  } as unknown as SesionAPI;
  render(
    <DetalleSesion pacienteId="p" sesionId="s" api={service} editor={api} onBack={() => {}} />,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Editar sesión clínica' }));
  await screen.findByLabelText('Fecha de sesión *');
  write();
  save();
  await screen.findByText('Sesión clínica modificada correctamente.');
  fireEvent.click(await screen.findByRole('button', { name: 'Reintentar detalle' }));
  await screen.findByText('Persistido');
  expect(api.save).toHaveBeenCalledOnce();
});
test('historial página 2 → detalle → editor → detalle → historial conserva página y reconsulta', async () => {
  const { api } = setup();
  const service = {
    history: vi.fn<SesionAPI['history']>(async (_p, pagina) => ({
      ...identity,
      pagina,
      haySiguiente: pagina === 1,
      sesiones: [data.sesion],
    })),
    detail: vi.fn<SesionAPI['detail']>(async () => detail),
  } as unknown as SesionAPI;
  render(<HistorialSesiones pacienteId="p" api={service} editor={api} onBack={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página de sesiones 2');
  fireEvent.click(screen.getByRole('button', { name: /Ver detalle/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Editar sesión clínica' }));
  await screen.findByLabelText('Fecha de sesión *');
  write();
  save();
  await screen.findByText('Sesión clínica modificada correctamente.');
  fireEvent.click(screen.getByRole('button', { name: 'Volver al historial' }));
  await screen.findByText('Página de sesiones 2');
  expect(service.history).toHaveBeenLastCalledWith('p', 2, expect.any(AbortSignal));
});
