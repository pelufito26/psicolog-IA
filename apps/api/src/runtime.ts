import { Pool } from 'pg';
import { createApp } from './app.js';
import { environment } from './infrastructure/environment.js';
import { databaseConfig } from './infrastructure/database/connection.js';
import { createRegistrationRuntime } from './modules/pacientes/presentation/runtime.js';
import { createAccessRuntime } from './modules/acceso/runtime.js';
import { createFichaRuntime } from './modules/fichas-clinicas/presentation/runtime.js';
import { createSesionRuntime } from './modules/sesiones-clinicas/presentation/runtime.js';

export function createRuntime(env: NodeJS.ProcessEnv) {
  const config = environment(env);
  const pool = new Pool(databaseConfig(env));
  pool.on('error', () => {
    /* Logs must not disclose database credentials. */
  });
  const patients = createRegistrationRuntime(env, pool);
  const access = createAccessRuntime(env, pool);
  const fichas = createFichaRuntime(env, pool);
  const sesiones = createSesionRuntime(env, pool);
  if (!access.http) {
    void pool.end();
    throw new Error('Acceso no configurado');
  }
  const app = createApp({
    ...patients,
    access: access.http,
    origins: config.origins,
    fichaState: fichas.state,
    fichaRead: fichas.read,
    fichaEditLoad: fichas.editLoad,
    fichaEditSave: fichas.editSave,
    fichaCreate: fichas.create,
    sesiones: sesiones.operations,
  });
  return { app, close: () => pool.end() };
}
