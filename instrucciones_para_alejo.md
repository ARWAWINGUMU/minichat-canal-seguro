# Instrucciones de Captura - Fase 2 (Canal Seguro TLS)
**Para:** Alejandro

Hola Alejo. Ya implementé toda la seguridad y los certificados en la rama de la Fase 2. Ahora te toca hacer la captura del tráfico cifrado.

Sigue estos pasos al pie de la letra y tendrás tu archivo `.pcap` en menos de 5 minutos.

## Paso 1: Bajar los cambios
Asegúrate de estar en mi rama. En tu terminal ejecuta:
```bash
git fetch origin
git checkout feature/fase2-tls
git pull origin feature/fase2-tls
```

## Paso 2: Levantar el entorno de la Fase 2
He creado un archivo `docker-compose.fase2.yml` que ya incluye los volúmenes de los certificados y tu contenedor `capturador` configurado para atrapar todo.
```bash
docker-compose -f docker-compose.fase2.yml up -d --build
```
> *Nota:* El comando va a crear los contenedores en segundo plano. El contenedor capturador (`nicolaka/netshoot`) ya está ejecutando `tcpdump` por ti internamente.

## Paso 3: Interactuar con el Chat (Generar tráfico)
1. Abre tu navegador (Chrome/Edge/Firefox).
2. Entra a: **`https://localhost:3000`** (¡Ojo que ahora es **HTTPS**!).
3. El navegador te lanzará una **ADVERTENCIA DE SEGURIDAD** (tu conexión no es privada). Esto es completamente normal porque los certificados los creé yo (CA propia) y tu navegador no me conoce.
4. Dale clic a "Configuración Avanzada" y luego a **"Continuar a localhost (inseguro)"**.
5. Verás el minichat. Escribe nuestro mensaje de prueba: **`mensaje-secreto-123`** y dale enviar.

## Paso 4: Detener el entorno y recoger la captura
Ya generaste el tráfico. Ahora vamos a apagar todo para que `tcpdump` termine de guardar el archivo.
```bash
docker-compose -f docker-compose.fase2.yml down
```

¡Listo! Revisa la carpeta `capturas/` en el proyecto. Verás un archivo llamado **`fase2_con_tls.pcap`**.

## Paso 5: Wireshark (Evidencias)
1. Abre `fase2_con_tls.pcap` con Wireshark.
2. Escribe en la barra de filtros de Wireshark: **`tls`** y dale Enter.
3. Deberías ver paquetes que dicen `Client Hello`, `Server Hello` (este es el handshake).
4. Luego verás paquetes que dicen **`Application Data`**.
5. Si intentas hacer *Click derecho -> Follow -> TLS Stream* (o TCP Stream), verás que el contenido es pura "basura" (caracteres incomprensibles). **El mensaje-secreto-123 ya no se puede leer**.
6. ¡Toma tus pantallazos! Eso es lo que necesitamos para el informe de Cata.
