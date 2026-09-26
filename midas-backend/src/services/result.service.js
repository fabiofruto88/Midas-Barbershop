const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const storage = require('./storage.service');
const { findManagedAppointment, hasStarted } = require('./appointment.service');

// POST /appointments/:id/results: sube la foto del corte finalizado (solo el barbero asignado).
const uploadResult = async (appointmentId, user, { buffer, notes }) => {
  const appointment = await findManagedAppointment(appointmentId, user);

  if (appointment.status === 'CANCELLED') {
    throw new AppError('No se pueden subir resultados de una cita cancelada.', 400);
  }
  if (appointment.status === 'PENDING' && !hasStarted(appointment)) {
    throw new AppError('No puedes subir el resultado de una cita que aún no ha comenzado.', 400);
  }

  const previous = await prisma.serviceResult.findUnique({ where: { appointmentId } });
  const uploaded = await storage.uploadImage(buffer);

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // Subir el resultado da la cita por completada (cobrada al precio de lista).
      if (appointment.status === 'PENDING') {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'COMPLETED', completedAt: new Date(), chargedAmount: appointment.listPrice },
        });
      }
      return tx.serviceResult.upsert({
        where: { appointmentId },
        create: { appointmentId, imageUrl: uploaded.url, notes },
        // Una foto nueva vuelve a revisión: el admin debe aprobarla antes de que salga en la galería.
        update: { imageUrl: uploaded.url, notes, isPublished: false },
        select: { id: true, appointmentId: true, imageUrl: true, notes: true, isPublished: true },
      });
    });
  } catch (error) {
    // No dejar imágenes huérfanas si falla la base de datos.
    await storage.deleteImageByUrl(uploaded.url);
    throw error;
  }

  if (previous && previous.imageUrl !== result.imageUrl) await storage.deleteImageByUrl(previous.imageUrl);

  return result;
};

const galleryAppointment = {
  select: {
    date: true,
    service: { select: { name: true } },
    barber: { select: { name: true } },
  },
};

// GET /results/public: galería pública, solo lo que el admin publicó. Sin datos del cliente.
const listPublished = ({ limit }) =>
  prisma.serviceResult.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, imageUrl: true, createdAt: true, appointment: galleryAppointment },
  });

// GET /results: todos los resultados para que el admin decida cuáles publicar.
const listAll = ({ isPublished }) =>
  prisma.serviceResult.findMany({
    where: isPublished === undefined ? undefined : { isPublished },
    orderBy: { createdAt: 'desc' },
    select: { id: true, imageUrl: true, notes: true, isPublished: true, createdAt: true, appointment: galleryAppointment },
  });

// PATCH /results/:id: publicar u ocultar una foto en la galería.
const setPublished = async (id, isPublished) => {
  const existing = await prisma.serviceResult.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError('Resultado no encontrado.', 404);
  return prisma.serviceResult.update({
    where: { id },
    data: { isPublished },
    select: { id: true, isPublished: true },
  });
};

module.exports = { uploadResult, listPublished, listAll, setPublished };
