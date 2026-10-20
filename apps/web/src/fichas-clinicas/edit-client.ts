import { patientFetch } from '../acceso/client';
import { labelsFicha, PacienteFichaNoDisponible, type FichaInput } from './client';
export interface FichaEdicion {
  pacienteId: string;
  nombre: string;
  apellido: string;
  ficha:
    | ({ id: string; version: string } & { motivoConsulta: string } & Record<
          Exclude<keyof FichaInput, 'motivoConsulta'>,
          string | null
        >)
    | null;
}
export type EditResult =
  | { kind: 'saved'; id: string }
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'missing' | 'absent' | 'conflict' | 'too-large' | 'uncertain' };
export interface FichaEditor {
  load: (patient: string, signal: AbortSignal) => Promise<FichaEdicion>;
  save: (
    patient: string,
    version: string,
    fields: FichaInput,
    signal: AbortSignal,
  ) => Promise<EditResult>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const request = (path: string, body: unknown, signal: AbortSignal) =>
  patientFetch('/api/fichas-clinicas/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
export const fichaEditor: FichaEditor = {
  load: async (patient, signal) => {
    const response = await request('edicion', { pacienteId: patient }, signal);
    if (response.status === 404) throw new PacienteFichaNoDisponible();
    if (!response.ok) throw new Error('Edición no disponible');
    const body = (await response.json()) as FichaEdicion;
    if (
      !body ||
      typeof body.pacienteId !== 'string' ||
      !uuid.test(body.pacienteId) ||
      body.pacienteId.toLowerCase() !== patient.toLowerCase() ||
      typeof body.nombre !== 'string' ||
      !body.nombre.trim() ||
      typeof body.apellido !== 'string' ||
      !body.apellido.trim()
    )
      throw new Error('Respuesta inválida');
    if (body.ficha !== null) {
      const f = body.ficha;
      if (
        !f ||
        typeof f.id !== 'string' ||
        !uuid.test(f.id) ||
        typeof f.version !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/.test(f.version) ||
        typeof f.motivoConsulta !== 'string' ||
        !f.motivoConsulta.trim() ||
        Object.keys(labelsFicha).some((k) => {
          const value = f[k as keyof FichaInput];
          return value !== null && typeof value !== 'string';
        })
      )
        throw new Error('Respuesta inválida');
    }
    return body;
  },
  save: async (patient, version, fields, signal) => {
    try {
      const r = await request('actualizar', { pacienteId: patient, version, ...fields }, signal);
      if (r.status === 413) return { kind: 'too-large' };
      if (r.status === 404) return { kind: 'missing' };
      const body = (await r.json()) as Record<string, unknown>;
      if (
        r.status === 200 &&
        body?.estado === 'actualizada' &&
        typeof body.id === 'string' &&
        uuid.test(body.id)
      )
        return { kind: 'saved', id: body.id };
      if (r.status === 409 && body?.codigo === 'EDICION_CONFLICTO') return { kind: 'conflict' };
      if (r.status === 409 && body?.codigo === 'FICHA_AUSENTE') return { kind: 'absent' };
      if (
        r.status === 400 &&
        body?.codigo === 'DATOS_INVALIDOS' &&
        body.errores &&
        typeof body.errores === 'object' &&
        !Array.isArray(body.errores) &&
        Object.values(body.errores).every((v) => typeof v === 'string')
      )
        return { kind: 'invalid', errors: body.errores as Record<string, string> };
      return { kind: 'uncertain' };
    } catch {
      return { kind: 'uncertain' };
    }
  },
};
