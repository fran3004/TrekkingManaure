import './Login.css';
import Brand from '../../../../shared/components/Brand';
import Icon from '../../../../shared/components/Icon';
import { evento } from '../../../../shared/config';
import { useLogin } from '../../hooks';

export default function Login() {
  const login = useLogin();
  const { error: correoError, ...correo } = login.correo;
  const { error: claveError, ...clave } = login.clave;

  return (
    <main className="admin-access">
      <section className="admin-access__form">
        <a href="/" aria-label="Ir al sitio del evento">
          <Brand />
        </a>
        <span className="eyebrow">Detrás de una gran experiencia</span>
        <h1>
          El equipo que
          <br />
          hace posible <em>el desafío</em>
        </h1>
        <p>
          Un espacio para organizar a los participantes, acompañar cada reserva y preparar el
          camino.
        </p>
        <form className="admin-access__fields" onSubmit={login.enviar} noValidate>
          <label htmlFor="admin-correo">Correo administrativo</label>
          <input
            {...correo}
            type="email"
            name="correo"
            autoComplete="username"
            inputMode="email"
            placeholder="nombre@dominio.com"
            required
          />
          {correoError && (
            <small className="admin-access__error" id="admin-correo-error">
              {correoError}
            </small>
          )}

          <label htmlFor="admin-clave">Contraseña</label>
          <div className="admin-access__password">
            <input
              {...clave}
              name="clave"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
            />
            <button
              type="button"
              onClick={login.alternarClave}
              aria-pressed={login.mostrarClave}
              aria-controls="admin-clave"
            >
              {login.mostrarClave ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {claveError ? (
            <small className="admin-access__error" id="admin-clave-error">
              {claveError}
            </small>
          ) : (
            <small className="admin-access__hint">{login.claveAyuda}</small>
          )}

          <label className="admin-access__remember">
            <input type="checkbox" checked={login.recordar} onChange={login.cambiarRecordar} />
            Mantener la sesión iniciada en este equipo
          </label>

          <p className="admin-access__alert" role="alert" aria-live="assertive">
            {login.error}
          </p>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={login.pendiente}
            aria-busy={login.pendiente}
          >
            {login.pendiente ? 'Ingresando…' : 'Ingresar al panel'} <Icon name="arrow" />
          </button>
        </form>
        <small className="admin-access__note">
          <Icon name="lock" /> Acceso reservado a la organización. Tu sesión se cierra sola al pasar
          el tiempo.
        </small>
      </section>
      <section className="admin-access__art" aria-label={evento.nombre}>
        <div className="admin-access__mountain">
          <Icon name="mountain" />
        </div>
        <span>ORGANIZAR · ACOMPAÑAR · CONECTAR</span>
        <h2>
          Desafío
          <br />
          <span className="brush">Perijá</span>
          <br />
          <em>{evento.distanciaKm}K</em>
        </h2>
        <p>{evento.lugar.split(', ').join(' · ')}</p>
      </section>
    </main>
  );
}
