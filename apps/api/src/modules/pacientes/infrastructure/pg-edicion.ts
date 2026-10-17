import type { Pool, PoolClient } from 'pg';
import type { EdicionLeida, EdicionRepository, EditOutcome } from '../application/editar.js';
import { claveNombre, type DatosPaciente } from '../domain/paciente.js';
export class PgEdicionRepository implements EdicionRepository {
  constructor(private readonly pool: Pool) {}
  private async transaction<T>(
    professional: string,
    action: (client: PoolClient) => Promise<{ value: T; commit: boolean }>,
  ): Promise<T> {
    const client = await this.pool.connect();
    let discard = false;
    try {
      await client.query('BEGIN');
      await client.query("select set_config('app.profesional',$1,true)", [professional]);
      const result = await action(client);
      await client.query(result.commit ? 'COMMIT' : 'ROLLBACK');
      return result.value;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        discard = true;
      }
      throw error;
    } finally {
      client.release(discard);
    }
  }
  load(professional: string, id: string): Promise<EdicionLeida | null> {
    return this.transaction(professional, async (client) => {
      const rows = await client.query<EdicionLeida>(
        `select id,nombre,apellido,fecha_nacimiento::text as "fechaNacimiento",telefono,
        fecha_ultima_modificacion::text as stamp from psicologia.pacientes where id=$1 and profesional_id=$2`,
        [id, professional],
      );
      return { value: rows.rows[0] ?? null, commit: true };
    });
  }
  update(
    professional: string,
    id: string,
    data: DatosPaciente,
    stamp: string,
    confirmed: boolean,
  ): Promise<EditOutcome> {
    return this.transaction<EditOutcome>(professional, async (client) => {
      await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [professional]);
      const row = (
        await client.query<{ stamp: string }>(
          `select fecha_ultima_modificacion::text as stamp from psicologia.pacientes
        where id=$1 and profesional_id=$2 for update`,
          [id, professional],
        )
      ).rows[0];
      if (!row) return { value: { kind: 'missing' }, commit: false };
      if (row.stamp !== stamp) return { value: { kind: 'conflict' }, commit: false };
      const candidates = await client.query<{ nombre: string; apellido: string }>(
        'select nombre,apellido from psicologia.pacientes where profesional_id=$1 and fecha_nacimiento=$2 and id<>$3',
        [professional, data.fechaNacimiento, id],
      );
      const duplicate = candidates.rows.some(
        (r) =>
          claveNombre(r.nombre) === claveNombre(data.nombre) &&
          claveNombre(r.apellido) === claveNombre(data.apellido),
      );
      if (duplicate && !confirmed) return { value: { kind: 'duplicate' }, commit: false };
      const result = await client.query(
        'update psicologia.pacientes set nombre=$1,apellido=$2,fecha_nacimiento=$3,telefono=$4 where id=$5 and profesional_id=$6 returning id',
        [data.nombre, data.apellido, data.fechaNacimiento, data.telefono, id, professional],
      );
      if (result.rowCount !== 1) throw new Error('Actualización no confirmada');
      return { value: { kind: 'updated' }, commit: true };
    });
  }
}
