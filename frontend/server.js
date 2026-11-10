const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT ?? 3000);
const useTLS = process.env.USE_TLS === 'true';

const requestHandler = (req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
};

if (useTLS) {
  try {
    const options = {
      key: fs.readFileSync('/certs/server.key'),
      cert: fs.readFileSync('/certs/server.crt')
    };
    https.createServer(options, requestHandler).listen(port, '0.0.0.0', () => {
      console.log(`Frontend HTTPS escuchando en el puerto ${port}`);
    });
  } catch (err) {
    console.error("Error al cargar los certificados TLS en frontend:", err);
    process.exit(1);
  }
} else {
  const http = require('node:http');
  http.createServer(requestHandler).listen(port, '0.0.0.0', () => {
    console.log(`Frontend HTTP escuchando en el puerto ${port}`);
  });
}
