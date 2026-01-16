/**
 * Utilidades de WhatsApp (deeplink) y copy base.
 *
 * Se mantiene en un módulo aislado para poder probarlo sin depender del DOM.
 */

// Número por defecto (fallback si el API falla)
export const DEFAULT_WHATSAPP_NUMBER = "8181781697"; // Primer vendedor como fallback

// Mensaje base para CTAs directos (sin preguntas adicionales)
export const DEFAULT_MESSAGE = "Hola, quiero obtener mi préstamo Mejoravit.";

/**
 * Genera la URL de WhatsApp con el formato correcto
 * @param {string} text - Mensaje a enviar
 * @param {string | null} phoneNumber - Número de teléfono (10 dígitos, sin +52)
 * @returns {string} URL completa de WhatsApp
 */
export function withWhatsappUrl(text, phoneNumber = null) {
  // El número viene sin +52, así que lo agregamos
  const number = phoneNumber
    ? `52${phoneNumber}`
    : `52${DEFAULT_WHATSAPP_NUMBER}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

