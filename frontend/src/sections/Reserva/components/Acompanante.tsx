import { useAcompanante } from '../../../hooks';
import CamposPersona from './CamposPersona';
import DatosSeguridad from './DatosSeguridad';

type Props = {
  companion: boolean;
  onCompanion: (value: boolean) => void;
  kit: boolean | null;
  onKit: (value: boolean | null) => void;
  paramoAgotado: boolean;
};

export default function Acompanante(props: Props) {
  const view = useAcompanante(props);

  return (
    <div className="form-block">
      <div className="form-block__head">
        <span className="form-block__n">4</span>
        <div>
          <h3>Acompañante</h3>
          <small>
            Opcional. Máximo uno. Se le piden los mismos datos que a ti; la talla solo si compra
            kit.
          </small>
        </div>
      </div>
      <div className="toggle-line companion-toggle">
        <div className="toggle-line__text">
          <strong>Llevo acompañante</strong>
          <small>{view.priceText}</small>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            aria-label="Llevo acompañante"
            checked={view.companion}
            onChange={view.toggleCompanion}
          />
          <span className="switch__track" />
        </label>
      </div>
      {view.companion && (
        <div className="fields companion-fields is-open">
          <div className="field field--full">
            <span className="field__label" id="acompKit-label">
              ¿El acompañante comprará kit? <span className="req">*</span>
            </span>
            <div className="choice-grid" role="radiogroup" aria-labelledby="acompKit-label">
              {view.kitOptions.map((option) => (
                <label className="choice" key={option.title}>
                  <input
                    type="radio"
                    name="acompKit"
                    value={option.title}
                    required
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
          {view.showPerson && (
            <>
              <CamposPersona prefijo="acomp" sufijo=" del acompañante" conTalla={view.withSize} />
              <DatosSeguridad prefijo="acomp" sufijo=" del acompañante" />
              <div className="field field--full">
                <label htmlFor="acompEstadia">
                  Estadía del acompañante <span className="req">*</span>
                </label>
                <select
                  id="acompEstadia"
                  name="acompEstadia"
                  required
                  defaultValue={view.stayGuardada}
                >
                  <option value="" disabled>
                    Selecciona
                  </option>
                  {view.stays.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
