# Instrucciones de Captura - Fase 1 (HTTP) y Fase 2 (Canal Seguro TLS)

La captura se hace directamente en el equipo con **Wireshark**, escuchando la interfaz de loopback
(el navegador habla con la API por `localhost:8080`). Se usa el mismo procedimiento en ambas fases
para poder comparar las evidencias.

## Preparación
```bash
git fetch origin
git checkout feature/fase2-tls
git pull origin feature/fase2-tls
```
En Wireshark selecciona la interfaz **Loopback: lo0** (en macOS; en Linux es `lo`, en Windows
"Adapter for loopback traffic capture"). Opcional: filtro de captura `tcp port 8080`; filtro de
visualización **`tcp.port == 8080`**.

Mensaje de prueba para ambas fases: **`mensaje-secreto-123`**.

## Fase 1: sin canal seguro (HTTP)
1. Levanta el entorno:
   ```bash
   docker compose up -d --build
   ```
2. Empieza a capturar en Wireshark (lo0).
3. Entra a **`http://localhost:3000`** y envía `mensaje-secreto-123`.
4. Detén la captura y guárdala como **`capturas/fase1_sin_tls.pcapng`**.
5. Evidencia: filtro `http`, clic derecho en el `POST /mensajes` → *Follow → HTTP Stream*.
   **El mensaje se lee en texto plano.** Toma el pantallazo.
6. Apaga el entorno:
   ```bash
   docker compose down
   ```

## Fase 2: con canal seguro (TLS)
1. Levanta el entorno:
   ```bash
   docker compose -f docker-compose.fase2.yml up -d --build
   ```
2. Entra a **`https://localhost:3000`** (¡ahora es **HTTPS**!). El navegador mostrará una
   **advertencia de seguridad**: es normal, el certificado lo firma nuestra propia CA (`certs/ca.crt`).
   Dale "Configuración avanzada" → **"Continuar a localhost"**.
   > En Firefox la excepción es por puerto: si el chat dice *Failed to fetch*, abre también
   > `https://localhost:8080/mensajes`, acepta la advertencia y recarga el chat.
3. Empieza a capturar en Wireshark (lo0).
4. Envía `mensaje-secreto-123` desde el chat.
5. Detén la captura y guárdala como **`capturas/fase2_con_tls.pcapng`**.
6. Evidencias:
   - Filtro `tls`: se ven `Client Hello` / `Server Hello` (handshake) y luego `Application Data`.
   - Clic derecho → *Follow → TCP Stream*: el contenido es ilegible. **El mensaje ya no se puede leer.**
   - Rechazo de HTTP plano: `curl -i http://localhost:8081/mensajes` responde **403**.
   Toma los pantallazos.
7. Apaga el entorno:
   ```bash
   docker compose -f docker-compose.fase2.yml down
   ```
