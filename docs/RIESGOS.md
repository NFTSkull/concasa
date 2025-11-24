## Riesgos Identificados

1. **Incongruencias legales:** Mensajes ambiguos podrían interpretarse como oferta de crédito. Mantener redacción clara de que es recuperación de fondos propios.
2. **Datos sensibles:** Captura de NSS y fecha de nacimiento requiere aviso de privacidad visible y uso exclusivo para el WhatsApp (sin almacenamiento persistente).
3. **Dependencia de WhatsApp:** Si el usuario no tiene app instalada, se abrirá la versión web. Se debe comunicar que el enlace abrirá WhatsApp.
4. **Deploys manuales:** Al no depender de un framework, la carpeta `index.html + assets` debe subirse completa para evitar 404. Documentar el proceso para cada hosting.
5. **Accesibilidad:** Modal debe manejar foco y permitir cierre con teclado para evitar bloqueos UX.

