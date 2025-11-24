## Arquitectura Frontend

- **Stack:** Sitio totalmente estático (HTML + CSS + JS vanilla). No hay bundlers ni dependencias de Node; basta con abrir `index.html` en cualquier hosting/CDN.
- **Renderizado:** Todo vive en `index.html`. El formulario/modal y las animaciones se controlan con `main.js`, que ejecuta la lógica al cargar.
- **Componentes clave:**
  - Secciones principales construidas directamente en el HTML (Hero, checklist, beneficios, autoridad, proceso, FAQ, testimonios).
  - `modal-backdrop` + formulario de datos para disparar el mensaje prellenado en WhatsApp.
  - Botón flotante de WhatsApp siempre visible.
- **Estilo:** `styles.css` concentra la paleta (Verde #0BA360, Blanco #FFFFFF, Gris #1A1A1A, Rojo #E53935), tipografía Manrope desde Google Fonts y animaciones `fade-up`.
- **SEO:** Metadatos y JSON-LD (`LocalBusiness`, `FAQPage`) incrustados en `index.html`. Al ser archivos estáticos, se pueden servir desde GitHub Pages, Vercel (modo static) o cualquier bucket.
- **Accesibilidad:** Headings jerárquicos, `aria-label` en botones flotantes, foco controlado en el modal, compatibilidad `prefers-reduced-motion`.

