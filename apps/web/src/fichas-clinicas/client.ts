import { patientFetch } from '../acceso/client';
export const labelsFicha = {
  motivoConsulta: 'Motivo de consulta',
  antecedentesPersonales: 'Antecedentes personales',
  antecedentesFamiliares: 'Antecedentes familiares',
  medicacion: 'Medicación',
  evaluacionClinica: 'Evaluación clínica',
  observacionesGenerales: 'Observaciones generales',
};
export type FichaInput = Record<keyof typeof labelsFicha, string>;
export type CreateResult =
  | { kind: 'created'; id: string }
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'exists' | 'missing' | 'too-large' | 'uncertain' };
export interface FichaAPI {
  state: (patient: string, signal: AbortSignal) => Promise<boolean>;
  create: (patient: string, data: FichaInput, signal: AbortSignal) => Promise<CreateResult>;
}
export class PacienteFichaNoDisponible extends Error {}
const request = (path: string, body: unknown, signal: AbortSignal) =>
  patientFetch('/api/fichas-clinicas/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
export const fichaAPI: FichaAPI = {
  state: async (patient, signal) => {
    const response = await request('estado', { pacienteId: patient }, signal);
    if (response.status === 404) throw new PacienteFichaNoDisponible();
    if (!response.ok) throw new Error('Estado no disponible');
    const body = (await response.json()) as { existe?: unknown };
    if (!body || typeof body.existe !== 'boolean') throw new Error('Respuesta inválida');
    return body.existe;
  },
  create: async (patient, data, signal) => {
    try {
      const response = await request('crear', { pacienteId: patient, ...data }, signal);
      if (response.status === 413) return { kind: 'too-large' };
      if (response.status === 404) return { kind: 'missing' };
      const body = (await response.json()) as Record<string, unknown>;
      if (
        response.status === 201 &&
        body?.estado === 'creada' &&
        typeof body.id === 'string' &&
        body.id
      )
        return { kind: 'created', id: body.id };
      if (response.status === 409 && body?.codigo === 'FICHA_YA_EXISTE') return { kind: 'exists' };
      if (
        response.status === 400 &&
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
