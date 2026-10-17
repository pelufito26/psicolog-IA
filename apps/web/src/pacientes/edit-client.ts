import { patientFetch } from '../acceso/client';
import { PacienteNoDisponible } from './profile-client';
import type { PacienteInput } from './client';
export interface Edicion extends PacienteInput {
  id: string;
  version: string;
}
export type EditResult =
  | { kind: 'updated' }
  | { kind: 'duplicate'; token: string }
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'conflict' | 'missing' | 'uncertain' | 'confirmation' };
export type LoadEdicion = (id: string, signal: AbortSignal) => Promise<Edicion>;
export type SaveEdicion = (
  data: Edicion,
  token: string | undefined,
  signal: AbortSignal,
) => Promise<EditResult>;
export interface Editor {
  load: LoadEdicion;
  save: SaveEdicion;
}
export const cargarEdicion: LoadEdicion = async (id, signal) => {
  const response = await patientFetch('/api/pacientes/edicion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (response.status === 404) throw new PacienteNoDisponible();
  if (!response.ok) throw new Error('Edición no disponible');
  const body = (await response.json()) as Edicion;
  if (
    !body ||
    typeof body.id !== 'string' ||
    body.id.toLowerCase() !== id.toLowerCase() ||
    typeof body.version !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(body.version) ||
    ['nombre', 'apellido', 'telefono'].some((k) => typeof body[k as keyof Edicion] !== 'string') ||
    typeof body.fechaNacimiento !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.fechaNacimiento) ||
    new Date(body.fechaNacimiento + 'T00:00:00Z').toJSON()?.slice(0, 10) !== body.fechaNacimiento
  )
    throw new Error('Respuesta inválida');
  return {
    id: body.id,
    version: body.version,
    nombre: body.nombre,
    apellido: body.apellido,
    fechaNacimiento: body.fechaNacimiento,
    telefono: body.telefono,
  };
};
export const guardarEdicion: SaveEdicion = async (data, token, signal) => {
  try {
    const response = await patientFetch('/api/pacientes/actualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ...(token ? { confirmacionDuplicado: token } : {}) }),
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
    });
    const body = (await response.json()) as Record<string, unknown>;
    if (response.status === 200 && body.estado === 'actualizado' && body.id === data.id)
      return { kind: 'updated' };
    if (response.status === 404) return { kind: 'missing' };
    if (response.status === 409 && body.codigo === 'EDICION_CONFLICTO') return { kind: 'conflict' };
    if (
      response.status === 409 &&
      body.codigo === 'POSIBLE_DUPLICADO' &&
      typeof body.confirmacionDuplicado === 'string'
    )
      return { kind: 'duplicate', token: body.confirmacionDuplicado };
    if (response.status === 400 && body.codigo === 'CONFIRMACION_INVALIDA')
      return { kind: 'confirmation' };
    if (
      response.status === 400 &&
      body.codigo === 'DATOS_INVALIDOS' &&
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
};
