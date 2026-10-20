import { useEffect, useRef, useState } from 'react';
import {
  consultarPerfil,
  PacienteNoDisponible,
  type ConsultarPerfil,
  type Perfil,
} from './profile-client';
import { EditarPaciente } from './EditarPaciente';
import type { Editor } from './edit-client';
import { EstadoFicha } from '../fichas-clinicas/EstadoFicha';
import { CrearFicha } from '../fichas-clinicas/CrearFicha';
import type { FichaAPI } from '../fichas-clinicas/client';
import { ConsultarFicha } from '../fichas-clinicas/ConsultarFicha';
import type { ConsultarFicha as FichaLoader } from '../fichas-clinicas/consulta-client';
export function PerfilPaciente({
  id,
  load = consultarPerfil,
  onBack,
  editor,
  fichas,
  fichaLoad,
}: {
  id: string;
  load?: ConsultarPerfil;
  onBack: () => void;
  editor?: Editor;
  fichas?: FichaAPI;
  fichaLoad?: FichaLoader;
}) {
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [creatingFicha, setCreatingFicha] = useState(false);
  const [readingFicha, setReadingFicha] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<{
    id: string;
    revision: number;
    data?: Perfil;
    error?: 'missing' | 'temporary';
  }>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [id, editing, creatingFicha, readingFicha]);
  useEffect(() => {
    if (editing || creatingFicha || readingFicha) return;
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
  }, [id, load, revision, editing, creatingFicha, readingFicha]);
  const current = result?.id === id && result.revision === revision ? result : undefined;
  const data = current?.data;
  if (readingFicha)
    return (
      <ConsultarFicha
        key={id}
        pacienteId={id}
        load={fichaLoad}
        onBack={() => {
          setReadingFicha(false);
          setRevision((r) => r + 1);
        }}
      />
    );
  if (creatingFicha)
    return (
      <CrearFicha
        key={id}
        pacienteId={id}
        api={fichas}
        onClose={(saved) => {
          setCreatingFicha(false);
          setRevision((r) => r + 1);
          setNotice(saved ? 'Ficha clínica creada correctamente.' : '');
        }}
      />
    );
  if (editing)
    return (
      <EditarPaciente
        key={id}
        id={id}
        load={editor?.load}
        save={editor?.save}
        onClose={(saved) => {
          setEditing(false);
          setRevision((value) => value + 1);
          setNotice(saved ? 'Datos del paciente actualizados.' : '');
        }}
      />
    );
  return (
    <section className="patient-card" aria-labelledby="profile-title">
      <h2 id="profile-title" ref={heading} tabIndex={-1}>
        Perfil del paciente
      </h2>
      <button className="secondary" onClick={onBack}>
        Volver al listado
      </button>
      {notice && <p role="status">{notice}</p>}
      {data && (
        <button
          onClick={() => {
            setNotice('');
            setEditing(true);
          }}
        >
          Editar datos
        </button>
      )}
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
      {data && (
        <EstadoFicha
          pacienteId={id}
          api={fichas}
          onRead={() => {
            setNotice('');
            setReadingFicha(true);
          }}
          onCreate={() => {
            setNotice('');
            setCreatingFicha(true);
          }}
        />
      )}
    </section>
  );
}
