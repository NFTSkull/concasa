## Plan de Pruebas

1. **npm run lint**  
   - Asegura estilo y reglas Next/TypeScript.
2. **npm run typecheck**  
   - Ejecuta `tsc --noEmit` para detectar errores de tipos.
3. **npm test** (Vitest + React Testing Library)  
   - Cobertura mínima:
     - Render del hero + CTA principales.
     - Modal de formulario se abre/cierra correctamente.
     - Generación del mensaje de WhatsApp incluye todos los campos.
4. **Pruebas manuales rápidas**  
   - Verificar accesibilidad básica (tab focus, aria labelling).
   - Responsividad en breakpoints 360px, 768px, 1280px.

