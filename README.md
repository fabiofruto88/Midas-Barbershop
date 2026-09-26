# Midas-Barbershop

Sistema de reservas para barberías: catálogo de servicios, reservas por bloques de 1 hora con o sin
cuenta, agenda del barbero con fotos del resultado, recordatorios push y panel de administración.

| Carpeta | Stack |
| --- | --- |
| [`midas-backend/`](midas-backend/) | Node 22 · Express 5 · Prisma 6 · PostgreSQL · Zod · JWT en cookie HttpOnly · Cloudinary · Web Push |
| [`midas-frontend/`](midas-frontend/) | React 19 · Vite · Tailwind CSS 4 · React Router 7 · React Query · Zustand |

Documentación de diseño (fuente de verdad):
[análisis de arquitectura y seguridad](architecture_security_analysis.md) ·
[esquema y contratos de la API](database_schema_and_api_contracts.md) ·
[plan de ejecución](execution_plan_roadmap.md).

## Desarrollo local

Requisitos: Node ≥ 22.12 y PostgreSQL.

```bash
# Backend (http://localhost:4000/api/v1)
cd midas-backend
npm install
cp .env.example .env        # completar DATABASE_URL, JWT_SECRET y ADMIN_*
npm run prisma:migrate      # crea las tablas
npm run prisma:seed         # crea el Admin (SEED_DEMO=true añade servicios y barberos demo)
npm run seed:demo           # opcional: escenario completo de prueba (citas, finanzas, reseñas, galería, tienda)
npm run dev

# Frontend (http://localhost:5173) — en otra terminal
cd midas-frontend
npm install
npm run dev                 # /api se redirige al backend
```

Cuentas demo (con `SEED_DEMO=true`): barberos `carlos@midas.com` y `andres@midas.com`, contraseña `Barbero123`.
Con `npm run seed:demo` (solo desarrollo, se puede repetir: borra y recrea los datos demo) se añade el barbero `mateo@midas.com` / `Barbero123`, clientes `juan@demo.midas`, `santiago@demo.midas`… / `Cliente123`, ~500 citas de los últimos 45 días y los próximos 14, reseñas, fotos de galería y productos.

## Pruebas

```bash
cd midas-backend && npm test     # integración: auth, servicios, reservas, concurrencia, fotos, push, seguridad
cd midas-frontend && npm run lint && npm run build
```

Las pruebas usan la base de datos del `.env` y borran todo lo que crean.

## Roles

| Rol | Puede |
| --- | --- |
| Invitado | Ver el catálogo, reservar sin cuenta y cancelar con su enlace privado (> 5 h antes). |
| Cliente | Lo anterior + historial con fotos, cancelar desde "Mis citas", recordatorios push. |
| Barbero | Agenda diaria, completar/cancelar citas, subir la foto del resultado, configurar su horario. |
| Admin | Agenda de todos, gestionar servicios y equipo (crear barberos, cambiar roles). |

## Despliegue

Arquitectura recomendada: **Render** (API + PostgreSQL) y **Vercel** (frontend), con Vercel
reenviando `/api/*` al backend. Así el navegador ve un único dominio y la cookie de sesión puede
seguir siendo `SameSite=Strict` (sin exposición a CSRF).

1. **Backend y base de datos (Render):** New → Blueprint → este repositorio (usa [`render.yaml`](render.yaml)).
   En el panel del servicio completa `CORS_ORIGIN` (URL de Vercel), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   las credenciales de Cloudinary y las claves VAPID (`npx web-push generate-vapid-keys`).
   Después, desde la Shell del servicio: `npm run prisma:seed`.
2. **Frontend (Vercel):** importar el repositorio con *Root Directory* = `midas-frontend`.
   En [`midas-frontend/vercel.json`](midas-frontend/vercel.json) cambia `https://midas-api.onrender.com`
   por la URL real del servicio de Render.

Notas de producción:

- `TRUST_PROXY` debe coincidir con el número de proxies delante del API (2 con Vercel + Render).
  Si es mayor, un atacante puede falsificar `X-Forwarded-For` y saltarse el rate limiting;
  si es menor, todos los clientes comparten el mismo límite.
- Los rate limiters guardan el estado en memoria: con varias instancias del API conviene un store
  compartido (Redis). Los recordatorios push deben activarse (`REMINDERS_ENABLED=true`) en una sola instancia.
- Web Push requiere HTTPS (localhost está exento en desarrollo).
