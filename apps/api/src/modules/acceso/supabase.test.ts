import { beforeEach, expect, test, vi } from 'vitest';
const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  verifyOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ auth })) }));
import { SupabaseIdentity } from './supabase.js';
const identity = new SupabaseIdentity(
  'https://test.invalid',
  'public-test-key',
  'http://127.0.0.1:5173/',
);
beforeEach(() => {
  vi.resetAllMocks();
});
test('login exige contraseña verificada y email confirmado; metadata no elige identidad', async () => {
  auth.signInWithPassword.mockResolvedValueOnce({
    error: null,
    data: { user: { id: 'real-id', email: 'demo@example.invalid', email_confirmed_at: null } },
  });
  await expect(identity.login('demo@example.invalid', 'ficticia')).rejects.toThrow(
    'CREDENCIALES_INVALIDAS',
  );
  auth.signInWithPassword.mockResolvedValueOnce({
    error: null,
    data: {
      user: {
        id: 'real-id',
        email: 'demo@example.invalid',
        email_confirmed_at: 'date',
        user_metadata: { id: 'atacante', rol: 'admin', nombre: 'Demo', apellido: 'Persona' },
      },
    },
  });
  expect(await identity.login('demo@example.invalid', 'ficticia')).toEqual({
    id: 'real-id',
    email: 'demo@example.invalid',
    nombre: 'Demo',
    apellido: 'Persona',
  });
  expect(auth.signInWithPassword).toHaveBeenLastCalledWith({
    email: 'demo@example.invalid',
    password: 'ficticia',
  });
});
test('recuperación verifica propósito antes de revocar y cambiar password', async () => {
  auth.verifyOtp.mockResolvedValue({
    data: { user: { id: 'user' }, session: { access_token: 'ficticio' } },
    error: null,
  });
  auth.updateUser.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
  const before = vi.fn(async () => {});
  expect(await identity.reset('enlace', 'otra-ficticia-123', before)).toBe('user');
  expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'enlace', type: 'recovery' });
  expect(before).toHaveBeenCalledWith('user');
  expect(before.mock.invocationCallOrder[0]).toBeLessThan(
    auth.updateUser.mock.invocationCallOrder[0],
  );
});
test('enlace inválido no cambia password ni ejecuta callback', async () => {
  auth.verifyOtp.mockResolvedValue({ error: { message: 'privado' }, data: {} });
  const before = vi.fn();
  await expect(identity.reset('invalido', 'otra-ficticia', before)).rejects.toThrow(
    'ENLACE_INVALIDO',
  );
  expect(before).not.toHaveBeenCalled();
  expect(auth.updateUser).not.toHaveBeenCalled();
});
test('confirmación y recuperación se envían por APIs distintas', async () => {
  auth.verifyOtp.mockResolvedValue({ error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  await identity.confirm('enlace');
  await identity.recover('demo@example.invalid');
  expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'enlace', type: 'signup' });
  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('demo@example.invalid', {
    redirectTo: 'http://127.0.0.1:5173/',
  });
});
