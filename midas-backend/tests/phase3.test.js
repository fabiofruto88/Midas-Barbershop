const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, prisma, request, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const { nowInBusinessZone, toDateString, wallClock } = require('../src/utils/time');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Fecha de la barbería desplazada N días desde hoy.
const businessDate = (offsetDays) => toDateString(new Date(nowInBusinessZone().getTime() + offsetDays * DAY_MS));
const FUTURE = businessDate(7);

const fullWeek = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, startTime: '08:00', endTime: '20:00' }));

const guest = (n = 1) => ({ guestName: `Invitado ${n}`, guestPhone: `+57300000${String(n).padStart(4, '0')}` });

let admin;
let barber;
let otherBarber;
let client;
let serviceId;

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = await createUserWithRole(admin, 'BARBER', 'agenda');
  otherBarber = await createUserWithRole(admin, 'BARBER', 'agenda-2');
  ({ client } = await createUserWithRole(admin, 'CLIENT', 'reserva'));

  await barber.client.put('/api/v1/barbers/me/availability').send({ schedule: fullWeek });
  await otherBarber.client.put('/api/v1/barbers/me/availability').send({ schedule: fullWeek });

  const service = await admin.post('/api/v1/services').send({ name: 'TEST Corte + Barba', price: 30000 });
  serviceId = service.body.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const book = (agentOrApp, slot, extra = {}, barberId = barber.user.id) =>
  agentOrApp.post('/api/v1/appointments').send({ barberId, serviceId, date: FUTURE, timeSlot: slot, ...extra });

describe('GET /appointments/availability', () => {
  test('devuelve los bloques de 1 hora del horario base (08:00–19:00)', async () => {
    const res = await request(app).get(`/api/v1/appointments/availability?barberId=${barber.user.id}&date=${FUTURE}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      date: FUTURE,
      barberId: barber.user.id,
      availableSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
    });
  });

  test('una fecha pasada no tiene bloques disponibles', async () => {
    const res = await request(app).get(
      `/api/v1/appointments/availability?barberId=${barber.user.id}&date=${businessDate(-1)}`
    );
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.availableSlots, []);
  });

  test('hoy solo muestra bloques futuros', async () => {
    const today = businessDate(0);
    const res = await request(app).get(`/api/v1/appointments/availability?barberId=${barber.user.id}&date=${today}`);
    const now = nowInBusinessZone();
    assert.ok(res.body.availableSlots.every((slot) => wallClock(today, slot) > now));
  });

  test('parámetros inválidos → 400', async () => {
    const badDate = await request(app).get(`/api/v1/appointments/availability?barberId=${barber.user.id}&date=2023-02-30`);
    const badId = await request(app).get(`/api/v1/appointments/availability?barberId=123&date=${FUTURE}`);
    assert.equal(badDate.status, 400);
    assert.equal(badId.status, 400);
  });
});

describe('POST /appointments', () => {
  test('cliente registrado reserva; el bloque desaparece de la disponibilidad', async () => {
    const res = await book(client, '10:00');
    assert.equal(res.status, 201);
    assert.equal(res.body.date, FUTURE);
    assert.equal(res.body.timeSlot, '10:00');
    assert.equal(res.body.status, 'PENDING');
    assert.ok(res.body.clientId);
    assert.equal(res.body.guestToken, undefined);

    const availability = await request(app).get(
      `/api/v1/appointments/availability?barberId=${barber.user.id}&date=${FUTURE}`
    );
    assert.ok(!availability.body.availableSlots.includes('10:00'));
  });

  test('bloque ocupado → 409 con el mensaje del contrato', async () => {
    const res = await book(request(app), '10:00', guest(1));
    assert.equal(res.status, 409);
    assert.deepEqual(res.body, { error: 'El horario seleccionado ya no está disponible.' });
  });

  test('el mismo bloque con otro barbero sí está libre', async () => {
    const res = await book(request(app), '10:00', guest(2), otherBarber.user.id);
    assert.equal(res.status, 201);
  });

  test('invitado sin nombre/teléfono → 400', async () => {
    const res = await book(request(app), '11:00');
    assert.equal(res.status, 400);
  });

  test('fuera del horario del barbero → 400', async () => {
    const res = await book(request(app), '21:00', guest(3));
    assert.equal(res.status, 400);
  });

  test('servicio inactivo → 404', async () => {
    const inactive = await admin.post('/api/v1/services').send({ name: 'TEST Inactivo', price: 1000, isActive: false });
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({ barberId: barber.user.id, serviceId: inactive.body.id, date: FUTURE, timeSlot: '11:00', ...guest(4) });
    assert.equal(res.status, 404);
  });

  test('horario ya pasado → 400', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({ barberId: barber.user.id, serviceId, date: businessDate(-1), timeSlot: '10:00', ...guest(5) });
    assert.equal(res.status, 400);
  });

  test('CONCURRENCIA: 10 reservas simultáneas del mismo bloque → 1 éxito y 9 conflictos', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 10 }, (_, i) => book(request(app), '15:00', guest(100 + i)))
    );
    const statuses = attempts.map((res) => res.status).sort();
    assert.equal(statuses.filter((status) => status === 201).length, 1, `Estados: ${statuses}`);
    assert.equal(statuses.filter((status) => status === 409).length, 9, `Estados: ${statuses}`);

    const stored = await prisma.appointment.count({
      where: { barberId: barber.user.id, date: wallClock(FUTURE), timeSlot: '15:00' },
    });
    assert.equal(stored, 1);
  });
});

describe('PATCH /appointments/:id/cancel', () => {
  test('invitado cancela con su token y el bloque se puede volver a reservar', async () => {
    const booking = await book(request(app), '12:00', guest(6));
    assert.equal(booking.status, 201);
    assert.ok(booking.body.guestToken);

    const cancel = await request(app)
      .patch(`/api/v1/appointments/${booking.body.id}/cancel`)
      .set('X-Guest-Token', booking.body.guestToken);
    assert.equal(cancel.status, 200);
    assert.deepEqual(cancel.body, { message: 'Cita cancelada exitosamente.' });

    const availability = await request(app).get(
      `/api/v1/appointments/availability?barberId=${barber.user.id}&date=${FUTURE}`
    );
    assert.ok(availability.body.availableSlots.includes('12:00'));

    const rebook = await book(request(app), '12:00', guest(7));
    assert.equal(rebook.status, 201);
  });

  test('el token de una cita no sirve para otra → 403; sin credenciales → 401', async () => {
    const a = await book(request(app), '13:00', guest(8));
    const b = await book(request(app), '14:00', guest(9));

    const wrongToken = await request(app)
      .patch(`/api/v1/appointments/${b.body.id}/cancel`)
      .set('X-Guest-Token', a.body.guestToken);
    assert.equal(wrongToken.status, 403);

    const anonymous = await request(app).patch(`/api/v1/appointments/${b.body.id}/cancel`);
    assert.equal(anonymous.status, 401);
  });

  test('un cliente no puede cancelar la cita de otro → 403', async () => {
    const booking = await book(client, '16:00');
    const { client: intruder } = await createUserWithRole(admin, 'CLIENT', 'intruso');
    const res = await intruder.patch(`/api/v1/appointments/${booking.body.id}/cancel`);
    assert.equal(res.status, 403);
  });

  test('cancelar dos veces → 400', async () => {
    const booking = await book(client, '17:00');
    await client.patch(`/api/v1/appointments/${booking.body.id}/cancel`);
    const again = await client.patch(`/api/v1/appointments/${booking.body.id}/cancel`);
    assert.equal(again.status, 400);
  });

  describe('regla de las 5 horas', () => {
    let soonId;

    before(async () => {
      // Cita entre 3 y 4 horas en el futuro (insertada directamente: puede caer fuera del horario base).
      const soon = new Date(nowInBusinessZone().getTime() + 4 * HOUR_MS);
      const date = toDateString(soon);
      const timeSlot = `${String(soon.getUTCHours()).padStart(2, '0')}:00`;
      const me = await client.get('/api/v1/auth/me');
      const appointment = await prisma.appointment.create({
        data: { barberId: barber.user.id, serviceId, clientId: me.body.id, date: wallClock(date), timeSlot },
      });
      soonId = appointment.id;
    });

    test('el cliente no puede cancelar con menos de 5 horas → 400 con el mensaje del contrato', async () => {
      const res = await client.patch(`/api/v1/appointments/${soonId}/cancel`);
      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { error: 'No se puede cancelar con menos de 5 horas de antelación.' });
    });

    test('el barbero asignado sí puede cancelar (la barbería no tiene la restricción)', async () => {
      const res = await barber.client.patch(`/api/v1/appointments/${soonId}/cancel`);
      assert.equal(res.status, 200);
    });
  });
});

describe('GET /appointments/me', () => {
  test('requiere sesión', async () => {
    const res = await request(app).get('/api/v1/appointments/me');
    assert.equal(res.status, 401);
  });

  test('devuelve el historial del cliente con la forma del contrato', async () => {
    const res = await client.get('/api/v1/appointments/me');
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 1);
    const item = res.body[0];
    assert.deepEqual(Object.keys(item).sort(), ['barber', 'date', 'id', 'result', 'review', 'service', 'status', 'timeSlot']);
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.deepEqual(Object.keys(item.service), ['name']);
    assert.deepEqual(Object.keys(item.barber), ['name']);
  });

  test('el barbero ve su agenda con datos del cliente/invitado', async () => {
    const res = await barber.client.get('/api/v1/appointments/me');
    assert.equal(res.status, 200);
    assert.ok(res.body.some((item) => item.guestName));
  });
});
