import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { hoyMontevideo, validarPaciente, type DatosPaciente } from '../domain/paciente.js';
import type { RegistroHandler } from './registrar.js';
export interface EdicionLeida extends DatosPaciente {
  id: string;
  stamp: string;
}
export type EditOutcome = { kind: 'updated' | 'missing' | 'conflict' | 'duplicate' };
export interface EdicionRepository {
  load(professional: string, id: string): Promise<EdicionLeida | null>;
  update(
    professional: string,
    id: string,
    data: DatosPaciente,
    stamp: string,
    confirmed: boolean,
  ): Promise<EditOutcome>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const equal = (a: string, b: string) => {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export function createEditar(
  repository: EdicionRepository,
  professional: string,
  options: { secret?: Buffer; now?: () => Date } = {},
) {
  const secret = options.secret ?? randomBytes(32),
    now = options.now ?? (() => new Date());
  const sign = (data: unknown) =>
    createHmac('sha256', secret).update(JSON.stringify(data)).digest('base64url');
  const version = (id: string, stamp: string) =>
    sign(['editar-version', professional, id.toLowerCase(), stamp]);
  const missing = { status: 404, body: { codigo: 'PACIENTE_NO_DISPONIBLE' } };
  const conflict = { status: 409, body: { codigo: 'EDICION_CONFLICTO' } };
  const invalid = { status: 400, body: { codigo: 'EDICION_INVALIDA' } };
  const failure = { status: 503, body: { codigo: 'GUARDADO_NO_CONFIRMADO' } };
  const object = (input: unknown): Record<string, unknown> | null =>
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : null;
  const load: RegistroHandler = async (input) => {
    const body = object(input);
    if (
      !body ||
      Object.keys(body).some((k) => k !== 'id') ||
      typeof body.id !== 'string' ||
      !uuid.test(body.id)
    )
      return invalid;
    try {
      const row = await repository.load(professional, body.id);
      if (!row) return missing;
      return {
        status: 200,
        body: {
          id: row.id,
          nombre: row.nombre,
          apellido: row.apellido,
          fechaNacimiento: row.fechaNacimiento,
          telefono: row.telefono,
          version: version(row.id, row.stamp),
        },
      };
    } catch {
      return { status: 503, body: { codigo: 'EDICION_NO_DISPONIBLE' } };
    }
  };
  const save: RegistroHandler = async (input) => {
    const body = object(input);
    if (
      !body ||
      Object.keys(body).some(
        (k) =>
          ![
            'id',
            'version',
            'nombre',
            'apellido',
            'fechaNacimiento',
            'telefono',
            'confirmacionDuplicado',
          ].includes(k),
      ) ||
      typeof body.id !== 'string' ||
      !uuid.test(body.id) ||
      typeof body.version !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(body.version)
    )
      return invalid;
    const { id, version: requestedVersion, ...fields } = body;
    const parsed = validarPaciente(fields, hoyMontevideo(now()));
    if (!parsed.data)
      return { status: 400, body: { codigo: 'DATOS_INVALIDOS', errores: parsed.errors } };
    const data = parsed.data;
    const digest = sign([
      'editar-duplicado',
      professional,
      id.toLowerCase(),
      requestedVersion,
      data,
    ]);
    let confirmed = false;
    if (body.confirmacionDuplicado !== undefined) {
      const parts = (body.confirmacionDuplicado as string).split('.');
      const expiration = Number(parts[0]);
      if (
        parts.length !== 2 ||
        !Number.isSafeInteger(expiration) ||
        expiration <= now().getTime() ||
        !equal(parts[1] ?? '', sign([digest, expiration]))
      )
        return { status: 400, body: { codigo: 'CONFIRMACION_INVALIDA' } };
      confirmed = true;
    }
    try {
      const row = await repository.load(professional, id);
      if (!row) return missing;
      if (!equal(requestedVersion, version(row.id, row.stamp))) return conflict;
      const outcome = await repository.update(professional, id, data, row.stamp, confirmed);
      if (outcome.kind === 'missing') return missing;
      if (outcome.kind === 'conflict') return conflict;
      if (outcome.kind === 'duplicate') {
        const exp = now().getTime() + 600000;
        return {
          status: 409,
          body: {
            codigo: 'POSIBLE_DUPLICADO',
            confirmacionDuplicado: exp + '.' + sign([digest, exp]),
          },
        };
      }
      return { status: 200, body: { id: row.id, estado: 'actualizado' } };
    } catch {
      return failure;
    }
  };
  return { load, save };
}
