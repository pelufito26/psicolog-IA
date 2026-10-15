import { createClient } from '@supabase/supabase-js';
import { AccessError, type IdentityProvider } from './contracts.js';
export class SupabaseIdentity implements IdentityProvider {
  constructor(
    private readonly url: string,
    private readonly key: string,
    private readonly redirect: string,
  ) {}
  private client() {
    return createClient(this.url, this.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(12000) }),
      },
    });
  }
  async register(data: { email: string; password: string; nombre: string; apellido: string }) {
    const { error } = await this.client().auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: this.redirect,
        data: { nombre: data.nombre, apellido: data.apellido },
      },
    });
    if (error) throw new AccessError(400, 'REGISTRO_NO_CONFIRMADO');
  }
  async confirm(hash: string) {
    const { error } = await this.client().auth.verifyOtp({ token_hash: hash, type: 'signup' });
    if (error) throw new AccessError(400, 'ENLACE_INVALIDO');
  }
  async resend(email: string) {
    const { error } = await this.client().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: this.redirect },
    });
    if (error) throw new AccessError(400, 'ENVIO_NO_CONFIRMADO');
  }
  async login(email: string, password: string) {
    const { data, error } = await this.client().auth.signInWithPassword({ email, password });
    if (error || !data.user?.email_confirmed_at || !data.user.email)
      throw new AccessError(401, 'CREDENCIALES_INVALIDAS');
    const { id, user_metadata: meta } = data.user;
    // Metadata supplies display fields only, never identity or authorization.
    if (
      typeof meta.nombre !== 'string' ||
      !meta.nombre.trim() ||
      typeof meta.apellido !== 'string' ||
      !meta.apellido.trim()
    )
      throw new AccessError(400, 'PERFIL_INCOMPLETO');
    return {
      id,
      email: data.user.email,
      nombre: meta.nombre.trim(),
      apellido: meta.apellido.trim(),
    };
  }
  async recover(email: string) {
    const { error } = await this.client().auth.resetPasswordForEmail(email, {
      redirectTo: this.redirect,
    });
    if (error) throw new AccessError(400, 'ENVIO_NO_CONFIRMADO');
  }
  async reset(hash: string, password: string, before: (id: string) => Promise<void>) {
    const client = this.client();
    const { data, error } = await client.auth.verifyOtp({ token_hash: hash, type: 'recovery' });
    if (error || !data.user || !data.session) throw new AccessError(400, 'ENLACE_INVALIDO');
    await before(data.user.id);
    const result = await client.auth.updateUser({ password });
    if (result.error) throw new AccessError(400, 'RECUPERACION_NO_CONFIRMADA');
    await client.auth.signOut();
    return data.user.id;
  }
}
