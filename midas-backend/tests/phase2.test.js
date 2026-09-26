const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, prisma, request, agent, loginAdmin, createUserWithRole, testEmail, cleanup } = require('./helpers');

before(cleanup);
after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Autenticación', () => {
  const email = testEmail('cliente');
  const password = 'securePassword123';

  test('POST /auth/register crea un CLIENT y envía cookie HttpOnly', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Juan Perez', email, password, phone: '+573001234567' });

    assert.equal(res.status, 201);
    assert.equal(res.body.role, 'CLIENT');
    assert.equal(res.body.email, email);
    assert.equal(res.body.passwordHash, undefined);

    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /token=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
  });

  test('registro duplicado → 409', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Otro', email, password });
    assert.equal(res.status, 409);
  });

  test('registro con datos inválidos → 400 con detalle', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'J', email: 'no-es-email', password: '123' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
    assert.ok(res.body.details.length >= 3);
  });

  test('no se puede auto-asignar rol en el registro (campos extra rechazados)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Hacker', email: testEmail('hack'), password, role: 'ADMIN' });
    assert.equal(res.status, 400);
  });

  test('login correcto, /auth/me y logout', async () => {
    const client = agent();
    const login = await client.post('/api/v1/auth/login').send({ email: email.toUpperCase(), password });
    assert.equal(login.status, 200);

    const me = await client.get('/api/v1/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.email, email);

    await client.post('/api/v1/auth/logout');
    const afterLogout = await client.get('/api/v1/auth/me');
    assert.equal(afterLogout.status, 401);
  });

  test('login con contraseña incorrecta o email inexistente → 401 con el mismo mensaje', async () => {
    const wrong = await request(app).post('/api/v1/auth/login').send({ email, password: 'incorrecta1' });
    const missing = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail('nadie'), password: 'incorrecta1' });
    assert.equal(wrong.status, 401);
    assert.equal(missing.status, 401);
    assert.equal(wrong.body.error, missing.body.error);
  });

  test('token manipulado → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', 'token=abc.def.ghi');
    assert.equal(res.status, 401);
  });
});

describe('Servicios (CRUD Admin)', () => {
  let admin;
  let client;
  let serviceId;

  before(async () => {
    admin = await loginAdmin();
    ({ client } = await createUserWithRole(admin, 'CLIENT'));
  });

  test('un cliente no puede crear servicios → 403', async () => {
    const res = await client.post('/api/v1/services').send({ name: 'TEST Corte', price: 25000 });
    assert.equal(res.status, 403);
  });

  test('sin sesión no se puede crear servicios → 401', async () => {
    const res = await request(app).post('/api/v1/services').send({ name: 'TEST Corte', price: 25000 });
    assert.equal(res.status, 401);
  });

  test('admin crea servicio con duración fija de 60 minutos', async () => {
    const res = await admin
      .post('/api/v1/services')
      .send({ name: 'TEST Corte + Barba', description: 'Corte clásico', price: 35000.5 });
    assert.equal(res.status, 201);
    assert.equal(res.body.durationMinutes, 60);
    assert.equal(res.body.price, '35000.5');
    serviceId = res.body.id;
  });

  test('no se acepta durationMinutes ni precios con más de 2 decimales', async () => {
    const duration = await admin
      .post('/api/v1/services')
      .send({ name: 'TEST Largo', price: 10000, durationMinutes: 90 });
    const decimals = await admin.post('/api/v1/services').send({ name: 'TEST Raro', price: 10.123 });
    assert.equal(duration.status, 400);
    assert.equal(decimals.status, 400);
  });

  test('catálogo público lista el servicio y admin lo actualiza', async () => {
    const list = await request(app).get('/api/v1/services');
    assert.equal(list.status, 200);
    assert.ok(list.body.some((service) => service.id === serviceId));

    const updated = await admin.patch(`/api/v1/services/${serviceId}`).send({ price: 40000 });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.price, '40000');
  });

  test('DELETE desactiva (borrado lógico) y deja de verse en el catálogo público', async () => {
    const del = await admin.delete(`/api/v1/services/${serviceId}`);
    assert.equal(del.status, 200);

    const publicList = await request(app).get('/api/v1/services');
    assert.ok(!publicList.body.some((service) => service.id === serviceId));

    const publicGet = await request(app).get(`/api/v1/services/${serviceId}`);
    assert.equal(publicGet.status, 404);

    const adminList = await admin.get('/api/v1/services?includeInactive=true');
    assert.ok(adminList.body.some((service) => service.id === serviceId && !service.isActive));
  });

  test('UUID inválido → 400', async () => {
    const res = await request(app).get('/api/v1/services/123');
    assert.equal(res.status, 400);
  });
});

describe('Usuarios y Barberos (Admin)', () => {
  let admin;
  let barber;

  before(async () => {
    admin = await loginAdmin();
  });

  test('admin crea un barbero y aparece en el listado público sin datos sensibles', async () => {
    barber = await createUserWithRole(admin, 'BARBER');
    const res = await request(app).get('/api/v1/barbers');
    assert.equal(res.status, 200);
    const found = res.body.find((item) => item.id === barber.user.id);
    assert.deepEqual(Object.keys(found).sort(), ['id', 'name']);
  });

  test('admin filtra usuarios por rol', async () => {
    const res = await admin.get('/api/v1/users?role=BARBER');
    assert.equal(res.status, 200);
    assert.ok(res.body.every((user) => user.role === 'BARBER'));
    assert.ok(res.body.every((user) => user.passwordHash === undefined));
  });

  test('un barbero no puede gestionar usuarios → 403', async () => {
    const res = await barber.client.get('/api/v1/users');
    assert.equal(res.status, 403);
  });

  test('admin no puede eliminarse ni cambiar su propio rol', async () => {
    const me = await admin.get('/api/v1/auth/me');
    const del = await admin.delete(`/api/v1/users/${me.body.id}`);
    const demote = await admin.patch(`/api/v1/users/${me.body.id}`).send({ role: 'CLIENT' });
    assert.equal(del.status, 400);
    assert.equal(demote.status, 400);
  });

  test('admin actualiza y elimina un usuario sin citas', async () => {
    const extra = await createUserWithRole(admin, 'BARBER', 'extra');
    const upd = await admin.patch(`/api/v1/users/${extra.user.id}`).send({ name: 'Carlos Actualizado' });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.name, 'Carlos Actualizado');

    const del = await admin.delete(`/api/v1/users/${extra.user.id}`);
    assert.equal(del.status, 200);
    const get = await admin.get(`/api/v1/users/${extra.user.id}`);
    assert.equal(get.status, 404);
  });
});

describe('Disponibilidad del barbero', () => {
  let admin;
  let barberA;
  let barberB;

  const schedule = [
    { dayOfWeek: 1, startTime: '10:00', endTime: '20:00' },
    { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
  ];

  before(async () => {
    admin = await loginAdmin();
    barberA = await createUserWithRole(admin, 'BARBER', 'barbero-a');
    barberB = await createUserWithRole(admin, 'BARBER', 'barbero-b');
  });

  test('el barbero configura su horario semanal (/me/availability)', async () => {
    const res = await barberA.client.put('/api/v1/barbers/me/availability').send({ schedule });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.schedule, schedule);

    const publicView = await request(app).get(`/api/v1/barbers/${barberA.user.id}/availability`);
    assert.equal(publicView.status, 200);
    assert.deepEqual(publicView.body.schedule, schedule);
  });

  test('PUT reemplaza el horario completo', async () => {
    const res = await barberA.client
      .put('/api/v1/barbers/me/availability')
      .send({ schedule: [{ dayOfWeek: 3, startTime: '12:00', endTime: '18:00' }] });
    assert.equal(res.status, 200);
    assert.equal(res.body.schedule.length, 1);
    assert.equal(res.body.schedule[0].dayOfWeek, 3);
  });

  test('un barbero no puede modificar el horario de otro → 403', async () => {
    const res = await barberB.client
      .put(`/api/v1/barbers/${barberA.user.id}/availability`)
      .send({ schedule });
    assert.equal(res.status, 403);
  });

  test('el admin puede modificar el horario de cualquier barbero', async () => {
    const res = await admin.put(`/api/v1/barbers/${barberB.user.id}/availability`).send({ schedule });
    assert.equal(res.status, 200);
  });

  test('validaciones: día repetido, hora no en punto, inicio >= fin, día fuera de rango', async () => {
    const cases = [
      [schedule[0], schedule[0]],
      [{ dayOfWeek: 2, startTime: '10:30', endTime: '18:00' }],
      [{ dayOfWeek: 2, startTime: '18:00', endTime: '10:00' }],
      [{ dayOfWeek: 8, startTime: '10:00', endTime: '18:00' }],
    ];
    for (const bad of cases) {
      const res = await barberA.client.put('/api/v1/barbers/me/availability').send({ schedule: bad });
      assert.equal(res.status, 400, JSON.stringify(bad));
    }
  });

  test('horario de un usuario que no es barbero → 404', async () => {
    const me = await admin.get('/api/v1/auth/me');
    const res = await request(app).get(`/api/v1/barbers/${me.body.id}/availability`);
    assert.equal(res.status, 404);
  });

  test('un cliente no puede usar /me/availability → 403', async () => {
    const { client } = await createUserWithRole(admin, 'CLIENT');
    const res = await client.get('/api/v1/barbers/me/availability');
    assert.equal(res.status, 403);
  });
});
