import express, { type Request, type Response, type NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { AccessError } from './contracts.js';
import { AccessService, opaque } from './service.js';
export interface AccessContext {
  professional: string;
  user: string;
}
const origins = ['http://127.0.0.1:5173', 'http://localhost:5173'];
function token(req: Request) {
  const match = req.headers.cookie
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith('psico_sesion='));
  return match?.slice('psico_sesion='.length) ?? '';
}
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function cookie(res: Response, value: string, secure: boolean) {
  res.cookie('psico_sesion', value, {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: 28800000,
  });
}
function text(body: Record<string, unknown>, name: string) {
  const value = body[name];
  if (typeof value !== 'string' || !value.trim()) throw new AccessError(400, 'DATOS_INVALIDOS');
  return value;
}
function fields(input: unknown, allowed: string[]) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((k) => !allowed.includes(k))
  )
    throw new AccessError(400, 'DATOS_INVALIDOS');
  return input as Record<string, unknown>;
}
function password(body: Record<string, unknown>) {
  const value = text(body, 'password');
  if (value.length < 12 || value.length > 128) throw new AccessError(400, 'PASSWORD_INVALIDA');
  return value;
}
export function accessHttp(service: AccessService, secure = false, simulation = false) {
  const router = express.Router();
  const csrf = (req: Request) => {
    const t = token(req);
    if (
      !t ||
      !origins.includes(req.get('origin') ?? '') ||
      !equal(req.get('x-csrf-token') ?? '', service.csrf(t))
    )
      throw new AccessError(403, 'SOLICITUD_NO_PERMITIDA');
  };
  const handle =
    (action: (req: Request, res: Response) => Promise<void>) =>
    async (req: Request, res: Response) => {
      res.set('Cache-Control', 'no-store');
      try {
        await action(req, res);
      } catch (e) {
        const error = e instanceof AccessError ? e : new AccessError(503, 'ACCESO_NO_DISPONIBLE');
        res.status(error.status).json({ codigo: error.code });
      }
    };
  router.get(
    '/estado',
    handle(async (req, res) => {
      const t = /^[A-Za-z0-9_-]{43}$/.test(token(req)) ? token(req) : opaque();
      const session = await service.session(t);
      cookie(res, t, secure);
      res.json({
        estado: session ? 'autenticado' : 'anonimo',
        csrf: service.csrf(t),
        simulado: simulation,
        usuario: session?.usuario,
      });
    }),
  );
  router.use(
    (req, res, next) => {
      res.set('Cache-Control', 'no-store');
      try {
        csrf(req);
        if (!req.is('application/json')) throw new AccessError(415, 'TIPO_NO_PERMITIDO');
        next();
      } catch (e) {
        next(e);
      }
    },
    express.json({ limit: '16kb' }),
  );
  router.post(
    '/ingresar',
    handle(async (req, res) => {
      await service.throttle(req.socket.remoteAddress ?? 'local');
      const b = fields(req.body, ['email', 'password']);
      const t = await service.login(text(b, 'email'), text(b, 'password'));
      cookie(res, t, secure);
      res.json({ estado: 'codigo', csrf: service.csrf(t) });
    }),
  );
  router.post(
    '/reenviar-codigo',
    handle(async (req, res) => {
      await service.throttle(req.socket.remoteAddress ?? 'local');
      fields(req.body, []);
      const t = await service.resend(token(req));
      cookie(res, t, secure);
      res.json({ estado: 'codigo', csrf: service.csrf(t) });
    }),
  );
  router.post(
    '/verificar',
    handle(async (req, res) => {
      await service.throttle(req.socket.remoteAddress ?? 'local');
      const b = fields(req.body, ['codigo']);
      const code = text(b, 'codigo');
      if (!/^\d{6}$/.test(code)) throw new AccessError(400, 'CODIGO_INVALIDO');
      const t = await service.verify(token(req), code);
      cookie(res, t, secure);
      const session = await service.session(t);
      res.json({ estado: 'autenticado', csrf: service.csrf(t), usuario: session?.usuario });
    }),
  );
  for (const path of ['registro', 'reenviar-confirmacion', 'recuperar'])
    router.post(
      '/' + path,
      handle(async (req, res) => {
        await service.throttle(req.socket.remoteAddress ?? 'local');
        const b = fields(
          req.body,
          path === 'registro' ? ['email', 'password', 'nombre', 'apellido'] : ['email'],
        );
        const email = text(b, 'email').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          throw new AccessError(400, 'DATOS_INVALIDOS');
        const data =
          path === 'registro'
            ? {
                email,
                password: password(b),
                nombre: text(b, 'nombre').trim(),
                apellido: text(b, 'apellido').trim(),
              }
            : undefined;
        try {
          if (data) await service.identity.register(data);
          else if (path === 'recuperar') await service.identity.recover(email);
          else await service.identity.resend(email);
        } catch {
          /* Generic result does not enumerate accounts. */
        }
        res.json({ estado: 'revisar_correo' });
      }),
    );
  router.post(
    '/confirmar',
    handle(async (req, res) => {
      await service.throttle(req.socket.remoteAddress ?? 'local');
      const b = fields(req.body, ['token']);
      await service.identity.confirm(text(b, 'token'));
      res.json({ estado: 'confirmado' });
    }),
  );
  router.post(
    '/nueva-password',
    handle(async (req, res) => {
      await service.throttle(req.socket.remoteAddress ?? 'local');
      const b = fields(req.body, ['token', 'password']);
      await service.reset(text(b, 'token'), password(b));
      await service.logout(token(req));
      const t = opaque();
      cookie(res, t, secure);
      res.json({ estado: 'ingresar', csrf: service.csrf(t) });
    }),
  );
  router.post(
    '/salir',
    handle(async (req, res) => {
      fields(req.body, []);
      await service.logout(token(req));
      const t = opaque();
      cookie(res, t, secure);
      res.json({ estado: 'anonimo', csrf: service.csrf(t) });
    }),
  );
  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    const typed = error as { type?: string };
    const e =
      error instanceof AccessError
        ? error
        : new AccessError(typed.type === 'entity.too.large' ? 413 : 400, 'SOLICITUD_INVALIDA');
    res.status(e.status).json({ codigo: e.code });
  });
  const guard = async (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store');
    try {
      csrf(req);
      const session = await service.session(token(req));
      if (!session) throw new AccessError(401, 'INGRESO_REQUERIDO');
      res.locals.access = {
        professional: session.profesional,
        user: session.usuario,
      } satisfies AccessContext;
      next();
    } catch (e) {
      const err = e instanceof AccessError ? e : new AccessError(503, 'ACCESO_NO_DISPONIBLE');
      res.status(err.status).json({ codigo: err.code });
    }
  };
  return { router, guard };
}
