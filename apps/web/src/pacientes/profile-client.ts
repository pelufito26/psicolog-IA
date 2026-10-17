import { patientFetch } from '../acceso/client';
import type { PacienteResumen } from './list-client';
export interface Perfil extends PacienteResumen {
  fechaNacimiento: string;
}
export class PacienteNoDisponible extends Error {}
export type ConsultarPerfil = (id: string, signal: AbortSignal) => Promise<Perfil>;
export const consultarPerfil: ConsultarPerfil = async (id, signal) => {
  const response = await patientFetch('/api/pacientes/perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (response.status === 404) throw new PacienteNoDisponible();
  if (!response.ok) throw new Error('Perfil no disponible');
  const body = (await response.json()) as Perfil;
  if (
    !body ||
    typeof body.id !== 'string' ||
    body.id.toLowerCase() !== id.toLowerCase() ||
    typeof body.nombre !== 'string' ||
    typeof body.apellido !== 'string' ||
    typeof body.telefono !== 'string' ||
    !Number.isInteger(body.edad) ||
    body.edad < 0 ||
    typeof body.fechaNacimiento !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.fechaNacimiento) ||
    new Date(body.fechaNacimiento + 'T00:00:00Z').toJSON()?.slice(0, 10) !== body.fechaNacimiento
  )
    throw new Error('Respuesta inválida');
  return body;
};
