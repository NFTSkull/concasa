# DEVLOG

## 2025-11-24 — B0
- **Stack:** Se eligió Next.js 15 (compatible con Node 18 disponible) con renderizado estático, CSS personalizado y Vitest para pruebas ligeras.
- **Docs:** Se crearon `/docs/PRODUCTO`, `/ARQUITECTURA`, `/API_CONTRATOS`, `/TEST_PLAN`, `/RIESGOS` para cumplir con la guía y dejar rastro del alcance (solo deeplink a WhatsApp + `action_log` en memoria).
- **UI/UX:** Se definió la paleta (verde #0BA360, blanco, gris oscuro, acento rojo) y animaciones `fade-up` coherentes con la imagen legal-fintech solicitada.
- **Integración:** El formulario abre WhatsApp con mensaje prellenado y registra cada envío en `action_log`. El número puede sobreescribirse via `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- **SEO:** Se añadió metadata completa, LocalBusiness + FAQ schema y textos con keywords de Infonavit/Subcuenta para posicionamiento orgánico.

## 2025-11-24 — B1
- **Migración:** Se eliminó el stack de Next.js y se dejó una landing totalmente estática (`index.html`, `styles.css`, `main.js`) para facilitar pushes y deploys sin dependencias.
- **Funcionalidad:** El modal, validaciones y `action_log` ahora viven en JS vanilla; los enlaces de WhatsApp se generan dinámicamente con `data-whatsapp-link`.
- **SEO/Schema:** JSON-LD de LocalBusiness y FAQ se incrustó directamente en el HTML, manteniendo la estrategia anterior.
- **Docs:** Se actualizaron `/docs/ARQUITECTURA`, `/TEST_PLAN`, `/RIESGOS` y el changelog para reflejar el nuevo enfoque.

## 2025-11-24 — B2
- **UI/UX:** Se rediseñó por completo la superficie (hero con métricas, franja de confianza, tarjetas de elegibilidad, grid de valor, panel de contacto) siguiendo un estilo consultoría legal-fintech.
- **Copy:** Se reforzó el mensaje persuasivo resaltando beneficios tangibles, tiempos y condiciones sin usar emojis; todos los CTAs conducen a WhatsApp o al modal.
- **Estilos:** `styles.css` ahora maneja gradientes, sombras suaves, badges y animaciones `fade-up` controladas con IntersectionObserver.

## 2025-01-XX — B3
- **Analytics:** Se implementó tracking de conversiones de Google Ads mediante función `trackGoogleAdsConversion` en `lib/analytics.js`. La función dispara evento `conversion` usando `gtag('event', 'conversion', { send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL' })`.
- **Flujo de formulario:** Se modificó `handleSubmit` en `main.js` para disparar conversión de Google Ads antes de redirigir. El flujo ahora redirige a `/gracias.html` después del submit exitoso en lugar de redirigir directamente a WhatsApp.
- **Página de agradecimiento:** Se creó `gracias.html` con diseño consistente que confirma al usuario que su solicitud fue recibida. Incluye Google Tag para tracking continuo.
- **Tracking universal:** Se agregó Google Tag (gtag.js) a `contacto.html` para asegurar que GA4 esté disponible en todas las páginas del sitio.
- **Nota importante:** Se debe reemplazar `AW-CONVERSION_ID/CONVERSION_LABEL` en `lib/analytics.js` con los valores reales proporcionados por Google Ads al configurar la acción de conversión.

## 2025-01-20 — B4
- **UI/UX Modal WhatsApp:** Se refactorizó completamente el CSS del modal `#whatsapp-modal` para garantizar una experiencia óptima en todos los dispositivos.
- **Decisiones técnicas:**
  - **Touch targets:** Se aumentaron los tamaños mínimos de botones e inputs a 44-48px para cumplir con WCAG 2.1 (target size).
  - **Font size iOS:** Se fijó `font-size: 16px` en inputs para evitar el zoom automático de Safari en iOS al enfocar campos.
  - **Viewport dinámico:** Se usó `100dvh` (dynamic viewport height) que considera la barra de navegación y teclado virtual en móvil.
  - **Safe areas iPhone:** Se aplicó `env(safe-area-inset-bottom)` al padding inferior para iPhones con notch.
  - **Media queries específicas:** Se crearon breakpoints para pantallas muy pequeñas (<=360px), landscape móvil (max-height: 500px), tablets (768-1024px), iOS Safari (`@supports (-webkit-touch-callout: none)`), y Android Chrome (`-webkit-min-device-pixel-ratio`).
  - **Accesibilidad:** Se respeta `prefers-reduced-motion` desactivando animaciones para usuarios sensibles.
  - **Feedback táctil:** Estados `:active` con `transform: scale()` para todos los elementos clicables, mejorando la percepción de interactividad.
- **Pruebas recomendadas:** Verificar en Chrome DevTools (responsive), Safari iOS (simulador o dispositivo real), y Android Chrome.

