import { useEffect, useRef, useState, type FormEvent } from 'react';
import { savePaciente, uncertain, type PacienteInput, type SavePaciente } from './client';
const empty: PacienteInput = { nombre: '', apellido: '', fechaNacimiento: '', telefono: '' };
const labels: Record<keyof PacienteInput, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  fechaNacimiento: 'Fecha de nacimiento',
  telefono: 'Teléfono',
};
export function PacienteForm({
  save = savePaciente,
  onCancel,
  onSuccess,
}: {
  save?: SavePaciente;
  onCancel: () => void;
  onSuccess?: () => void;
}) {
  const [values, setValues] = useState<PacienteInput>({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string>();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | undefined>(undefined);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!sending && message === 'Paciente registrado correctamente.') first.current?.focus();
  }, [sending, message]);
  async function submit(event?: FormEvent, confirmation?: string) {
    event?.preventDefault();
    if (locked.current) return;
    const invalid: Record<string, string> = {};
    for (const key of Object.keys(empty) as (keyof PacienteInput)[])
      if (!values[key].trim()) invalid[key] = 'Completá este campo.';
    if (values.telefono && !/^\+?\d{7,15}$/.test(values.telefono.trim().replace(/[\s()-]/gu, '')))
      invalid.telefono = 'Usá entre 7 y 15 dígitos con + inicial opcional.';
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
      if (result.kind === 'created') {
        setValues({ ...empty });
        setMessage('Paciente registrado correctamente.');
        onSuccess?.();
        first.current?.focus();
      } else if (result.kind === 'duplicate') setToken(result.token);
      else if (result.kind === 'invalid') {
        setErrors(result.errors);
        setMessage('Revisá los campos señalados.');
      } else setMessage(result.message);
    } catch {
      if (mounted.current) {
        setToken(undefined);
        setMessage(uncertain);
      }
    } finally {
      locked.current = false;
      if (mounted.current) setSending(false);
    }
  }
  function update(key: keyof PacienteInput, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setToken(undefined);
    setMessage('');
    setErrors((previous) => ({ ...previous, [key]: '' }));
  }
  return (
    <section className="patient-card" aria-labelledby="register-title">
      <div className="section-heading">
        <span className="step-label">PACIENTES / NUEVO REGISTRO</span>
        <h2 id="register-title">Registrar paciente</h2>
        <p>Completá los datos personales para iniciar el seguimiento.</p>
      </div>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
      >
        <div className="form-grid">
          {(Object.keys(empty) as (keyof PacienteInput)[]).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={key}>
                {labels[key]} <span aria-hidden="true">*</span>
              </label>
              <input
                ref={key === 'nombre' ? first : undefined}
                id={key}
                name={key}
                type={key === 'fechaNacimiento' ? 'date' : key === 'telefono' ? 'tel' : 'text'}
                autoComplete="off"
                required
                value={values[key]}
                disabled={sending}
                aria-invalid={!!errors[key]}
                aria-describedby={
                  errors[key] ? key + '-error' : key === 'telefono' ? 'phone-help' : undefined
                }
                onChange={(event) => update(key, event.target.value)}
              />
              {errors[key] && (
                <span className="field-error" id={key + '-error'}>
                  {errors[key]}
                </span>
              )}
              {key === 'telefono' && !errors[key] && (
                <span className="field-hint" id="phone-help">
                  Entre 7 y 15 dígitos. Podés usar + y separadores.
                </span>
              )}
            </div>
          ))}
        </div>
        {errors.formulario && (
          <p role="alert" className="form-error">
            {errors.formulario}
          </p>
        )}
        {token && (
          <div className="duplicate-box" role="alert">
            <h3>Posible paciente duplicado</h3>
            <p>
              Ya hay un registro con nombre, apellido y nacimiento equivalentes para este
              profesional. No se guardó un nuevo paciente.
            </p>
            <dl>
              <dt>Paciente a registrar</dt>
              <dd>
                {values.nombre} {values.apellido}
              </dd>
              <dt>Nacimiento</dt>
              <dd>{values.fechaNacimiento}</dd>
              <dt>Teléfono</dt>
              <dd>{values.telefono}</dd>
            </dl>
            <div className="actions">
              <button
                type="button"
                className="secondary"
                disabled={sending}
                onClick={() => {
                  setToken(undefined);
                  first.current?.focus();
                }}
              >
                Volver a editar
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  void submit(undefined, token);
                }}
              >
                Registrar de todos modos
              </button>
            </div>
          </div>
        )}
        {!token && (
          <div className="actions">
            <button type="submit" disabled={sending}>
              {sending ? 'Guardando…' : 'Registrar paciente'}
            </button>
            <button type="button" className="secondary" disabled={sending} onClick={onCancel}>
              Cancelar
            </button>
          </div>
        )}
        <p
          role="status"
          aria-label="Estado del registro"
          aria-live="polite"
          className="form-message"
        >
          {sending ? 'Guardando paciente…' : message}
        </p>
        <p className="required-note">* Todos los campos son obligatorios.</p>
      </form>
    </section>
  );
}
