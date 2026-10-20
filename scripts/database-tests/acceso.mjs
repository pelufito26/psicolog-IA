import { createEditarFicha } from '../../apps/api/dist/modules/fichas-clinicas/application/editar-ficha.js';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { AccessStore } from '../../apps/api/dist/modules/acceso/store.js';
import { AccessService, hash } from '../../apps/api/dist/modules/acceso/service.js';
import { accessHttp } from '../../apps/api/dist/modules/acceso/routes.js';
import { createApp } from '../../apps/api/dist/app.js';
import { createRegistrar } from '../../apps/api/dist/modules/pacientes/application/registrar.js';
import { createListar } from '../../apps/api/dist/modules/pacientes/application/listar.js';
import { createPerfil } from '../../apps/api/dist/modules/pacientes/application/perfil.js';
import { PgPerfilRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-perfil.js';
import { createEditar } from '../../apps/api/dist/modules/pacientes/application/editar.js';
import { PgEdicionRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-edicion.js';
import { createFicha } from '../../apps/api/dist/modules/fichas-clinicas/application/ficha.js';
import { PgFichaRepository } from '../../apps/api/dist/modules/fichas-clinicas/infrastructure/pg-ficha.js';
import { PgPacienteRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-repository.js';
import { PgConsultaRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-consulta.js';
import { fakeIdentity } from '../auth-tests/fakes.mjs';
export async function testAcceso(admin, url) {
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 4,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  let now = Date.now();
  const fake = fakeIdentity(),
    store = new AccessStore(pool),
    service = new AccessService(
      store,
      fake.identity,
      fake.mail,
      'clave-ficticia-de-pruebas-larga-000',
      () => now,
    );
  const email = randomUUID() + '@example.invalid',
    email2 = randomUUID() + '@example.invalid';
  const registration = {
    email,
    password: 'solo-prueba-123456',
    nombre: 'Demo',
    apellido: 'Autenticado',
  };
  let server;
  try {
    await fake.identity.register(registration);
    await assert.rejects(service.login(email, registration.password));
    await fake.identity.confirm(fake.outbox.at(-1).token);
    const pending = await service.login(email, registration.password),
      firstCode = fake.outbox.at(-1).code;
    assert.equal(await service.session(pending), null);
    await assert.rejects(service.resend(pending), (e) => e.status === 429);
    await assert.rejects(service.verify('otra-sesion', firstCode));
    const concurrent = await Promise.allSettled([
      service.verify(pending, firstCode),
      service.verify(pending, firstCode),
    ]);
    assert.equal(concurrent.filter((x) => x.status === 'fulfilled').length, 1);
    const session = concurrent.find((x) => x.status === 'fulfilled').value;
    const context = await service.session(session);
    assert.ok(context?.profesional);
    const owner = fake.accounts.get(email).id;
    const same = await Promise.all([
      store.account({ id: owner, email, nombre: 'Demo', apellido: 'Persona' }),
      store.account({ id: owner, email, nombre: 'Demo', apellido: 'Persona' }),
    ]);
    assert.deepEqual(same, [context.profesional, context.profesional]);
    await assert.rejects(
      store.account({ id: randomUUID(), email, nombre: 'No', apellido: 'Apropiar' }),
    );
    assert.equal(
      await store.account({ id: owner, email, nombre: 'No duplicar', apellido: 'Cuenta' }),
      context.profesional,
    );
    const stored = (
      await admin.query('select * from acceso.intentos where hash=$1', [hash(pending)])
    ).rows[0];
    assert.notEqual(stored.codigo, firstCode);
    assert.equal(stored.estado, 'consumido');
    now += 61000;
    const pending2 = await service.login(email, registration.password),
      oldCode = fake.outbox.at(-1).code;
    now += 61000;
    const replacement = await service.resend(pending2),
      code = fake.outbox.at(-1).code;
    await assert.rejects(service.verify(pending2, oldCode));
    const wrong = code === '000000' ? '999999' : '000000';
    for (let n = 0; n < 5; n++) await assert.rejects(service.verify(replacement, wrong));
    await assert.rejects(service.verify(replacement, code));
    now += 61000;
    const expired = await service.login(email, registration.password),
      expiredCode = fake.outbox.at(-1).code;
    now += 300001;
    await assert.rejects(service.verify(expired, expiredCode));
    // Fifth send is allowed; new login cannot reset the account-wide budget.
    await service.login(email, registration.password);
    now += 61000;
    await assert.rejects(service.login(email, registration.password), (e) => e.status === 429);
    await service.logout(session);
    assert.equal(await service.session(session), null);
    now += 900001;
    const p3 = await service.login(email, registration.password);
    const s3 = await service.verify(p3, fake.outbox.at(-1).code);
    now += 1800001;
    assert.equal(await service.session(s3), null);
    now += 900001;
    const p4 = await service.login(email, registration.password);
    const s4 = await service.verify(p4, fake.outbox.at(-1).code);
    await fake.identity.recover(email);
    const reset = fake.outbox.at(-1).token;
    await service.reset(reset, 'otra-prueba-123456');
    assert.equal(await service.session(s4), null);
    await assert.rejects(service.login(email, registration.password));
    await fake.identity.register({ ...registration, email: email2 });
    await fake.identity.confirm(fake.outbox.at(-1).token);
    // HTTP: cookie+CSRF gate, pending password alone, actual patient isolation.
    now += 61000;
    const editSecret = Buffer.alloc(32, 9);
    const editing = (professional) =>
      createEditar(new PgEdicionRepository(pool), professional, { secret: editSecret });
    const app = createApp({
      fichaEditLoad: (data, professional) =>
        createEditarFicha(new PgFichaRepository(pool), professional, editSecret).load(data),
      fichaEditSave: (data, professional) =>
        createEditarFicha(new PgFichaRepository(pool), professional, editSecret).save(data),
      fichaRead: (data, professional) =>
        createFicha(new PgFichaRepository(pool), professional).read(data),
      fichaState: (data, professional) =>
        createFicha(new PgFichaRepository(pool), professional).state(data),
      fichaCreate: (data, professional) =>
        createFicha(new PgFichaRepository(pool), professional).create(data),
      access: accessHttp(service),
      register: (data, professional) =>
        createRegistrar(new PgPacienteRepository(pool), professional)(data),
      list: (data, professional) =>
        createListar(new PgConsultaRepository(pool), professional)(data),
      profile: (data, professional) =>
        createPerfil(new PgPerfilRepository(pool), professional)(data),
      editLoad: (data, professional) => editing(professional).load(data),
      editSave: (data, professional) => editing(professional).save(data),
    });
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const jar = () => ({ cookie: '', csrf: '' });
    const one = jar(),
      two = jar();
    async function request(jar, path, data, extra = {}) {
      const response = await fetch(base + path, {
        method: data ? 'POST' : 'GET',
        headers: {
          cookie: jar.cookie,
          origin: 'http://127.0.0.1:5173',
          'content-type': 'application/json',
          'x-csrf-token': jar.csrf,
          ...extra,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      const cookie = response.headers.get('set-cookie');
      if (cookie) {
        assert.match(cookie, /HttpOnly/i);
        assert.match(cookie, /SameSite=Strict/i);
        jar.cookie = cookie.split(';')[0];
      }
      const body = await response.json();
      if (body.csrf) jar.csrf = body.csrf;
      assert.equal(response.headers.get('cache-control'), 'no-store');
      return { response, body };
    }
    await request(one, '/api/acceso/estado');
    const profileInput = { id: randomUUID() };
    const fichaInput = { pacienteId: profileInput.id, motivoConsulta: 'Solo prueba ficticia' };
    for (const path of ['/estado', '/crear', '/consultar', '/edicion', '/actualizar'])
      assert.equal(
        (await request(one, '/api/fichas-clinicas' + path, fichaInput)).response.status,
        401,
      );
    for (const path of ['/edicion', '/actualizar'])
      assert.equal(
        (await request(one, '/api/pacientes' + path, profileInput)).response.status,
        401,
      );
    assert.equal(
      (await request(one, '/api/pacientes/perfil', profileInput, { authorization: 'Bearer falso' }))
        .response.status,
      401,
    );
    assert.equal(
      (
        await request(
          one,
          '/api/pacientes/consulta',
          { busqueda: '', pagina: 1 },
          { authorization: 'Bearer falso' },
        )
      ).response.status,
      401,
    );
    assert.equal(
      (
        await request(
          one,
          '/api/acceso/ingresar',
          { email, password: 'otra-prueba-123456' },
          { origin: 'https://ajeno.invalid' },
        )
      ).response.status,
      403,
    );
    assert.equal(
      (
        await request(
          one,
          '/api/acceso/ingresar',
          { email, password: 'otra-prueba-123456' },
          { 'x-csrf-token': 'falso' },
        )
      ).response.status,
      403,
    );
    assert.equal(
      (await request(one, '/api/acceso/ingresar', { email, password: 'otra-prueba-123456' })).body
        .estado,
      'codigo',
    );
    assert.equal(
      (await request(one, '/api/pacientes/consulta', { busqueda: '', pagina: 1 })).response.status,
      401,
    );
    const codeOne = fake.outbox.at(-1).code;
    for (const path of ['/estado', '/crear', '/consultar', '/edicion', '/actualizar'])
      assert.equal(
        (await request(one, '/api/fichas-clinicas' + path, fichaInput)).response.status,
        401,
      );
    for (const path of ['/edicion', '/actualizar'])
      assert.equal(
        (await request(one, '/api/pacientes' + path, profileInput)).response.status,
        401,
      );
    assert.equal((await request(one, '/api/pacientes/perfil', profileInput)).response.status, 401);
    assert.equal(
      (await request(one, '/api/acceso/verificar', { codigo: codeOne })).body.estado,
      'autenticado',
    );
    const patient = {
      nombre: 'Visible solo cuenta uno',
      apellido: 'Demo',
      fechaNacimiento: '2000-01-01',
      telefono: '0000000',
    };
    const createdPatient = await request(one, '/api/pacientes', patient);
    assert.equal(createdPatient.response.status, 201);
    const patientId = createdPatient.body.id;
    const fichaOwn = { ...fichaInput, pacienteId: patientId };
    const readInput = { pacienteId: patientId };
    const emptyRead = await request(one, '/api/fichas-clinicas/consultar', readInput);
    assert.equal(emptyRead.response.status, 200);
    assert.equal(emptyRead.body.ficha, null);
    assert.equal(emptyRead.response.headers.get('cache-control'), 'no-store');
    for (const headers of [{ 'x-csrf-token': 'falso' }, { origin: 'https://ajeno.invalid' }])
      assert.equal(
        (await request(one, '/api/fichas-clinicas/consultar', readInput, headers)).response.status,
        403,
      );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/consultar', { ...readInput, profesional: 'otro' }))
        .response.status,
      400,
    );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/estado', { pacienteId: patientId })).body.existe,
      false,
    );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/crear', fichaOwn, { 'x-csrf-token': 'falso' }))
        .response.status,
      403,
    );
    assert.equal(
      (
        await request(one, '/api/fichas-clinicas/crear', fichaOwn, {
          origin: 'https://ajeno.invalid',
        })
      ).response.status,
      403,
    );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/crear', { ...fichaOwn, profesional: 'ajeno' }))
        .response.status,
      400,
    );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/crear', { ...fichaOwn, motivoConsulta: ' ' }))
        .response.status,
      400,
    );
    assert.equal((await request(one, '/api/fichas-clinicas/crear', fichaOwn)).response.status, 201);
    assert.equal((await request(one, '/api/fichas-clinicas/crear', fichaOwn)).response.status, 409);
    assert.deepEqual(
      (await request(one, '/api/fichas-clinicas/estado', { pacienteId: patientId })).body,
      { existe: true },
    );
    const edition = await request(one, '/api/pacientes/edicion', { id: patientId });
    const fichaEdition = await request(one, '/api/fichas-clinicas/edicion', readInput);
    assert.equal(fichaEdition.response.status, 200);
    const fichaChanges = {
      pacienteId: patientId,
      version: fichaEdition.body.ficha.version,
      motivoConsulta: fichaOwn.motivoConsulta,
      antecedentesPersonales: '',
      antecedentesFamiliares: '',
      medicacion: '',
      evaluacionClinica: '',
      observacionesGenerales: '',
    };
    for (const path of ['/edicion', '/actualizar']) {
      const payload = path === '/edicion' ? readInput : fichaChanges;
      for (const headers of [{ 'x-csrf-token': 'falso' }, { origin: 'https://ajeno.invalid' }])
        assert.equal(
          (await request(one, '/api/fichas-clinicas' + path, payload, headers)).response.status,
          403,
        );
    }
    assert.equal(
      (await request(one, '/api/fichas-clinicas/actualizar', { ...fichaChanges, paciente: 'otro' }))
        .response.status,
      400,
    );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/actualizar', fichaChanges)).response.status,
      200,
    );
    assert.equal(
      (await request(one, '/api/fichas-clinicas/actualizar', fichaChanges)).body.codigo,
      'EDICION_CONFLICTO',
    );
    const clinicalRead = await request(one, '/api/fichas-clinicas/consultar', readInput);
    assert.equal(clinicalRead.response.status, 200);
    assert.equal(clinicalRead.body.pacienteId, patientId);
    assert.equal(clinicalRead.body.nombre, patient.nombre);
    assert.equal(clinicalRead.body.apellido, patient.apellido);
    assert.equal(clinicalRead.body.ficha.motivoConsulta, fichaOwn.motivoConsulta);
    assert.equal(clinicalRead.body.ficha.medicacion, null);
    assert.equal(edition.response.status, 200);
    assert.equal(edition.body.stamp, undefined);
    const changes = { ...edition.body, telefono: '1414141' };
    assert.equal(
      (await request(one, '/api/pacientes/actualizar', changes, { 'x-csrf-token': 'falso' }))
        .response.status,
      403,
    );
    assert.equal(
      (
        await request(one, '/api/pacientes/actualizar', changes, {
          origin: 'https://ajeno.invalid',
        })
      ).response.status,
      403,
    );
    assert.equal(
      (await request(one, '/api/pacientes/actualizar', { ...changes, profesional_id: 'ajeno' }))
        .response.status,
      400,
    );
    assert.equal(
      (await request(one, '/api/pacientes/actualizar', changes)).body.estado,
      'actualizado',
    );
    assert.equal(
      (await request(one, '/api/pacientes/perfil', { id: patientId })).body.telefono,
      '1414141',
    );
    assert.equal(
      (await request(one, '/api/pacientes/actualizar', changes)).body.codigo,
      'EDICION_CONFLICTO',
    );
    assert.equal(
      (await request(one, '/api/pacientes/perfil', { id: patientId })).body.nombre,
      patient.nombre,
    );
    assert.equal(
      (await request(one, '/api/pacientes/perfil', { id: 'inválido' })).response.status,
      400,
    );
    assert.equal(
      (await request(one, '/api/pacientes/perfil', { id: patientId }, { 'x-csrf-token': 'falso' }))
        .response.status,
      403,
    );
    assert.equal(
      (
        await request(
          one,
          '/api/pacientes/perfil',
          { id: patientId },
          { origin: 'https://ajeno.invalid' },
        )
      ).response.status,
      403,
    );
    await request(two, '/api/acceso/estado');
    await request(two, '/api/acceso/ingresar', { email: email2, password: registration.password });
    await request(two, '/api/acceso/verificar', { codigo: fake.outbox.at(-1).code });
    const foreignProfile = await request(two, '/api/pacientes/perfil', { id: patientId });
    for (const path of ['/estado', '/crear', '/consultar', '/edicion', '/actualizar']) {
      const payload =
        path === '/actualizar'
          ? {
              version: 'a'.repeat(43),
              motivoConsulta: 'Ficticio',
              antecedentesPersonales: '',
              antecedentesFamiliares: '',
              medicacion: '',
              evaluacionClinica: '',
              observacionesGenerales: '',
            }
          : path === '/crear'
            ? { motivoConsulta: 'Ficticio' }
            : {};
      const foreign = await request(two, '/api/fichas-clinicas' + path, {
        ...payload,
        pacienteId: patientId,
      });
      const missing = await request(two, '/api/fichas-clinicas' + path, {
        ...payload,
        pacienteId: profileInput.id,
      });
      assert.equal(foreign.response.status, 404);
      assert.equal(missing.response.status, 404);
      assert.deepEqual(foreign.body, missing.body);
    }
    for (const path of ['/edicion', '/actualizar']) {
      const payload = path === '/actualizar' ? changes : {};
      const foreign = await request(two, '/api/pacientes' + path, { ...payload, id: patientId });
      const absent = await request(two, '/api/pacientes' + path, {
        ...payload,
        id: profileInput.id,
      });
      assert.equal(foreign.response.status, 404);
      assert.equal(absent.response.status, 404);
      assert.deepEqual(foreign.body, absent.body);
    }
    const missingProfile = await request(two, '/api/pacientes/perfil', profileInput);
    assert.equal(foreignProfile.response.status, 404);
    assert.equal(missingProfile.response.status, 404);
    assert.deepEqual(foreignProfile.body, missingProfile.body);
    assert.equal(
      (
        await request(two, '/api/pacientes/consulta', {
          busqueda: 'Visible solo cuenta uno',
          pagina: 1,
        })
      ).body.pacientes.length,
      0,
    );
    assert.equal(
      (
        await request(one, '/api/pacientes/consulta', {
          busqueda: 'Visible solo cuenta uno',
          pagina: 1,
        })
      ).body.pacientes.length,
      1,
    );
    assert.equal(
      (
        await request(one, '/api/pacientes/consulta', {
          busqueda: '',
          pagina: 1,
          profesional_id: 'otro',
        })
      ).response.status,
      400,
    );
    const saved = { ...one };
    await request(one, '/api/acceso/salir', {});
    assert.equal(
      (await request(saved, '/api/pacientes/perfil', { id: patientId })).response.status,
      401,
    );
    now += 1800001;
    for (const jar of [saved, two])
      for (const path of ['/estado', '/crear', '/consultar', '/edicion', '/actualizar'])
        assert.equal(
          (await request(jar, '/api/fichas-clinicas' + path, fichaInput)).response.status,
          401,
        );
    for (const jar of [saved, two])
      for (const path of ['/edicion', '/actualizar'])
        assert.equal((await request(jar, '/api/pacientes' + path, changes)).response.status, 401);
    assert.equal(
      (await request(two, '/api/pacientes/perfil', { id: patientId })).response.status,
      401,
    );
    assert.equal(
      (await request(saved, '/api/pacientes/consulta', { busqueda: '', pagina: 1 })).response
        .status,
      401,
    );
    const c = await pool.connect();
    try {
      assert.equal((await c.query('select id from psicologia.pacientes')).rowCount, 0);
      await c.query('BEGIN');
      await c.query("select set_config('app.profesional',$1,true)", [context.profesional]);
      const rows = await c.query('select profesional_id from psicologia.pacientes');
      assert.ok(rows.rows.every((r) => r.profesional_id === context.profesional));
      await assert.rejects(
        c.query(
          "insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values($1,'X','X','2000-01-01','0000000')",
          [randomUUID()],
        ),
      );
      await c.query('ROLLBACK');
    } finally {
      c.release();
    }
    now += 900001;
    const racePending = await service.login(email2, registration.password),
      raceCode = fake.outbox.at(-1).code;
    const race = await Promise.allSettled([
      service.verify(racePending, raceCode),
      service.logout(racePending),
    ]);
    if (race[0].status === 'fulfilled') assert.equal(await service.session(race[0].value), null);
    now += 61000;
    const failedMail = new AccessService(
      store,
      fake.identity,
      {
        send: async () => {
          throw new Error('fallo simulado');
        },
      },
      'clave-ficticia-de-pruebas-larga-000',
      () => now,
    );
    await assert.rejects(
      failedMail.login(email2, registration.password),
      (e) => e.code === 'CORREO_NO_DISPONIBLE',
    );
    const failed = (
      await admin.query("select hash from acceso.intentos where usuario=$1 and estado='fallido'", [
        fake.accounts.get(email2).id,
      ])
    ).rows[0];
    assert.ok(failed);
    for (let n = 0; n < 30; n++) await service.throttle('origen-de-prueba');
    await assert.rejects(service.throttle('origen-de-prueba'), (e) => e.status === 429);
    console.log(
      'AUTH: contraseña/código, concurrencia, límites, expiración, recuperación, logout, HTTP/CSRF y dos profesionales aprobados. Auth/correo simulados; PostgreSQL real.',
    );
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}
