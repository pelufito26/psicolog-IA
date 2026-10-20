import type { Pool, PoolClient } from 'pg';
import type {
  SesionRepository,
  IdentidadPaciente,
  EntradaSesion,
  DetalleSesion,
} from '../application/sesiones.js';
import type { DatosSesion } from '../domain/sesion.js';
import type { EditSesionRepository, EdicionSesion } from '../application/editar-sesion.js';
export class PgSesionRepository implements SesionRepository, EditSesionRepository {
  constructor(private readonly pool: Pool) {}
  private async tx<T>(
    professional: string,
    write: boolean,
    action: (c: PoolClient) => Promise<T>,
  ): Promise<T> {
    const c = await this.pool.connect();
    let discard = false;
    try {
      await c.query(write ? 'BEGIN' : 'BEGIN READ ONLY');
      await c.query("select set_config('app.profesional',$1,true)", [professional]);
      const value = await action(c);
      await c.query('COMMIT');
      return value;
    } catch (error) {
      try {
        await c.query('ROLLBACK');
      } catch {
        discard = true;
      }
      throw error;
    } finally {
      c.release(discard);
    }
  }
  private async patient(c: PoolClient, professional: string, patient: string) {
    return (
      (
        await c.query<IdentidadPaciente>(
          'select id as "pacienteId",nombre,apellido from psicologia.pacientes where id=$1 and profesional_id=$2',
          [patient, professional],
        )
      ).rows[0] ?? null
    );
  }
  prepare(professional: string, patient: string) {
    return this.tx(professional, false, (c) => this.patient(c, professional, patient));
  }
  loadEdit(professional: string, patient: string, id: string) {
    return this.tx(professional, false, async (c) => {
      const result = await c.query<EdicionSesion>(
        `select p.id as "pacienteId",p.nombre,p.apellido,
        json_build_object('id',s.id,'fechaSesion',to_char(s.fecha_sesion,'YYYY-MM-DD'),
        'profesional',json_build_object('nombre',r.nombre,'apellido',r.apellido),
        'anotacionesClinicas',s.anotaciones_clinicas,'stamp',s.fecha_ultima_modificacion::text) as sesion
        from psicologia.sesiones_clinicas s join psicologia.pacientes p on p.id=s.paciente_id
        join psicologia.profesionales r on r.id=s.profesional_id
        where s.id=$1 and p.id=$2 and p.profesional_id=$3 and s.profesional_id=$3`,
        [id, patient, professional],
      );
      return result.rows[0] ?? null;
    });
  }
  update(
    professional: string,
    patient: string,
    id: string,
    data: DatosSesion,
    matches: (stamp: string) => boolean,
  ): ReturnType<EditSesionRepository['update']> {
    return this.tx(professional, true, async (c) => {
      const row = (
        await c.query<{ stamp: string }>(
          `select s.fecha_ultima_modificacion::text as stamp from psicologia.sesiones_clinicas s
        join psicologia.pacientes p on p.id=s.paciente_id
        where s.id=$1 and p.id=$2 and p.profesional_id=$3 and s.profesional_id=$3 for update of s`,
          [id, patient, professional],
        )
      ).rows[0];
      if (!row) return 'missing';
      if (!matches(row.stamp)) return 'conflict';
      await c.query(
        `update psicologia.sesiones_clinicas set fecha_sesion=$4,anotaciones_clinicas=$5
        where id=$1 and paciente_id=$2 and profesional_id=$3`,
        [id, patient, professional, data.fechaSesion, data.anotacionesClinicas],
      );
      return 'updated';
    });
  }
  register(
    professional: string,
    patient: string,
    id: string,
    data: DatosSesion,
  ): ReturnType<SesionRepository['register']> {
    return this.tx(professional, true, async (c) => {
      if (!(await this.patient(c, professional, patient))) return 'missing';
      const inserted = await c.query(
        'insert into psicologia.sesiones_clinicas(id,paciente_id,profesional_id,fecha_sesion,anotaciones_clinicas) values($1,$2,$3,$4,$5) on conflict(id) do nothing returning id',
        [id, patient, professional, data.fechaSesion, data.anotacionesClinicas],
      );
      if (inserted.rowCount) return 'created';
      const prior = (
        await c.query<{ fecha: string; anotaciones: string }>(
          "select to_char(fecha_sesion,'YYYY-MM-DD') as fecha,anotaciones_clinicas as anotaciones from psicologia.sesiones_clinicas where id=$1 and paciente_id=$2 and profesional_id=$3",
          [id, patient, professional],
        )
      ).rows[0];
      return prior?.fecha === data.fechaSesion && prior.anotaciones === data.anotacionesClinicas
        ? 'replayed'
        : 'conflict';
    });
  }
  check(professional: string, patient: string, id: string) {
    return this.tx(professional, false, async (c) => {
      if (!(await this.patient(c, professional, patient))) return null;
      const result = await c.query(
        'select id from psicologia.sesiones_clinicas where id=$1 and paciente_id=$2 and profesional_id=$3',
        [id, patient, professional],
      );
      return { registrada: !!result.rowCount };
    });
  }
  history(professional: string, patient: string, page: number) {
    return this.tx(professional, false, async (c) => {
      const owner = await this.patient(c, professional, patient);
      if (!owner) return null;
      const result = await c.query<EntradaSesion>(
        `select s.id,to_char(s.fecha_sesion,'YYYY-MM-DD') as "fechaSesion",
      json_build_object('nombre',p.nombre,'apellido',p.apellido) as profesional
      from psicologia.sesiones_clinicas s join psicologia.profesionales p on p.id=s.profesional_id
      where s.paciente_id=$1 and s.profesional_id=$2 order by s.fecha_sesion desc,s.fecha_creacion desc,s.id desc limit 21 offset $3`,
        [patient, professional, (page - 1) * 20],
      );
      return {
        ...owner,
        sesiones: result.rows.slice(0, 20),
        pagina: page,
        haySiguiente: result.rows.length > 20,
      };
    });
  }
  detail(professional: string, patient: string, id: string) {
    return this.tx(professional, false, async (c) => {
      const result = await c.query<IdentidadPaciente & { sesion: DetalleSesion }>(
        `select p.id as "pacienteId",p.nombre,p.apellido,
      json_build_object('id',s.id,'fechaSesion',to_char(s.fecha_sesion,'YYYY-MM-DD'),
      'profesional',json_build_object('nombre',r.nombre,'apellido',r.apellido),'anotacionesClinicas',s.anotaciones_clinicas,
      'fechaCreacion',s.fecha_creacion,'fechaUltimaModificacion',s.fecha_ultima_modificacion) as sesion
      from psicologia.sesiones_clinicas s join psicologia.pacientes p on p.id=s.paciente_id join psicologia.profesionales r on r.id=s.profesional_id
      where s.id=$1 and p.id=$2 and p.profesional_id=$3 and s.profesional_id=$3`,
        [id, patient, professional],
      );
      return result.rows[0] ?? null;
    });
  }
}
