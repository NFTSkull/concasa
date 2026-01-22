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
const { sendLeadToMake } = require('../lib/makeWebhook');
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

    // Round Robin: Asignar siguiente vendor usando función PostgreSQL con lock
    const { data: rrRows, error: rrError } = await supabase.rpc('assign_next_vendor', { p_queue_id: 1 });

    if (rrError) {
      console.error('[Error en assign_next_vendor]', rrError);
      return res.status(500).json({
        success: false,
        error: 'Error al asignar vendedor'
      });
    }

    if (!rrRows || rrRows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No se pudo asignar vendedor'
      });
    }

    // Crear objeto updatedVendor con los datos de la RPC
    const updatedVendor = {
      id: rrRows[0].vendor_id,
      name: rrRows[0].vendor_name,
      phone: rrRows[0].vendor_phone,
      lead_count: 0
    };

    // Obtener lead_count actualizado después del incremento en la función SQL
    const { data: vendorData, error: vendorDataError } = await supabase
      .from('vendors')
      .select('lead_count')
      .eq('id', updatedVendor.id)
      .single();

    if (!vendorDataError && vendorData) {
      updatedVendor.lead_count = vendorData.lead_count;
    }

    console.log('[RR]', { next_index: rrRows[0].next_index, vendor_id: updatedVendor.id, vendor_name: updatedVendor.name });

    // ============================================
    // 🎯 HISTORIAL: guardar asignación en lead_assignments
    // (después de actualizar lead_count, antes del log)
    // ============================================

    // Bandera para evitar envío duplicado a Make webhook
    let makeWebhookSent = false;

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
      event_name = "cta_whatsapp_click",
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

    // Mapear campos del formulario por compatibilidad (snake_case y camelCase)
    const lead_full_name = body.lead_full_name ?? body.fullName ?? null;
    const lead_imss = body.lead_imss ?? body.nss ?? null;
    const lead_birth_date = body.lead_birth_date ?? body.birthDate ?? null;
    let lead_whatsapp = body.lead_whatsapp ?? body.whatsapp ?? null;

    // REGLA: si event_name === "form_submit" entonces 3 campos son OBLIGATORIOS (nombre, fecha, whatsapp)
    if (event_name === "form_submit") {
      if (!lead_full_name || !lead_birth_date || !lead_whatsapp) {
        const missingFields = [];
        if (!lead_full_name) missingFields.push('lead_full_name');
        if (!lead_birth_date) missingFields.push('lead_birth_date');
        if (!lead_whatsapp) missingFields.push('lead_whatsapp');
        
        console.error("[assign-vendor] Missing lead fields for form_submit:", missingFields);
        return res.status(400).json({
          success: false,
          error: `Missing lead fields: ${missingFields.join(', ')}`
        });
      }
    }

    // REGLA: si event_name === "whatsapp_modal" entonces nombre y whatsapp son OBLIGATORIOS
    // Mapear lead_name y lead_phone para este flujo
    const lead_name_modal = body.lead_name ?? null;
    const lead_phone_modal = body.lead_phone ?? null;
    
    if (event_name === "whatsapp_modal") {
      if (!lead_name_modal || !lead_phone_modal) {
        const missingFields = [];
        if (!lead_name_modal) missingFields.push('lead_name');
        if (!lead_phone_modal) missingFields.push('lead_phone');
        
        console.error("[assign-vendor] Missing lead fields for whatsapp_modal:", missingFields);
        return res.status(400).json({
          success: false,
          inserted: false,
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

    // Helper para limpiar WhatsApp a solo dígitos
    const normalizeWhatsapp = (value) => {
      if (!value) return null;
      const digitsOnly = String(value).replace(/\D/g, '');
      return digitsOnly || null;
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
    const normalizedLeadWhatsapp = normalizeWhatsapp(lead_whatsapp);

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

    // Detectar tipo de evento para construir insertPayload
    const isCTAClick = event_name === 'cta_whatsapp_click' || !event_name || event_name === 'lead';
    const isWhatsappModal = event_name === 'whatsapp_modal';

    let insertPayload;
    if (isCTAClick) {
      // Para CTA clicks: SOLO campos mínimos
      insertPayload = {
        vendor_id: updatedVendor.id,
        vendor_name: updatedVendor.name,
        vendor_phone: updatedVendor.phone,
        channel,
        event_name: event_name || 'cta_whatsapp_click',
        landing_path
      };
    } else if (isWhatsappModal) {
      // Para whatsapp_modal: insertar en tabla whatsapp_contacts (NO en lead_assignments)
      // Generar mensaje y URL de WhatsApp ANTES del insert
      const normalizedLeadNameModal = normalizeString(lead_name_modal);
      const normalizedLeadPhoneModal = normalizeWhatsapp(lead_phone_modal);
      
      const whatsappMessageForInsert = [
        "Hola, quiero obtener mi préstamo Mejoravit.",
        "",
        "Mis datos son:",
        `Nombre: ${normalizedLeadNameModal}`,
        `WhatsApp: ${normalizedLeadPhoneModal}`,
        "",
        "Gracias.",
      ].join("\n");
      
      const whatsappUrlForInsert = `https://wa.me/52${updatedVendor.phone}?text=${encodeURIComponent(whatsappMessageForInsert)}`;
      
      // Payload con SOLO columnas que existen en whatsapp_contacts
      const whatsappContactsPayload = {
        lead_name: normalizedLeadNameModal,
        lead_phone: normalizedLeadPhoneModal,
        vendor_id: updatedVendor.id,
        vendor_name: updatedVendor.name,
        vendor_phone: updatedVendor.phone,
        origen_cta: origen_cta || null,
        channel,
        landing_path,
        whatsapp_message: whatsappMessageForInsert,
        whatsapp_link_url: whatsappUrlForInsert,
        // assigned_at usa DEFAULT NOW() en la tabla
      };
      
      // INSERT en whatsapp_contacts (tabla separada)
      const { data: insertedContact, error: contactInsertErr } = await supabase
        .from('whatsapp_contacts')
        .insert(whatsappContactsPayload)
        .select('id')
        .single();
      
      if (contactInsertErr) {
        console.error('[assign-vendor] whatsapp_contacts insert error', contactInsertErr);
        return res.status(500).json({
          success: false,
          inserted: false,
          error: 'Error al guardar datos del contacto',
          supabase_error: {
            message: contactInsertErr.message,
            details: contactInsertErr.details,
            hint: contactInsertErr.hint,
            code: contactInsertErr.code,
          },
          vendor: {
            id: updatedVendor.id,
            name: updatedVendor.name,
            phone: updatedVendor.phone,
            lead_count: updatedVendor.lead_count
          }
        });
      }
      
      // INSERT exitoso en whatsapp_contacts
      console.log(`[assign-vendor] whatsapp_contacts insert OK, id=${insertedContact.id}`);
      
      // Calcular fecha/hora en hora de Mexico City (formato: YYYY-MM-DD HH:mm:ss)
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const fechaHoraMxFormatted = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value} ${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}:${parts.find(p => p.type === 'second').value}`;
      
      // Enviar a Make webhook (no bloquea si falla)
      const makePayload = {
        cliente_nombre: normalizedLeadNameModal,
        cliente_telefono: normalizedLeadPhoneModal,
        asesor_nombre: updatedVendor.name,
        fecha_hora_mx: fechaHoraMxFormatted,
      };
      await sendLeadToMake(makePayload);
      
      return res.status(200).json({
        success: true,
        inserted: true,
        whatsapp_contact_id: insertedContact.id,
        vendor: {
          id: updatedVendor.id,
          name: updatedVendor.name,
          phone: updatedVendor.phone,
          lead_count: updatedVendor.lead_count
        },
        whatsapp_url: whatsappUrlForInsert,
        message: whatsappMessageForInsert,
      });
      
    } else {
      // Para form_submit: incluir todos los campos
      insertPayload = {
        vendor_id: updatedVendor.id,
        vendor_name: updatedVendor.name,
        vendor_phone: updatedVendor.phone,

        event_name,
        channel,
        landing_path,

        // Datos del formulario (pueden ser NULL)
        lead_name: normalizedLeadFullName,
        lead_nss: normalizedLeadImss,
        lead_birth_date: normalizedLeadBirthDate,
        lead_whatsapp: normalizedLeadWhatsapp,

        // Metadatos opcionales
        fbclid,
        gclid,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        user_agent: userAgent,
        ip_hash: ipHash,
        origen_cta: origen_cta || null,
      };
    }

    // Insertar en lead_assignments (para CTA clicks y form_submit, NO para whatsapp_modal)
    // whatsapp_modal ya retornó arriba con su propio insert en whatsapp_contacts
    const { data: insertedRows, error: insertErr } = await supabase
      .from('lead_assignments')
      .insert(insertPayload)
      .select('id, fecha_hora_mx');

    let leadAssignmentId = null;
    
    if (insertErr) {
      console.error('[assign-vendor] lead_assignments insert error', insertErr);
      // Para CTA clicks y form_submit: log pero no falla el request
    } else if (insertedRows && insertedRows[0]?.id) {
      leadAssignmentId = insertedRows[0].id;
      
      // Enviar a Make webhook solo si NO se envió antes y hay datos del lead (nombre y teléfono)
      // No enviar para CTA clicks sin datos del lead
      if (!makeWebhookSent) {
        const hasLeadData = (insertPayload.lead_name || insertPayload.lead_full_name) && 
                            (insertPayload.lead_whatsapp || insertPayload.lead_phone);
        
        if (hasLeadData) {
          const insertedAssignment = insertedRows[0];
          const fechaHoraMx = insertedAssignment?.fecha_hora_mx ?? insertPayload?.fecha_hora_mx ?? null;
          const makePayload = {
            cliente_nombre: insertPayload.lead_name || insertPayload.lead_full_name || null,
            cliente_telefono: insertPayload.lead_whatsapp || insertPayload.lead_phone || null,
            asesor_nombre: updatedVendor.name,
            fecha_hora_mx: fechaHoraMx,
          };
          await sendLeadToMake(makePayload);
          makeWebhookSent = true;
        }
      }
    }

    // Paso 5: Log de la asignación (para debugging)
    console.log(
      `[Round Robin] Lead asignado a: ${updatedVendor.name} ` +
      `(${updatedVendor.phone}) - Total leads: ${updatedVendor.lead_count}`
    );

    // Generar whatsapp_url con mensaje personalizado para form_submit
    let whatsappUrl = null;
    let whatsappMessage = null;
    
    if (event_name === "form_submit" && normalizedLeadFullName && normalizedLeadWhatsapp) {
      // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY para el mensaje
      const formatDateForMessage = (dateStr) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
      };

      whatsappMessage = [
        "Hola, quiero solicitar el préstamo de Subcuenta de Vivienda con 11% de interés.",
        "",
        "Soy trabajador activo que cotiza en Infonavit y me interesa el préstamo más amigable.",
        "",
        "Mis datos son:",
        `Nombre completo: ${normalizedLeadFullName}`,
        `Fecha de nacimiento: ${formatDateForMessage(normalizedLeadBirthDate) || 'N/A'}`,
        `WhatsApp: ${normalizedLeadWhatsapp}`,
        "",
        "Gracias.",
      ].join("\n");

      whatsappUrl = `https://wa.me/52${updatedVendor.phone}?text=${encodeURIComponent(whatsappMessage)}`;
    }

    // Paso 6: Retornar respuesta exitosa (para CTA clicks y form_submit)
    // Nota: whatsapp_modal ya retornó arriba con su propia respuesta
    return res.status(200).json({
      success: true,
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        phone: updatedVendor.phone,
        lead_count: updatedVendor.lead_count
      },
      lead_assignment_id: leadAssignmentId,
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
