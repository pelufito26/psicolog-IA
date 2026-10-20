import { useEffect, useRef, useState } from 'react';
import {
  sesionAPI,
  SesionNoDisponible,
  fechaClinica,
  type SesionAPI,
  type Historial,
} from './client';
import { RegistrarSesion } from './RegistrarSesion';
import { DetalleSesion } from './DetalleSesion';
export function HistorialSesiones(props: {
  pacienteId: string;
  api?: SesionAPI;
  onBack: () => void;
}) {
  return <Historial key={props.pacienteId} {...props} />;
}
function Historial({
  pacienteId,
  api = sesionAPI,
  onBack,
}: {
  pacienteId: string;
  api?: SesionAPI;
  onBack: () => void;
}) {
  const [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<string>(),
    [notice, setNotice] = useState('');
  const [result, setResult] = useState<{
    page: number;
    revision: number;
    data?: Historial;
    error?: 'missing' | 'temporary';
  }>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [creating, selected]);
  useEffect(() => {
    if (creating || selected) return;
    let active = true;
    const c = new AbortController();
    api.history(pacienteId, page, c.signal).then(
      (data) => {
        if (active) setResult({ page, revision, data });
      },
      (error) => {
        if (active)
          setResult({
            page,
            revision,
            error: error instanceof SesionNoDisponible ? 'missing' : 'temporary',
          });
      },
    );
    return () => {
      active = false;
      c.abort();
    };
  }, [api, pacienteId, page, revision, creating, selected]);
  if (creating)
    return (
      <RegistrarSesion
        pacienteId={pacienteId}
        api={api}
        onBack={() => {
          setCreating(false);
          setRevision((r) => r + 1);
        }}
        onSaved={(id) => {
          setCreating(false);
          setPage(1);
          setSelected(id);
          setNotice('Sesión clínica registrada correctamente.');
        }}
      />
    );
  if (selected)
    return (
      <DetalleSesion
        pacienteId={pacienteId}
        sesionId={selected}
        api={api}
        notice={notice}
        onBack={() => {
          setSelected(undefined);
          setNotice('');
          setRevision((r) => r + 1);
        }}
      />
    );
  const current = result?.page === page && result.revision === revision ? result : undefined,
    data = current?.data;
  return (
    <section className="patient-card" aria-labelledby="session-history-title">
      <h2 id="session-history-title" ref={heading} tabIndex={-1}>
        Sesiones clínicas
      </h2>
      <button className="secondary" onClick={onBack}>
        Volver al perfil
      </button>
      {!current && <p role="status">Cargando historial…</p>}
      {current?.error === 'missing' && <p role="status">El paciente no está disponible.</p>}
      {current?.error === 'temporary' && (
        <div role="alert">
          <p>No se pudo consultar el historial.</p>
          <button onClick={() => setRevision((r) => r + 1)}>Reintentar historial</button>
        </div>
      )}
      {data && (
        <>
          <h3>
            {data.nombre} {data.apellido}
          </h3>
          <button
            onClick={() => {
              setNotice('');
              setCreating(true);
            }}
          >
            Registrar sesión clínica
          </button>
          {!data.sesiones.length ? (
            <p role="status">
              {page === 1 ? 'Todavía no hay sesiones.' : 'No hay sesiones en esta página.'}
            </p>
          ) : (
            <ol className="session-list">
              {data.sesiones.map((s, index) => (
                <li key={s.id}>
                  <p>
                    <strong>{fechaClinica(s.fechaSesion)}</strong> · {s.profesional.nombre}{' '}
                    {s.profesional.apellido}
                  </p>
                  <button
                    aria-label={
                      'Ver detalle de sesión ' +
                      fechaClinica(s.fechaSesion) +
                      ', registro ' +
                      ((page - 1) * 20 + index + 1)
                    }
                    onClick={() => {
                      setNotice('');
                      setSelected(s.id);
                    }}
                  >
                    Ver detalle
                  </button>
                </li>
              ))}
            </ol>
          )}
          <nav className="actions" aria-label="Páginas de sesiones">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>Página de sesiones {page}</span>
            <button disabled={!data.haySiguiente} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
