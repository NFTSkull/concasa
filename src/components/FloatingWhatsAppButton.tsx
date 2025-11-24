"use client";

import { companyInfo, defaultWhatsappMessage } from "@/content/site";

const message = encodeURIComponent(defaultWhatsappMessage);
const whatsappHref = `https://wa.me/${companyInfo.whatsappNumber}?text=${message}`;

const FloatingWhatsAppButton = () => (
  <a href={whatsappHref} target="_blank" rel="noreferrer" className="floating-wa" aria-label="Abrir WhatsApp con ConCasa">
    Hablar por WhatsApp
  </a>
);

export default FloatingWhatsAppButton;

