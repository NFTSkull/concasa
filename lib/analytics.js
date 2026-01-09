/**
 * Utilidades de Google Analytics 4 (GA4)
 * 
 * Este módulo proporciona funciones helper para disparar eventos
 * de GA4 de forma segura (solo en cliente).
 */

/**
 * Trackea un click al botón de WhatsApp
 * 
 * @param {Object} options - Opciones del evento
 * @param {string} options.location - Ubicación del botón (ej: 'hero', 'floating-wa')
 * @param {string} [options.url] - URL de WhatsApp que se abrirá
 * @param {string} [options.buttonName] - Nombre del botón (default: 'Calcular mi monto por WhatsApp')
 */
export function trackWhatsAppClick({ location, url, buttonName = 'Calcular mi monto por WhatsApp' }) {
  // Solo ejecutar en cliente (navegador)
  if (typeof window === 'undefined' || typeof gtag === 'undefined') {
    // En desarrollo, loguear si gtag no está disponible
    if (window && window.location && window.location.hostname === 'localhost') {
      console.warn('[analytics] gtag no disponible o ejecutándose en servidor');
    }
    return;
  }

  // Obtener la URL de WhatsApp si no se proporciona
  const whatsappUrl = url || (window.location ? window.location.href : '');
  
  // Obtener el pathname de la página actual
  const pagePath = window.location ? window.location.pathname : '/';

  // Disparar evento de GA4
  gtag('event', 'whatsapp_click', {
    button_name: buttonName,
    button_location: location,
    link_url: whatsappUrl,
    page_path: pagePath,
  });

  // Log solo en development (localhost o dominios de desarrollo)
  const isDevelopment = window.location && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.vercel.app')
  );
  
  if (isDevelopment) {
    console.log('[analytics] whatsapp_click fired', {
      button_name: buttonName,
      button_location: location,
      link_url: whatsappUrl,
      page_path: pagePath,
    });
  }
}
