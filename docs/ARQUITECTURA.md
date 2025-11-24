## Arquitectura Frontend

- **Stack:** Next.js 15 (App Router), TypeScript estricto, CSS modular a través de `globals.css` + utilidades personalizadas. Sin Tailwind.
- **Renderizado:** Página estática (Static Rendering) apta para despliegue en Vercel/GitHub Pages. Sin dependencias de datos dinámicos en build.
- **Componentes clave:**
  - `LandingPage`: orquesta todas las secciones.
  - `Hero`, `EligibilityChecklist`, `BenefitGrid`, `AuthorityCards`, `Timeline`, `FAQAccordion`, `Testimonials`.
  - `LeadFormModal` (cliente) maneja formulario/validación básica y dispara deeplink a WhatsApp.
  - `FloatingWhatsAppButton` mantiene CTA visible.
- **Estilo:** Variables CSS globales para paleta (Verde #0BA360, Blanco #FFFFFF, Gris #1A1A1A, Rojo #E53935). Animaciones `fade-in` via `@keyframes` y `prefers-reduced-motion`.
- **SEO:** Uso de `metadata` en `layout.tsx`, etiquetas `meta`, `link rel=canonical`, y `Script` con JSON-LD (`LocalBusiness`, `FAQPage`).
- **Accesibilidad:** Headings jerárquicos, etiquetas `aria`, foco para modal, `prefers-reduced-motion`, texto alternativo en imágenes.

