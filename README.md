# Cumpleaños en INBESTIGA — paquete de despliegue

La página permite consultar los cumpleaños públicamente. Para entrar al editor se necesita un DNI autorizado. Las altas, modificaciones y eliminaciones se guardan en Supabase.

## 1. Supabase
1. En tu proyecto abre **SQL Editor**.
2. Ejecuta el archivo `supabase.sql` (crea `public.app_state` e inserta los 120 registros iniciales).
3. Copia la URL del proyecto y la clave **service_role** desde Project Settings → API. La clave service_role es secreta.

## 2. Preparar los DNI autorizados (sin compartirlos)
En tu computadora, instala Node.js 20 o superior. Descomprime este ZIP y abre una terminal dentro de la carpeta.
Para cada DNI autorizado ejecuta:
`node scripts/hash-dni.js 12345678`
El comando muestra un hash aleatorio; no muestra ni envía el DNI. Copia cada resultado y júntalos en una sola línea separados por comas. No escribas los DNI en Vercel.

## 3. Variables de Vercel
En Project → Settings → Environment Variables agrega:
- `SUPABASE_URL`: URL de tu proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave service_role de Supabase.
- `SESSION_SECRET`: una cadena aleatoria larga de al menos 32 caracteres.
- `EDITOR_DNI_HASHES`: los hashes generados, separados por comas.

No pongas estas claves en `index.html` ni las compartas en el chat.

## 4. Desplegar
Sube la carpeta completa a Vercel, incluyendo las carpetas `api` y `scripts`. Vercel detecta automáticamente las funciones Node.js; `vercel.json` está vacío intencionalmente para evitar el error de runtime anterior.

## Seguridad y privacidad
- La consulta pública muestra nombres, áreas, sedes y cumpleaños, tal como se solicitó. Confirma que INBESTIGA autoriza esa difusión.
- La clave service_role solo se usa en el servidor.
- La sesión de edición usa una cookie HttpOnly, Secure y SameSite=Strict, con duración de 8 horas.
- El límite de intentos de login incluido es una protección básica por instancia; para un entorno de producción de mayor riesgo conviene añadir rate limiting persistente.
- Los DNI autorizados se almacenan como hashes scrypt con sal aleatoria.

## Importante
No incluyas `.env` en el ZIP ni publiques secretos. El archivo `.env.example` es solo una plantilla.
Actualización de despliegue INBESTIGA
