import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { limpiarEntrada, type TipoEntrada } from '../../utils/reserva/entrada';
import { useValorGuardado } from './useValorGuardado';

type Options = {
  /** name del campo: con él se recupera lo guardado en el borrador. */
  name: string;
  tipo: TipoEntrada;
  /** Tope de caracteres al escribir; también es el máximo de la regla. */
  max: number;
  /** La misma normalización que se aplica al guardar: el contador y la regla miden su resultado. */
  normalizar: (valor: string) => string;
  /** Mensaje de error del valor ya normalizado, o null si es válido. */
  validar: (valorNormalizado: string) => string | null;
};

/**
 * Campo de texto con límites al escribir: limpia lo que se escribe o se pega (mayúsculas, solo los
 * caracteres permitidos), respeta el tope, cuenta los caracteres y avisa del error al salir del
 * campo con el mismo validador que usa el envío. El campo queda inválido mientras la regla no se
 * cumpla, así el formulario no avanza con un dato imposible. Vacío no es un error: lo pide `required`.
 */
export function useCampoTexto({ name, tipo, max, normalizar, validar }: Options) {
  const guardado = useValorGuardado(name);
  const [valor, setValor] = useState(() => limpiarEntrada(tipo, guardado).slice(0, max));
  const [tocado, setTocado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizado = normalizar(valor);
  const error = valor ? validar(normalizado) : null;

  useEffect(() => {
    inputRef.current?.setCustomValidity(error ?? '');
  }, [error]);

  // Si cambia lo que admite el campo (por ejemplo, el tipo de documento), se limpia lo ya escrito.
  useEffect(() => {
    setValor((actual) => limpiarEntrada(tipo, actual).slice(0, max));
  }, [tipo, max]);

  function escribir(event: ChangeEvent<HTMLInputElement>) {
    const campo = event.target;
    const bruto = campo.value;
    const posicion = campo.selectionStart ?? bruto.length;
    const limpio = limpiarEntrada(tipo, bruto).slice(0, max);
    setValor(limpio);
    // Al cambiar el texto el cursor saltaría al final: se deja donde estaba.
    const nueva = Math.max(0, posicion + limpio.length - bruto.length);
    window.requestAnimationFrame(() => {
      try {
        campo.setSelectionRange(nueva, nueva);
      } catch {
        // Algunos tipos de campo no admiten mover el cursor.
      }
    });
  }

  return {
    valor,
    escribir,
    marcarTocado: () => setTocado(true),
    inputRef,
    max,
    // El error se muestra al salir del campo, no mientras se escribe.
    error: tocado ? error : null,
    contador: normalizado.length + '/' + max,
  };
}

export type CampoTexto = ReturnType<typeof useCampoTexto>;
