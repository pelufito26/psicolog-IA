import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import { createFicha, type FichaHandler } from '../application/ficha.js';
import { PgFichaRepository } from '../infrastructure/pg-ficha.js';
export function createFichaRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  const execute =
    (operation: 'state' | 'create'): FichaHandler =>
    async (input, professional) => {
      if (
        env.NODE_ENV === 'production' ||
        !professional ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(professional)
      )
        return { status: 503, body: { codigo: 'FICHA_NO_CONFIGURADA' } };
      try {
        pool ??= new Pool(databaseConfig(env));
        return await createFicha(new PgFichaRepository(pool), professional)[operation](input);
      } catch {
        return {
          status: 503,
          body: {
            codigo: operation === 'create' ? 'CREACION_NO_CONFIRMADA' : 'FICHA_NO_DISPONIBLE',
          },
        };
      }
    };
  return {
    state: execute('state'),
    create: execute('create'),
    close: async () => {
      await pool?.end();
    },
  };
}
