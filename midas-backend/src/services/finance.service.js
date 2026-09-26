const prisma = require('../config/prisma');
const { wallClock, toDateString } = require('../utils/time');
const { ensureBarber } = require('./user.service');

const DAY_MS = 24 * 60 * 60 * 1000;
const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER'];

// Los importes se suman en centavos (enteros) para no arrastrar errores de coma flotante.
const toCents = (value) => (value == null ? 0 : Math.round(Number(value) * 100));
const fromCents = (cents) => cents / 100;
// Los promedios se muestran en pesos enteros (225000 / 7 → 32143), como indica el contrato.
const roundToPeso = (cents) => Math.round(cents / 100) * 100;

const addDays = (date, days) => toDateString(new Date(wallClock(date).getTime() + days * DAY_MS));

// Rango [from, to] (ambos incluidos) del periodo que contiene `date`. La semana va de lunes a domingo.
const periodRange = (period, date) => {
  if (period === 'day') return { from: date, to: date };
  if (period === 'week') {
    const day = wallClock(date).getUTCDay() || 7;
    const from = addDays(date, 1 - day);
    return { from, to: addDays(from, 6) };
  }
  const [year, month] = date.split('-').map(Number);
  return { from: `${date.slice(0, 7)}-01`, to: toDateString(new Date(Date.UTC(year, month, 0))) };
};

// Periodo inmediatamente anterior, para la comparativa.
const previousRange = (period, { from }) => periodRange(period, addDays(from, -1));

const daysBetween = ({ from, to }) => {
  const days = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
};

const whereFor = ({ from, to }, barberId, status) => ({
  ...(barberId && { barberId }),
  date: { gte: wallClock(from), lte: wallClock(to) },
  status,
});

const chargedCents = (appointment) => toCents(appointment.chargedAmount ?? appointment.listPrice);

// Variación porcentual respecto al periodo anterior (null si antes no hubo nada con qué comparar).
const percentChange = (current, previous) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

// Eje de la gráfica: por hora en el día (solo las horas con servicios); por día en semana y mes.
const buildSeries = (period, range, completed) => {
  const keys =
    period === 'day' ? [...new Set(completed.map((item) => item.timeSlot))].sort() : daysBetween(range);
  const buckets = new Map(keys.map((key) => [key, { key, services: 0, revenue: 0, tips: 0 }]));

  for (const appointment of completed) {
    const bucket = buckets.get(period === 'day' ? appointment.timeSlot : toDateString(appointment.date));
    bucket.services += 1;
    bucket.revenue += chargedCents(appointment);
    bucket.tips += toCents(appointment.tipAmount);
  }

  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    revenue: fromCents(bucket.revenue),
    tips: fromCents(bucket.tips),
    total: fromCents(bucket.revenue + bucket.tips),
  }));
};

const summarize = (completed) => {
  let revenue = 0;
  let tips = 0;
  let listRevenue = 0;
  let adjustedUp = 0;
  let adjustedDown = 0;
  const byService = new Map();
  const byMethod = new Map([...PAYMENT_METHODS, null].map((method) => [method, { count: 0, amount: 0 }]));

  for (const appointment of completed) {
    const charged = chargedCents(appointment);
    const list = toCents(appointment.listPrice);
    const tip = toCents(appointment.tipAmount);
    revenue += charged;
    tips += tip;
    listRevenue += list;
    if (charged > list) adjustedUp += 1;
    if (charged < list) adjustedDown += 1;

    const { id, name } = appointment.service;
    const service = byService.get(id) ?? { serviceId: id, name, count: 0, revenue: 0, tips: 0 };
    service.count += 1;
    service.revenue += charged;
    service.tips += tip;
    byService.set(id, service);

    const method = byMethod.get(appointment.paymentMethod);
    method.count += 1;
    method.amount += charged + tip;
  }

  const services = completed.length;
  return {
    totals: {
      services,
      revenue: fromCents(revenue),
      tips: fromCents(tips),
      total: fromCents(revenue + tips),
      averageTicket: services ? fromCents(roundToPeso(revenue / services)) : 0,
      listRevenue: fromCents(listRevenue),
      adjustment: fromCents(revenue - listRevenue),
      adjustedUp,
      adjustedDown,
    },
    byService: [...byService.values()]
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
      .map((service) => ({
        ...service,
        revenue: fromCents(service.revenue),
        tips: fromCents(service.tips),
        averagePrice: fromCents(roundToPeso(service.revenue / service.count)),
      })),
    byPaymentMethod: [...byMethod.entries()]
      .filter(([, { count }]) => count > 0)
      .map(([method, { count, amount }]) => ({ method: method ?? 'UNSPECIFIED', count, amount: fromCents(amount) })),
  };
};

const completedSelect = {
  id: true,
  date: true,
  timeSlot: true,
  listPrice: true,
  chargedAmount: true,
  tipAmount: true,
  paymentMethod: true,
  priceNote: true,
  service: { select: { id: true, name: true } },
  barber: { select: { id: true, name: true } },
  client: { select: { name: true } },
  guestName: true,
};

const formatEntry = ({ client, guestName, date, listPrice, chargedAmount, tipAmount, ...rest }) => ({
  ...rest,
  date: toDateString(date),
  clientName: client?.name ?? guestName ?? null,
  listPrice: Number(listPrice),
  chargedAmount: Number(chargedAmount ?? listPrice),
  tipAmount: Number(tipAmount),
});

// GET /finance/summary: lo generado en el día, la semana o el mes que contiene `date`.
// El barbero ve lo suyo; el admin, lo de un barbero (barberId) o lo de toda la barbería.
const getSummary = async ({ period, date, barberId }, user) => {
  const scopeBarberId = user.role === 'BARBER' ? user.id : barberId;
  if (user.role !== 'BARBER' && barberId) await ensureBarber(barberId);
  const range = periodRange(period, date);
  const previous = previousRange(period, range);

  const [completed, previousCompleted, cancelled, upcoming] = await Promise.all([
    prisma.appointment.findMany({
      where: whereFor(range, scopeBarberId, 'COMPLETED'),
      orderBy: [{ date: 'desc' }, { timeSlot: 'desc' }],
      select: completedSelect,
    }),
    prisma.appointment.findMany({
      where: whereFor(previous, scopeBarberId, 'COMPLETED'),
      select: { listPrice: true, chargedAmount: true, tipAmount: true },
    }),
    prisma.appointment.count({ where: whereFor(range, scopeBarberId, 'CANCELLED') }),
    prisma.appointment.aggregate({
      where: whereFor(range, scopeBarberId, 'PENDING'),
      _count: true,
      _sum: { listPrice: true },
    }),
  ]);

  const { totals, byService, byPaymentMethod } = summarize(completed);
  const previousTotal = fromCents(
    previousCompleted.reduce((sum, item) => sum + chargedCents(item) + toCents(item.tipAmount), 0)
  );

  return {
    period,
    date,
    range,
    barberId: scopeBarberId ?? null,
    totals,
    previous: {
      range: previous,
      services: previousCompleted.length,
      total: previousTotal,
      change: {
        services: percentChange(totals.services, previousCompleted.length),
        total: percentChange(totals.total, previousTotal),
      },
    },
    byService,
    byPaymentMethod,
    series: buildSeries(period, range, completed),
    cancelled,
    // Citas aún pendientes del periodo: lo previsto a precio de lista.
    upcoming: { count: upcoming._count, expected: fromCents(toCents(upcoming._sum.listPrice)) },
    entries: completed.map(formatEntry),
  };
};

module.exports = { getSummary, periodRange };
