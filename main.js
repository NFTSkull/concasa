/**
 * Sistema de Round Robin con Supabase
 * 
 * Este archivo maneja la asignación de vendedores usando round robin
 * y la generación de links de WhatsApp.
 */

// eslint-disable-next-line no-unused-vars -- Se usarán en Bloque 3 para tracking después de INSERT
import { trackWhatsAppClick, trackGoogleAdsConversion, trackCloseConvertLead } from "./lib/analytics.js";
import {
  DEFAULT_MESSAGE,
  DEFAULT_WHATSAPP_NUMBER,
  withWhatsappUrl,
} from "./lib/whatsapp.js";

// API endpoint para asignar vendedor
const API_ENDPOINT = "/api/assign-vendor";

/** @type {NodeListOf<HTMLAnchorElement>} */
const whatsappLinks = document.querySelectorAll("a[data-whatsapp-link]");
/** @type {HTMLElement | null} */
const modal = document.getElementById("lead-modal");
/** @type {HTMLElement | null} */
const modalTitle = document.getElementById("modal-title");
const openModalButtons = document.querySelectorAll("[data-open-modal]");
const closeModalButton = document.querySelector("[data-close-modal]");
/** @type {HTMLFormElement | null} */
const form = /** @type {HTMLFormElement | null} */ (
  document.getElementById("lead-form")
);
/** @type {HTMLFormElement | null} */
const pageForm = /** @type {HTMLFormElement | null} */ (
  document.getElementById("page-form")
);
/** @type {HTMLInputElement | null} */
const originInput = /** @type {HTMLInputElement | null} */ (
  document.getElementById("cta-origin")
);
/** @type {HTMLElement | null} */
const whatsappLoading = document.getElementById("whatsapp-loading");
/** @type {Array<Record<string, unknown>>} */
const actionLog = [];

// ============================================
// MODAL OBLIGATORIO DE WHATSAPP (Bloque 2)
// ============================================
/** @type {HTMLElement | null} */
const whatsappModal = document.getElementById("whatsapp-modal");
/** @type {HTMLFormElement | null} */
const whatsappModalForm = /** @type {HTMLFormElement | null} */ (
  document.getElementById("whatsapp-modal-form")
);
/** @type {HTMLInputElement | null} */
const whatsappModalOriginInput = /** @type {HTMLInputElement | null} */ (
  document.getElementById("whatsapp-modal-origin")
);
/** @type {HTMLInputElement | null} */
const whatsappModalNameInput = /** @type {HTMLInputElement | null} */ (
  document.getElementById("whatsapp-modal-name")
);
/** @type {HTMLInputElement | null} */
const whatsappModalPhoneInput = /** @type {HTMLInputElement | null} */ (
  document.getElementById("whatsapp-modal-phone")
);

// Estado pendiente para el flujo de WhatsApp
/** @type {{ origin: string; element: HTMLElement | null; landingPath: string } | null} */
let pendingWhatsAppData = null;

/**
 * Prepara los datos de coincidencias avanzadas para Meta Pixel
 * Los valores se hashean automáticamente por el píxel usando SHA-256
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.fullName - Nombre completo
 * @param {string} userData.whatsapp - WhatsApp
 * @param {string} userData.birthDate - Fecha de nacimiento (YYYY-MM-DD)
 * @returns {Object} Objeto con datos de coincidencias avanzadas
 */
const prepareAdvancedMatchingData = (userData) => {
  const advancedMatching = {};

  // Teléfono: usar WhatsApp normalizado (solo números, sin espacios ni caracteres especiales)
  if (userData.whatsapp) {
    const normalizedPhone = userData.whatsapp.replace(/\D/g, '');
    if (normalizedPhone.length >= 10) {
      advancedMatching.ph = normalizedPhone;
    }
  }

  // Nombre y apellido: extraer del nombre completo
  if (userData.fullName) {
    const nameParts = userData.fullName.trim().split(/\s+/);
    if (nameParts.length > 0) {
      advancedMatching.fn = nameParts[0]; // Primer nombre
    }
    if (nameParts.length > 1) {
      // Último elemento como apellido
      advancedMatching.ln = nameParts[nameParts.length - 1];
    }
  }

  // Fecha de nacimiento: convertir de YYYY-MM-DD a YYYYMMDD
  if (userData.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(userData.birthDate)) {
    const [year, month, day] = userData.birthDate.split('-');
    advancedMatching.db = `${year}${month}${day}`;
  }

  return advancedMatching;
};

/**
 * Obtiene un vendedor asignado usando round robin desde Supabase
 * @param {Object} [formData] - Datos opcionales del formulario o CTA para guardar en BD
 * @param {string} [formData.lead_full_name] - Nombre completo del lead
 * @param {string} [formData.lead_whatsapp] - WhatsApp del lead
 * @param {string} [formData.lead_imss] - Número de afiliación IMSS
 * @param {string} [formData.lead_birth_date] - Fecha de nacimiento (YYYY-MM-DD o DD/MM/YYYY)
 * @param {string} [formData.event_name] - Tipo de evento ('form_submit' o 'cta_whatsapp_click')
 * @param {string} [formData.channel] - Canal ('web')
 * @param {string} [formData.landing_path] - Path de la landing page
 * @returns {Promise<string>} Número de teléfono del vendedor (10 dígitos, sin +52)
 */
const assignVendor = async (formData = null) => {
  try {
    // Si formData tiene lead_* es un formulario
    const isFormSubmit = formData && (formData.lead_full_name || formData.lead_imss || formData.lead_birth_date || formData.lead_whatsapp);
    
    // Construir body: si es formulario usa form_submit, si formData viene con event_name lo usa, si no usa cta_whatsapp_click
    const body = isFormSubmit ? {
      lead_full_name: formData.lead_full_name || null,
      lead_imss: formData.lead_imss || null,
      lead_birth_date: formData.lead_birth_date || null,
      lead_whatsapp: formData.lead_whatsapp || null,
      channel: formData.channel || "web",
      event_name: "form_submit",
      landing_path: formData.landing_path || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : null),
    } : (formData || {
      event_name: "cta_whatsapp_click",
      channel: "web",
      landing_path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
    });
    
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al asignar vendedor");
    }

    const data = await response.json();
    if (data.success && data.vendor) {
      console.log(
        `[Round Robin] Vendedor asignado: ${data.vendor.name} ` +
        `(${data.vendor.phone}) - Total leads: ${data.vendor.lead_count}`
      );
      // Retornar solo el número (10 dígitos, sin +52)
      return data.vendor.phone;
    } else {
      throw new Error(data.error || "Respuesta inválida del servidor");
    }
  } catch (error) {
    console.error("[Error asignando vendedor]", error);
    // Retornar número por defecto si falla
    return DEFAULT_WHATSAPP_NUMBER;
  }
};

// `withWhatsappUrl` vive en `lib/whatsapp.js` para poder probarse sin DOM.

const toggleModal = (isOpen) => {
  if (!modal) return;
  modal.classList.toggle("hidden", !isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
};

// eslint-disable-next-line no-unused-vars -- Se usará en Bloque 3
const toggleWhatsappLoading = (isVisible) => {
  if (!whatsappLoading) return;
  whatsappLoading.classList.toggle("hidden", !isVisible);
  whatsappLoading.setAttribute("aria-hidden", String(!isVisible));
};

// NOTA: proceedToWhatsAppDirect deshabilitado temporalmente (Bloque 2)
// Ahora todos los CTAs pasan por el modal obligatorio de captura
// Se reactivará en Bloque 3 para procesar después del INSERT exitoso
/*
const proceedToWhatsAppDirect = async (origin) => {
  toggleWhatsappLoading(true);

  try {
    // Enviar event_name='cta_whatsapp_click' para tracking
    const ctaBody = {
      event_name: "cta_whatsapp_click",
      channel: "web",
      landing_path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
    };
    const assignedPhone = await assignVendor(ctaBody);
    const message = DEFAULT_MESSAGE;
    const url = withWhatsappUrl(message, assignedPhone);

    logLeadAction({
      timestamp: new Date().toISOString(),
      origenCTA: origin || "direct-whatsapp",
      vendedorAsignado: assignedPhone,
    });

    // Trackear evento de Lead en Facebook Pixel
    if (typeof fbq !== "undefined") {
      fbq("track", "Lead", {
        content_name: "Solicitud de préstamo Mejoravit",
        content_category: "Préstamo",
        value: 163000,
        currency: "MXN",
        source: origin || "direct-whatsapp",
      });
    }

    // Trackear click de WhatsApp en GA4 (solo para botón del hero)
    if (origin === "hero") {
      trackWhatsAppClick({
        location: "hero",
        url,
        buttonName: "Calcular mi monto por WhatsApp",
      });
    }

    // Redirigir en la misma pestaña para máxima compatibilidad móvil
    window.location.href = url;
  } catch (error) {
    console.error("[WhatsApp flow error]", error);
    toggleWhatsappLoading(false);
  }
};
*/

/**
 * Abre el modal obligatorio de WhatsApp
 * @param {boolean} isOpen - Si el modal debe estar abierto
 */
const toggleWhatsappModal = (isOpen) => {
  if (!whatsappModal) return;
  whatsappModal.classList.toggle("hidden", !isOpen);
  whatsappModal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
  
  if (isOpen && whatsappModalNameInput) {
    // Restaurar subtítulo original al abrir
    const modalSubtitle = whatsappModal.querySelector(".modal-subtitle");
    if (modalSubtitle) {
      modalSubtitle.textContent = "Ingresa tu nombre y WhatsApp para que un asesor te atienda de inmediato.";
    }
    // Focus en el primer campo al abrir
    setTimeout(() => whatsappModalNameInput.focus(), 100);
  }
};

/**
 * Muestra error en el modal de WhatsApp
 * @param {string} field - Nombre del campo ('wa-fullName' o 'wa-whatsapp')
 * @param {string} message - Mensaje de error
 */
const showWhatsappModalError = (field, message) => {
  const errorSpan = whatsappModalForm?.querySelector(`[data-error-for="${field}"]`);
  if (errorSpan) {
    errorSpan.textContent = message;
  }
};

/**
 * Limpia los errores del modal de WhatsApp
 */
const clearWhatsappModalErrors = () => {
  if (!whatsappModalForm) return;
  whatsappModalForm.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
};

/**
 * Valida los datos del modal de WhatsApp
 * @returns {{ isValid: boolean; fullName: string; whatsapp: string }}
 */
const validateWhatsappModalForm = () => {
  clearWhatsappModalErrors();
  let isValid = true;
  
  const fullName = whatsappModalNameInput?.value?.trim() ?? "";
  const rawPhone = whatsappModalPhoneInput?.value ?? "";
  // Normalizar a solo dígitos
  const whatsapp = rawPhone.replace(/\D/g, "");
  
  if (fullName.length < 2) {
    showWhatsappModalError("wa-fullName", "Ingresa tu nombre (mínimo 2 caracteres).");
    isValid = false;
  }
  
  if (whatsapp.length !== 10) {
    showWhatsappModalError("wa-whatsapp", "Ingresa un número de 10 dígitos.");
    isValid = false;
  }
  
  return { isValid, fullName, whatsapp };
};

/**
 * Intercepta TODOS los clicks en links de WhatsApp y abre el modal obligatorio
 */
const updateWhatsappLinks = () => {
  whatsappLinks.forEach((link) => {
    // Fallback href (por si JS falla)
    link.href = withWhatsappUrl(DEFAULT_MESSAGE, DEFAULT_WHATSAPP_NUMBER);

    // Interceptar click para TODOS los botones de WhatsApp
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Obtener origen desde data-origin (obligatorio en cada link)
      const origin = link.getAttribute("data-origin") || "unknown";
      const landingPath = window.location.pathname + window.location.search;
      
      // Guardar datos pendientes
      pendingWhatsAppData = {
        origin,
        element: link,
        landingPath,
      };
      
      // Guardar origen en el hidden input del modal
      if (whatsappModalOriginInput) {
        whatsappModalOriginInput.value = origin;
      }
      
      // Limpiar formulario y errores
      whatsappModalForm?.reset();
      clearWhatsappModalErrors();
      
      // Log para debug
      console.log("[WhatsApp Modal] Interceptado CTA:", origin);
      
      // Abrir modal obligatorio
      toggleWhatsappModal(true);
    });
  });
};

/**
 * Inicializa el modal obligatorio de WhatsApp
 */
const initWhatsappModal = () => {
  // Cerrar modal con botón X
  const closeBtn = whatsappModal?.querySelector("[data-close-whatsapp-modal]");
  closeBtn?.addEventListener("click", () => {
    toggleWhatsappModal(false);
    pendingWhatsAppData = null;
  });
  
  // Cerrar modal al hacer click en el backdrop
  whatsappModal?.addEventListener("click", (e) => {
    if (e.target === whatsappModal) {
      toggleWhatsappModal(false);
      pendingWhatsAppData = null;
    }
  });
  
  // Cerrar modal con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && whatsappModal && !whatsappModal.classList.contains("hidden")) {
      toggleWhatsappModal(false);
      pendingWhatsAppData = null;
    }
  });
  
  // Manejar submit del formulario
  whatsappModalForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const validation = validateWhatsappModalForm();
    if (!validation.isValid) {
      console.log("[WA MODAL] Validación fallida");
      return;
    }
    
    // Obtener el botón submit y deshabilitarlo para evitar doble submit
    /** @type {HTMLButtonElement | null} */
    const submitBtn = /** @type {HTMLButtonElement | null} */ (
      whatsappModalForm.querySelector('button[type="submit"]')
    );
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
    }
    
    // Construir payload para el API
    const payload = {
      event_name: "whatsapp_modal",
      lead_name: validation.fullName,
      lead_phone: validation.whatsapp,
      origen_cta: pendingWhatsAppData?.origin || "unknown",
      landing_path: pendingWhatsAppData?.landingPath || window.location.pathname + window.location.search,
    };
    
    console.log("[WA MODAL] payload ->", payload);
    
    try {
      // POST al API
      const response = await fetch("/api/assign-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      // Parsear respuesta
      let data;
      try {
        data = await response.json();
      } catch {
        data = { success: false, error: "Error al procesar respuesta del servidor" };
      }
      
      console.log("[WA MODAL] api response ->", data);
      
      // Verificar condición de éxito ESTRICTA
      if (response.ok && data.success === true && data.inserted === true && data.whatsapp_url) {
        console.log("[WA MODAL] success+inserted -> firing ClickWhatsApp + opening WA");
        
        // Mostrar mensaje de redirección
        if (submitBtn) {
          submitBtn.textContent = "Redirigiendo a WhatsApp...";
          submitBtn.disabled = true;
        }
        
        // Actualizar subtítulo del modal para mostrar mensaje de carga
        const modalSubtitle = whatsappModal?.querySelector(".modal-subtitle");
        if (modalSubtitle) {
          modalSubtitle.textContent = "Redirigiendo a WhatsApp...";
        }
        
        // (A) DISPARAR ClickWhatsApp SOLO si insert fue exitoso
        try {
          if (typeof fbq !== "undefined") {
            fbq("trackCustom", "ClickWhatsApp", {
              placement: payload.origen_cta,
              link_url: data.whatsapp_url,
              lead_assignment_id: data.lead_assignment_id,
            });
          }
        } catch (fbqError) {
          console.warn("[WA MODAL] fbq error:", fbqError);
        }
        
        // Pequeño delay para que el usuario vea el mensaje de redirección
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // (B) ABRIR WHATSAPP
        const waWindow = window.open(data.whatsapp_url, "_blank", "noopener,noreferrer");
        if (!waWindow) {
          // Si popup bloqueado, redirigir en la misma pestaña
          window.location.href = data.whatsapp_url;
        }
        
        // (C) Cerrar modal y limpiar
        toggleWhatsappModal(false);
        pendingWhatsAppData = null;
        whatsappModalForm.reset();
        
      } else {
        // Error: mostrar mensaje en el modal, NO abrir WhatsApp, NO disparar evento
        const errorMsg = data.error || "No se pudo guardar, intenta de nuevo.";
        console.log("[WA MODAL] failed ->", errorMsg);
        showWhatsappModalError("wa-whatsapp", errorMsg);
        
        // Restaurar subtítulo original
        const modalSubtitle = whatsappModal?.querySelector(".modal-subtitle");
        if (modalSubtitle) {
          modalSubtitle.textContent = "Ingresa tu nombre y WhatsApp para que un asesor te atienda de inmediato.";
        }
      }
      
    } catch (fetchError) {
      // Error de red
      console.error("[WA MODAL] fetch error ->", fetchError);
      showWhatsappModalError("wa-whatsapp", "Error de conexión. Intenta de nuevo.");
      
      // Restaurar subtítulo original
      const modalSubtitle = whatsappModal?.querySelector(".modal-subtitle");
      if (modalSubtitle) {
        modalSubtitle.textContent = "Ingresa tu nombre y WhatsApp para que un asesor te atienda de inmediato.";
      }
    } finally {
      // Rehabilitar botón submit (solo si no fue exitoso, porque si fue exitoso ya se cerró el modal)
      if (submitBtn && whatsappModal && !whatsappModal.classList.contains("hidden")) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Hablar por WhatsApp";
      }
    }
  });
};

const setModalOrigin = (origin) => {
  if (originInput) {
    originInput.value = origin;
  }
  if (modalTitle) {
    modalTitle.textContent = origin === "eligibility" ? "¿Aplicas? Revisemos tus datos" : "Revisar si tengo dinero";
  }
};

const showError = (field, message, formElement) => {
  const errorSpan = formElement.querySelector(`[data-error-for="${field}"]`);
  if (errorSpan) {
    errorSpan.textContent = message;
    const input = formElement.querySelector(`input[name="${field}"]`);
    if (input) {
      input.setAttribute("aria-invalid", "true");
    }
  }
};

const clearErrors = (formElement) => {
  formElement.querySelectorAll(".error").forEach((error) => (error.textContent = ""));
  formElement.querySelectorAll("input[aria-invalid]").forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
};

const validateForm = (data, formElement) => {
  let isValid = true;
  const fullName = data.get("fullName")?.trim() ?? "";
  const birthDate = data.get("birthDate")?.trim() ?? "";
  const whatsapp = data.get("whatsapp")?.trim() ?? "";

  if (fullName.length < 3) {
    showError("fullName", "Ingresa tu nombre completo.", formElement);
    isValid = false;
  }
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    showError("birthDate", "Selecciona tu fecha de nacimiento.", formElement);
    isValid = false;
  }
  if (whatsapp.length < 10) {
    showError("whatsapp", "Tu WhatsApp debe tener 10 dígitos.", formElement);
    isValid = false;
  }

  return {
    isValid,
    fullName,
    birthDate,
    whatsapp,
  };
};

const logLeadAction = (entry) => {
  actionLog.push(entry);
  if (typeof window !== "undefined") {
    window.__actionLog = actionLog;
  }
  console.info("[action_log]", entry);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const formElement = event.target;
  clearErrors(formElement);
  const formData = new FormData(formElement);
  const validation = validateForm(formData, formElement);
  if (!validation.isValid) return;

  // Preparar datos del formulario para guardar en BD
  const originCTA = formData.get("origin");
  const formDataForDB = {
    lead_full_name: validation.fullName,
    lead_whatsapp: validation.whatsapp,
    lead_imss: null,
    lead_birth_date: validation.birthDate,
    origen_cta: typeof originCTA === 'string' ? originCTA : "hero",
  };

  // Asignar vendedor usando round robin y guardar datos del formulario
  const assignedPhone = await assignVendor(formDataForDB);

  // Convertir fecha de YYYY-MM-DD a DD/MM/AAAA para el mensaje
  const formatDateForMessage = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const message = [
    "Hola, quiero solicitar el préstamo de Subcuenta de Vivienda con 11% de interés.",
    "",
    "Soy trabajador activo que cotiza en Infonavit y me interesa el préstamo más amigable.",
    "",
    "Mis datos son:",
    `Nombre completo: ${validation.fullName}`,
    `Fecha de nacimiento: ${formatDateForMessage(validation.birthDate)}`,
    `WhatsApp: ${validation.whatsapp}`,
    "",
    "Gracias.",
  ].join("\n");

  logLeadAction({
    timestamp: new Date().toISOString(),
    nombre: validation.fullName,
    origenCTA: formData.get("origin") ?? "hero",
    vendedorAsignado: assignedPhone,
  });

  // Trackear evento de Lead en Facebook Pixel con coincidencias avanzadas
  if (typeof fbq !== 'undefined') {
    const advancedMatching = prepareAdvancedMatchingData({
      fullName: validation.fullName,
      whatsapp: validation.whatsapp,
      birthDate: validation.birthDate,
    });

    // Establecer datos de usuario globalmente para todas las futuras llamadas del píxel
    if (Object.keys(advancedMatching).length > 0) {
      fbq('set', 'userData', advancedMatching);
    }

    fbq('track', 'Lead', {
      content_name: 'Solicitud de préstamo Mejoravit',
      content_category: 'Préstamo',
      value: 163000,
      currency: 'MXN',
      source: formData.get("origin") ?? "hero",
      ...advancedMatching, // Incluir datos de coincidencias avanzadas
    });
  }

  // Disparar evento de conversión de Google Ads
  trackGoogleAdsConversion({
    value: 163000,
    currency: 'MXN',
  });

  // Generar URL de WhatsApp con el mensaje
  const whatsappUrl = withWhatsappUrl(message, assignedPhone);
  
  // Guardar datos en sessionStorage para la página de gracias (opcional)
  try {
    sessionStorage.setItem('whatsappUrl', whatsappUrl);
  } catch (e) {
    // Ignorar errores de sessionStorage (puede fallar en modo incógnito)
    console.warn('[handleSubmit] No se pudo guardar en sessionStorage', e);
  }

  // Mostrar mensaje de agradecimiento brevemente antes de redirigir
  // Solo para el formulario de página (page-form), mostrar gracias.html con redirección automática
  if (formElement === pageForm) {
    // Guardar URL de WhatsApp en sessionStorage para que gracias.html la use
    try {
      sessionStorage.setItem('redirectToWhatsApp', whatsappUrl);
    } catch (e) {
      console.warn('[handleSubmit] No se pudo guardar redirectToWhatsApp', e);
    }
    // Redirigir a página de agradecimiento que luego redirigirá a WhatsApp
    window.location.href = '/gracias.html';
  } else {
    // Para el modal, redirigir directamente a WhatsApp
    window.location.href = whatsappUrl;
  }

  formElement.reset();
  
  if (formElement === form) {
    toggleModal(false);
  }
};

const toggleLegalModal = (modalId, isOpen) => {
  const legalModal = document.getElementById(modalId);
  if (!legalModal) return;
  legalModal.classList.toggle("hidden", !isOpen);
  legalModal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
};

const initModal = () => {
  openModalButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const modalType = button.getAttribute("data-open-modal") ?? "hero";
      
      // Manejar modales legales
      if (modalType === "privacidad") {
        toggleLegalModal("privacidad-modal", true);
        return;
      }
      if (modalType === "terminos") {
        toggleLegalModal("terminos-modal", true);
        return;
      }
      
      // Manejar modal de lead
      setModalOrigin(modalType);
      toggleModal(true);
      /** @type {HTMLInputElement | null} */
      const firstInput = /** @type {HTMLInputElement | null} */ (
        form?.querySelector("input[name='fullName']")
      );
      firstInput?.focus();
    });
  });

  // Cerrar modales de lead
  closeModalButton?.addEventListener("click", () => toggleModal(false));

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      toggleModal(false);
    }
  });

  // Cerrar modales legales
  const privacidadModal = document.getElementById("privacidad-modal");
  const terminosModal = document.getElementById("terminos-modal");
  
  [privacidadModal, terminosModal].forEach((legalModal) => {
    if (!legalModal) return;
    
    // Cerrar al hacer clic en el backdrop
    legalModal.addEventListener("click", (event) => {
      if (event.target === legalModal) {
        legalModal.classList.add("hidden");
        legalModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    });
    
    // Cerrar con botón X
    const closeBtn = legalModal.querySelector("[data-close-modal]");
    closeBtn?.addEventListener("click", () => {
      legalModal.classList.add("hidden");
      legalModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    });
  });

  // Cerrar cualquier modal con ESC
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleModal(false);
      if (privacidadModal && !privacidadModal.classList.contains("hidden")) {
        toggleLegalModal("privacidad-modal", false);
      }
      if (terminosModal && !terminosModal.classList.contains("hidden")) {
        toggleLegalModal("terminos-modal", false);
      }
    }
  });
};


/**
 * Handler específico para el formulario de página (#page-form)
 * Guarda datos en BD y redirige a gracias.html
 */
const handlePageFormSubmit = async (event) => {
  event.preventDefault();
  const formElement = event.target;
  clearErrors(formElement);
  const formData = new FormData(formElement);
  
  // Validar formulario
  const validation = validateForm(formData, formElement);
  if (!validation.isValid) return;

  // Leer campos del formulario
  const fullName = formData.get("fullName")?.toString().trim() || "";
  const birthDate = formData.get("birthDate")?.toString().trim() || "";
  let whatsapp = formData.get("whatsapp")?.toString().trim() || "";
  
  // Normalizar WhatsApp a solo dígitos
  whatsapp = whatsapp.replace(/\D/g, '');

  // Extraer UTM parameters de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || null;
  const utmMedium = urlParams.get('utm_medium') || null;
  const utmCampaign = urlParams.get('utm_campaign') || null;
  const utmContent = urlParams.get('utm_content') || null;
  const utmTerm = urlParams.get('utm_term') || null;

  // Construir payload con nombres exactos que espera la BD
  const payload = {
    lead_full_name: fullName || null,
    lead_imss: null,
    lead_birth_date: birthDate || null,
    lead_whatsapp: whatsapp || null,
    channel: "web",
    event_name: "form_submit",
    landing_path: window.location.pathname + window.location.search,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
  };

  try {
    // Hacer fetch POST a /api/assign-vendor
    const response = await fetch("/api/assign-vendor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.success) {
      // Mostrar error y NO redirigir
      console.error("[Form Submit Error]", data.error);
      alert(`Error al enviar el formulario: ${data.error || "Error desconocido"}`);
      return;
    }

    // Si success=true
    if (data.whatsapp_url) {
      // Guardar whatsapp_url en sessionStorage
      try {
        sessionStorage.setItem("wa_redirect_url", data.whatsapp_url);
      } catch (e) {
        console.warn("[handlePageFormSubmit] No se pudo guardar en sessionStorage", e);
      }
    }

    // Redirigir a /gracias.html
    window.location.href = "/gracias.html";

  } catch (error) {
    console.error("[handlePageFormSubmit] Error en fetch", error);
    alert("Error al enviar el formulario. Por favor intenta de nuevo.");
  }
};

const initForm = () => {
  form?.addEventListener("submit", handleSubmit);
  pageForm?.addEventListener("submit", handlePageFormSubmit);
};

const initAnimations = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(".fade-up").forEach((section) => observer.observe(section));
};

const initMobileMenu = () => {
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("mobile-menu-overlay");
  
  if (!menuToggle || !mobileMenu) return;

  const toggleMenu = () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.setAttribute("aria-hidden", String(isOpen));
    if (overlay) {
      overlay.classList.toggle("active", !isOpen);
    }
    document.body.style.overflow = isOpen ? "" : "hidden";
  };

  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    if (overlay) {
      overlay.classList.remove("active");
    }
    document.body.style.overflow = "";
  };

  menuToggle.addEventListener("click", toggleMenu);

  // Cerrar menú al hacer clic en el overlay
  if (overlay) {
    overlay.addEventListener("click", closeMenu);
  }

  // Cerrar menú al hacer clic en un enlace
  mobileMenu.querySelectorAll("a, button").forEach((link) => {
    link.addEventListener("click", () => {
      // Pequeño delay para permitir la navegación
      setTimeout(closeMenu, 100);
    });
  });

  // Cerrar menú con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });
};

const initVideoAutoplay = () => {
  const videoSection = document.getElementById("video-explicativo");
  /** @type {HTMLVideoElement | null} */
  const video = /** @type {HTMLVideoElement | null} */ (
    document.getElementById("video-prestamo")
  );
  
  if (!videoSection || !video) return;

  // Cargar el video cuando esté listo
  video.addEventListener("loadedmetadata", () => {
    console.log("Video cargado, duración:", video.duration);
  });

  // Manejar errores de carga
  video.addEventListener("error", (e) => {
    console.error("Error al cargar el video:", e);
    const errorMsg = document.createElement("div");
    errorMsg.className = "video-error";
    errorMsg.innerHTML = `
      <p>No se pudo cargar el video. Por favor, intenta recargar la página.</p>
      <p>Si el problema persiste, asegúrate de que el archivo esté disponible.</p>
    `;
    video.parentElement?.appendChild(errorMsg);
  });

  // Intentar cargar el video
  video.load();

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.3, // Se activa cuando el 30% del video está visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Cuando el video entra en vista, intentar reproducir
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Reproducción exitosa
              console.log("Video reproduciéndose automáticamente");
            })
            .catch(() => {
              // Autoplay bloqueado, el usuario debe iniciar manualmente
              console.log("Autoplay bloqueado por el navegador. El usuario debe iniciar manualmente.");
              // Intentar reproducir sin sonido (muted)
              video.muted = true;
              video.play().catch(() => {
                console.log("Incluso con muted, el autoplay está bloqueado");
              });
            });
        }
      } else {
        // Cuando el video sale de vista, pausar
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, observerOptions);

  observer.observe(videoSection);

  // Pausar video cuando sale de la página (pestaña inactiva)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !video.paused) {
      video.pause();
    }
  });

  // Permitir al usuario activar el audio cuando quiera
  video.addEventListener("click", () => {
    if (video.muted) {
      video.muted = false;
    }
  });

  // Si el usuario interactúa con el video, permitir audio
  let userInteracted = false;
  video.addEventListener("play", () => {
    if (!userInteracted) {
      userInteracted = true;
      video.muted = false;
    }
  });
};


// NOTA: initHeroCTATracking deshabilitado (Bloque 2)
// Ahora TODOS los CTAs de WhatsApp (incluyendo hero) pasan por el modal obligatorio
// Se reactivará parcialmente en Bloque 3 para el tracking después del INSERT exitoso
/*
const initHeroCTATracking = () => {
  const heroCTAButton = document.querySelector('a.btn-hero-cta[data-whatsapp-link]');
  if (!heroCTAButton || !(heroCTAButton instanceof HTMLAnchorElement)) return;

  heroCTAButton.addEventListener('click', async (e) => {
    e.preventDefault();
    toggleWhatsappLoading(true);
    
    try {
      const payload = {
        event_name: 'cta_whatsapp_click',
        channel: 'web',
        landing_path: window.location.pathname + window.location.search,
      };

      const response = await fetch('/api/assign-vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success && data.vendor && data.vendor.phone) {
        const assignedPhone = data.vendor.phone;
        const whatsappUrl = withWhatsappUrl(DEFAULT_MESSAGE, assignedPhone);
        heroCTAButton.href = whatsappUrl;
        
        trackCloseConvertLead({ linkUrl: whatsappUrl });
        
        try {
          if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'ClickWhatsApp', {
              placement: 'hero',
              link_url: whatsappUrl
            });
          }
        } catch (_e) {}
        
        setTimeout(() => {
          window.location.href = whatsappUrl;
        }, 200);
      } else {
        console.error('[Hero CTA] Error obteniendo vendor, usando default:', data.error);
        const fallbackUrl = withWhatsappUrl(DEFAULT_MESSAGE, DEFAULT_WHATSAPP_NUMBER);
        trackCloseConvertLead({ linkUrl: fallbackUrl });
        
        try {
          if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'ClickWhatsApp', {
              placement: 'hero',
              link_url: fallbackUrl
            });
          }
        } catch (_e) {}
        
        setTimeout(() => {
          window.location.href = fallbackUrl;
        }, 200);
      }
    } catch (error) {
      console.error('[Hero CTA] Error:', error);
      toggleWhatsappLoading(false);
      const fallbackUrl = withWhatsappUrl(DEFAULT_MESSAGE, DEFAULT_WHATSAPP_NUMBER);
      trackCloseConvertLead({ linkUrl: fallbackUrl });
      
      try {
        if (typeof fbq !== 'undefined') {
          fbq('trackCustom', 'ClickWhatsApp', {
            placement: 'hero',
            link_url: fallbackUrl
          });
        }
      } catch (_e) {}
      
      setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 200);
    }
  });
};
*/

// Inicializar funciones cuando el DOM esté listo
const init = () => {
  updateWhatsappLinks();
  initWhatsappModal(); // Modal obligatorio para captura antes de WhatsApp
  initModal();
  initForm();
  initAnimations();
  initMobileMenu();
  initVideoAutoplay();
  // initHeroCTATracking(); // Deshabilitado: ahora todos los CTAs pasan por el modal obligatorio
};

// Ejecutar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  // DOM ya está listo
  init();
}


