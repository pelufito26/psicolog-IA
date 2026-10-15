import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PgPacienteRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-repository.js';
import { createRegistrar } from '../../apps/api/dist/modules/pacientes/application/registrar.js';
export async function testPacientes(client, url) {
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 2,
    onConnect: async (connection) => {
      await connection.query('SET ROLE psicologia_backend');
    },
  });
  try {
    const professionals = await client.query(
      "insert into psicologia.profesionales(nombre,apellido,email) values('Demo','Uno',$1),('Demo','Dos',$2) returning id",
      [randomUUID() + '@example.invalid', randomUUID() + '@example.invalid'],
    );
    const [a, b] = professionals.rows.map((row) => row.id);
    const repository = new PgPacienteRepository(pool);
    const one = createRegistrar(repository, a),
      two = createRegistrar(repository, b);
    const data = {
      nombre: 'José María',
      apellido: 'Prueba',
      fechaNacimiento: '2000-01-01',
      telefono: '+59899123456',
    };
    assert.equal((await one(data)).status, 201);
    const warning = await one({ ...data, nombre: '  JOSE   maria ' });
    assert.equal(warning.status, 409);
    assert.equal(
      (
        await client.query(
          'select count(*)::int as n from psicologia.pacientes where profesional_id=$1',
          [a],
        )
      ).rows[0].n,
      1,
    );
    assert.equal((await two(data)).status, 201); // No se revela coincidencia ajena.
    assert.equal(
      (await two({ ...data, confirmacionDuplicado: warning.body.confirmacionDuplicado })).body
        .codigo,
      'CONFIRMACION_INVALIDA',
    );
    assert.equal(
      (
        await one({
          ...data,
          nombre: 'JOSE maria',
          confirmacionDuplicado: warning.body.confirmacionDuplicado,
        })
      ).status,
      201,
    );
    assert.equal(
      (
        await one({
          ...data,
          telefono: '1234567',
          confirmacionDuplicado: warning.body.confirmacionDuplicado,
        })
      ).status,
      409,
    );
    assert.equal((await one({ ...data, fechaNacimiento: '2000-01-02' })).status, 201);
    assert.equal((await createRegistrar(repository, randomUUID())(data)).status, 503);
    const race = { ...data, nombre: 'Concurrente' };
    const results = await Promise.all([one(race), one(race)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    const stored = (
      await client.query(
        'select nombre,telefono,fecha_nacimiento::text as nacimiento from psicologia.pacientes where profesional_id=$1 order by fecha_creacion',
        [a],
      )
    ).rows;
    assert.equal(stored[0].telefono, '+59899123456');
    assert.equal(stored[0].nacimiento, '2000-01-01');
    assert.equal(
      (await client.query('select count(*)::int as n from psicologia.fichas_clinicas')).rows[0].n,
      0,
    );
    console.log(
      'CU01 PostgreSQL: alta, advertencia, confirmación, aislamiento de contexto y concurrencia aprobados.',
    );
  } finally {
    await pool.end();
  }
}
