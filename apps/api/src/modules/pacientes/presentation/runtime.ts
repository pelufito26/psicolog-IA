import { environment, resourceSecret } from '../../../infrastructure/environment.js';
import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createRegistrar } from '../application/registrar.js';
import { PgPacienteRepository } from '../infrastructure/pg-repository.js';
import { PgConsultaRepository } from '../infrastructure/pg-consulta.js';
import { createListar } from '../application/listar.js';
import { createPerfil } from '../application/perfil.js';
import { PgPerfilRepository } from '../infrastructure/pg-perfil.js';
import { createEditar } from '../application/editar.js';
import { PgEdicionRepository } from '../infrastructure/pg-edicion.js';
export function createRegistrationRuntime(env: NodeJS.ProcessEnv, sharedPool?: Pool) {
  let pool: Pool | undefined = sharedPool;
  let secret: ReturnType<typeof resourceSecret> | undefined;
  try {
    secret = resourceSecret(env, 'pacientes');
  } catch {
    /* Fail closed. */
  }
  const execute = async (
    input: unknown,
    professional: string | undefined,
    operation: 'register' | 'list' | 'profile' | 'editLoad' | 'editSave',
  ) => {
    if (!secret || !professional || !/^[0-9a-f-]{36}$/i.test(professional))
      return { status: 503, body: { codigo: 'DESARROLLO_NO_CONFIGURADO' } };
    try {
      environment(env);
      pool ??= new Pool(databaseConfig(env));
      if (operation === 'editLoad' || operation === 'editSave') {
        const edit = createEditar(new PgEdicionRepository(pool), professional, { secret });
        return await (operation === 'editLoad' ? edit.load : edit.save)(input);
      }
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
          codigo:
            operation === 'profile'
              ? 'PERFIL_NO_DISPONIBLE'
              : operation === 'editLoad'
                ? 'EDICION_NO_DISPONIBLE'
                : operation === 'editSave'
                  ? 'GUARDADO_NO_CONFIRMADO'
                  : 'REGISTRO_NO_CONFIRMADO',
        },
      };
    }
  };
  return {
    register: (input: unknown, professional?: string) => execute(input, professional, 'register'),
    list: (input: unknown, professional?: string) => execute(input, professional, 'list'),
    profile: (input: unknown, professional?: string) => execute(input, professional, 'profile'),
    editLoad: (input: unknown, professional?: string) => execute(input, professional, 'editLoad'),
    editSave: (input: unknown, professional?: string) => execute(input, professional, 'editSave'),
    close: async () => {
      if (!sharedPool) await pool?.end();
    },
  };
}
