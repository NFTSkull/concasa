# DEVLOG

## 2025-11-24 — B0
- **Stack:** Se eligió Next.js 15 (compatible con Node 18 disponible) con renderizado estático, CSS personalizado y Vitest para pruebas ligeras.
- **Docs:** Se crearon `/docs/PRODUCTO`, `/ARQUITECTURA`, `/API_CONTRATOS`, `/TEST_PLAN`, `/RIESGOS` para cumplir con la guía y dejar rastro del alcance (solo deeplink a WhatsApp + `action_log` en memoria).
- **UI/UX:** Se definió la paleta (verde #0BA360, blanco, gris oscuro, acento rojo) y animaciones `fade-up` coherentes con la imagen legal-fintech solicitada.
- **Integración:** El formulario abre WhatsApp con mensaje prellenado y registra cada envío en `action_log`. El número puede sobreescribirse via `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- **SEO:** Se añadió metadata completa, LocalBusiness + FAQ schema y textos con keywords de Infonavit/Subcuenta para posicionamiento orgánico.

