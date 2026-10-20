import { environment, resourceSecret } from '../../../infrastructure/environment.js';
import { Pool } from 'pg';
import { createEditarFicha } from '../application/editar-ficha.js';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createFicha, type FichaHandler } from '../application/ficha.js';
import { PgFichaRepository } from '../infrastructure/pg-ficha.js';
export function createFichaRuntime(env: NodeJS.ProcessEnv, sharedPool?: Pool) {
  let pool: Pool | undefined = sharedPool;
  let secret: ReturnType<typeof resourceSecret> | undefined;
  try {
    secret = resourceSecret(env, 'fichas-clinicas');
  } catch {
    /* Fail closed. */
  }
  const execute =
    (operation: 'state' | 'create' | 'read' | 'load' | 'save'): FichaHandler =>
    async (input, professional) => {
      if (
        !secret ||
        !professional ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(professional)
      )
        return { status: 503, body: { codigo: 'FICHA_NO_CONFIGURADA' } };
      try {
        environment(env);
        pool ??= new Pool(databaseConfig(env));
        const repository = new PgFichaRepository(pool);
        return await (operation === 'load' || operation === 'save'
          ? createEditarFicha(repository, professional, secret)[operation](input)
          : createFicha(repository, professional)[operation](input));
      } catch {
        return {
          status: 503,
          body: {
            codigo:
              operation === 'save'
                ? 'GUARDADO_NO_CONFIRMADO'
                : operation === 'create'
                  ? 'CREACION_NO_CONFIRMADA'
                  : 'FICHA_NO_DISPONIBLE',
          },
        };
      }
    };
  return {
    state: execute('state'),
    read: execute('read'),
    create: execute('create'),
    editLoad: execute('load'),
    editSave: execute('save'),
    close: async () => {
      if (!sharedPool) await pool?.end();
    },
  };
}
