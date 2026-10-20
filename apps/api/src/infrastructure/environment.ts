import { createHmac, randomBytes } from 'node:crypto';

export const localOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173'];
export function environment(env: NodeJS.ProcessEnv) {
  const pilot = env.APP_ENV === 'pilot';
  if (env.VERCEL_ENV === 'preview' || (env.VERCEL && env.VERCEL_ENV !== 'production'))
    throw new Error('Entorno no habilitado');
  if (!pilot) {
    if (env.NODE_ENV === 'production' || env.VERCEL || (env.APP_ENV && env.APP_ENV !== 'local'))
      throw new Error('Entorno no habilitado');
    return { pilot: false, origins: localOrigins, secure: false, allowedEmail: undefined };
  }
  const origin = new URL(env.APP_ORIGIN ?? '');
  const email = env.PILOT_ALLOWED_EMAIL?.trim().toLowerCase();
  if (
    origin.protocol !== 'https:' ||
    origin.origin !== env.APP_ORIGIN ||
    origin.username ||
    origin.password ||
    env.AUTH_REDIRECT_URL !== origin.origin + '/' ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !env.AUTH_SECRET ||
    env.AUTH_SECRET.length < 32 ||
    !env.RESOURCE_SIGNING_SECRET ||
    env.RESOURCE_SIGNING_SECRET.length < 32 ||
    env.RESOURCE_SIGNING_SECRET === env.AUTH_SECRET
  )
    throw new Error('Configuración piloto inválida');
  return { pilot: true, origins: [origin.origin], secure: true, allowedEmail: email };
}

export function resourceSecret(env: NodeJS.ProcessEnv, purpose: string) {
  const config = environment(env);
  return config.pilot
    ? createHmac('sha256', env.RESOURCE_SIGNING_SECRET!)
        .update('psicologia:' + purpose)
        .digest()
    : randomBytes(32);
}
