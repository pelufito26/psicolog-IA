import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  sesionAPI,
  SesionNoDisponible,
  type SesionAPI,
  type PacienteSesion,
  type DatosSesion,
  type EnvioSesion,
} from './client';
type Props = {
  pacienteId: string;
  api?: SesionAPI;
  onSaved: (id: string) => void;
  onBack: () => void;
};
export function RegistrarSesion(props: Props) {
  return <Form key={props.pacienteId} {...props} />;
}
function Form({ pacienteId, api = sesionAPI, onSaved, onBack }: Props) {
  const [patient, setPatient] = useState<PacienteSesion>();
  const [values, setValues] = useState<DatosSesion>({ fechaSesion: '', anotacionesClinicas: '' });
  const [busy, setBusy] = useState(true),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0),
    [loadFailed, setLoadFailed] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const [pending, setPending] = useState<EnvioSesion>(),
    [blocked, setBlocked] = useState(false);
  const alive = useRef(false),
    locked = useRef(true),
    controller = useRef<AbortController | undefined>(undefined),
    heading = useRef<HTMLHeadingElement>(null);
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
      .prepare(pacienteId, c.signal)
      .then(
        (b) => {
          if (active) {
            setPatient(b);
            setValues((v) => ({ ...v, fechaSesion: v.fechaSesion || b.hoy }));
            setLoadFailed(false);
            setMessage('');
          }
        },
        (error) => {
          if (active) {
            setLoadFailed(true);
            setUnavailable(error instanceof SesionNoDisponible);
            setMessage(
              error instanceof SesionNoDisponible
                ? 'El paciente no está disponible.'
                : 'No se pudo preparar el registro de sesión.',
            );
          }
        },
      )
      .finally(() => {
        if (active) {
          locked.current = false;
          setBusy(false);
        }
      });
    return () => {
      active = false;
      c.abort();
    };
  }, [api, pacienteId, revision]);
  async function send(data: EnvioSesion) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage('');
    setErrors({});
    const c = new AbortController();
    controller.current = c;
    try {
      const r = await api.register(pacienteId, data, c.signal);
      if (!alive.current) return;
      if (r.kind === 'saved') {
        onSaved(r.id);
        return;
      }
      if (r.kind === 'invalid') {
        setPending(undefined);
        setErrors(r.errors);
      } else if (r.kind === 'too-large') {
        setPending(undefined);
        setMessage('El envío supera 16 KiB. Reducí las anotaciones; el borrador se conserva.');
      } else if (r.kind === 'missing') {
        setBlocked(true);
        setUnavailable(true);
        setMessage('El paciente no está disponible.');
      } else if (r.kind === 'conflict') {
        setBlocked(true);
        setMessage(
          'La operación es incompatible. No se creó otra sesión; conservamos el borrador.',
        );
      } else {
        setPending(data);
        setMessage(
          'No se pudo confirmar el registro. Puede haberse guardado. Comprobá la operación o reintentá el mismo envío.',
        );
      }
    } catch {
      if (alive.current) {
        setPending(data);
        setMessage(
          'No se pudo confirmar el registro. Puede haberse guardado. Comprobá la operación o reintentá el mismo envío.',
        );
      }
    } finally {
      if (alive.current) {
        setBusy(false);
        locked.current = false;
      }
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (locked.current || pending || blocked || !patient) return;
    const errs: Record<string, string> = {};
    if (!values.fechaSesion) errs.fechaSesion = 'Ingresá una fecha válida.';
    if (!values.anotacionesClinicas.trim())
      errs.anotacionesClinicas = 'Ingresá las anotaciones clínicas.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    void send({ ...values, operacionId: crypto.randomUUID() });
  }
  async function check() {
    if (locked.current || !pending) return;
    locked.current = true;
    setBusy(true);
    const c = new AbortController();
    controller.current = c;
    try {
      const r = await api.check(pacienteId, pending.operacionId, c.signal);
      if (!alive.current) return;
      if (r.estado === 'registrada') {
        onSaved(r.id);
        return;
      }
      setMessage(
        'El resultado todavía no está confirmado: el envío puede seguir pendiente. Podés comprobar de nuevo o reintentar el mismo envío sin crear otra operación.',
      );
    } catch {
      if (alive.current)
        setMessage(
          'No se pudo comprobar la operación. Conservamos el borrador; no lo registres como una sesión nueva.',
        );
    } finally {
      if (alive.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="patient-card" aria-labelledby="register-session-title">
      <h2 id="register-session-title" ref={heading} tabIndex={-1}>
        Registrar sesión clínica
      </h2>
      <button
        className="secondary"
        disabled={busy}
        onClick={() => {
          if (!locked.current) onBack();
        }}
      >
        {pending ? 'Salir sin confirmar el registro' : 'Cancelar y volver al historial'}
      </button>
      {busy && <p role="status">{patient ? 'Procesando…' : 'Preparando registro…'}</p>}
      {patient && (
        <h3>
          {patient.nombre} {patient.apellido}
        </h3>
      )}
      {message && <p role="alert">{message}</p>}
      {loadFailed && !unavailable && (
        <button
          disabled={busy}
          onClick={() => {
            locked.current = true;
            setBusy(true);
            setRevision((r) => r + 1);
          }}
        >
          Reintentar preparación
        </button>
      )}
      {patient && !loadFailed && (
        <form onSubmit={submit} noValidate>
          <label htmlFor="session-date">Fecha de sesión *</label>
          <input
            id="session-date"
            type="date"
            required
            value={values.fechaSesion}
            disabled={busy || !!pending || blocked}
            aria-invalid={!!errors.fechaSesion}
            aria-describedby={errors.fechaSesion ? 'session-date-error' : undefined}
            onChange={(e) => setValues((v) => ({ ...v, fechaSesion: e.target.value }))}
          />
          {errors.fechaSesion && (
            <p id="session-date-error" role="alert">
              {errors.fechaSesion}
            </p>
          )}
          <label htmlFor="session-notes">Anotaciones clínicas *</label>
          <textarea
            id="session-notes"
            required
            value={values.anotacionesClinicas}
            disabled={busy || !!pending || blocked}
            aria-invalid={!!errors.anotacionesClinicas}
            aria-describedby={errors.anotacionesClinicas ? 'session-notes-error' : undefined}
            onChange={(e) => setValues((v) => ({ ...v, anotacionesClinicas: e.target.value }))}
          />
          {errors.anotacionesClinicas && (
            <p id="session-notes-error" role="alert">
              {errors.anotacionesClinicas}
            </p>
          )}
          {errors.formulario && <p role="alert">{errors.formulario}</p>}
          <div className="actions">
            <button disabled={busy || !!pending || blocked}>Guardar sesión</button>
          </div>
        </form>
      )}
      {pending && !blocked && (
        <div className="actions">
          <button
            disabled={busy}
            onClick={() => {
              void check();
            }}
          >
            Comprobar operación
          </button>
          <button
            disabled={busy}
            onClick={() => {
              void send(pending);
            }}
          >
            Reintentar el mismo envío
          </button>
        </div>
      )}
    </section>
  );
}
