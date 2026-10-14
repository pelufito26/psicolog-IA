export async function checkHealth({ fetcher = fetch, signal }: {
  fetcher?: typeof fetch; signal?: AbortSignal;
} = {}): Promise<void> {
  if (signal?.aborted) throw new Error('Consulta cancelada');
  const controller = new AbortController();
  let rejectCancellation!: (reason: Error) => void;
  const cancellation = new Promise<never>((_resolve, reject) => { rejectCancellation = reject; });
  const cancel = () => {
    controller.abort();
    rejectCancellation(new Error('Consulta cancelada o vencida'));
  };
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, 5000);
  try {
    await Promise.race([
      (async () => {
        const response = await fetcher('/api/health', { signal: controller.signal });
        if (!response.ok) throw new Error('API no disponible');
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object' || !('status' in body) || body.status !== 'ok') {
          throw new Error('Respuesta inesperada');
        }
      })(),
      cancellation,
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
