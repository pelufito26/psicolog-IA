import { edad, hoyMontevideo } from '../domain/paciente.js';
import type { PacienteLeido } from './listar.js';
import type { RegistroHandler } from './registrar.js';
export interface PerfilRepository {
  find(professional: string, id: string): Promise<PacienteLeido | null>;
}
export function createPerfil(
  repository: PerfilRepository,
  professional: string,
  now = () => new Date(),
): RegistroHandler {
  return async (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return { status: 400, body: { codigo: 'PERFIL_INVALIDO' } };
    const body = input as Record<string, unknown>;
    if (
      Object.keys(body).some((key) => key !== 'id') ||
      typeof body.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
    )
      return { status: 400, body: { codigo: 'PERFIL_INVALIDO' } };
    try {
      const row = await repository.find(professional, body.id);
      if (!row) return { status: 404, body: { codigo: 'PACIENTE_NO_DISPONIBLE' } };
      return {
        status: 200,
        body: {
          id: row.id,
          nombre: row.nombre,
          apellido: row.apellido,
          fechaNacimiento: row.fechaNacimiento,
          edad: edad(row.fechaNacimiento, hoyMontevideo(now())),
          telefono: row.telefono,
        },
      };
    } catch {
      return { status: 503, body: { codigo: 'PERFIL_NO_DISPONIBLE' } };
    }
  };
}
