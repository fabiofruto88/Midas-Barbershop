// Crea (o actualiza) la cuenta Admin inicial a partir de variables de entorno.
// Uso: npx prisma db seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const main = async () => {
  const { ADMIN_NAME = 'Administrador', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el .env para crear el Admin inicial.');
  }
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', name: ADMIN_NAME, passwordHash },
    create: { role: 'ADMIN', name: ADMIN_NAME, email, passwordHash },
    select: { id: true, email: true, role: true },
  });

  console.log(`Admin listo: ${admin.email} (${admin.id})`);

  if (process.env.SEED_DEMO === 'true') await seedDemo();
};

// Datos de demostración para desarrollo (idempotente). Contraseña de los barberos: Barbero123
const seedDemo = async () => {
  const services = [
    { name: 'Corte clásico', description: 'Corte a tijera o máquina con lavado.', price: 25000 },
    { name: 'Corte + Barba', description: 'Corte completo y perfilado de barba.', price: 35000 },
    { name: 'Arreglo de barba', description: 'Perfilado, toalla caliente y aceite.', price: 15000 },
  ];
  for (const service of services) {
    const exists = await prisma.service.findFirst({ where: { name: service.name } });
    if (!exists) await prisma.service.create({ data: service });
  }

  const passwordHash = await bcrypt.hash('Barbero123', 12);
  const barbers = [
    { name: 'Carlos', email: 'carlos@midas.com' },
    { name: 'Andrés', email: 'andres@midas.com' },
  ];
  // Lunes a sábado de 10:00 a 20:00.
  const schedule = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: '10:00', endTime: '20:00' }));

  for (const barber of barbers) {
    const user = await prisma.user.upsert({
      where: { email: barber.email },
      update: {},
      create: { ...barber, role: 'BARBER', passwordHash },
    });
    for (const day of schedule) {
      await prisma.barberAvailability.upsert({
        where: { barberId_dayOfWeek: { barberId: user.id, dayOfWeek: day.dayOfWeek } },
        update: {},
        create: { ...day, barberId: user.id },
      });
    }
  }

  console.log('Datos demo listos: 3 servicios y 2 barberos (carlos@midas.com, andres@midas.com / Barbero123).');
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
