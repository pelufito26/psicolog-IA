import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PgConsultaRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-consulta.js';
import { createListar } from '../../apps/api/dist/modules/pacientes/application/listar.js';
export async function testListado(client, url) {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  for (const id of ids)
    await client.query(
      "insert into psicologia.profesionales(id,nombre,apellido,email) values($1,'Demo','Lista',$2)",
      [id, id + '@example.invalid'],
    );
  for (let i = 0; i < 21; i++)
    await client.query(
      "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,$2,'Álvarez','2000-02-29','0000000')",
      [ids[0], 'José ' + String(i).padStart(2, '0')],
    );
  await client.query(
    "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'Oculto','100%_','2000-01-01','0000000')",
    [ids[1]],
  );
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 2,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  try {
    const repo = new PgConsultaRepository(pool);
    const list = createListar(repo, ids[0], () => new Date('2025-03-01T01:00:00Z'));
    const first = await list({ busqueda: ' ALVAREZ ', pagina: 1 });
    assert.equal(first.status, 200);
    assert.equal(first.body.pacientes.length, 20);
    assert.equal(first.body.haySiguiente, true);
    assert.equal(first.body.pacientes[0].edad, 24); // Todavía 28/2 en Montevideo.
    assert.equal(first.body.pacientes[0].nombre, 'José 00');
    assert.equal(first.body.pacientes[0].fechaNacimiento, undefined);
    const second = await list({ busqueda: 'jose', pagina: 2 });
    assert.equal(second.body.pacientes.length, 1);
    assert.equal(second.body.haySiguiente, false);
    assert.equal((await list({ busqueda: '%', pagina: 1 })).body.pacientes.length, 0);
    assert.equal(
      (await createListar(repo, ids[1])({ busqueda: '%_', pagina: 1 })).body.pacientes.length,
      1,
    );
    assert.deepEqual(
      (await createListar(repo, ids[2])({ busqueda: '', pagina: 1 })).body.pacientes,
      [],
    );
    assert.equal((await createListar(repo, randomUUID())({ busqueda: '', pagina: 1 })).status, 503);
    console.log(
      'CU02 PostgreSQL: aislamiento, edad Montevideo, búsqueda literal, orden, dos páginas y contexto vacío aprobados.',
    );
  } finally {
    await pool.end();
  }
}
