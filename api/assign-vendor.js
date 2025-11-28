// API endpoint para asignar vendedor usando round robin
// Vercel Serverless Function

const vendors = require('../vendors.json');

// En producción, esto debería estar en una base de datos o KV store (Vercel KV)
// Por ahora usamos un contador en memoria (se resetea en cada deploy)
// Para producción persistente, usar Vercel KV o una BD
let currentIndex = 0;

module.exports = async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const totalVendors = vendors.length;

    if (totalVendors === 0) {
      return res.status(500).json({ error: 'No hay vendedores disponibles' });
    }

    // Round robin: asignar el siguiente vendedor
    const assignedVendor = vendors[currentIndex];
    
    // Incrementar índice y resetear si llega al final
    currentIndex = (currentIndex + 1) % totalVendors;

    // Log de la asignación (en producción guardar en BD)
    console.log(`[Round Robin] Lead asignado a: ${assignedVendor.name} (${assignedVendor.phone})`);

    return res.status(200).json({
      success: true,
      vendor: {
        id: assignedVendor.id,
        name: assignedVendor.name,
        phone: assignedVendor.phone
      }
    });
  } catch (error) {
    console.error('[Error asignando vendedor]', error);
    return res.status(500).json({ error: 'Error al asignar vendedor' });
  }
};

