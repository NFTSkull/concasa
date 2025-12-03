# Sistema de Round Robin - Distribución de Leads

## Descripción
Sistema simple de round robin que distribuye los leads entre 20 vendedores de forma equitativa.

## Archivos

### `vendors.json`
Contiene la lista de 20 vendedores con sus números de WhatsApp. Para actualizar los números, edita este archivo:

```json
[
  { "id": 1, "name": "Vendedor 1", "phone": "5218112345678" },
  ...
]
```

**Formato del número:** Debe incluir el código de país (52 para México) sin el signo +. Ejemplo: `5218112345678`

### `api/assign-vendor.js`
Endpoint de Vercel Functions que implementa el algoritmo de round robin.

## Cómo funciona

1. Cada vez que un usuario hace clic en un botón de WhatsApp o envía un formulario, se llama al endpoint `/api/assign-vendor`
2. El endpoint asigna el siguiente vendedor en la lista (round robin)
3. El índice se incrementa y se resetea cuando llega al final
4. Se genera el link de WhatsApp con el número del vendedor asignado

## Actualizar números de vendedores

1. Edita el archivo `vendors.json`
2. Reemplaza los números de teléfono con los números reales de tus vendedores
3. El formato debe ser: `52` + código de área + número (sin espacios ni guiones)
4. Ejemplo: `5218112345678` (52 = México, 81 = área, 12345678 = número)

## Notas importantes

- **En producción:** El contador actual se resetea en cada deploy. Para persistencia, considera usar:
  - Vercel KV (Key-Value store)
  - Una base de datos simple (Supabase, Firebase)
  - Un archivo en un servicio de almacenamiento persistente

- **CORS:** El endpoint está configurado para permitir peticiones desde cualquier origen. En producción, considera restringir esto.

- **Logs:** Las asignaciones se registran en los logs de Vercel. Revisa la consola de Vercel para ver qué vendedor fue asignado a cada lead.

## Testing

Para probar localmente:
```bash
vercel dev
```

Esto iniciará un servidor local que simula el entorno de Vercel.


