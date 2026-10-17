import { AccessStore } from '../../apps/api/dist/modules/acceso/store.js';
import { PgPacienteRepository } from '../../apps/api/dist/modules/pacientes/infrastructure/pg-repository.js';
import { createRegistrar } from '../../apps/api/dist/modules/pacientes/application/registrar.js';

// Solo llamado por el harness explícito, contra su base local desechable.
export async function seedPerfil(fake, pool) {
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
  }
}
