## Plan de Pruebas

1. **Validación HTML/CSS (manual)**  
   - Abrir `index.html` en el navegador y revisar consola para asegurar que no existan errores.
   - Pasar el archivo por [W3C Validator](https://validator.w3.org/) cuando sea necesario.
2. **Smoke tests funcionales**  
   - Confirmar que todos los botones con `data-whatsapp-link` abren `wa.me` con el mensaje base.
   - Abrir/cerrar el modal desde los distintos CTAs (hero y checklist) y verificar que limpia el formulario tras enviar.
   - Enviar el formulario con datos válidos y revisar que el mensaje generado contenga todos los campos requeridos.
3. **Pruebas manuales responsivas**  
   - Revisar en 360px, 768px y 1280px para asegurar que grids/hero se adapten correctamente.
4. **Accesibilidad**  
   - Recorrer la página con teclado (Tab/Shift+Tab) para confirmar foco visible y cierre del modal con `Esc`.
   - Revisar `prefers-reduced-motion` desactivando animaciones.

