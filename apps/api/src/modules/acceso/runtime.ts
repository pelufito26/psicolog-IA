import { Pool } from 'pg';
import { databaseConfig } from '../../infrastructure/database/connection.js';
import { AccessStore } from './store.js';
import { AccessService } from './service.js';
import { SupabaseIdentity } from './supabase.js';
import { accessHttp } from './routes.js';
import type { Mailer } from './contracts.js';
export function createAccessRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  try {
    if (
      env.NODE_ENV === 'production' ||
      !env.AUTH_SECRET ||
      env.AUTH_SECRET.length < 32 ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_PUBLISHABLE_KEY ||
      !env.AUTH_REDIRECT_URL ||
      env.AUTH_MAIL_MODE !== 'resend' ||
      !env.RESEND_API_KEY ||
      !env.AUTH_FROM
    )
      throw new Error();
    if (
      new URL(env.SUPABASE_URL).protocol !== 'https:' ||
      !['http://127.0.0.1:5173/', 'http://localhost:5173/'].includes(env.AUTH_REDIRECT_URL)
    )
      throw new Error();
    const key = env.RESEND_API_KEY,
      from = env.AUTH_FROM;
    const mail: Mailer = {
      send: async (email, code) => {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [email],
            subject: 'Código de ingreso a PsicologIA',
            text: 'Tu código de ingreso es ' + code + '. Vence en cinco minutos.',
          }),
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw new Error('Envío no confirmado');
      },
    };
    pool = new Pool(databaseConfig(env));
    pool.on('error', () => {
      /* No secretos en logs. */
    });
    const service = new AccessService(
      new AccessStore(pool),
      new SupabaseIdentity(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, env.AUTH_REDIRECT_URL),
      mail,
      env.AUTH_SECRET,
    );
    return {
      http: accessHttp(service),
      close: async () => {
        await pool?.end();
      },
    };
  } catch {
    return {
      http: undefined,
      close: async () => {
        await pool?.end();
      },
    };
  }
}
