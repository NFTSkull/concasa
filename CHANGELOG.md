# CHANGELOG

## B0 - 2025-11-24
- Se configuró Next.js 15 con TypeScript, Vitest y alias `@/*` para el sitio estático.
- Se documentó el producto en `/docs` y se definió el contrato del formulario (WhatsApp + `action_log`).
- Se implementó la landing completa (hero, beneficios, proceso, FAQ, testimonios, modal, botón flotante) con estilos premium y esquemas SEO.
- Se agregaron pruebas unitarias básicas y scripts de calidad (`lint`, `typecheck`, `test`).

## B1 - 2025-11-24
- Se migró la landing a un sitio 100% estático (HTML + CSS + JS) para simplificar despliegues vía Git/Vercel/GitHub Pages.
- Se reescribió el modal, validaciones y logging (`action_log`) en `main.js`, manteniendo el flujo de WhatsApp prellenado.
- Se actualizó la documentación (`/docs`) para reflejar la nueva arquitectura y plan de pruebas manuales.

## B2 - 2025-11-24
- Se rediseñó la UI para ofrecer una experiencia premium y persuasiva (hero con panel de métricas, strip de confianza, panel de contacto y layout modular sin emojis).
- Se modernizó la capa visual (`styles.css`) con gradientes, cards y tipografía consistente; se actualizaron los CTAs y se agregaron nuevos puntos de contacto.

## B3 - 2025-01-XX
- Se implementó tracking de conversiones de Google Ads en `lib/analytics.js`.
- Se creó página de agradecimiento (`gracias.html`) a la que se redirige después de enviar el formulario exitosamente.
- Se modificó el flujo del formulario para disparar evento de conversión de Google Ads antes de redirigir a la página de agradecimiento.
- Se agregó Google Tag (gtag.js) a `contacto.html` para asegurar tracking en todas las páginas.
- IMPORTANTE: Reemplazar `AW-CONVERSION_ID/CONVERSION_LABEL` en `lib/analytics.js` con los valores reales proporcionados por Google Ads.

## B4 - 2025-01-20
- Se optimizaron los estilos del modal de WhatsApp (`#whatsapp-modal`) para todos los dispositivos (Android, iPhone, tablets).
- Mejoras de accesibilidad: touch targets mínimos de 44-48px, fuentes de 16px para evitar zoom en iOS.
- Se agregaron media queries específicas para: pantallas pequeñas (<=360px), landscape móvil, tablets, iOS Safari, y Android Chrome.
- Safe areas para iPhone con notch (`env(safe-area-inset-bottom)`).
- Altura dinámica del viewport (`100dvh`) para manejo correcto del teclado virtual.
- Animaciones de entrada/salida suaves con soporte para `prefers-reduced-motion`.
- Feedback táctil mejorado con estados `:active` para todos los elementos interactivos.

