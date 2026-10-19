import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { createFicha } from '../../apps/api/dist/modules/fichas-clinicas/application/ficha.js';
import { PgFichaRepository } from '../../apps/api/dist/modules/fichas-clinicas/infrastructure/pg-ficha.js';
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
    console.log(
      'CU05 PostgreSQL: motivo único obligatorio, opcionales/formato, unicidad concurrente, contenido intacto, aislamiento, relaciones y rollback aprobados.',
    );
  } finally {
    await pool.end();
  }
}
