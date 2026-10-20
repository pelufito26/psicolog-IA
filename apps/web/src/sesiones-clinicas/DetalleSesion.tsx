import { useEffect, useRef, useState } from 'react';
import {
  sesionAPI,
  SesionNoDisponible,
  fechaClinica,
  fechaTecnica,
  type SesionAPI,
  type Detalle,
} from './client';
export function DetalleSesion({
  pacienteId,
  sesionId,
  api = sesionAPI,
  onBack,
  notice = '',
}: {
  pacienteId: string;
  sesionId: string;
  api?: SesionAPI;
  onBack: () => void;
  notice?: string;
}) {
  const [revision, setRevision] = useState(0),
    [result, setResult] = useState<{
      patient: string;
      id: string;
      revision: number;
      data?: Detalle;
      error?: 'missing' | 'temporary';
    }>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [pacienteId, sesionId]);
  useEffect(() => {
    let active = true;
    const c = new AbortController();
    api.detail(pacienteId, sesionId, c.signal).then(
      (data) => {
        if (active) setResult({ patient: pacienteId, id: sesionId, revision, data });
      },
      (error) => {
        if (active)
          setResult({
            patient: pacienteId,
            id: sesionId,
            revision,
            error: error instanceof SesionNoDisponible ? 'missing' : 'temporary',
          });
      },
    );
    return () => {
      active = false;
      c.abort();
    };
  }, [api, pacienteId, sesionId, revision]);
  const current =
      result?.patient === pacienteId && result.id === sesionId && result.revision === revision
        ? result
        : undefined,
    d = current?.data,
    s = d?.sesion;
  return (
    <section className="patient-card" aria-labelledby="session-detail-title">
      <h2 id="session-detail-title" ref={heading} tabIndex={-1}>
        Detalle de sesión clínica
      </h2>
      <button className="secondary" onClick={onBack}>
        Volver al historial
      </button>
      {notice && <p role="status">{notice}</p>}
      {!current && <p role="status">Cargando sesión…</p>}
      {current?.error === 'missing' && <p role="status">El registro no está disponible.</p>}
      {current?.error === 'temporary' && (
        <div role="alert">
          <p>No se pudo consultar el detalle. Esto no revierte un registro ya confirmado.</p>
          <button onClick={() => setRevision((r) => r + 1)}>Reintentar detalle</button>
        </div>
      )}
      {d && s && (
        <>
          <h3>
            {d.nombre} {d.apellido}
          </h3>
          <dl className="clinical-content">
            <div>
              <dt>Fecha de sesión</dt>
              <dd>{fechaClinica(s.fechaSesion)}</dd>
            </div>
            <div>
              <dt>Profesional responsable</dt>
              <dd>
                {s.profesional.nombre} {s.profesional.apellido}
              </dd>
            </div>
            <div>
              <dt>Anotaciones clínicas</dt>
              <dd className="clinical-text">{s.anotacionesClinicas}</dd>
            </div>
            <div>
              <dt>Fecha de creación</dt>
              <dd>
                <time dateTime={s.fechaCreacion}>{fechaTecnica(s.fechaCreacion)}</time>
              </dd>
            </div>
            <div>
              <dt>Última modificación</dt>
              <dd>
                <time dateTime={s.fechaUltimaModificacion}>
                  {fechaTecnica(s.fechaUltimaModificacion)}
                </time>
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
