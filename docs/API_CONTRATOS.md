## Alcance de APIs (Bloque actual)

- **Integración WhatsApp:** Único flujo permitido. El formulario genera un deeplink a `https://wa.me/<NUMERO>?text=<MENSAJE>` con los datos capturados.
- **Sin backend:** No se expone/consume API interna ni endpoint externo adicional en este bloque.
- **Validaciones:** Se deben validar los campos del formulario en cliente (longitud mínima, formato de fecha DD/MM/AAAA) antes de construir el mensaje.
- **action_log:** Registrar cada envío exitoso en el arreglo en memoria `actionLog` (tipo `LeadAction`) para trazabilidad básica. Log debe incluir `timestamp`, `nombre` y `origenCTA`.
- **RLS:** No aplica al no haber base de datos; mantener la advertencia para bloques futuros.

Cualquier funcionalidad nueva debe agregarse primero aquí antes de implementarse.

