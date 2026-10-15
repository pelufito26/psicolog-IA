import { runDatabaseCheck } from './connection.js';

const success = await runDatabaseCheck(process.env);
console.log(
  success ? 'Conexión y rollback confirmados.' : 'No se pudo confirmar la base de desarrollo.',
);
process.exitCode = success ? 0 : 1;
