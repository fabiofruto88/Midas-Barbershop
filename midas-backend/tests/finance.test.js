const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { prisma, agent, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const { nowInBusinessZone, toDateString, wallClock } = require('../src/utils/time');

const HOUR_MS = 60 * 60 * 1000;

let admin;
let barber;
let otherBarber;
let client;
let haircut;
let beard;

const slotAt = (offsetHours) => {
  const moment = new Date(nowInBusinessZone().getTime() + offsetHours * HOUR_MS);
  return { date: toDateString(moment), timeSlot: `${String(moment.getUTCHours()).padStart(2, '0')}:00` };
};

// Cita insertada directamente (fechas pasadas fijas, fuera del horario base).
const insert = (date, timeSlot, service, extra = {}) =>
  prisma.appointment.create({
    data: {
      barberId: barber.user.id,
      serviceId: service.id,
      listPrice: service.price,
      guestName: 'Invitado Finanzas',
      guestPhone: '+573001234567',
      date: wallClock(date),
      timeSlot,
      ...extra,
    },
  });

const completed = (chargedAmount, extra = {}) => ({ status: 'COMPLETED', chargedAmount, completedAt: new Date(), ...extra });

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = await createUserWithRole(admin, 'BARBER', 'finanzas');
  otherBarber = await createUserWithRole(admin, 'BARBER', 'finanzas-2');
  ({ client } = await createUserWithRole(admin, 'CLIENT', 'finanzas-cliente'));
  haircut = (await admin.post('/api/v1/services').send({ name: 'TEST Finanzas Corte', price: 20000 })).body;
  beard = (await admin.post('/api/v1/services').send({ name: 'TEST Finanzas Barba', price: 35000 })).body;

  // Semana del lunes 2025-03-03 al domingo 2025-03-09.
  await insert('2025-03-03', '10:00', haircut, completed(20000, { paymentMethod: 'CASH' }));
  await insert('2025-03-03', '11:00', beard, completed(40000, { tipAmount: 5000, paymentMethod: 'CARD', priceNote: 'Barba extra' }));
  await insert('2025-03-05', '10:00', haircut, completed(15000, { paymentMethod: 'TRANSFER', priceNote: 'Descuento' }));
  await insert('2025-03-05', '12:00', haircut, { status: 'CANCELLED' });
  // Semana anterior y resto del mes.
  await insert('2025-02-26', '10:00', haircut, completed(20000, { paymentMethod: 'CASH' }));
  await insert('2025-03-20', '10:00', haircut, completed(20000));
  // Otro barbero: no debe mezclarse.
  await insert('2025-03-03', '10:00', beard, { ...completed(35000), barberId: otherBarber.user.id });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const summary = (agent, query) => agent.get(`/api/v1/finance/summary?${new URLSearchParams(query)}`);

describe('GET /finance/summary', () => {
  test('semana: totales, ajustes, desglose por servicio y método, solo del barbero', async () => {
    const res = await summary(barber.client, { period: 'week', date: '2025-03-06' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.range, { from: '2025-03-03', to: '2025-03-09' });
    assert.deepEqual(res.body.totals, {
      services: 3,
      revenue: 75000,
      tips: 5000,
      total: 80000,
      averageTicket: 25000,
      listRevenue: 75000,
      adjustment: 0,
      adjustedUp: 1,
      adjustedDown: 1,
    });
    assert.deepEqual(
      res.body.byService.map(({ name, count, revenue, averagePrice }) => ({ name, count, revenue, averagePrice })),
      [
        { name: 'TEST Finanzas Barba', count: 1, revenue: 40000, averagePrice: 40000 },
        { name: 'TEST Finanzas Corte', count: 2, revenue: 35000, averagePrice: 17500 },
      ]
    );
    assert.deepEqual(res.body.byPaymentMethod, [
      { method: 'CASH', count: 1, amount: 20000 },
      { method: 'CARD', count: 1, amount: 45000 },
      { method: 'TRANSFER', count: 1, amount: 15000 },
    ]);
    assert.equal(res.body.cancelled, 1);
    assert.equal(res.body.series.length, 7);
    assert.deepEqual(res.body.series[0], { key: '2025-03-03', services: 2, revenue: 60000, tips: 5000, total: 65000 });
    assert.equal(res.body.entries.length, 3);
    assert.equal(res.body.entries[0].date, '2025-03-05');
    assert.equal(res.body.entries.find((entry) => entry.priceNote === 'Barba extra').chargedAmount, 40000);

    // Comparativa con la semana anterior (20.000 → 80.000 = +300 %).
    assert.deepEqual(res.body.previous, {
      range: { from: '2025-02-24', to: '2025-03-02' },
      services: 1,
      total: 20000,
      change: { services: 200, total: 300 },
    });
  });

  test('día: la serie va por hora y solo cuenta ese día', async () => {
    const res = await summary(barber.client, { period: 'day', date: '2025-03-03' });
    assert.equal(res.status, 200);
    assert.equal(res.body.totals.services, 2);
    assert.deepEqual(
      res.body.series.map(({ key, total }) => ({ key, total })),
      [
        { key: '10:00', total: 20000 },
        { key: '11:00', total: 45000 },
      ]
    );
  });

  test('mes: incluye todo marzo y compara con febrero', async () => {
    const res = await summary(barber.client, { period: 'month', date: '2025-03-15' });
    assert.deepEqual(res.body.range, { from: '2025-03-01', to: '2025-03-31' });
    assert.equal(res.body.totals.services, 4);
    assert.equal(res.body.totals.total, 100000);
    assert.equal(res.body.series.length, 31);
    assert.equal(res.body.previous.services, 1);
    assert.equal(res.body.byPaymentMethod.at(-1).method, 'UNSPECIFIED');
  });

  test('periodo sin datos: ceros y sin variación calculable', async () => {
    const res = await summary(barber.client, { period: 'day', date: '2024-01-01' });
    assert.equal(res.body.totals.services, 0);
    assert.equal(res.body.totals.averageTicket, 0);
    assert.equal(res.body.previous.change.total, null);
    assert.deepEqual(res.body.series, []);
  });

  test('un barbero no puede ver los datos de otro aunque pase barberId', async () => {
    const res = await summary(barber.client, { period: 'day', date: '2025-03-03', barberId: otherBarber.user.id });
    assert.equal(res.body.barberId, barber.user.id);
    assert.equal(res.body.totals.services, 2);
  });

  test('el admin puede filtrar por barbero', async () => {
    const res = await summary(admin, { period: 'day', date: '2025-03-03', barberId: otherBarber.user.id });
    assert.equal(res.body.totals.services, 1);
    assert.equal(res.body.totals.total, 35000);
  });

  test('cliente → 403; sin sesión → 401; parámetros inválidos → 400', async () => {
    assert.equal((await summary(client, { period: 'day', date: '2025-03-03' })).status, 403);
    assert.equal((await summary(agent(), { period: 'day', date: '2025-03-03' })).status, 401);
    assert.equal((await summary(barber.client, { period: 'year', date: '2025-03-03' })).status, 400);
    assert.equal((await summary(barber.client, { period: 'day', date: '2025-02-30' })).status, 400);
  });
});

describe('cobro al completar', () => {
  test('sin datos de cobro se cobra el precio de lista', async () => {
    const appointment = await insert(slotAt(-2).date, slotAt(-2).timeSlot, haircut);
    const res = await barber.client.patch(`/api/v1/appointments/${appointment.id}/complete`);
    assert.equal(res.status, 200);
    const stored = await prisma.appointment.findUnique({ where: { id: appointment.id } });
    assert.equal(Number(stored.chargedAmount), 20000);
    assert.equal(Number(stored.tipAmount), 0);
    assert.ok(stored.completedAt);
  });

  test('el barbero registra un importe distinto, propina, método y motivo', async () => {
    const appointment = await insert(slotAt(-3).date, slotAt(-3).timeSlot, haircut);
    const res = await barber.client
      .patch(`/api/v1/appointments/${appointment.id}/complete`)
      .send({ chargedAmount: 25000, tipAmount: 3000, paymentMethod: 'CARD', priceNote: '  Diseño en la nuca ' });
    assert.equal(res.status, 200);
    const stored = await prisma.appointment.findUnique({ where: { id: appointment.id } });
    assert.equal(Number(stored.chargedAmount), 25000);
    assert.equal(Number(stored.tipAmount), 3000);
    assert.equal(stored.paymentMethod, 'CARD');
    assert.equal(stored.priceNote, 'Diseño en la nuca');
  });

  test('importes inválidos o campos desconocidos → 400', async () => {
    const appointment = await insert(slotAt(-4).date, slotAt(-4).timeSlot, haircut);
    const url = `/api/v1/appointments/${appointment.id}/complete`;
    assert.equal((await barber.client.patch(url).send({ chargedAmount: -1 })).status, 400);
    assert.equal((await barber.client.patch(url).send({ chargedAmount: 10.123 })).status, 400);
    assert.equal((await barber.client.patch(url).send({ paymentMethod: 'BITCOIN' })).status, 400);
    assert.equal((await barber.client.patch(url).send({ priceNote: 'x'.repeat(201) })).status, 400);
    assert.equal((await barber.client.patch(url).send({ status: 'CANCELLED' })).status, 400);
  });
});

describe('PATCH /appointments/:id/charge', () => {
  test('corrige el cobro de una cita completada y borra el motivo con null', async () => {
    const appointment = await insert('2025-04-01', '10:00', haircut, completed(18000, { priceNote: 'Error' }));
    const res = await barber.client
      .patch(`/api/v1/appointments/${appointment.id}/charge`)
      .send({ chargedAmount: 20000, paymentMethod: 'CASH', priceNote: null });
    assert.equal(res.status, 200);
    assert.equal(Number(res.body.chargedAmount), 20000);
    assert.equal(res.body.paymentMethod, 'CASH');
    assert.equal(res.body.priceNote, null);
    assert.equal(res.body.date, '2025-04-01');
  });

  test('cita pendiente → 400; de otro barbero → 403; body vacío → 400', async () => {
    const pending = await insert('2025-04-02', '10:00', haircut);
    const charge = (agent, id, body) => agent.patch(`/api/v1/appointments/${id}/charge`).send(body);
    assert.equal((await charge(barber.client, pending.id, { chargedAmount: 1000 })).status, 400);

    const done = await insert('2025-04-03', '10:00', haircut, completed(20000));
    assert.equal((await charge(otherBarber.client, done.id, { chargedAmount: 1000 })).status, 403);
    assert.equal((await charge(barber.client, done.id, {})).status, 400);
  });
});
