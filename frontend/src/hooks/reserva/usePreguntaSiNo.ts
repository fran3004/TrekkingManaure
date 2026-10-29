import { useEffect, useRef, useState } from 'react';
import { RESPUESTAS_SI_NO } from '../../data/reserva/opciones';
import { opcionDesmarcable } from '../../utils/comun/opcionDesmarcable';
import { fieldName } from '../../utils/reserva/formulario';
import { opcionGuardada, useValorGuardado } from './useValorGuardado';

/**
 * Pregunta Sí/No: name=base guarda la respuesta y name=baseCual el detalle si responde Sí.
 * Con `exigeSi`, responder No deja el campo inválido con ese mensaje: el formulario no avanza.
 */
export function usePreguntaSiNo(prefijo: string, base: string, detalle?: string, exigeSi?: string) {
  const name = fieldName(prefijo, base);
  const detailName = fieldName(prefijo, base + 'Cual');
  const [answer, setAnswer] = useState(opcionGuardada(RESPUESTAS_SI_NO, useValorGuardado(name)));
  const detailSaved = useValorGuardado(detailName);
  const noRef = useRef<HTMLInputElement>(null);
  const rechazada = Boolean(exigeSi) && answer === 'No';

  useEffect(() => {
    noRef.current?.setCustomValidity(rechazada && exigeSi ? exigeSi : '');
  }, [rechazada, exigeSi]);

  return {
    name,
    labelId: name + '-label',
    detailName,
    detailSaved,
    options: RESPUESTAS_SI_NO.map((option) => ({
      value: option,
      ref: option === 'No' ? noRef : undefined,
      input: opcionDesmarcable<string>(answer, option, setAnswer, ''),
    })),
    showDetail: Boolean(detalle) && answer === 'Sí',
    aviso: rechazada ? exigeSi : null,
  };
}
