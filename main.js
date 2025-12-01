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
const actionLog = [];

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

const updateWhatsappLinks = () => {
  whatsappLinks.forEach((link) => {
    // Agregar event listener para asignar vendedor al hacer clic
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const assignedPhone = await assignVendor();
      const url = withWhatsappUrl(DEFAULT_MESSAGE, assignedPhone);
      
      logLeadAction({
        timestamp: new Date().toISOString(),
        origenCTA: "direct-whatsapp",
        vendedorAsignado: assignedPhone,
      });

      // Usar location.href en lugar de window.open mejora compatibilidad
      // con navegadores móviles (especialmente Safari en iOS)
      window.location.href = url;
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

const initModal = () => {
  openModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const origin = button.getAttribute("data-open-modal") ?? "hero";
      setModalOrigin(origin);
      toggleModal(true);
      const firstInput = form.querySelector("input[name='fullName']");
      firstInput?.focus();
    });
  });

  closeModalButton?.addEventListener("click", () => toggleModal(false));

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      toggleModal(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleModal(false);
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

updateWhatsappLinks();
initModal();
initForm();
initYear();
initAnimations();
initMobileMenu();

