import type { Pool } from 'pg';
import { claveNombre, type DatosPaciente } from '../domain/paciente.js';
import type { RegistroRepository, Outcome } from '../application/registrar.js';
export class PgPacienteRepository implements RegistroRepository {
  constructor(private readonly pool: Pool) {}
  async register(professional: string, data: DatosPaciente, confirmed: boolean): Promise<Outcome> {
    const client = await this.pool.connect();
    let open = false;
    let discard = false;
    try {
      await client.query('BEGIN');
      open = true;
      await client.query("select set_config('app.profesional',$1,true)", [professional]);
      await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [professional]);
      if (
        !(await client.query('select id from psicologia.profesionales where id=$1', [professional]))
          .rowCount
      ) {
        await client.query('ROLLBACK');
        open = false;
        return { kind: 'missing' };
      }
      const candidates = await client.query<{ nombre: string; apellido: string }>(
        'select nombre,apellido from psicologia.pacientes where profesional_id=$1 and fecha_nacimiento=$2',
        [professional, data.fechaNacimiento],
      );
      const duplicate = candidates.rows.some(
        (row) =>
          claveNombre(row.nombre) === claveNombre(data.nombre) &&
          claveNombre(row.apellido) === claveNombre(data.apellido),
      );
      if (duplicate && !confirmed) {
        await client.query('ROLLBACK');
        open = false;
        return { kind: 'duplicate' };
      }
      const inserted = await client.query<{ id: string }>(
        'insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,$2,$3,$4,$5) returning id',
        [professional, data.nombre, data.apellido, data.fechaNacimiento, data.telefono],
      );
      await client.query('COMMIT');
      open = false;
      return { kind: 'created', id: inserted.rows[0].id };
    } catch (error) {
      if (open) {
        try {
          await client.query('ROLLBACK');
        } catch {
          discard = true;
        }
      }
      throw error;
    } finally {
      client.release(discard);
    }
  }
}
