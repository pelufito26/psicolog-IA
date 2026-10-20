import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  SesionNoDisponible,
  sesionAPI,
  fechaClinica,
  type DatosSesion,
  type SesionAPI,
  type Detalle,
} from './client';
import { sesionEditor, type SesionEditor, type SesionEdicion } from './edit-client';
type Props = {
  pacienteId: string;
  sesionId: string;
  api?: SesionEditor;
  read?: SesionAPI['detail'];
  onClose: (saved: boolean) => void;
};
export function EditarSesion(props: Props) {
  return <Editor key={props.pacienteId + props.sesionId} {...props} />;
}
function Editor({
  pacienteId,
  sesionId,
  api = sesionEditor,
  read = sesionAPI.detail,
  onClose,
}: Props) {
  const [loaded, setLoaded] = useState<SesionEdicion>();
  const [values, setValues] = useState<DatosSesion>();
  const [busy, setBusy] = useState(true),
    [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0),
    [confirmReload, setConfirmReload] = useState(false);
  const [uncertain, setUncertain] = useState(false),
    [actual, setActual] = useState<Detalle>();
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
      .load(pacienteId, sesionId, c.signal)
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
          setValues({
            fechaSesion: data.sesion.fechaSesion,
            anotacionesClinicas: data.sesion.anotacionesClinicas,
          });
        },
        (error) => {
          if (!active) return;
          setLoadFailed(true);
          setBlocked(true);
          const missing = error instanceof SesionNoDisponible;
          setUnavailable(missing);
          setMessage(
            missing
              ? 'El registro no está disponible.'
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
  }, [api, pacienteId, sesionId, revision]);
  function reload() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setConfirmReload(false);
    setRevision((r) => r + 1);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current || blocked || !values || !loaded?.sesion) return;
    const invalid: Record<string, string> = {};
    if (!values.fechaSesion) invalid.fechaSesion = 'Ingresá una fecha válida.';
    if (!values.anotacionesClinicas.trim())
      invalid.anotacionesClinicas = 'Ingresá las anotaciones clínicas.';
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      return;
    }
    locked.current = true;
    setBusy(true);
    setErrors({});
    setMessage('');
    const c = new AbortController();
    controller.current = c;
    try {
      const result = await api.save(pacienteId, sesionId, loaded.sesion.version, values, c.signal);
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
            'La sesión cambió desde que abriste el editor. No se sobrescribió; conservamos tu borrador.',
          );
        else if (result.kind === 'missing') {
          setUnavailable(true);
          setMessage('El registro no está disponible.');
        } else {
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
      const data = await read(pacienteId, sesionId, c.signal);
      if (alive.current) setActual(data);
    } catch {
      if (alive.current)
        setMessage(
          'No se pudo comprobar la sesión actual. El borrador se conserva y el guardado sigue bloqueado.',
        );
    } finally {
      if (alive.current) {
        setBusy(false);
        locked.current = false;
      }
    }
  }
  return (
    <section className="patient-card" aria-labelledby="edit-session-title">
      <h2 id="edit-session-title" ref={heading} tabIndex={-1}>
        Editar sesión clínica
      </h2>
      <button
        className="secondary"
        disabled={busy}
        onClick={() => {
          if (!locked.current) onClose(false);
        }}
      >
        {uncertain ? 'Salir y consultar sin confirmar el guardado' : 'Cancelar y volver al detalle'}
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
          <p>Fecha y anotaciones son obligatorias.</p>
          <p>
            Profesional responsable: {loaded?.sesion.profesional.nombre}{' '}
            {loaded?.sesion.profesional.apellido}
          </p>
          <div className="ficha-fields">
            {(['fechaSesion', 'anotacionesClinicas'] as const).map((k) => {
              const attributes = {
                id: 'edit-session-' + k,
                required: true,
                value: values[k],
                disabled: busy || unavailable || confirmReload,
                'aria-invalid': !!errors[k],
                'aria-describedby': errors[k] ? 'error-' + k : undefined,
                onChange: (e: { target: { value: string } }) =>
                  setValues((v) => v && { ...v, [k]: e.target.value }),
              };
              return (
                <div key={k}>
                  <label htmlFor={attributes.id}>
                    {k === 'fechaSesion' ? 'Fecha de sesión *' : 'Anotaciones clínicas *'}
                  </label>
                  {k === 'fechaSesion' ? (
                    <input type="date" {...attributes} />
                  ) : (
                    <textarea {...attributes} />
                  )}
                  {errors[k] && (
                    <p id={'error-' + k} role="alert">
                      {errors[k]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {errors.formulario && <p role="alert">{errors.formulario}</p>}
          <button disabled={busy || blocked || confirmReload} type="submit">
            Guardar cambios de sesión
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
              Comprobar sesión actual
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
          <dl className="clinical-content">
            <div>
              <dt>Fecha de sesión</dt>
              <dd>{fechaClinica(actual.sesion.fechaSesion)}</dd>
            </div>
            <div>
              <dt>Anotaciones clínicas</dt>
              <dd className="clinical-text">{actual.sesion.anotacionesClinicas}</dd>
            </div>
          </dl>
        </section>
      )}
    </section>
  );
}
