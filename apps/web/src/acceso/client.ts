let csrf = '';
export interface AccessState {
  simulado?: boolean;
  usuario?: string;
  estado: string;
  csrf?: string;
  codigo?: string;
}
export async function access(action: string, data?: Record<string, string>): Promise<AccessState> {
  const response = await fetch('/api/acceso/' + action, {
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json', 'x-csrf-token': csrf } : {},
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  const result = (await response.json()) as AccessState;
  if (!response.ok) throw new Error(result.codigo ?? 'ACCESO_NO_DISPONIBLE');
  if (result.csrf) csrf = result.csrf;
  return result;
}
export const patientFetch: typeof fetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, 'x-csrf-token': csrf },
  });
  if (response.status === 401) window.dispatchEvent(new Event('psico-session-expired'));
  return response;
};
