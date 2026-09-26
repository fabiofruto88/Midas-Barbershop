const prisma = require('../config/prisma');
const { ensureBarber } = require('./user.service');

const scheduleSelect = { dayOfWeek: true, startTime: true, endTime: true };

const getAvailability = async (barberId) => {
  const barber = await ensureBarber(barberId);
  const schedule = await prisma.barberAvailability.findMany({
    where: { barberId },
    select: scheduleSelect,
    orderBy: { dayOfWeek: 'asc' },
  });
  return { barberId, barberName: barber.name, schedule };
};

// Reemplaza el horario semanal de forma atómica.
const setAvailability = async (barberId, schedule) => {
  const barber = await ensureBarber(barberId);

  const saved = await prisma.$transaction(async (tx) => {
    await tx.barberAvailability.deleteMany({ where: { barberId } });
    if (schedule.length) {
      await tx.barberAvailability.createMany({
        data: schedule.map((day) => ({ ...day, barberId })),
      });
    }
    return tx.barberAvailability.findMany({
      where: { barberId },
      select: scheduleSelect,
      orderBy: { dayOfWeek: 'asc' },
    });
  });

  return { barberId, barberName: barber.name, schedule: saved };
};

module.exports = { getAvailability, setAvailability };
