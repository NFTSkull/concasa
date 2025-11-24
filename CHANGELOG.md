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

