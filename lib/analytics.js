/**
 * Utilidades de Google Analytics 4 (GA4) y Google Ads
 * 
 * Este módulo proporciona funciones helper para disparar eventos
 * de GA4 y conversiones de Google Ads de forma segura (solo en cliente).
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

/**
 * Dispara evento de conversión de Google Ads
 * 
 * IMPORTANTE: Reemplaza 'AW-CONVERSION_ID/CONVERSION_LABEL' con tus valores reales
 * que Google Ads te proporcionará al configurar la acción de conversión.
 * 
 * @param {Object} [options] - Opciones del evento
 * @param {number} [options.value] - Valor de la conversión (opcional)
 * @param {string} [options.currency] - Moneda (default: 'MXN')
 * @param {string} [options.send_to] - ID y label de conversión (ej: 'AW-123456789/AbC-dEfGhIjKlMnOpQr')
 */
export function trackGoogleAdsConversion(options = {}) {
  // Solo ejecutar en cliente (navegador)
  if (typeof window === 'undefined' || typeof gtag === 'undefined') {
    if (window && window.location && window.location.hostname === 'localhost') {
      console.warn('[analytics] gtag no disponible para Google Ads Conversion');
    }
    return;
  }

  // IMPORTANTE: Reemplaza esto con tu Conversion ID y Label de Google Ads
  // Formato: 'AW-CONVERSION_ID/CONVERSION_LABEL'
  const defaultSendTo = 'AW-CONVERSION_ID/CONVERSION_LABEL';
  
  const {
    value = 163000,
    currency = 'MXN',
    send_to = defaultSendTo,
  } = options;

  // Solo disparar si el send_to no es el placeholder
  if (send_to === defaultSendTo) {
    console.warn('[analytics] Google Ads Conversion no configurado. Reemplaza AW-CONVERSION_ID/CONVERSION_LABEL con tus valores reales.');
    return;
  }

  // Disparar evento de conversión de Google Ads
  gtag('event', 'conversion', {
    send_to: send_to,
    value: value,
    currency: currency,
  });

  // Log en development
  const isDevelopment = window.location && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.vercel.app')
  );
  
  if (isDevelopment) {
    console.log('[analytics] Google Ads Conversion fired', {
      send_to,
      value,
      currency,
    });
  }
}
