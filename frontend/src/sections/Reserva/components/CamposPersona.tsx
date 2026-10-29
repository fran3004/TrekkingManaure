import { useCamposPersona } from '../../../hooks';
import CampoFecha from './CampoFecha';
import CampoTelefono from './CampoTelefono';
import CampoTexto from './CampoTexto';

type Props = {
  /** Prefijo de name/id: vacío para el inscrito, 'acomp' para el acompañante. */
  prefijo?: string;
  /** Texto añadido a cada etiqueta para distinguirlas, p. ej. ' del acompañante'. */
  sufijo?: string;
  conTalla?: boolean;
  /** Avisa la fecha de nacimiento elegida (el titular la usa para saber si es menor). */
  onNacimiento?: (value: string) => void;
};

export default function CamposPersona({
  prefijo = '',
  sufijo = '',
  conTalla = false,
  onNacimiento,
}: Props) {
  const view = useCamposPersona(prefijo, onNacimiento);
  const ids = view.ids;
  const req = <span className="req">*</span>;

  return (
    <>
      <CampoTexto
        id={ids.nombres}
        name={ids.nombres}
        etiqueta={'Nombres' + sufijo}
        campo={view.campos.nombres}
        placeholder="Nombres"
        autoComplete={view.autoComplete.nombres}
      />
      <CampoTexto
        id={ids.apellidos}
        name={ids.apellidos}
        etiqueta={'Apellidos' + sufijo}
        campo={view.campos.apellidos}
        placeholder="Apellidos"
        autoComplete={view.autoComplete.apellidos}
      />
      <div className="field">
        <label htmlFor={ids.tipoDocumento}>
          Tipo de documento{sufijo} {req}
        </label>
        <select
          id={ids.tipoDocumento}
          name={ids.tipoDocumento}
          required
          defaultValue={view.guardado.tipoDocumento}
          onChange={view.cambiarTipo}
        >
          <option value="" disabled>
            Selecciona
          </option>
          {view.tiposDocumento.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>
      <CampoTexto
        id={ids.documento}
        name={ids.documento}
        etiqueta={'Número de documento' + sufijo}
        campo={view.campos.documento}
        placeholder={view.documento.placeholder}
        inputMode={view.documento.inputMode}
        disabled={view.documento.disabled}
        contador={false}
      />
      <CampoFecha
        id={ids.nacimiento}
        name={ids.nacimiento}
        etiqueta={'Fecha de nacimiento' + sufijo}
        min={view.nacimiento.min}
        max={view.nacimiento.max}
        inicio={view.nacimiento.inicio}
        onCambio={view.nacimiento.onCambio}
      />
      <div className="field">
        <label htmlFor={ids.genero}>
          Género{sufijo} {req}
        </label>
        <select id={ids.genero} name={ids.genero} required defaultValue={view.guardado.genero}>
          <option value="" disabled>
            Selecciona
          </option>
          {view.generos.map((genero) => (
            <option key={genero} value={genero}>
              {genero}
            </option>
          ))}
        </select>
      </div>
      {conTalla && (
        <div className="field">
          <label htmlFor={ids.talla}>
            Talla de camisa{sufijo} {req}
          </label>
          <select id={ids.talla} name={ids.talla} required defaultValue={view.guardado.talla}>
            <option value="" disabled>
              Selecciona
            </option>
            {view.tallas.map((talla) => (
              <option key={talla} value={talla}>
                {talla}
              </option>
            ))}
          </select>
        </div>
      )}
      <CampoTelefono
        prefijo={prefijo}
        base="telefono"
        etiqueta="Celular / WhatsApp"
        sufijo={sufijo}
        tipo="movil"
        quien={view.quien}
        autoComplete={view.autoComplete.telefono}
      />
      <CampoTexto
        id={ids.correo}
        name={ids.correo}
        etiqueta={'Correo electrónico' + sufijo}
        campo={view.campos.correo}
        placeholder="nombre@correo.com"
        autoComplete={view.autoComplete.correo}
        inputMode="email"
      />
      <CampoTexto
        id={ids.ciudad}
        name={ids.ciudad}
        etiqueta={'Ciudad de residencia' + sufijo}
        campo={view.campos.ciudad}
        placeholder="Ciudad de residencia"
        autoComplete={view.autoComplete.ciudad}
      />
    </>
  );
}
