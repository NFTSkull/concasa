/**
 * Sistema de Round Robin con Supabase
 * 
 * Este archivo maneja la asignación de vendedores usando round robin
 * y la generación de links de WhatsApp.
 */

// Número por defecto (fallback si el API falla)
const DEFAULT_WHATSAPP_NUMBER = "8181781697"; // Primer vendedor como fallback
const DEFAULT_MESSAGE = "Hola, quiero obtener mi préstamo Mejoravit.";

// API endpoint para asignar vendedor
const API_ENDPOINT = "/api/assign-vendor";

const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
const modal = document.getElementById("lead-modal");
const modalTitle = document.getElementById("modal-title");
const openModalButtons = document.querySelectorAll("[data-open-modal]");
const closeModalButton = document.querySelector("[data-close-modal]");
const form = document.getElementById("lead-form");
const pageForm = document.getElementById("page-form");
const originInput = document.getElementById("cta-origin");
const currentYear = document.getElementById("current-year");
const locationModal = document.getElementById("location-modal");
const locationForm = document.getElementById("location-form");
const whatsappLoading = document.getElementById("whatsapp-loading");
const actionLog = [];
let pendingWhatsappAction = null; // Guarda la acción de WhatsApp pendiente

/**
 * Prepara los datos de coincidencias avanzadas para Meta Pixel
 * Los valores se hashean automáticamente por el píxel usando SHA-256
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.fullName - Nombre completo
 * @param {string} userData.phone - Teléfono
 * @param {string} userData.whatsapp - WhatsApp
 * @param {string} userData.birthDate - Fecha de nacimiento (DD/MM/AAAA)
 * @returns {Object} Objeto con datos de coincidencias avanzadas
 */
const prepareAdvancedMatchingData = (userData) => {
  const advancedMatching = {};

  // Teléfono: normalizar (solo números, sin espacios ni caracteres especiales)
  if (userData.phone) {
    const normalizedPhone = userData.phone.replace(/\D/g, '');
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

  // Fecha de nacimiento: convertir de DD/MM/AAAA a YYYYMMDD
  if (userData.birthDate && /^\d{2}\/\d{2}\/\d{4}$/.test(userData.birthDate)) {
    const [day, month, year] = userData.birthDate.split('/');
    advancedMatching.db = `${year}${month}${day}`;
  }

  return advancedMatching;
};

/**
 * Obtiene un vendedor asignado usando round robin desde Supabase
 * @returns {Promise<string>} Número de teléfono del vendedor (10 dígitos, sin +52)
 */
const assignVendor = async () => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

/**
 * Genera la URL de WhatsApp con el formato correcto
 * @param {string} text - Mensaje a enviar
 * @param {string} phoneNumber - Número de teléfono (10 dígitos, sin +52)
 * @returns {string} URL completa de WhatsApp
 */
const withWhatsappUrl = (text, phoneNumber = null) => {
  // El número viene sin +52, así que lo agregamos
  const number = phoneNumber ? `52${phoneNumber}` : `52${DEFAULT_WHATSAPP_NUMBER}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

const toggleModal = (isOpen) => {
  if (!modal) return;
  modal.classList.toggle("hidden", !isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
};

const toggleLocationModal = (isOpen) => {
  if (!locationModal) return;
  locationModal.classList.toggle("hidden", !isOpen);
  locationModal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
};

const toggleWhatsappLoading = (isVisible) => {
  if (!whatsappLoading) return;
  whatsappLoading.classList.toggle("hidden", !isVisible);
  whatsappLoading.setAttribute("aria-hidden", String(!isVisible));
};

const proceedToWhatsApp = async (locationType) => {
  if (!pendingWhatsappAction) return;
  const { link, origin } = pendingWhatsappAction;
  pendingWhatsappAction = null;

  toggleWhatsappLoading(true);

  try {
    const assignedPhone = await assignVendor();
    const locationText =
      locationType === "monterrey"
        ? "Soy de Monterrey, Nuevo León"
        : "Soy foráneo pero radico en Monterrey, Nuevo León";

    const message = `${DEFAULT_MESSAGE}\n\n${locationText}`;
    const url = withWhatsappUrl(message, assignedPhone);

    logLeadAction({
      timestamp: new Date().toISOString(),
      origenCTA: origin || "direct-whatsapp",
      vendedorAsignado: assignedPhone,
      ubicacion: locationText,
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

    // Usar location.href en lugar de window.open mejora compatibilidad
    // con navegadores móviles (especialmente Safari en iOS)
    window.location.href = url;
  } catch (error) {
    console.error("[WhatsApp flow error]", error);
    toggleWhatsappLoading(false);
  }
};

const updateWhatsappLinks = () => {
  whatsappLinks.forEach((link) => {
    // Agregar event listener para mostrar modal de ubicación primero
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      
      // Determinar el origen del CTA
      let origin = "direct-whatsapp";
      if (link.closest(".hero-ctas")) origin = "hero";
      else if (link.closest(".mejoravit-cta")) origin = "mejoravit";
      else if (link.closest(".cta-center")) origin = "cta-center";
      else if (link.classList.contains("floating-wa")) origin = "floating-wa";
      
      // Disparamos evento del Pixel cuando el usuario inicia el flujo de WhatsApp desde el botón del hero
      if (origin === "hero" && typeof fbq !== 'undefined') {
        fbq('trackCustom', 'ClickWhatsApp');
      }
      
      // Guardar la acción pendiente
      pendingWhatsappAction = { link, origin };
      
      // Mostrar modal de ubicación
      toggleLocationModal(true);
    });
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
  const nss = data.get("nss")?.trim() ?? "";
  const birthDate = data.get("birthDate")?.trim() ?? "";
  const phone = data.get("phone")?.trim() ?? "";
  const whatsapp = data.get("whatsapp")?.trim() ?? "";

  if (fullName.length < 3) {
    showError("fullName", "Ingresa tu nombre completo.", formElement);
    isValid = false;
  }
  if (nss.length < 10 || !/^\d+$/.test(nss)) {
    showError("nss", "Ingresa tu número de afiliación (solo números).", formElement);
    isValid = false;
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
    showError("birthDate", "Formato DD/MM/AAAA.", formElement);
    isValid = false;
  }
  if (phone.length < 10) {
    showError("phone", "Incluye lada a 10 dígitos.", formElement);
    isValid = false;
  }
  if (whatsapp.length < 10) {
    showError("whatsapp", "Tu WhatsApp debe tener 10 dígitos.", formElement);
    isValid = false;
  }

  return {
    isValid,
    fullName,
    nss,
    birthDate,
    phone,
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

  // Asignar vendedor usando round robin
  const assignedPhone = await assignVendor();

  const message = [
    "Hola, quiero solicitar el préstamo de Subcuenta de Vivienda con 11% de interés.",
    "",
    "Soy trabajador activo que cotiza en Infonavit y me interesa el préstamo más amigable.",
    "",
    "Mis datos son:",
    `Nombre completo: ${validation.fullName}`,
    `Número de afiliación IMSS: ${validation.nss}`,
    `Fecha de nacimiento: ${validation.birthDate}`,
    `Teléfono: ${validation.phone}`,
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
      phone: validation.phone,
      whatsapp: validation.whatsapp,
      birthDate: validation.birthDate,
    });

    fbq('track', 'Lead', {
      content_name: 'Solicitud de préstamo Mejoravit',
      content_category: 'Préstamo',
      value: 163000,
      currency: 'MXN',
      source: formData.get("origin") ?? "hero",
      ...advancedMatching, // Incluir datos de coincidencias avanzadas
    });
  }

  const whatsappUrl = withWhatsappUrl(message, assignedPhone);

  // Redirigir en la misma pestaña para máxima compatibilidad móvil
  window.location.href = whatsappUrl;

  formElement.reset();
  
  if (formElement === form) {
    toggleModal(false);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const firstInput = form.querySelector("input[name='fullName']");
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

  // Manejar formulario de ubicación - se envía automáticamente al seleccionar una opción
  if (locationForm) {
    const locationInputs = locationForm.querySelectorAll('input[name="location"]');
    locationInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        if (e.target.checked) {
          // Pequeño delay para mejor UX
          setTimeout(() => {
            toggleLocationModal(false);
            proceedToWhatsApp(e.target.value);
          }, 300);
        }
      });
    });

    // También mantener el submit por si acaso
    locationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const selectedLocation = locationForm.querySelector('input[name="location"]:checked');
      if (selectedLocation) {
        toggleLocationModal(false);
        proceedToWhatsApp(selectedLocation.value);
      }
    });
  }

  // Cerrar modal de ubicación
  const closeLocationButtons = document.querySelectorAll("[data-close-location-modal]");
  closeLocationButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleLocationModal(false);
      pendingWhatsappAction = null;
    });
  });

  // Cerrar modal de ubicación al hacer clic fuera
  if (locationModal) {
    locationModal.addEventListener("click", (event) => {
      if (event.target === locationModal) {
        toggleLocationModal(false);
        pendingWhatsappAction = null;
      }
    });
  }

  // Cerrar cualquier modal con ESC
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleModal(false);
      if (locationModal && !locationModal.classList.contains("hidden")) {
        toggleLocationModal(false);
        pendingWhatsappAction = null;
      }
      if (privacidadModal && !privacidadModal.classList.contains("hidden")) {
        toggleLegalModal("privacidad-modal", false);
      }
      if (terminosModal && !terminosModal.classList.contains("hidden")) {
        toggleLegalModal("terminos-modal", false);
      }
    }
  });
};

const initYear = () => {
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }
};

const initForm = () => {
  form?.addEventListener("submit", handleSubmit);
  pageForm?.addEventListener("submit", handleSubmit);
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
  const video = document.getElementById("video-prestamo");
  
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
    video.parentElement.appendChild(errorMsg);
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
            .catch((error) => {
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

updateWhatsappLinks();
initModal();
initForm();
initYear();
initAnimations();
initMobileMenu();
initVideoAutoplay();

