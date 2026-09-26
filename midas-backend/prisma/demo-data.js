// Llena la base de datos con un escenario completo para probar la app a mano:
// barberos con horario, clientes, invitados, citas pasadas (completadas con cobro, canceladas),
// citas futuras, reseñas, fotos de resultados y catálogo de la tienda.
//
// Uso (solo desarrollo): npm run seed:demo
// Es reseteable: cada ejecución borra los datos demo anteriores y los vuelve a crear.
// Clientes demo: <nombre>@demo.midas / Cliente123 · Barberos: carlos|andres|mateo@midas.com / Barbero123
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { nowInBusinessZone, toDateString, isoDayOfWeek } = require('../src/utils/time');

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production') {
  throw new Error('demo-data.js no se ejecuta en producción.');
}

const DEMO_DOMAIN = '@demo.midas';
const DEMO_SERVICE_PREFIX = 'DEMO ';
const DEMO_CATEGORY_PREFIX = 'DEMO ';
const DAY_MS = 24 * 60 * 60 * 1000;

// Generador pseudoaleatorio con semilla: el escenario sale igual en cada ejecución.
let seed = 42;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = (list) => list[Math.floor(random() * list.length)];

const SERVICES = [
  { name: 'Corte clásico', description: 'Corte a tijera o máquina con lavado.', price: 25000 },
  { name: 'Corte + Barba', description: 'Corte completo y perfilado de barba.', price: 35000 },
  { name: 'Arreglo de barba', description: 'Perfilado, toalla caliente y aceite.', price: 15000 },
  { name: `${DEMO_SERVICE_PREFIX}Fade premium`, description: 'Degradado a navaja con diseño.', price: 40000 },
  { name: `${DEMO_SERVICE_PREFIX}Ritual Midas`, description: 'Corte, barba, mascarilla y masaje.', price: 60000 },
  { name: `${DEMO_SERVICE_PREFIX}Servicio retirado`, description: 'Servicio inactivo (no debe salir al reservar).', price: 20000, isActive: false },
];

const BARBERS = [
  { name: 'Carlos', email: 'carlos@midas.com', phone: '3001112233', days: [1, 2, 3, 4, 5, 6], start: '10:00', end: '20:00' },
  { name: 'Andrés', email: 'andres@midas.com', phone: '3002223344', days: [1, 2, 3, 4, 5, 6], start: '10:00', end: '20:00' },
  { name: 'Mateo', email: 'mateo@midas.com', phone: '3003334455', days: [2, 3, 4, 5, 6, 7], start: '09:00', end: '17:00' },
];

const CLIENTS = [
  ['Juan Pérez', 'juan'], ['Santiago Gómez', 'santiago'], ['Felipe Rojas', 'felipe'],
  ['Daniel Torres', 'daniel'], ['Sebastián Díaz', 'sebastian'], ['Nicolás Vargas', 'nicolas'],
  ['Camilo Herrera', 'camilo'], ['Alejandro Castro', 'alejandro'],
];

const GUESTS = [
  { guestName: 'Pedro Invitado', guestPhone: '3105556677', guestEmail: 'pedro.invitado@example.com' },
  { guestName: 'Luis Sin Cuenta', guestPhone: '3116667788', guestEmail: null },
  { guestName: 'Mario Walk-in', guestPhone: '3127778899', guestEmail: null },
];

const REVIEW_COMMENTS = [
  [5, 'El mejor fade que me han hecho en Bogotá. Volveré sin duda.'],
  [5, 'Atención de primera, puntuales y muy detallistas con la barba.'],
  [4, 'Muy buen corte, el sitio es elegante. Solo tuve que esperar 5 minutos.'],
  [5, 'Carlos es un artista. El ritual con toalla caliente vale cada peso.'],
  [3, 'Buen servicio, aunque esperaba un poco más en el perfilado.'],
  [5, 'Ambiente excelente y resultado impecable.'],
  [2, 'Me cortaron más de lo que pedí.'],
];

// Imágenes públicas de ejemplo para la galería (no se suben a Cloudinary).
const RESULT_IMAGES = [
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800',
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
];

const PRODUCTS = [
  { category: 'Barbería', name: 'Aceite para barba Midas', price: 45000, isFeatured: true, description: 'Aceite de argán y sándalo, 30 ml.' },
  { category: 'Barbería', name: 'Bálsamo after shave', price: 38000, description: 'Calma la piel tras el afeitado.' },
  { category: 'Barbería', name: 'Navaja clásica', price: 120000, isAvailable: false, description: 'Acero inoxidable. Agotada.' },
  { category: 'Estilo', name: 'Pomada mate', price: 42000, isFeatured: true, description: 'Fijación fuerte, acabado mate.' },
  { category: 'Estilo', name: 'Cera brillante', price: 35000, description: 'Fijación media con brillo.' },
  { category: 'Estilo', name: 'Polvo texturizante', price: 30000, description: 'Volumen instantáneo.' },
  { category: `${DEMO_CATEGORY_PREFIX}Accesorios`, name: 'Peine de madera', price: 18000, description: 'Madera de peral.' },
  { category: `${DEMO_CATEGORY_PREFIX}Accesorios`, name: 'Producto oculto', price: 10000, isVisible: false, description: 'No debe verse en la tienda pública.' },
];

const reset = async () => {
  const demoUsers = await prisma.user.findMany({
    where: { OR: [{ email: { endsWith: DEMO_DOMAIN } }, { email: { in: BARBERS.map((b) => b.email) } }] },
    select: { id: true },
  });
  const ids = demoUsers.map((u) => u.id);
  const appointmentWhere = {
    OR: [
      { barberId: { in: ids } },
      { clientId: { in: ids } },
      { guestPhone: { in: GUESTS.map((g) => g.guestPhone) } },
      { service: { name: { startsWith: DEMO_SERVICE_PREFIX } } },
    ],
  };
  await prisma.serviceResult.deleteMany({ where: { appointment: appointmentWhere } });
  await prisma.review.deleteMany({ where: { appointment: appointmentWhere } });
  await prisma.appointment.deleteMany({ where: appointmentWhere });
  await prisma.service.deleteMany({ where: { name: { startsWith: DEMO_SERVICE_PREFIX } } });
  // Los barberos se conservan (upsert) para no romper sesiones abiertas; los clientes demo se recrean.
  await prisma.user.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN } } });
  await prisma.product.deleteMany({ where: { name: { in: PRODUCTS.map((p) => p.name) } } });
  await prisma.productCategory.deleteMany({ where: { name: { startsWith: DEMO_CATEGORY_PREFIX } } });
};

const main = async () => {
  await reset();

  // Servicios
  const services = [];
  for (const { isActive = true, ...data } of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: data.name } });
    services.push(
      existing
        ? await prisma.service.update({ where: { id: existing.id }, data: { ...data, isActive } })
        : await prisma.service.create({ data: { ...data, isActive } })
    );
  }
  const bookable = services.filter((s) => s.isActive);

  // Barberos con horario
  const barberHash = await bcrypt.hash('Barbero123', 12);
  const barbers = [];
  for (const { days, start, end, ...data } of BARBERS) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name, phone: data.phone, role: 'BARBER', passwordHash: barberHash },
      create: { ...data, role: 'BARBER', passwordHash: barberHash },
    });
    await prisma.barberAvailability.deleteMany({ where: { barberId: user.id } });
    await prisma.barberAvailability.createMany({
      data: days.map((dayOfWeek) => ({ barberId: user.id, dayOfWeek, startTime: start, endTime: end })),
    });
    barbers.push({ ...user, days, start, end });
  }

  // Clientes
  const clientHash = await bcrypt.hash('Cliente123', 12);
  const clients = [];
  for (const [name, slug] of CLIENTS) {
    clients.push(
      await prisma.user.create({
        data: { name, email: `${slug}${DEMO_DOMAIN}`, phone: `31${Math.floor(10000000 + random() * 89999999)}`, role: 'CLIENT', passwordHash: clientHash },
      })
    );
  }

  // Citas: 45 días atrás y 14 hacia adelante, respetando el horario de cada barbero.
  const now = nowInBusinessZone();
  const today = toDateString(now);
  const currentHour = now.getUTCHours();
  const taken = new Set();
  const appointments = [];

  for (let offset = -45; offset <= 14; offset++) {
    const date = toDateString(new Date(now.getTime() + offset * DAY_MS));
    for (const barber of barbers) {
      if (!barber.days.includes(isoDayOfWeek(date))) continue;
      const startHour = Number(barber.start.slice(0, 2));
      const endHour = Number(barber.end.slice(0, 2));
      // Pasado: agenda más llena; futuro: algunos huecos libres para poder reservar.
      const perDay = offset < 0 ? 3 + Math.floor(random() * 4) : 1 + Math.floor(random() * 3);
      for (let i = 0; i < perDay; i++) {
        const hour = startHour + Math.floor(random() * (endHour - startHour));
        const timeSlot = `${String(hour).padStart(2, '0')}:00`;
        const key = `${barber.id}|${date}|${timeSlot}`;
        if (taken.has(key)) continue;

        const isPast = date < today || (date === today && hour < currentHour);
        // Hoy/futuro: no ocupar bloques dentro de la próxima hora para no chocar con la antelación mínima.
        if (!isPast && date === today && hour <= currentHour + 1) continue;
        taken.add(key);

        const service = pick(bookable);
        const owner = random() < 0.8
          ? { clientId: pick(clients).id }
          : { ...pick(GUESTS) };
        const base = { barberId: barber.id, serviceId: service.id, date: new Date(`${date}T00:00:00Z`), timeSlot, listPrice: service.price, ...owner };

        let data;
        if (!isPast) {
          data = { ...base, status: random() < 0.1 ? 'CANCELLED' : 'PENDING' };
        } else if (random() < 0.12) {
          data = { ...base, status: 'CANCELLED' };
        } else if (offset >= -2 && random() < 0.4) {
          // Citas pasadas recientes sin cerrar: el barbero debe cobrarlas desde la agenda.
          data = { ...base, status: 'PENDING' };
        } else {
          const list = Number(service.price);
          const roll = random();
          const charged = roll < 0.75 ? list : roll < 0.9 ? list - 5000 : list + 10000;
          data = {
            ...base,
            status: 'COMPLETED',
            chargedAmount: charged,
            tipAmount: random() < 0.35 ? pick([2000, 5000, 10000]) : 0,
            paymentMethod: pick(['CASH', 'CASH', 'CARD', 'TRANSFER']),
            priceNote: charged === list ? null : charged < list ? 'Descuento cliente frecuente' : 'Diseño adicional',
            completedAt: new Date(`${date}T${String(hour + 1).padStart(2, '0')}:00:00Z`),
          };
        }
        appointments.push(await prisma.appointment.create({ data }));
      }
    }
  }

  // Reseñas y fotos sobre citas completadas de clientes registrados.
  const completedWithClient = appointments.filter((a) => a.status === 'COMPLETED' && a.clientId);
  let reviews = 0;
  let results = 0;
  for (const [i, appointment] of completedWithClient.slice(0, 18).entries()) {
    if (i < REVIEW_COMMENTS.length * 2) {
      const [rating, comment] = REVIEW_COMMENTS[i % REVIEW_COMMENTS.length];
      await prisma.review.create({
        data: { appointmentId: appointment.id, clientId: appointment.clientId, rating, comment, isVisible: rating >= 3 },
      });
      reviews++;
    }
    if (i < RESULT_IMAGES.length + 2) {
      await prisma.serviceResult.create({
        data: {
          appointmentId: appointment.id,
          imageUrl: RESULT_IMAGES[i % RESULT_IMAGES.length],
          notes: i % 2 ? 'Degradado bajo con textura arriba.' : null,
          isPublished: i < RESULT_IMAGES.length,
        },
      });
      results++;
    }
  }

  // Tienda
  for (const [sortOrder, name] of [...new Set(PRODUCTS.map((p) => p.category))].entries()) {
    await prisma.productCategory.upsert({ where: { name }, update: {}, create: { name, sortOrder: sortOrder + 10 } });
  }
  const categories = await prisma.productCategory.findMany();
  for (const { category, ...product } of PRODUCTS) {
    await prisma.product.create({ data: { ...product, categoryId: categories.find((c) => c.name === category).id } });
  }

  const count = (status) => appointments.filter((a) => a.status === status).length;
  console.log(`Demo listo (${today}):
  ${services.length} servicios (1 inactivo) · ${barbers.length} barberos · ${clients.length} clientes
  ${appointments.length} citas: ${count('COMPLETED')} completadas, ${count('PENDING')} pendientes, ${count('CANCELLED')} canceladas
  ${reviews} reseñas · ${results} fotos de resultados · ${PRODUCTS.length} productos
  Barberos: carlos|andres|mateo@midas.com / Barbero123 · Clientes: juan${DEMO_DOMAIN} (etc.) / Cliente123`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
