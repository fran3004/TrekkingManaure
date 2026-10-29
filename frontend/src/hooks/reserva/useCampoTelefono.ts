import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  PAIS_PREDETERMINADO,
  detectCountry,
  digitsOnly,
  getCountry,
  normalizeNumber,
  paises,
  validatePhone,
  type CountryCode,
  type TipoTelefono,
} from '../../../../shared/reservas';
import { bandera } from '../../utils/reserva/bandera';
import { fieldName } from '../../utils/reserva/formulario';
import { useValorGuardado } from './useValorGuardado';

type Options = {
  prefijo: string;
  /** Base del name: genera name=base (número) y name=basePais (código ISO del país). */
  base: string;
  tipo: TipoTelefono;
  /** Para el mensaje de error, p. ej. 'del participante'. */
  quien: string;
};

/**
 * Teléfono con selector de país. Si se escribe el indicativo con + (o 00), el país cambia solo
 * y el indicativo sale del campo. El campo queda inválido mientras el número no cumpla las
 * reglas del país, así el formulario no avanza con un teléfono imposible.
 */
export function useCampoTelefono({ prefijo, base, tipo, quien }: Options) {
  const name = fieldName(prefijo, base);
  const paisGuardado = useValorGuardado(name + 'Pais');
  const numeroGuardado = useValorGuardado(name);
  const [pais, setPais] = useState<CountryCode>(
    () => getCountry(paisGuardado)?.iso ?? PAIS_PREDETERMINADO,
  );
  const [valor, setValor] = useState(() => digitsOnly(numeroGuardado));
  const [abierto, setAbierto] = useState(false);
  const [tocado, setTocado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const actual = getCountry(pais) ?? paises[0];
  const error = valor
    ? validatePhone({ country: pais, number: normalizeNumber(pais, valor) }, tipo, quien)
    : null;

  useEffect(() => {
    inputRef.current?.setCustomValidity(error ?? '');
  }, [error]);

  // La lista se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (event: PointerEvent) => {
      if (!contenedorRef.current?.contains(event.target as Node)) setAbierto(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  function escribir(event: ChangeEvent<HTMLInputElement>) {
    // Solo dígitos; el «+» solo vale al inicio, para escribir el indicativo (+57). Al pegar
    // «+57 300 123 4567» se quitan los espacios y se detecta el país.
    const texto = event.target.value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    const deteccion = detectCountry(texto);
    if (deteccion.estado === 'detectado') {
      setPais(deteccion.country);
      setValor(deteccion.rest);
      return;
    }
    setValor(texto);
  }

  function elegir(iso: CountryCode) {
    setPais(iso);
    setAbierto(false);
    inputRef.current?.focus();
  }

  return {
    name,
    paisName: fieldName(prefijo, base + 'Pais'),
    listaId: name + '-paises',
    pais,
    valor,
    escribir,
    marcarTocado: () => setTocado(true),
    inputRef,
    contenedorRef,
    placeholder: actual.ejemplo,
    boton: {
      bandera: bandera(actual.iso),
      indicativo: '+' + actual.indicativo,
      ariaLabel: 'País del teléfono: ' + actual.nombre + ' +' + actual.indicativo,
      abierto,
      alternar: () => setAbierto((estado) => !estado),
    },
    opciones: paises.map((opcion) => ({
      iso: opcion.iso,
      nombre: opcion.nombre,
      indicativo: '+' + opcion.indicativo,
      bandera: bandera(opcion.iso),
      seleccionado: opcion.iso === pais,
      elegir: () => elegir(opcion.iso),
    })),
    // El error se muestra al salir del campo, no mientras se escribe.
    error: tocado ? error : null,
  };
}
