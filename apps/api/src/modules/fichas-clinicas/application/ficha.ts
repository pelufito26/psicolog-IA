import { validarFicha, type DatosFicha } from '../domain/ficha.js';
export interface ConsultaFicha {
  pacienteId: string;
  nombre: string;
  apellido: string;
  ficha:
    (DatosFicha & { id: string; fechaCreacion: string; fechaUltimaModificacion: string }) | null;
}
export interface FichaRepository {
  read(professional: string, patient: string): Promise<ConsultaFicha | null>;
  state(professional: string, patient: string): Promise<boolean | null>;
  create(
    professional: string,
    patient: string,
    data: DatosFicha,
  ): Promise<{ kind: 'missing' } | { kind: 'exists' } | { kind: 'created'; id: string }>;
}
export interface FichaResult {
  status: number;
  body: Record<string, unknown>;
}
export type FichaHandler = (input: unknown, professional?: string) => Promise<FichaResult>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createFicha(repository: FichaRepository, professional: string) {
  const parse = (input: unknown) =>
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : null;
  const missing = { status: 404, body: { codigo: 'PACIENTE_NO_DISPONIBLE' } };
  const state: FichaHandler = async (input) => {
    const body = parse(input);
    if (
      !body ||
      Object.keys(body).some((k) => k !== 'pacienteId') ||
      typeof body.pacienteId !== 'string' ||
      !uuid.test(body.pacienteId)
    )
      return { status: 400, body: { codigo: 'CONSULTA_INVALIDA' } };
    try {
      const existe = await repository.state(professional, body.pacienteId);
      return existe === null ? missing : { status: 200, body: { existe } };
    } catch {
      return { status: 503, body: { codigo: 'FICHA_NO_DISPONIBLE' } };
    }
  };
  const create: FichaHandler = async (input) => {
    const body = parse(input);
    if (!body || typeof body.pacienteId !== 'string' || !uuid.test(body.pacienteId))
      return {
        status: 400,
        body: { codigo: 'DATOS_INVALIDOS', errores: { formulario: 'Paciente inválido.' } },
      };
    const { pacienteId, ...fields } = body,
      parsed = validarFicha(fields);
    if (!parsed.data)
      return { status: 400, body: { codigo: 'DATOS_INVALIDOS', errores: parsed.errors } };
    try {
      const result = await repository.create(professional, pacienteId, parsed.data);
      if (result.kind === 'missing') return missing;
      if (result.kind === 'exists') return { status: 409, body: { codigo: 'FICHA_YA_EXISTE' } };
      return { status: 201, body: { id: result.id, estado: 'creada' } };
    } catch {
      return { status: 503, body: { codigo: 'CREACION_NO_CONFIRMADA' } };
    }
  };
  const read: FichaHandler = async (input) => {
    const body = parse(input);
    if (
      !body ||
      Object.keys(body).some((k) => k !== 'pacienteId') ||
      typeof body.pacienteId !== 'string' ||
      !uuid.test(body.pacienteId)
    )
      return { status: 400, body: { codigo: 'CONSULTA_INVALIDA' } };
    try {
      const result = await repository.read(professional, body.pacienteId);
      return result === null ? missing : { status: 200, body: { ...result } };
    } catch {
      return { status: 503, body: { codigo: 'FICHA_NO_DISPONIBLE' } };
    }
  };
  return { state, create, read };
}
