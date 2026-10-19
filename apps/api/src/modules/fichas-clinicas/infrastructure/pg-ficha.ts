import type { Pool, PoolClient } from 'pg';
import type { FichaRepository } from '../application/ficha.js';
import type { DatosFicha } from '../domain/ficha.js';
export class PgFichaRepository implements FichaRepository {
  constructor(private readonly pool: Pool) {}
  private async transaction<T>(
    professional: string,
    run: (client: PoolClient) => Promise<{ value: T; commit: boolean }>,
  ): Promise<T> {
    const client = await this.pool.connect();
    let discard = false;
    try {
      await client.query('BEGIN');
      await client.query("select set_config('app.profesional',$1,true)", [professional]);
      const result = await run(client);
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
  state(professional: string, patient: string): Promise<boolean | null> {
    return this.transaction(professional, async (c) => {
      const rows = await c.query<{ existe: boolean }>(
        `select exists(select 1 from psicologia.fichas_clinicas f where f.paciente_id=p.id) as existe
        from psicologia.pacientes p where p.id=$1 and p.profesional_id=$2`,
        [patient, professional],
      );
      return { value: rows.rows[0]?.existe ?? null, commit: true };
    });
  }
  create(
    professional: string,
    patient: string,
    data: DatosFicha,
  ): ReturnType<FichaRepository['create']> {
    return this.transaction<Awaited<ReturnType<FichaRepository['create']>>>(
      professional,
      async (c) => {
        const owner = await c.query(
          'select id from psicologia.pacientes where id=$1 and profesional_id=$2 for update',
          [patient, professional],
        );
        if (!owner.rowCount) return { value: { kind: 'missing' }, commit: false };
        const result = await c.query<{ id: string }>(
          `insert into psicologia.fichas_clinicas(paciente_id,motivo_consulta,antecedentes_personales,antecedentes_familiares,medicacion,evaluacion_clinica,observaciones_generales)
        values($1,$2,$3,$4,$5,$6,$7) on conflict(paciente_id) do nothing returning id`,
          [
            patient,
            data.motivoConsulta,
            data.antecedentesPersonales,
            data.antecedentesFamiliares,
            data.medicacion,
            data.evaluacionClinica,
            data.observacionesGenerales,
          ],
        );
        return result.rowCount
          ? { value: { kind: 'created', id: result.rows[0].id }, commit: true }
          : { value: { kind: 'exists' }, commit: false };
      },
    );
  }
}
