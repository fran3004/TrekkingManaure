import Icon from '../../../../../shared/components/Icon';
import { useContadorCupos } from '../../../hooks';
import CuentaRegresiva from '../CuentaRegresiva';
import './ContadorCupos.css';

export default function ContadorCupos() {
  const counter = useContadorCupos();

  return (
    <aside className="cupo-card reveal" aria-label="Cupos de la carrera">
      <div className="cupo-card__head">
        <span className="cupo-card__label">Cupos de la carrera</span>
        <span className="cupo-card__live">
          <i className="dot-live" /> {counter.status}
        </span>
      </div>
      <div className="cupo-card__number">
        {counter.available}
        <small>de {counter.capacity} cupos</small>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-label="Ocupación de los cupos"
        aria-valuemin={0}
        aria-valuemax={counter.capacity}
        aria-valuenow={counter.occupied}
      >
        <div className="bar__fill" style={counter.barStyle} />
      </div>
      <div className="cupo-card__foot">
        <span>Confirmados</span>
        <span>
          {counter.occupied} de {counter.capacity} cupos
        </span>
      </div>
      <div className="cupo-card__note">
        <Icon name="info" />
        <span>{counter.nota}</span>
      </div>
      <CuentaRegresiva />
    </aside>
  );
}
