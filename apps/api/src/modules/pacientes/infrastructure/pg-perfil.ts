import type { Pool } from 'pg';
import type { PerfilRepository } from '../application/perfil.js';
import type { PacienteLeido } from '../application/listar.js';
export class PgPerfilRepository implements PerfilRepository {
  constructor(private readonly pool: Pool) {}
  async find(professional: string, id: string): Promise<PacienteLeido | null> {
    const client = await this.pool.connect();
    let failed = false;
    try {
      await client.query('BEGIN');
      await client.query("select set_config('app.profesional',$1,true)", [professional]);
      const result = await client.query<PacienteLeido>(
        `select id, nombre, apellido, fecha_nacimiento::text as "fechaNacimiento", telefono
         from psicologia.pacientes where id=$1 and profesional_id=$2`,
        [id, professional],
      );
      await client.query('COMMIT');
      return result.rows[0] ?? null;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        failed = true;
      }
      throw error;
    } finally {
      client.release(failed);
    }
  }
}
