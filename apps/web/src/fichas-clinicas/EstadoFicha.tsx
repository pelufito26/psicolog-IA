import { useEffect, useState } from 'react';
import { fichaAPI, PacienteFichaNoDisponible, type FichaAPI } from './client';
export function EstadoFicha({
  pacienteId,
  api = fichaAPI,
  onCreate,
}: {
  pacienteId: string;
  api?: FichaAPI;
  onCreate: () => void;
}) {
  const [revision, setRevision] = useState(0),
    [result, setResult] = useState<{
      id: string;
      revision: number;
      existe?: boolean;
      error?: 'missing' | 'temporary';
    }>();
  useEffect(() => {
    let active = true;
    const c = new AbortController();
    api.state(pacienteId, c.signal).then(
      (existe) => {
        if (active) setResult({ id: pacienteId, revision, existe });
      },
      (error) => {
        if (active)
          setResult({
            id: pacienteId,
            revision,
            error: error instanceof PacienteFichaNoDisponible ? 'missing' : 'temporary',
          });
      },
    );
    return () => {
      active = false;
      c.abort();
    };
  }, [api, pacienteId, revision]);
  const current = result?.id === pacienteId && result.revision === revision ? result : undefined;
  return (
    <section aria-labelledby="ficha-state-title">
      <h3 id="ficha-state-title">Ficha clínica</h3>
      {!current && <p role="status">Consultando estado de la ficha…</p>}
      {current?.error === 'missing' && <p role="status">El paciente no está disponible.</p>}
      {current?.error === 'temporary' && (
        <div role="alert">
          <p>No se pudo consultar el estado de la ficha.</p>
          <button onClick={() => setRevision((r) => r + 1)}>Reintentar estado de ficha</button>
        </div>
      )}
      {current?.existe === true && <p role="status">Ficha clínica creada.</p>}
      {current?.existe === false && (
        <>
          <p>Este paciente todavía no tiene ficha clínica.</p>
          <button onClick={onCreate}>Crear ficha clínica</button>
        </>
      )}
    </section>
  );
}
