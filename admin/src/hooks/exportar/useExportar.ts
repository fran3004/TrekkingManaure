import { useState, type ChangeEvent } from 'react';
import { countRunners, statusOrder, summarize, useReservas } from '../../../../shared/reservas';
import { contenidoLibro } from '../../data/exportar/libro';
import { plural } from '../../utils/comun/texto';
import { downloadBlob } from '../../utils/exportar/descarga';
import { crearLibroGestion } from '../../utils/exportar/libro/crearLibro';

export function useExportar() {
  const { registrations, today, capacity, occupied, paramo, fechaCierre } = useReservas();
  const [filter, setFilter] = useState('Todos');
  const [feedback, setFeedback] = useState('');
  const all = registrations.map((registration) => summarize(registration, today));
  const summaries = all.filter((summary) => filter === 'Todos' || summary.status === filter);
  const runners = countRunners(summaries.map((summary) => summary.registration));
  const payments = summaries.reduce(
    (sum, summary) => sum + summary.registration.payments.length,
    0,
  );

  function changeFilter(event: ChangeEvent<HTMLSelectElement>) {
    setFilter(event.target.value);
    setFeedback('');
  }

  function download() {
    const blob = crearLibroGestion({
      summaries,
      today,
      fechaCierre,
      filterLabel: filter,
      carrera: { capacity, occupied },
      paramo,
      pagina: {
        inscripciones: all.length,
        recaudado: all.reduce((sum, summary) => sum + summary.paid, 0),
        pagosPorRevisar: all.reduce((sum, summary) => sum + summary.pending.length, 0),
      },
    });
    downloadBlob('perija-gestion-' + today + '.xlsx', blob);
    setFeedback(
      'Se descargó el libro con ' +
        plural(summaries.length, 'inscripción', 'inscripciones') +
        '. Ábrelo en Excel: la hoja Cómo usar explica cómo agregar datos a mano.',
    );
  }

  return {
    sheets: contenidoLibro,
    sheetsLabel: contenidoLibro.length + ' hojas conectadas entre sí',
    filter,
    changeFilter,
    filterOptions: ['Todos', ...statusOrder],
    counts: [
      { label: 'Inscripciones', value: summaries.length },
      { label: 'Corredores', value: runners },
      { label: 'Pagos', value: payments },
    ],
    download,
    feedback,
  };
}
