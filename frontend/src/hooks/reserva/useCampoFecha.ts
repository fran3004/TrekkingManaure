import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { isIsoDate } from '../../../../shared/reservas';
import { todayInColombia } from '../../../../shared/utils/format';
import { DIAS_SEMANA } from '../../data/calendario/dias';
import {
  RANGO_FECHAS,
  NOMBRES_MES,
  aniosPermitidos,
  construirMes,
  desplazarMes,
  errorFecha,
  isoATexto,
  limitarVista,
  mascaraFecha,
  mesesPermitidos,
  textoAIso,
  vistaDe,
  type VistaMes,
} from '../../utils/reserva/fecha';
import { formatBirth } from '../../utils/reserva/formulario';
import { classNames } from '../../utils/comun/classNames';
import { useValorGuardado } from './useValorGuardado';

type Options = {
  /** name del campo que viaja en el formulario (AAAA-MM-DD). */
  name: string;
  /** Si se indica, la fecha la lleva quien llama; si se omite, el campo guarda la suya. */
  valor?: string;
  min?: string;
  max?: string;
  /** Mes en que se abre el calendario mientras no hay fecha elegida; por defecto, el primero permitido. */
  inicio?: string;
  /** Avisa la fecha elegida (AAAA-MM-DD) o '' mientras lo escrito no es una fecha completa. */
  onCambio?: (iso: string) => void;
};

/**
 * Campo de fecha con calendario propio, en lugar del selector del navegador: se puede escribir
 * dd/mm/aaaa o elegir en un calendario con mes y año desplegables (útil para fechas de nacimiento).
 * El texto se valida contra el rango y el campo queda inválido mientras no cumpla, así el
 * formulario no avanza con una fecha imposible. El valor que se envía es AAAA-MM-DD.
 */
export function useCampoFecha({
  name,
  valor,
  min = RANGO_FECHAS.min,
  max = RANGO_FECHAS.max,
  inicio = '',
  onCambio,
}: Options) {
  const guardado = useValorGuardado(name);
  const [interno, setInterno] = useState(() => (isIsoDate(guardado) ? guardado : ''));
  const iso = valor ?? interno;
  const [texto, setTexto] = useState(() => isoATexto(iso));
  const [abierto, setAbierto] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [vista, setVista] = useState<VistaMes | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ocultoRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const error = errorFecha(texto, iso, min, max);
  const hoy = todayInColombia();

  // Si quien llama cambia la fecha (por ejemplo, la restaura o la limpia), el texto la sigue.
  useEffect(() => {
    setTexto((actual) => (textoAIso(actual) === iso ? actual : isoATexto(iso)));
  }, [iso]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(error ?? '');
  }, [error]);

  // El calendario se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (event: PointerEvent) => {
      if (!contenedorRef.current?.contains(event.target as Node)) setAbierto(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setAbierto(false);
      inputRef.current?.focus();
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  function cambiar(nueva: string) {
    if (valor === undefined) setInterno(nueva);
    onCambio?.(nueva);
  }

  function escribir(event: ChangeEvent<HTMLInputElement>) {
    const nuevoTexto = mascaraFecha(event.target.value);
    setTexto(nuevoTexto);
    cambiar(textoAIso(nuevoTexto));
  }

  function alternar() {
    if (!abierto) setVista(vistaDe(iso, inicio, min, max));
    setAbierto((estado) => !estado);
  }

  function elegir(dia: string) {
    setTexto(isoATexto(dia));
    cambiar(dia);
    setTocado(true);
    setAbierto(false);
    inputRef.current?.focus();
    // Elegir en el calendario no dispara un evento de campo: se avisa al formulario para que
    // revise los bloques y guarde el borrador igual que al escribir.
    window.requestAnimationFrame(() =>
      ocultoRef.current?.dispatchEvent(new Event('input', { bubbles: true })),
    );
  }

  const actual = limitarVista(vista ?? vistaDe(iso, inicio, min, max), min, max);
  const mes = construirMes(actual, min, max);
  const anios = aniosPermitidos(min, max);
  const primero = limitarVista(desplazarMes(actual, -1), min, max);
  const ultimo = limitarVista(desplazarMes(actual, 1), min, max);

  return {
    name,
    iso,
    texto,
    escribir,
    marcarTocado: () => setTocado(true),
    inputRef,
    ocultoRef,
    contenedorRef,
    popupId: name + '-calendario',
    // El error se muestra al salir del campo, no mientras se escribe.
    error: tocado ? error : null,
    boton: {
      abierto,
      alternar,
      ariaLabel: iso ? 'Cambiar fecha: ' + formatBirth(iso) : 'Abrir calendario',
    },
    calendario: {
      year: actual.year,
      month: actual.month,
      anios,
      meses: mesesPermitidos(actual.year, min, max).map((numero) => ({
        value: numero,
        label: NOMBRES_MES[numero - 1],
      })),
      cambiarAnio: (event: ChangeEvent<HTMLSelectElement>) =>
        setVista(limitarVista({ year: Number(event.target.value), month: actual.month }, min, max)),
      cambiarMes: (event: ChangeEvent<HTMLSelectElement>) =>
        setVista({ year: actual.year, month: Number(event.target.value) }),
      anterior: {
        deshabilitado: primero.year === actual.year && primero.month === actual.month,
        ir: () => setVista(primero),
      },
      siguiente: {
        deshabilitado: ultimo.year === actual.year && ultimo.month === actual.month,
        ir: () => setVista(ultimo),
      },
      diasSemana: DIAS_SEMANA,
      slots: mes.slots,
      dias: mes.days.map((dia) => ({
        iso: dia.iso,
        numero: dia.day,
        deshabilitado: dia.fuera,
        className: classNames(
          'fecha__dia',
          iso === dia.iso && 'is-selected',
          hoy === dia.iso && 'is-hoy',
        ),
        pressed: iso === dia.iso,
        ariaLabel: formatBirth(dia.iso),
        elegir: () => elegir(dia.iso),
      })),
    },
  };
}
