import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { createEditar } from '../../apps/api/dist/modules/pacientes/application/editar.js';
import { PgEdicionRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-edicion.js';
import { createRegistrar } from '../../apps/api/dist/modules/pacientes/application/registrar.js';
import { PgPacienteRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-repository.js';
export async function testEdicion(admin, url) {
  const prof = [randomUUID(), randomUUID()];
  for (const id of prof)
    await admin.query(
      "insert into psicologia.profesionales(id,nombre,apellido,email) values($1,'Edición','Ficticia',$2)",
      [id, id + '@example.invalid'],
    );
  const ids = [];
  for (const [professional, nombre] of [
    [prof[0], 'Original'],
    [prof[0], 'Duplicado'],
    [prof[1], 'Ajeno'],
  ])
    ids.push(
      (
        await admin.query(
          "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,$2,'Edición','2000-01-01','0000000') returning id",
          [professional, nombre],
        )
      ).rows[0].id,
    );
  await admin.query(
    "insert into psicologia.fichas_clinicas(paciente_id,motivo_consulta) values($1,'Solo ficticio')",
    [ids[0]],
  );
  await admin.query(
    "insert into psicologia.sesiones_clinicas(paciente_id,profesional_id,fecha_sesion,anotaciones_clinicas) values($1,$2,'2000-01-01','Solo ficticio')",
    [ids[0], prof[0]],
  );
  const snapshot = async () =>
    (
      await admin.query(
        'select id,profesional_id,fecha_creacion::text as created,fecha_ultima_modificacion::text as stamp,nombre,telefono from psicologia.pacientes where id=$1',
        [ids[0]],
      )
    ).rows[0];
  const clinical = async () =>
    (
      await admin.query(
        'select (select to_jsonb(f) from psicologia.fichas_clinicas f where paciente_id=$1) ficha,(select to_jsonb(s) from psicologia.sesiones_clinicas s where paciente_id=$1) sesion',
        [ids[0]],
      )
    ).rows[0];
  const before = await snapshot(),
    clinicalBefore = await clinical();
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 4,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  try {
    const repo = new PgEdicionRepository(pool),
      secret = randomBytes(32),
      edit = createEditar(repo, prof[0], { secret });
    const first = (await edit.load({ id: ids[0] })).body;
    assert.equal(first.stamp, undefined);
    assert.equal((await repo.load(prof[0], ids[0])).stamp, before.stamp);
    assert.equal((await edit.save({ ...first, telefono: '1111111' })).status, 200); // El propio paciente no es duplicado.
    const after = await snapshot();
    assert.equal(after.id, before.id);
    assert.equal(after.profesional_id, before.profesional_id);
    assert.equal(after.created, before.created);
    assert.notEqual(after.stamp, before.stamp);
    assert.equal(after.telefono, '1111111');
    assert.deepEqual(await clinical(), clinicalBefore);
    assert.equal(
      (await edit.save({ ...first, telefono: '2222222' })).body.codigo,
      'EDICION_CONFLICTO',
    );
    assert.deepEqual(await snapshot(), after);
    const fresh = (await edit.load({ id: ids[0] })).body,
      duplicate = { ...fresh, nombre: 'Duplicado' };
    const warning = await edit.save(duplicate);
    assert.equal(warning.body.codigo, 'POSIBLE_DUPLICADO');
    assert.deepEqual(await snapshot(), after);
    assert.equal(
      (
        await edit.save({
          ...duplicate,
          telefono: '3333333',
          confirmacionDuplicado: warning.body.confirmacionDuplicado,
        })
      ).status,
      400,
    );
    assert.equal(
      (await edit.save({ ...duplicate, confirmacionDuplicado: warning.body.confirmacionDuplicado }))
        .status,
      200,
    );
    assert.equal(
      (await edit.save({ ...duplicate, confirmacionDuplicado: warning.body.confirmacionDuplicado }))
        .body.codigo,
      'EDICION_CONFLICTO',
    );
    const pendingInput = (await edit.load({ id: ids[0] })).body;
    const pendingWarning = await edit.save({ ...pendingInput, telefono: '4444444' });
    assert.equal(pendingWarning.body.codigo, 'POSIBLE_DUPLICADO');
    const pendingRow = await repo.load(prof[0], ids[0]);
    assert.equal(
      (
        await repo.update(
          prof[0],
          ids[0],
          {
            nombre: pendingRow.nombre,
            apellido: pendingRow.apellido,
            fechaNacimiento: pendingRow.fechaNacimiento,
            telefono: '5555555',
          },
          pendingRow.stamp,
          true,
        )
      ).kind,
      'updated',
    );
    assert.equal(
      (
        await edit.save({
          ...pendingInput,
          telefono: '4444444',
          confirmacionDuplicado: pendingWarning.body.confirmacionDuplicado,
        })
      ).body.codigo,
      'EDICION_CONFLICTO',
    );
    assert.equal((await snapshot()).telefono, '5555555');
    const raceInput = (await edit.load({ id: ids[0] })).body;
    const race = await Promise.all([
      edit.save({ ...raceInput, nombre: 'Carrera A' }),
      edit.save({ ...raceInput, nombre: 'Carrera B' }),
    ]);
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
    const absent = randomUUID();
    assert.deepEqual(await edit.load({ id: ids[2] }), await edit.load({ id: absent }));
    assert.deepEqual(
      await edit.save({ ...raceInput, id: ids[2] }),
      await edit.save({ ...raceInput, id: absent }),
    );
    const foreignBefore = (
      await admin.query('select to_jsonb(p) as data from psicologia.pacientes p where id=$1', [
        ids[2],
      ])
    ).rows[0].data;
    assert.equal(
      (
        await repo.update(
          prof[0],
          ids[2],
          { nombre: 'No', apellido: 'No', fechaNacimiento: '2000-01-01', telefono: '0000000' },
          '',
          true,
        )
      ).kind,
      'missing',
    );
    assert.deepEqual(
      (
        await admin.query('select to_jsonb(p) as data from psicologia.pacientes p where id=$1', [
          ids[2],
        ])
      ).rows[0].data,
      foreignBefore,
    );
    const current = await repo.load(prof[0], ids[0]),
      beforeFailure = await snapshot();
    await assert.rejects(
      repo.update(
        prof[0],
        ids[0],
        { nombre: '', apellido: 'Rollback', fechaNacimiento: '2000-01-01', telefono: '0000000' },
        current.stamp,
        true,
      ),
      (e) => e.code === '23514',
    );
    assert.deepEqual(await snapshot(), beforeFailure);
    const raceFresh = (await edit.load({ id: ids[0] })).body;
    const registration = {
      nombre: 'Carrera alta edición',
      apellido: 'Edición',
      fechaNacimiento: '2000-01-01',
      telefono: '0000000',
    };
    const combined = await Promise.all([
      edit.save({ ...raceFresh, ...registration }),
      createRegistrar(new PgPacienteRepository(pool), prof[0])({ ...registration }),
    ]);
    assert.equal(combined.filter((r) => r.status === 200 || r.status === 201).length, 1);
    assert.equal(combined.filter((r) => r.body.codigo === 'POSIBLE_DUPLICADO').length, 1);
    assert.equal(
      (
        await admin.query(
          'select count(*)::int as n from psicologia.pacientes where profesional_id=$1 and nombre=$2',
          [prof[0], registration.nombre],
        )
      ).rows[0].n,
      1,
    );
    assert.deepEqual(await clinical(), clinicalBefore);
    // Cada conexión del pool queda sin contexto después de COMMIT/ROLLBACK.
    const connections = await Promise.all(Array.from({ length: 4 }, () => pool.connect()));
    try {
      for (const c of connections)
        assert.equal((await c.query('select id from psicologia.pacientes')).rowCount, 0);
    } finally {
      for (const c of connections) c.release();
    }
    console.log(
      'CU04 PostgreSQL: edición propia, duplicados/confirmación, versiones y carreras alta/edición, aislamiento, relaciones y rollback aprobados.',
    );
  } finally {
    await pool.end();
  }
}
