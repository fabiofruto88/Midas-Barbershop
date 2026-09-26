const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { app, prisma, request, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const storage = require('../src/services/storage.service');
const { publicName } = require('../src/services/review.service');
const { wallClock } = require('../src/utils/time');

// PNG real de 1x1 píxel.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const realUpload = storage.uploadImage;
const realDelete = storage.deleteImageByUrl;
let uploads;
let deletions;

let admin;
let barber;
let client;
let clientId;
let otherClient;
let serviceId;
let day = 0;

// Cada cita en un día pasado distinto para no chocar con el índice único barbero/fecha/hora.
const createAppointment = (status = 'COMPLETED', owner = clientId) => {
  day += 1;
  const date = new Date(Date.UTC(2025, 0, day));
  return prisma.appointment.create({
    data: { barberId: barber.user.id, serviceId, listPrice: 20000, clientId: owner, date: wallClock(date.toISOString().slice(0, 10)), timeSlot: '10:00', status },
  });
};

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = await createUserWithRole(admin, 'BARBER', 'resenas');
  const created = await createUserWithRole(admin, 'CLIENT', 'resenas-cliente');
  client = created.client;
  clientId = created.user.id;
  otherClient = (await createUserWithRole(admin, 'CLIENT', 'resenas-otro')).client;
  serviceId = (await admin.post('/api/v1/services').send({ name: 'TEST Reseñas', price: 20000 })).body.id;
});

beforeEach(() => {
  uploads = [];
  deletions = [];
  storage.uploadImage = async (buffer, options) => {
    uploads.push(options?.folder);
    return { url: `https://res.cloudinary.com/demo/image/upload/v1/midas/barbers/test-${uploads.length}.png` };
  };
  storage.deleteImageByUrl = async (url) => deletions.push(url);
});

after(async () => {
  storage.uploadImage = realUpload;
  storage.deleteImageByUrl = realDelete;
  await cleanup();
  await prisma.$disconnect();
});

describe('Reseñas', () => {
  const review = { rating: 5, comment: 'Excelente corte, muy puntual y amable.' };

  test('el cliente califica su cita completada y sale en los testimonios públicos', async () => {
    const appointment = await createAppointment();
    const res = await client.put(`/api/v1/appointments/${appointment.id}/review`).send(review);
    assert.equal(res.status, 200);
    assert.equal(res.body.rating, 5);
    assert.equal(res.body.isVisible, true);

    const pub = await request(app).get('/api/v1/reviews/public?limit=12');
    assert.equal(pub.status, 200);
    const item = pub.body.reviews.find((entry) => entry.id === res.body.id);
    assert.equal(item.author, 'Test R.');
    assert.equal(item.appointment.service.name, 'TEST Reseñas');
    assert.equal(item.appointment.barber.name, barber.user.name);
    assert.equal(item.client, undefined); // sin email ni nombre completo
    assert.ok(pub.body.summary.count >= 1);

    // La ve en su historial y puede editarla (sin duplicar).
    const mine = await client.get('/api/v1/appointments/me');
    assert.equal(mine.body.find((entry) => entry.id === appointment.id).review.rating, 5);
    const edited = await client.put(`/api/v1/appointments/${appointment.id}/review`).send({ ...review, rating: 4 });
    assert.equal(edited.body.id, res.body.id);
    assert.equal(edited.body.rating, 4);
  });

  test('el admin oculta una reseña y deja de salir en la web', async () => {
    const appointment = await createAppointment();
    const { body } = await client.put(`/api/v1/appointments/${appointment.id}/review`).send(review);

    const hidden = await admin.patch(`/api/v1/reviews/${body.id}`).send({ isVisible: false });
    assert.equal(hidden.status, 200);
    const pub = await request(app).get('/api/v1/reviews/public?limit=12');
    assert.ok(!pub.body.reviews.some((entry) => entry.id === body.id));

    const all = await admin.get('/api/v1/reviews?isVisible=false');
    assert.ok(all.body.some((entry) => entry.id === body.id));

    // Editarla no la vuelve a mostrar.
    const edited = await client.put(`/api/v1/appointments/${appointment.id}/review`).send(review);
    assert.equal(edited.body.isVisible, false);
  });

  test('reglas: cita pendiente → 400, cita ajena → 403, datos inválidos → 400, barbero → 403', async () => {
    const pending = await createAppointment('PENDING');
    assert.equal((await client.put(`/api/v1/appointments/${pending.id}/review`).send(review)).status, 400);

    const completed = await createAppointment();
    assert.equal((await otherClient.put(`/api/v1/appointments/${completed.id}/review`).send(review)).status, 403);
    assert.equal((await barber.client.put(`/api/v1/appointments/${completed.id}/review`).send(review)).status, 403);
    assert.equal((await client.put(`/api/v1/appointments/${completed.id}/review`).send({ rating: 6, comment: review.comment })).status, 400);
    assert.equal((await client.put(`/api/v1/appointments/${completed.id}/review`).send({ rating: 5, comment: 'corto' })).status, 400);
  });

  test('solo el admin modera reseñas', async () => {
    assert.equal((await client.get('/api/v1/reviews')).status, 403);
    assert.equal((await request(app).get('/api/v1/reviews')).status, 401);
  });

  test('publicName abrevia el apellido', () => {
    assert.equal(publicName('Carlos Pérez Gómez'), 'Carlos P.');
    assert.equal(publicName('  Ana  '), 'Ana');
  });
});

describe('Foto del barbero', () => {
  test('el admin sube y reemplaza la foto; sale en el listado público de barberos', async () => {
    const first = await admin.post(`/api/v1/users/${barber.user.id}/avatar`).attach('image', PNG, 'foto.png');
    assert.equal(first.status, 200);
    assert.match(first.body.avatarUrl, /^https:\/\/res\.cloudinary\.com\//);
    assert.deepEqual(uploads, ['barbers']);

    const second = await admin.post(`/api/v1/users/${barber.user.id}/avatar`).attach('image', PNG, 'foto.png');
    assert.deepEqual(deletions, [first.body.avatarUrl]);

    const barbers = await request(app).get('/api/v1/barbers');
    assert.equal(barbers.body.find((entry) => entry.id === barber.user.id).avatarUrl, second.body.avatarUrl);

    const removed = await admin.delete(`/api/v1/users/${barber.user.id}/avatar`);
    assert.equal(removed.status, 200);
    assert.equal(removed.body.avatarUrl, null);
    assert.deepEqual(deletions, [first.body.avatarUrl, second.body.avatarUrl]);
  });

  test('solo barberos, solo el admin y solo imágenes reales', async () => {
    const clientUser = await prisma.user.findUnique({ where: { id: clientId } });
    assert.equal((await admin.post(`/api/v1/users/${clientUser.id}/avatar`).attach('image', PNG, 'f.png')).status, 400);
    assert.equal((await barber.client.post(`/api/v1/users/${barber.user.id}/avatar`).attach('image', PNG, 'f.png')).status, 403);
    const fake = await admin.post(`/api/v1/users/${barber.user.id}/avatar`).attach('image', Buffer.from('<svg/>'), 'f.png');
    assert.equal(fake.status, 415);
    assert.equal(uploads.length, 0);
  });
});
