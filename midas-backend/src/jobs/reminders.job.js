const cron = require('node-cron');
const prisma = require('../config/prisma');
const config = require('../config/env');
const notifications = require('../services/notification.service');
const { nowInBusinessZone, toDateString, wallClock } = require('../utils/time');

const LEAD_MINUTES = 15;

// Bloque que empieza dentro de 15 minutos: a las 13:45 → cita de las 14:00.
const upcomingSlot = (now) => {
  const target = new Date(now.getTime() + LEAD_MINUTES * 60 * 1000);
  return { date: toDateString(target), timeSlot: `${String(target.getUTCHours()).padStart(2, '0')}:00` };
};

// Envía el recordatorio al cliente registrado y al barbero de cada cita pendiente de ese bloque.
// Los invitados no tienen suscripción push (no son User).
const sendReminders = async (now = nowInBusinessZone()) => {
  const { date, timeSlot } = upcomingSlot(now);

  const appointments = await prisma.appointment.findMany({
    where: { date: wallClock(date), timeSlot, status: 'PENDING' },
    select: {
      id: true,
      timeSlot: true,
      guestName: true,
      service: { select: { name: true } },
      client: { select: { id: true, name: true, pushSubscription: true } },
      barber: { select: { id: true, name: true, pushSubscription: true } },
    },
  });

  let sent = 0;
  for (const appointment of appointments) {
    const toClient = notifications.sendToUser(appointment.client, {
      title: 'Tu cita es en 15 minutos',
      body: `${appointment.service.name} con ${appointment.barber.name} a las ${appointment.timeSlot}.`,
      url: '/mis-citas',
    });
    const customer = appointment.client?.name ?? appointment.guestName;
    const toBarber = notifications.sendToUser(appointment.barber, {
      title: 'Próxima cita en 15 minutos',
      body: `${customer} · ${appointment.service.name} a las ${appointment.timeSlot}.`,
      url: '/agenda',
    });
    const results = await Promise.all([toClient, toBarber]);
    sent += results.filter(Boolean).length;
  }

  return { date, timeSlot, appointments: appointments.length, sent };
};

// Los bloques empiezan en punto: basta con revisar al minuto 45 de cada hora.
const startReminderJob = () => {
  if (process.env.REMINDERS_ENABLED === 'false' || process.env.NODE_ENV === 'test') return null;
  if (!notifications.isConfigured()) {
    console.warn('Recordatorios push desactivados: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.');
    return null;
  }

  return cron.schedule(
    '45 * * * *',
    async () => {
      try {
        const result = await sendReminders();
        if (result.appointments) console.log('Recordatorios enviados:', result);
      } catch (error) {
        console.error('Error enviando recordatorios:', error);
      }
    },
    { timezone: config.timezone, noOverlap: true, name: 'appointment-reminders' }
  );
};

module.exports = { sendReminders, startReminderJob, upcomingSlot };
