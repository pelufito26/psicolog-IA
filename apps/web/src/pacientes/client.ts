import { patientFetch } from '../acceso/client';
export interface PacienteInput {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string;
}
export type SaveResult =
  | { kind: 'created'; id: string }
  | { kind: 'duplicate'; token: string }
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'error'; message: string };
export type SavePaciente = (
  data: PacienteInput,
  token?: string,
  signal?: AbortSignal,
) => Promise<SaveResult>;
export const uncertain =
  'No se pudo confirmar si el registro se guardó. Revisá antes de volver a enviarlo.';
export async function savePaciente(
  data: PacienteInput,
  token?: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = patientFetch,
): Promise<SaveResult> {
  const controller = new AbortController();
  let rejectCancel!: (error: Error) => void;
  const cancellation = new Promise<never>((_, reject) => {
    rejectCancel = reject;
  });
  const cancel = () => {
    controller.abort();
    rejectCancel(new Error('Cancelado'));
  };
  const timer = setTimeout(cancel, 12000);
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    if (signal?.aborted) throw new Error('Cancelado');
    return await Promise.race([
      (async (): Promise<SaveResult> => {
        const response = await fetcher('/api/pacientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, ...(token ? { confirmacionDuplicado: token } : {}) }),
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object') throw new Error();
        const result = body as Record<string, unknown>;
        if (
          response.status === 201 &&
          result.estado === 'registrado' &&
          typeof result.id === 'string'
        )
          return { kind: 'created', id: result.id };
        if (
          response.status === 409 &&
          result.codigo === 'POSIBLE_DUPLICADO' &&
          typeof result.confirmacionDuplicado === 'string'
        )
          return { kind: 'duplicate', token: result.confirmacionDuplicado };
        if (
          response.status === 400 &&
          result.codigo === 'DATOS_INVALIDOS' &&
          result.errores &&
          typeof result.errores === 'object' &&
          Object.values(result.errores).every((value) => typeof value === 'string')
        )
          return { kind: 'invalid', errors: result.errores as Record<string, string> };
        if (result.codigo === 'CONFIRMACION_INVALIDA')
          return {
            kind: 'error',
            message: 'La confirmación venció o cambió. Revisá los datos y volvé a enviar.',
          };
        if (result.codigo === 'DESARROLLO_NO_CONFIGURADO')
          return {
            kind: 'error',
            message: 'Falta configurar el profesional de prueba en el servidor.',
          };
        if (response.status === 413)
          return {
            kind: 'error',
            message: 'Los datos superan el tamaño admitido. Revisá el formulario.',
          };
        throw new Error();
      })(),
      cancellation,
    ]);
  } catch {
    return { kind: 'error', message: uncertain };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
