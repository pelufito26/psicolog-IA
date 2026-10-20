import { Pool } from 'pg';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import {
  createSesiones,
  type SesionOperations,
  type SesionHandler,
} from '../application/sesiones.js';
import { PgSesionRepository } from '../infrastructure/pg-sesiones.js';
export function createSesionRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  const execute =
    (key: keyof SesionOperations): SesionHandler =>
    async (input, professional) => {
      if (
        env.NODE_ENV === 'production' ||
        !professional ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(professional)
      )
        return { status: 503, body: { codigo: 'SESIONES_NO_CONFIGURADAS' } };
      try {
        pool ??= new Pool(databaseConfig(env));
        return await createSesiones(new PgSesionRepository(pool), professional)[key](input);
      } catch {
        return {
          status: 503,
          body: {
            codigo: key === 'register' ? 'REGISTRO_NO_CONFIRMADO' : 'SESIONES_NO_DISPONIBLES',
          },
        };
      }
    };
  return {
    operations: {
      prepare: execute('prepare'),
      register: execute('register'),
      check: execute('check'),
      history: execute('history'),
      detail: execute('detail'),
    },
    close: async () => {
      await pool?.end();
    },
  };
}
