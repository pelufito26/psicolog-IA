import { patientFetch } from '../acceso/client';
export interface PacienteResumen {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
}
export interface Listado {
  pacientes: PacienteResumen[];
  pagina: number;
  haySiguiente: boolean;
}
export type Consultar = (busqueda: string, pagina: number, signal: AbortSignal) => Promise<Listado>;
export const consultar: Consultar = async (busqueda, pagina, signal) => {
  const response = await patientFetch('/api/pacientes/consulta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busqueda, pagina }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Consulta no disponible');
  const body = (await response.json()) as Listado;
  if (
    !body ||
    body.pagina !== pagina ||
    typeof body.haySiguiente !== 'boolean' ||
    !Array.isArray(body.pacientes) ||
    body.pacientes.some(
      (p) =>
        !p ||
        typeof p.id !== 'string' ||
        typeof p.nombre !== 'string' ||
        typeof p.apellido !== 'string' ||
        typeof p.telefono !== 'string' ||
        !Number.isInteger(p.edad) ||
        p.edad < 0,
    )
  )
    throw new Error('Respuesta inválida');
  return body;
};
