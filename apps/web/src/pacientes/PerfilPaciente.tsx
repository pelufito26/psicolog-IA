import { useEffect, useRef, useState } from 'react';
import {
  consultarPerfil,
  PacienteNoDisponible,
  type ConsultarPerfil,
  type Perfil,
} from './profile-client';
export function PerfilPaciente({
  id,
  load = consultarPerfil,
  onBack,
}: {
  id: string;
  load?: ConsultarPerfil;
  onBack: () => void;
}) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    id: string;
    revision: number;
    data?: Perfil;
    error?: 'missing' | 'temporary';
  }>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    load(id, controller.signal).then(
      (data) => {
        if (active) setResult({ id, revision, data });
      },
      (error: unknown) => {
        if (active)
          setResult({
            id,
            revision,
            error: error instanceof PacienteNoDisponible ? 'missing' : 'temporary',
          });
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, load, revision]);
  const current = result?.id === id && result.revision === revision ? result : undefined;
  const data = current?.data;
  return (
    <section className="patient-card" aria-labelledby="profile-title">
      <h2 id="profile-title" ref={heading} tabIndex={-1}>
        Perfil del paciente
      </h2>
      <button className="secondary" onClick={onBack}>
        Volver al listado
      </button>
      {!current && <p role="status">Cargando perfil…</p>}
      {current?.error === 'missing' && <p role="status">El paciente no está disponible.</p>}
      {current?.error === 'temporary' && (
        <div role="alert">
          <p>No se pudo consultar el perfil. Volvé a intentarlo.</p>
          <button onClick={() => setRevision((value) => value + 1)}>Reintentar</button>
        </div>
      )}
      {data && (
        <dl className="patient-profile">
          <div>
            <dt>Nombre</dt>
            <dd>{data.nombre}</dd>
          </div>
          <div>
            <dt>Apellido</dt>
            <dd>{data.apellido}</dd>
          </div>
          <div>
            <dt>Fecha de nacimiento</dt>
            <dd>{data.fechaNacimiento.split('-').reverse().join('/')}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{data.edad} años</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{data.telefono}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
