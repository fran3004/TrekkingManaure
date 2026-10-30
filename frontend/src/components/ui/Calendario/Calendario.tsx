import Icon from '../../../../../shared/components/Icon';
import { useCalendario } from '../../../hooks';

type Props = {
  selected: string;
  onSelect: (value: string) => void;
  /** Texto accesible y del mensaje de selección, p. ej. 'el saldo del kit'. */
  concepto?: string;
};

export default function Calendario({ selected, onSelect, concepto = 'el saldo' }: Props) {
  const calendar = useCalendario({ selected, onSelect, concepto });

  return (
    <>
      <div className="cal-wrap is-unlocked">
        <div className="cal-head">
          <strong>Elige una fecha</strong>
          <small>Plazo hasta el {calendar.deadline}</small>
        </div>
        {calendar.months.map((month) => (
          <div key={month.key}>
            <p className="cal-month">{month.label}</p>
            <div className="cal-grid" role="group" aria-label={month.ariaLabel}>
              {calendar.weekdays.map((day) => (
                <div className="cal-dow" key={day}>
                  {day}
                </div>
              ))}
              {month.slots.map((slot) => (
                // Celda de alineación: ocupa su columna pero no se ve.
                <div className="cal-slot" key={slot} aria-hidden="true" />
              ))}
              {month.days.map((day) => (
                <button
                  key={day.iso}
                  type="button"
                  className={day.className}
                  aria-pressed={day.pressed}
                  aria-label={day.ariaLabel}
                  onClick={day.select}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="cal-legend">
          <span>
            <i className="legend-payment" />
            Tu fecha de pago
          </span>
        </div>
      </div>
      {calendar.selectedText && (
        <div className="selected-date is-visible" role="status">
          <Icon name="calendar" />
          <span>{calendar.selectedText}</span>
        </div>
      )}
    </>
  );
}
