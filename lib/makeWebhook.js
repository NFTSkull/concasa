/**
 * Helper para enviar leads a Make webhook
 * 
 * Este módulo envía los datos del lead a Make después de que
 * se haya guardado exitosamente en Supabase.
 * 
 * IMPORTANTE: Si el webhook falla, NO debe afectar el flujo
 * principal. Solo se registra el error en logs.
 */

/**
 * Envía un lead a Make webhook
 * 
 * @param {Object} payload - Datos del lead
 * @param {string|null} payload.cliente_nombre - Nombre del cliente
 * @param {string|null} payload.cliente_telefono - Teléfono del cliente
 * @param {string|null} payload.asesor_nombre - Nombre del asesor asignado
 * @param {string|null} payload.fecha_hora_mx - Fecha y hora en formato México
 */
async function sendLeadToMake(payload) {
  const url = process.env.MAKE_WEBHOOK_URL || "https://hook.us2.make.com/e127p115fdc8mgk4cn1urbhmyrruw7iw";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[MAKE_WEBHOOK] non-200", res.status, text);
    } else {
      console.log("[MAKE_WEBHOOK] success", payload);
    }
  } catch (err) {
    console.error("[MAKE_WEBHOOK] failed", err);
  }
}

module.exports = { sendLeadToMake };
