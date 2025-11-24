# ConCasa Landing (Static)

Landing 100 % estática para ConCasa Soluciones Inmobiliarias. Basta con abrir `index.html` o subir los archivos raíz a cualquier hosting/CDN para publicar el sitio.

## Instalación / Uso

```bash
git clone https://github.com/NFTSkull/concasa.git
cd concasa
# abrir index.html en el navegador o desplegar la carpeta completa
```

No se requieren dependencias de Node. Si quieres desarrollar con live reload puedes levantar cualquier servidor estático (por ejemplo `python -m http.server`).

## Estructura

- `index.html`: markup principal y scripts de schema.org.
- `styles.css`: paleta, layout y animaciones `fade-up`.
- `main.js`: lógica del modal, validaciones y deeplink a WhatsApp (`action_log` en memoria).
- `docs/`: documentación funcional (producto, arquitectura, contratos, riesgos y plan de pruebas).

## Flujo principal

1. CTA “Revisar si tengo dinero” abre el modal.
2. Validaciones en cliente garantizan formato (NSS numérico, fecha DD/MM/AAAA, teléfonos 10 dígitos).
3. Se genera un mensaje prellenado y se abre `wa.me/<número>`.
4. Se registra el envío en `window.__actionLog` para auditoría básica (sin persistencia).

## Deploy

Sube los archivos raíz (`index.html`, `styles.css`, `main.js`, `favicon.ico` y `docs/`) al hosting de tu elección. En Vercel/GitHub Pages basta con seleccionar “Other / Static Files” y apuntar al directorio del repo.

