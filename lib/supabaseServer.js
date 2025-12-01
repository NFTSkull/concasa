/**
 * Cliente de Supabase para uso en servidor (API routes)
 * 
 * Este archivo configura el cliente de Supabase usando las credenciales
 * del Service Role Key, que tiene permisos completos para leer/escribir
 * en la base de datos.
 * 
 * IMPORTANTE: Este cliente solo debe usarse en código de servidor (API routes),
 * nunca en el cliente (browser) por seguridad.
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Obtiene el cliente de Supabase configurado para uso en servidor
 * 
 * @returns {Object} Cliente de Supabase
 */
function getSupabaseClient() {
  // Obtener variables de entorno
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validar que las variables estén configuradas
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Faltan variables de entorno de Supabase. ' +
      'Asegúrate de configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  // Crear y retornar el cliente
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

module.exports = { getSupabaseClient };

/**
 * ============================================
 * CONFIGURACIÓN DE VARIABLES DE ENTORNO
 * ============================================
 * 
 * DESARROLLO LOCAL (.env.local):
 * ------------------------------
 * Crea un archivo .env.local en la raíz del proyecto con:
 * 
 * SUPABASE_URL=https://tu-proyecto.supabase.co
 * SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
 * 
 * IMPORTANTE: Agrega .env.local a .gitignore para no subir las credenciales
 * 
 * 
 * PRODUCCIÓN (Vercel):
 * --------------------
 * 1. Ve a tu proyecto en Vercel Dashboard
 * 2. Settings → Environment Variables
 * 3. Agrega estas dos variables:
 *    - SUPABASE_URL = https://tu-proyecto.supabase.co
 *    - SUPABASE_SERVICE_ROLE_KEY = tu-service-role-key-aqui
 * 4. Haz redeploy del proyecto
 * 
 * 
 * CÓMO OBTENER LAS CREDENCIALES:
 * ------------------------------
 * 1. Ve a Supabase Dashboard → tu proyecto
 * 2. Settings → API
 * 3. Project URL → copia el valor (SUPABASE_URL)
 * 4. Service Role Key → copia el valor (SUPABASE_SERVICE_ROLE_KEY)
 *    ⚠️ ADVERTENCIA: El Service Role Key tiene permisos completos.
 *    NUNCA lo expongas en código del cliente (browser).
 * ============================================
 */

