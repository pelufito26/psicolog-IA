import { expect, test } from 'vitest';
import { validarPaciente, claveNombre, hoyMontevideo } from './paciente.js';
const valid = {
  nombre: '  José   María ',
  apellido: " D'Ávila ",
  fechaNacimiento: '2000-02-29',
  telefono: '+598 (99) 123-456',
};
test('normaliza datos sin perder acentos y acepta bisiesto', () => {
  const result = validarPaciente(valid, '2026-10-15');
  expect(result).toEqual({
    data: {
      nombre: 'José María',
      apellido: "D'Ávila",
      fechaNacimiento: '2000-02-29',
      telefono: '+59899123456',
    },
  });
  expect(claveNombre('  JOSÉ   María ')).toBe(claveNombre('jose maria'));
});
test.each(['2001-02-29', '2026-13-01', '2026-02-30', '2026-10-16', '15/10/2000'])(
  'rechaza fecha %s',
  (fechaNacimiento) => {
    expect(
      validarPaciente({ ...valid, fechaNacimiento }, '2026-10-15').errors?.fechaNacimiento,
    ).toBeTruthy();
  },
);
test('hoy y límites de teléfono', () => {
  expect(
    validarPaciente({ ...valid, fechaNacimiento: '2026-10-15', telefono: '1234567' }, '2026-10-15')
      .data,
  ).toBeTruthy();
  expect(
    validarPaciente({ ...valid, telefono: '123456789012345' }, '2026-10-15').data,
  ).toBeTruthy();
});
test.each(['abc1234567', '12+345678', '123456', '1234567890123456', '  '])(
  'rechaza teléfono %s',
  (telefono) => {
    expect(validarPaciente({ ...valid, telefono }, '2026-10-15').errors?.telefono).toBeTruthy();
  },
);
test('vacíos, tipos incorrectos y campo de identidad inesperado', () => {
  expect(
    validarPaciente({ ...valid, nombre: '  ', apellido: null }, '2026-10-15').errors,
  ).toMatchObject({ nombre: expect.any(String), apellido: expect.any(String) });
  expect(
    validarPaciente({ ...valid, profesional_id: 'otro' }, '2026-10-15').errors?.formulario,
  ).toBeTruthy();
  expect(validarPaciente(null, '2026-10-15').errors).toBeTruthy();
});
test('día clínico no depende del UTC del servidor', () => {
  expect(hoyMontevideo(new Date('2026-10-15T02:59:59Z'))).toBe('2026-10-14');
  expect(hoyMontevideo(new Date('2026-10-15T03:00:00Z'))).toBe('2026-10-15');
});
