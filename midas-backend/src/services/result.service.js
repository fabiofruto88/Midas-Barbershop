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
      // Subir el resultado da la cita por completada.
      if (appointment.status === 'PENDING') {
        await tx.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED' } });
      }
      return tx.serviceResult.upsert({
        where: { appointmentId },
        create: { appointmentId, imageUrl: uploaded.url, notes },
        update: { imageUrl: uploaded.url, notes },
        select: { id: true, appointmentId: true, imageUrl: true, notes: true },
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

module.exports = { uploadResult };
