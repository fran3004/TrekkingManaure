import './Exportar.css';
import Icon from '../../../../shared/components/Icon';
import { useExportar } from '../../hooks';

export default function Exportar() {
  const exportar = useExportar();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Información para organizar mejor</span>
          <h1>
            Exportar <em>información</em>
          </h1>
          <p>Un libro de Excel con tablero, fórmulas, filtros y gráficos listos para trabajar.</p>
        </div>
      </div>
      <div className="admin-export-grid">
        <article className="admin-panel admin-export">
          <span className="feature__icon">
            <Icon name="sheet" />
          </span>
          <h2>Libro de gestión</h2>
          <p>
            Todo se calcula con fórmulas de Excel y trae filas amarillas para agregar inscripciones
            y pagos a mano, con listas desplegables, ayudas y una columna que avisa si falta algo.
          </p>
          <label htmlFor="export-filter">Inscripciones a incluir</label>
          <select id="export-filter" value={exportar.filter} onChange={exportar.changeFilter}>
            {exportar.filterOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <div className="admin-export-summary">
            {exportar.counts.map((count) => (
              <span key={count.label}>
                {count.label}
                <strong>{count.value}</strong>
              </span>
            ))}
          </div>
          <button className="btn btn--primary btn--block" onClick={exportar.download}>
            <Icon name="sheet" /> Descargar Excel (.xlsx)
          </button>
          <p className="admin-notice">
            El libro incluye todas las reservas registradas en el servidor, sin importar desde qué
            equipo se hicieron. Lo que agregues en Excel no cambia la página.
          </p>
          <p role="status" className="admin-feedback">
            {exportar.feedback}
          </p>
        </article>
        <article className="admin-panel admin-export-sheets">
          <div className="admin-panel-head">
            <div>
              <h2>Qué trae el libro</h2>
              <p>{exportar.sheetsLabel}</p>
            </div>
            <span className="admin-pill">.xlsx</span>
          </div>
          <ol>
            {exportar.sheets.map((sheet) => (
              <li key={sheet.hoja}>
                <strong>{sheet.hoja}</strong>
                <span>{sheet.descripcion}</span>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </>
  );
}
