import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { validarPaciente, hoyMontevideo, type DatosPaciente } from '../domain/paciente.js';
export type Outcome = { kind: 'missing' } | { kind: 'duplicate' } | { kind: 'created'; id: string };
export interface RegistroRepository {
  register(professional: string, data: DatosPaciente, confirmed: boolean): Promise<Outcome>;
}
export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}
export type RegistroHandler = (input: unknown) => Promise<ApiResult>;
export function createRegistrar(
  repository: RegistroRepository,
  professional: string,
  options: { now?: () => Date; secret?: Buffer } = {},
): RegistroHandler {
  const secret = options.secret ?? randomBytes(32);
  const now = options.now ?? (() => new Date());
  const digest = (data: DatosPaciente) =>
    createHash('sha256')
      .update(
        JSON.stringify([
          professional,
          data.nombre,
          data.apellido,
          data.fechaNacimiento,
          data.telefono,
        ]),
      )
      .digest('hex');
  const sign = (body: string) => createHmac('sha256', secret).update(body).digest('base64url');
  return async (input) => {
    const parsed = validarPaciente(input, hoyMontevideo(now()));
    if (!parsed.data)
      return { status: 400, body: { codigo: 'DATOS_INVALIDOS', errores: parsed.errors } };
    const data = parsed.data;
    const token = (input as Record<string, unknown>).confirmacionDuplicado;
    let confirmed = false;
    if (token !== undefined) {
      try {
        const [body, signature, ...extra] = (token as string).split('.');
        const expected = Buffer.from(sign(body ?? ''), 'base64url');
        const actual = Buffer.from(signature ?? '', 'base64url');
        if (
          extra.length ||
          !body ||
          expected.length !== actual.length ||
          !timingSafeEqual(expected, actual)
        )
          throw new Error();
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (
          payload.digest !== digest(data) ||
          typeof payload.exp !== 'number' ||
          payload.exp <= now().getTime()
        )
          throw new Error();
        confirmed = true;
      } catch {
        return { status: 409, body: { codigo: 'CONFIRMACION_INVALIDA' } };
      }
    }
    try {
      const outcome = await repository.register(professional, data, confirmed);
      if (outcome.kind === 'missing')
        return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
      if (outcome.kind === 'duplicate') {
        const payload = Buffer.from(
          JSON.stringify({ digest: digest(data), exp: now().getTime() + 600000 }),
        ).toString('base64url');
        return {
          status: 409,
          body: {
            codigo: 'POSIBLE_DUPLICADO',
            confirmacionDuplicado: payload + '.' + sign(payload),
          },
        };
      }
      return { status: 201, body: { id: outcome.id, estado: 'registrado' } };
    } catch {
      return { status: 503, body: { codigo: 'REGISTRO_NO_CONFIRMADO' } };
    }
  };
}
