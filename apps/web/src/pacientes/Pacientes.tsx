import { useEffect, useState } from 'react';
import { PacienteForm } from './PacienteForm';
import { consultar, type Consultar, type Listado } from './list-client';
import type { SavePaciente } from './client';
import { PerfilPaciente } from './PerfilPaciente';
import type { ConsultarPerfil } from './profile-client';
import type { Editor } from './edit-client';
import type { FichaAPI } from '../fichas-clinicas/client';
import type { ConsultarFicha } from '../fichas-clinicas/consulta-client';
import type { FichaEditor } from '../fichas-clinicas/edit-client';
export function Pacientes({
  load = consultar,
  save,
  profile,
  editor,
  fichas,
  fichaLoad,
  fichaEditor,
}: {
  load?: Consultar;
  save?: SavePaciente;
  profile?: ConsultarPerfil;
  editor?: Editor;
  fichas?: FichaAPI;
  fichaLoad?: ConsultarFicha;
  fichaEditor?: FichaEditor;
}) {
  const [form, setForm] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [request, setRequest] = useState({ busqueda: '', pagina: 1, revision: 0 });
  const [result, setResult] = useState<{
    request: typeof request;
    data?: Listado;
    error?: boolean;
  }>();
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (form || selected) return;
    const controller = new AbortController();
    let active = true;
    load(request.busqueda, request.pagina, controller.signal).then(
      (data) => {
        if (active) setResult({ request, data });
      },
      () => {
        if (active) setResult({ request, error: true });
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [load, request, form, selected]);
  function refresh(message = '') {
    setNotice(message);
    setForm(false);
    setRequest((r) => ({ ...r, pagina: 1, revision: r.revision + 1 }));
  }
  if (selected)
    return (
      <PerfilPaciente
        key={selected}
        id={selected}
        load={profile}
        editor={editor}
        fichas={fichas}
        fichaLoad={fichaLoad}
        fichaEditor={fichaEditor}
        onBack={() => {
          setSelected(null);
          setRequest((r) => ({ ...r, revision: r.revision + 1 }));
        }}
      />
    );
  if (form)
    return (
      <PacienteForm
        save={save}
        onCancel={() => refresh()}
        onSuccess={() => refresh('Paciente registrado correctamente.')}
      />
    );
  const current = result?.request === request ? result : undefined;
  const data = current?.data;
  return (
    <section className="patient-card" aria-labelledby="patients-title">
      <h2 id="patients-title">Pacientes</h2>
      <p role="status" aria-label="Resultado del alta">
        {notice}
      </p>
      <button
        onClick={() => {
          setNotice('');
          setForm(true);
        }}
      >
        Registrar paciente
      </button>
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          setRequest((r) => ({ busqueda: draft.trim(), pagina: 1, revision: r.revision + 1 }));
        }}
      >
        <label htmlFor="buscar">Buscar por nombre o apellido</label>
        <input
          id="buscar"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
        />
        <div className="actions">
          <button type="submit">Buscar</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setDraft('');
              setRequest((r) => ({ busqueda: '', pagina: 1, revision: r.revision + 1 }));
            }}
          >
            Limpiar búsqueda
          </button>
        </div>
      </form>
      <p>Filtro aplicado: {request.busqueda || 'Todos los pacientes'}</p>
      {!current && (
        <p role="status" aria-label="Estado del listado">
          Cargando pacientes…
        </p>
      )}
      {current?.error && (
        <div role="alert">
          <p>No se pudo consultar el listado. Volvé a intentarlo.</p>
          <button onClick={() => setRequest((r) => ({ ...r, revision: r.revision + 1 }))}>
            Reintentar
          </button>
        </div>
      )}
      {data && (
        <>
          {!data.pacientes.length ? (
            <p role="status" aria-label="Estado del listado">
              {request.busqueda
                ? 'No hay resultados para esta búsqueda.'
                : request.pagina > 1
                  ? 'No hay pacientes en esta página.'
                  : 'Todavía no hay pacientes registrados.'}
            </p>
          ) : (
            <div className="patients-table">
              <table>
                <caption>Pacientes del profesional de prueba</caption>
                <thead>
                  <tr>
                    <th scope="col">Apellido</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Edad</th>
                    <th scope="col">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pacientes.map((p) => (
                    <tr key={p.id}>
                      <td>{p.apellido}</td>
                      <td>
                        <button
                          className="profile-link"
                          aria-label={`Ver perfil de ${p.nombre} ${p.apellido}`}
                          onClick={() => {
                            setNotice('');
                            setSelected(p.id);
                          }}
                        >
                          {p.nombre}
                        </button>
                      </td>
                      <td>{p.edad} años</td>
                      <td>{p.telefono}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav aria-label="Páginas de pacientes" className="actions">
            <button
              className="secondary"
              disabled={request.pagina === 1}
              onClick={() => setRequest((r) => ({ ...r, pagina: r.pagina - 1 }))}
            >
              Anterior
            </button>
            <span>Página {request.pagina}</span>
            <button
              className="secondary"
              disabled={!data.haySiguiente}
              onClick={() => setRequest((r) => ({ ...r, pagina: r.pagina + 1 }))}
            >
              Siguiente
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
