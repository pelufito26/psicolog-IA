import { Pool } from 'pg';
import { randomBytes } from 'node:crypto';
import { createEditarSesion } from '../application/editar-sesion.js';
import { databaseConfig } from '../../../infrastructure/database/connection.js';
import {
  createSesiones,
  type SesionOperations,
  type SesionHandler,
} from '../application/sesiones.js';
import { PgSesionRepository } from '../infrastructure/pg-sesiones.js';
export function createSesionRuntime(env: NodeJS.ProcessEnv) {
  let pool: Pool | undefined;
  const secret = randomBytes(32);
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
        const repository = new PgSesionRepository(pool);
        return await (key === 'load' || key === 'save'
          ? createEditarSesion(repository, professional, secret)[key](input)
          : createSesiones(repository, professional)[key](input));
      } catch {
        return {
          status: 503,
          body: {
            codigo:
              key === 'save'
                ? 'GUARDADO_NO_CONFIRMADO'
                : key === 'register'
                  ? 'REGISTRO_NO_CONFIRMADO'
                  : 'SESIONES_NO_DISPONIBLES',
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
      load: execute('load'),
      save: execute('save'),
    },
    close: async () => {
      await pool?.end();
    },
  };
}
