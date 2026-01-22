# 🔍 ANÁLISIS FORENSE: Round Robin de Asignación de Leads

**Fecha:** 2026-01-20  
**Contexto:** Deploy en Vercel (serverless) + Supabase  
**Problema reportado:** Round Robin desbalanceado - algunos asesores reciben menos leads

---

## 1️⃣ DÓNDE SE DECIDE EL ASESOR

### **Ubicación Principal:**
- **Archivo:** `api/assign-vendor.js`
- **Líneas:** 55-92
- **Método:** Llamada RPC a función PostgreSQL `assign_next_vendor(p_queue_id: 1)`

```javascript
// Línea 55-56
const { data: rrRows, error: rrError } = await supabase.rpc('assign_next_vendor', { p_queue_id: 1 });
```

### **Flujo Completo:**
1. **Frontend** (`main.js:423`) → POST a `/api/assign-vendor`
2. **Backend** (`api/assign-vendor.js:56`) → RPC `assign_next_vendor(1)`
3. **PostgreSQL** (función SQL) → Selecciona vendor + actualiza `queue_state`
4. **Backend** (`api/assign-vendor.js:73-90`) → Construye objeto `updatedVendor`
5. **Backend** (`api/assign-vendor.js:242-373`) → Inserta en `whatsapp_contacts` o `lead_assignments`

### **Archivos Relevantes:**
- `api/assign-vendor.js` (líneas 55-92, 228-373)
- `main.js` (líneas 123-172, 382-527)
- `supabase-setup.sql` (líneas 24-35) - Define tabla `queue_state`

---

## 2️⃣ ESTADO DEL ROUND ROBIN

### **✅ ESTÁ EN BASE DE DATOS (Supabase)**

**Tabla:** `public.queue_state`
- **Columnas:** `id` (PK), `last_index` (INTEGER), `updated_at` (TIMESTAMP)
- **Registro inicial:** `id=1, last_index=-1`
- **Ubicación:** Supabase PostgreSQL (persistente)

**Evidencia:**
```sql
-- supabase-setup.sql líneas 24-35
CREATE TABLE IF NOT EXISTS queue_state (
  id INTEGER PRIMARY KEY,
  last_index INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO queue_state (id, last_index)
VALUES (1, -1)
ON CONFLICT (id) DO NOTHING;
```

### **✅ NO está en memoria, frontend, localStorage, ni JSON**

**Razón:** El código usa RPC a PostgreSQL, que es persistente y atómico.

**⚠️ PROBLEMA CRÍTICO IDENTIFICADO:**
La función SQL `assign_next_vendor` **NO EXISTE** en los archivos del proyecto. El código la llama (línea 56), pero no hay script SQL que la cree.

**Evidencia:**
- `grep -i "CREATE.*FUNCTION.*assign_next_vendor"` → **0 resultados**
- `grep -i "pg_advisory"` → **0 resultados**
- El código espera que la función exista, pero no está definida en ningún `.sql`

**Impacto en Vercel:**
- Si la función no existe en Supabase → **ERROR 500** en cada request
- Si existe pero sin locks → **Race conditions** en requests simultáneos
- Si existe pero no filtra `is_active` → Asigna a asesores desactivados

---

## 3️⃣ MÚLTIPLES CAMINOS DE CREACIÓN DE LEAD

### **✅ HAY 3 CAMINOS DIFERENTES:**

#### **A) `whatsapp_modal` (event_name = "whatsapp_modal")**
- **Origen:** Modal obligatorio antes de abrir WhatsApp
- **Tabla destino:** `whatsapp_contacts`
- **Pasa por Round Robin:** ✅ SÍ (línea 56, antes del insert)
- **Archivo:** `api/assign-vendor.js:242-342`
- **Frontend:** `main.js:382-527`

#### **B) `form_submit` (event_name = "form_submit")**
- **Origen:** Formulario completo con nombre, fecha, WhatsApp
- **Tabla destino:** `lead_assignments`
- **Pasa por Round Robin:** ✅ SÍ (línea 56, antes del insert)
- **Archivo:** `api/assign-vendor.js:344-373, 377-409`
- **Frontend:** `main.js:123-172, 591-702`

#### **C) `cta_whatsapp_click` (event_name = "cta_whatsapp_click" o null)**
- **Origen:** Clicks directos en botones WhatsApp (legacy, posiblemente deshabilitado)
- **Tabla destino:** `lead_assignments`
- **Pasa por Round Robin:** ✅ SÍ (línea 56, antes del insert)
- **Archivo:** `api/assign-vendor.js:232-241, 377-409`

### **✅ TODOS LOS CAMINOS PASAN POR ROUND ROBIN**

**Conclusión:** No hay bypass del Round Robin. Todos los flujos llaman a `assign_next_vendor` en la línea 56.

---

## 4️⃣ RIESGOS DE CONCURRENCIA

### **⚠️ PROBLEMA CRÍTICO: Función SQL No Definida**

**Estado Actual:**
- El código llama a `supabase.rpc('assign_next_vendor', { p_queue_id: 1 })` (línea 56)
- **NO HAY** función SQL definida en el proyecto
- Si la función existe en Supabase pero **NO tiene locks** → Race conditions

### **Escenario de Race Condition (si función existe sin locks):**

```
Request A: Lee last_index = 5
Request B: Lee last_index = 5  (antes de que A actualice)
Request A: Calcula next_index = 6, asigna vendor[6], actualiza last_index = 6
Request B: Calcula next_index = 6, asigna vendor[6], actualiza last_index = 6
Resultado: Ambos leads van al mismo vendor
```

### **Solución Requerida:**
La función SQL debe usar **PostgreSQL Advisory Locks** (`pg_advisory_xact_lock`) para atomicidad.

**Ejemplo de función correcta (NO EXISTE EN EL PROYECTO):**
```sql
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
BEGIN
  -- 🔒 LOCK ADVISORY para evitar race conditions
  PERFORM pg_advisory_xact_lock(12345);
  
  -- Leer last_index con lock exclusivo
  SELECT COALESCE(last_index, -1) INTO v_last_index
  FROM queue_state
  WHERE id = p_queue_id
  FOR UPDATE;
  
  -- Contar vendors activos (si existe columna is_active)
  SELECT COUNT(*) INTO v_total_vendors
  FROM vendors
  WHERE is_active = true OR is_active IS NULL;
  
  -- Calcular siguiente índice
  v_next_index := (v_last_index + 1) % v_total_vendors;
  
  -- Obtener vendor
  SELECT id, name, phone 
  INTO v_vendor_id, v_vendor_name, v_vendor_phone
  FROM vendors
  WHERE is_active = true OR is_active IS NULL
  ORDER BY order_index ASC, id ASC
  LIMIT 1
  OFFSET v_next_index;
  
  -- Actualizar queue_state
  INSERT INTO queue_state (id, last_index, updated_at)
  VALUES (p_queue_id, v_next_index, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    last_index = v_next_index,
    updated_at = NOW();
  
  -- Incrementar lead_count
  UPDATE vendors
  SET lead_count = COALESCE(lead_count, 0) + 1
  WHERE id = v_vendor_id;
  
  RETURN QUERY SELECT v_vendor_id, v_vendor_name, v_vendor_phone, v_next_index;
END;
$$ LANGUAGE plpgsql;
```

---

## 5️⃣ IDEMPOTENCIA

### **❌ NO HAY PROTECCIÓN CONTRA DUPLICADOS**

**Problemas Identificados:**

#### **A) Frontend: Doble Submit**
- **Ubicación:** `main.js:382-527`
- **Protección:** ✅ Bandera `isOpeningWhatsApp` (línea 379, 386-388)
- **Estado:** ✅ RESUELTO (agregado recientemente)

#### **B) Backend: Retry/Doble Request**
- **Ubicación:** `api/assign-vendor.js:55-92`
- **Protección:** ❌ NO HAY
- **Riesgo:** Si el frontend hace retry o hay doble click, se crean 2 leads con el mismo vendor

#### **C) Dedupe por `cliente_telefono`**
- **Ubicación:** Ninguna
- **Protección:** ❌ NO HAY
- **Riesgo:** Mismo teléfono puede crear múltiples leads en ventana de tiempo

#### **D) Request ID único**
- **Ubicación:** Ninguna
- **Protección:** ❌ NO HAY
- **Riesgo:** No hay forma de identificar requests duplicados

### **Evidencia de Falta de Idempotencia:**

```javascript
// api/assign-vendor.js:55-56
// NO HAY verificación de duplicados antes de asignar
const { data: rrRows, error: rrError } = await supabase.rpc('assign_next_vendor', { p_queue_id: 1 });

// api/assign-vendor.js:276-280
// NO HAY constraint UNIQUE en cliente_telefono + ventana de tiempo
const { data: insertedContact, error: contactInsertErr } = await supabase
  .from('whatsapp_contacts')
  .insert(whatsappContactsPayload)
  .select('id')
  .single();
```

---

## 6️⃣ CAUSA RAÍZ MÁS PROBABLE

### **🔴 PROBLEMA #1: Función SQL `assign_next_vendor` No Existe o Está Rota**

**Evidencia:**
- Código la llama pero no está en archivos del proyecto
- Si no existe → Error 500 en cada request
- Si existe sin locks → Race conditions

**Impacto:** Round Robin desbalanceado por:
- Asignaciones duplicadas en requests simultáneos
- Saltos de índices si la función falla parcialmente

### **🟡 PROBLEMA #2: Falta de Filtro `is_active` en Vendors**

**Evidencia:**
- Tabla `vendors` puede tener asesores desactivados (ej. Israel)
- Si la función SQL no filtra `WHERE is_active = true`, asigna a inactivos
- Esto reduce el pool efectivo y desbalancea

**Impacto:** Si hay 2 inactivos de 20, el Round Robin rota entre 18, pero el cálculo puede usar 20.

### **🟡 PROBLEMA #3: Cambios en Números de Teléfono**

**Evidencia:**
- Usuario reporta "números cambiados (ej. Laura)"
- Si se actualiza `vendors.phone` pero no se resetea `queue_state`, puede haber inconsistencias

**Impacto:** Menor, pero puede causar confusión.

### **🟡 PROBLEMA #4: Falta de Idempotencia**

**Evidencia:**
- No hay dedupe por `cliente_telefono`
- No hay request_id único
- Retries pueden crear leads duplicados

**Impacto:** Leads duplicados consumen slots del Round Robin.

---

## 7️⃣ PROPUESTA DE FIX ROBUSTO

### **✅ SOLUCIÓN: Función SQL Atómica con Locks + Idempotencia**

#### **Paso 1: Crear/Actualizar Función SQL `assign_next_vendor`**

**Archivo nuevo:** `supabase-round-robin-function.sql`

```sql
-- ============================================
-- FUNCIÓN ROUND ROBIN CON LOCKS Y FILTRO is_active
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
  PERFORM pg_advisory_xact_lock(12345);
  
  -- Verificar si existe columna is_active
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vendors' 
      AND column_name = 'is_active'
  ) INTO v_has_is_active;
  
  -- Leer last_index con lock exclusivo
  SELECT COALESCE(last_index, -1) INTO v_last_index
  FROM queue_state
  WHERE id = p_queue_id
  FOR UPDATE;
  
  -- Si no existe el registro, crear uno
  IF v_last_index IS NULL THEN
    INSERT INTO queue_state (id, last_index)
    VALUES (p_queue_id, -1)
    ON CONFLICT (id) DO NOTHING;
    v_last_index := -1;
  END IF;
  
  -- Contar vendors activos (filtrar inactivos si existe columna)
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
  
  -- Calcular siguiente índice (round robin)
  v_next_index := (v_last_index + 1) % v_total_vendors;
  
  -- Obtener vendor con ORDER BY order_index ASC, id ASC
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
  
  -- Validar que se encontró vendor
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
```

#### **Paso 2: Agregar Columna `is_active` a `vendors` (Opcional pero Recomendado)**

```sql
-- Agregar columna is_active si no existe
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Marcar todos como activos por defecto
UPDATE vendors SET is_active = true WHERE is_active IS NULL;

-- Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active) WHERE is_active = true;
```

#### **Paso 3: Agregar Idempotencia (Dedupe por `cliente_telefono`)**

**Modificar `api/assign-vendor.js` (después de línea 55, antes de línea 242):**

```javascript
// Para whatsapp_modal: verificar duplicado reciente (últimos 5 minutos)
if (isWhatsappModal) {
  const normalizedLeadPhoneModal = normalizeWhatsapp(lead_phone_modal);
  
  if (normalizedLeadPhoneModal) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: existingContact, error: checkError } = await supabase
      .from('whatsapp_contacts')
      .select('id, vendor_id, vendor_name, whatsapp_link_url')
      .eq('lead_phone', normalizedLeadPhoneModal)
      .gte('assigned_at', fiveMinutesAgo)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single();
    
    if (existingContact && !checkError) {
      // Lead duplicado reciente, retornar mismo vendor
      console.log(`[assign-vendor] Duplicado detectado para ${normalizedLeadPhoneModal}, reusando asignación`);
      
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, name, phone, lead_count')
        .eq('id', existingContact.vendor_id)
        .single();
      
      if (vendorData) {
        return res.status(200).json({
          success: true,
          inserted: false, // No insertar duplicado
          duplicate: true,
          whatsapp_contact_id: existingContact.id,
          vendor: {
            id: vendorData.id,
            name: vendorData.name,
            phone: vendorData.phone,
            lead_count: vendorData.lead_count
          },
          whatsapp_url: existingContact.whatsapp_link_url,
          message: "Ya tienes una conversación activa con este asesor."
        });
      }
    }
  }
}
```

#### **Paso 4: Agregar Constraint UNIQUE (Opcional, Más Estricto)**

```sql
-- Agregar constraint UNIQUE en lead_phone + ventana de tiempo (últimos 5 min)
-- Nota: Esto requiere una función de trigger, más complejo pero más robusto
-- Por ahora, la verificación en código es suficiente
```

---

## 8️⃣ RESUMEN EJECUTIVO

### **Archivos Relevantes:**
1. `api/assign-vendor.js` (líneas 55-92, 228-373) - Lógica de asignación
2. `main.js` (líneas 123-172, 382-527) - Frontend que llama al API
3. `supabase-setup.sql` (líneas 24-35) - Tabla `queue_state`
4. **FALTA:** Función SQL `assign_next_vendor` (no existe en proyecto)

### **Causa Raíz:**
1. **CRÍTICO:** Función SQL `assign_next_vendor` no existe o no tiene locks → Race conditions
2. **MEDIO:** Falta filtro `is_active` → Asigna a inactivos
3. **BAJO:** Falta idempotencia → Duplicados consumen slots

### **Fix Propuesto:**
1. ✅ Crear función SQL con `pg_advisory_xact_lock` (atomicidad)
2. ✅ Agregar filtro `is_active` en función SQL
3. ✅ Agregar dedupe por `cliente_telefono` en backend (5 min ventana)
4. ✅ Agregar columna `is_active` a `vendors` (opcional)

### **Sin Cambiar Columnas de `whatsapp_contacts`:**
✅ Todos los fixes son en:
- Función SQL (nueva)
- Backend (`api/assign-vendor.js`) - solo lógica, no columnas
- Tabla `vendors` (agregar `is_active`, no afecta `whatsapp_contacts`)

---

## 9️⃣ QUERIES SQL PARA VERIFICACIÓN

```sql
-- 1. Verificar que la función existe
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'assign_next_vendor';

-- 2. Verificar estado actual del Round Robin
SELECT * FROM queue_state WHERE id = 1;

-- 3. Verificar distribución de leads por vendor (últimos 7 días)
SELECT 
  vendor_name,
  COUNT(*) as total_leads,
  MIN(assigned_at) as primer_lead,
  MAX(assigned_at) as ultimo_lead
FROM whatsapp_contacts
WHERE assigned_at >= NOW() - INTERVAL '7 days'
GROUP BY vendor_name
ORDER BY total_leads DESC;

-- 4. Verificar si hay vendors inactivos
SELECT id, name, phone, is_active, lead_count
FROM vendors
ORDER BY order_index ASC;

-- 5. Verificar duplicados recientes (mismo teléfono en últimos 5 min)
SELECT 
  lead_phone,
  COUNT(*) as duplicados,
  array_agg(id ORDER BY assigned_at DESC) as ids,
  array_agg(vendor_name ORDER BY assigned_at DESC) as vendors
FROM whatsapp_contacts
WHERE assigned_at >= NOW() - INTERVAL '5 minutes'
GROUP BY lead_phone
HAVING COUNT(*) > 1;
```

---

**Fin del Análisis Forense**
