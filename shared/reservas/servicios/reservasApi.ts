import type { NewRegistration, Payment, PaymentReview, Registration, Result } from '../tipos';
import { solicitar, type OpcionesHttp } from './http';
import { repositorio } from './repositorio';

/**
 * Único punto de contacto entre la interfaz y los datos de reservas: cada función llama a su
 * endpoint de la API y devuelve un Result cuyo error es el `detail` que manda el servidor.
 * El servidor repite todas las validaciones y es quien decide.
 */

/** Hace la escritura y, si salió bien, vuelve a pedir el estado para que la interfaz lo vea. */
async function escribir<T>(opciones: OpcionesHttp): Promise<Result<T>> {
  const respuesta = await solicitar<T>(opciones);
  if (!respuesta.ok) return respuesta;
  await repositorio.refrescar();
  return { ok: true, data: respuesta.data };
}

export const reservasApi = {
  /** El sitio público registra la reserva con su primer pago esperado, pendiente de revisión. */
  crearReserva(input: NewRegistration): Promise<Result<Registration>> {
    return escribir<Registration>({ metodo: 'POST', ruta: '/api/v1/reservas', cuerpo: input });
  },

  /** La organización aprueba, rechaza o devuelve a revisión un pago tras verificar Bre-B. */
  revisarPago(
    registrationId: string,
    paymentId: string,
    review: PaymentReview,
    reason: string | null = null,
  ): Promise<Result<Registration>> {
    // El servidor identifica el pago por su código; la inscripción se deduce de él.
    void registrationId;
    return escribir<Registration>({
      metodo: 'PUT',
      ruta: '/api/v1/admin/pagos/' + encodeURIComponent(paymentId) + '/revision',
      cuerpo: { review, reason },
      admin: true,
    });
  },

  /** Pago que la organización ya verificó en la llave Bre-B: entra aprobado. */
  registrarPago(registrationId: string, amount: number): Promise<Result<Payment>> {
    return escribir<Payment>({
      metodo: 'POST',
      ruta: '/api/v1/admin/reservas/' + encodeURIComponent(registrationId) + '/pagos',
      cuerpo: { amount },
      admin: true,
    });
  },

  /** La organización marca si recibió la autorización firmada del responsable de un menor. */
  fijarAutorizacionMenor(registrationId: string, received: boolean): Promise<Result<Registration>> {
    return escribir<Registration>({
      metodo: 'PUT',
      ruta: '/api/v1/admin/reservas/' + encodeURIComponent(registrationId) + '/autorizacion-menor',
      cuerpo: { received },
      admin: true,
    });
  },

  async fijarCapacidad(value: number): Promise<Result<number>> {
    const resultado = await escribir<{ capacity: number }>({
      metodo: 'PUT',
      ruta: '/api/v1/admin/capacidad',
      cuerpo: { capacity: value },
      admin: true,
    });
    return resultado.ok ? { ok: true, data: resultado.data.capacity } : resultado;
  },

  /** Último día para inscribirse y para pagar el restante; lo cambia la organización. */
  async fijarFechaCierre(value: string): Promise<Result<string>> {
    const resultado = await escribir<{ fechaCierre: string }>({
      metodo: 'PUT',
      ruta: '/api/v1/admin/fecha-cierre',
      cuerpo: { fechaCierre: value },
      admin: true,
    });
    return resultado.ok ? { ok: true, data: resultado.data.fechaCierre } : resultado;
  },
};
