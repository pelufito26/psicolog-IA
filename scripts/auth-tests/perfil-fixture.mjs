import { AccessStore } from '../../apps/api/dist/modules/acceso/store.js';
import { PgPacienteRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-repository.js';
import { createRegistrar } from '../../apps/api/dist/modules/pacientes/application/registrar.js';
import { randomUUID } from 'node:crypto';
import { createSesiones } from '../../apps/api/dist/modules/sesiones-clinicas/application/sesiones.js';
import { PgSesionRepository } from '../../apps/api/dist/modules/sesiones-clinicas/infrastructure/pg-sesiones.js';

// Solo llamado por el harness explícito, contra su base local desechable.
export async function seedPerfil(fake, pool, sessions = false) {
  const email = 'perfil-demo@example.invalid';
  await fake.identity.register({
    email,
    password: 'solo-demo-123456',
    nombre: 'Profesional',
    apellido: 'Ficticio',
  });
  await fake.identity.confirm(fake.outbox.at(-1).token);
  const professional = await new AccessStore(pool).account({
    id: fake.accounts.get(email).id,
    email,
    nombre: 'Profesional',
    apellido: 'Ficticio',
  });
  const register = createRegistrar(new PgPacienteRepository(pool), professional);
  for (let n = 1; n <= 21; n++) {
    const result = await register({
      nombre: 'Demo ' + String(n).padStart(2, '0'),
      apellido: 'Perfil',
      fechaNacimiento: '2000-02-29',
      telefono: '0000000',
    });
    if (result.status !== 201) throw new Error('No se pudo preparar la fixture ficticia');
    if (sessions && n === 21) {
      const service = createSesiones(new PgSesionRepository(pool), professional);
      for (let i = 1; i <= 25; i++) {
        const session = await service.register({
          pacienteId: result.body.id,
          operacionId: randomUUID(),
          fechaSesion: '2000-01-01',
          anotacionesClinicas: 'Sesión ficticia de demostración ' + i,
        });
        if (session.status !== 201) throw new Error('No se pudo preparar la fixture de sesiones');
      }
    }
  }
}
