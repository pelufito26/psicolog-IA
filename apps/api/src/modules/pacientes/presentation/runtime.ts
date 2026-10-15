import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createRegistrar } from '../application/registrar.js';
import { PgPacienteRepository } from '../infrastructure/pg-repository.js';
import { PgConsultaRepository } from '../infrastructure/pg-consulta.js';
import { createListar } from '../application/listar.js';
export function createRegistrationRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  const secret = randomBytes(32);
  const execute = async (input: unknown, professional: string | undefined, listing: boolean) => {
    if (env.NODE_ENV === 'production' || !professional || !/^[0-9a-f-]{36}$/i.test(professional))
      return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
    try {
      pool ??= new Pool(databaseConfig(env));
      return await (
        listing
          ? createListar(new PgConsultaRepository(pool), professional)
          : createRegistrar(new PgPacienteRepository(pool), professional, { secret })
      )(input);
    } catch {
      return { status: 503, body: { codigo: 'REGISTRO_NO_CONFIRMADO' } };
    }
  };
  return {
    register: (input: unknown, professional?: string) => execute(input, professional, false),
    list: (input: unknown, professional?: string) => execute(input, professional, true),
    close: async () => {
      await pool?.end();
    },
  };
}
