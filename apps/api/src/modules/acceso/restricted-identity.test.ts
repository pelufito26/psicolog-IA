import { expect, test, vi } from 'vitest';
import type { IdentityProvider } from './contracts.js';
import { restrictedIdentity } from './restricted-identity.js';
import { AccessService } from './service.js';
import type { AccessStore } from './store.js';

test('cuentas ajenas no invocan Auth ni envían correos; login rechaza también identidad devuelta ajena', async () => {
  const underlying = {
    register: vi.fn(),
    resend: vi.fn(),
    recover: vi.fn(),
    login: vi.fn(),
    confirm: vi.fn(),
    reset: vi.fn(),
  };
  const identity = restrictedIdentity(underlying, 'demo@example.invalid');
  await identity.register({
    email: 'otro@example.invalid',
    password: 'ficticia',
    nombre: 'Demo',
    apellido: 'Otro',
  });
  await identity.resend('otro@example.invalid');
  await identity.recover('otro@example.invalid');
  await expect(identity.login('otro@example.invalid', 'ficticia')).rejects.toMatchObject({
    status: 401,
  });
  for (const key of ['register', 'resend', 'recover', 'login'] as const)
    expect(underlying[key]).not.toHaveBeenCalled();
  underlying.login.mockResolvedValue({ id: 'id', email: 'otro@example.invalid' });
  await expect(identity.login(' DEMO@EXAMPLE.INVALID ', 'ficticia')).rejects.toMatchObject({
    status: 401,
  });
  underlying.login.mockResolvedValue({ id: 'id', email: 'demo@example.invalid' });
  expect((await identity.login('demo@example.invalid', 'ficticia')).id).toBe('id');
  expect(() => identity.reset('token-ficticio', 'password-ficticia', async () => {})).toThrow();
  expect(underlying.reset).not.toHaveBeenCalled();
});
test('reenvío y verificación piloto bloquean intentos previos de una cuenta ajena', async () => {
  const store = {
    pendingIdentity: vi.fn().mockResolvedValue({ email: 'otro@example.invalid' }),
    verify: vi.fn(),
    pending: vi.fn(),
  };
  const mail = { send: vi.fn() };
  const service = new AccessService(
    store as unknown as AccessStore,
    {} as IdentityProvider,
    mail,
    'ficticio',
    undefined,
    'demo@example.invalid',
  );
  await expect(service.resend('ficticio')).rejects.toMatchObject({ status: 401 });
  await expect(service.verify('ficticio', '000000')).rejects.toMatchObject({ status: 401 });
  expect(mail.send).not.toHaveBeenCalled();
  expect(store.pending).not.toHaveBeenCalled();
  expect(store.verify).not.toHaveBeenCalled();
});
