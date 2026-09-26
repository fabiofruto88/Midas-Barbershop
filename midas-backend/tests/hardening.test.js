// Regresiones de la revisión de robustez (barrido de entradas límite y estrés).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { app, prisma, request, loginAdmin, createUserWithRole, testEmail, cleanup } = require('./helpers');
const errorHandler = require('../src/middlewares/errorHandler');
const config = require('../src/config/env');
const { nowInBusinessZone, toDateString } = require('../src/utils/time');

const DAY_MS = 24 * 60 * 60 * 1000;
const businessDate = (offsetDays) => toDateString(new Date(nowInBusinessZone().getTime() + offsetDays * DAY_MS));

let admin;
let barber;
let serviceId;

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = await createUserWithRole(admin, 'BARBER', 'horizonte');
  const fullWeek = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, startTime: '08:00', endTime: '20:00' }));
  await barber.client.put('/api/v1/barbers/me/availability').send({ schedule: fullWeek });
  serviceId = (await admin.post('/api/v1/services').send({ name: 'TEST Horizonte', price: 10000 })).body.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test('contraseña de más de 72 bytes (aunque tenga < 72 caracteres) → 400', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Emoji', email: testEmail('emoji'), password: '😀'.repeat(19) }); // 19 caracteres, 76 bytes
  assert.equal(res.status, 400);
  assert.match(res.body.error, /72 bytes/);
});

test('el teléfono con espacios, guiones y paréntesis se acepta y se guarda normalizado', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Tel', email: testEmail('tel'), password: 'Password123', phone: '+57 (300) 123-4567' });
  assert.equal(res.status, 201);
  assert.equal(res.body.phone, '+573001234567');
});

test('los mensajes genéricos de validación están en español', async () => {
  const res = await request(app).get('/api/v1/appointments/availability');
  assert.equal(res.status, 400);
  assert.doesNotMatch(res.body.error, /Invalid input|expected/);
});

test('una URL mal codificada responde 400 con mensaje propio', async () => {
  const res = await request(app).get('/api/v1/services/%E0%A4%A');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'La URL contiene caracteres inválidos.');
});

test(`no se puede reservar más allá de ${config.bookingWindowDays} días; la disponibilidad lejana sale vacía`, async () => {
  const far = businessDate(config.bookingWindowDays + 2);
  const booking = await request(app).post('/api/v1/appointments').send({
    barberId: barber.user.id, serviceId, date: far, timeSlot: '10:00', guestName: 'Lejos', guestPhone: '+573001234567',
  });
  assert.equal(booking.status, 400);
  assert.match(booking.body.error, /días de antelación/);

  const availability = await request(app).get(`/api/v1/appointments/availability?barberId=${barber.user.id}&date=${far}`);
  assert.deepEqual(availability.body.availableSlots, []);

  const within = await request(app).get(
    `/api/v1/appointments/availability?barberId=${barber.user.id}&date=${businessDate(config.bookingWindowDays - 1)}`
  );
  assert.ok(within.body.availableSlots.length > 0);
});

test('/health no consume el rate limit global', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.headers.ratelimit, undefined);
});

test('saturación de Prisma (P2028/P2024) → 503 con Retry-After, no 500', () => {
  for (const code of ['P2028', 'P2024']) {
    const error = new Prisma.PrismaClientKnownRequestError('Unable to start a transaction in the given time.', {
      code,
      clientVersion: 'test',
    });
    const res = {
      headers: {},
      set(key, value) { this.headers[key] = value; return this; },
      status(value) { this.statusCode = value; return this; },
      json(value) { this.body = value; return this; },
    };
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      errorHandler(error, { method: 'POST', originalUrl: '/api/v1/appointments' }, res, () => {});
    } finally {
      console.warn = originalWarn;
    }
    assert.equal(res.statusCode, 503);
    assert.equal(res.headers['Retry-After'], '5');
    assert.match(res.body.error, /ocupado/);
  }
});
