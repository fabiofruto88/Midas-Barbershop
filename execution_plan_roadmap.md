# Plan de Ejecución Maestro - Midas
Este documento servirá como nuestro tracker. Iremos marcando con una `[x]` cada fase a medida que la completemos.

## Fase 1: Setup e Infraestructura (Foundation)
- [x] Inicializar repositorios monorepo (o carpetas separadas front/back) con Git.
- [x] Configurar servidor Express base con middlewares de seguridad (Helmet, CORS, Rate Limiter).
- [x] Configurar conexión a PostgreSQL usando ORM (Prisma/Sequelize).
- [x] Modelar y ejecutar migraciones de la base de datos (Users, Services, Availability, Appointments, Results).
- [x] Configurar frontend base: Vite + React + Tailwind CSS + React Router.

## Fase 2: Core Backend - Identidad y Catálogos
- [x] Implementar sistema de Autenticación (Registro, Login) usando JWT en cookies HttpOnly.
- [x] Crear endpoints de CRUD para `Services` (Solo Admin).
- [x] Crear endpoints de gestión de `Users/Barbers` (Solo Admin).
- [x] Implementar endpoints para que el Barbero configure su `Availability` (Horarios semanales).

## Fase 3: El Motor de Reservas (Backend Booking Engine)
- [x] Desarrollar endpoint de cálculo de Disponibilidad (`GET /availability`). Debe cruzar el horario laboral con las citas existentes.
- [x] Desarrollar endpoint de Creación de Citas (`POST /appointments`) con **Transacciones DB y Bloqueos anti-concurrencia**.
- [x] Desarrollar endpoint de Cancelación con validación de regla de negocio (Mínimo 5 horas de antelación).

## Fase 4: Frontend - Vistas de Clientes
- [x] Construir Layout principal y Landing Page (Catálogo de servicios).
- [x] Construir flujo de reserva (Selección de Barbero -> Fecha -> Hora -> Datos/Login).
- [x] Construir Dashboard de Cliente Registrado (Ver historial y citas futuras).
- [x] Integrar consumo de APIs con React Query o Axios + Zustand.
- [ ] Aplicar el diseño de Figma (`diseño-midas`) — pendiente de acceso al archivo; los estilos están centralizados en `src/index.css` (tokens) y `src/components/ui/`.

## Fase 5: Dashboard de Barberos y Gestión de Medios
- [x] Construir Dashboard de Barbero (Vista de agenda diaria).
- [ ] Configurar cuenta de Cloudinary y variables de entorno.
  - [x] Variables `CLOUDINARY_*` preparadas en `.env` / `.env.example` (sin ellas la subida responde 503).
  - [ ] Crear la cuenta de Cloudinary y rellenar las credenciales.
- [x] Implementar subida de imágenes en Backend (Multer + Cloudinary SDK) con validación de seguridad.
- [x] Integrar subida de resultados fotográficos desde el Dashboard del Barbero.
- [x] Mostrar galería de fotos en el historial del Cliente.

## Fase 6: Notificaciones Web Push y Tareas Programadas
- [x] Generar VAPID Keys e integrar librería `web-push` en backend.
- [x] Crear Service Worker en React para recibir notificaciones.
- [x] Crear flujo de suscripción del usuario (Frontend solicita permiso -> Backend guarda endpoint).
- [x] Implementar `node-cron` en backend para revisar citas a 15 minutos de ocurrir y disparar las notificaciones Push.

## Fase 7: Auditoría Final y Despliegue
- [x] Pruebas de estrés y seguridad (verificar rate limits y cookies).
- [ ] Despliegue de la Base de Datos (ej. Render, Supabase, AWS RDS).
- [ ] Despliegue del Backend (ej. Render, Railway, AWS EC2).
- [ ] Despliegue del Frontend (ej. Vercel, Netlify).
  - [x] Configuración lista: `render.yaml` (API + PostgreSQL), `midas-frontend/vercel.json` y guía en el `README.md`.
  - [ ] Crear las cuentas y ejecutar el despliegue (requiere acceso del propietario).

## Extras (fuera del plan original)
- [x] Panel de Administración (`/admin`): gestión de servicios y equipo (crear barberos, cambiar roles).
- [x] Pantalla "Mi horario" para que el barbero configure su disponibilidad desde la app.
- [x] Completar citas (`PATCH /appointments/:id/complete`) y agenda diaria (`GET /appointments/agenda`).
- [x] Suite de pruebas de integración del backend (74 pruebas) y E2E en navegador.