# Midas — Backend

API REST de Midas (Express 5 + Prisma 6 + PostgreSQL). Arquitectura en capas:
`routes → controllers → services → Prisma`. Los controladores nunca acceden a la base de datos.

## Puesta en marcha

```bash
npm install
cp .env.example .env          # completar DATABASE_URL, JWT_SECRET y ADMIN_*
npm run prisma:migrate        # aplica las migraciones
npm run prisma:seed           # crea el Admin inicial
npm run dev                   # http://localhost:4000/api/v1
npm test                      # pruebas de integración (usan la BD del .env y limpian lo que crean)
```

## Endpoints (`/api/v1`)

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | Público | Estado del API y de la BD |
| POST | `/auth/register` | Público (10/15 min por IP) | Crea un CLIENT y abre sesión |
| POST | `/auth/login` | Público (5/min por IP) | Abre sesión (cookie `token` HttpOnly) |
| POST | `/auth/logout` | Público | Cierra sesión |
| GET | `/auth/me` | Sesión | Usuario actual |
| GET | `/services` | Público | Catálogo activo (`?includeInactive=true` solo Admin) |
| GET | `/services/:id` | Público | Detalle de servicio |
| POST / PATCH / DELETE | `/services[/:id]` | Admin | Gestión (DELETE = desactivar) |
| GET / POST | `/users` | Admin | Listar (`?role=`) / crear usuarios (por defecto BARBER) |
| GET / PATCH / DELETE | `/users/:id` | Admin | Gestión de usuarios |
| GET | `/barbers` | Público | Barberos (`id`, `name`) |
| GET | `/barbers/:barberId/availability` | Público | Horario semanal base |
| PUT | `/barbers/:barberId/availability` | Admin o el propio barbero | Reemplaza el horario semanal |
| GET / PUT | `/barbers/me/availability` | Barbero | Atajo para su propio horario |
| GET | `/appointments/availability?barberId&date` | Público | Bloques libres de 1 hora |
| POST | `/appointments` | Público / Cliente | Reserva (invitado: `guestName`, `guestPhone`, `guestEmail?`) |
| PATCH | `/appointments/:id/cancel` | Dueño, barbero, Admin o `X-Guest-Token` | Cancela (> 5 h de antelación para clientes) |
| GET | `/appointments/me` | Sesión | Historial del cliente / agenda del barbero |
| GET | `/appointments/agenda?date&barberId?` | Barbero (la suya) o Admin | Agenda diaria con datos de contacto |
| PATCH | `/appointments/:id/complete` | Barbero asignado o Admin | Marca como completada (cita ya iniciada) |
| POST | `/appointments/:id/results` | Barbero asignado | Foto del resultado (`multipart`, campo `image`, ≤ 5MB, JPEG/PNG/WebP) |
| GET | `/notifications/vapid-public-key` | Público | Clave pública VAPID |
| POST / DELETE | `/notifications/subscribe` | Sesión | Guarda / elimina el `PushSubscription` del navegador |

Los errores siempre responden `{ "error": "mensaje" }` (las validaciones añaden `details`).

## Decisiones de implementación

- **Concurrencia:** `POST /appointments` abre una transacción y bloquea la fila del barbero con
  `SELECT ... FOR UPDATE`; las reservas del mismo barbero se serializan. El
  `@@unique([barberId, date, timeSlot])` es la última barrera (→ 409).
- **Citas canceladas:** como el `@@unique` también incluye citas `CANCELLED`, al reservar un bloque
  ocupado por una cita cancelada, esta se elimina dentro de la misma transacción.
- **Zona horaria:** "hoy", los bloques pasados y la regla de 5 horas se calculan en
  `BUSINESS_TIMEZONE` (por defecto `America/Bogota`), no en la zona del servidor.
- **Antelación mínima:** un bloque de hoy solo se ofrece y se acepta si empieza dentro de al menos
  `BOOKING_MIN_LEAD_MINUTES` minutos (30 por defecto); si no, la reserva responde 400.
- **Quién reserva:** clientes registrados e invitados. Una sesión de admin o barbero recibe 403.
- **Horizonte de reserva:** solo se reserva hasta `BOOKING_WINDOW_DAYS` días (60 por defecto); más allá la
  disponibilidad sale vacía y la reserva responde 400.
- **Picos de carga:** antes de abrir la transacción se valida sin bloqueo (los intentos sobre un bloque ya
  ocupado responden 409 sin hacer cola). Si aun así Prisma no obtiene conexión o transacción a tiempo
  (`P2024`/`P2028`), se responde 503 con `Retry-After` en lugar de 500.
- **Invitados:** al reservar sin cuenta, la respuesta incluye `guestToken` (JWT firmado, 30 días),
  que se envía en la cabecera `X-Guest-Token` para cancelar.
- **Cancelación por la barbería:** Admin y el barbero asignado pueden cancelar sin la restricción de 5 horas.
- **Servicios:** `durationMinutes` no se acepta por API (fijo a 60 min por regla de negocio).
- **Fotos:** el tipo real se verifica por *magic numbers* (`file-type`), no por extensión. El
  `public_id` en Cloudinary es aleatorio. Subir la foto marca la cita como completada; reemplazarla
  borra la anterior. Sin credenciales de Cloudinary la subida responde 503.
- **Recordatorios:** `node-cron` corre al minuto 45 de cada hora (zona de la barbería) y avisa al
  cliente registrado y al barbero de las citas de la hora siguiente. Las suscripciones caducadas
  (404/410) se eliminan solas.

## Seguridad

- JWT `HS256` en cookie `HttpOnly` + `SameSite=Strict` (+ `Secure` en producción). En cada petición
  el rol se lee de la BD: degradar o eliminar un usuario revoca sus permisos al instante.
- Rate limiting: login 5/min, registro 10/15 min, reservas 10/h por IP (el personal está exento),
  300/15 min global. `TRUST_PROXY` (por defecto 0) evita que se falsifique la IP con `X-Forwarded-For`.
- Contraseñas limitadas a 72 **bytes** (límite real de bcrypt). Teléfonos normalizados (`+57 300 123-4567` → `+573001234567`).
- `/health` queda fuera del rate limiting para que los monitores de la plataforma no lo agoten.
- Validación estricta con Zod (mensajes en español) (campos desconocidos → 400), Helmet, sin `X-Powered-By`, y los
  errores 5xx inesperados nunca exponen detalles internos.
