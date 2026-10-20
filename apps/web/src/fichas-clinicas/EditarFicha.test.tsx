import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { EditarFicha } from './EditarFicha';
import { Pacientes } from '../pacientes/Pacientes';
import { Acceso } from '../acceso/Acceso';
import { PacienteFichaNoDisponible } from './client';
import type { FichaEditor, FichaEdicion, EditResult } from './edit-client';
import type { ConsultaFicha } from './consulta-client';
const fields = {
  motivoConsulta: 'Motivo ficticio',
  antecedentesPersonales: 'Personal',
  antecedentesFamiliares: '',
  medicacion: '',
  evaluacionClinica: '',
  observacionesGenerales: 'Observación',
};
const row: FichaEdicion = {
  pacienteId: 'p',
  nombre: 'Demo',
  apellido: 'Ficha',
  ficha: { ...fields, medicacion: null, id: 'f', version: 'a'.repeat(43) },
};
const stored: ConsultaFicha = {
  ...row,
  ficha: {
    ...fields,
    id: 'f',
    fechaCreacion: '2026-10-20T12:00:00Z',
    fechaUltimaModificacion: '2026-10-20T13:00:00Z',
  },
};
const patient = {
  id: 'p',
  nombre: 'Demo',
  apellido: 'Ficha',
  fechaNacimiento: '2000-01-01',
  edad: 26,
  telefono: '0000000',
};
const api = () => ({
  load: vi.fn<FichaEditor['load']>(async () => row),
  save: vi.fn<FichaEditor['save']>(async () => ({ kind: 'saved', id: 'f' })),
});
const change = (value: string) =>
  fireEvent.change(screen.getByLabelText('Motivo de consulta *'), { target: { value } });
const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de ficha' }));
const draft = () => (screen.getByLabelText('Motivo de consulta *') as HTMLTextAreaElement).value;
afterEach(cleanup);
test('carga seis campos, uno obligatorio, valida y cancelar no escribe', async () => {
  const service = api(),
    close = vi.fn();
  render(<EditarFicha pacienteId="p" api={service} onClose={close} />);
  expect(screen.queryByRole('textbox')).toBeNull();
  await screen.findByRole('heading', { name: 'Demo Ficha' });
  const inputs = screen.getAllByRole('textbox') as HTMLTextAreaElement[];
  expect(inputs).toHaveLength(6);
  expect(inputs.filter((i) => i.required)).toHaveLength(1);
  expect((screen.getByLabelText('Medicación (opcional)') as HTMLTextAreaElement).value).toBe('');
  change(' ');
  save();
  await screen.findByText('Ingresá el motivo de consulta.');
  expect(service.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar y volver a la ficha' }));
  expect(close).toHaveBeenCalledWith(false);
});
test('errores y 413 conservan borrador; doble envío/salida bloqueados durante guardado', async () => {
  let done!: (r: EditResult) => void;
  const service = api(),
    close = vi.fn();
  service.save
    .mockResolvedValueOnce({ kind: 'invalid', errors: { motivoConsulta: 'Revisá el motivo' } })
    .mockResolvedValueOnce({ kind: 'too-large' })
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          done = resolve;
        }),
    );
  render(<EditarFicha pacienteId="p" api={service} onClose={close} />);
  await screen.findByRole('textbox', { name: 'Motivo de consulta *' });
  change('Borrador\n  ficticio');
  save();
  await screen.findByText('Revisá el motivo');
  expect(draft()).toBe('Borrador\n  ficticio');
  save();
  await screen.findByText(/16 KiB/);
  expect(draft()).toBe('Borrador\n  ficticio');
  save();
  save();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar y volver a la ficha' }));
  expect(service.save).toHaveBeenCalledTimes(3);
  expect(close).not.toHaveBeenCalled();
  await act(async () => done({ kind: 'saved', id: 'f' }));
  expect(close).toHaveBeenCalledWith(true);
});
test('conflicto conserva borrador; recarga requiere confirmación y fallo no lo borra', async () => {
  const service = api();
  service.save.mockResolvedValue({ kind: 'conflict' });
  service.load
    .mockResolvedValueOnce(row)
    .mockRejectedValueOnce(new Error('red'))
    .mockResolvedValue({
      ...row,
      ficha: { ...row.ficha!, motivoConsulta: 'Actual del servidor', version: 'b'.repeat(43) },
    });
  render(<EditarFicha pacienteId="p" api={service} onClose={() => {}} />);
  await screen.findByRole('textbox', { name: 'Motivo de consulta *' });
  change('Mi borrador');
  save();
  await screen.findByText(/La ficha cambió/);
  expect(
    (screen.getByRole('button', { name: 'Guardar cambios de ficha' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Recargar datos guardados' }));
  expect(service.load).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Conservar borrador' }));
  expect(draft()).toBe('Mi borrador');
  fireEvent.click(screen.getByRole('button', { name: 'Recargar datos guardados' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar descarte y recargar' }));
  await screen.findByText(/No se pudo cargar la edición/);
  expect(draft()).toBe('Mi borrador');
  expect(
    (screen.getByRole('button', { name: 'Guardar cambios de ficha' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Recargar datos guardados' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar descarte y recargar' }));
  await waitFor(() => expect(draft()).toBe('Actual del servidor'));
  expect(
    (screen.getByRole('button', { name: 'Guardar cambios de ficha' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  change('Nuevo borrador');
  save();
  await screen.findByText(/La ficha cambió/);
  expect(service.save.mock.lastCall?.[1]).toBe('b'.repeat(43));
});
test('respuesta incierta permite comprobar sin reenviar ni atribuir éxito y mantiene borrador', async () => {
  const service = api(),
    close = vi.fn(),
    read = vi.fn().mockRejectedValueOnce(new Error('red')).mockResolvedValue(stored);
  service.save.mockResolvedValue({ kind: 'uncertain' });
  render(<EditarFicha pacienteId="p" api={service} read={read} onClose={close} />);
  await screen.findByRole('textbox', { name: 'Motivo de consulta *' });
  change('Mi borrador incierto');
  save();
  await screen.findByText(/No se pudo confirmar el guardado/);
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar ficha actual' }));
  await screen.findByText(/No se pudo comprobar/);
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar ficha actual' }));
  await screen.findByRole('heading', { name: 'Contenido guardado comprobado' });
  expect(screen.getByText(/Esta lectura no confirma/)).toBeTruthy();
  expect(draft()).toBe('Mi borrador incierto');
  expect(service.save).toHaveBeenCalledOnce();
  expect(
    (screen.getByRole('button', { name: 'Guardar cambios de ficha' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(close).not.toHaveBeenCalled();
});
test.each(['error', 'missing', 'absent'])('carga %s no habilita guardado', async (kind) => {
  const service = api();
  if (kind === 'absent') service.load.mockResolvedValue({ ...row, ficha: null });
  else
    service.load.mockRejectedValue(
      kind === 'missing' ? new PacienteFichaNoDisponible() : new Error('red'),
    );
  render(<EditarFicha pacienteId="p" api={service} onClose={() => {}} />);
  await screen.findByRole('alert');
  expect(screen.queryByRole('button', { name: 'Guardar cambios de ficha' })).toBeNull();
  expect(service.save).not.toHaveBeenCalled();
});
test('guardar vuelve a consultar contenido persistido y conserva contexto del listado', async () => {
  const service = api();
  let value = stored;
  service.save.mockImplementation(async () => {
    value = { ...stored, ficha: { ...stored.ficha!, motivoConsulta: 'Persistido confirmado' } };
    return { kind: 'saved', id: 'f' };
  });
  const list = vi.fn(async (_q: string, pagina: number) => ({
    pacientes: [patient],
    pagina,
    haySiguiente: true,
  }));
  render(
    <Pacientes
      load={list}
      profile={async () => patient}
      fichas={{ state: async () => true, create: async () => ({ kind: 'exists' }) }}
      fichaLoad={async () => value}
      fichaEditor={service}
    />,
  );
  await screen.findByRole('button', { name: 'Ver perfil de Demo Ficha' });
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'Ficha' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Filtro aplicado: Ficha');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  await screen.findByText('Página 2');
  fireEvent.change(screen.getByLabelText('Buscar por nombre o apellido'), {
    target: { value: 'sin aplicar' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ver perfil de Demo Ficha' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha clínica' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Editar ficha clínica' }));
  await screen.findByRole('textbox', { name: 'Motivo de consulta *' });
  change('Borrador distinto');
  save();
  await screen.findByText('Ficha clínica actualizada correctamente.');
  await screen.findByText('Persistido confirmado');
  expect(screen.queryByText('Borrador distinto')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al perfil' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Volver al listado' }));
  await screen.findByText('Página 2');
  expect(list.mock.lastCall?.slice(0, 2)).toEqual(['Ficha', 2]);
  expect((screen.getByLabelText('Buscar por nombre o apellido') as HTMLInputElement).value).toBe(
    'sin aplicar',
  );
});
test.each(['logout', 'expired', 'account', 'patient'])(
  'descarta respuestas de guardado tras cambio %s',
  async (mode) => {
    let user = 'uno',
      done!: (r: EditResult) => void;
    const service = api();
    service.save.mockImplementation(
      () =>
        new Promise((resolve) => {
          done = resolve;
        }),
    );
    const call = vi.fn(async (action: string) => ({
      estado: action === 'salir' ? 'anonimo' : 'autenticado',
      usuario: user,
    }));
    const { rerender } = render(
      <Acceso call={call}>
        <EditarFicha pacienteId="p" api={service} onClose={() => {}} />
      </Acceso>,
    );
    await screen.findByRole('textbox', { name: 'Motivo de consulta *' });
    change('Texto clínico ficticio');
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
          <EditarFicha pacienteId="otro" api={service} onClose={() => {}} />
        </Acceso>,
      );
    await waitFor(() => expect(service.save.mock.calls[0][3].aborted).toBe(true));
    await act(async () => done({ kind: 'saved', id: 'f' }));
    expect(screen.queryByDisplayValue('Texto clínico ficticio')).toBeNull();
  },
);
