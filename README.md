# Midas-Barbershop

Plataforma web para una barbería: landing pública con galería y reseñas, reservas por bloques de
1 hora (con o sin cuenta), agenda del barbero con cobro y foto del resultado, finanzas, tienda de
productos con pedido por WhatsApp, recordatorios push y panel de administración.

| Carpeta | Stack |
| --- | --- |
| [`midas-backend/`](midas-backend/) | Node 22 · Express 5 · Prisma 6 · PostgreSQL · Zod · JWT en cookie HttpOnly · Cloudinary · Web Push · node-cron |
| [`midas-frontend/`](midas-frontend/) | React 19 · Vite · Tailwind CSS 4 · React Router 7 · React Query · Zustand · Motion · Sonner |

Documentación de diseño (fuente de verdad):
[análisis de arquitectura y seguridad](architecture_security_analysis.md) ·
[esquema y contratos de la API](database_schema_and_api_contracts.md) ·
[plan de ejecución](execution_plan_roadmap.md).
Detalle de endpoints y decisiones del API: [`midas-backend/README.md`](midas-backend/README.md).

## Qué hace

### Sitio público

- **Landing** (`/`): hero, servicios con precios, perfiles de los barberos, galería de cortes,
  testimonios con la calificación media, ubicación, horario y contacto.
- **Galería:** solo muestra las fotos de resultados que el admin aprobó, sin datos del cliente.
- **Reseñas:** solo las visibles; el nombre del cliente se abrevia ("Carlos P.").
- **Tienda** (`/tienda`): catálogo por categorías, productos destacados y agotados, carrito
  persistente. No hay pago en línea: el carrito genera un mensaje con el pedido y el total y se
  envía por **WhatsApp** al asesor.

### Reservas (`/reservar`)

Flujo en pasos: servicio → barbero → fecha y hora → datos → confirmación.

- Bloques fijos de **1 hora** según el horario semanal de cada barbero, calculados en la zona
  horaria de la barbería (`BUSINESS_TIMEZONE`, por defecto `America/Bogota`).
- Se puede reservar hasta `BOOKING_WINDOW_DAYS` días por delante (60) y, para hoy, con al menos
  `BOOKING_MIN_LEAD_MINUTES` de antelación (30).
- **Invitados** reservan con nombre y teléfono y reciben un enlace privado (`/cancelar/:id`) con un
  token firmado que caduca un día después de la cita.
- **Clientes** registrados ven sus reservas en `/mis-citas`.
- Solo invitados y clientes reservan: una sesión de barbero o admin se redirige a su panel.
- El cliente puede cancelar hasta **5 horas antes**; la barbería puede cancelar en cualquier momento.
- Sin dobles reservas: la reserva bloquea la fila del barbero en una transacción y un índice único
  `(barbero, fecha, hora)` actúa como última barrera (409).

### Clientes (`/mis-citas`)

Historial de citas con la foto del resultado, cancelación, **reseña** de 1 a 5 estrellas sobre las
citas completadas (una por cita, editable) y activación de **recordatorios push**.

### Barberos (`/agenda`)

- **Agenda diaria** con los datos de contacto de cada cliente.
- **Completar y cobrar:** al cerrar una cita (solo cuando ya empezó) se registra lo cobrado, la
  propina, el método de pago (efectivo, tarjeta, transferencia) y una nota si el importe difiere del
  precio de lista. El cobro se puede corregir después.
- **Foto del resultado:** se sube a Cloudinary (JPEG/PNG/WebP ≤ 5 MB, tipo verificado por su
  contenido); subirla completa la cita y la foto queda pendiente de aprobación para la galería.
- **Horario** semanal (`/agenda/horario`) e **historial** de servicios con fotos (`/agenda/historial`).
- **Finanzas** (`/agenda/finanzas`): resumen del día, la semana o el mes con ingresos, propinas,
  ticket medio, ajuste frente al precio de lista, desglose por servicio y por método de pago,
  gráfica, comparativa con el periodo anterior, citas pendientes y canceladas.

### Administración (`/admin`)

| Sección | Qué permite |
| --- | --- |
| Servicios | Crear, editar y desactivar servicios del catálogo. |
| Equipo | Crear barberos, cambiar roles, eliminar usuarios y gestionar la foto de perfil del barbero. |
| Galería | Publicar u ocultar las fotos de resultados. |
| Reseñas | Mostrar u ocultar reseñas en la web. |
| Tienda | Categorías (con orden), productos, fotos, disponibilidad, visibilidad y destacados. |

El admin también ve la agenda y las finanzas de todos los barberos (con filtro por barbero).

### Recordatorios push

Un job (`node-cron`, minuto 45 de cada hora) avisa por Web Push al cliente registrado y al barbero
de las citas de la hora siguiente. Las suscripciones caducadas se eliminan solas. El service worker
está en [`midas-frontend/public/sw.js`](midas-frontend/public/sw.js).

## Roles

| Rol | Puede |
| --- | --- |
| Invitado | Ver la web y la tienda, reservar sin cuenta y cancelar con su enlace privado (> 5 h antes). |
| Cliente | Lo anterior + historial con fotos, cancelar desde "Mis citas", reseñar y recibir recordatorios. |
| Barbero | Su agenda, completar y cobrar citas, subir fotos, su horario, su historial y sus finanzas. |
| Admin | Agenda y finanzas de todos, servicios, equipo, galería, reseñas y tienda. |

## Seguridad

- JWT `HS256` en cookie `HttpOnly` + `SameSite=Strict` (+ `Secure` en producción). El rol se lee de
  la base de datos en cada petición, así que degradar o eliminar a un usuario revoca sus permisos al
  instante.
- Validación de entrada con Zod en todos los endpoints; errores con formato `{ "error": "..." }`.
- Rate limiting: login 5/min, registro 10/15 min, reservas 10/h por IP (el personal está exento) y
  300/15 min global. Helmet y CORS restringido a `CORS_ORIGIN`.
- Imágenes validadas por *magic numbers* y guardadas con `public_id` aleatorio.

## Desarrollo local

Requisitos: Node ≥ 22.12 y PostgreSQL.

```bash
# Backend (http://localhost:4000/api/v1)
cd midas-backend
npm install
cp .env.example .env        # completar DATABASE_URL, DIRECT_URL, JWT_SECRET y ADMIN_*
npm run prisma:migrate      # crea las tablas
npm run prisma:seed         # crea el Admin (SEED_DEMO=true añade servicios y barberos demo)
npm run seed:demo           # opcional: escenario completo de prueba
npm run dev

# Frontend (http://localhost:5173) — en otra terminal
cd midas-frontend
npm install
npm run dev                 # Vite reenvía /api al backend (misma cookie de origen)
```

Variables opcionales del backend: Cloudinary (sin ellas la subida de fotos responde 503) y VAPID
para push (`npx web-push generate-vapid-keys`). Todas están documentadas en
[`midas-backend/.env.example`](midas-backend/.env.example).

### Datos de demostración

- Con `SEED_DEMO=true`: barberos `carlos@midas.com` y `andres@midas.com`, contraseña `Barbero123`.
- `npm run seed:demo` (solo desarrollo; se puede repetir, borra y recrea los datos demo) añade el
  barbero `mateo@midas.com` / `Barbero123`, clientes `juan@demo.midas`, `santiago@demo.midas`… /
  `Cliente123`, ~500 citas de los últimos 45 días y los próximos 14 (con cobros para las finanzas),
  reseñas, fotos de galería y productos de la tienda.

## Pruebas

```bash
cd midas-backend && npm test                  # integración (node:test + supertest)
cd midas-frontend && npm run lint && npm run build
```

Las pruebas cubren autenticación, servicios, reservas y concurrencia, cancelación y tokens de
invitado, fotos, push, reseñas, finanzas, tienda y seguridad. Usan la base de datos del `.env` y
borran todo lo que crean.

## Despliegue

Configuración actual: **Vercel** para frontend y backend, y **Neon** como PostgreSQL.

1. **Base de datos (Neon):** `DATABASE_URL` es la URL con `-pooler` en el host (la usa la app) y
   `DIRECT_URL` la misma sin `-pooler` (la usan las migraciones).
2. **Backend (Vercel):** proyecto con *Root Directory* = `midas-backend`. En Vercel `server.js`
   exporta la app como función serverless, y el script `vercel-build` aplica las migraciones y crea
   el admin en cada despliegue. Completar las variables del `.env.example` (`CORS_ORIGIN` = URL del
   frontend, `JWT_SECRET`, `ADMIN_*`, Cloudinary, VAPID).
3. **Frontend (Vercel):** proyecto con *Root Directory* = `midas-frontend`.
   [`vercel.json`](midas-frontend/vercel.json) reenvía `/api/*` al backend, así el navegador ve un
   único dominio y la cookie puede seguir siendo `SameSite=Strict`. Si cambia la URL del backend,
   actualízala ahí.

Alternativa: [`render.yaml`](render.yaml) despliega el API como servicio persistente en Render
(también contra Neon), aplicando migraciones al arrancar.

Notas de producción:

- **Recordatorios:** en Vercel no hay procesos en segundo plano, así que el job de recordatorios no
  corre. Para tenerlos hace falta el API en un servidor persistente (Render) con
  `REMINDERS_ENABLED=true` en una sola instancia, o un cron externo.
- `TRUST_PROXY` debe coincidir con el número de proxies delante del API. Si es mayor, se puede
  falsificar `X-Forwarded-For` y saltarse el rate limiting; si es menor, todos los clientes
  comparten el mismo límite.
- Los rate limiters guardan el estado en memoria: con varias instancias (o en serverless) conviene
  un store compartido como Redis.
- Web Push requiere HTTPS (localhost está exento en desarrollo).
