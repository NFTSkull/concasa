-- ============================================
-- SCRIPT DE CONFIGURACIÓN SUPABASE - ConCasa
-- ============================================
-- Este script crea las tablas necesarias para el sistema de round robin
-- y carga los 20 vendedores iniciales.
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Pega todo este script
-- 3. Haz clic en "Run" o presiona Cmd/Ctrl + Enter
-- ============================================

-- Crear tabla de vendedores
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  lead_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de estado del queue (round robin)
CREATE TABLE IF NOT EXISTS queue_state (
  id INTEGER PRIMARY KEY,
  last_index INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar estado inicial del queue
-- last_index = -1 significa que aún no se ha asignado a nadie
INSERT INTO queue_state (id, last_index)
VALUES (1, -1)
ON CONFLICT (id) DO NOTHING;

-- Insertar los 20 vendedores con sus datos
-- Orden: del 0 al 19 según order_index
INSERT INTO vendors (name, phone, order_index, lead_count) VALUES
  ('Cleber', '8181781697', 0, 0),
  ('Laura', '8135698942', 1, 0),
  ('Adrina', '8180779107', 2, 0),
  ('Caroline', '8123193926', 3, 0),
  ('Conchis', '8123561700', 4, 0),
  ('Ericka Alcocer', '8110059962', 5, 0),
  ('Jose Salazar', '8127321283', 6, 0),
  ('Rocio', '8132785538', 7, 0),
  ('Marco Guerra', '8113010184', 8, 0),
  ('Pablo Navarrete', '8136866101', 9, 0),
  ('Mariana Romo', '8140462368', 10, 0),
  ('Luz Mejia', '8116533555', 11, 0),
  ('Adriana Alcocer', '8110104975', 12, 0),
  ('Victoria', '8113273900', 13, 0),
  ('Paty Gtz', '8182577208', 14, 0),
  ('Marce Rmz', '8116966646', 15, 0),
  ('Israel', '8181122309', 16, 0),
  ('Rosy', '8130824154', 17, 0),
  ('Paty Macias', '8132413485', 18, 0),
  ('Ruvicela', '8116334375', 19, 0)
ON CONFLICT DO NOTHING;

-- Crear índice para mejorar performance en consultas por order_index
CREATE INDEX IF NOT EXISTS idx_vendors_order_index ON vendors(order_index);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at en vendors
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear trigger para actualizar updated_at en queue_state
DROP TRIGGER IF EXISTS update_queue_state_updated_at ON queue_state;
CREATE TRIGGER update_queue_state_updated_at
  BEFORE UPDATE ON queue_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICACIÓN (opcional, puedes ejecutarlo después)
-- ============================================
-- SELECT * FROM vendors ORDER BY order_index ASC;
-- SELECT * FROM queue_state;
-- ============================================

