import type { Pool } from 'pg';
import type { ConsultaRepository, PacienteLeido } from '../application/listar.js';
export class PgConsultaRepository implements ConsultaRepository {
  constructor(private readonly pool: Pool) {}
  async read(professional: string): Promise<PacienteLeido[] | null> {
    const result = await this.pool.query<PacienteLeido>(
      `select c.id, c.nombre, c.apellido,
        c.fecha_nacimiento::text as "fechaNacimiento", c.telefono
       from psicologia.profesionales p left join psicologia.pacientes c on c.profesional_id=p.id
       where p.id=$1`,
      [professional],
    );
    if (!result.rowCount) return null;
    return result.rows
      .filter((row) => row.id !== null)
      .map(({ id, nombre, apellido, fechaNacimiento, telefono }) => ({
        id,
        nombre,
        apellido,
        fechaNacimiento,
        telefono,
      }));
  }
}
