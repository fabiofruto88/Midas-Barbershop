# Midas Barbershop - Data Dictionary & API Contracts

Este documento contiene las especificaciones exactas para la base de datos (PostgreSQL) y los contratos de la API RESTful. Es el documento guía (Single Source of Truth) para el desarrollo guiado por agentes (Spec-Driven Development).

---

## 1. Data Dictionary (Esquema de Base de Datos)

Se utilizará **Prisma ORM** para la gestión de PostgreSQL. A continuación, el esquema físico exacto.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  BARBER
  CLIENT
}

enum AppointmentStatus {
  PENDING
  COMPLETED
  CANCELLED
}

model User {
  id                String   @id @default(uuid())
  role              Role     @default(CLIENT)
  name              String
  email             String?  @unique // Opcional para invitados que luego se registran
  passwordHash      String?
  phone             String?
  pushSubscription  Json?    // Almacena el token de Web Push
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relaciones
  barberAvailability BarberAvailability[]
  appointmentsAsBarber Appointment[] @relation("BarberAppointments")
  appointmentsAsClient Appointment[] @relation("ClientAppointments")
}

model Service {
  id              String   @id @default(uuid())
  name            String
  description     String?
  price           Decimal  @db.Decimal(10, 2)
  durationMinutes Int      @default(60) // Fijo a 1 hora según reglas de negocio
  isActive        Boolean  @default(true)
  
  appointments    Appointment[]
}

model BarberAvailability {
  id          String   @id @default(uuid())
  barberId    String
  dayOfWeek   Int      // 1 = Lunes, 7 = Domingo
  startTime   String   // Formato "HH:mm" (ej. "10:00")
  endTime     String   // Formato "HH:mm" (ej. "20:00")

  barber      User     @relation(fields: [barberId], references: [id])

  @@unique([barberId, dayOfWeek]) // Un barbero solo tiene un horario base por día
}

model Appointment {
  id              String            @id @default(uuid())
  barberId        String
  clientId        String?           // Null si es guest (invitado)
  serviceId       String
  
  // Datos Guest (si clientId es null)
  guestName       String?
  guestPhone      String?
  guestEmail      String?

  date            DateTime          @db.Date // "YYYY-MM-DD"
  timeSlot        String            // "HH:mm" (ej. "14:00")
  status          AppointmentStatus @default(PENDING)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relaciones
  barber          User              @relation("BarberAppointments", fields: [barberId], references: [id])
  client          User?             @relation("ClientAppointments", fields: [clientId], references: [id])
  service         Service           @relation(fields: [serviceId], references: [id])
  result          ServiceResult?

  // Índice compuesto para evitar concurrencia (Race conditions)
  @@unique([barberId, date, timeSlot]) 
}

model ServiceResult {
  id              String      @id @default(uuid())
  appointmentId   String      @unique
  imageUrl        String      // URL segura de Cloudinary
  notes           String?     // Opcional, por si el barbero quiere dejar un comentario técnico
  isPublished     Boolean     @default(false) // El admin decide qué fotos salen en la galería pública
  createdAt       DateTime    @default(now())

  appointment     Appointment @relation(fields: [appointmentId], references: [id])

  @@index([isPublished, createdAt])
}
```

---

## 2. API Contracts (Contratos de Endpoints)

Todos los endpoints tienen el prefijo base `/api/v1`. La autenticación se maneja vía cookies `HttpOnly` que contienen el JWT.

### 2.1 Autenticación (`/auth`)

#### `POST /auth/register`
Crea una cuenta de cliente.
*   **Request Body:**
    ```json
    {
      "name": "Juan Perez",
      "email": "juan@example.com",
      "password": "securePassword123",
      "phone": "+573001234567"
    }
    ```
*   **Response (201 Created):** `Set-Cookie: token=...` y datos del usuario (sin password).

#### `POST /auth/login`
*   **Request Body:** `{ "email": "juan@example.com", "password": "securePassword123" }`
*   **Response (200 OK):** `Set-Cookie: token=...`

---

### 2.2 Citas / Appointments (`/appointments`)

#### `GET /appointments/availability`
Retorna los bloques de 1 hora disponibles de un barbero para una fecha (Calcula horario base - citas activas).
*   **Query Params:** `?barberId=UUID&date=2023-11-20`
*   **Response (200 OK):**
    ```json
    {
      "date": "2023-11-20",
      "barberId": "UUID",
      "availableSlots": ["10:00", "11:00", "13:00", "15:00"]
    }
    ```

#### `POST /appointments`
Crea una nueva reserva. El backend aplica *Pessimistic Locking* aquí.
*   **Request Body (Cliente Registrado):**
    ```json
    {
      "barberId": "UUID",
      "serviceId": "UUID",
      "date": "2023-11-20",
      "timeSlot": "14:00"
    }
    ```
*   **Request Body (Guest / Invitado):** Añade `guestName`, `guestPhone`, `guestEmail`.
*   **Response (201 Created):** Retorna el objeto `Appointment`.
*   **Error (409 Conflict):** `{"error": "El horario seleccionado ya no está disponible."}`
*   **Error (400):** bloque pasado o que empieza en menos de `BOOKING_MIN_LEAD_MINUTES` (30 por defecto).
*   **Error (403):** la sesión es de un admin o barbero (solo reservan clientes e invitados).

#### `PATCH /appointments/:id/cancel`
Cancela una cita. Solo permitida si faltan > 5 horas.
*   **Headers:** Requiere Auth Cookie (o un token de invitado para clientes no registrados).
*   **Response (200 OK):** `{"message": "Cita cancelada exitosamente."}`
*   **Error (400 Bad Request):** `{"error": "No se puede cancelar con menos de 5 horas de antelación."}`

#### `GET /appointments/me`
Obtiene el historial de citas del usuario actual (Requiere Auth).
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "UUID",
        "date": "2023-11-15",
        "timeSlot": "10:00",
        "status": "COMPLETED",
        "service": { "name": "Corte + Barba" },
        "barber": { "name": "Carlos" },
        "result": { "imageUrl": "https://res.cloudinary.com/..." } 
      }
    ]
    ```

---

### 2.3 Galerías y Resultados (`/results`)

#### `POST /appointments/:id/results`
Sube la foto del corte finalizado. Solo permitido para Barberos.
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body:** `image` (File object)
*   **Process:** El backend recibe con Multer -> Sube a Cloudinary -> Guarda en DB.
*   **Response (201 Created):**
    ```json
    {
      "id": "UUID",
      "appointmentId": "UUID",
      "imageUrl": "https://res.cloudinary.com/midas/image/upload/v1234/foto.jpg",
      "isPublished": false
    }
    ```
*   Toda foto nueva (o reemplazada) queda con `isPublished: false` hasta que el admin la apruebe.

#### `GET /results/public`
Galería pública de la landing: solo resultados con `isPublished: true`, del más reciente al más antiguo. Sin datos del cliente ni notas técnicas.
*   **Query:** `limit` (1-24, por defecto 12).
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "UUID",
        "imageUrl": "https://res.cloudinary.com/...",
        "createdAt": "2026-09-26T15:00:00.000Z",
        "appointment": { "date": "2026-09-26T00:00:00.000Z", "service": { "name": "Corte" }, "barber": { "name": "Juan" } }
      }
    ]
    ```

#### `GET /results` (Admin)
Todos los resultados para moderar la galería. Mismo formato que el público más `notes` e `isPublished`.
*   **Query:** `isPublished` (`true` | `false`, opcional).

#### `PATCH /results/:id` (Admin)
Publica u oculta una foto en la galería.
*   **Body:** `{ "isPublished": true }`
*   **Response (200 OK):** `{ "id": "UUID", "isPublished": true }` · 404 si no existe.

---

### 2.3.1 Reseñas (`/reviews`)

Modelo `Review`: una reseña por cita (`appointmentId` único), `rating` 1-5, `comment` (10-500 caracteres) e `isVisible` (por defecto `true`; el admin puede ocultarla).

#### `PUT /appointments/:id/review` (Cliente)
Crea o edita la reseña de una cita propia en estado `COMPLETED`. Editarla no cambia su visibilidad.
*   **Body:** `{ "rating": 5, "comment": "Excelente corte y atención." }`
*   **Errores:** 400 si la cita no está completada o los datos son inválidos · 403 si la cita es de otro cliente · 404 si no existe.
*   `GET /appointments/me` del cliente incluye `review: { rating, comment }` (o `null`).

#### `GET /reviews/public`
Testimonios de la landing: solo reseñas visibles, de la más reciente a la más antigua. El autor se muestra como "Nombre I." (sin email ni apellido completo).
*   **Query:** `limit` (1-12, por defecto 6).
*   **Response (200 OK):**
    ```json
    {
      "summary": { "average": 4.8, "count": 12 },
      "reviews": [
        {
          "id": "UUID",
          "rating": 5,
          "comment": "Excelente corte y atención.",
          "createdAt": "2026-09-26T15:00:00.000Z",
          "author": "Carlos P.",
          "appointment": { "service": { "name": "Corte" }, "barber": { "name": "Juan" } }
        }
      ]
    }
    ```

#### `GET /reviews` (Admin)
Todas las reseñas con `isVisible` y el cliente (`name`, `email`). **Query:** `isVisible` (`true` | `false`, opcional).

#### `PATCH /reviews/:id` (Admin)
*   **Body:** `{ "isVisible": false }` · **Response:** `{ "id": "UUID", "isVisible": false }` · 404 si no existe.

---

### 2.3.2 Foto del barbero (`/users/:id/avatar`)

`User.avatarUrl` (opcional). Si es `null`, el frontend usa el retrato por defecto. `GET /barbers` devuelve `{ id, name, avatarUrl }`.

#### `POST /users/:id/avatar` (Admin)
Sube o reemplaza la foto de un **barbero** (`multipart/form-data`, campo `image`, JPEG/PNG/WebP hasta 5MB). La foto anterior se borra de Cloudinary.
*   **Response (200 OK):** el usuario con `avatarUrl`. 400 si el usuario no es barbero · 415 si no es una imagen real.

#### `DELETE /users/:id/avatar` (Admin)
Quita la foto (vuelve a la de por defecto) y la borra de Cloudinary.

---

### 2.4 Web Push Notifications (`/notifications`)

#### `POST /notifications/subscribe`
Guarda el token del navegador para notificaciones.
*   **Request Body:** Objeto `PushSubscription` estándar del navegador.
*   **Response (200 OK):** `{"message": "Suscripción guardada."}`