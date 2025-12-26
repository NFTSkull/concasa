-- ============================================
-- TABLA DE HISTORIAL DE ASIGNACIONES DE LEADS
-- ============================================
-- Esta tabla guarda cada asignación de lead a vendedor
-- con todos los detalles para poder consultar quién recibió qué
-- ============================================

-- Crear tabla de historial de asignaciones
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_phone TEXT NOT NULL,
  
  -- Datos del lead (opcionales, pueden ser NULL si viene de WhatsApp directo)
  lead_name TEXT,
  lead_phone TEXT,
  lead_whatsapp TEXT,
  lead_nss TEXT,
  lead_birth_date TEXT,
  
  -- Metadatos de la asignación
  origen_cta TEXT, -- 'hero', 'floating-wa', 'mejoravit', 'direct-whatsapp', etc.
  ubicacion TEXT, -- 'monterrey' o 'foraneo' (si aplica)
  
  -- Timestamps
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para búsquedas rápidas
  CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Crear índices para mejorar performance en consultas
CREATE INDEX IF NOT EXISTS idx_lead_assignments_vendor_id ON lead_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_at ON lead_assignments(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_vendor_name ON lead_assignments(vendor_name);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_origen_cta ON lead_assignments(origen_cta);

-- ============================================
-- QUERIES ÚTILES PARA CONSULTAR EL HISTORIAL
-- ============================================

-- 1. Ver todas las asignaciones ordenadas por fecha (más recientes primero)
-- SELECT * FROM lead_assignments ORDER BY assigned_at DESC;

-- 2. Ver asignaciones de un vendedor específico
-- SELECT * FROM lead_assignments WHERE vendor_name = 'Cleber' ORDER BY assigned_at DESC;

-- 3. Contar leads por vendedor (resumen)
-- SELECT 
--   vendor_name,
--   vendor_phone,
--   COUNT(*) as total_leads,
--   COUNT(lead_name) as leads_con_datos,
--   MIN(assigned_at) as primer_lead,
--   MAX(assigned_at) as ultimo_lead
-- FROM lead_assignments
-- GROUP BY vendor_name, vendor_phone
-- ORDER BY total_leads DESC;

-- 4. Ver leads asignados hoy
-- SELECT * FROM lead_assignments 
-- WHERE DATE(assigned_at) = CURRENT_DATE
-- ORDER BY assigned_at DESC;

-- 5. Ver leads asignados en un rango de fechas
-- SELECT * FROM lead_assignments 
-- WHERE assigned_at >= '2024-01-01' AND assigned_at < '2024-02-01'
-- ORDER BY assigned_at DESC;

-- 6. Ver leads por origen del CTA
-- SELECT origen_cta, COUNT(*) as cantidad
-- FROM lead_assignments
-- GROUP BY origen_cta
-- ORDER BY cantidad DESC;

-- 7. Ver leads con datos completos (que llenaron el formulario)
-- SELECT * FROM lead_assignments 
-- WHERE lead_name IS NOT NULL 
-- ORDER BY assigned_at DESC;

-- 8. Comparar contador de vendors vs historial real
-- SELECT 
--   v.name,
--   v.lead_count as contador_vendors,
--   COUNT(la.id) as contador_historial,
--   (v.lead_count - COUNT(la.id)) as diferencia
-- FROM vendors v
-- LEFT JOIN lead_assignments la ON v.id = la.vendor_id
-- GROUP BY v.id, v.name, v.lead_count
-- ORDER BY v.name;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los datos del lead (nombre, teléfono, etc.) son opcionales porque
--    algunos leads vienen de WhatsApp directo sin formulario
-- 2. El vendor_id tiene foreign key a vendors para mantener integridad
-- 3. Los índices mejoran el rendimiento en consultas por vendedor o fecha
-- 4. Puedes agregar más campos si necesitas más información (ej: IP, user agent, etc.)
