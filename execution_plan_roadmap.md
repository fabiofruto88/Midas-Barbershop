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
- [x] Aplicar el diseño de Figma (`diseño-midas`) — landing verificada contra el Figma (captura comparada sección por sección); estilos en `src/index.css` (tokens) y `src/components/ui/`.

## Fase 5: Dashboard de Barberos y Gestión de Medios
- [x] Construir Dashboard de Barbero (Vista de agenda diaria).
- [x] Configurar cuenta de Cloudinary y variables de entorno.
  - [x] Variables `CLOUDINARY_*` preparadas en `.env` / `.env.example` (sin ellas la subida responde 503).
  - [x] Credenciales de la cuenta rellenadas en `.env` local; subida y borrado reales verificados.
  - [x] Entrega optimizada en el frontend (`f_auto,q_auto` + recorte `c_fill,g_auto`) vía `src/lib/images.js`.
- [x] Implementar subida de imágenes en Backend (Multer + Cloudinary SDK) con validación de seguridad.
- [x] Integrar subida de resultados fotográficos desde el Dashboard del Barbero.
- [x] Mostrar galería de fotos en el historial del Cliente.

## Fase 6: Notificaciones Web Push y Tareas Programadas
- [x] Generar VAPID Keys e integrar librería `web-push` en backend.
- [x] Crear Service Worker en React para recibir notificaciones.
- [x] Crear flujo de suscripción del usuario (Frontend solicita permiso -> Backend guarda endpoint).
- [x] Implementar `node-cron` en backend para revisar citas a 15 minutos de ocurrir y disparar las notificaciones Push.
  - [x] Verificado de punta a punta en navegador real (Edge): suscripción → recordatorio → notificación mostrada por el Service Worker.

## Fase 7: Auditoría Final y Despliegue
- [x] Pruebas de estrés y seguridad (verificar rate limits y cookies).
- [ ] Despliegue de la Base de Datos (ej. Render, Supabase, AWS RDS).
- [ ] Despliegue del Backend (ej. Render, Railway, AWS EC2).
- [ ] Despliegue del Frontend (ej. Vercel, Netlify).
  - [x] Configuración lista: `render.yaml` (API + PostgreSQL), `midas-frontend/vercel.json` y guía en el `README.md`.
  - [ ] Crear las cuentas y ejecutar el despliegue (requiere acceso del propietario).

## Fase 8: Finanzas del Barbero
Objetivo: que cada barbero vea lo que ha generado por día, semana y mes. El precio del servicio es la referencia, pero el barbero puede cobrar más o menos; se guarda lo realmente cobrado en cada cita. Se muestra solo el bruto (sin comisiones).

### Base de datos (Prisma)
- [x] Enum `PaymentMethod { CASH, CARD, TRANSFER }`.
- [x] Campos nuevos en `Appointment`:
  - `listPrice Decimal(10,2)`: precio del servicio congelado al reservar (si el admin cambia el precio, el histórico no cambia).
  - `chargedAmount Decimal(10,2)?`: lo cobrado de verdad; se rellena al completar.
  - `tipAmount Decimal(10,2) @default(0)`: propina, separada del servicio.
  - `paymentMethod PaymentMethod?`
  - `priceNote String?`: motivo cuando `chargedAmount ≠ listPrice` (ej. "barba extra", "descuento").
  - `completedAt DateTime?`: momento en que se cerró la cita.
- [x] Índice `@@index([barberId, status, date])` para las consultas de resumen.
- [x] Migración con backfill: `listPrice = service.price` en todas las citas; en las `COMPLETED`, `chargedAmount = listPrice` y `completedAt = updatedAt`.

### Backend
- [x] `createAppointment`: guardar `listPrice` desde `service.price` dentro de la transacción de reserva.
- [x] `PATCH /appointments/:id/complete` acepta body opcional `{ chargedAmount, tipAmount, paymentMethod, priceNote }` (schema Zod en `appointment.schema.js`): importes ≥ 0 con 2 decimales, `priceNote` ≤ 200 caracteres; si no llega `chargedAmount` se usa `listPrice`. Guarda también `completedAt`.
- [x] Subida de resultado (`result.service.js`), que auto-completa la cita: rellenar `chargedAmount = listPrice` y `completedAt` si aún no estaban.
- [x] `PATCH /appointments/:id/charge` (barbero dueño / admin): corregir el cobro de una cita ya completada (errores de tecleo).
- [x] Nuevo `finance.service.js` + `finance.routes.js` (`/finance`), protegido con `authenticate` + `authorize('BARBER', 'ADMIN')`; el barbero solo ve lo suyo, el admin puede pasar `barberId`.
- [x] `GET /finance/summary?period=day|week|month&date=YYYY-MM-DD` (semana de lunes a domingo, fechas con `wallClock` como el resto). Devuelve:
  - Totales: servicios completados, ingreso por servicios, propinas, total y ticket medio.
  - Diferencia frente al precio de lista (suma de `chargedAmount − listPrice`) y nº de citas con ajuste al alza / a la baja.
  - Desglose por servicio: nombre, cantidad, total y precio medio cobrado.
  - Desglose por método de pago.
  - Serie para la gráfica: por hora (día) o por día (semana/mes).
  - Comparativa con el periodo anterior (% de variación).
  - Cancelaciones del periodo (cantidad, informativo).
- [x] Detalle de citas del periodo (importe, propina, método y nota) incluido en `entries` de `/finance/summary` (una sola llamada; no hizo falta un `/finance/entries` aparte).
- [x] Pendientes del periodo (cantidad y previsto a precio de lista) en `upcoming`.
- [x] Agregación en `finance.service.js` sumando en centavos (sin errores de coma flotante); siempre con `status = COMPLETED`.
- [x] Pruebas de integración (`tests/finance.test.js`, 12 pruebas): totales, ajuste de precio, propinas, límites de semana/mes, que un barbero no vea datos de otro y validación del body de completar.

### Frontend
- [x] `financeApi.summary` en `src/services/midas.js` y `appointmentsApi.complete(id, charge)` / `updateCharge(id, charge)`.
- [x] Formulario "Cerrar servicio" (`components/agenda/ChargeForm.jsx`, reutilizado para corregir) en `AgendaPage.jsx` al pulsar Completar: importe precargado con el precio de lista (editable), propina, método de pago (Efectivo / Tarjeta / Transferencia) y motivo (obligatorio en la UI si el importe cambia).
- [x] Nueva página `/agenda/finanzas` (`FinancePage.jsx`), enlazada desde `AgendaPage` y `SiteHeader` junto a Historial / Mi horario:
  - Selector Día / Semana / Mes con flechas para navegar entre periodos.
  - Tarjetas KPI: total generado, nº de servicios, ticket medio, propinas y variación frente al periodo anterior.
  - Gráfica de barras de ingresos (por hora o por día).
  - Tabla "Por servicio" (cantidad, total, precio medio) y reparto por método de pago.
  - Detalle de citas con badge "+/−" cuando se cobró distinto al precio fijo, con opción de corregir el cobro.
  - Estados vacío / carga / error con los componentes de `components/ui/`.
- [x] Moneda con `formatPrice` (ya existía en `src/lib/format.js`); etiquetas de método de pago en `src/lib/payments.js`.
- [x] Vista de admin: la misma página `/agenda/finanzas` con selector de barbero (o toda la barbería).
- [x] Verificado en navegador real (Edge): completar una cita con precio ajustado → aparece en el resumen con el importe correcto; vistas día/semana/mes y móvil sin desbordes.

## Extras (fuera del plan original)
- [x] Panel de Administración (`/admin`): gestión de servicios y equipo (crear barberos, cambiar roles).
- [x] Pantalla "Historial" del barbero (`/agenda/historial`): servicios completados con foto, notas y filtros; permite subir o cambiar la foto.
- [x] Pantalla "Mi horario" para que el barbero configure su disponibilidad desde la app.
- [x] Completar citas (`PATCH /appointments/:id/complete`) y agenda diaria (`GET /appointments/agenda`).
- [x] Suite de pruebas de integración del backend (103 pruebas) y E2E en navegador.