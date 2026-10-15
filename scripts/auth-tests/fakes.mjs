// Test fixture only. Never used by the normal server or real mail adapter.
import { randomUUID } from 'node:crypto';
import { AccessError } from '../../apps/api/dist/modules/acceso/contracts.js';
export function fakeIdentity() {
  const accounts = new Map(),
    links = new Map(),
    outbox = [];
  const issue = (email, type) => {
    const token = randomUUID();
    links.set(token, { email, type });
    outbox.push({ email, type, token });
  };
  const identity = {
    register: async (data) => {
      if (!data.email.toLowerCase().endsWith('@example.invalid'))
        throw new Error('Solo emails ficticios en el harness');
      const email = data.email.toLowerCase();
      if (accounts.has(email)) return;
      accounts.set(email, { ...data, email, id: randomUUID(), confirmed: false });
      issue(email, 'signup');
    },
    confirm: async (token) => {
      const link = links.get(token);
      if (link?.type !== 'signup') throw new Error('invalid');
      accounts.get(link.email).confirmed = true;
      links.delete(token);
    },
    resend: async (email) => {
      if (accounts.has(email.toLowerCase())) issue(email.toLowerCase(), 'signup');
    },
    login: async (email, password) => {
      const row = accounts.get(email.toLowerCase());
      if (!row?.confirmed || row.password !== password)
        throw new AccessError(401, 'CREDENCIALES_INVALIDAS');
      return { id: row.id, email: row.email, nombre: row.nombre, apellido: row.apellido };
    },
    recover: async (email) => {
      if (accounts.has(email.toLowerCase())) issue(email.toLowerCase(), 'recovery');
    },
    reset: async (token, password, before) => {
      const link = links.get(token);
      if (link?.type !== 'recovery') throw new Error('invalid');
      const account = accounts.get(link.email);
      await before(account.id);
      account.password = password;
      links.delete(token);
      return account.id;
    },
  };
  const mail = {
    send: async (email, code) => {
      outbox.push({ email, type: 'code', code });
    },
  };
  return { identity, mail, outbox, accounts };
}
