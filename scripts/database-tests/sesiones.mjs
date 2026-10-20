import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  createSesiones,
  operationSessionId,
} from '../../apps/api/dist/modules/sesiones-clinicas/application/sesiones.js';
import { PgSesionRepository } from '../../apps/api/dist/modules/sesiones-clinicas/infrastructure/pg-sesiones.js';
import { createEditarSesion } from '../../apps/api/dist/modules/sesiones-clinicas/application/editar-sesion.js';
export async function testSesiones(admin, url) {
  const professionals = [randomUUID(), randomUUID()],
    patients = [];
  for (const prof of professionals) {
    await admin.query(
      "insert into psicologia.profesionales(id,nombre,apellido,email) values($1,'Profesional','Sesiones',$2)",
      [prof, prof + '@example.invalid'],
    );
    for (let i = 0; i < 2; i++)
      patients.push(
        (
          await admin.query(
            "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'Demo','Sesiones','2000-01-01','0000000') returning id",
            [prof],
          )
        ).rows[0].id,
      );
  }
  const unchanged = async () =>
    (
      await admin.query(
        `select (select jsonb_agg(to_jsonb(p) order by id) from psicologia.pacientes p) pacientes,(select jsonb_agg(to_jsonb(f) order by id) from psicologia.fichas_clinicas f) fichas`,
      )
    ).rows[0];
  const before = await unchanged();
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 2,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  try {
    const repo = new PgSesionRepository(pool),
      s = createSesiones(repo, professionals[0]),
      other = createSesiones(repo, professionals[1]);
    assert.equal((await s.prepare({ pacienteId: patients[0] })).status, 200);
    assert.deepEqual((await s.history({ pacienteId: patients[0], pagina: 1 })).body.sesiones, []);
    const input = {
      pacienteId: patients[0],
      operacionId: randomUUID(),
      fechaSesion: '2000-01-01',
      anotacionesClinicas: '  Nota ficticia\n  segunda línea  ',
    };
    const attempts = await Promise.all([s.register(input), s.register(input)]);
    assert.deepEqual(attempts.map((x) => x.status).sort(), [200, 201]);
    const id = attempts[0].body.id;
    assert.equal((await createSesiones(repo, professionals[0]).register(input)).body.id, id);
    assert.equal((await s.register({ ...input, anotacionesClinicas: 'Otro texto' })).status, 409);
    assert.equal((await s.register({ ...input, operacionId: randomUUID() })).status, 201);
    assert.equal(
      (
        await admin.query(
          'select count(*)::int n from psicologia.sesiones_clinicas where paciente_id=$1',
          [patients[0]],
        )
      ).rows[0].n,
      2,
    );
    const detail = await s.detail({ pacienteId: patients[0], sesionId: id });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.sesion.fechaSesion, '2000-01-01');
    assert.equal(detail.body.sesion.anotacionesClinicas, 'Nota ficticia\n  segunda línea');
    assert.ok(detail.body.sesion.fechaCreacion);
    assert.ok(detail.body.sesion.fechaUltimaModificacion);
    assert.equal(detail.body.nombre, 'Demo');
    assert.equal(detail.body.sesion.profesional.nombre, 'Profesional');
    assert.deepEqual(
      (await s.check({ pacienteId: patients[0], operacionId: input.operacionId })).body,
      { estado: 'registrada', id },
    );
    assert.deepEqual((await s.check({ pacienteId: patients[0], operacionId: randomUUID() })).body, {
      estado: 'no-confirmada',
    });
    const absent = randomUUID();
    for (const operation of ['prepare', 'history', 'check', 'register']) {
      const extra =
        operation === 'history'
          ? { pagina: 1 }
          : operation === 'check'
            ? { operacionId: input.operacionId }
            : operation === 'register'
              ? input
              : {};
      const a = await other[operation]({ ...extra, pacienteId: patients[0] }),
        b = await other[operation]({ ...extra, pacienteId: absent });
      assert.equal(a.status, 404);
      assert.deepEqual(a, b);
    }
    const missingDetail = await s.detail({ pacienteId: patients[0], sesionId: absent });
    assert.equal(missingDetail.status, 404);
    assert.deepEqual(await other.detail({ pacienteId: patients[0], sesionId: id }), missingDetail);
    assert.deepEqual(await s.detail({ pacienteId: patients[1], sesionId: id }), missingDetail);
    await admin.query(
      "insert into psicologia.sesiones_clinicas(paciente_id,profesional_id,fecha_sesion,anotaciones_clinicas) select $1,$2,'2020-01-01','Fixture ficticia' from generate_series(1,25)",
      [patients[0], professionals[0]],
    );
    await admin.query('BEGIN');
    try {
      await admin.query('SET LOCAL session_replication_role=replica');
      await admin.query(
        "update psicologia.sesiones_clinicas set fecha_creacion='2020-01-01T12:00:00Z' where paciente_id=$1 and fecha_sesion='2020-01-01'",
        [patients[0]],
      );
      await admin.query('COMMIT');
    } catch (e) {
      await admin.query('ROLLBACK');
      throw e;
    }
    const expected = (
      await admin.query(
        'select id from psicologia.sesiones_clinicas where paciente_id=$1 order by fecha_sesion desc,fecha_creacion desc,id desc',
        [patients[0]],
      )
    ).rows.map((x) => x.id);
    const first = await s.history({ pacienteId: patients[0], pagina: 1 }),
      second = await s.history({ pacienteId: patients[0], pagina: 2 });
    assert.equal(first.body.haySiguiente, true);
    assert.equal(first.body.sesiones.length, 20);
    assert.equal(second.body.sesiones.length, 7);
    assert.equal(second.body.haySiguiente, false);
    assert.deepEqual(
      [...first.body.sesiones, ...second.body.sesiones].map((x) => x.id),
      expected,
    );
    assert.ok(first.body.sesiones.every((x) => !Object.hasOwn(x, 'anotacionesClinicas')));
    const snapshot = async () =>
      (
        await admin.query(
          'select jsonb_agg(to_jsonb(s) order by id) data from psicologia.sesiones_clinicas s',
        )
      ).rows[0].data;
    const stored = await snapshot();
    await s.detail({ pacienteId: patients[0], sesionId: id });
    await s.check({ pacienteId: patients[0], operacionId: input.operacionId });
    await s.prepare({ pacienteId: patients[0] });
    assert.deepEqual(await snapshot(), stored);
    assert.deepEqual(await unchanged(), before);
    await assert.rejects(
      repo.register(professionals[0], patients[0], randomUUID(), {
        fechaSesion: '2000-01-01',
        anotacionesClinicas: ' ',
      }),
      (e) => e.code === '23514',
    );
    assert.deepEqual(await snapshot(), stored);
    assert.equal((await pool.query('select id from psicologia.sesiones_clinicas')).rowCount, 0);
    assert.equal((await s.history({ pacienteId: patients[0], pagina: 1 })).status, 200);
    assert.notEqual(
      operationSessionId(professionals[0], patients[0], input.operacionId),
      operationSessionId(professionals[1], patients[0], input.operacionId),
    );
    const edit = createEditarSesion(repo, professionals[0], Buffer.alloc(32, 4)),
      foreignEdit = createEditarSesion(repo, professionals[1], Buffer.alloc(32, 4)),
      editInput = { pacienteId: patients[0], sesionId: id };
    const loaded = await edit.load(editInput);
    assert.equal(loaded.status, 200);
    const replacement = {
      ...editInput,
      version: loaded.body.sesion.version,
      fechaSesion: '2025-01-01',
      anotacionesClinicas: '  <b>Edición ficticia</b>\n  texto  ',
    };
    for (const service of [edit, foreignEdit]) {
      const missing = await service.load({ ...editInput, sesionId: absent });
      assert.equal(missing.status, 404);
      assert.deepEqual(await service.load({ ...editInput, pacienteId: patients[1] }), missing);
      if (service === foreignEdit) {
        assert.deepEqual(await service.load(editInput), missing);
        assert.deepEqual(await service.save(replacement), missing);
      }
    }
    const updates = await Promise.all([
      edit.save(replacement),
      edit.save({ ...replacement, anotacionesClinicas: 'Otro editor' }),
    ]);
    assert.deepEqual(updates.map((x) => x.status).sort(), [200, 409]);
    const edited = await s.detail(editInput);
    assert.equal(edited.body.sesion.id, id);
    assert.equal(edited.body.sesion.fechaCreacion, detail.body.sesion.fechaCreacion);
    assert.deepEqual(edited.body.sesion.profesional, detail.body.sesion.profesional);
    assert.notEqual(
      edited.body.sesion.fechaUltimaModificacion,
      detail.body.sesion.fechaUltimaModificacion,
    );
    assert.equal((await s.history({ pacienteId: patients[0], pagina: 1 })).body.sesiones[0].id, id);
    const afterEdit = await snapshot();
    assert.deepEqual(
      afterEdit.filter((x) => x.id !== id),
      stored.filter((x) => x.id !== id),
    );
    assert.deepEqual(await unchanged(), before);
    assert.equal((await s.register(input)).status, 409);
    await s.check({ pacienteId: patients[0], operacionId: input.operacionId });
    await edit.load(editInput);
    assert.deepEqual(await snapshot(), afterEdit);
    await assert.rejects(
      repo.update(
        professionals[0],
        patients[0],
        id,
        { fechaSesion: '2001-01-01', anotacionesClinicas: ' ' },
        () => true,
      ),
      (e) => e.code === '23514',
    );
    assert.deepEqual(await snapshot(), afterEdit);
    assert.equal((await pool.query('select id from psicologia.sesiones_clinicas')).rowCount, 0);
    // Same millisecond, different microsecond: fixture bypass is restricted to this transaction.
    async function preciseStamp(value) {
      await admin.query('BEGIN');
      try {
        await admin.query('SET LOCAL session_replication_role=replica');
        await admin.query(
          'update psicologia.sesiones_clinicas set fecha_ultima_modificacion=$2 where id=$1',
          [id, value],
        );
        await admin.query('COMMIT');
      } catch (e) {
        await admin.query('ROLLBACK');
        throw e;
      }
    }
    await preciseStamp('2026-10-20T12:00:00.123456Z');
    const precise = await edit.load(editInput);
    await preciseStamp('2026-10-20T12:00:00.123457Z');
    const preciseBefore = await snapshot();
    assert.equal(
      (await edit.save({ ...replacement, version: precise.body.sesion.version })).status,
      409,
    );
    assert.deepEqual(await snapshot(), preciseBefore);
    console.log(
      'CU08–CU11 PostgreSQL: alta/reenvío, historial, edición antigua y concurrente, precisión microsegundos, orden, inmutables, aislamiento y rollback aprobados.',
    );
  } finally {
    await pool.end();
  }
}
