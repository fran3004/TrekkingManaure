import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import type { CampoTexto as Campo } from '../../../hooks';

type Props = {
  id: string;
  name: string;
  etiqueta: ReactNode;
  campo: Campo;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  disabled?: boolean;
  /** Muestra «n/máximo» bajo el campo. */
  contador?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
};

/** Campo de texto del formulario con contador y aviso al salir del campo (ver useCampoTexto). */
export default function CampoTexto({
  id,
  name,
  etiqueta,
  campo,
  placeholder,
  autoComplete = 'off',
  inputMode,
  disabled,
  contador = true,
  type = 'text',
}: Props) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {etiqueta} <span className="req">*</span>
      </label>
      <input
        id={id}
        name={name}
        ref={campo.inputRef}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize="off"
        spellCheck={false}
        maxLength={campo.max}
        disabled={disabled}
        value={campo.valor}
        onChange={campo.escribir}
        onBlur={campo.marcarTocado}
      />
      {(campo.error || contador) && (
        <div className="field-meta">
          {campo.error && (
            <small className="field-error" role="alert">
              {campo.error}
            </small>
          )}
          {contador && <small className="field-count">{campo.contador}</small>}
        </div>
      )}
    </div>
  );
}
