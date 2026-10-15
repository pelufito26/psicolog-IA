import { useEffect, useState, type ReactNode } from 'react';
import { access, type AccessState } from './client';
type Call = typeof access;
const messages: Record<string, string> = {
  ACCESO_NO_CONFIGURADO: 'El acceso todavía no está configurado para este entorno.',
  CREDENCIALES_INVALIDAS: 'Revisá el email y la contraseña. Confirmá también tu correo.',
  CODIGO_INVALIDO:
    'El código es incorrecto, venció o agotó sus intentos. Ingresá de nuevo o reenviá cuando esté permitido.',
  LIMITE_ALCANZADO: 'Alcanzaste el límite de intentos o envíos. Esperá antes de reintentar.',
  CORREO_NO_DISPONIBLE: 'No se pudo confirmar el envío. Esperá un minuto y volvé a ingresar.',
  PASSWORD_INVALIDA: 'Usá una contraseña de entre 12 y 128 caracteres.',
  ENLACE_INVALIDO: 'El enlace no es válido o venció. Solicitá otro.',
};
export function Acceso({ children, call = access }: { children: ReactNode; call?: Call }) {
  const [state, setState] = useState('cargando'),
    [form, setForm] = useState('ingresar'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [retry, setRetry] = useState(0);
  const [values, setValues] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    codigo: '',
  });
  const [recovery, setRecovery] = useState('');
  const [simulation, setSimulation] = useState(false);
  const [account, setAccount] = useState('');
  useEffect(() => {
    if (state !== 'autenticado') return;
    let active = true;
    const check = () => {
      void call('estado')
        .then((data) => {
          if (!active) return;
          setAccount(data.usuario ?? '');
          if (data.estado !== 'autenticado') setState('anonimo');
        })
        .catch(() => {
          if (active) {
            setState('error');
            setError('No se pudo comprobar el acceso.');
          }
        });
    };
    window.addEventListener('focus', check);
    return () => {
      active = false;
      window.removeEventListener('focus', check);
    };
  }, [state, call]);
  useEffect(() => {
    const expired = () => {
      setState('anonimo');
      setForm('ingresar');
      setNotice('La sesión venció. Volvé a ingresar.');
    };
    window.addEventListener('psico-session-expired', expired);
    return () => window.removeEventListener('psico-session-expired', expired);
  }, []);
  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token_hash'),
      type = url.searchParams.get('type');
    if (token) window.history.replaceState(null, '', url.pathname);
    void call('estado')
      .then(async (data) => {
        if (active) setSimulation(data.simulado === true);
        if (active) setAccount(data.usuario ?? '');
        if (token && type === 'signup') {
          await call('confirmar', { token });
          if (active) setNotice('Email confirmado. Ingresá con tu contraseña.');
        }
        if (!active) return;
        if (token && type === 'recovery') {
          setRecovery(token);
          setForm('nueva-password');
          setState('anonimo');
        } else setState(token ? 'anonimo' : data.estado);
      })
      .catch((e) => {
        if (active) {
          setState('error');
          setError(messages[e.message] ?? 'No se pudo comprobar el acceso.');
        }
      });
    return () => {
      active = false;
    };
  }, [call, retry]);
  async function run(action: string, data: Record<string, string>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result: AccessState = await call(action, data);
      if (result.estado === 'autenticado') setAccount(result.usuario ?? '');
      if (action === 'salir') {
        setState('anonimo');
        setForm('ingresar');
        setValues({ nombre: '', apellido: '', email: '', password: '', codigo: '' });
        return;
      }
      if (result.estado === 'autenticado' || result.estado === 'codigo') setState(result.estado);
      else if (result.estado === 'revisar_correo') {
        setNotice('Si corresponde, recibirás un correo con los siguientes pasos.');
        setForm('ingresar');
      } else if (result.estado === 'ingresar') {
        setRecovery('');
        setForm('ingresar');
        setState('anonimo');
        setNotice('Contraseña actualizada. Volvé a ingresar y completar el código por email.');
      }
      setValues((v) => ({ ...v, password: '', codigo: '' }));
    } catch (e) {
      setError(
        messages[(e as Error).message] ?? 'No se pudo completar la operación. Volvé a intentarlo.',
      );
    } finally {
      setBusy(false);
    }
  }
  const change = (key: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const simulationNotice = simulation ? (
    <p role="note" className="duplicate-box">
      SIMULACIÓN LOCAL: identidad y correo ficticios.{' '}
      <a href="http://127.0.0.1:3002/" target="_blank" rel="noreferrer">
        Abrir buzón de prueba
      </a>
      . No se envían emails reales.
    </p>
  ) : null;
  if (state === 'autenticado')
    return (
      <>
        {simulationNotice}
        <div className="actions">
          <button
            disabled={busy}
            onClick={() => {
              void run('salir', {});
            }}
          >
            Cerrar sesión
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <div key={account}>{children}</div>
      </>
    );
  if (state === 'cargando') return <p role="status">Comprobando sesión…</p>;
  if (state === 'error')
    return (
      <section className="patient-card">
        <p role="alert">{error}</p>
        <button
          onClick={() => {
            setState('cargando');
            setRetry((x) => x + 1);
          }}
        >
          Reintentar acceso
        </button>
      </section>
    );
  const code = state === 'codigo';
  const labels = {
    ingresar: 'Ingresar',
    registro: 'Registrar profesional',
    recuperar: 'Recuperar contraseña',
    'nueva-password': 'Elegir nueva contraseña',
  };
  return (
    <section className="patient-card" aria-labelledby="access-title">
      {simulationNotice}
      <h2 id="access-title">{code ? 'Código de ingreso' : labels[form as keyof typeof labels]}</h2>
      <p>
        {code
          ? 'Ingresá el código que enviamos a tu email. Vence en cinco minutos y admite hasta cinco intentos.'
          : 'Acceso para profesionales · pacientes exclusivamente ficticios.'}
      </p>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const action = code ? 'verificar' : form;
          const data: Record<string, string> = code
            ? { codigo: values.codigo }
            : form === 'registro'
              ? {
                  nombre: values.nombre,
                  apellido: values.apellido,
                  email: values.email,
                  password: values.password,
                }
              : form === 'recuperar'
                ? { email: values.email }
                : form === 'nueva-password'
                  ? { token: recovery, password: values.password }
                  : { email: values.email, password: values.password };
          void run(action, data);
        }}
      >
        <fieldset disabled={busy} className="access-fields">
          {form === 'registro' && !code && (
            <>
              <label>
                Nombre
                <input
                  required
                  value={values.nombre}
                  onChange={(e) => change('nombre', e.target.value)}
                />
              </label>
              <label>
                Apellido
                <input
                  required
                  value={values.apellido}
                  onChange={(e) => change('apellido', e.target.value)}
                />
              </label>
            </>
          )}
          {!code && form !== 'nueva-password' && (
            <label>
              Email
              <input
                required
                type="email"
                autoComplete="username"
                value={values.email}
                onChange={(e) => change('email', e.target.value)}
              />
            </label>
          )}
          {!code && form !== 'recuperar' && (
            <label>
              Contraseña
              <input
                required
                type="password"
                minLength={form === 'ingresar' ? 1 : 12}
                maxLength={128}
                autoComplete={form === 'ingresar' ? 'current-password' : 'new-password'}
                value={values.password}
                onChange={(e) => change('password', e.target.value)}
              />
            </label>
          )}
          {code && (
            <label>
              Código de seis dígitos
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={values.codigo}
                onChange={(e) => change('codigo', e.target.value)}
              />
            </label>
          )}
          <div className="actions">
            <button type="submit">
              {busy
                ? 'Procesando…'
                : code
                  ? 'Verificar código'
                  : labels[form as keyof typeof labels]}
            </button>
          </div>
        </fieldset>
      </form>
      {code ? (
        <div className="actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              void run('reenviar-codigo', {});
            }}
          >
            Reenviar código
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              void run('salir', {});
            }}
          >
            Volver a ingresar
          </button>
        </div>
      ) : (
        <div className="actions">
          {['ingresar', 'registro', 'recuperar']
            .filter((x) => x !== form)
            .map((x) => (
              <button
                className="secondary"
                disabled={busy}
                key={x}
                onClick={() => {
                  setForm(x);
                  setError('');
                  setNotice('');
                  setValues((v) => ({ ...v, password: '', codigo: '' }));
                }}
              >
                {labels[x as keyof typeof labels]}
              </button>
            ))}
          {form === 'ingresar' && (
            <button
              className="secondary"
              disabled={busy || !values.email}
              onClick={() => {
                void run('reenviar-confirmacion', { email: values.email });
              }}
            >
              Reenviar confirmación
            </button>
          )}
        </div>
      )}
      {code && (
        <p className="note">
          Los reenvíos requieren esperar 60 segundos. Un código nuevo reemplaza al anterior.
        </p>
      )}
    </section>
  );
}
