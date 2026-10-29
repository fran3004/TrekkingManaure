import './Participantes.css';
import Icon from '../../../../shared/components/Icon';
import ParticipantTable from '../../components/participantes/ParticipantTable';
import { useParticipantes } from '../../hooks';

export default function Participantes() {
  const participantes = useParticipantes();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Cada caminante, en su lugar</span>
          <h1>
            Los <em>participantes</em>
          </h1>
          <p>Titulares, acompañantes, salud, estadía y estado de pago en una sola vista.</p>
        </div>
        <span className="admin-pill">{participantes.totalLabel}</span>
      </div>
      <article className="admin-panel">
        <div className="admin-filter-bar">
          <label className="admin-search">
            <Icon name="search" />
            <input
              aria-label="Buscar participante"
              value={participantes.search}
              onChange={participantes.changeSearch}
              placeholder="Nombre, documento, teléfono, ciudad o acompañante…"
            />
          </label>
          <div className="admin-filter-group">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={participantes.healthOnly}
                onChange={participantes.changeHealthOnly}
              />
              Con alertas de salud
            </label>
            <label className="admin-select-label">
              Estado
              <select value={participantes.status} onChange={participantes.changeStatus}>
                {participantes.statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <ParticipantTable rows={participantes.rows} empty={participantes.empty} />
        <div className="admin-panel-foot">
          <span>{participantes.resultLabel}</span>
          <span>Sincronizado con el servidor</span>
        </div>
      </article>
    </>
  );
}
