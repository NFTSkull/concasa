# 📊 Cómo Consultar el Historial de Asignaciones de Leads

Este documento explica cómo consultar qué vendedores recibieron qué leads usando la tabla `lead_assignments` en Supabase.

---

## 🚀 Paso 1: Crear la Tabla de Historial

Antes de consultar, necesitas crear la tabla en Supabase:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `supabase-lead-history.sql`
3. Copia y pega todo el contenido
4. Haz clic en **"Run"** o presiona `Cmd/Ctrl + Enter`

Esto creará la tabla `lead_assignments` con todos los índices necesarios.

---

## 📋 Queries Útiles

### 1. Ver TODAS las asignaciones (más recientes primero)

```sql
SELECT * 
FROM lead_assignments 
ORDER BY assigned_at DESC;
```

**Resultado:** Lista completa de todas las asignaciones con todos los detalles.

---

### 2. Ver asignaciones de un vendedor específico

```sql
SELECT * 
FROM lead_assignments 
WHERE vendor_name = 'Cleber' 
ORDER BY assigned_at DESC;
```

**Reemplaza `'Cleber'`** con el nombre del vendedor que quieras consultar.

**Resultado:** Todas las asignaciones de ese vendedor con fechas y datos del lead.

---

### 3. Resumen: Contar leads por vendedor

```sql
SELECT 
  vendor_name,
  vendor_phone,
  COUNT(*) as total_leads,
  COUNT(lead_name) as leads_con_datos_completos,
  MIN(assigned_at) as primer_lead,
  MAX(assigned_at) as ultimo_lead
FROM lead_assignments
GROUP BY vendor_name, vendor_phone
ORDER BY total_leads DESC;
```

**Resultado:** 
- Total de leads asignados a cada vendedor
- Cuántos tienen datos completos (llenaron formulario)
- Fecha del primer y último lead

---

### 4. Ver leads asignados HOY

```sql
SELECT * 
FROM lead_assignments 
WHERE DATE(assigned_at) = CURRENT_DATE
ORDER BY assigned_at DESC;
```

**Resultado:** Solo los leads asignados el día de hoy.

---

### 5. Ver leads asignados en un rango de fechas

```sql
SELECT * 
FROM lead_assignments 
WHERE assigned_at >= '2024-12-01' 
  AND assigned_at < '2024-12-23'
ORDER BY assigned_at DESC;
```

**Ajusta las fechas** según necesites.

**Resultado:** Leads asignados en ese período.

---

### 6. Ver leads por origen del CTA

```sql
SELECT 
  origen_cta,
  COUNT(*) as cantidad
FROM lead_assignments
GROUP BY origen_cta
ORDER BY cantidad DESC;
```

**Resultado:** Cuántos leads vienen de cada botón/origen:
- `hero` = Botón del hero
- `floating-wa` = Botón flotante de WhatsApp
- `mejoravit` = Botón de sección Mejoravit
- `direct-whatsapp` = WhatsApp directo sin formulario

---

### 7. Ver leads con datos completos (que llenaron formulario)

```sql
SELECT * 
FROM lead_assignments 
WHERE lead_name IS NOT NULL 
ORDER BY assigned_at DESC;
```

**Resultado:** Solo leads que llenaron el formulario completo (tienen nombre, teléfono, etc.).

---

### 8. Ver leads sin datos (solo WhatsApp directo)

```sql
SELECT * 
FROM lead_assignments 
WHERE lead_name IS NULL 
ORDER BY assigned_at DESC;
```

**Resultado:** Leads que vinieron de WhatsApp directo sin llenar formulario.

---

### 9. Comparar contador de vendors vs historial real

```sql
SELECT 
  v.name,
  v.lead_count as contador_vendors,
  COUNT(la.id) as contador_historial,
  (v.lead_count - COUNT(la.id)) as diferencia
FROM vendors v
LEFT JOIN lead_assignments la ON v.id = la.vendor_id
GROUP BY v.id, v.name, v.lead_count
ORDER BY v.name;
```

**Resultado:** Compara el `lead_count` en la tabla `vendors` vs el conteo real en `lead_assignments`.

**Nota:** Si hay diferencia, puede ser porque:
- Se asignaron leads antes de crear la tabla de historial
- Hubo algún error al guardar el historial (pero la asignación sí funcionó)

---

### 10. Ver distribución de leads por ubicación

```sql
SELECT 
  ubicacion,
  COUNT(*) as cantidad
FROM lead_assignments
WHERE ubicacion IS NOT NULL
GROUP BY ubicacion
ORDER BY cantidad DESC;
```

**Resultado:** Cuántos leads son de Monterrey vs foráneos.

---

### 11. Ver los últimos 10 leads asignados con detalles

```sql
SELECT 
  vendor_name,
  vendor_phone,
  lead_name,
  lead_phone,
  origen_cta,
  ubicacion,
  assigned_at
FROM lead_assignments
ORDER BY assigned_at DESC
LIMIT 10;
```

**Resultado:** Los 10 leads más recientes con información resumida.

---

### 12. Ver estadísticas por vendedor (detallado)

```sql
SELECT 
  vendor_name,
  vendor_phone,
  COUNT(*) as total_leads,
  COUNT(lead_name) as con_formulario,
  COUNT(*) FILTER (WHERE lead_name IS NULL) as solo_whatsapp,
  COUNT(*) FILTER (WHERE origen_cta = 'hero') as desde_hero,
  COUNT(*) FILTER (WHERE origen_cta = 'floating-wa') as desde_flotante,
  MIN(assigned_at) as primer_lead,
  MAX(assigned_at) as ultimo_lead
FROM lead_assignments
GROUP BY vendor_name, vendor_phone
ORDER BY total_leads DESC;
```

**Resultado:** Estadísticas detalladas por vendedor:
- Total de leads
- Cuántos llenaron formulario
- Cuántos fueron solo WhatsApp
- Desde qué botones vinieron
- Fechas del primer y último lead

---

## 🔍 Cómo Usar Estas Queries

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Pega cualquiera de las queries de arriba
3. Haz clic en **"Run"** o presiona `Cmd/Ctrl + Enter`
4. Verás los resultados en una tabla

### Opción 2: Exportar a CSV

1. Ejecuta la query en Supabase
2. Haz clic en el botón de **descargar** (ícono de descarga)
3. Selecciona formato CSV o Excel
4. Abre el archivo en Excel/Google Sheets para análisis

---

## 📊 Ejemplo de Resultado

Cuando ejecutes la query #3 (Resumen por vendedor), verás algo así:

```
vendor_name    | vendor_phone | total_leads | leads_con_datos | primer_lead          | ultimo_lead
---------------|--------------|-------------|-----------------|----------------------|----------------------
Cleber         | 8181781697   | 15          | 12              | 2024-12-01 10:30:00 | 2024-12-22 14:20:00
Laura          | 8135698942   | 14          | 11              | 2024-12-01 10:31:00 | 2024-12-22 14:21:00
Adrina         | 8180779107   | 14          | 10              | 2024-12-01 10:32:00 | 2024-12-22 14:22:00
...
```

---

## ⚠️ Notas Importantes

1. **Datos opcionales:** Los campos del lead (`lead_name`, `lead_phone`, etc.) pueden ser `NULL` si el lead vino de WhatsApp directo sin llenar formulario.

2. **Historial desde ahora:** La tabla solo guarda asignaciones desde que la crees. Los leads asignados antes de crear la tabla no estarán en el historial.

3. **Integridad:** El `vendor_id` tiene foreign key a `vendors`, así que si eliminas un vendedor, se eliminarán sus asignaciones (o puedes cambiar la foreign key a `ON DELETE SET NULL` si prefieres mantener el historial).

4. **Performance:** Los índices están optimizados para consultas por vendedor y fecha. Las queries deberían ser rápidas incluso con miles de registros.

---

## 🆘 Troubleshooting

### La tabla no existe
- Ejecuta el script `supabase-lead-history.sql` primero

### No aparecen datos
- Verifica que el endpoint esté guardando correctamente (revisa logs de Vercel)
- Verifica que el código del frontend esté enviando los datos

### Diferencia entre `lead_count` y historial
- Es normal si se asignaron leads antes de crear la tabla
- El `lead_count` en `vendors` sigue siendo el contador oficial
- El historial es para consultas detalladas

---

## 📝 Próximos Pasos (Opcional)

Si quieres más funcionalidades, puedo agregar:
- Endpoint API para consultar el historial programáticamente
- Dashboard web para visualizar estadísticas
- Exportación automática a Excel/CSV
- Alertas cuando un vendedor recibe muchos leads

Solo dímelo y lo implemento.
