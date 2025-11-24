const WHATSAPP_NUMBER = "5218112345678";
const DEFAULT_MESSAGE = "Hola, quiero conversar con un asesor de ConCasa.";

const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
const modal = document.getElementById("lead-modal");
const modalTitle = document.getElementById("modal-title");
const openModalButtons = document.querySelectorAll("[data-open-modal]");
const closeModalButton = document.querySelector("[data-close-modal]");
const form = document.getElementById("lead-form");
const originInput = document.getElementById("cta-origin");
const currentYear = document.getElementById("current-year");
const actionLog = [];

const withWhatsappUrl = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

const toggleModal = (isOpen) => {
  if (!modal) return;
  modal.classList.toggle("hidden", !isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
};

const updateWhatsappLinks = () => {
  whatsappLinks.forEach((link) => {
    link.href = withWhatsappUrl(DEFAULT_MESSAGE);
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

const showError = (field, message) => {
  const errorSpan = document.querySelector(`[data-error-for="${field}"]`);
  if (errorSpan) {
    errorSpan.textContent = message;
  }
};

const clearErrors = () => {
  document.querySelectorAll(".error").forEach((error) => (error.textContent = ""));
};

const validateForm = (data) => {
  let isValid = true;
  const fullName = data.get("fullName")?.trim() ?? "";
  const nss = data.get("nss")?.trim() ?? "";
  const birthDate = data.get("birthDate")?.trim() ?? "";
  const phone = data.get("phone")?.trim() ?? "";
  const whatsapp = data.get("whatsapp")?.trim() ?? "";

  if (fullName.length < 3) {
    showError("fullName", "Ingresa tu nombre completo.");
    isValid = false;
  }
  if (nss.length < 10 || !/^\d+$/.test(nss)) {
    showError("nss", "Ingresa tu número de afiliación (solo números).");
    isValid = false;
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
    showError("birthDate", "Formato DD/MM/AAAA.");
    isValid = false;
  }
  if (phone.length < 10) {
    showError("phone", "Incluye lada a 10 dígitos.");
    isValid = false;
  }
  if (whatsapp.length < 10) {
    showError("whatsapp", "Tu WhatsApp debe tener 10 dígitos.");
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

const handleSubmit = (event) => {
  event.preventDefault();
  clearErrors();
  const formData = new FormData(form);
  const validation = validateForm(formData);
  if (!validation.isValid) return;

  const message = [
    "Hola, quiero conocer el saldo de mi Subcuenta de Vivienda.",
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
  });

  window.open(withWhatsappUrl(message), "_blank", "noopener,noreferrer");
  form.reset();
  toggleModal(false);
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

updateWhatsappLinks();
initModal();
initForm();
initYear();
initAnimations();

