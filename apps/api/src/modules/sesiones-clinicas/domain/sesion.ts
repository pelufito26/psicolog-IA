export interface DatosSesion {
  fechaSesion: string;
  anotacionesClinicas: string;
}
export function hoyClinico(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (key: string) => parts.find((p) => p.type === key)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function validarSesion(
  body: Record<string, unknown>,
  today: string,
): { data?: DatosSesion; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const fechaSesion = body.fechaSesion,
    text = body.anotacionesClinicas;
  if (Object.keys(body).some((k) => !['fechaSesion', 'anotacionesClinicas'].includes(k)))
    errors.formulario = 'Hay campos no permitidos.';
  const date =
    typeof fechaSesion === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(fechaSesion) &&
    fechaSesion >= '0001-01-01'
      ? new Date(fechaSesion + 'T00:00:00Z')
      : null;
  if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== fechaSesion)
    errors.fechaSesion = 'Ingresá una fecha válida.';
  else if ((fechaSesion as string) > today)
    errors.fechaSesion = 'La fecha de sesión no puede ser futura.';
  if (typeof text !== 'string' || !text.trim())
    errors.anotacionesClinicas = 'Ingresá las anotaciones clínicas.';
  return Object.keys(errors).length
    ? { errors }
    : {
        data: { fechaSesion: fechaSesion as string, anotacionesClinicas: (text as string).trim() },
      };
}
