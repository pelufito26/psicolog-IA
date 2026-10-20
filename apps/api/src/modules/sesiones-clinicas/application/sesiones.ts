import { createHash } from 'node:crypto';
import { hoyClinico, validarSesion, type DatosSesion } from '../domain/sesion.js';
export interface IdentidadPaciente {
  pacienteId: string;
  nombre: string;
  apellido: string;
}
export interface EntradaSesion {
  id: string;
  fechaSesion: string;
  profesional: { nombre: string; apellido: string };
}
export interface DetalleSesion extends EntradaSesion {
  anotacionesClinicas: string;
  fechaCreacion: string;
  fechaUltimaModificacion: string;
}
export interface SesionRepository {
  prepare(professional: string, patient: string): Promise<IdentidadPaciente | null>;
  register(
    professional: string,
    patient: string,
    id: string,
    data: DatosSesion,
  ): Promise<'missing' | 'conflict' | 'created' | 'replayed'>;
  check(professional: string, patient: string, id: string): Promise<null | { registrada: boolean }>;
  history(
    professional: string,
    patient: string,
    page: number,
  ): Promise<
    | null
    | (IdentidadPaciente & { sesiones: EntradaSesion[]; pagina: number; haySiguiente: boolean })
  >;
  detail(
    professional: string,
    patient: string,
    id: string,
  ): Promise<null | (IdentidadPaciente & { sesion: DetalleSesion })>;
}
export interface SesionResult {
  status: number;
  body: Record<string, unknown>;
}
export type SesionHandler = (input: unknown, professional?: string) => Promise<SesionResult>;
export type SesionOperations = Record<
  'prepare' | 'register' | 'check' | 'history' | 'detail' | 'load' | 'save',
  SesionHandler
>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function operationSessionId(professional: string, patient: string, operation: string) {
  const b = createHash('sha256')
    .update(
      JSON.stringify([
        'sesion-registro-v1',
        professional.toLowerCase(),
        patient.toLowerCase(),
        operation.toLowerCase(),
      ]),
    )
    .digest()
    .subarray(0, 16);
  b[6] = (b[6] & 15) | 128;
  b[8] = (b[8] & 63) | 128;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function createSesiones(
  repository: SesionRepository,
  professional: string,
  now = () => new Date(),
): Omit<SesionOperations, 'load' | 'save'> {
  const invalid = { status: 400, body: { codigo: 'CONSULTA_INVALIDA' } };
  const missing = { status: 404, body: { codigo: 'PACIENTE_NO_DISPONIBLE' } };
  const execute =
    (operation: keyof Omit<SesionOperations, 'load' | 'save'>): SesionHandler =>
    async (input) => {
      const b =
        input && typeof input === 'object' && !Array.isArray(input)
          ? (input as Record<string, unknown>)
          : null;
      const extra =
        operation === 'register'
          ? ['operacionId', 'fechaSesion', 'anotacionesClinicas']
          : operation === 'check'
            ? ['operacionId']
            : operation === 'history'
              ? ['pagina']
              : operation === 'detail'
                ? ['sesionId']
                : [];
      if (
        !b ||
        Object.keys(b).some((k) => !['pacienteId', ...extra].includes(k)) ||
        typeof b.pacienteId !== 'string' ||
        !uuid.test(b.pacienteId)
      )
        return invalid;
      if (
        (operation === 'register' || operation === 'check') &&
        (typeof b.operacionId !== 'string' || !uuid.test(b.operacionId))
      )
        return invalid;
      if (operation === 'detail' && (typeof b.sesionId !== 'string' || !uuid.test(b.sesionId)))
        return invalid;
      if (
        operation === 'history' &&
        (typeof b.pagina !== 'number' ||
          !Number.isSafeInteger(b.pagina) ||
          b.pagina < 1 ||
          !Number.isSafeInteger((b.pagina - 1) * 20))
      )
        return invalid;
      try {
        if (operation === 'prepare') {
          const row = await repository.prepare(professional, b.pacienteId);
          return row ? { status: 200, body: { ...row, hoy: hoyClinico(now()) } } : missing;
        }
        if (operation === 'register') {
          const parsed = validarSesion(
            { fechaSesion: b.fechaSesion, anotacionesClinicas: b.anotacionesClinicas },
            hoyClinico(now()),
          );
          if (!parsed.data)
            return { status: 400, body: { codigo: 'DATOS_INVALIDOS', errores: parsed.errors } };
          const id = operationSessionId(professional, b.pacienteId, b.operacionId as string);
          const result = await repository.register(professional, b.pacienteId, id, parsed.data);
          if (result === 'missing') return missing;
          if (result === 'conflict')
            return { status: 409, body: { codigo: 'OPERACION_INCOMPATIBLE' } };
          return { status: result === 'created' ? 201 : 200, body: { id, estado: 'registrada' } };
        }
        if (operation === 'check') {
          const id = operationSessionId(professional, b.pacienteId, b.operacionId as string);
          const result = await repository.check(professional, b.pacienteId, id);
          return result
            ? {
                status: 200,
                body: result.registrada
                  ? { estado: 'registrada', id }
                  : { estado: 'no-confirmada' },
              }
            : missing;
        }
        if (operation === 'history') {
          const row = await repository.history(professional, b.pacienteId, b.pagina as number);
          return row ? { status: 200, body: { ...row } } : missing;
        }
        const row = await repository.detail(professional, b.pacienteId, b.sesionId as string);
        return row
          ? { status: 200, body: { ...row } }
          : { status: 404, body: { codigo: 'REGISTRO_NO_DISPONIBLE' } };
      } catch {
        return {
          status: 503,
          body: {
            codigo: operation === 'register' ? 'REGISTRO_NO_CONFIRMADO' : 'SESIONES_NO_DISPONIBLES',
          },
        };
      }
    };
  return {
    prepare: execute('prepare'),
    register: execute('register'),
    check: execute('check'),
    history: execute('history'),
    detail: execute('detail'),
  };
}
