import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createRegistrar } from '../application/registrar.js';
import { PgPacienteRepository } from '../infrastructure/pg-repository.js';
import { PgConsultaRepository } from '../infrastructure/pg-consulta.js';
import { createListar } from '../application/listar.js';
import { createPerfil } from '../application/perfil.js';
import { PgPerfilRepository } from '../infrastructure/pg-perfil.js';
export function createRegistrationRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  const secret = randomBytes(32);
  const execute = async (
    input: unknown,
    professional: string | undefined,
    operation: 'register' | 'list' | 'profile',
  ) => {
    if (env.NODE_ENV === 'production' || !professional || !/^[0-9a-f-]{36}$/i.test(professional))
      return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
    try {
      pool ??= new Pool(databaseConfig(env));
      return await (
        operation === 'profile'
          ? createPerfil(new PgPerfilRepository(pool), professional)
          : operation === 'list'
            ? createListar(new PgConsultaRepository(pool), professional)
            : createRegistrar(new PgPacienteRepository(pool), professional, { secret })
      )(input);
    } catch {
      return {
        status: 503,
        body: {
          codigo: operation === 'profile' ? 'PERFIL_NO_DISPONIBLE' : 'REGISTRO_NO_CONFIRMADO',
        },
      };
    }
  };
  return {
    register: (input: unknown, professional?: string) => execute(input, professional, 'register'),
    list: (input: unknown, professional?: string) => execute(input, professional, 'list'),
    profile: (input: unknown, professional?: string) => execute(input, professional, 'profile'),
    close: async () => {
      await pool?.end();
    },
  };
}
