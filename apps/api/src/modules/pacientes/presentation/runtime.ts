import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createRegistrar, type RegistroHandler } from '../application/registrar.js';
import { PgPacienteRepository } from '../infrastructure/pg-repository.js';
export function createRegistrationRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  let handler: RegistroHandler | undefined;
  const register: RegistroHandler = async (input) => {
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
      }
      return await handler(input);
    } catch {
      return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
    }
  };
  return {
    register,
    close: async () => {
      if (pool) await pool.end();
    },
  };
}
