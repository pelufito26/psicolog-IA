import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { createFicha } from '../../apps/api/dist/modules/fichas-clinicas/application/ficha.js';
import { PgFichaRepository } from '../../apps/api/dist/modules/fichas-clinicas/infrastructure/pg-ficha.js';
import { createEditarFicha } from '../../apps/api/dist/modules/fichas-clinicas/application/editar-ficha.js';
export async function testFichas(admin, url) {
  const professionals = [randomUUID(), randomUUID()],
    patients = [];
  for (const professional of professionals) {
    await admin.query(
      "insert into psicologia.profesionales(id,nombre,apellido,email) values($1,'Ficha','Ficticia',$2)",
      [professional, professional + '@example.invalid'],
    );
    for (let n = 0; n < 2; n++)
      patients.push(
        (
          await admin.query(
            "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'Paciente','Ficticio','2000-01-01','0000000') returning id",
            [professional],
          )
        ).rows[0].id,
      );
  }
  await admin.query(
    "insert into psicologia.sesiones_clinicas(paciente_id,profesional_id,fecha_sesion,anotaciones_clinicas) values($1,$2,'2000-01-01','Sesión ficticia')",
    [patients[0], professionals[0]],
  );
  const related = async () =>
    (
      await admin.query(
        'select (select to_jsonb(p) from psicologia.pacientes p where p.id=$1) paciente,(select to_jsonb(s) from psicologia.sesiones_clinicas s where paciente_id=$1) sesion',
        [patients[0]],
      )
    ).rows[0];
  const before = await related();
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 2,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  try {
    const repository = new PgFichaRepository(pool),
      service = createFicha(repository, professionals[0]);
    const input = {
      pacienteId: patients[0],
      motivoConsulta: '  Motivo ficticio\n  segunda línea  ',
    };
    assert.deepEqual(await service.state({ pacienteId: patients[0] }), {
      status: 200,
      body: { existe: false },
    });
    const attempts = await Promise.all([service.create(input), service.create(input)]);
    assert.deepEqual(attempts.map((r) => r.status).sort(), [201, 409]);
    const saved = (
      await admin.query('select * from psicologia.fichas_clinicas where paciente_id=$1', [
        patients[0],
      ])
    ).rows[0];
    assert.equal(saved.motivo_consulta, 'Motivo ficticio\n  segunda línea');
    for (const field of [
      'antecedentes_personales',
      'antecedentes_familiares',
      'medicacion',
      'evaluacion_clinica',
      'observaciones_generales',
    ])
      assert.equal(saved[field], null);
    assert.ok(saved.fecha_creacion);
    assert.ok(saved.fecha_ultima_modificacion);
    assert.deepEqual(await related(), before);
    assert.deepEqual((await service.state({ pacienteId: patients[0] })).body, { existe: true });
    assert.equal(
      (await service.create({ ...input, motivoConsulta: 'No debe sobrescribirse' })).status,
      409,
    );
    assert.deepEqual(
      (
        await admin.query('select * from psicologia.fichas_clinicas where paciente_id=$1', [
          patients[0],
        ])
      ).rows[0],
      saved,
    );
    const absent = randomUUID();
    assert.deepEqual(
      await service.state({ pacienteId: patients[2] }),
      await service.state({ pacienteId: absent }),
    );
    assert.deepEqual(
      await service.create({ ...input, pacienteId: patients[2] }),
      await service.create({ ...input, pacienteId: absent }),
    );
    assert.equal(
      (
        await admin.query('select id from psicologia.fichas_clinicas where paciente_id=$1', [
          patients[2],
        ])
      ).rowCount,
      0,
    );
    const other = createFicha(repository, professionals[1]);
    const text = '<script>Solo texto ficticio</script>\n  continuación';
    assert.equal(
      (
        await other.create({
          pacienteId: patients[2],
          motivoConsulta: 'Ficticio',
          observacionesGenerales: text,
          antecedentesPersonales: '  Antecedente ficticio  ',
          medicacion: '',
        })
      ).status,
      201,
    );
    const optional = (
      await admin.query(
        'select observaciones_generales,antecedentes_personales,medicacion from psicologia.fichas_clinicas where paciente_id=$1',
        [patients[2]],
      )
    ).rows[0];
    assert.deepEqual(optional, {
      observaciones_generales: text,
      antecedentes_personales: 'Antecedente ficticio',
      medicacion: null,
    });
    assert.deepEqual(
      await service.state({ pacienteId: patients[2] }),
      await service.state({ pacienteId: absent }),
    ); // La existencia ajena tampoco se revela.
    const empty = {
      motivoConsulta: ' ',
      antecedentesPersonales: null,
      antecedentesFamiliares: null,
      medicacion: null,
      evaluacionClinica: null,
      observacionesGenerales: null,
    };
    await assert.rejects(
      repository.create(professionals[0], patients[1], empty),
      (e) => e.code === '23514',
    );
    assert.equal(await repository.state(professionals[0], patients[1]), false);
    assert.equal((await pool.query('select id from psicologia.fichas_clinicas')).rowCount, 0);
    const snapshot = async () =>
      (
        await admin.query(`select
      (select jsonb_agg(to_jsonb(f) order by f.id) from psicologia.fichas_clinicas f) fichas,
      (select jsonb_agg(to_jsonb(p) order by p.id) from psicologia.pacientes p) pacientes,
      (select jsonb_agg(to_jsonb(s) order by s.id) from psicologia.sesiones_clinicas s) sesiones`)
      ).rows[0];
    const beforeRead = await snapshot();
    const read = await service.read({ pacienteId: patients[0] });
    assert.equal(read.status, 200);
    assert.deepEqual(read.body, {
      pacienteId: patients[0],
      nombre: 'Paciente',
      apellido: 'Ficticio',
      ficha: {
        id: saved.id,
        motivoConsulta: saved.motivo_consulta,
        antecedentesPersonales: null,
        antecedentesFamiliares: null,
        medicacion: null,
        evaluacionClinica: null,
        observacionesGenerales: null,
        fechaCreacion: saved.fecha_creacion.toISOString(),
        fechaUltimaModificacion: saved.fecha_ultima_modificacion.toISOString(),
      },
    });
    assert.deepEqual(await service.read({ pacienteId: patients[1] }), {
      status: 200,
      body: { pacienteId: patients[1], nombre: 'Paciente', apellido: 'Ficticio', ficha: null },
    });
    const foreignRead = await service.read({ pacienteId: patients[2] });
    assert.equal(foreignRead.status, 404);
    assert.deepEqual(foreignRead, await service.read({ pacienteId: absent }));
    const optionalRead = await other.read({ pacienteId: patients[2] });
    assert.equal(optionalRead.body.ficha.observacionesGenerales, text);
    assert.equal(optionalRead.body.ficha.antecedentesPersonales, 'Antecedente ficticio');
    assert.equal(optionalRead.body.ficha.medicacion, null);
    await assert.rejects(repository.read('', patients[0]), (e) => e.code === '22P02');
    await assert.rejects(
      repository.read(professionals[0], 'invalid-uuid'),
      (e) => e.code === '22P02',
    );
    assert.equal((await pool.query('select id from psicologia.fichas_clinicas')).rowCount, 0);
    assert.equal((await service.read({ pacienteId: patients[0] })).status, 200);
    assert.deepEqual(await snapshot(), beforeRead);
    const editor = createEditarFicha(repository, professionals[0], Buffer.alloc(32, 6));
    const editLoad = await editor.load({ pacienteId: patients[0] });
    assert.equal(editLoad.status, 200);
    assert.equal(editLoad.body.ficha.stamp, undefined);
    const editedFields = {
      motivoConsulta: ' Motivo editado\n  línea ficticia ',
      antecedentesPersonales: 'Personal',
      antecedentesFamiliares: 'Familiar',
      medicacion: 'Medicación ficticia',
      evaluacionClinica: 'Evaluación ficticia',
      observacionesGenerales: '<b>Solo texto</b>',
    };
    const editInput = {
      pacienteId: patients[0],
      version: editLoad.body.ficha.version,
      ...editedFields,
    };
    const race = await Promise.all([
      editor.save(editInput),
      editor.save({ ...editInput, motivoConsulta: 'Otro editor ficticio' }),
    ]);
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
    const edited = (
      await admin.query('select * from psicologia.fichas_clinicas where paciente_id=$1', [
        patients[0],
      ])
    ).rows[0];
    for (const key of ['id', 'paciente_id', 'fecha_creacion'])
      assert.deepEqual(edited[key], saved[key]);
    assert.ok(
      edited.fecha_ultima_modificacion.getTime() >= saved.fecha_ultima_modificacion.getTime(),
    );
    assert.equal(edited.antecedentes_personales, 'Personal');
    assert.equal(edited.antecedentes_familiares, 'Familiar');
    assert.equal(edited.medicacion, 'Medicación ficticia');
    assert.equal(edited.evaluacion_clinica, 'Evaluación ficticia');
    assert.equal(edited.observaciones_generales, '<b>Solo texto</b>');
    assert.deepEqual(await related(), before);
    assert.equal((await editor.save(editInput)).status, 409);
    const fresh = await editor.load({ pacienteId: patients[0] });
    const blankOptionals = {
      ...editedFields,
      motivoConsulta: 'Motivo final',
      antecedentesPersonales: '',
      antecedentesFamiliares: '',
      medicacion: '',
      evaluacionClinica: '',
      observacionesGenerales: '',
    };
    assert.equal(
      (
        await editor.save({
          pacienteId: patients[0],
          version: fresh.body.ficha.version,
          ...blankOptionals,
        })
      ).status,
      200,
    );
    const cleared = (await service.read({ pacienteId: patients[0] })).body.ficha;
    for (const key of [
      'antecedentesPersonales',
      'antecedentesFamiliares',
      'medicacion',
      'evaluacionClinica',
      'observacionesGenerales',
    ])
      assert.equal(cleared[key], null);
    const unchanged = await snapshot();
    assert.equal(
      (await editor.save({ ...editInput, pacienteId: patients[1] })).body.codigo,
      'FICHA_AUSENTE',
    );
    assert.deepEqual(
      await editor.load({ pacienteId: patients[2] }),
      await editor.load({ pacienteId: absent }),
    );
    assert.equal((await editor.save({ ...editInput, pacienteId: patients[2] })).status, 404);
    assert.deepEqual(await snapshot(), unchanged);
    await assert.rejects(
      repository.update(professionals[0], patients[0], empty, () => true),
      (e) => e.code === '23514',
    );
    assert.deepEqual(await snapshot(), unchanged);
    assert.equal((await pool.query('select id from psicologia.fichas_clinicas')).rowCount, 0);
    const setStamp = async (stamp) => {
      await admin.query('BEGIN');
      try {
        await admin.query('SET LOCAL session_replication_role=replica');
        await admin.query(
          'update psicologia.fichas_clinicas set fecha_ultima_modificacion=$1 where paciente_id=$2',
          [stamp, patients[0]],
        );
        await admin.query('COMMIT');
      } catch (e) {
        await admin.query('ROLLBACK');
        throw e;
      }
    }; // Solo fixture local: mantener dos versiones diferentes dentro del mismo milisegundo.
    await setStamp('2026-01-01T00:00:00.000001Z');
    const microOne = await editor.load({ pacienteId: patients[0] });
    await setStamp('2026-01-01T00:00:00.000002Z');
    const microTwo = await editor.load({ pacienteId: patients[0] });
    assert.notEqual(microOne.body.ficha.version, microTwo.body.ficha.version);
    assert.equal(
      (await editor.save({ ...editInput, version: microOne.body.ficha.version })).status,
      409,
    );
    assert.equal(
      (await editor.save({ ...editInput, version: microTwo.body.ficha.version })).status,
      200,
    );
    assert.deepEqual(await related(), before);
    console.log(
      'CU07 PostgreSQL: seis campos/NULL, unicidad concurrente, microsegundos, aislamiento, fechas/relaciones y rollback aprobados.',
    );
    console.log(
      'CU06 PostgreSQL: lectura propia/ausente, textos y fechas, aislamiento, contexto tras fallo y registros intactos aprobados.',
    );
    console.log(
      'CU05 PostgreSQL: motivo único obligatorio, opcionales/formato, unicidad concurrente, contenido intacto, aislamiento, relaciones y rollback aprobados.',
    );
  } finally {
    await pool.end();
  }
}
