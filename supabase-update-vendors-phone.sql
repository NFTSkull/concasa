-- ============================================
-- SCRIPT PARA ACTUALIZAR NÚMEROS DE VENDEDORES
-- ============================================
-- Este script actualiza los números de teléfono de los 20 vendedores
-- en la tabla vendors de Supabase.
--
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Pega este script
-- 3. Haz clic en "Run" o presiona Cmd/Ctrl + Enter
-- 4. Verifica que todos los números se actualizaron correctamente
-- ============================================

-- Actualizar números de teléfono de los vendedores
-- Formato: solo 10 dígitos (sin +52, sin espacios)
UPDATE vendors SET phone = '8181781697' WHERE name = 'Cleber' AND order_index = 0;
UPDATE vendors SET phone = '8135698942' WHERE name = 'Laura' AND order_index = 1;
UPDATE vendors SET phone = '8180779107' WHERE name = 'Adrina' AND order_index = 2;
UPDATE vendors SET phone = '8123193926' WHERE name = 'Caroline' AND order_index = 3;
UPDATE vendors SET phone = '8123561700' WHERE name = 'Conchis' AND order_index = 4;
UPDATE vendors SET phone = '8110059962' WHERE name = 'Ericka Alcocer' AND order_index = 5;
UPDATE vendors SET phone = '8127321283' WHERE name = 'Jose Salazar' AND order_index = 6;
UPDATE vendors SET phone = '8132785538' WHERE name = 'Rocio' AND order_index = 7;
UPDATE vendors SET phone = '8113010184' WHERE name = 'Marco Guerra' AND order_index = 8;
UPDATE vendors SET phone = '8136866101' WHERE name = 'Pablo Navarrete' AND order_index = 9;
UPDATE vendors SET phone = '8140462368' WHERE name = 'Mariana Romo' AND order_index = 10;
UPDATE vendors SET phone = '8116533555' WHERE name = 'Luz Mejia' AND order_index = 11;
UPDATE vendors SET phone = '8110104975' WHERE name = 'Adriana Alcocer' AND order_index = 12;
UPDATE vendors SET phone = '8113273900' WHERE name = 'Victoria' AND order_index = 13;
UPDATE vendors SET phone = '8182577208' WHERE name = 'Paty Gtz' AND order_index = 14;
UPDATE vendors SET phone = '8116966646' WHERE name = 'Marce Rmz' AND order_index = 15;
UPDATE vendors SET phone = '8181122309' WHERE name = 'Israel' AND order_index = 16;
UPDATE vendors SET phone = '8130824154' WHERE name = 'Rosy' AND order_index = 17;
UPDATE vendors SET phone = '8132413485' WHERE name = 'Paty Macias' AND order_index = 18;
UPDATE vendors SET phone = '8116334375' WHERE name = 'Ruvicela' AND order_index = 19;

-- Verificar que todos los números se actualizaron correctamente
-- Ejecuta esta consulta después para verificar:
SELECT id, name, phone, order_index FROM vendors ORDER BY order_index ASC;

-- ============================================
-- NOTA: Si necesitas verificar el round robin, puedes resetear el contador:
-- UPDATE queue_state SET last_index = -1 WHERE id = 1;
-- ============================================
