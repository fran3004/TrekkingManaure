import { usePerfilTemperatura } from '../../hooks';
import {
  ALTO,
  ANCHO,
  formatearAltura,
  formatearTemp,
} from '../../utils/seguridad/perfilTemperatura';
import './PerfilTemperatura.css';

export default function PerfilTemperatura() {
  const { perfil, paradas, activo, alMover, alSalir, distanciaKm, inicio, paramo, fuente } =
    usePerfilTemperatura();
  const etiquetaX = activo ? Math.min(ANCHO - 126, Math.max(62, activo.x - 56)) : 0;
  const etiquetaY = activo ? Math.max(4, activo.y - 64) : 0;

  return (
    <div className="perfil reveal">
      <div className="perfil__head">
        <div>
          <h3>Así baja la temperatura mientras subes</h3>
          <p>
            {distanciaKm} km de camino, de {formatearAltura(inicio.alturaM)} a{' '}
            {formatearAltura(paramo.alturaM)} sobre el nivel del mar.
          </p>
        </div>
        <div className="perfil__escala" aria-hidden="true">
          <span>{formatearTemp(inicio.tempC)}</span>
          <i />
          <span>{formatearTemp(paramo.tempC)}</span>
        </div>
      </div>

      <svg
        className="perfil__svg"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`Perfil del recorrido: sube de ${formatearAltura(inicio.alturaM)} y ${formatearTemp(inicio.tempC)} a ${formatearAltura(paramo.alturaM)} y ${formatearTemp(paramo.tempC)}`}
        onPointerMove={alMover}
        onPointerDown={alMover}
        onPointerLeave={alSalir}
      >
        {perfil.ejeAlturas.map((marca) => (
          <g key={marca.alturaM}>
            <line
              className="perfil__rejilla"
              x1={perfil.xIzq}
              x2={perfil.xDer}
              y1={marca.y}
              y2={marca.y}
            />
            <text className="perfil__eje" x={perfil.xIzq - 8} y={marca.y + 4} textAnchor="end">
              {formatearAltura(marca.alturaM)}
            </text>
          </g>
        ))}

        {perfil.segmentos.map((segmento, i) => (
          <path
            key={i}
            d={segmento.d}
            fill={segmento.color}
            stroke={segmento.color}
            strokeWidth="0.6"
            opacity="0.9"
          />
        ))}
        <path className="perfil__linea" d={`M${perfil.linea}`} />

        {perfil.ejeKm.map((marca) => (
          <text
            className="perfil__eje"
            key={marca.km}
            x={marca.x}
            y={perfil.base + 18}
            textAnchor="middle"
          >
            {marca.km}
          </text>
        ))}
        <text
          className="perfil__eje"
          x={(perfil.xIzq + perfil.xDer) / 2}
          y={ALTO - 4}
          textAnchor="middle"
        >
          kilómetros
        </text>

        {paradas.map(({ km, punto }) => (
          <g key={km}>
            <circle
              className="perfil__punto"
              cx={punto.x}
              cy={punto.y}
              r="5.5"
              fill={punto.color}
            />
            <text
              className="perfil__temp"
              x={punto.x}
              y={punto.y - 12}
              textAnchor={km === 0 ? 'start' : km === distanciaKm ? 'end' : 'middle'}
            >
              {formatearTemp(punto.tempC)}
            </text>
          </g>
        ))}

        {activo && (
          <g pointerEvents="none">
            <line
              className="perfil__guia"
              x1={activo.x}
              x2={activo.x}
              y1={activo.y}
              y2={perfil.base}
            />
            <circle
              className="perfil__punto"
              cx={activo.x}
              cy={activo.y}
              r="6.5"
              fill={activo.color}
            />
            <rect
              className="perfil__tip"
              x={etiquetaX}
              y={etiquetaY}
              width="112"
              height="46"
              rx="8"
            />
            <text className="perfil__tip-t" x={etiquetaX + 10} y={etiquetaY + 18}>
              Km {activo.km.toFixed(1).replace('.', ',')} · {formatearTemp(activo.tempC)}
            </text>
            <text className="perfil__tip-s" x={etiquetaX + 10} y={etiquetaY + 35}>
              {formatearAltura(activo.alturaM)} s. n. m.
            </text>
          </g>
        )}
      </svg>

      <div className="perfil__paradas">
        {paradas.map(({ km, nombre, ropa, punto }) => (
          <div className="parada" key={km}>
            <small>Km {km}</small>
            <strong>{nombre}</strong>
            <span className="parada__temp">{formatearTemp(punto.tempC)}</span>
            <span className="parada__alt">{formatearAltura(punto.alturaM)} s. n. m.</span>
            <p>{ropa}</p>
            <i style={{ background: punto.color }} />
          </div>
        ))}
      </div>

      <p className="perfil__nota">
        Inicio: {inicio.rotulo.toLowerCase()}. Páramo: {paramo.rotulo.toLowerCase()}. Entre los dos
        puntos es una estimación según la altura. Fuente: {fuente}.
      </p>
    </div>
  );
}
