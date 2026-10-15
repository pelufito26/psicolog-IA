import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PgPerfilRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-perfil.js';
import { createPerfil } from '../../apps/api/dist/modules/pacientes/application/perfil.js';
import { createListar } from '../../apps/api/dist/modules/pacientes/application/listar.js';
import { PgConsultaRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-consulta.js';
export async function testPerfil(admin, url) {
  const professionals = [randomUUID(), randomUUID()];
  const patients = [];
  for (const professional of professionals) {
    await admin.query(
      "insert into psicologia.profesionales(id,nombre,apellido,email) values($1,'Perfil','Ficticio',$2)",
      [professional, professional + '@example.invalid'],
    );
    for (let n = 0; n < 2; n++)
      patients.push(
        (
          await admin.query(
            "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'Mismo nombre','Ficticio','2000-02-29',$2) returning id",
            [professional, '000000' + n],
          )
        ).rows[0].id,
      );
  }
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 1,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  try {
    const repo = new PgPerfilRepository(pool);
    const now = () => new Date('2025-03-01T02:59:59Z');
    const profile = createPerfil(repo, professionals[0], now);
    const own = await profile({ id: patients[0] });
    assert.equal(own.status, 200);
    assert.equal(own.body.fechaNacimiento, '2000-02-29');
    assert.equal(own.body.edad, 24);
    assert.equal(own.body.telefono, '0000000');
    assert.equal((await profile({ id: patients[1] })).body.telefono, '0000001');
    assert.deepEqual(await profile({ id: patients[2] }), await profile({ id: randomUUID() }));
    assert.equal(
      (await createPerfil(repo, professionals[1], now)({ id: patients[2] })).status,
      200,
    );
    assert.equal((await profile({ id: patients[0], profesional: professionals[1] })).status, 400);
    const list = await createListar(
      new PgConsultaRepository(pool),
      professionals[0],
      now,
    )({ busqueda: '', pagina: 1 });
    assert.equal(list.body.pacientes[0].edad, own.body.edad);
    assert.equal((await pool.query('select id from psicologia.pacientes')).rowCount, 0);
    // La consulta también deniega propiedad ajena si un llamador evita el caso de uso.
    assert.equal(await repo.find(professionals[1], patients[0]), null);
    await assert.rejects(repo.find('', patients[0]), (error) => error.code === '22P02');
    assert.equal((await pool.query('select id from psicologia.pacientes')).rowCount, 0);
    console.log(
      'CU03 PostgreSQL: perfil por ID, nombres iguales, edad compartida, acceso propio/ajeno/inexistente y contexto transaccional aprobados.',
    );
  } finally {
    await pool.end();
  }
}
