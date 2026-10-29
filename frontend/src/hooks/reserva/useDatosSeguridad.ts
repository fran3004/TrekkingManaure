import { useState, type ChangeEvent } from 'react';
import {
  EPS_OTRA,
  eps,
  limites,
  normalizarLugar,
  normalizarNombre,
  parentescos,
  parentescosResponsable,
  validateContactNameField,
  validateEpsOtherField,
} from '../../../../shared/reservas';
import { COMPROMISOS } from '../../data/reserva/formulario';
import { fieldName } from '../../utils/reserva/formulario';
import { useCampoTexto } from './useCampoTexto';
import { opcionGuardada, useValorGuardado } from './useValorGuardado';

/**
 * EPS, contacto de emergencia, salud y compromisos de una persona. Si `responsable` es true
 * (titular menor de edad), el contacto es su responsable legal y solo admite madre, padre o
 * tutor.
 */
export function useDatosSeguridad(prefijo: string, responsable: boolean) {
  const id = (base: string) => fieldName(prefijo, base);
  const [entidad, setEntidad] = useState(opcionGuardada(eps, useValorGuardado(id('eps'))));
  const [parentesco, setParentesco] = useState(
    opcionGuardada(parentescos, useValorGuardado(id('emergenciaParentesco'))),
  );
  const opcionesParentesco: readonly string[] = responsable ? parentescosResponsable : parentescos;
  const quien = prefijo ? 'del acompañante' : 'del participante';

  const epsOtra = useCampoTexto({
    name: id('epsOtra'),
    tipo: 'epsOtra',
    max: limites.epsOtra.max,
    normalizar: normalizarLugar,
    validar: (valor) => validateEpsOtherField(valor, quien),
  });
  const contactoNombre = useCampoTexto({
    name: id('emergenciaNombre'),
    tipo: 'nombre',
    max: limites.contacto.max,
    normalizar: normalizarNombre,
    validar: (valor) => validateContactNameField(valor, quien),
  });

  return {
    ids: {
      eps: id('eps'),
      epsOtra: id('epsOtra'),
      emergenciaNombre: id('emergenciaNombre'),
      emergenciaParentesco: id('emergenciaParentesco'),
    },
    eps,
    entidad,
    cambiarEntidad: (event: ChangeEvent<HTMLSelectElement>) => setEntidad(event.target.value),
    mostrarOtra: entidad === EPS_OTRA,
    campos: { epsOtra, contactoNombre },
    contacto: {
      titulo: responsable ? 'Responsable legal' : 'Contacto en caso de emergencia',
      ayuda: responsable
        ? 'Madre, padre o tutor legal del participante menor de edad. Debe ser alguien que no viaja al evento.'
        : 'Una persona que no viaja al evento y a quien podamos llamar si algo pasa.',
      quien: 'del contacto de emergencia ' + quien,
    },
    // Si la lista cambia (el titular pasa a ser menor) y el parentesco ya no aplica, se vacía.
    parentesco: opcionesParentesco.includes(parentesco) ? parentesco : '',
    cambiarParentesco: (event: ChangeEvent<HTMLSelectElement>) => setParentesco(event.target.value),
    parentescos: opcionesParentesco,
    compromisos: COMPROMISOS,
  };
}
