import { createContext, useContext } from 'react';

/**
 * Valores del borrador recuperado, por nombre de campo. Cada campo los lee una sola vez al
 * montarse para arrancar con lo que la persona ya había escrito; sin borrador está vacío.
 */
export const BorradorContext = createContext<Record<string, string>>({});

export function useValorGuardado(name: string): string {
  return useContext(BorradorContext)[name] ?? '';
}

/** El valor guardado si sigue siendo una opción válida de la lista; si no, ''. */
export function opcionGuardada(opciones: readonly string[], guardado: string): string {
  return opciones.includes(guardado) ? guardado : '';
}
