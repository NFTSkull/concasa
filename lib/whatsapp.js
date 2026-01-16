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
  // Limpiar el número: remover espacios, guiones, paréntesis, etc. Solo dejar dígitos
  const cleanNumber = phoneNumber
    ? String(phoneNumber).replace(/\D/g, '')
    : DEFAULT_WHATSAPP_NUMBER;
  
  // Asegurar que sea exactamente 10 dígitos (número mexicano)
  // Si tiene más de 10 dígitos, tomar los últimos 10
  // Si tiene menos de 10 dígitos, usar el número por defecto
  const normalizedNumber = cleanNumber.length === 10
    ? cleanNumber
    : cleanNumber.length > 10
    ? cleanNumber.slice(-10) // Tomar últimos 10 dígitos
    : DEFAULT_WHATSAPP_NUMBER; // Si es menor a 10, usar default
  
  // El número viene sin +52, así que lo agregamos para formato internacional
  const internationalNumber = `52${normalizedNumber}`;
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(text)}`;
}

