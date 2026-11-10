const { createServer } = require('node:http');

const port = Number(process.env.PORT ?? 8080);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const mensajes = [];

function responder(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function atender(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');

  if (req.headers.origin) {
    if (req.headers.origin !== frontendOrigin) {
      return responder(res, 403, { error: 'Origen no autorizado.' });
    }
    res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
  }

  if (req.url !== '/mensajes') {
    return responder(res, 404, { error: 'Ruta no encontrada.' });
  }

  switch (req.method) {
    case 'OPTIONS':
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    case 'GET':
      return responder(res, 200, mensajes);
    case 'POST':
      break;
    default:
      res.setHeader('Allow', 'GET, POST, OPTIONS');
      return responder(res, 405, { error: 'Método no permitido.' });
  }

  const contentType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return responder(res, 415, { error: 'Envía el mensaje como application/json.' });
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > 8192) {
      req.resume();
      return responder(res, 413, { error: 'La petición supera el límite de 8 KiB.' });
    }
    chunks.push(chunk);
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return responder(res, 400, { error: 'El JSON no es válido.' });
  }

  const texto = typeof payload?.texto === 'string' ? payload.texto.trim() : '';
  if (texto.length < 1 || texto.length > 500) {
    return responder(res, 400, { error: 'Escribe un mensaje de 1 a 500 caracteres.' });
  }

  const mensaje = { texto };
  mensajes.push(mensaje);
  responder(res, 201, mensaje);
}

createServer((req, res) => {
  atender(req, res).catch((error) => {
    if (res.destroyed) return;
    console.error(error);
    responder(res, 500, { error: 'No se pudo procesar la petición.' });
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`API HTTP escuchando en el puerto ${port}`);
});
