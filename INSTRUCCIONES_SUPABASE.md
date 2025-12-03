# 📋 Instrucciones Paso a Paso - Configuración Supabase

## ✅ CHECKLIST COMPLETO

### FASE 1: Configurar Base de Datos en Supabase

#### Paso 1.1: Crear proyecto en Supabase
- [ ] Ve a [supabase.com](https://supabase.com) e inicia sesión
- [ ] Crea un nuevo proyecto (si no tienes uno)
- [ ] Anota el nombre del proyecto y la región

#### Paso 1.2: Ejecutar script SQL
- [ ] Ve a tu proyecto en Supabase Dashboard
- [ ] En el menú lateral izquierdo, haz clic en **"SQL Editor"**
- [ ] Haz clic en **"New query"** (botón verde arriba a la derecha)
- [ ] Abre el archivo `supabase-setup.sql` de este proyecto
- [ ] Copia TODO el contenido del archivo
- [ ] Pégalo en el editor SQL de Supabase
- [ ] Haz clic en **"Run"** (o presiona `Cmd/Ctrl + Enter`)
- [ ] Verifica que aparezca "Success. No rows returned" o similar

#### Paso 1.3: Verificar que las tablas se crearon
- [ ] En Supabase Dashboard, ve a **"Table Editor"** (menú lateral)
- [ ] Deberías ver dos tablas:
  - `vendors` (con 20 filas)
  - `queue_state` (con 1 fila, id=1, last_index=-1)
- [ ] Haz clic en `vendors` y verifica que hay 20 vendedores
- [ ] Haz clic en `queue_state` y verifica que last_index = -1

---

### FASE 2: Obtener Credenciales de Supabase

#### Paso 2.1: Obtener SUPABASE_URL
- [ ] En Supabase Dashboard, ve a **"Settings"** (icono de engranaje, abajo del menú)
- [ ] Haz clic en **"API"** (en el submenú de Settings)
- [ ] Busca la sección **"Project URL"**
- [ ] Copia el valor (ejemplo: `https://abcdefghijklmnop.supabase.co`)
- [ ] Guárdalo, lo necesitarás después

#### Paso 2.2: Obtener SUPABASE_SERVICE_ROLE_KEY
- [ ] En la misma página de Settings → API
- [ ] Busca la sección **"Project API keys"**
- [ ] Busca la fila que dice **"service_role"** (⚠️ es la que tiene permisos completos)
- [ ] Haz clic en el icono de ojo 👁️ para revelar el key
- [ ] Copia el valor completo (es largo, algo como: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- [ ] ⚠️ **IMPORTANTE**: Este key es secreto. No lo compartas ni lo subas a Git.

---

### FASE 3: Configurar Variables de Entorno Localmente

#### Paso 3.1: Crear archivo .env.local
- [ ] En la raíz del proyecto, crea un archivo llamado `.env.local`
- [ ] Agrega estas dos líneas (reemplaza con tus valores reales):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

- [ ] Guarda el archivo
- [ ] ✅ El archivo `.env.local` ya está en `.gitignore`, así que no se subirá a Git

#### Paso 3.2: Instalar dependencias
- [ ] Abre terminal en la raíz del proyecto
- [ ] Ejecuta: `npm install`
- [ ] Esto instalará `@supabase/supabase-js`

---

### FASE 4: Probar Localmente (Opcional)

#### Paso 4.1: Probar con Vercel CLI
- [ ] Instala Vercel CLI si no lo tienes: `npm i -g vercel`
- [ ] Ejecuta: `vercel dev`
- [ ] Esto iniciará un servidor local que simula Vercel
- [ ] Prueba hacer clic en un botón de WhatsApp
- [ ] Revisa la consola del navegador y del servidor para ver los logs

---

### FASE 5: Configurar Variables en Vercel (Producción)

#### Paso 5.1: Agregar variables de entorno en Vercel
- [ ] Ve a [vercel.com](https://vercel.com) e inicia sesión
- [ ] Selecciona tu proyecto **ConCasa**
- [ ] Ve a **"Settings"** (arriba en el menú)
- [ ] Haz clic en **"Environment Variables"** (menú lateral izquierdo)
- [ ] Haz clic en **"Add New"**

#### Paso 5.2: Agregar SUPABASE_URL
- [ ] En "Key", escribe: `SUPABASE_URL`
- [ ] En "Value", pega tu SUPABASE_URL (el que copiaste en Paso 2.1)
- [ ] Selecciona los ambientes: ✅ Production, ✅ Preview, ✅ Development
- [ ] Haz clic en **"Save"**

#### Paso 5.3: Agregar SUPABASE_SERVICE_ROLE_KEY
- [ ] Haz clic en **"Add New"** de nuevo
- [ ] En "Key", escribe: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] En "Value", pega tu Service Role Key (el que copiaste en Paso 2.2)
- [ ] Selecciona los ambientes: ✅ Production, ✅ Preview, ✅ Development
- [ ] Haz clic en **"Save"**

#### Paso 5.4: Hacer deploy
- [ ] Si el proyecto ya está conectado a GitHub, Vercel hará deploy automático
- [ ] Si no, ve a **"Deployments"** y haz clic en **"Redeploy"** del último deployment
- [ ] O simplemente haz un push a GitHub (si está conectado)

---

### FASE 6: Verificar que Funciona

#### Paso 6.1: Probar en producción
- [ ] Ve a tu sitio en producción (tu URL de Vercel)
- [ ] Abre la consola del navegador (F12 → Console)
- [ ] Haz clic en cualquier botón de WhatsApp
- [ ] Deberías ver en la consola: `[Round Robin] Vendedor asignado: ...`
- [ ] Debería abrirse WhatsApp con el número del vendedor asignado

#### Paso 6.2: Verificar en Supabase
- [ ] Ve a Supabase Dashboard → **"Table Editor"** → `vendors`
- [ ] Verifica que el campo `lead_count` se está incrementando
- [ ] Ve a `queue_state` y verifica que `last_index` cambia (0, 1, 2, ... 19, 0, 1...)

---

## 📊 Cómo Consultar los Leads por Vendedor

### Opción 1: Desde Supabase Dashboard (Más fácil)
1. Ve a Supabase Dashboard → **"Table Editor"**
2. Haz clic en la tabla `vendors`
3. Verás todas las columnas, incluyendo `lead_count`
4. Puedes ordenar por `lead_count` DESC para ver quién tiene más leads

### Opción 2: Query SQL directo
1. Ve a **"SQL Editor"**
2. Ejecuta esta query:

```sql
SELECT 
  name,
  phone,
  lead_count,
  order_index
FROM vendors
ORDER BY lead_count DESC;
```

### Opción 3: Crear un endpoint de reporte (Opcional)
Si quieres, puedo crear un endpoint `/api/vendors-stats` que retorne un JSON con:
- Lista de vendedores
- lead_count de cada uno
- Total de leads asignados

Solo dímelo y lo creo.

---

## 🔍 Verificación Final

### Checklist de verificación:
- [ ] Tablas `vendors` y `queue_state` existen en Supabase
- [ ] Hay 20 vendedores en la tabla `vendors`
- [ ] `queue_state` tiene `last_index = -1`
- [ ] Variables de entorno configuradas en `.env.local` (local)
- [ ] Variables de entorno configuradas en Vercel (producción)
- [ ] `npm install` ejecutado (dependencia @supabase/supabase-js instalada)
- [ ] Los botones de WhatsApp funcionan y asignan vendedores
- [ ] El contador `lead_count` se incrementa en Supabase

---

## 🆘 Troubleshooting

### Error: "Faltan variables de entorno de Supabase"
- Verifica que `.env.local` existe y tiene las variables correctas
- En producción, verifica que las variables estén en Vercel

### Error: "No hay vendedores disponibles"
- Ve a Supabase → Table Editor → vendors
- Verifica que hay 20 filas
- Si no hay, ejecuta de nuevo el script SQL

### Los leads no se asignan en orden
- Verifica que `queue_state.last_index` se está actualizando
- Si está en -1, el siguiente debería ser 0 (Cleber)
- Si está en 19, el siguiente debería ser 0 (vuelve al inicio)

### El contador no se incrementa
- Verifica los logs en Vercel (Deployments → selecciona deployment → Functions → Logs)
- Revisa que no haya errores en la consola del navegador

---

## 📝 Notas Importantes

1. **Service Role Key**: Este key tiene permisos completos. NUNCA lo expongas en código del cliente (browser). Solo úsalo en código de servidor (API routes).

2. **Round Robin**: El sistema siempre asigna en el mismo orden (0-19, luego vuelve a 0), sin importar si un vendedor está "activo" o no. Por ahora no hay lógica de activos/inactivos.

3. **Persistencia**: A diferencia de la versión anterior (que se reseteaba en cada deploy), ahora el estado se guarda en Supabase y persiste entre deploys.

4. **Formato de teléfono**: Los números en la BD están sin +52 (solo 10 dígitos). El código agrega el +52 automáticamente al generar el link de WhatsApp.


