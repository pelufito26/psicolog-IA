import { readFile, writeFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { databaseConfig } from '../apps/api/dist/infrastructure/database/connection.js';
const target = 'vrqmpdedckkgxpdleepr';
if (
  process.env.NODE_ENV === 'production' ||
  process.argv[2] !== '--project' ||
  process.argv[3] !== target
)
  throw new Error('Seed solo para proyecto de desarrollo aprobado');
const url = new URL(process.env.DATABASE_URL ?? '');
if (url.hostname !== 'db.' + target + '.supabase.co')
  throw new Error('Destino distinto al aprobado');
const pool = new Pool(databaseConfig(process.env));
try {
  const email = 'profesional-demo@example.invalid';
  await pool.query(
    'insert into psicologia.profesionales(nombre,apellido,email) values($1,$2,$3) on conflict do nothing',
    ['Profesional', 'Demo PsicologIA', email],
  );
  const result = await pool.query('select id from psicologia.profesionales where email=$1', [
    email,
  ]);
  if (result.rowCount !== 1) throw new Error('No se confirmó el profesional demo');
  const path = new URL('../apps/api/.env', import.meta.url);
  let env = await readFile(path, 'utf8');
  for (const key of ['DEV_PROFESIONAL_ID', 'DEV_PATIENT_REGISTRATION'])
    env = env.replace(new RegExp('^' + key + '=.*\\r?\\n?', 'gm'), '');
  await writeFile(
    path,
    env + 'DEV_PROFESIONAL_ID=' + result.rows[0].id + '\nDEV_PATIENT_REGISTRATION=true\n',
  );
  console.log('Profesional ficticio y contexto local configurados. ID: ' + result.rows[0].id);
} finally {
  await pool.end();
}
