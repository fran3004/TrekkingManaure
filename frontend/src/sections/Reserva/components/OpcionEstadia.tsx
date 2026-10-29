import { useOpcionEstadia } from '../../../hooks';
import type { Estadia } from '../../../types/reserva';

type Props = {
  stay: Estadia;
  onStay: (value: Estadia) => void;
  paramoAgotado: boolean;
};

export default function OpcionEstadia(props: Props) {
  const view = useOpcionEstadia(props);

  return (
    <div className="form-block">
      <div className="form-block__head">
        <span className="form-block__n">3</span>
        <div>
          <h3>Opción de estadía</h3>
          <small>Elige dónde pasas la noche. Solo el páramo tiene cupos limitados.</small>
        </div>
      </div>
      {view.avisoParamo && (
        <p className="form-aviso" role="status">
          {view.avisoParamo}
        </p>
      )}
      <div className="choice-grid" role="radiogroup" aria-label="Opción de estadía">
        {view.stays.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name="estadia"
              value={option.value}
              required
              disabled={option.disabled}
              {...option.input}
            />
            <span className="choice__dot" />
            <span className="choice__text">
              <strong>{option.title}</strong>
              <small>{option.text}</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
