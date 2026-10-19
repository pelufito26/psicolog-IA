import { patientFetch } from '../acceso/client';
import { labelsFicha, PacienteFichaNoDisponible } from './client';

export interface ConsultaFicha {
  pacienteId: string;
  nombre: string;
  apellido: string;
  ficha:
    | ({ id: string; fechaCreacion: string; fechaUltimaModificacion: string } & {
        motivoConsulta: string;
      } & Record<Exclude<keyof typeof labelsFicha, 'motivoConsulta'>, string | null>)
    | null;
}
export type ConsultarFicha = (patient: string, signal: AbortSignal) => Promise<ConsultaFicha>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const date = (value: unknown) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));
export const consultarFicha: ConsultarFicha = async (patient, signal) => {
  const response = await patientFetch('/api/fichas-clinicas/consultar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pacienteId: patient }),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (response.status === 404) throw new PacienteFichaNoDisponible();
  if (!response.ok) throw new Error('Consulta no disponible');
  const body = (await response.json()) as ConsultaFicha;
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
      typeof f !== 'object' ||
      typeof f.id !== 'string' ||
      !uuid.test(f.id) ||
      typeof f.motivoConsulta !== 'string' ||
      !f.motivoConsulta.trim() ||
      !date(f.fechaCreacion) ||
      !date(f.fechaUltimaModificacion) ||
      Object.keys(labelsFicha).some((key) => {
        const v = f[key as keyof typeof labelsFicha];
        return v !== null && typeof v !== 'string';
      })
    )
      throw new Error('Respuesta inválida');
  }
  return body;
};
