# Resumen de capturas: Fase 1 (HTTP) y Fase 2 (TLS)
**Elaborado por:** Alejandro (para Cata)

Hola Cata. Este es el resumen de mi parte del laboratorio: levantar los entornos de cada fase y
capturar el tráfico entre el navegador y la API para comparar la comunicación **sin** y **con**
canal seguro.

En las dos fases usé el mismo procedimiento para que las evidencias se puedan comparar:

- **Herramienta:** Wireshark en la interfaz **Loopback: lo0**. El navegador y la API se comunican
  por `localhost`, así que el tráfico pasa por esa interfaz.
- **Mensaje de prueba:** `mensaje-secreto-123`.

---

## Fase 1: sin canal seguro (HTTP)

### 1. Levantar el entorno
```bash
docker compose up -d --build
docker compose ps
```
Quedan dos contenedores:
- `frontend`: el chat, en `http://localhost:3000`.
- `backend`: la API, en `http://localhost:8080`.

> **Problema encontrado:** al principio el backend no arrancaba con el error
> `Bind for 0.0.0.0:8080 failed: port is already allocated`, porque otro contenedor de otro
> proyecto usaba el puerto 8080. Se solucionó deteniéndolo (`docker stop <contenedor>`) y
> volviendo a ejecutar `docker compose up -d`.

### 2. Captura
1. Inicié la captura en Wireshark (lo0).
2. Abrí `http://localhost:3000` y envié `mensaje-secreto-123`.
3. Detuve la captura y la guardé como `capturas/fase1_sin_tls.pcapng`.

### 3. Resultado
- Con el filtro `http` aparece la petición `POST /mensajes`.
- Con *clic derecho → Follow → HTTP Stream* **el mensaje se lee en texto plano**, junto con las
  cabeceras HTTP. Cualquiera que intercepte el tráfico puede leer su contenido.

### 4. Apagar el entorno
```bash
docker compose down
```

---

## Fase 2: con canal seguro (TLS)

### 1. Obtener la rama de la fase 2
```bash
git fetch origin
git checkout feature/fase2-tls
git pull origin feature/fase2-tls
```

### 2. Levantar el entorno con TLS
```bash
docker compose -f docker-compose.fase2.yml up -d --build
docker compose -f docker-compose.fase2.yml ps
```
Quedan dos contenedores, los dos con el certificado firmado por nuestra CA (`certs/`):
- `minichat-frontend-fase2`: el chat, en `https://localhost:3000`.
- `minichat-backend-fase2`: la API, en `https://localhost:8080`. En el puerto 8081 rechaza el
  HTTP plano con un **403**.

### 3. Captura
1. Inicié la captura en Wireshark (lo0).
2. Abrí `https://localhost:3000` y acepté la advertencia del navegador. Es normal: el certificado
   lo firma nuestra propia CA y el navegador no la conoce.
3. Envié `mensaje-secreto-123`.
4. Detuve la captura y la guardé como `capturas/fase2_con_tls.pcapng`.

Wireshark no reconoce TLS en los puertos 8080 y 3000 porque no son estándar. Para que lo muestre
usé **Analyze → Decode As… → TCP port 8080 y 3000 → TLS**, y luego el filtro `tls`.

### 4. Resultado
- **Handshake TLS:** aparecen `Client Hello (SNI=localhost)` y luego
  `Server Hello, Change Cipher Spec`. Se negoció **TLS 1.3**, donde incluso el certificado del
  servidor viaja cifrado.
- **Datos cifrados:** el `POST /mensajes` y sus respuestas aparecen solo como `Application Data`.
- **Confidencialidad:** con *Follow → TCP Stream* el contenido es ilegible. Buscando
  `mensaje-secreto-123` en los bytes de los paquetes (*Edit → Find Packet → String*) **no se
  encuentra**.
- **Rechazo de HTTP plano:**
  ```bash
  curl -i http://localhost:8081/mensajes
  # HTTP/1.1 403 Forbidden
  # {"error":"Acceso denegado: Se requiere conexión HTTPS segura (TLS)."}
  ```

### 5. Apagar el entorno
```bash
docker compose -f docker-compose.fase2.yml down
```

---

## Comparación

| | Fase 1 (HTTP) | Fase 2 (TLS) |
|---|---|---|
| Protocolo visto en Wireshark | HTTP | TLS 1.3 |
| Handshake | No hay | `Client Hello` / `Server Hello` |
| Contenido del `POST /mensajes` | Legible | `Application Data` cifrado |
| ¿Se encuentra `mensaje-secreto-123`? | Sí, en texto plano | No |
| HTTP plano hacia la API | Aceptado | Rechazado (403 en el 8081) |

**Conclusión:** sin canal seguro, cualquiera que intercepte el tráfico lee los mensajes del chat.
Con TLS, quien capture los paquetes solo ve que hubo comunicación y su tamaño, no su contenido.
El canal seguro cumple el escenario de **confidencialidad**.

Las capturas (`.pcapng`) y los pantallazos van en la carpeta `capturas/`.
