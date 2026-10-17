import { claveNombre, hoyMontevideo, edad } from '../domain/paciente.js';
export { edad } from '../domain/paciente.js';
import type { RegistroHandler } from './registrar.js';
export interface PacienteLeido {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
}
export interface ConsultaRepository {
  read(professional: string): Promise<PacienteLeido[] | null>;
}
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export function createListar(
  repository: ConsultaRepository,
  professional: string,
  now = () => new Date(),
): RegistroHandler {
  return async (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return { status: 400, body: { codigo: 'CONSULTA_INVALIDA' } };
    const body = input as Record<string, unknown>;
    if (
      Object.keys(body).some((k) => !['busqueda', 'pagina'].includes(k)) ||
      typeof body.busqueda !== 'string' ||
      !Number.isSafeInteger(body.pagina) ||
      (body.pagina as number) < 1
    )
      return { status: 400, body: { codigo: 'CONSULTA_INVALIDA' } };
    try {
      const rows = await repository.read(professional);
      if (rows === null) return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
      const search = claveNombre(body.busqueda);
      const selected = rows
        .filter(
          (row) =>
            claveNombre(row.nombre).includes(search) || claveNombre(row.apellido).includes(search),
        )
        .sort(
          (a, b) =>
            compare(claveNombre(a.apellido), claveNombre(b.apellido)) ||
            compare(claveNombre(a.nombre), claveNombre(b.nombre)) ||
            compare(a.id, b.id),
        );
      const page = body.pagina as number;
      const start = (page - 1) * 20;
      const today = hoyMontevideo(now());
      return {
        status: 200,
        body: {
          pacientes: selected.slice(start, start + 20).map((row) => ({
            id: row.id,
            nombre: row.nombre,
            apellido: row.apellido,
            telefono: row.telefono,
            edad: edad(row.fechaNacimiento, today),
          })),
          pagina: page,
          haySiguiente: selected.length > start + 20,
        },
      };
    } catch {
      return { status: 503, body: { codigo: 'CONSULTA_NO_DISPONIBLE' } };
    }
  };
}
