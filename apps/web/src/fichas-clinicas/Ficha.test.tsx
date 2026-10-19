import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { EstadoFicha } from './EstadoFicha';
import { CrearFicha } from './CrearFicha';
import { Pacientes } from '../pacientes/Pacientes';
import { Acceso } from '../acceso/Acceso';
import type { FichaAPI, CreateResult } from './client';
afterEach(cleanup);
const api = () => ({
  state: vi.fn<FichaAPI['state']>(async () => false),
  create: vi.fn<FichaAPI['create']>(async () => ({ kind: 'created', id: 'f' })),
});
test('error de estado no ofrece crear; reintenta y distingue existente', async () => {
  const service = api();
  service.state.mockRejectedValueOnce(new Error('privado')).mockResolvedValue(true);
  render(<EstadoFicha pacienteId="p" api={service} onCreate={() => {}} />);
  await screen.findByRole('alert');
  expect(screen.queryByRole('button', { name: 'Crear ficha clínica' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar estado de ficha' }));
  await screen.findByText('Ficha clínica creada.');
  expect(screen.queryByRole('button', { name: 'Crear ficha clínica' })).toBeNull();
});
test('solo motivo es obligatorio, opcionales vacíos y cancelar no escribe', async () => {
  const service = api(),
    close = vi.fn();
  render(<CrearFicha pacienteId="p" api={service} onClose={close} />);
  const inputs = screen.getAllByRole('textbox') as HTMLTextAreaElement[];
  expect(inputs).toHaveLength(6);
  expect(inputs.filter((i) => i.required)).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText('Ingresá el motivo de consulta.');
  expect(service.create).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Ficticio\n  segunda línea' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar y volver al perfil' }));
  expect(close).toHaveBeenCalledWith(false);
  expect(service.create).not.toHaveBeenCalled();
});
test('errores, límite y conflicto conservan texto sin afirmar que se guardó', async () => {
  const service = api(),
    close = vi.fn();
  service.create
    .mockResolvedValueOnce({ kind: 'invalid', errors: { motivoConsulta: 'Revisá el motivo' } })
    .mockResolvedValueOnce({ kind: 'too-large' })
    .mockResolvedValue({ kind: 'exists' });
  render(<CrearFicha pacienteId="p" api={service} onClose={close} />);
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Borrador ficticio' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText('Revisá el motivo');
  expect((screen.getByLabelText('Motivo de consulta *') as HTMLTextAreaElement).value).toBe(
    'Borrador ficticio',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText(/16 KiB/);
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText(/Ya existe una ficha clínica/);
  expect((screen.getByLabelText('Motivo de consulta *') as HTMLTextAreaElement).value).toBe(
    'Borrador ficticio',
  );
  expect(
    (screen.getByRole('button', { name: 'Guardar ficha' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(close).not.toHaveBeenCalled();
});
test('respuesta incierta permite consultar estado sin descartar ni atribuir el borrador', async () => {
  const service = api(),
    close = vi.fn();
  service.create.mockResolvedValue({ kind: 'uncertain' });
  service.state.mockResolvedValue(true);
  render(<CrearFicha pacienteId="p" api={service} onClose={close} />);
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Texto ficticio' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText(/No se pudo confirmar la creación/);
  expect(service.create).toHaveBeenCalledOnce();
  expect(service.state).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar estado' }));
  await screen.findByText('No se confirmó que la ficha existente contenga este borrador.');
  expect((screen.getByLabelText('Motivo de consulta *') as HTMLTextAreaElement).value).toBe(
    'Texto ficticio',
  );
  expect(service.create).toHaveBeenCalledOnce();
  expect(close).not.toHaveBeenCalled();
});
test('doble envío queda bloqueado y vuelve al perfil solo con éxito confirmado', async () => {
  const service = api(),
    close = vi.fn();
  let done!: (r: CreateResult) => void;
  service.create.mockImplementation(
    () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  );
  render(<CrearFicha pacienteId="p" api={service} onClose={close} />);
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Ficticio' },
  });
  const form = screen.getByRole('button', { name: 'Guardar ficha' }).closest('form')!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(service.create).toHaveBeenCalledOnce();
  await act(async () => done({ kind: 'created', id: 'f' }));
  expect(close).toHaveBeenCalledWith(true);
});
const patient = {
  id: 'p',
  nombre: 'Demo',
  apellido: 'Perfil',
  telefono: '0000000',
  fechaNacimiento: '2000-01-01',
  edad: 26,
};
test('comprobación fallida conserva incertidumbre; ausencia confirmada permite reintento explícito', async () => {
  const service = api();
  service.create.mockResolvedValue({ kind: 'uncertain' });
  service.state.mockRejectedValueOnce(new Error('red')).mockResolvedValue(false);
  render(<CrearFicha pacienteId="p" api={service} onClose={() => {}} />);
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Borrador ficticio' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText(/No se pudo confirmar la creación/);
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar estado' }));
  await screen.findByText(/No se pudo comprobar el estado/);
  expect(
    (screen.getByRole('button', { name: 'Guardar ficha' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar estado' }));
  await screen.findByText(/No se encontró una ficha/);
  expect(
    (screen.getByRole('button', { name: 'Guardar ficha' }) as HTMLButtonElement).disabled,
  ).toBe(false);
  expect(service.create).toHaveBeenCalledOnce();
  expect((screen.getByLabelText('Motivo de consulta *') as HTMLTextAreaElement).value).toBe(
    'Borrador ficticio',
  );
});
test('recorrido crear y volver conserva filtro/página y consulta existencia actual', async () => {
  const service = api();
  let exists = false;
  service.state.mockImplementation(async () => exists);
  service.create.mockImplementation(async () => {
    exists = true;
    return { kind: 'created', id: 'f' };
  });
  const list = vi.fn(async (_q, pagina) => ({ pacientes: [patient], pagina, haySiguiente: true }));
  render(<Pacientes load={list} profile={async () => patient} fichas={service} />);
  await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' });
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'Perfil' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Perfil');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página 2');
  fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Demo Perfil' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Crear ficha clínica' }));
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
    target: { value: 'Motivo ficticio' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
  await screen.findByText('Ficha clínica creada correctamente.');
  await screen.findByText('Ficha clínica creada.');
  expect(screen.queryByRole('button', { name: 'Crear ficha clínica' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }));
  await screen.findByText('Página 2');
  expect(list.mock.lastCall?.slice(0, 2)).toEqual(['Perfil', 2]);
});
test.each(['logout', 'expired', 'account'])(
  'no reaparece contenido tras cambiar acceso: %s',
  async (mode) => {
    let user = 'uno',
      done!: (r: CreateResult) => void;
    const service = api();
    service.create.mockImplementation(
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
          fichas={service}
        />
      </Acceso>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Ver perfil de Demo Perfil' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Crear ficha clínica' }));
    fireEvent.change(screen.getByLabelText('Motivo de consulta *'), {
      target: { value: 'Borrador clínico ficticio' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    if (mode === 'logout') fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    else if (mode === 'expired')
      act(() => window.dispatchEvent(new Event('psico-session-expired')));
    else {
      user = 'dos';
      act(() => window.dispatchEvent(new Event('focus')));
    }
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Crear ficha clínica' })).toBeNull(),
    );
    await act(async () => done({ kind: 'created', id: 'f' }));
    expect(screen.queryByText('Ficha clínica creada correctamente.')).toBeNull();
    expect(service.create.mock.calls[0]?.[2].aborted).toBe(true);
  },
);
