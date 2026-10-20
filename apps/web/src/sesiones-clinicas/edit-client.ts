import { patientFetch } from '../acceso/client';
import {
  SesionNoDisponible,
  type DatosSesion,
  type EntradaSesion,
  type PacienteSesion,
  type Guardado,
} from './client';
export interface SesionEdicion extends PacienteSesion {
  sesion: EntradaSesion & { anotacionesClinicas: string; version: string };
}
export interface SesionEditor {
  load(patient: string, id: string, signal: AbortSignal): Promise<SesionEdicion>;
  save(
    patient: string,
    id: string,
    version: string,
    fields: DatosSesion,
    signal: AbortSignal,
  ): Promise<Guardado>;
}
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const request = (path: string, body: unknown, signal: AbortSignal) =>
  patientFetch('/api/sesiones-clinicas/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
export const sesionEditor: SesionEditor = {
  load: async (patient, id, signal) => {
    const r = await request('edicion', { pacienteId: patient, sesionId: id }, signal);
    if (r.status === 404) throw new SesionNoDisponible();
    if (!r.ok) throw new Error('Edición no disponible');
    const b = (await r.json()) as SesionEdicion;
    const s = b?.sesion;
    if (
      !uuid(b?.pacienteId) ||
      b.pacienteId.toLowerCase() !== patient.toLowerCase() ||
      !text(b.nombre) ||
      !text(b.apellido) ||
      !s ||
      !uuid(s.id) ||
      s.id.toLowerCase() !== id.toLowerCase() ||
      !text(s.anotacionesClinicas) ||
      typeof s.fechaSesion !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(s.fechaSesion) ||
      s.fechaSesion < '0001-01-01' ||
      new Date(s.fechaSesion + 'T00:00:00Z').toJSON()?.slice(0, 10) !== s.fechaSesion ||
      !text(s.profesional?.nombre) ||
      !text(s.profesional?.apellido) ||
      typeof s.version !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(s.version)
    )
      throw new Error('Respuesta inválida');
    return b;
  },
  save: async (patient, id, version, fields, signal) => {
    try {
      const r = await request(
        'actualizar',
        { pacienteId: patient, sesionId: id, version, ...fields },
        signal,
      );
      if (r.status === 413) return { kind: 'too-large' };
      if (r.status === 404) return { kind: 'missing' };
      const b = (await r.json()) as Record<string, unknown>;
      if (
        r.status === 200 &&
        b?.estado === 'actualizada' &&
        uuid(b.id) &&
        b.id.toLowerCase() === id.toLowerCase()
      )
        return { kind: 'saved', id: b.id };
      if (r.status === 409 && b?.codigo === 'EDICION_CONFLICTO') return { kind: 'conflict' };
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
