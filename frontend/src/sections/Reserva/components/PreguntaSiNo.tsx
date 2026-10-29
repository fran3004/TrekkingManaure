import { usePreguntaSiNo } from '../../../hooks';

type Props = {
  prefijo: string;
  /** Base del campo: genera name=base ('Sí'/'No') y name=baseCual (detalle). */
  base: string;
  pregunta: string;
  /** Si se indica, al responder Sí se pide el detalle con esta etiqueta. */
  detalle?: string;
  /** Si se indica, responder No bloquea el formulario y muestra este mensaje. */
  exigeSi?: string;
};

export default function PreguntaSiNo({ prefijo, base, pregunta, detalle, exigeSi }: Props) {
  const view = usePreguntaSiNo(prefijo, base, detalle, exigeSi);

  return (
    <div className="field field--full">
      <span className="field__label" id={view.labelId}>
        {pregunta} <span className="req">*</span>
      </span>
      <div className="choice-grid" role="radiogroup" aria-labelledby={view.labelId}>
        {view.options.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name={view.name}
              value={option.value}
              required
              ref={option.ref}
              {...option.input}
            />
            <span className="choice__dot" />
            <span className="choice__text">
              <strong>{option.value}</strong>
            </span>
          </label>
        ))}
      </div>
      {view.showDetail && (
        <input
          id={view.detailName}
          name={view.detailName}
          defaultValue={view.detailSaved}
          required
          minLength={2}
          aria-label={detalle}
          placeholder={detalle}
          maxLength={200}
        />
      )}
      {view.aviso && (
        <small className="field-error" role="alert">
          {view.aviso}
        </small>
      )}
    </div>
  );
}
