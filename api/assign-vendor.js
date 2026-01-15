/**
 * API Endpoint: Asignación de vendedor usando Round Robin
 * 
 * Este endpoint implementa el algoritmo round robin para distribuir
 * leads entre los 20 vendedores de forma equitativa.
 * 
 * Método: POST
 * Body: (vacío, no se necesitan datos del lead por ahora)
 * 
 * Respuesta exitosa:
 * {
 *   success: true,
 *   vendor: {
 *     id: 1,
 *     name: "Cleber",
 *     phone: "8181781697",
 *     lead_count: 5
 *   }
 * }
 * 
 * Respuesta con error:
 * {
 *   success: false,
 *   error: "Mensaje de error descriptivo"
 * }
 */

const { getSupabaseClient } = require('../lib/supabaseServer');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // Configurar CORS para permitir peticiones desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Obtener cliente de Supabase
    const supabase = getSupabaseClient();

    // Paso 1: Obtener todos los vendedores activos ordenados por order_index
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (vendorsError) {
      console.error('[Error obteniendo vendedores]', vendorsError);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener lista de vendedores'
      });
    }

    // Validar que hay vendedores disponibles
    if (!vendors || vendors.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No hay vendedores disponibles en la base de datos'
      });
    }

    const totalVendors = vendors.length;

    // Paso 2: Leer el estado actual del queue (last_index)
    const { data: queueState, error: queueError } = await supabase
      .from('queue_state')
      .select('last_index')
      .eq('id', 1)
      .single();

    if (queueError && queueError.code !== 'PGRST116') {
      // PGRST116 = no se encontró el registro, pero eso está bien (usaremos -1)
      console.error('[Error obteniendo queue_state]', queueError);
      return res.status(500).json({
        success: false,
        error: 'Error al leer estado del queue'
      });
    }

    // Si no existe el registro, asumir last_index = -1
    const lastIndex = queueState?.last_index ?? -1;

    // Paso 3: Calcular el siguiente índice usando round robin
    // lastIndex = -1 significa que es el primer lead, asignamos al índice 0
    const nextIndex = (lastIndex + 1) % totalVendors;
    const assignedVendor = vendors[nextIndex];

    // Paso 4: Actualizar el estado del queue y el contador del vendedor
    // Usamos una transacción implícita con múltiples updates

    // 4a. Actualizar queue_state.last_index
    const { error: updateQueueError } = await supabase
      .from('queue_state')
      .upsert({
        id: 1,
        last_index: nextIndex
      }, {
        onConflict: 'id'
      });

    if (updateQueueError) {
      console.error('[Error actualizando queue_state]', updateQueueError);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar estado del queue'
      });
    }

    // 4b. Incrementar lead_count del vendedor asignado
    const { data: updatedVendor, error: updateVendorError } = await supabase
      .from('vendors')
      .update({
        lead_count: assignedVendor.lead_count + 1
      })
      .eq('id', assignedVendor.id)
      .select()
      .single();

    if (updateVendorError) {
      console.error('[Error actualizando lead_count]', updateVendorError);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar contador de leads'
      });
    }

    // ============================================
    // 🎯 HISTORIAL: guardar asignación en lead_assignments
    // (después de actualizar lead_count, antes del log)
    // ============================================

    const userAgent = req.headers["user-agent"] || null;

    // IP (hash, para no guardar IP cruda)
    const ipRaw =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      null;

    const ipHash = ipRaw
      ? crypto.createHash("sha256").update(ipRaw).digest("hex")
      : null;

    // Datos opcionales desde el frontend (si los mandas en req.body)
    const body = req.body || {};
    const {
      channel = "web",
      event_name = "lead",
      fbclid = null,
      gclid = null,
      utm_source = null,
      utm_medium = null,
      utm_campaign = null,
      utm_content = null,
      utm_term = null,
      landing_path = null,
      origen_cta = null,
    } = body;

    // Aceptar tanto snake_case como camelCase por seguridad
    const lead_full_name = body.lead_full_name ?? body.fullName ?? null;
    const lead_imss = body.lead_imss ?? body.nss ?? null;
    const lead_birth_date = body.lead_birth_date ?? body.birthDate ?? null;
    const lead_whatsapp = body.lead_whatsapp ?? body.whatsapp ?? null;

    // REGLA: si event_name === "form_submit" entonces los 4 campos son OBLIGATORIOS
    if (event_name === "form_submit") {
      if (!lead_full_name || !lead_imss || !lead_birth_date || !lead_whatsapp) {
        const missingFields = [];
        if (!lead_full_name) missingFields.push('lead_full_name');
        if (!lead_imss) missingFields.push('lead_imss');
        if (!lead_birth_date) missingFields.push('lead_birth_date');
        if (!lead_whatsapp) missingFields.push('lead_whatsapp');
        
        console.error("[assign-vendor] Missing lead fields for form_submit:", missingFields);
        return res.status(400).json({
          success: false,
          error: `Missing lead fields: ${missingFields.join(', ')}`
        });
      }
    }

    // Helper para normalizar strings (trim y null si queda vacío)
    const normalizeString = (value) => {
      if (!value) return null;
      const trimmed = String(value).trim();
      return trimmed || null;
    };

    // Helper para normalizar fecha a YYYY-MM-DD
    const normalizeDate = (value) => {
      if (!value) return null;
      const dateStr = String(value).trim();
      
      // Intentar formato DD/MM/YYYY
      const ddMMyyyyMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddMMyyyyMatch) {
        const [, day, month, year] = ddMMyyyyMatch;
        return `${year}-${month}-${day}`;
      }
      
      // Intentar formato YYYY-MM-DD
      const yyyyMMddMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (yyyyMMddMatch) {
        return dateStr;
      }
      
      // Si no cumple ningún formato, retornar null
      return null;
    };

    // Normalizar datos
    const normalizedLeadFullName = normalizeString(lead_full_name);
    const normalizedLeadImss = normalizeString(lead_imss);
    const normalizedLeadBirthDate = normalizeDate(lead_birth_date);
    const normalizedLeadWhatsapp = normalizeString(lead_whatsapp);

    // Log mínimo en desarrollo (solo keys, sin datos sensibles)
    const isDevelopment = process.env.NODE_ENV !== 'production' || 
                         process.env.VERCEL_ENV !== 'production';
    if (isDevelopment) {
      console.log("[assign-vendor] Body received - keys:", Object.keys(body));
      console.log("[assign-vendor] Lead fields resolved:", {
        has_full_name: !!normalizedLeadFullName,
        has_imss: !!normalizedLeadImss,
        has_birth_date: !!normalizedLeadBirthDate,
        has_whatsapp: !!normalizedLeadWhatsapp,
      });
    }

    // Crear payload explícito para el insert
    const payload = {
      vendor_id: updatedVendor.id,
      vendor_name: updatedVendor.name,
      vendor_phone: updatedVendor.phone,

      channel,
      event_name,

      fbclid,
      gclid,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,

      landing_path,
      user_agent: userAgent,
      ip_hash: ipHash,
      
      // Datos del formulario (normalizados)
      lead_name: normalizedLeadFullName,
      lead_nss: normalizedLeadImss,
      lead_birth_date: normalizedLeadBirthDate,
      lead_whatsapp: normalizedLeadWhatsapp,
      origen_cta: origen_cta || null,
    };

    const { data: insertedLead, error: insertHistoryError } = await supabase
      .from("lead_assignments")
      .insert(payload)
      .select('id')
      .single();

    if (insertHistoryError) {
      // NO rompas la asignación si falla el historial: solo loguea
      console.error("[Error insertando lead_assignments]", insertHistoryError);
    }

    // Paso 5: Log de la asignación (para debugging)
    console.log(
      `[Round Robin] Lead asignado a: ${assignedVendor.name} ` +
      `(${assignedVendor.phone}) - Total leads: ${updatedVendor.lead_count}`
    );

    // Generar whatsapp_url con mensaje personalizado si hay datos del formulario
    let whatsappUrl = null;
    if (event_name === "form_submit" && normalizedLeadFullName && normalizedLeadWhatsapp) {
      // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY para el mensaje
      const formatDateForMessage = (dateStr) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
      };

      const message = [
        "Hola, quiero solicitar el préstamo de Subcuenta de Vivienda con 11% de interés.",
        "",
        "Soy trabajador activo que cotiza en Infonavit y me interesa el préstamo más amigable.",
        "",
        "Mis datos son:",
        `Nombre completo: ${normalizedLeadFullName}`,
        `Número de afiliación IMSS: ${normalizedLeadImss || 'N/A'}`,
        `Fecha de nacimiento: ${formatDateForMessage(normalizedLeadBirthDate) || 'N/A'}`,
        `WhatsApp: ${normalizedLeadWhatsapp}`,
        "",
        "Gracias.",
      ].join("\n");

      whatsappUrl = `https://wa.me/52${updatedVendor.phone}?text=${encodeURIComponent(message)}`;
    }

    // Paso 6: Retornar respuesta exitosa
    return res.status(200).json({
      success: true,
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        phone: updatedVendor.phone,
        lead_count: updatedVendor.lead_count
      },
      lead_assignment_id: insertedLead?.id || null,
      whatsapp_url: whatsappUrl
    });

  } catch (error) {
    // Manejo de errores inesperados
    console.error('[Error inesperado en assign-vendor]', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al asignar vendedor'
    });
  }
};
