import { patientFetch } from '../acceso/client';
export interface PacienteSesion {
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
export interface DatosSesion {
  fechaSesion: string;
  anotacionesClinicas: string;
}
export interface EnvioSesion extends DatosSesion {
  operacionId: string;
}
export interface Historial extends PacienteSesion {
  sesiones: EntradaSesion[];
  pagina: number;
  haySiguiente: boolean;
}
export interface Detalle extends PacienteSesion {
  sesion: DetalleSesion;
}
export type Guardado =
  | { kind: 'saved'; id: string }
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'too-large' | 'missing' | 'conflict' | 'uncertain' };
export interface SesionAPI {
  prepare: (patient: string, signal: AbortSignal) => Promise<PacienteSesion & { hoy: string }>;
  register: (patient: string, data: EnvioSesion, signal: AbortSignal) => Promise<Guardado>;
  check: (
    patient: string,
    operation: string,
    signal: AbortSignal,
  ) => Promise<{ estado: 'registrada'; id: string } | { estado: 'no-confirmada' }>;
  history: (patient: string, page: number, signal: AbortSignal) => Promise<Historial>;
  detail: (patient: string, id: string, signal: AbortSignal) => Promise<Detalle>;
}
export class SesionNoDisponible extends Error {}
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const date = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  v >= '0001-01-01' &&
  new Date(v + 'T00:00:00Z').toJSON()?.slice(0, 10) === v;
const instant = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) &&
  Number.isFinite(Date.parse(v));
const identity = (b: PacienteSesion, patient: string) =>
  !!b &&
  uuid(b.pacienteId) &&
  b.pacienteId.toLowerCase() === patient.toLowerCase() &&
  text(b.nombre) &&
  text(b.apellido);
const entry = (e: EntradaSesion) =>
  !!e &&
  uuid(e.id) &&
  date(e.fechaSesion) &&
  !!e.profesional &&
  text(e.profesional.nombre) &&
  text(e.profesional.apellido);
const request = (path: string, body: unknown, signal: AbortSignal) =>
  patientFetch('/api/sesiones-clinicas/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
async function read<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const r = await request(path, body, signal);
  if (r.status === 404) throw new SesionNoDisponible();
  if (!r.ok) throw new Error('Sesiones no disponibles');
  return (await r.json()) as T;
}
export const sesionAPI: SesionAPI = {
  prepare: async (patient, signal) => {
    const b = await read<PacienteSesion & { hoy: string }>(
      'preparar',
      { pacienteId: patient },
      signal,
    );
    if (!identity(b, patient) || !date(b.hoy)) throw new Error('Respuesta inválida');
    return b;
  },
  history: async (patient, page, signal) => {
    const b = await read<Historial>('historial', { pacienteId: patient, pagina: page }, signal);
    if (
      !identity(b, patient) ||
      b.pagina !== page ||
      typeof b.haySiguiente !== 'boolean' ||
      !Array.isArray(b.sesiones) ||
      b.sesiones.length > 20 ||
      !b.sesiones.every(entry)
    )
      throw new Error('Respuesta inválida');
    return b;
  },
  detail: async (patient, id, signal) => {
    const b = await read<Detalle>('detalle', { pacienteId: patient, sesionId: id }, signal);
    if (
      !identity(b, patient) ||
      !entry(b.sesion) ||
      b.sesion.id.toLowerCase() !== id.toLowerCase() ||
      !text(b.sesion.anotacionesClinicas) ||
      !instant(b.sesion.fechaCreacion) ||
      !instant(b.sesion.fechaUltimaModificacion)
    )
      throw new Error('Respuesta inválida');
    return b;
  },
  check: async (patient, operation, signal) => {
    const b = await read<{ estado: string; id?: unknown }>(
      'comprobar',
      { pacienteId: patient, operacionId: operation },
      signal,
    );
    if (b?.estado === 'registrada' && uuid(b.id)) return { estado: 'registrada', id: b.id };
    if (b?.estado === 'no-confirmada') return { estado: 'no-confirmada' };
    throw new Error('Respuesta inválida');
  },
  register: async (patient, data, signal) => {
    try {
      const r = await request('registrar', { pacienteId: patient, ...data }, signal);
      if (r.status === 413) return { kind: 'too-large' };
      if (r.status === 404) return { kind: 'missing' };
      const b = (await r.json()) as Record<string, unknown>;
      if ((r.status === 200 || r.status === 201) && b?.estado === 'registrada' && uuid(b.id))
        return { kind: 'saved', id: b.id };
      if (r.status === 409 && b?.codigo === 'OPERACION_INCOMPATIBLE') return { kind: 'conflict' };
      if (
        r.status === 400 &&
        b?.codigo === 'DATOS_INVALIDOS' &&
        b.errores &&
        typeof b.errores === 'object' &&
        !Array.isArray(b.errores) &&
        Object.values(b.errores).every((v) => typeof v === 'string')
      )
        return { kind: 'invalid', errors: b.errores as Record<string, string> };
      return { kind: 'uncertain' };
    } catch {
      return { kind: 'uncertain' };
    }
  },
};
export const fechaClinica = (value: string) => value.split('-').reverse().join('/');
export const fechaTecnica = (value: string) =>
  new Intl.DateTimeFormat('es-UY', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
