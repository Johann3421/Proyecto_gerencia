# NEXUS — Guía de Despliegue en Dokploy

> Guía completa para desplegar NEXUS en un servidor con Dokploy usando Docker Compose.  
> El repositorio ya está en GitHub. Esta guía cubre todo lo demás.

---

## Archivos de Docker incluidos en el repositorio

| Archivo | Descripción |
|---|---|
| `Dockerfile` | Build multi-etapa de la aplicación Next.js |
| `docker-compose.yml` | Orquestación: app + PostgreSQL |
| `docker-entrypoint.sh` | Script de inicio: aplica schema → arranca app |
| `.dockerignore` | Exclusiones para reducir tamaño de imagen |

---

## PASO 1 — Requisitos previos

- Un servidor con **Dokploy** instalado y funcionando  
  → Instalar Dokploy: `curl -sSL https://dokploy.com/install.sh | sh`
- El servidor debe tener Docker y Docker Compose disponibles (Dokploy los incluye)
- Acceso al panel de Dokploy en `http://IP_DEL_SERVIDOR:3000`
- Un dominio apuntando a la IP del servidor (por ejemplo `nexus.tudominio.com`) con registro A configurado

---

## PASO 2 — Crear el proyecto en Dokploy

1. Abre el panel de Dokploy
2. Ve a **Projects** → botón **Create Project**
3. Dale un nombre, por ejemplo `nexus`
4. Dentro del proyecto, haz clic en **Create Service** → **Application**
5. En la pantalla de configuración:
   - **Provider**: GitHub
   - **Repository**: selecciona tu repositorio (el que ya subiste)
   - **Branch**: `main`
   - **Build Type**: `Docker Compose`
   - **Docker Compose File**: `docker-compose.yml` *(viene por defecto)*
6. Haz clic en **Save**

---

## PASO 3 — Configurar las Variables de Entorno

En la sección **Environment** de tu aplicación en Dokploy, copia y pega el siguiente bloque **completo** y rellena los valores marcados:

```env
# ─── OBLIGATORIAS ──────────────────────────────────────────

# Contraseña para PostgreSQL (inventa una segura, ej: openssl rand -hex 32)
POSTGRES_PASSWORD=CAMBIA_ESTO_POR_UNA_CONTRASEÑA_SEGURA

# Clave secreta para NextAuth (mínimo 32 caracteres)
# Genera una con: openssl rand -hex 32
NEXTAUTH_SECRET=CAMBIA_ESTO_POR_UN_SECRET_MUY_LARGO_Y_ALEATORIO

# URL pública donde estará tu app (el dominio que configuraste)
NEXTAUTH_URL=https://nexus.tudominio.com

# ─── OPCIONALES (dejar vacías si no se usan aún) ───────────

NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=us2
PUSHER_APP_ID=
PUSHER_SECRET=
RESEND_API_KEY=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

> ⚠️ **No copies la línea `DATABASE_URL`** — el `docker-compose.yml` la construye  
> automáticamente usando `POSTGRES_PASSWORD`.

---

## PASO 4 — Configurar el Dominio

1. En tu aplicación Dokploy, ve a la pestaña **Domains**
2. Haz clic en **Add Domain**
3. Rellena:
   - **Host**: `nexus.tudominio.com`
   - **Service Name**: `app`  *(nombre del servicio en docker-compose.yml)*
   - **Port**: `3001`
   - **HTTPS**: activa **Certificate** → `Let's Encrypt` para SSL automático
4. Haz clic en **Save**

---

## PASO 5 — Primer Despliegue

1. Ve a la pestaña **Deployments** de tu aplicación
2. Haz clic en **Deploy** (o **Redeploy**)
3. Observa los logs en tiempo real — el proceso toma ~3–5 minutos la primera vez:
   - Docker descarga la imagen base `node:20-alpine`
   - Instala dependencias (`npm ci`)
   - Genera el cliente Prisma (`prisma generate`)
   - Compila Next.js (`next build`)
   - Arranca el contenedor
   - El script de inicio aplica el schema a PostgreSQL
   - Next.js inicia en el puerto 3000

✅ Cuando veas `✅ Base de datos lista` y `▶ Iniciando servidor Next.js...` en los logs, la app está operativa.

---

## PASO 6 — Poblar la Base de Datos (Seed)

La base de datos arranca vacía. Para cargar los datos iniciales (áreas, departamentos y usuarios de prueba):

1. En Dokploy, ve a la pestaña **Terminal** de tu aplicación  
   *(o usa SSH al servidor y ejecuta: `docker exec -it nexus_app sh`)*

2. Ejecuta el seed:

```sh
node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### Usuarios de prueba que crea el seed

| Email | Contraseña | Rol |
|---|---|---|
| `admin@nexus.lat` | `nexus2024` | Super Admin |
| `maria.garcia@nexus.lat` | `nexus2024` | Admin de Área |
| `roberto.sanchez@nexus.lat` | `nexus2024` | Supervisor |
| `juan.perez@nexus.lat` | `nexus2024` | Operario |
| `patricia.flores@nexus.lat` | `nexus2024` | Auditor |

---

## PASO 7 — Verificar que todo funciona

Abre `https://nexus.tudominio.com` en el navegador.  
Deberías ver la pantalla de login de NEXUS.

Inicia sesión con `admin@nexus.lat` / `nexus2024`.

---

## Actualizaciones futuras (Redeploy)

Cada vez que hagas `git push` a `main`:

1. Ve a Dokploy → tu aplicación → **Deployments**
2. Haz clic en **Redeploy**

Si quieres que Dokploy haga el redeploy **automáticamente** con cada push:
- Ve a **Settings** → activa **Auto Deploy** → guarda el Webhook URL que te da  
- En GitHub → tu repositorio → **Settings** → **Webhooks** → **Add webhook**  
  Pega la URL, selecciona `push` events, guarda

---

## Solución de Problemas

### La app no inicia / error de conexión a PostgreSQL

Revisa los logs del servicio `app`. Si ves:
```
Error: Can't reach database server at postgres:5432
```
Significa que PostgreSQL aún no estaba listo. Haz **Redeploy** — el healthcheck de PostgreSQL asegura que la app espere, pero en el primer arranque puede tardar más.

### Error `NEXTAUTH_SECRET` no configurado

Verifica que la variable esté en el panel de **Environment** de Dokploy (no en un archivo `.env`).

### Error de permisos en `docker-entrypoint.sh`

Si ves `permission denied: docker-entrypoint.sh`, ejecuta en tu máquina local:
```sh
git update-index --chmod=+x docker-entrypoint.sh
git commit -m "fix: permisos entrypoint"
git push
```

### Ver los logs en tiempo real

En el servidor (SSH):
```sh
docker logs nexus_app -f
docker logs nexus_db -f
```

### Conectarse directamente a PostgreSQL

```sh
docker exec -it nexus_db psql -U nexus -d nexus
```

### Borrar la base de datos y volver a empezar

```sh
docker compose down -v        # elimina contenedores Y volúmenes
# Luego vuelve a desplegar desde Dokploy
```

---

## Resumen de Variables de Entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `POSTGRES_PASSWORD` | ✅ | Contraseña de PostgreSQL |
| `NEXTAUTH_SECRET` | ✅ | Secret para firmar tokens JWT |
| `NEXTAUTH_URL` | ✅ | URL pública de la app (con https://) |
| `NEXT_PUBLIC_PUSHER_KEY` | ❌ | Para notificaciones en tiempo real |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ❌ | Cluster de Pusher (default: us2) |
| `PUSHER_APP_ID` | ❌ | ID de la app en Pusher |
| `PUSHER_SECRET` | ❌ | Secret de Pusher (servidor) |
| `RESEND_API_KEY` | ❌ | Para envío de emails |
| `UPLOADTHING_SECRET` | ❌ | Para subida de archivos |
| `UPLOADTHING_APP_ID` | ❌ | ID de UploadThing |

---

## Generar valores seguros para los secrets

Ejecuta en cualquier terminal:

```sh
# Para POSTGRES_PASSWORD
openssl rand -hex 32

# Para NEXTAUTH_SECRET  
openssl rand -hex 32
```
