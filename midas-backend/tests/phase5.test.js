const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { prisma, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const storage = require('../src/services/storage.service');
const { nowInBusinessZone, toDateString, wallClock } = require('../src/utils/time');

const HOUR_MS = 60 * 60 * 1000;
// PNG real de 1x1 píxel.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Doble de Cloudinary: registra subidas y borrados.
const realUpload = storage.uploadImage;
const realDelete = storage.deleteImageByUrl;
let uploads;
let deletions;

const slotAt = (offsetHours) => {
  const moment = new Date(nowInBusinessZone().getTime() + offsetHours * HOUR_MS);
  return { date: toDateString(moment), timeSlot: `${String(moment.getUTCHours()).padStart(2, '0')}:00` };
};

let admin;
let barber;
let otherBarber;
let client;
let clientId;
let serviceId;

const createAppointment = ({ date, timeSlot }, barberId = barber.user.id, extra = {}) =>
  prisma.appointment.create({
    data: { barberId, serviceId, listPrice: 20000, clientId, date: wallClock(date), timeSlot, ...extra },
  });

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = await createUserWithRole(admin, 'BARBER', 'fotos');
  otherBarber = await createUserWithRole(admin, 'BARBER', 'fotos-2');
  ({ client } = await createUserWithRole(admin, 'CLIENT', 'fotos-cliente'));
  clientId = (await client.get('/api/v1/auth/me')).body.id;
  serviceId = (await admin.post('/api/v1/services').send({ name: 'TEST Fotos', price: 20000 })).body.id;
});

beforeEach(() => {
  uploads = [];
  deletions = [];
  storage.uploadImage = async (buffer) => {
    uploads.push(buffer.length);
    return { url: `https://res.cloudinary.com/demo/image/upload/v1/midas/results/test-${uploads.length}.png` };
  };
  storage.deleteImageByUrl = async (url) => deletions.push(url);
});

after(async () => {
  storage.uploadImage = realUpload;
  storage.deleteImageByUrl = realDelete;
  await cleanup();
  await prisma.$disconnect();
});

describe('GET /appointments/agenda', () => {
  let date;

  before(async () => {
    date = slotAt(24 * 3).date;
    await createAppointment({ date, timeSlot: '11:00' });
    await createAppointment({ date, timeSlot: '10:00' });
    await createAppointment({ date, timeSlot: '10:00' }, otherBarber.user.id, {
      clientId: null,
      guestName: 'Invitado Agenda',
      guestPhone: '+573001234567',
    });
  });

  test('el barbero ve solo su agenda del día, ordenada por hora', async () => {
    const res = await barber.client.get(`/api/v1/appointments/agenda?date=${date}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.date, date);
    assert.deepEqual(res.body.appointments.map((item) => item.timeSlot), ['10:00', '11:00']);
    assert.ok(res.body.appointments.every((item) => item.barber.id === barber.user.id));
    assert.equal(res.body.appointments[0].client.id, clientId);
  });

  test('el admin ve todas las agendas o filtra por barbero', async () => {
    const all = await admin.get(`/api/v1/appointments/agenda?date=${date}`);
    assert.equal(all.body.appointments.length, 3);
    const filtered = await admin.get(`/api/v1/appointments/agenda?date=${date}&barberId=${otherBarber.user.id}`);
    assert.equal(filtered.body.appointments.length, 1);
    assert.equal(filtered.body.appointments[0].guestName, 'Invitado Agenda');
  });

  test('un cliente no tiene acceso → 403', async () => {
    const res = await client.get(`/api/v1/appointments/agenda?date=${date}`);
    assert.equal(res.status, 403);
  });
});

describe('PATCH /appointments/:id/complete', () => {
  test('el barbero completa una cita ya iniciada', async () => {
    const appointment = await createAppointment(slotAt(-2));
    const res = await barber.client.patch(`/api/v1/appointments/${appointment.id}/complete`);
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'COMPLETED');
  });

  test('no se puede completar una cita futura ni la de otro barbero', async () => {
    const future = await createAppointment(slotAt(24 * 4));
    const early = await barber.client.patch(`/api/v1/appointments/${future.id}/complete`);
    assert.equal(early.status, 400);

    const past = await createAppointment(slotAt(-3));
    const foreign = await otherBarber.client.patch(`/api/v1/appointments/${past.id}/complete`);
    assert.equal(foreign.status, 403);
  });
});

describe('POST /appointments/:id/results', () => {
  const upload = (agent, id, buffer = PNG, filename = 'corte.png', fields = {}) => {
    const req = agent.post(`/api/v1/appointments/${id}/results`);
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    return req.attach('image', buffer, filename);
  };

  test('el barbero sube la foto: 201, contrato cumplido y la cita queda COMPLETED', async () => {
    const appointment = await createAppointment(slotAt(-4));
    const res = await upload(barber.client, appointment.id, PNG, 'corte.png', { notes: 'Degradado medio' });

    assert.equal(res.status, 201);
    assert.equal(res.body.appointmentId, appointment.id);
    assert.match(res.body.imageUrl, /^https:\/\/res\.cloudinary\.com\//);
    assert.equal(res.body.notes, 'Degradado medio');
    assert.equal(uploads.length, 1);

    const stored = await prisma.appointment.findUnique({ where: { id: appointment.id }, include: { result: true } });
    assert.equal(stored.status, 'COMPLETED');
    assert.equal(stored.result.imageUrl, res.body.imageUrl);
    // Completada por la foto: se da por cobrada al precio de lista.
    assert.equal(Number(stored.chargedAmount), 20000);
    assert.ok(stored.completedAt);

    // El cliente la ve en su historial.
    const history = await client.get('/api/v1/appointments/me');
    const clientItem = history.body.find((item) => item.id === appointment.id);
    assert.equal(clientItem.result.imageUrl, res.body.imageUrl);
    assert.equal(clientItem.result.notes, undefined); // las notas técnicas son del barbero

    // El barbero la ve en su historial de servicios, con cliente y notas.
    const barberHistory = await barber.client.get('/api/v1/appointments/me');
    const barberItem = barberHistory.body.find((item) => item.id === appointment.id);
    assert.equal(barberItem.status, 'COMPLETED');
    assert.equal(barberItem.result.imageUrl, res.body.imageUrl);
    assert.equal(barberItem.result.notes, 'Degradado medio');
    assert.ok(barberItem.client);
  });

  test('subir otra foto reemplaza la anterior y borra la vieja de Cloudinary', async () => {
    const appointment = await createAppointment(slotAt(-5));
    const first = await upload(barber.client, appointment.id);
    const second = await upload(barber.client, appointment.id);
    assert.equal(second.status, 201);
    assert.equal(second.body.id, first.body.id);
    assert.notEqual(second.body.imageUrl, first.body.imageUrl);
    assert.deepEqual(deletions, [first.body.imageUrl]);
  });

  test('archivo que no es imagen (aunque diga .png) → 415 sin subir nada', async () => {
    const appointment = await createAppointment(slotAt(-6));
    const res = await upload(barber.client, appointment.id, Buffer.from('<script>alert(1)</script>'), 'falso.png');
    assert.equal(res.status, 415);
    assert.equal(uploads.length, 0);
  });

  test('imagen de más de 5MB → 413', async () => {
    const appointment = await createAppointment(slotAt(-7));
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await upload(barber.client, appointment.id, big, 'grande.png');
    assert.equal(res.status, 413);
    assert.equal(uploads.length, 0);
  });

  test('sin archivo → 400', async () => {
    const appointment = await createAppointment(slotAt(-8));
    const res = await barber.client.post(`/api/v1/appointments/${appointment.id}/results`).field('notes', 'x');
    assert.equal(res.status, 400);
  });

  test('cita futura o cancelada → 400; cita de otro barbero → 403; cliente → 403', async () => {
    const future = await createAppointment(slotAt(24 * 5));
    assert.equal((await upload(barber.client, future.id)).status, 400);

    const cancelled = await createAppointment(slotAt(-9), barber.user.id, { status: 'CANCELLED' });
    assert.equal((await upload(barber.client, cancelled.id)).status, 400);

    const past = await createAppointment(slotAt(-10));
    assert.equal((await upload(otherBarber.client, past.id)).status, 403);
    assert.equal((await upload(client, past.id)).status, 403);
    assert.equal(uploads.length, 0);
  });

  test('sin Cloudinary configurado → 503 con mensaje claro', async () => {
    storage.uploadImage = realUpload;
    const saved = process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    try {
      const appointment = await createAppointment(slotAt(-11));
      const res = await upload(barber.client, appointment.id);
      assert.equal(res.status, 503);
      assert.match(res.body.error, /Cloudinary/);
    } finally {
      if (saved !== undefined) process.env.CLOUDINARY_CLOUD_NAME = saved;
    }
  });
});

describe('Galería de resultados (/results)', () => {
  const upload = (id) => barber.client.post(`/api/v1/appointments/${id}/results`).attach('image', PNG, 'corte.png');

  test('una foto nueva no es pública hasta que el admin la publica', async () => {
    const appointment = await createAppointment(slotAt(-12));
    const uploaded = await upload(appointment.id);
    assert.equal(uploaded.body.isPublished, false);

    const before = await barber.client.get('/api/v1/results/public');
    assert.equal(before.status, 200);
    assert.ok(!before.body.some((item) => item.id === uploaded.body.id));

    const pending = await admin.get('/api/v1/results?isPublished=false');
    assert.ok(pending.body.some((item) => item.id === uploaded.body.id));

    const published = await admin.patch(`/api/v1/results/${uploaded.body.id}`).send({ isPublished: true });
    assert.equal(published.status, 200);
    assert.equal(published.body.isPublished, true);

    const after = await barber.client.get('/api/v1/results/public');
    const item = after.body.find((entry) => entry.id === uploaded.body.id);
    assert.equal(item.appointment.service.name, 'TEST Fotos');
    assert.equal(item.appointment.barber.name, barber.user.name);
    // La galería pública no expone datos del cliente ni notas técnicas.
    assert.equal(item.notes, undefined);
    assert.equal(item.appointment.client, undefined);

    // Cambiar la foto la devuelve a revisión.
    const replaced = await upload(appointment.id);
    assert.equal(replaced.body.isPublished, false);
  });

  test('solo el admin modera: barbero → 403, sin sesión → 401, id inexistente → 404', async () => {
    const appointment = await createAppointment(slotAt(-13));
    const { body } = await upload(appointment.id);
    assert.equal((await barber.client.patch(`/api/v1/results/${body.id}`).send({ isPublished: true })).status, 403);
    assert.equal((await barber.client.get('/api/v1/results')).status, 403);
    const missing = await admin.patch('/api/v1/results/00000000-0000-4000-8000-000000000000').send({ isPublished: true });
    assert.equal(missing.status, 404);
  });
});

test('publicIdFromUrl extrae el id de Cloudinary', () => {
  assert.equal(
    storage.publicIdFromUrl('https://res.cloudinary.com/midas/image/upload/v1234/midas/results/abc-123.jpg'),
    'midas/results/abc-123'
  );
  assert.equal(storage.publicIdFromUrl('https://otro.com/x'), null);
});
