"use client";

import Image from "next/image";
import { useState } from "react";
import {
  authorityCards,
  benefits,
  companyInfo,
  defaultWhatsappMessage,
  eligibilityChecklist,
  faqItems,
  heroCopy,
  processSteps,
  subaccountExplainer,
  testimonials,
} from "@/content/site";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import LeadFormModal from "./LeadFormModal";

const whatsappHref = `https://wa.me/${companyInfo.whatsappNumber}?text=${encodeURIComponent(defaultWhatsappMessage)}`;
const phoneHref = companyInfo.phone.replace(/\s+/g, "");

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [origin, setOrigin] = useState("hero");

  const handleModal = (ctaOrigin: string) => {
    setOrigin(ctaOrigin);
    setIsModalOpen(true);
  };

  return (
    <>
      <header className="site-header">
        <div>
          <p className="eyebrow">ConCasa</p>
          <strong>Soluciones Inmobiliarias</strong>
        </div>
        <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-outline">
          Hablar por WhatsApp
        </a>
      </header>

      <main>
        <section className="hero fade-up" id="inicio">
          <div className="hero-content">
            <p className="eyebrow">Subcuenta de Vivienda Infonavit</p>
            <h1>{heroCopy.title}</h1>
            <p className="lead">{heroCopy.subtitle}</p>
            <ul className="hero-bullets">
              {heroCopy.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="hero-ctas">
              <button type="button" className="btn btn-primary" onClick={() => handleModal("hero")}>
                Revisar si tengo dinero
              </button>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-ghost">
                Hablar por WhatsApp
              </a>
            </div>
          </div>
          <div className="hero-media">
            <Image
              src={heroCopy.heroImage}
              alt="Asesora profesional de ConCasa revisando documentos"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="hero-image"
              priority
            />
          </div>
        </section>

        <section className="section fade-up">
          <div className="section-content">
            <div>
              <p className="eyebrow">Claridad total</p>
              <h2>{subaccountExplainer.title}</h2>
              <p>{subaccountExplainer.description}</p>
            </div>
            <aside className="highlight-box">{subaccountExplainer.highlight}</aside>
          </div>
        </section>

        <section className="section fade-up" id="eligibility">
          <div className="section-header">
            <p className="eyebrow">Check rápido</p>
            <h2>¿Quién puede recuperar su dinero?</h2>
          </div>
          <div className="checklist">
            {eligibilityChecklist.map((item) => (
              <div key={item} className="check-item">
                <span>✔</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary center" onClick={() => handleModal("eligibility")}>
            Quiero saber si aplico
          </button>
        </section>

        <section className="section fade-up">
          <div className="section-header">
            <p className="eyebrow">Ventajas ConCasa</p>
            <h2>Beneficios que puedes sentir</h2>
          </div>
          <div className="grid grid-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="card">
                <div className="icon-circle">{benefit.icon}</div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section fade-up alt">
          <div className="section-header">
            <p className="eyebrow">Autoridad</p>
            <h2>¿Por qué elegir a ConCasa?</h2>
          </div>
          <div className="grid grid-2">
            {authorityCards.map((card) => (
              <article key={card.title} className="card tall">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section fade-up">
          <div className="section-header">
            <p className="eyebrow">Proceso claro</p>
            <h2>Paso a paso</h2>
          </div>
          <div className="timeline">
            {processSteps.map((step) => (
              <div key={step.title} className="timeline-step">
                <span>{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section fade-up faq">
          <div className="section-header">
            <p className="eyebrow">FAQ</p>
            <h2>Preguntas frecuentes</h2>
          </div>
          <div className="faq-list">
            {faqItems.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section fade-up">
          <div className="section-header">
            <p className="eyebrow">Confianza real</p>
            <h2>Testimonios</h2>
          </div>
          <div className="grid grid-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.quote} className="card quote">
                <p>“{testimonial.quote}”</p>
                <strong>
                  {testimonial.author} — {testimonial.location}
                </strong>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>{companyInfo.name}</strong>
          <p>{companyInfo.headline}</p>
          <p>
            {companyInfo.address.streetAddress}, {companyInfo.address.addressLocality},{" "}
            {companyInfo.address.addressRegion}
          </p>
        </div>
        <div className="footer-links">
          <a href={`tel:${phoneHref}`} aria-label="Llamar a ConCasa">
            {companyInfo.phone}
          </a>
          <a href={`mailto:${companyInfo.email}`} aria-label="Enviar correo a ConCasa">
            {companyInfo.email}
          </a>
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            WhatsApp directo
          </a>
          <a href="#aviso-privacidad">Aviso de privacidad</a>
          <a href="#terminos">Términos y condiciones</a>
        </div>
        <div className="legal">
          <p id="aviso-privacidad">
            Aviso de privacidad: usamos tu información únicamente para validar tu Subcuenta de Vivienda y contactarte por
            WhatsApp.
          </p>
          <p id="terminos">
            Términos y condiciones: ConCasa actúa como gestor independiente; pagas honorarios únicamente cuando recibes tu
            dinero.
          </p>
        </div>
        <p className="copyright">© {new Date().getFullYear()} ConCasa. Todos los derechos reservados.</p>
      </footer>

      <FloatingWhatsAppButton />
      <LeadFormModal isOpen={isModalOpen} origin={origin} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default LandingPage;

