const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const webpush = require('web-push');
const { app, prisma, request, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const { sendReminders, upcomingSlot } = require('../src/jobs/reminders.job');
const { wallClock } = require('../src/utils/time');

const subscription = (id) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/test-${id}`,
  expirationTime: null,
  keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' },
});

// Doble de web-push: registra los envíos en lugar de llamar a los servidores push.
const realSend = webpush.sendNotification;
let sent;

let admin;
let barber;
let client;
let clientId;
let serviceId;

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = await createUserWithRole(admin, 'BARBER', 'push');
  ({ client } = await createUserWithRole(admin, 'CLIENT', 'push-cliente'));
  clientId = (await client.get('/api/v1/auth/me')).body.id;
  serviceId = (await admin.post('/api/v1/services').send({ name: 'TEST Push', price: 20000 })).body.id;
});

beforeEach(() => {
  sent = [];
  webpush.sendNotification = async (sub, payload) => {
    sent.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
    if (sub.endpoint.endsWith('expired')) {
      const error = new Error('Gone');
      error.statusCode = 410;
      throw error;
    }
  };
});

after(async () => {
  webpush.sendNotification = realSend;
  await cleanup();
  await prisma.$disconnect();
});

describe('/notifications', () => {
  test('clave pública VAPID disponible sin sesión', async () => {
    const res = await request(app).get('/api/v1/notifications/vapid-public-key');
    assert.equal(res.status, 200);
    assert.equal(res.body.publicKey, process.env.VAPID_PUBLIC_KEY);
  });

  test('POST /subscribe guarda la suscripción con el mensaje del contrato', async () => {
    const res = await client.post('/api/v1/notifications/subscribe').send(subscription('cliente'));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { message: 'Suscripción guardada.' });
    const user = await prisma.user.findUnique({ where: { id: clientId } });
    assert.equal(user.pushSubscription.endpoint, subscription('cliente').endpoint);
  });

  test('requiere sesión y un PushSubscription válido (HTTPS)', async () => {
    const anonymous = await request(app).post('/api/v1/notifications/subscribe').send(subscription('x'));
    assert.equal(anonymous.status, 401);
    const insecure = await client
      .post('/api/v1/notifications/subscribe')
      .send({ ...subscription('x'), endpoint: 'http://inseguro.com/push' });
    assert.equal(insecure.status, 400);
    const missingKeys = await client.post('/api/v1/notifications/subscribe').send({ endpoint: 'https://a.com/b' });
    assert.equal(missingKeys.status, 400);
  });

  test('la suscripción nunca se expone en /auth/me', async () => {
    const me = await client.get('/api/v1/auth/me');
    assert.equal(me.body.pushSubscription, undefined);
  });
});

describe('Recordatorio 15 minutos antes', () => {
  test('a las 13:45 apunta a la cita de las 14:00; a las 23:45 a la de las 00:00 del día siguiente', () => {
    assert.deepEqual(upcomingSlot(new Date('2026-10-05T13:45:00Z')), { date: '2026-10-05', timeSlot: '14:00' });
    assert.deepEqual(upcomingSlot(new Date('2026-10-05T23:45:00Z')), { date: '2026-10-06', timeSlot: '00:00' });
  });

  test('notifica al cliente y al barbero de las citas PENDING de ese bloque, y a nadie más', async () => {
    await client.post('/api/v1/notifications/subscribe').send(subscription('cliente'));
    await barber.client.post('/api/v1/notifications/subscribe').send(subscription('barbero'));

    const date = '2030-01-07';
    const base = { barberId: barber.user.id, serviceId, listPrice: 20000, date: wallClock(date) };
    await prisma.appointment.createMany({
      data: [
        { ...base, timeSlot: '14:00', clientId },
        { ...base, timeSlot: '15:00', clientId }, // otro bloque
        { ...base, timeSlot: '16:00', guestName: 'Invitado', guestPhone: '+573001234567', status: 'CANCELLED' },
      ],
    });

    const result = await sendReminders(new Date(`${date}T13:45:00Z`));
    assert.equal(result.appointments, 1);
    assert.equal(result.sent, 2);
    assert.deepEqual(sent.map((item) => item.endpoint).sort(), [
      subscription('barbero').endpoint,
      subscription('cliente').endpoint,
    ]);
    const clientPush = sent.find((item) => item.endpoint.endsWith('cliente'));
    assert.equal(clientPush.payload.title, 'Tu cita es en 15 minutos');
    assert.match(clientPush.payload.body, /14:00/);
    assert.equal(clientPush.payload.url, '/mis-citas');

    const cancelledSlot = await sendReminders(new Date(`${date}T15:45:00Z`));
    assert.equal(cancelledSlot.appointments, 0);
  });

  test('una suscripción caducada (410) se elimina de la base de datos', async () => {
    await client.post('/api/v1/notifications/subscribe').send(subscription('expired'));
    const date = '2030-01-08';
    await prisma.appointment.create({
      data: { barberId: barber.user.id, serviceId, listPrice: 20000, clientId, date: wallClock(date), timeSlot: '10:00' },
    });

    await sendReminders(new Date(`${date}T09:45:00Z`));
    const user = await prisma.user.findUnique({ where: { id: clientId } });
    assert.equal(user.pushSubscription, null);
  });
});
