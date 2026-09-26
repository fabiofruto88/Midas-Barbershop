const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  appointment: { select: { service: { select: { name: true } }, barber: { select: { name: true } } } },
};

// "Carlos Pérez Gómez" → "Carlos P.": en la web pública no se expone el nombre completo del cliente.
const publicName = (name) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[0].charAt(0).toUpperCase()}.` : first;
};

// PUT /appointments/:id/review: el cliente califica (o edita la calificación de) una cita suya completada.
const upsertReview = async (appointmentId, user, { rating, comment }) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { clientId: true, status: true },
  });
  if (!appointment) throw new AppError('Cita no encontrada.', 404);
  if (appointment.clientId !== user.id) throw new AppError('Solo puedes calificar tus propias citas.', 403);
  if (appointment.status !== 'COMPLETED') {
    throw new AppError('Solo puedes calificar un servicio ya completado.', 400);
  }

  return prisma.review.upsert({
    where: { appointmentId },
    create: { appointmentId, clientId: user.id, rating, comment },
    // Editarla no cambia su visibilidad: si el admin la ocultó, sigue oculta.
    update: { rating, comment },
    select: { id: true, appointmentId: true, rating: true, comment: true, isVisible: true, updatedAt: true },
  });
};

// GET /reviews/public: reseñas visibles para la landing + promedio general.
const listPublic = async ({ limit }) => {
  const where = { isVisible: true };
  const [reviews, stats] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { ...reviewSelect, client: { select: { name: true } } },
    }),
    prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
  ]);

  return {
    summary: {
      average: stats._avg.rating === null ? null : Math.round(stats._avg.rating * 100) / 100,
      count: stats._count._all,
    },
    reviews: reviews.map(({ client, ...review }) => ({ ...review, author: publicName(client.name) })),
  };
};

// GET /reviews: todas, para que el admin modere.
const listAll = ({ isVisible }) =>
  prisma.review.findMany({
    where: isVisible === undefined ? undefined : { isVisible },
    orderBy: { createdAt: 'desc' },
    select: { ...reviewSelect, isVisible: true, client: { select: { name: true, email: true } } },
  });

// PATCH /reviews/:id: mostrar u ocultar una reseña en la web.
const setVisible = async (id, isVisible) => {
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError('Reseña no encontrada.', 404);
  return prisma.review.update({ where: { id }, data: { isVisible }, select: { id: true, isVisible: true } });
};

module.exports = { upsertReview, listPublic, listAll, setVisible, publicName };
