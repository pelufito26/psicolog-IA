import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { hoyClinico, validarSesion, type DatosSesion } from '../domain/sesion.js';
import type { IdentidadPaciente, SesionHandler, EntradaSesion } from './sesiones.js';
export interface EdicionSesion extends IdentidadPaciente {
  sesion: EntradaSesion & { anotacionesClinicas: string; stamp: string };
}
export interface EditSesionRepository {
  loadEdit(professional: string, patient: string, id: string): Promise<EdicionSesion | null>;
  update(
    professional: string,
    patient: string,
    id: string,
    data: DatosSesion,
    matches: (stamp: string) => boolean,
  ): Promise<'missing' | 'conflict' | 'updated'>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createEditarSesion(
  repository: EditSesionRepository,
  professional: string,
  secret = randomBytes(32),
  now = () => new Date(),
) {
  const version = (patient: string, id: string, stamp: string) =>
    createHmac('sha256', secret)
      .update(
        JSON.stringify([
          'sesion-edicion',
          professional.toLowerCase(),
          patient.toLowerCase(),
          id.toLowerCase(),
          stamp,
        ]),
      )
      .digest('base64url');
  const parse = (input: unknown, save: boolean) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const b = input as Record<string, unknown>;
    const keys = [
      'pacienteId',
      'sesionId',
      ...(save ? ['version', 'fechaSesion', 'anotacionesClinicas'] : []),
    ];
    if (
      Object.keys(b).some((k) => !keys.includes(k)) ||
      typeof b.pacienteId !== 'string' ||
      !uuid.test(b.pacienteId) ||
      typeof b.sesionId !== 'string' ||
      !uuid.test(b.sesionId)
    )
      return null;
    return b as Record<string, unknown> & { pacienteId: string; sesionId: string };
  };
  const invalid = { status: 400, body: { codigo: 'EDICION_INVALIDA' } };
  const missing = { status: 404, body: { codigo: 'REGISTRO_NO_DISPONIBLE' } };
  const load: SesionHandler = async (input) => {
    const b = parse(input, false);
    if (!b) return invalid;
    try {
      const row = await repository.loadEdit(professional, b.pacienteId, b.sesionId);
      if (!row) return missing;
      const { stamp, ...data } = row.sesion;
      return {
        status: 200,
        body: { ...row, sesion: { ...data, version: version(row.pacienteId, data.id, stamp) } },
      };
    } catch {
      return { status: 503, body: { codigo: 'EDICION_NO_DISPONIBLE' } };
    }
  };
  const save: SesionHandler = async (input) => {
    const b = parse(input, true);
    if (!b || typeof b.version !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(b.version))
      return invalid;
    const parsed = validarSesion(
      { fechaSesion: b.fechaSesion, anotacionesClinicas: b.anotacionesClinicas },
      hoyClinico(now()),
    );
    if (!parsed.data)
      return { status: 400, body: { codigo: 'DATOS_INVALIDOS', errores: parsed.errors } };
    const expected = b.version;
    try {
      const result = await repository.update(
        professional,
        b.pacienteId,
        b.sesionId,
        parsed.data,
        (stamp) =>
          timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(version(b.pacienteId, b.sesionId, stamp)),
          ),
      );
      if (result === 'missing') return missing;
      if (result === 'conflict') return { status: 409, body: { codigo: 'EDICION_CONFLICTO' } };
      return { status: 200, body: { id: b.sesionId, estado: 'actualizada' } };
    } catch {
      return { status: 503, body: { codigo: 'GUARDADO_NO_CONFIRMADO' } };
    }
  };
  return { load, save };
}
