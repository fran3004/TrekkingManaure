import type { PreEventHotel } from '../../../../../shared/reservas';
import { useExtrasReserva } from '../../../hooks';
import type { Extra, HotelFormulario } from '../../../types/reserva';
import CampoFecha from './CampoFecha';

type Props = {
  extras: Extra[];
  onExtras: (value: Extra) => void;
  companion: boolean;
  hotel: HotelFormulario;
  onHotel: (cambios: Partial<HotelFormulario>) => void;
  hotelCotizable: PreEventHotel | null;
  today: string;
};

/** Extras y hotel previo: van después del acompañante porque dependen de si lo lleva. */
export default function ExtrasReserva(props: Props) {
  const view = useExtrasReserva(props);
  const hotel = view.hotel;

  return (
    <div className="form-block">
      <div className="form-block__head">
        <span className="form-block__n">5</span>
        <div>
          <h3>Extras</h3>
          <small>Opcionales. Las actividades incluyen merienda.</small>
        </div>
      </div>
      <div className="extra-choices">
        {view.extras.map((extra) => (
          <label className="mini-choice" key={extra.id}>
            <input type="checkbox" checked={extra.checked} onChange={extra.toggle} />
            <span className="mini-choice__text">
              <strong>{extra.title}</strong>
              <small>{extra.text}</small>
            </span>
            <span className="mini-choice__price">{extra.price}</span>
          </label>
        ))}
        {hotel.disponible && (
          <label className="mini-choice">
            <input type="checkbox" checked={hotel.activo} onChange={hotel.alternar} />
            <span className="mini-choice__text">
              <strong>Llegar antes: hotel previo al evento</strong>
              <small>{hotel.texto}</small>
            </span>
            <span className="mini-choice__price">{hotel.precio}</span>
          </label>
        )}
      </div>
      {hotel.activo && (
        <div className="fields hotel-fields">
          <CampoFecha
            id="hotelLlegada"
            name="hotelLlegada"
            etiqueta="Llegada al hotel"
            {...hotel.llegada}
          />
          <CampoFecha
            id="hotelSalida"
            name="hotelSalida"
            etiqueta="Salida del hotel"
            {...hotel.salida}
          />
          {hotel.conAcompanante && (
            <label className="mini-choice field--full">
              <input type="checkbox" {...hotel.conAcompanante} />
              <span className="mini-choice__text">
                <strong>Mi acompañante también llega antes</strong>
                <small>Se cobran las mismas noches para él o ella.</small>
              </span>
            </label>
          )}
          <p className="field-hint field--full" role="status">
            {hotel.calculo}
          </p>
        </div>
      )}
    </div>
  );
}
