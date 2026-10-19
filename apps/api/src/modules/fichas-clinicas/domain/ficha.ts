export const camposFicha = [
  'motivoConsulta',
  'antecedentesPersonales',
  'antecedentesFamiliares',
  'medicacion',
  'evaluacionClinica',
  'observacionesGenerales',
] as const;
export type DatosFicha = { motivoConsulta: string } & Record<
  Exclude<(typeof camposFicha)[number], 'motivoConsulta'>,
  string | null
>;
export function validarFicha(input: Record<string, unknown>): {
  data?: DatosFicha;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {},
    values: Record<string, string | null> = {};
  if (Object.keys(input).some((k) => !camposFicha.includes(k as (typeof camposFicha)[number])))
    errors.formulario = 'Hay campos no permitidos.';
  for (const key of camposFicha) {
    const value = input[key];
    if (value !== undefined && typeof value !== 'string') {
      errors[key] = 'Ingresá un texto válido.';
      continue;
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (key === 'motivoConsulta' && !text) errors[key] = 'Ingresá el motivo de consulta.';
    values[key] = text || null;
  }
  return Object.keys(errors).length ? { errors } : { data: values as DatosFicha };
}
