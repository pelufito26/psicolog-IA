import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  fichaAPI,
  labelsFicha,
  PacienteFichaNoDisponible,
  type FichaAPI,
  type FichaInput,
} from './client';
const empty: FichaInput = {
  motivoConsulta: '',
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
  medicacion: '',
  evaluacionClinica: '',
  observacionesGenerales: '',
};
export function CrearFicha({
  pacienteId,
  api = fichaAPI,
  onClose,
}: {
  pacienteId: string;
  api?: FichaAPI;
  onClose: (saved: boolean) => void;
}) {
  const [values, setValues] = useState({ ...empty }),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [exists, setExists] = useState(false),
    [missing, setMissing] = useState(false),
    [uncertain, setUncertain] = useState(false);
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
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current || exists || missing) return;
    if (!values.motivoConsulta.trim()) {
      setErrors({ motivoConsulta: 'Ingresá el motivo de consulta.' });
      return;
    }
    locked.current = true;
    setBusy(true);
    setErrors({});
    setMessage('');
    setUncertain(false);
    controller.current = new AbortController();
    try {
      const result = await api.create(pacienteId, values, controller.current.signal);
      if (!mounted.current) return;
      if (result.kind === 'created') {
        onClose(true);
        return;
      }
      if (result.kind === 'invalid') setErrors(result.errors);
      else if (result.kind === 'exists') setExists(true);
      else if (result.kind === 'missing') setMissing(true);
      else if (result.kind === 'too-large')
        setMessage(
          'El contenido supera el límite de la solicitud (16 KiB). Reducí el texto antes de guardar; el borrador se conservó.',
        );
      else {
        setUncertain(true);
        setMessage(
          'No se pudo confirmar la creación. Comprobá el estado antes de volver a intentar.',
        );
      }
    } catch {
      if (mounted.current) {
        setUncertain(true);
        setMessage(
          'No se pudo confirmar la creación. Comprobá el estado antes de volver a intentar.',
        );
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function check() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    controller.current = new AbortController();
    try {
      const current = await api.state(pacienteId, controller.current.signal);
      if (!mounted.current) return;
      setExists(current);
      setUncertain(false);
      setMessage(
        current
          ? 'No se confirmó que la ficha existente contenga este borrador.'
          : 'No se encontró una ficha. Revisá el borrador antes de volver a guardar.',
      );
    } catch (error) {
      if (mounted.current) {
        if (error instanceof PacienteFichaNoDisponible) setMissing(true);
        else
          setMessage(
            'No se pudo comprobar el estado. El borrador se conservó; volvé a consultar antes de guardar.',
          );
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="patient-card" aria-labelledby="create-ficha-title">
      <h2 id="create-ficha-title" ref={heading} tabIndex={-1}>
        Crear ficha clínica
      </h2>
      <p>El motivo de consulta es el único campo obligatorio.</p>
      <form
        noValidate
        onSubmit={(e) => {
          void submit(e);
        }}
      >
        <fieldset className="ficha-fields" disabled={busy || exists || missing}>
          {(Object.keys(labelsFicha) as (keyof FichaInput)[]).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={'ficha-' + key}>
                {labelsFicha[key]}
                {key === 'motivoConsulta' ? ' *' : ' (opcional)'}
              </label>
              <textarea
                id={'ficha-' + key}
                required={key === 'motivoConsulta'}
                rows={key === 'motivoConsulta' ? 4 : 3}
                autoComplete="off"
                value={values[key]}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? 'ficha-' + key + '-error' : undefined}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [key]: e.target.value }));
                  setErrors((previous) => ({ ...previous, [key]: '' }));
                }}
              />
              {errors[key] && (
                <span className="field-error" id={'ficha-' + key + '-error'}>
                  {errors[key]}
                </span>
              )}
            </div>
          ))}
        </fieldset>
        {errors.formulario && <p role="alert">{errors.formulario}</p>}
        {exists && (
          <p role="alert">
            Ya existe una ficha clínica. El borrador se conserva y no se sobrescribe la ficha
            existente.
          </p>
        )}
        {missing && <p role="alert">El paciente no está disponible.</p>}
        <p role="status" aria-label="Estado de creación de ficha">
          {busy ? 'Procesando ficha…' : message}
        </p>
        <div className="actions">
          <button type="submit" disabled={busy || exists || missing || uncertain}>
            Guardar ficha
          </button>
          {uncertain && (
            <button
              type="button"
              disabled={busy || missing}
              onClick={() => {
                void check();
              }}
            >
              Comprobar estado
            </button>
          )}
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => onClose(false)}
          >
            Cancelar y volver al perfil
          </button>
        </div>
      </form>
    </section>
  );
}
