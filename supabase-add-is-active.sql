-- ============================================
-- AGREGAR COLUMNA is_active A VENDORS (OPCIONAL)
-- ============================================
-- Este script agrega la columna is_active para poder
-- desactivar asesores sin eliminarlos de la tabla.
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Pega todo este script
-- 3. Haz clic en "Run" o presiona Cmd/Ctrl + Enter
-- ============================================

-- Agregar columna is_active si no existe
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Marcar todos los vendors existentes como activos por defecto
UPDATE vendors 
SET is_active = true 
WHERE is_active IS NULL;

-- Crear índice para mejorar performance en consultas de vendors activos
CREATE INDEX IF NOT EXISTS idx_vendors_is_active 
ON vendors(is_active) 
WHERE is_active = true;

-- ============================================
-- VERIFICACIÓN (opcional)
-- ============================================
-- Ejecuta esto para verificar que la columna se agregó:
-- SELECT id, name, phone, is_active, lead_count
-- FROM vendors
-- ORDER BY order_index ASC;
-- ============================================

-- ============================================
-- EJEMPLOS DE USO
-- ============================================
-- Desactivar un asesor (ej. Israel):
-- UPDATE vendors SET is_active = false WHERE name = 'Israel';
--
-- Reactivar un asesor:
-- UPDATE vendors SET is_active = true WHERE name = 'Israel';
--
-- Ver solo asesores activos:
-- SELECT * FROM vendors WHERE is_active = true ORDER BY order_index ASC;
-- ============================================
