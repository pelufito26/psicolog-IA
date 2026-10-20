import { useEffect, useRef, useState } from 'react';
import { labelsFicha, PacienteFichaNoDisponible } from './client';
import { EditarFicha } from './EditarFicha';
import type { FichaEditor } from './edit-client';
import {
  consultarFicha,
  type ConsultarFicha as Loader,
  type ConsultaFicha,
} from './consulta-client';
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-UY', {
    timeZone: 'America/Montevideo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
export function ConsultarFicha({
  pacienteId,
  load = consultarFicha,
  onBack,
  editor,
}: {
  pacienteId: string;
  load?: Loader;
  onBack: () => void;
  editor?: FichaEditor;
}) {
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false),
    [notice, setNotice] = useState('');
  const [result, setResult] = useState<{
    id: string;
    revision: number;
    data?: ConsultaFicha;
    error?: 'missing' | 'temporary';
  }>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [pacienteId, editing]);
  useEffect(() => {
    if (editing) return;
    let active = true;
    const c = new AbortController();
    load(pacienteId, c.signal).then(
      (data) => {
        if (active) setResult({ id: pacienteId, revision, data });
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
  }, [pacienteId, load, revision, editing]);
  const current = result?.id === pacienteId && result.revision === revision ? result : undefined;
  const data = current?.data,
    ficha = data?.ficha;
  if (editing)
    return (
      <EditarFicha
        pacienteId={pacienteId}
        api={editor}
        read={load}
        onClose={(saved) => {
          setEditing(false);
          setRevision((r) => r + 1);
          setNotice(saved ? 'Ficha clínica actualizada correctamente.' : '');
        }}
      />
    );
  return (
    <section className="patient-card" aria-labelledby="consulta-ficha-title">
      <h2 id="consulta-ficha-title" ref={heading} tabIndex={-1}>
        Consultar ficha clínica
      </h2>
      <button className="secondary" onClick={onBack}>
        Volver al perfil
      </button>
      {!current && <p role="status">Cargando ficha clínica…</p>}
      {notice && <p role="status">{notice}</p>}
      {ficha && (
        <button
          onClick={() => {
            setNotice('');
            setEditing(true);
          }}
        >
          Editar ficha clínica
        </button>
      )}
      {current?.error === 'missing' && <p role="status">El paciente no está disponible.</p>}
      {current?.error === 'temporary' && (
        <div role="alert">
          <p>No se pudo consultar la ficha clínica.</p>
          <button onClick={() => setRevision((r) => r + 1)}>Reintentar consulta</button>
        </div>
      )}
      {data && (
        <>
          <h3 className="clinical-text">
            {data.nombre} {data.apellido}
          </h3>
          {ficha === null && (
            <p role="status">Todavía no tiene ficha clínica. Volvé al perfil para crearla.</p>
          )}
          {ficha && (
            <dl className="clinical-content">
              {Object.entries(labelsFicha).map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd className="clinical-text">
                    {ficha[key as keyof typeof labelsFicha]?.trim()
                      ? ficha[key as keyof typeof labelsFicha]
                      : 'Sin registrar'}
                  </dd>
                </div>
              ))}
              <div>
                <dt>Fecha de creación</dt>
                <dd>
                  <time dateTime={ficha.fechaCreacion}>{formatDate(ficha.fechaCreacion)}</time>
                </dd>
              </div>
              <div>
                <dt>Última modificación</dt>
                <dd>
                  <time dateTime={ficha.fechaUltimaModificacion}>
                    {formatDate(ficha.fechaUltimaModificacion)}
                  </time>
                </dd>
              </div>
            </dl>
          )}
        </>
      )}
    </section>
  );
}
