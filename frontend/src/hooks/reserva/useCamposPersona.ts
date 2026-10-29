import { useState, type ChangeEvent } from 'react';
import {
  documentRule,
  generos,
  limites,
  normalizarCorreo,
  normalizarDocumento,
  normalizarLugar,
  normalizarNombre,
  tallas,
  tiposDocumento,
  validateCityField,
  validateDocumentFormat,
  validateEmail,
  validateNameField,
  type DocumentType,
} from '../../../../shared/reservas';
import { todayInColombia } from '../../../../shared/utils/format';
import { fechasNacimientoPermitidas, fieldName } from '../../utils/reserva/formulario';
import { useCampoTexto } from './useCampoTexto';
import { opcionGuardada, useValorGuardado } from './useValorGuardado';

/** Tope del número de documento mientras no se elige el tipo (el campo está deshabilitado). */
const TOPE_SIN_TIPO = 20;

/**
 * Campos de una persona; prefijo '' = titular, 'acomp' = acompañante. Titular y acompañante
 * llenan exactamente los mismos campos; solo cambia el autocompletado del navegador.
 */
export function useCamposPersona(prefijo: string, onNacimiento?: (value: string) => void) {
  const titular = !prefijo;
  const id = (base: string) => fieldName(prefijo, base);
  // Lo recuperado del borrador, solo si sigue siendo una opción de la lista.
  const tipoGuardado = opcionGuardada(tiposDocumento, useValorGuardado(id('tipoDocumento')));
  const generoGuardado = opcionGuardada(generos, useValorGuardado(id('genero')));
  const tallaGuardada = opcionGuardada(tallas, useValorGuardado(id('talla')));
  const [tipoDocumento, setTipoDocumento] = useState(tipoGuardado as DocumentType | '');
  // El acompañante no usa el autocompletado del navegador: son datos de otra persona.
  const autoComplete = (valor: string) => (titular ? valor : 'off');
  const regla = tipoDocumento ? documentRule(tipoDocumento) : null;
  const quien = titular ? 'del participante' : 'del acompañante';

  const nombres = useCampoTexto({
    name: id('nombres'),
    tipo: 'nombre',
    max: limites.nombre.max,
    normalizar: normalizarNombre,
    validar: (valor) => validateNameField(valor, quien),
  });
  const apellidos = useCampoTexto({
    name: id('apellidos'),
    tipo: 'nombre',
    max: limites.nombre.max,
    normalizar: normalizarNombre,
    validar: (valor) => validateNameField(valor, quien),
  });
  const documento = useCampoTexto({
    name: id('documento'),
    tipo: regla && !regla.soloDigitos ? 'documentoAlfanumerico' : 'documentoNumerico',
    max: regla?.tope ?? TOPE_SIN_TIPO,
    normalizar: normalizarDocumento,
    validar: (valor) =>
      tipoDocumento ? validateDocumentFormat(tipoDocumento, valor, quien) : null,
  });
  const correo = useCampoTexto({
    name: id('correo'),
    tipo: 'correo',
    max: limites.correo.max,
    normalizar: normalizarCorreo,
    validar: (valor) => validateEmail(valor, quien),
  });
  const ciudad = useCampoTexto({
    name: id('ciudad'),
    tipo: 'lugar',
    max: limites.ciudad.max,
    normalizar: normalizarLugar,
    validar: (valor) => validateCityField(valor, quien),
  });

  return {
    quien,
    ids: {
      nombres: id('nombres'),
      apellidos: id('apellidos'),
      tipoDocumento: id('tipoDocumento'),
      documento: id('documento'),
      nacimiento: id('nacimiento'),
      genero: id('genero'),
      talla: id('talla'),
      correo: id('correo'),
      ciudad: id('ciudad'),
    },
    autoComplete: {
      nombres: autoComplete('given-name'),
      apellidos: autoComplete('family-name'),
      telefono: autoComplete('tel-national'),
      correo: autoComplete('email'),
      ciudad: autoComplete('address-level2'),
    },
    campos: { nombres, apellidos, documento, correo, ciudad },
    documento: {
      // Sin tipo elegido, el número queda deshabilitado: su formato y su tope dependen del tipo.
      disabled: !regla,
      placeholder: regla?.ayuda ?? 'Elige primero el tipo',
      inputMode: regla && !regla.soloDigitos ? ('text' as const) : ('numeric' as const),
    },
    cambiarTipo: (event: ChangeEvent<HTMLSelectElement>) =>
      setTipoDocumento(event.target.value as DocumentType),
    nacimiento: { ...fechasNacimientoPermitidas(todayInColombia()), onCambio: onNacimiento },
    guardado: { tipoDocumento: tipoGuardado, genero: generoGuardado, talla: tallaGuardada },
    tiposDocumento,
    generos,
    tallas,
  };
}
