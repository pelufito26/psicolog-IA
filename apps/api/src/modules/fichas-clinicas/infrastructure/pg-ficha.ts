import type { Pool, PoolClient } from 'pg';
import type { FichaRepository, ConsultaFicha } from '../application/ficha.js';
import type { DatosFicha } from '../domain/ficha.js';
import type { EditFichaRepository, EdicionFicha } from '../application/editar-ficha.js';
export class PgFichaRepository implements FichaRepository {
  constructor(private readonly pool: Pool) {}
  loadEdit(professional: string, patient: string): Promise<EdicionFicha | null> {
    return this.transaction<EdicionFicha | null>(
      professional,
      async (c) => {
        const result = await c.query<EdicionFicha>(
          `select p.id as "pacienteId", p.nombre, p.apellido,
        case when f.id is null then null else json_build_object(
          'id', f.id, 'stamp', f.fecha_ultima_modificacion::text,
          'motivoConsulta', f.motivo_consulta, 'antecedentesPersonales', f.antecedentes_personales,
          'antecedentesFamiliares', f.antecedentes_familiares, 'medicacion', f.medicacion,
          'evaluacionClinica', f.evaluacion_clinica, 'observacionesGenerales', f.observaciones_generales) end as ficha
        from psicologia.pacientes p left join psicologia.fichas_clinicas f on f.paciente_id=p.id
        where p.id=$1 and p.profesional_id=$2`,
          [patient, professional],
        );
        return { value: result.rows[0] ?? null, commit: true };
      },
      true,
    );
  }
  update(
    professional: string,
    patient: string,
    data: DatosFicha,
    matches: (id: string, stamp: string) => boolean,
  ): ReturnType<EditFichaRepository['update']> {
    return this.transaction<Awaited<ReturnType<EditFichaRepository['update']>>>(
      professional,
      async (c) => {
        const owner = await c.query(
          'select id from psicologia.pacientes where id=$1 and profesional_id=$2',
          [patient, professional],
        );
        if (!owner.rowCount) return { value: { kind: 'missing' }, commit: false };
        const row = (
          await c.query<{ id: string; stamp: string }>(
            `select f.id, f.fecha_ultima_modificacion::text as stamp
        from psicologia.fichas_clinicas f join psicologia.pacientes p on p.id=f.paciente_id
        where p.id=$1 and p.profesional_id=$2 for update of f`,
            [patient, professional],
          )
        ).rows[0];
        if (!row) return { value: { kind: 'absent' }, commit: false };
        if (!matches(row.id, row.stamp)) return { value: { kind: 'conflict' }, commit: false };
        await c.query(
          `update psicologia.fichas_clinicas set motivo_consulta=$2, antecedentes_personales=$3,
        antecedentes_familiares=$4, medicacion=$5, evaluacion_clinica=$6, observaciones_generales=$7
        where id=$1 and paciente_id=$8`,
          [
            row.id,
            data.motivoConsulta,
            data.antecedentesPersonales,
            data.antecedentesFamiliares,
            data.medicacion,
            data.evaluacionClinica,
            data.observacionesGenerales,
            patient,
          ],
        );
        return { value: { kind: 'updated', id: row.id }, commit: true };
      },
    );
  }
  private async transaction<T>(
    professional: string,
    run: (client: PoolClient) => Promise<{ value: T; commit: boolean }>,
    readOnly = false,
  ): Promise<T> {
    const client = await this.pool.connect();
    let discard = false;
    try {
      await client.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
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
  read(professional: string, patient: string): Promise<ConsultaFicha | null> {
    return this.transaction<ConsultaFicha | null>(
      professional,
      async (c) => {
        const result = await c.query<{
          pacienteId: string;
          nombre: string;
          apellido: string;
          id: string | null;
          motivoConsulta: string;
          antecedentesPersonales: string | null;
          antecedentesFamiliares: string | null;
          medicacion: string | null;
          evaluacionClinica: string | null;
          observacionesGenerales: string | null;
          fechaCreacion: Date;
          fechaUltimaModificacion: Date;
        }>(
          `select p.id as "pacienteId", p.nombre, p.apellido, f.id,
        f.motivo_consulta as "motivoConsulta", f.antecedentes_personales as "antecedentesPersonales",
        f.antecedentes_familiares as "antecedentesFamiliares", f.medicacion,
        f.evaluacion_clinica as "evaluacionClinica", f.observaciones_generales as "observacionesGenerales",
        f.fecha_creacion as "fechaCreacion", f.fecha_ultima_modificacion as "fechaUltimaModificacion"
        from psicologia.pacientes p left join psicologia.fichas_clinicas f on f.paciente_id=p.id
        where p.id=$1 and p.profesional_id=$2`,
          [patient, professional],
        );
        const row = result.rows[0];
        if (!row) return { value: null, commit: true };
        const {
          pacienteId,
          nombre,
          apellido,
          id,
          fechaCreacion,
          fechaUltimaModificacion,
          ...fields
        } = row;
        return {
          value: {
            pacienteId,
            nombre,
            apellido,
            ficha: id
              ? {
                  id,
                  ...fields,
                  fechaCreacion: fechaCreacion.toISOString(),
                  fechaUltimaModificacion: fechaUltimaModificacion.toISOString(),
                }
              : null,
          },
          commit: true,
        };
      },
      true,
    );
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
