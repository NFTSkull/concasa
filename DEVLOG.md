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

