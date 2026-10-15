// Explicit harness: fictitious identities and email only, isolated disposable DB.
import { Client, Pool } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { fakeIdentity } from './fakes.mjs';
import { createApp } from '../../apps/api/dist/app.js';
import { AccessStore } from '../../apps/api/dist/modules/acceso/store.js';
import { AccessService } from '../../apps/api/dist/modules/acceso/service.js';
import { accessHttp } from '../../apps/api/dist/modules/acceso/routes.js';
import { createRegistrar } from '../../apps/api/dist/modules/pacientes/application/registrar.js';
import { createListar } from '../../apps/api/dist/modules/pacientes/application/listar.js';
import { createPerfil } from '../../apps/api/dist/modules/pacientes/application/perfil.js';
import { PgPerfilRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-perfil.js';
import { PgPacienteRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-repository.js';
import { PgConsultaRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-consulta.js';
if (process.env.AUTH_TEST_HARNESS !== '1') throw new Error('Harness explícito requerido');
const url = new URL(process.env.TEST_DATABASE_URL ?? '');
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Base local requerida');
const admin = new Client({ connectionString: url.toString(), ssl: false });
await admin.connect();
if ((await admin.query("select 1 from pg_roles where rolname='psicologia_backend'")).rowCount) {
  await admin.end();
  throw new Error('Instancia no aislada: rol backend preexistente');
}
const name = 'psicologia_auth_demo_' + randomUUID().replaceAll('-', '');
let api, inbox, pool;
try {
  await admin.query('CREATE DATABASE "' + name + '"');
  url.pathname = '/' + name;
  const setup = new Client({ connectionString: url.toString(), ssl: false });
  await setup.connect();
  try {
    for (const role of ['anon', 'authenticated'])
      if (!(await admin.query('select 1 from pg_roles where rolname=$1', [role])).rowCount)
        await admin.query('CREATE ROLE ' + role + ' NOLOGIN');
    const dir = new URL('../../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(dir)).filter((x) => x.endsWith('.sql')).sort())
      await setup.query(await readFile(new URL(file, dir), 'utf8'));
  } finally {
    await setup.end();
  }
  pool = new Pool({
    connectionString: url.toString(),
    ssl: false,
    max: 4,
    onConnect: async (c) => {
      await c.query('SET ROLE psicologia_backend');
    },
  });
  const fake = fakeIdentity(),
    service = new AccessService(
      new AccessStore(pool),
      fake.identity,
      fake.mail,
      randomUUID() + randomUUID(),
    );
  if (process.env.AUTH_TEST_FIXTURE === 'perfil') {
    const { seedPerfil } = await import('./perfil-fixture.mjs');
    await seedPerfil(fake, pool);
  }
  const app = createApp({
    access: accessHttp(service, false, true),
    register: (data, professional) =>
      createRegistrar(new PgPacienteRepository(pool), professional)(data),
    list: (data, professional) => createListar(new PgConsultaRepository(pool), professional)(data),
    profile: (data, professional) => createPerfil(new PgPerfilRepository(pool), professional)(data),
  });
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  inbox = createServer((_req, res) => {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(
      '<!doctype html><meta charset="utf-8"><title>Buzón ficticio</title><h1>Buzón de prueba local</h1><p>Solo simulación. No se envían emails reales. Actualizá esta página para ver mensajes nuevos.</p>' +
        fake.outbox
          .slice()
          .reverse()
          .map(
            (m) =>
              '<article><h2>' +
              escape(m.email) +
              '</h2><p>' +
              escape(m.type) +
              '</p>' +
              (m.code
                ? '<p>Código ficticio: ' + escape(m.code) + '</p>'
                : '<a href="http://127.0.0.1:5173/?token_hash=' +
                  encodeURIComponent(m.token) +
                  '&type=' +
                  escape(m.type) +
                  '">Abrir enlace ficticio</a>') +
              '</article>',
          )
          .join(''),
    );
  });
  api = app.listen(3001, '127.0.0.1');
  await new Promise((resolve, reject) => {
    api.once('listening', resolve);
    api.once('error', reject);
  });
  inbox.listen(3002, '127.0.0.1');
  await new Promise((resolve, reject) => {
    inbox.once('listening', resolve);
    inbox.once('error', reject);
  });
  console.log('Harness ficticio activo en API 3001 y buzón 3002. Sin Supabase remoto.');
  await new Promise((resolve) => {
    process.once('SIGINT', resolve);
    process.once('SIGTERM', resolve);
  });
} finally {
  if (api) await new Promise((resolve) => api.close(resolve));
  if (inbox) await new Promise((resolve) => inbox.close(resolve));
  await pool?.end();
  await admin.query('DROP DATABASE IF EXISTS "' + name + '"');
  await admin.query('DROP ROLE IF EXISTS psicologia_backend');
  await admin.end();
}
