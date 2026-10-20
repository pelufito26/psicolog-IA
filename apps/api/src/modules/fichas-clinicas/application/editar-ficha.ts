import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { camposFicha, validarFicha, type DatosFicha } from '../domain/ficha.js';
import type { FichaHandler } from './ficha.js';
export interface EdicionFicha {
  pacienteId: string;
  nombre: string;
  apellido: string;
  ficha: (DatosFicha & { id: string; stamp: string }) | null;
}
export interface EditFichaRepository {
  loadEdit(professional: string, patient: string): Promise<EdicionFicha | null>;
  update(
    professional: string,
    patient: string,
    data: DatosFicha,
    matches: (id: string, stamp: string) => boolean,
  ): Promise<
    | { kind: 'missing' }
    | { kind: 'absent' }
    | { kind: 'conflict' }
    | { kind: 'updated'; id: string }
  >;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createEditarFicha(
  repository: EditFichaRepository,
  professional: string,
  secret = randomBytes(32),
) {
  const version = (patient: string, id: string, stamp: string) =>
    createHmac('sha256', secret)
      .update(JSON.stringify(['ficha-edicion', professional, patient.toLowerCase(), id, stamp]))
      .digest('base64url');
  const parse = (input: unknown) =>
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : null;
  const missing = { status: 404, body: { codigo: 'PACIENTE_NO_DISPONIBLE' } };
  const invalid = { status: 400, body: { codigo: 'EDICION_INVALIDA' } };
  const load: FichaHandler = async (input) => {
    const body = parse(input);
    if (
      !body ||
      Object.keys(body).some((k) => k !== 'pacienteId') ||
      typeof body.pacienteId !== 'string' ||
      !uuid.test(body.pacienteId)
    )
      return invalid;
    try {
      const row = await repository.loadEdit(professional, body.pacienteId);
      if (!row) return missing;
      if (!row.ficha) return { status: 200, body: { ...row } };
      const { stamp, ...data } = row.ficha;
      return {
        status: 200,
        body: { ...row, ficha: { ...data, version: version(row.pacienteId, data.id, stamp) } },
      };
    } catch {
      return { status: 503, body: { codigo: 'EDICION_NO_DISPONIBLE' } };
    }
  };
  const save: FichaHandler = async (input) => {
    const body = parse(input);
    if (
      !body ||
      Object.keys(body).some((k) => !['pacienteId', 'version', ...camposFicha].includes(k)) ||
      typeof body.pacienteId !== 'string' ||
      !uuid.test(body.pacienteId) ||
      typeof body.version !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(body.version) ||
      camposFicha.some((k) => typeof body[k] !== 'string')
    )
      return invalid;
    const { pacienteId, version: expected, ...fields } = body;
    const parsed = validarFicha(fields);
    if (!parsed.data)
      return { status: 400, body: { codigo: 'DATOS_INVALIDOS', errores: parsed.errors } };
    try {
      const result = await repository.update(professional, pacienteId, parsed.data, (id, stamp) =>
        timingSafeEqual(Buffer.from(expected), Buffer.from(version(pacienteId, id, stamp))),
      );
      if (result.kind === 'missing') return missing;
      if (result.kind === 'absent') return { status: 409, body: { codigo: 'FICHA_AUSENTE' } };
      if (result.kind === 'conflict') return { status: 409, body: { codigo: 'EDICION_CONFLICTO' } };
      return { status: 200, body: { id: result.id, estado: 'actualizada' } };
    } catch {
      return { status: 503, body: { codigo: 'GUARDADO_NO_CONFIRMADO' } };
    }
  };
  return { load, save };
}
