## Alcance de APIs (Bloque actual)

- **Integración WhatsApp:** El formulario genera un deeplink a `https://wa.me/<NUMERO>?text=<MENSAJE>` con los datos capturados.
- **Sistema Round Robin:** Endpoint `/api/assign-vendor` (POST) que distribuye leads entre 20 vendedores de forma equitativa.
  - Retorna: `{ success: true, vendor: { id, name, phone } }`
  - Implementa algoritmo round robin: asigna el siguiente vendedor en la lista y resetea al llegar al final.
- **Validaciones:** Se deben validar los campos del formulario en cliente (longitud mínima, formato de fecha DD/MM/AAAA) antes de construir el mensaje.
- **action_log:** Registrar cada envío exitoso en el arreglo en memoria `actionLog` (tipo `LeadAction`) para trazabilidad básica. Log debe incluir `timestamp`, `nombre`, `origenCTA` y `vendedorAsignado`.
- **RLS:** No aplica al no haber base de datos; mantener la advertencia para bloques futuros.

Cualquier funcionalidad nueva debe agregarse primero aquí antes de implementarse.


