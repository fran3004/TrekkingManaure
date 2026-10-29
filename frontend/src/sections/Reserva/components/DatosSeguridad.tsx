import { useDatosSeguridad } from '../../../hooks';
import CampoTelefono from './CampoTelefono';
import CampoTexto from './CampoTexto';
import FichaSalud from './FichaSalud';
import PreguntaSiNo from './PreguntaSiNo';

type Props = {
  /** Prefijo de name/id: vacío para el inscrito, 'acomp' para el acompañante. */
  prefijo?: string;
  /** Texto añadido a las etiquetas, p. ej. ' del acompañante'. */
  sufijo?: string;
  /** El titular es menor de edad: el contacto es su responsable legal. */
  responsable?: boolean;
};

/** EPS, contacto de emergencia, ficha de salud y compromisos: iguales para ambas personas. */
export default function DatosSeguridad({ prefijo = '', sufijo = '', responsable = false }: Props) {
  const view = useDatosSeguridad(prefijo, responsable);
  const ids = view.ids;
  const req = <span className="req">*</span>;

  return (
    <>
      <div className="field">
        <label htmlFor={ids.eps}>
          EPS{sufijo} {req}
        </label>
        <select
          id={ids.eps}
          name={ids.eps}
          required
          value={view.entidad}
          onChange={view.cambiarEntidad}
        >
          <option value="" disabled>
            Selecciona
          </option>
          {view.eps.map((entidad) => (
            <option key={entidad} value={entidad}>
              {entidad}
            </option>
          ))}
        </select>
      </div>
      {view.mostrarOtra && (
        <CampoTexto
          id={ids.epsOtra}
          name={ids.epsOtra}
          etiqueta={'¿Cuál EPS?' + sufijo}
          campo={view.campos.epsOtra}
          placeholder="Nombre de la EPS"
        />
      )}

      <div className="field field--full field-group">
        <strong className="field-group__title">
          {view.contacto.titulo}
          {sufijo}
        </strong>
        <small className="field-hint">{view.contacto.ayuda}</small>
      </div>
      <CampoTexto
        id={ids.emergenciaNombre}
        name={ids.emergenciaNombre}
        etiqueta="Nombre completo"
        campo={view.campos.contactoNombre}
        placeholder="Nombres y apellidos"
      />
      <CampoTelefono
        prefijo={prefijo}
        base="emergenciaTelefono"
        etiqueta="Número de teléfono"
        tipo="cualquiera"
        quien={view.contacto.quien}
      />
      <div className="field">
        <label htmlFor={ids.emergenciaParentesco}>Parentesco {req}</label>
        <select
          id={ids.emergenciaParentesco}
          name={ids.emergenciaParentesco}
          required
          value={view.parentesco}
          onChange={view.cambiarParentesco}
        >
          <option value="" disabled>
            Selecciona
          </option>
          {view.parentescos.map((parentesco) => (
            <option key={parentesco} value={parentesco}>
              {parentesco}
            </option>
          ))}
        </select>
      </div>

      <FichaSalud prefijo={prefijo} />
      {view.compromisos.map((compromiso) => (
        <PreguntaSiNo
          key={compromiso.base}
          prefijo={prefijo}
          base={compromiso.base}
          pregunta={compromiso.pregunta}
          exigeSi={compromiso.exigeSi}
        />
      ))}
    </>
  );
}
