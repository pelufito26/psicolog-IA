export interface DatosPaciente {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
}
export function edad(nacimiento: string, hoy: string): number {
  return (
    Number(hoy.slice(0, 4)) -
    Number(nacimiento.slice(0, 4)) -
    (hoy.slice(5) < nacimiento.slice(5) ? 1 : 0)
  );
}
const clean = (value: string) => value.trim().replace(/\s+/gu, ' ');
export function claveNombre(value: string): string {
  return clean(value).normalize('NFD').replace(/\p{M}/gu, '').toLocaleUpperCase('es-UY');
}
export function hoyMontevideo(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return get('year') + '-' + get('month') + '-' + get('day');
}
export function validarPaciente(
  input: unknown,
  today: string,
): { data?: DatosPaciente; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { errors: { formulario: 'Revisá los datos del formulario.' } };
  const body = input as Record<string, unknown>;
  if (
    Object.keys(body).some(
      (key) =>
        !['nombre', 'apellido', 'fechaNacimiento', 'telefono', 'confirmacionDuplicado'].includes(
          key,
        ),
    )
  )
    errors.formulario = 'Hay campos no permitidos.';
  const nombre = typeof body.nombre === 'string' ? clean(body.nombre) : '';
  const apellido = typeof body.apellido === 'string' ? clean(body.apellido) : '';
  if (!nombre) errors.nombre = 'Ingresá el nombre.';
  if (!apellido) errors.apellido = 'Ingresá el apellido.';
  const fechaNacimiento = typeof body.fechaNacimiento === 'string' ? body.fechaNacimiento : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
    ? new Date(fechaNacimiento + 'T00:00:00Z')
    : null;
  if (
    !date ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== fechaNacimiento ||
    fechaNacimiento < '0001-01-01'
  )
    errors.fechaNacimiento = 'Ingresá una fecha válida.';
  else if (fechaNacimiento > today) errors.fechaNacimiento = 'El nacimiento no puede ser futuro.';
  const raw = typeof body.telefono === 'string' ? body.telefono.trim() : '';
  const telefono = raw.replace(/[\s()-]/gu, '');
  if (!/^\+?[0-9\s()-]+$/u.test(raw) || !/^\+?\d{7,15}$/.test(telefono))
    errors.telefono = 'Usá entre 7 y 15 dígitos; podés incluir + inicial y separadores.';
  if (body.confirmacionDuplicado !== undefined && typeof body.confirmacionDuplicado !== 'string')
    errors.formulario = 'La confirmación no es válida.';
  return Object.keys(errors).length
    ? { errors }
    : { data: { nombre, apellido, fechaNacimiento, telefono } };
}
