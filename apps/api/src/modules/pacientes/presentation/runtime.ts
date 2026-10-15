import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createRegistrar, type RegistroHandler } from '../application/registrar.js';
import { PgPacienteRepository } from '../infrastructure/pg-repository.js';
import { PgConsultaRepository } from '../infrastructure/pg-consulta.js';
import { createListar } from '../application/listar.js';
export function createRegistrationRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  let handler: RegistroHandler | undefined;
  let query: RegistroHandler | undefined;
  const execute = async (input: unknown, listing: boolean) => {
    if (
      env.NODE_ENV === 'production' ||
      env.DEV_PATIENT_REGISTRATION !== 'true' ||
      !env.DEV_PROFESIONAL_ID ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        env.DEV_PROFESIONAL_ID,
      )
    ) {
      return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
    }
    try {
      if (!handler) {
        pool = new Pool(databaseConfig(env));
        pool.on('error', () => {
          /* No registrar datos de conexión o pacientes. */
        });
        handler = createRegistrar(new PgPacienteRepository(pool), env.DEV_PROFESIONAL_ID);
        query = createListar(new PgConsultaRepository(pool), env.DEV_PROFESIONAL_ID);
      }
      return await (listing ? query! : handler)(input);
    } catch {
      return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
    }
  };
  return {
    register: (input: unknown) => execute(input, false),
    list: (input: unknown) => execute(input, true),
    close: async () => {
      if (pool) await pool.end();
    },
  };
}
