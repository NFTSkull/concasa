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

    // Paso 1: Obtener todos los vendedores ordenados por order_index
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
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

    // Paso 5: Log de la asignación (para debugging)
    console.log(
      `[Round Robin] Lead asignado a: ${assignedVendor.name} ` +
      `(${assignedVendor.phone}) - Total leads: ${updatedVendor.lead_count}`
    );

    // Paso 6: Retornar respuesta exitosa
    return res.status(200).json({
      success: true,
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        phone: updatedVendor.phone,
        lead_count: updatedVendor.lead_count
      }
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
