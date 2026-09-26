require('dotenv').config({ quiet: true });

const config = require('./src/config/env');
const app = require('./src/app');
const prisma = require('./src/config/prisma');
const { startReminderJob } = require('./src/jobs/reminders.job');

// En Vercel (serverless) la plataforma invoca la app exportada: no hay listen ni jobs en segundo plano.
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const server = app.listen(config.port, () => {
    console.log(`Midas API escuchando en http://localhost:${config.port}/api/v1`);
  });

  const reminderJob = startReminderJob();
  if (reminderJob) console.log('Recordatorios push activos (minuto 45 de cada hora).');

  const shutdown = async (signal) => {
    console.log(`${signal} recibido. Cerrando servidor...`);
    reminderJob?.stop();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Promesa rechazada sin manejar:', reason);
});
