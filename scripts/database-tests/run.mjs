import { testListado } from './listado.mjs';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Client, Pool } from 'pg';
import { checkDatabase } from '../../apps/api/dist/infrastructure/database/connection.js';
import { testPacientes } from './pacientes.mjs';

// Solo instancias desechables locales. Nunca usar DATABASE_URL ni un host de Supabase.
const url = new URL(process.env.TEST_DATABASE_URL ?? '');
if (
  process.env.TEST_DISPOSABLE_DATABASES !== '1' ||
  !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
) {
  throw new Error(
    'Se requiere PostgreSQL local desechable y autorización TEST_DISPOSPOSABLE_DATABASES=1',
  );
}
const admin = new Client({ connectionString: url.toString(), ssl: false });
await admin.connect();
let cases = 0;
async function ok(client, sql, values = []) {
  const result = await client.query(sql, values);
  cases++;
  return result;
}
async function rejected(client, sql, code, values = []) {
  await client.query('SAVEPOINT expected_failure');
  try {
    await assert.rejects(client.query(sql, values), (error) => error.code === code);
    cases++;
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT expected_failure');
    await client.query('RELEASE SAVEPOINT expected_failure');
  }
}
const snapshots = [];
try {
  const version = await admin.query("select current_setting('server_version_num')::int as version");
  assert.ok(version.rows[0].version >= 170000 && version.rows[0].version < 180000);
  assert.equal(
    (await admin.query("select 1 from pg_roles where rolname='psicologia_backend'")).rowCount,
    0,
    'Usar instancia aislada sin rol de aplicación preexistente',
  );
  for (const role of ['anon', 'authenticated']) {
    if (!(await admin.query('select 1 from pg_roles where rolname=$1', [role])).rowCount) {
      await admin.query(`CREATE ROLE ${role} NOLOGIN`);
    }
  }
  for (let round = 0; round < 2; round++) {
    const name = 'psicologia_test_' + randomUUID().replaceAll('-', '');
    await admin.query(`CREATE DATABASE "${name}"`);
    const databaseUrl = new URL(url);
    databaseUrl.pathname = '/' + name;
    const client = new Client({ connectionString: databaseUrl.toString(), ssl: false });
    await client.connect();
    try {
      await client.query(
        'create schema migration_evidence; create table migration_evidence.applied(name text primary key, sql text not null)',
      );
      const migrations = (await readdir(new URL('../../supabase/migrations/', import.meta.url)))
        .filter((file) => file.endsWith('.sql'))
        .sort();
      for (const migration of migrations) {
        const sql = await readFile(
          new URL('../../supabase/migrations/' + migration, import.meta.url),
          'utf8',
        );
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('insert into migration_evidence.applied values($1,$2)', [
            migration,
            sql,
          ]);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
      snapshots.push(
        (
          await client.query(
            "select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='psicologia' order by table_name,ordinal_position",
          )
        ).rows,
      );
      assert.equal(
        (
          await client.query(
            "select count(*)::int as n from pg_tables where schemaname='psicologia' and rowsecurity",
          )
        ).rows[0].n,
        4,
      );
      await client.query('BEGIN');
      const p1 = (
        await ok(
          client,
          "insert into psicologia.profesionales(nombre,apellido,email) values('Nombre','Ficticio','  TEST@example.invalid  ') returning id",
        )
      ).rows[0].id;
      const p2 = (
        await ok(
          client,
          "insert into psicologia.profesionales(nombre,apellido,email) values('Otro','Ficticio','otro@example.invalid') returning id",
        )
      ).rows[0].id;
      await rejected(
        client,
        "insert into psicologia.profesionales(nombre,apellido,email) values('A','B',E'\\tTest@example.invalid\\n')",
        '23505',
      );
      await rejected(
        client,
        "insert into psicologia.profesionales(nombre,apellido,email) values(' ','B','x@example.invalid')",
        '23514',
      );
      await rejected(
        client,
        "insert into psicologia.pacientes(nombre,apellido,fecha_nacimiento,telefono) values('A','B','2000-01-01','ficticio')",
        '23502',
      );
      const createPatient =
        "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'Paciente','Ficticio','2000-01-01','ficticio') returning id";
      const a = (await ok(client, createPatient, [p1])).rows[0].id;
      const b = (await ok(client, createPatient, [p1])).rows[0].id; // Duplicado permitido.
      await rejected(client, createPatient, '23503', [randomUUID()]);
      await rejected(
        client,
        "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'A','B',psicologia.hoy_clinico(clock_timestamp())+1,'ficticio')",
        '23514',
        [p1],
      );
      await rejected(client, "update psicologia.pacientes set telefono=' ' where id=$1", '23514', [
        a,
      ]);
      await rejected(
        client,
        'update psicologia.pacientes set profesional_id=$1 where id=$2',
        '23514',
        [p2, a],
      );
      const session =
        "insert into psicologia.sesiones_clinicas(paciente_id,profesional_id,fecha_sesion,anotaciones_clinicas) values($1,$2,psicologia.hoy_clinico(clock_timestamp()),'Ficticio') returning id";
      const s = (await ok(client, session, [a, p1])).rows[0].id;
      await ok(client, session, [a, p1]);
      await rejected(client, session, '23503', [a, p2]);
      await rejected(
        client,
        'update psicologia.sesiones_clinicas set fecha_sesion=psicologia.hoy_clinico(clock_timestamp())+1 where id=$1',
        '23514',
        [s],
      );
      await rejected(
        client,
        "update psicologia.sesiones_clinicas set anotaciones_clinicas=' ' where id=$1",
        '23514',
        [s],
      );
      await rejected(
        client,
        'update psicologia.sesiones_clinicas set paciente_id=$1 where id=$2',
        '23514',
        [b, s],
      );
      await rejected(
        client,
        'update psicologia.sesiones_clinicas set profesional_id=$1 where id=$2',
        '23514',
        [p2, s],
      );
      await ok(
        client,
        "update psicologia.sesiones_clinicas set fecha_sesion='2000-01-01',anotaciones_clinicas='Edición ficticia' where id=$1",
        [s],
      );
      await rejected(
        client,
        "insert into psicologia.fichas_clinicas(paciente_id,motivo_consulta) values($1,' ')",
        '23514',
        [a],
      );
      const f = (
        await ok(
          client,
          "insert into psicologia.fichas_clinicas(paciente_id,motivo_consulta) values($1,'Ficticio') returning id",
          [a],
        )
      ).rows[0].id;
      await rejected(
        client,
        "insert into psicologia.fichas_clinicas(paciente_id,motivo_consulta) values($1,'Ficticio')",
        '23505',
        [a],
      );
      await rejected(
        client,
        'update psicologia.fichas_clinicas set paciente_id=$1 where id=$2',
        '23514',
        [b, f],
      );
      for (const [table, id] of [
        ['profesionales', p1],
        ['pacientes', a],
        ['fichas_clinicas', f],
        ['sesiones_clinicas', s],
      ]) {
        await rejected(
          client,
          `update psicologia.${table} set id=gen_random_uuid() where id=$1`,
          '23514',
          [id],
        );
        await rejected(
          client,
          `update psicologia.${table} set fecha_creacion='2000-01-01' where id=$1`,
          '23514',
          [id],
        );
      }
      await rejected(
        client,
        'update psicologia.pacientes set fecha_nacimiento=psicologia.hoy_clinico(clock_timestamp())+1 where id=$1',
        '23514',
        [a],
      );
      await rejected(
        client,
        "insert into psicologia.sesiones_clinicas(paciente_id,profesional_id,fecha_sesion,anotaciones_clinicas) values($1,$2,psicologia.hoy_clinico(clock_timestamp())+1,'Ficticio')",
        '23514',
        [a, p1],
      );
      await rejected(
        client,
        "insert into psicologia.fichas_clinicas(paciente_id,motivo_consulta) values($1,'Ficticio')",
        '23503',
        [randomUUID()],
      );
      for (const [table, id] of [
        ['profesionales', p1],
        ['pacientes', a],
        ['fichas_clinicas', f],
        ['sesiones_clinicas', s],
      ]) {
        const stamps = (
          await client.query(
            `select fecha_creacion,fecha_ultima_modificacion from psicologia.${table} where id=$1`,
            [id],
          )
        ).rows[0];
        assert.ok(
          stamps.fecha_creacion instanceof Date && stamps.fecha_ultima_modificacion instanceof Date,
        );
        cases++;
      }
      const columns = snapshots[round].map((column) => column.column_name);
      assert.ok(!columns.includes('edad'));
      assert.ok(
        !snapshots[round].some(
          (column) =>
            column.table_name === 'fichas_clinicas' && column.column_name === 'profesional_id',
        ),
      );
      cases++;
      const before = (
        await client.query(
          'select fecha_creacion,fecha_ultima_modificacion from psicologia.pacientes where id=$1',
          [a],
        )
      ).rows[0];
      await client.query('select pg_sleep(0.01)');
      const after = (
        await ok(
          client,
          "update psicologia.pacientes set nombre='Editado' where id=$1 returning fecha_creacion,fecha_ultima_modificacion",
          [a],
        )
      ).rows[0];
      assert.deepEqual(after.fecha_creacion, before.fecha_creacion);
      assert.ok(after.fecha_ultima_modificacion > before.fecha_ultima_modificacion);
      const dates = (
        await client.query(
          "select psicologia.hoy_clinico('2026-10-15T02:59:59Z')::text as before, psicologia.hoy_clinico('2026-10-15T03:00:00Z')::text as after",
        )
      ).rows[0];
      assert.deepEqual(dates, { before: '2026-10-14', after: '2026-10-15' });
      for (const role of ['anon', 'authenticated']) {
        await client.query(`SET LOCAL ROLE ${role}`);
        await rejected(client, 'select * from psicologia.pacientes', '42501');
        await client.query('RESET ROLE');
      }
      await client.query('SET LOCAL ROLE psicologia_backend');
      await ok(client, 'select * from psicologia.pacientes');
      await ok(client, createPatient, [p1]);
      await rejected(client, 'delete from psicologia.pacientes', '42501');
      await rejected(client, 'create table psicologia.no_permitida(id int)', '42501');
      await client.query('RESET ROLE');
      await rejected(client, 'delete from psicologia.profesionales where id=$1', '23503', [p1]);
      await client.query('ROLLBACK');
      assert.equal(
        (await client.query('select count(*)::int as n from psicologia.profesionales')).rows[0].n,
        0,
      );
      const pool = new Pool({ connectionString: databaseUrl.toString(), ssl: false, max: 2 });
      const adapter = {
        connect: async () => {
          const connected = await pool.connect();
          await connected.query('SET ROLE psicologia_backend');
          return connected;
        },
        end: () => pool.end(),
      };
      await checkDatabase(adapter);
      assert.equal(
        (await client.query('select count(*)::int as n from psicologia.profesionales')).rows[0].n,
        0,
      );
      cases++;
      await testPacientes(client, databaseUrl.toString());
      await testListado(client, databaseUrl.toString());
    } finally {
      await client.end();
      // Solo nombres recién generados en una instancia local explícitamente desechable.
      await admin.query(`DROP DATABASE "${name}"`);
      await admin.query('DROP ROLE IF EXISTS psicologia_backend');
    }
  }
  assert.deepEqual(snapshots[0], snapshots[1]);
  console.log(
    `PostgreSQL 17: ${cases} ensayos aprobados, dos bases vacías reproducibles y rollback confirmado.`,
  );
} finally {
  await admin.end();
}
