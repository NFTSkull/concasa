"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { companyInfo } from "@/content/site";
import { logLeadAction } from "@/lib/action-log";

type LeadFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
};

type FormState = {
  fullName: string;
  nss: string;
  birthDate: string;
  phone: string;
  whatsapp: string;
};

const initialState: FormState = {
  fullName: "",
  nss: "",
  birthDate: "",
  phone: "",
  whatsapp: "",
};

const LeadFormModal = ({ isOpen, onClose, origin }: LeadFormModalProps) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<keyof FormState, string>>({
    fullName: "",
    nss: "",
    birthDate: "",
    phone: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormState(initialState);
      setErrors({
        fullName: "",
        nss: "",
        birthDate: "",
        phone: "",
        whatsapp: "",
      });
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const formTitle = useMemo(
    () => (origin === "eligibility" ? "¿Aplicas? Revisemos tus datos" : "Revisar si tengo dinero"),
    [origin],
  );

  const validate = () => {
    const nextErrors: Record<keyof FormState, string> = {
      fullName: "",
      nss: "",
      birthDate: "",
      phone: "",
      whatsapp: "",
    };
    nextErrors.fullName = formState.fullName.trim().length < 3 ? "Ingresa tu nombre completo." : "";
    nextErrors.nss =
      formState.nss.trim().length < 10 || !/^\d+$/.test(formState.nss.trim())
        ? "Ingresa tu número de afiliación (solo números)."
        : "";
    nextErrors.birthDate =
      !/^\d{2}\/\d{2}\/\d{4}$/.test(formState.birthDate.trim())
        ? "Formato DD/MM/AAAA."
        : "";
    nextErrors.phone =
      formState.phone.trim().length < 10 ? "Incluye lada a 10 dígitos." : "";
    nextErrors.whatsapp =
      formState.whatsapp.trim().length < 10 ? "Tu WhatsApp debe tener 10 dígitos." : "";

    setErrors(nextErrors);
    return Object.values(nextErrors).every((error) => error === "");
  };

  const handleChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const message = encodeURIComponent(
      [
        "Hola, quiero conocer el saldo de mi Subcuenta de Vivienda.",
        "",
        "Mis datos son:",
        `Nombre completo: ${formState.fullName}`,
        `Número de afiliación IMSS: ${formState.nss}`,
        `Fecha de nacimiento: ${formState.birthDate}`,
        `Teléfono: ${formState.phone}`,
        `WhatsApp: ${formState.whatsapp}`,
        "",
        "Gracias.",
      ].join("\n"),
    );

    logLeadAction({
      timestamp: new Date().toISOString(),
      nombre: formState.fullName,
      origenCTA: origin,
    });

    const whatsappUrl = `https://wa.me/${companyInfo.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Formulario de revisión de saldo">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{formTitle}</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar formulario">
            ×
          </button>
        </div>
        <p className="modal-subtitle">
          Ingresa tus datos y abriremos WhatsApp con el mensaje listo para enviarlo.
        </p>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              type="text"
              value={formState.fullName}
              onChange={handleChange("fullName")}
              required
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <span className="error">{errors.fullName}</span>}
          </label>
          <label>
            Número de afiliación IMSS
            <input
              type="text"
              value={formState.nss}
              onChange={handleChange("nss")}
              required
              inputMode="numeric"
              aria-invalid={!!errors.nss}
            />
            {errors.nss && <span className="error">{errors.nss}</span>}
          </label>
          <label>
            Fecha de nacimiento (DD/MM/AAAA)
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={formState.birthDate}
              onChange={handleChange("birthDate")}
              required
              aria-invalid={!!errors.birthDate}
            />
            {errors.birthDate && <span className="error">{errors.birthDate}</span>}
          </label>
          <label>
            Teléfono
            <input
              type="tel"
              value={formState.phone}
              onChange={handleChange("phone")}
              required
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <span className="error">{errors.phone}</span>}
          </label>
          <label>
            WhatsApp
            <input
              type="tel"
              value={formState.whatsapp}
              onChange={handleChange("whatsapp")}
              required
              aria-invalid={!!errors.whatsapp}
            />
            {errors.whatsapp && <span className="error">{errors.whatsapp}</span>}
          </label>
          <button type="submit" className="btn btn-primary">
            Revisar si tengo dinero
          </button>
          <p className="privacy-note">
            Tus datos se usan solo para revisar tu Subcuenta y continuar el proceso vía WhatsApp.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;

