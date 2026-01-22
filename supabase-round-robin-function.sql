-- ============================================
-- FUNCIÓN ROUND ROBIN CON LOCKS Y FILTRO is_active
-- ============================================
-- Esta función implementa el algoritmo Round Robin de forma atómica
-- usando PostgreSQL Advisory Locks para evitar race conditions.
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Pega todo este script
-- 3. Haz clic en "Run" o presiona Cmd/Ctrl + Enter
-- ============================================

CREATE OR REPLACE FUNCTION public.assign_next_vendor(p_queue_id INTEGER DEFAULT 1)
RETURNS TABLE (
  vendor_id INTEGER,
  vendor_name TEXT,
  vendor_phone TEXT,
  next_index INTEGER
) AS $$
DECLARE
  v_last_index INTEGER;
  v_total_vendors INTEGER;
  v_next_index INTEGER;
  v_vendor_id INTEGER;
  v_vendor_name TEXT;
  v_vendor_phone TEXT;
  v_has_is_active BOOLEAN;
BEGIN
  -- 🔒 LOCK ADVISORY para atomicidad (evita race conditions)
  -- ID único: 12345 (puede ser cualquier número único)
  PERFORM pg_advisory_xact_lock(12345);
  
  -- Verificar si existe columna is_active en vendors
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vendors' 
      AND column_name = 'is_active'
  ) INTO v_has_is_active;
  
  -- Leer last_index con lock exclusivo (FOR UPDATE)
  SELECT COALESCE(last_index, -1) INTO v_last_index
  FROM queue_state
  WHERE id = p_queue_id
  FOR UPDATE;
  
  -- Si no existe el registro, crear uno con last_index = -1
  IF v_last_index IS NULL THEN
    INSERT INTO queue_state (id, last_index)
    VALUES (p_queue_id, -1)
    ON CONFLICT (id) DO NOTHING;
    v_last_index := -1;
  END IF;
  
  -- Contar vendors activos (filtrar inactivos si existe columna is_active)
  IF v_has_is_active THEN
    SELECT COUNT(*) INTO v_total_vendors
    FROM vendors
    WHERE is_active = true;
  ELSE
    SELECT COUNT(*) INTO v_total_vendors
    FROM vendors;
  END IF;
  
  -- Validar que hay vendors disponibles
  IF v_total_vendors = 0 THEN
    RAISE EXCEPTION 'No hay vendedores disponibles';
  END IF;
  
  -- Calcular siguiente índice usando round robin
  -- Fórmula: (last_index + 1) % total_vendors
  v_next_index := (v_last_index + 1) % v_total_vendors;
  
  -- Obtener vendor con ORDER BY order_index ASC, id ASC
  -- OFFSET v_next_index para seleccionar el vendor en la posición correcta
  IF v_has_is_active THEN
    SELECT id, name, phone 
    INTO v_vendor_id, v_vendor_name, v_vendor_phone
    FROM vendors
    WHERE is_active = true
    ORDER BY order_index ASC, id ASC
    LIMIT 1
    OFFSET v_next_index;
  ELSE
    SELECT id, name, phone 
    INTO v_vendor_id, v_vendor_name, v_vendor_phone
    FROM vendors
    ORDER BY order_index ASC, id ASC
    LIMIT 1
    OFFSET v_next_index;
  END IF;
  
  -- Validar que se encontró un vendor
  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró vendor en índice %', v_next_index;
  END IF;
  
  -- Actualizar queue_state con next_index
  INSERT INTO queue_state (id, last_index, updated_at)
  VALUES (p_queue_id, v_next_index, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    last_index = v_next_index,
    updated_at = NOW();
  
  -- Incrementar lead_count de forma atómica
  UPDATE vendors
  SET lead_count = COALESCE(lead_count, 0) + 1
  WHERE id = v_vendor_id;
  
  -- Retornar resultado
  RETURN QUERY SELECT v_vendor_id, v_vendor_name, v_vendor_phone, v_next_index;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICACIÓN (opcional)
-- ============================================
-- Ejecuta esto para verificar que la función se creó correctamente:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' 
--   AND routine_name = 'assign_next_vendor';
-- ============================================
