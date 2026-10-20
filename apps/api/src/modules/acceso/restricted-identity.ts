import { AccessError, type IdentityProvider } from './contracts.js';

// The pilot does not grant access to other Supabase identities or send them email.
export function restrictedIdentity(
  identity: IdentityProvider,
  allowedEmail?: string,
): IdentityProvider {
  const allowed = (email: string) => !allowedEmail || email.trim().toLowerCase() === allowedEmail;
  return {
    register: async (data) => {
      if (allowed(data.email)) await identity.register(data);
    },
    resend: async (email) => {
      if (allowed(email)) await identity.resend(email);
    },
    recover: async (email) => {
      if (allowed(email)) await identity.recover(email);
    },
    login: async (email, password) => {
      if (!allowed(email)) throw new AccessError(401, 'CREDENCIALES_INVALIDAS');
      const result = await identity.login(email, password);
      if (!allowed(result.email)) throw new AccessError(401, 'CREDENCIALES_INVALIDAS');
      return result;
    },
    confirm: (token) => identity.confirm(token),
    reset: (token, password, before) => {
      // Recovery acceptance is explicitly deferred for the online pilot.
      if (allowedEmail) throw new AccessError(400, 'RECUPERACION_NO_CONFIRMADA');
      return identity.reset(token, password, before);
    },
  };
}
