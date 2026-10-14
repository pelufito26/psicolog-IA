import { useEffect, useState } from 'react';
import { checkHealth } from './health';

const defaultChecker = (signal?: AbortSignal) => checkHealth({ signal });
const messages = {
  pending: 'Comprobando API…',
  available: 'API disponible',
  unavailable: 'No se pudo confirmar la disponibilidad de la API',
};
export function App({
  checker = defaultChecker,
}: {
  checker?: (signal?: AbortSignal) => Promise<void>;
}) {
  const [state, setState] = useState<keyof typeof messages>('pending');
  useEffect(() => {
    const controller = new AbortController();
    setState('pending');
    checker(controller.signal).then(
      () => {
        if (!controller.signal.aborted) setState('available');
      },
      () => {
        if (!controller.signal.aborted) setState('unavailable');
      },
    );
    return () => controller.abort();
  }, [checker]);
  return (
    <main className="shell">
      <p className="eyebrow">ESPACIO DE DESARROLLO</p>
      <h1>PsicologIA</h1>
      <p className="intro">Base técnica en preparación</p>
      <section className="status-card" aria-labelledby="connection-title">
        <h2 id="connection-title">Conexión local</h2>
        <p role="status" aria-live="polite" className={state}>
          {messages[state]}
        </p>
        <p className="note">Esta comprobación indica si el backend responde.</p>
      </section>
      <p className="footnote">Entorno de prueba · Sin información de pacientes</p>
    </main>
  );
}
