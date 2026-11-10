# Minichat · Laboratorio de canal seguro

Implementación de Yeiner Arwawingumu Zapata Vallejo para la fase 1. Incluye el frontend, la API, ambos Dockerfile y el Compose en HTTP.

## Arranque con Docker Compose

Con Docker Desktop o Docker Engine con el complemento Compose, abre una terminal en la carpeta que contiene `docker-compose.yml` y ejecuta:

```sh
docker compose up --build -d
docker compose ps
```

1. Abre [http://localhost:3000](http://localhost:3000) en el navegador.
2. Escribe `mensaje-secreto-123` y pulsa **Enviar**.
3. Comprueba que el mensaje aparece en la lista. Si recargas la página, la interfaz vuelve a leer los mensajes de la API.

Para detener el laboratorio, ejecuta `docker compose down`. Los mensajes se guardan en memoria y se pierden al reiniciar el proceso del backend. Usa el nombre `localhost` al abrir la página, que coincide con el origen autorizado por la API. Los puertos de esta fase se publican solo en la máquina local.

## Contrato de la API

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /mensajes` | Sin cuerpo | `200` con una lista de objetos `{"texto":"…"}` |
| `POST /mensajes` | JSON `{"texto":"mensaje-secreto-123"}` | `201` con el mensaje guardado |
| `OPTIONS /mensajes` | Verificación CORS del navegador | `204` con los métodos y encabezados permitidos |

Puedes comprobar la lista desde el navegador en [http://localhost:8080/mensajes](http://localhost:8080/mensajes). El `POST` exige `Content-Type: application/json` y admite texto de 1 a 500 caracteres.

## Continuidad para el equipo

- **Alejandro.** El servicio se llama `backend` y recibe las peticiones en su puerto interno TCP `8080`. El navegador envía el mensaje directamente a `http://localhost:8080/mensajes`. Para agregar el servicio de captura a Compose, puedes usar `network_mode: "service:backend"`. En la captura pueden aparecer primero el `OPTIONS` de CORS y después el `POST` con el texto de prueba. Inicia la captura antes de pulsar **Enviar**.
- **Heider.** El frontend construye la URL de la API con el mismo protocolo y nombre que usa la página, en el puerto `8080`. Al servir la página en `https://localhost:3000`, llamará a `https://localhost:8080/mensajes`. Configura `FRONTEND_ORIGIN=https://localhost:3000` en el backend de la fase 2. Si cambia el puerto externo de la API, ajusta `endpoint.port` en `frontend/index.html`.
- **Cata.** El flujo de prueba es navegador → API por HTTP. Nginx entrega el HTML en el puerto externo `3000` y Node.js recibe los mensajes en el `8080`. El mensaje fijo se envía en la propiedad JSON `texto`.
