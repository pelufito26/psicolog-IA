import { useEffect, useRef, useState, type FormEvent } from 'react';
import { labelsFicha, PacienteFichaNoDisponible, type FichaInput } from './client';
import { fichaEditor, type FichaEditor, type FichaEdicion } from './edit-client';
import { consultarFicha, type ConsultarFicha, type ConsultaFicha } from './consulta-client';
type Props = {
  pacienteId: string;
  api?: FichaEditor;
  read?: ConsultarFicha;
  onClose: (saved: boolean) => void;
};
export function EditarFicha(props: Props) {
  return <Editor key={props.pacienteId} {...props} />;
}
function Editor({ pacienteId, api = fichaEditor, read = consultarFicha, onClose }: Props) {
  const [loaded, setLoaded] = useState<FichaEdicion>();
  const [values, setValues] = useState<FichaInput>();
  const [busy, setBusy] = useState(true),
    [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0),
    [confirmReload, setConfirmReload] = useState(false);
  const [uncertain, setUncertain] = useState(false),
    [actual, setActual] = useState<ConsultaFicha>();
  const [unavailable, setUnavailable] = useState(false),
    [loadFailed, setLoadFailed] = useState(false);
  const alive = useRef(false),
    locked = useRef(true),
    controller = useRef<AbortController | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    heading.current?.focus();
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    let active = true;
    const c = new AbortController();
    controller.current = c;
    api
      .load(pacienteId, c.signal)
      .then(
        (data) => {
          if (!active) return;
          setLoaded(data);
          setLoadFailed(false);
          setUnavailable(false);
          setErrors({});
          setActual(undefined);
          setUncertain(false);
          setConfirmReload(false);
          setMessage('');
          setBlocked(false);
          if (data.ficha)
            setValues(
              Object.fromEntries(
                Object.keys(labelsFicha).map((k) => [k, data.ficha![k as keyof FichaInput] ?? '']),
              ) as FichaInput,
            );
          else {
            setValues(undefined);
            setMessage('Todavía no tiene ficha clínica. Volvé al perfil para crearla.');
          }
        },
        (error) => {
          if (!active) return;
          setLoadFailed(true);
          setBlocked(true);
          const missing = error instanceof PacienteFichaNoDisponible;
          setUnavailable(missing);
          setMessage(
            missing
              ? 'El paciente no está disponible.'
              : 'No se pudo cargar la edición. El borrador se conserva si ya estaba abierto.',
          );
        },
      )
      .finally(() => {
        if (active) {
          setBusy(false);
          locked.current = false;
        }
      });
    return () => {
      active = false;
      c.abort();
    };
  }, [api, pacienteId, revision]);
  function reload() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setConfirmReload(false);
    setRevision((r) => r + 1);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current || blocked || !values || !loaded?.ficha) return;
    if (!values.motivoConsulta.trim()) {
      setErrors({ motivoConsulta: 'Ingresá el motivo de consulta.' });
      return;
    }
    locked.current = true;
    setBusy(true);
    setErrors({});
    setMessage('');
    const c = new AbortController();
    controller.current = c;
    try {
      const result = await api.save(pacienteId, loaded.ficha.version, values, c.signal);
      if (!alive.current) return;
      if (result.kind === 'saved') {
        onClose(true);
        return;
      }
      if (result.kind === 'invalid') setErrors(result.errors);
      else if (result.kind === 'too-large')
        setMessage(
          'El envío supera 16 KiB. Reducí el texto antes de guardar; el borrador se conserva.',
        );
      else {
        setBlocked(true);
        if (result.kind === 'conflict')
          setMessage(
            'La ficha cambió desde que abriste el editor. No se sobrescribió; conservamos tu borrador.',
          );
        else if (result.kind === 'missing') {
          setUnavailable(true);
          setMessage('El paciente no está disponible.');
        } else if (result.kind === 'absent')
          setMessage('La ficha ya no está disponible. No se creó otra; conservamos el borrador.');
        else {
          setUncertain(true);
          setMessage(
            'No se pudo confirmar el guardado. Puede haberse realizado. Conservamos tu borrador; no lo reenvíes.',
          );
        }
      }
    } catch {
      if (alive.current) {
        setBlocked(true);
        setUncertain(true);
        setMessage(
          'No se pudo confirmar el guardado. Puede haberse realizado. Conservamos tu borrador; no lo reenvíes.',
        );
      }
    } finally {
      if (alive.current) {
        setBusy(false);
        locked.current = false;
      }
    }
  }
  async function check() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setActual(undefined);
    const c = new AbortController();
    controller.current = c;
    try {
      const data = await read(pacienteId, c.signal);
      if (alive.current) setActual(data);
    } catch {
      if (alive.current)
        setMessage(
          'No se pudo comprobar la ficha actual. El borrador se conserva y el guardado sigue bloqueado.',
        );
    } finally {
      if (alive.current) {
        setBusy(false);
        locked.current = false;
      }
    }
  }
  return (
    <section className="patient-card" aria-labelledby="edit-ficha-title">
      <h2 id="edit-ficha-title" ref={heading} tabIndex={-1}>
        Editar ficha clínica
      </h2>
      <button
        className="secondary"
        disabled={busy}
        onClick={() => {
          if (!locked.current) onClose(false);
        }}
      >
        {uncertain ? 'Salir y consultar sin confirmar el guardado' : 'Cancelar y volver a la ficha'}
      </button>
      {busy && <p role="status">{loaded ? 'Procesando…' : 'Cargando edición…'}</p>}
      {loaded && (
        <h3>
          {loaded.nombre} {loaded.apellido}
        </h3>
      )}
      {message && <p role="alert">{message}</p>}
      {loadFailed && !values && !unavailable && (
        <button disabled={busy} onClick={reload}>
          Reintentar carga
        </button>
      )}
      {values && (
        <form
          onSubmit={(e) => {
            void submit(e);
          }}
          noValidate
        >
          <p>El motivo de consulta es el único campo obligatorio.</p>
          <div className="ficha-fields">
            {Object.entries(labelsFicha).map(([key, label]) => {
              const k = key as keyof FichaInput;
              return (
                <div key={key}>
                  <label htmlFor={'edit-ficha-' + key}>
                    {label}
                    {key === 'motivoConsulta' ? ' *' : ' (opcional)'}
                  </label>
                  <textarea
                    id={'edit-ficha-' + key}
                    required={key === 'motivoConsulta'}
                    value={values[k]}
                    disabled={busy || unavailable || confirmReload}
                    aria-invalid={!!errors[k]}
                    aria-describedby={errors[k] ? 'error-' + key : undefined}
                    onChange={(e) => setValues((v) => v && { ...v, [k]: e.target.value })}
                  />
                  {errors[k] && (
                    <p id={'error-' + key} role="alert">
                      {errors[k]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {errors.formulario && <p role="alert">{errors.formulario}</p>}
          <button disabled={busy || blocked || confirmReload} type="submit">
            Guardar cambios de ficha
          </button>
        </form>
      )}
      {values && blocked && !unavailable && (
        <div>
          {uncertain && (
            <button
              disabled={busy || confirmReload}
              onClick={() => {
                void check();
              }}
            >
              Comprobar ficha actual
            </button>
          )}
          <button disabled={busy || confirmReload} onClick={() => setConfirmReload(true)}>
            Recargar datos guardados
          </button>
        </div>
      )}
      {confirmReload && (
        <div role="group" aria-label="Confirmar descarte del borrador">
          <p>
            Recargar reemplazará tu borrador por los datos guardados. Si falla la lectura,
            conservarás el borrador.
          </p>
          <button disabled={busy} onClick={reload}>
            Confirmar descarte y recargar
          </button>
          <button disabled={busy} onClick={() => setConfirmReload(false)}>
            Conservar borrador
          </button>
        </div>
      )}
      {actual && (
        <section aria-label="Contenido guardado comprobado">
          <h3>Contenido guardado comprobado</h3>
          <p>Esta lectura no confirma que el intento anterior haya guardado tu borrador.</p>
          <p>
            {actual.nombre} {actual.apellido}
          </p>
          {actual.ficha ? (
            <dl className="clinical-content">
              {Object.entries(labelsFicha).map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd className="clinical-text">
                    {actual.ficha![key as keyof FichaInput] || 'Sin registrar'}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>Todavía no tiene ficha clínica.</p>
          )}
        </section>
      )}
    </section>
  );
}
