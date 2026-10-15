import { readFileSync } from 'node:fs';
import { Pool, type PoolClient, type PoolConfig } from 'pg';

export function databaseConfig(env: NodeJS.ProcessEnv): PoolConfig {
  if (!env.DATABASE_URL) throw new Error('Configuración de base ausente');
  const url = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Protocolo inválido');
  // Evitar que los parámetros de URL sustituyan la verificación TLS explícita.
  for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
    if (url.searchParams.has(key)) throw new Error('Configurar TLS mediante DATABASE_CA_FILE');
  }
  return {
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: true,
      ...(env.DATABASE_CA_FILE ? { ca: readFileSync(env.DATABASE_CA_FILE, 'utf8') } : {}),
    },
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statement_timeout: 5000,
    query_timeout: 5000,
  };
}

export async function checkDatabase(pool: Pick<Pool, 'connect' | 'end'>): Promise<void> {
  let client: PoolClient | undefined;
  let failed = false;
  try {
    client = await pool.connect();
    const role = await client.query<{
      superuser: boolean;
      bypass: boolean;
      creator: boolean;
      createdb: boolean;
      replication: boolean;
      member: boolean;
      owner: boolean;
      name: string;
    }>(
      "select rolsuper as superuser, rolbypassrls as bypass, rolcreaterole as creator, rolcreatedb as createdb, rolreplication as replication, pg_has_role(current_user,'psicologia_backend','member') as member, exists(select 1 from pg_tables where schemaname='psicologia' and tableowner=current_user) as owner, current_user as name from pg_roles where rolname=current_user",
    );
    const info = role.rows[0];
    if (
      !info ||
      info.superuser ||
      info.bypass ||
      info.creator ||
      info.createdb ||
      info.replication ||
      !info.member ||
      info.owner ||
      info.name === 'postgres'
    ) {
      throw new Error('Se requiere cuenta restringida');
    }
    await client.query('BEGIN');
    await client.query('SELECT 1');
    const professional = await client.query<{ id: string }>(
      'insert into psicologia.profesionales(nombre,apellido,email) values ($1,$2,$3) returning id',
      ['Prueba', 'Ficticia', `check-${crypto.randomUUID()}@example.invalid`],
    );
    const patient = await client.query<{ id: string }>(
      'insert into psicologia.pacientes(profesional_id,nombre,apellido,fecha_nacimiento,telefono) values ($1,$2,$3,$4,$5) returning id',
      [professional.rows[0].id, 'Paciente', 'Ficticio', '2000-01-01', 'dato-ficticio'],
    );
    const result = await client.query('select id from psicologia.pacientes where id=$1', [
      patient.rows[0].id,
    ]);
    if (result.rowCount !== 1) throw new Error('Lectura no confirmada');
  } finally {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        failed = true;
      }
      client.release(failed);
    }
    await pool.end();
  }
  if (failed) throw new Error('No se pudo confirmar rollback');
}

export async function runDatabaseCheck(
  env: NodeJS.ProcessEnv,
  createPool: (config: PoolConfig) => Pick<Pool, 'connect' | 'end'> = (config) => new Pool(config),
): Promise<boolean> {
  try {
    await checkDatabase(createPool(databaseConfig(env)));
    return true;
  } catch {
    return false;
  }
}
