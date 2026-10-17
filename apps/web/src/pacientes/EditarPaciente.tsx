import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  cargarEdicion,
  guardarEdicion,
  type Edicion,
  type LoadEdicion,
  type SaveEdicion,
} from './edit-client';
import { PacienteNoDisponible } from './profile-client';
import type { PacienteInput } from './client';
const labels: Record<keyof PacienteInput, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  fechaNacimiento: 'Fecha de nacimiento',
  telefono: 'Teléfono',
};
export function EditarPaciente({
  id,
  load = cargarEdicion,
  save = guardarEdicion,
  onClose,
}: {
  id: string;
  load?: LoadEdicion;
  save?: SaveEdicion;
  onClose: (saved: boolean) => void;
}) {
  const [revision, setRevision] = useState(0),
    [loaded, setLoaded] = useState<{
      id: string;
      revision: number;
      data?: Edicion;
      error?: 'missing' | 'temporary';
    }>();
  const [values, setValues] = useState<Edicion>(),
    [sending, setSending] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(''),
    [token, setToken] = useState<string>(),
    [conflict, setConflict] = useState(false),
    [missing, setMissing] = useState(false);
  const mounted = useRef(false),
    locked = useRef(false),
    controller = useRef<AbortController | undefined>(undefined),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    mounted.current = true;
    heading.current?.focus();
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    const c = new AbortController();
    let active = true;
    load(id, c.signal).then(
      (data) => {
        if (active) {
          setLoaded({ id, revision, data });
          setValues(data);
        }
      },
      (error) => {
        if (active)
          setLoaded({
            id,
            revision,
            error: error instanceof PacienteNoDisponible ? 'missing' : 'temporary',
          });
      },
    );
    return () => {
      active = false;
      c.abort();
    };
  }, [id, load, revision]);
  const current = loaded?.id === id && loaded.revision === revision ? loaded : undefined;
  function reload() {
    setToken(undefined);
    setConflict(false);
    setMissing(false);
    setMessage('');
    setErrors({});
    setRevision((r) => r + 1);
  }
  function change(key: keyof PacienteInput, value: string) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
    setToken(undefined);
    setErrors((e) => ({ ...e, [key]: '' }));
    setMessage('');
  }
  async function submit(event?: FormEvent, confirmation?: string) {
    event?.preventDefault();
    if (locked.current || !values || !current?.data || conflict || missing) return;
    const invalid: Record<string, string> = {};
    for (const key of Object.keys(labels) as (keyof PacienteInput)[])
      if (!values[key].trim()) invalid[key] = 'Completá este campo.';
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      setMessage('Revisá los campos señalados.');
      return;
    }
    locked.current = true;
    setSending(true);
    setErrors({});
    setMessage('');
    controller.current = new AbortController();
    try {
      const result = await save(values, confirmation, controller.current.signal);
      if (!mounted.current) return;
      setToken(undefined);
      if (result.kind === 'updated') {
        onClose(true);
        return;
      }
      if (result.kind === 'duplicate') setToken(result.token);
      else if (result.kind === 'invalid') {
        setErrors(result.errors);
        setMessage('Revisá los campos señalados.');
      } else if (result.kind === 'conflict') setConflict(true);
      else if (result.kind === 'missing') setMissing(true);
      else if (result.kind === 'confirmation')
        setMessage(
          'La confirmación no es válida o venció. Volvé a guardar para comprobar los duplicados.',
        );
      else
        setMessage(
          'No se pudo confirmar el guardado. Revisá el perfil antes de volver a intentar.',
        );
    } catch {
      if (mounted.current) {
        setToken(undefined);
        setMessage(
          'No se pudo confirmar el guardado. Revisá el perfil antes de volver a intentar.',
        );
      }
    } finally {
      locked.current = false;
      if (mounted.current) setSending(false);
    }
  }
  return (
    <section className="patient-card" aria-labelledby="edit-title">
      <h2 id="edit-title" ref={heading} tabIndex={-1}>
        Editar datos del paciente
      </h2>
      {!current && <p role="status">Cargando datos para editar…</p>}
      {current?.error === 'missing' && <p role="status">El paciente no está disponible.</p>}
      {current?.error === 'temporary' && (
        <div role="alert">
          <p>No se pudo cargar la edición.</p>
          <button onClick={reload}>Reintentar</button>
        </div>
      )}
      {current?.data && values && (
        <form
          noValidate
          onSubmit={(e) => {
            void submit(e);
          }}
        >
          <fieldset className="access-fields" disabled={sending || missing}>
            <div className="form-grid">
              {(Object.keys(labels) as (keyof PacienteInput)[]).map((key) => (
                <div className="field" key={key}>
                  <label htmlFor={'editar-' + key}>{labels[key]} *</label>
                  <input
                    id={'editar-' + key}
                    type={key === 'fechaNacimiento' ? 'date' : key === 'telefono' ? 'tel' : 'text'}
                    autoComplete="off"
                    required
                    value={values[key]}
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? 'editar-' + key + '-error' : undefined}
                    onChange={(e) => change(key, e.target.value)}
                  />
                  {errors[key] && (
                    <span className="field-error" id={'editar-' + key + '-error'}>
                      {errors[key]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
          {errors.formulario && <p role="alert">{errors.formulario}</p>}
          {token && (
            <div className="duplicate-box" role="alert">
              <h3>Posible paciente duplicado</h3>
              <p>
                Otro paciente de este profesional tiene nombre, apellido y nacimiento equivalentes.
                Todavía no se guardaron los cambios.
              </p>
              <div className="actions">
                <button type="button" disabled={sending} onClick={() => setToken(undefined)}>
                  Volver a editar
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => {
                    void submit(undefined, token);
                  }}
                >
                  Guardar de todos modos
                </button>
              </div>
            </div>
          )}
          {conflict && (
            <div role="alert">
              <p>
                El paciente tiene cambios más recientes. Tu borrador se conservó; revisá los datos
                actuales antes de guardar.
              </p>
              <button type="button" onClick={reload}>
                Descartar borrador y cargar datos actuales
              </button>
            </div>
          )}
          {missing && <p role="alert">El paciente no está disponible. No se pudo guardar.</p>}
          <div className="actions">
            {!token && (
              <button type="submit" disabled={sending || conflict || missing}>
                {sending ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}
            <button
              type="button"
              className="secondary"
              disabled={sending}
              onClick={() => onClose(false)}
            >
              Cancelar
            </button>
          </div>
          <p role="status" aria-label="Estado de la edición">
            {sending ? 'Guardando cambios…' : message}
          </p>
        </form>
      )}
      {!current?.data && (
        <button className="secondary" onClick={() => onClose(false)}>
          Cancelar
        </button>
      )}
    </section>
  );
}
