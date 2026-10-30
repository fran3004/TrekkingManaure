import { evento } from '../../../../../shared/config';
import { dxfLibro, estilosLibro } from '../../../data/exportar/libro';
import { buildXlsx } from '../xlsx/paquete';
import { crearBuscar } from './buscar';
import type { LibroContexto } from './comun';
import { crearConfiguracion } from './configuracion';
import { crearCorredores } from './corredores';
import { crearGuia } from './guia';
import { crearInscripciones } from './inscripciones';
import { crearListas } from './listas';
import { crearPagos } from './pagos';
import { crearResumen } from './resumen';

// Libro de gestión: datos, fórmulas, tablas, filtros, formatos, gráficos y filas para registrar a mano.
export function crearLibroGestion(contexto: LibroContexto) {
  const configuracion = crearConfiguracion(contexto);
  const listas = crearListas();

  return buildXlsx({
    title: evento.nombre + ' · Gestión',
    styles: estilosLibro,
    dxfs: dxfLibro,
    sheets: [
      crearResumen(contexto).sheet,
      crearGuia(contexto).sheet,
      crearBuscar(contexto).sheet,
      crearInscripciones(contexto).sheet,
      crearPagos(contexto).sheet,
      crearCorredores(contexto).sheet,
      configuracion.sheet,
      listas.sheet,
    ],
    names: [
      ...configuracion.names,
      ...listas.names,
      // Columnas de tabla con nombre: crecen solas cuando se agregan filas a la tabla.
      { name: 'ListaCodigos', ref: 'Inscripciones[Código]' },
      { name: 'DocumentosInscripciones', ref: 'Inscripciones[Documento]' },
    ],
  });
}
