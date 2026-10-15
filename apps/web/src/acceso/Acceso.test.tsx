import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Acceso } from './Acceso';
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});
test('contraseña sola no muestra pacientes; código y logout cambian acceso', async () => {
  const call = vi.fn(async (action: string) => ({
    estado:
      action === 'estado' || action === 'salir'
        ? 'anonimo'
        : action === 'ingresar'
          ? 'codigo'
          : 'autenticado',
    csrf: 'ficticio',
  }));
  render(
    <Acceso call={call}>
      <p>Pacientes privados</p>
    </Acceso>,
  );
  await screen.findByLabelText('Email');
  expect(screen.queryByText('Pacientes privados')).toBeNull();
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'demo@example.invalid' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'ficticia-123456' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Ingresar' }).closest('form')!);
  await screen.findByText('Código de ingreso');
  expect(screen.queryByText('Pacientes privados')).toBeNull();
  fireEvent.change(screen.getByLabelText('Código de seis dígitos'), {
    target: { value: '123456' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Verificar código' }).closest('form')!);
  await screen.findByText('Pacientes privados');
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  await screen.findByLabelText('Email');
  expect(screen.queryByText('Pacientes privados')).toBeNull();
});
test('registro/reenvío genéricos y error de código sin acceso', async () => {
  const call = vi.fn(async (action: string) => {
    if (action === 'registro') return { estado: 'revisar_correo' };
    return { estado: 'anonimo' };
  });
  render(
    <Acceso call={call}>
      <p>Privado</p>
    </Acceso>,
  );
  await screen.findByLabelText('Email');
  fireEvent.click(screen.getByRole('button', { name: 'Registrar profesional' }));
  for (const [label, value] of [
    ['Nombre', 'Demo'],
    ['Apellido', 'Persona'],
    ['Email', 'demo@example.invalid'],
    ['Contraseña', 'ficticia-123456'],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.submit(screen.getByRole('button', { name: 'Registrar profesional' }).closest('form')!);
  await screen.findByText('Si corresponde, recibirás un correo con los siguientes pasos.');
  expect(screen.queryByText('Privado')).toBeNull();
});
test('sesión vencida desmonta datos y muestra ingreso', async () => {
  render(
    <Acceso call={async () => ({ estado: 'autenticado' })}>
      <p>Privado</p>
    </Acceso>,
  );
  await screen.findByText('Privado');
  window.dispatchEvent(new Event('psico-session-expired'));
  await screen.findByLabelText('Email');
  expect(screen.queryByText('Privado')).toBeNull();
});
test('enlace de recuperación se retira de URL y no abre pacientes', async () => {
  window.history.replaceState(null, '', '/?token_hash=ficticio&type=recovery');
  const call = vi.fn(async () => ({ estado: 'anonimo' }));
  render(
    <Acceso call={call}>
      <p>Privado</p>
    </Acceso>,
  );
  await screen.findByText('Elegir nueva contraseña', { selector: 'h2' });
  expect(window.location.search).toBe('');
  expect(screen.queryByText('Privado')).toBeNull();
});
test('falta configuración falla cerrado y admite reintento', async () => {
  const call = vi
    .fn()
    .mockRejectedValueOnce(new Error('ACCESO_NO_CONFIGURADO'))
    .mockResolvedValue({ estado: 'anonimo' });
  render(
    <Acceso call={call}>
      <p>Privado</p>
    </Acceso>,
  );
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar acceso' }));
  await waitFor(() => expect(screen.getByLabelText('Email')).toBeTruthy());
});
