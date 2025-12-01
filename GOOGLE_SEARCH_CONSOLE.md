# Integración de Google Search Console con Vercel

## Pasos para verificar tu sitio en Google Search Console

### Opción 1: Verificación mediante Meta Tag (Recomendado para sitios estáticos)

1. **Accede a Google Search Console**
   - Ve a [https://search.google.com/search-console](https://search.google.com/search-console)
   - Inicia sesión con tu cuenta de Google

2. **Añade tu propiedad**
   - Haz clic en "Añadir propiedad"
   - Selecciona "Prefijo de URL"
   - Ingresa la URL completa de tu sitio (ej: `https://tu-dominio.vercel.app` o `https://concasa.mx`)

3. **Obtén el código de verificación**
   - Selecciona el método "Etiqueta HTML"
   - Google te mostrará un código como: `google-site-verification=ABC123xyz...`
   - Copia solo la parte después del `=` (el código de verificación)

4. **Agrega el código al HTML**
   - Abre `index.html`
   - Busca la línea: `<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />`
   - Reemplaza `YOUR_VERIFICATION_CODE` con tu código de verificación
   - Guarda el archivo

5. **Despliega en Vercel**
   - Haz commit y push de los cambios
   - Vercel desplegará automáticamente

6. **Verifica en Google Search Console**
   - Regresa a Google Search Console
   - Haz clic en "Verificar"
   - Google confirmará que el meta tag está presente

### Opción 2: Verificación mediante DNS (Más permanente)

Si prefieres verificar mediante DNS (recomendado si tienes dominio personalizado):

1. **En Google Search Console**
   - Selecciona "Dominio" en lugar de "Prefijo de URL"
   - Ingresa tu dominio (ej: `concasa.mx`)
   - Selecciona el método "Registro DNS"

2. **En Vercel Dashboard**
   - Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
   - Ve a "Settings" → "Domains"
   - Selecciona tu dominio
   - Haz clic en "View DNS Records"
   - Agrega un nuevo registro:
     - Tipo: `TXT`
     - Nombre: `@`
     - Valor: El código que Google te proporcionó (ej: `google-site-verification=ABC123xyz...`)

3. **Verifica en Google Search Console**
   - Espera unos minutos para que el DNS se propague
   - Haz clic en "Verificar" en Google Search Console

## Después de la verificación

### Enviar Sitemap (Opcional pero recomendado)

1. **Crea un sitemap.xml** (si no existe)
   - Crea un archivo `sitemap.xml` en la raíz del proyecto
   - Lista todas las URLs de tu sitio

2. **En Google Search Console**
   - Ve a "Sitemaps" en el menú lateral
   - Ingresa la URL de tu sitemap (ej: `https://tu-dominio.com/sitemap.xml`)
   - Haz clic en "Enviar"

## Notas importantes

- El meta tag debe estar en la sección `<head>` del HTML
- Después de agregar el código, asegúrate de hacer commit y push
- La verificación puede tardar unos minutos después del despliegue
- Si usas dominio personalizado, asegúrate de que esté correctamente configurado en Vercel

