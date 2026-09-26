const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { ensureBarber } = require('./user.service');
const { getServiceById } = require('./service.service');
const { signGuestToken, verifyGuestToken } = require('../utils/token');
const { wallClock, nowInBusinessZone, toDateString, isoDayOfWeek, hourlySlots, hoursUntil } = require('../utils/time');

const SLOT_TAKEN = 'El horario seleccionado ya no está disponible.';
const CANCELLATION_WINDOW_HOURS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// Las fechas @db.Date se devuelven como "YYYY-MM-DD" (contrato de la API).
const formatAppointment = (appointment) => ({ ...appointment, date: toDateString(appointment.date) });

// Estado de la agenda de un barbero para un día: bloques del horario base y bloques ocupados.
// Recibe `db` para poder ejecutarse dentro de una transacción.
const loadDaySchedule = async (db, barberId, date) => {
  const availability = await db.barberAvailability.findUnique({
    where: { barberId_dayOfWeek: { barberId, dayOfWeek: isoDayOfWeek(date) } },
  });
  const workingSlots = availability ? hourlySlots(availability.startTime, availability.endTime) : [];

  const booked = await db.appointment.findMany({
    where: { barberId, date: wallClock(date), status: { not: 'CANCELLED' } },
    select: { timeSlot: true },
  });

  return { workingSlots, takenSlots: new Set(booked.map((item) => item.timeSlot)) };
};

const MINUTE_MS = 60 * 1000;

// Un bloque ya no es reservable si empezó o empieza antes de la antelación mínima.
const isTooSoon = (date, timeSlot, now) =>
  wallClock(date, timeSlot).getTime() - now.getTime() < Math.max(config.bookingMinLeadMinutes * MINUTE_MS, 1);

// Último día reservable: evita que se bloquee la agenda con reservas a años vista.
const lastBookableDate = (now) => toDateString(new Date(now.getTime() + config.bookingWindowDays * DAY_MS));

// GET /appointments/availability: horario base − citas activas − bloques ya pasados.
const getAvailability = async ({ barberId, date }) => {
  await ensureBarber(barberId);
  const now = nowInBusinessZone();

  let availableSlots = [];
  if (date >= toDateString(now) && date <= lastBookableDate(now)) {
    const { workingSlots, takenSlots } = await loadDaySchedule(prisma, barberId, date);
    availableSlots = workingSlots.filter((slot) => !takenSlots.has(slot) && !isTooSoon(date, slot, now));
  }

  return { date, barberId, availableSlots };
};

// POST /appointments con bloqueo pesimista.
const createAppointment = async (input, user) => {
  const { barberId, serviceId, date, timeSlot } = input;
  // Reservan los clientes y los invitados; el personal (admin/barbero) gestiona citas, no las pide.
  if (user && user.role !== 'CLIENT') {
    throw new AppError('Las cuentas de administrador o barbero no pueden reservar citas.', 403);
  }
  const isClient = user?.role === 'CLIENT';

  // Cliente con sesión → la cita es suya. Invitado → datos de invitado.
  const owner = isClient
    ? { clientId: user.id, guestName: null, guestPhone: null, guestEmail: null }
    : { clientId: null, guestName: input.guestName, guestPhone: input.guestPhone, guestEmail: input.guestEmail ?? null };

  if (!isClient && (!owner.guestName || !owner.guestPhone)) {
    throw new AppError('Para reservar sin cuenta debes indicar guestName y guestPhone.', 400);
  }

  const service = await getServiceById(serviceId, { includeInactive: false });

  const now = nowInBusinessZone();
  if (isTooSoon(date, timeSlot, now)) {
    throw new AppError(
      `Ese horario ya pasó o está muy próximo: reserva con al menos ${config.bookingMinLeadMinutes} minutos de antelación.`,
      400
    );
  }
  if (date > lastBookableDate(now)) {
    throw new AppError(`Solo se puede reservar con hasta ${config.bookingWindowDays} días de antelación.`, 400);
  }

  // Validación previa SIN bloqueo: los intentos inválidos o sobre un bloque ya ocupado (la inmensa
  // mayoría cuando muchos compiten por la misma hora) responden sin abrir transacción ni hacer cola.
  // No sustituye a la comprobación dentro de la transacción, que es la que garantiza la integridad.
  await ensureBarber(barberId);
  const preview = await loadDaySchedule(prisma, barberId, date);
  if (!preview.workingSlots.includes(timeSlot)) {
    throw new AppError('El barbero no atiende en la fecha y hora seleccionadas.', 400);
  }
  if (preview.takenSlots.has(timeSlot)) throw new AppError(SLOT_TAKEN, 409);

  let appointment;
  try {
    appointment = await prisma.$transaction(
      async (tx) => {
        // Pessimistic Locking: bloquea la fila del barbero hasta el fin de la transacción.
        // Todas las reservas del mismo barbero se serializan; las de otros barberos no se bloquean.
        const [barber] = await tx.$queryRaw`SELECT "id", "role" FROM "User" WHERE "id" = ${barberId} FOR UPDATE`;
        if (!barber || barber.role !== 'BARBER') throw new AppError('Barbero no encontrado.', 404);

        // Re-comprobación con el bloqueo tomado (el horario o las citas pudieron cambiar).
        const { workingSlots, takenSlots } = await loadDaySchedule(tx, barberId, date);
        if (!workingSlots.includes(timeSlot)) {
          throw new AppError('El barbero no atiende en la fecha y hora seleccionadas.', 400);
        }
        if (takenSlots.has(timeSlot)) throw new AppError(SLOT_TAKEN, 409);

        // El @@unique([barberId, date, timeSlot]) también cubre citas CANCELLED: para liberar el
        // bloque se elimina la cita cancelada que lo ocupa (nunca tiene resultado asociado).
        await tx.appointment.deleteMany({
          where: { barberId, date: wallClock(date), timeSlot, status: 'CANCELLED', result: { is: null } },
        });

        return tx.appointment.create({
          // listPrice congela el precio: si el admin lo cambia después, el histórico no varía.
          data: { barberId, serviceId, listPrice: service.price, date: wallClock(date), timeSlot, ...owner },
        });
      },
      // Picos de reservas simultáneas: más margen para obtener conexión; la transacción en sí es corta.
      { maxWait: 10_000, timeout: 10_000 }
    );
  } catch (error) {
    // Última barrera: la restricción única de la BD.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(SLOT_TAKEN, 409);
    }
    throw error;
  }

  const result = formatAppointment(appointment);
  if (!isClient) result.guestToken = signGuestToken(appointment.id);
  return result;
};

const canManage = (appointment, user, guestToken) => {
  if (user?.role === 'ADMIN') return { allowed: true, staff: true };
  if (user?.role === 'BARBER' && appointment.barberId === user.id) return { allowed: true, staff: true };
  if (user && appointment.clientId === user.id) return { allowed: true, staff: false };
  if (guestToken && !appointment.clientId && verifyGuestToken(guestToken, appointment.id)) {
    return { allowed: true, staff: false };
  }
  return { allowed: false };
};

// PATCH /appointments/:id/cancel
const cancelAppointment = async (id, user, guestToken) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError('Cita no encontrada.', 404);

  const { allowed, staff } = canManage(appointment, user, guestToken);
  if (!allowed) {
    if (!user && !guestToken) throw new AppError('Debes iniciar sesión o enviar tu token de invitado.', 401);
    throw new AppError('No tienes permiso para cancelar esta cita.', 403);
  }

  if (appointment.status !== 'PENDING') throw new AppError('Solo se pueden cancelar citas pendientes.', 400);

  // La barbería (admin o el barbero asignado) puede cancelar en cualquier momento.
  const date = toDateString(appointment.date);
  if (!staff && hoursUntil(date, appointment.timeSlot) <= CANCELLATION_WINDOW_HOURS) {
    throw new AppError('No se puede cancelar con menos de 5 horas de antelación.', 400);
  }

  // Actualización condicionada: evita carreras con otra cancelación/finalización simultánea.
  const { count } = await prisma.appointment.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  if (count === 0) throw new AppError('Solo se pueden cancelar citas pendientes.', 400);
};

// GET /appointments/me: historial del cliente, o del barbero (con cliente y notas técnicas de la foto).
const listMyAppointments = async (user) => {
  const isBarber = user.role === 'BARBER';

  const appointments = await prisma.appointment.findMany({
    where: isBarber ? { barberId: user.id } : { clientId: user.id },
    orderBy: [{ date: 'desc' }, { timeSlot: 'desc' }],
    select: {
      id: true,
      date: true,
      timeSlot: true,
      status: true,
      service: { select: { name: true } },
      barber: { select: { name: true } },
      result: { select: { imageUrl: true, ...(isBarber && { notes: true, isPublished: true }) } },
      ...(!isBarber && { review: { select: { rating: true, comment: true } } }),
      ...(isBarber && {
        client: { select: { name: true, phone: true } },
        guestName: true,
        guestPhone: true,
      }),
    },
  });

  return appointments.map(formatAppointment);
};

// GET /appointments/agenda: agenda diaria. El barbero ve la suya; el admin, la de uno o todos.
const getAgenda = async ({ date, barberId }, user) => {
  const where = { date: wallClock(date) };
  if (user.role === 'BARBER') where.barberId = user.id;
  else if (barberId) where.barberId = barberId;

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ timeSlot: 'asc' }, { barber: { name: 'asc' } }],
    select: {
      id: true,
      date: true,
      timeSlot: true,
      status: true,
      guestName: true,
      guestPhone: true,
      guestEmail: true,
      listPrice: true,
      chargedAmount: true,
      tipAmount: true,
      paymentMethod: true,
      priceNote: true,
      service: { select: { id: true, name: true, price: true } },
      barber: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, phone: true, email: true } },
      result: { select: { id: true, imageUrl: true, notes: true } },
    },
  });

  return { date, appointments: appointments.map(formatAppointment) };
};

const findManagedAppointment = async (id, user) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError('Cita no encontrada.', 404);
  const { allowed, staff } = canManage(appointment, user);
  if (!allowed || !staff) throw new AppError('No tienes permiso para gestionar esta cita.', 403);
  return appointment;
};

const hasStarted = (appointment) => hoursUntil(toDateString(appointment.date), appointment.timeSlot) <= 0;

// PATCH /appointments/:id/complete: cierra la cita registrando lo cobrado.
// Sin importe se cobra el precio de lista; el barbero puede cobrar más o menos (priceNote explica por qué).
const completeAppointment = async (id, user, charge = {}) => {
  const appointment = await findManagedAppointment(id, user);
  if (appointment.status !== 'PENDING') throw new AppError('Solo se pueden completar citas pendientes.', 400);
  if (!hasStarted(appointment)) throw new AppError('No puedes completar una cita que aún no ha comenzado.', 400);

  const data = {
    status: 'COMPLETED',
    completedAt: new Date(),
    chargedAmount: charge.chargedAmount ?? appointment.listPrice,
    tipAmount: charge.tipAmount ?? 0,
    paymentMethod: charge.paymentMethod ?? null,
    priceNote: charge.priceNote ?? null,
  };
  const { count } = await prisma.appointment.updateMany({ where: { id, status: 'PENDING' }, data });
  if (count === 0) throw new AppError('Solo se pueden completar citas pendientes.', 400);
  return formatAppointment({ ...appointment, ...data });
};

// PATCH /appointments/:id/charge: corrige el cobro de una cita ya completada.
const updateCharge = async (id, user, charge) => {
  const appointment = await findManagedAppointment(id, user);
  if (appointment.status !== 'COMPLETED') throw new AppError('Solo se puede corregir el cobro de citas completadas.', 400);

  const updated = await prisma.appointment.update({ where: { id }, data: charge });
  return formatAppointment(updated);
};

module.exports = {
  getAvailability,
  createAppointment,
  cancelAppointment,
  listMyAppointments,
  getAgenda,
  completeAppointment,
  updateCharge,
  findManagedAppointment,
  hasStarted,
};
