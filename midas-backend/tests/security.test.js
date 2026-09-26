const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { app, prisma, request, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const config = require('../src/config/env');
const { signGuestToken } = require('../src/utils/token');

let admin;

before(async () => {
  await cleanup();
  admin = await loginAdmin();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);

test('un barbero degradado pierde sus permisos al instante (el rol se lee de la BD)', async () => {
  const barber = await createUserWithRole(admin, 'BARBER', 'degradado');
  assert.equal((await barber.client.get(`/api/v1/appointments/agenda?date=${today}`)).status, 200);

  await admin.patch(`/api/v1/users/${barber.user.id}`).send({ role: 'CLIENT' });
  assert.equal((await barber.client.get(`/api/v1/appointments/agenda?date=${today}`)).status, 403);
});

test('el token de un usuario eliminado deja de funcionar', async () => {
  const doomed = await createUserWithRole(admin, 'CLIENT', 'eliminado');
  await admin.delete(`/api/v1/users/${doomed.user.id}`);
  assert.equal((await doomed.client.get('/api/v1/appointments/me')).status, 401);
});

test('un token de invitado no sirve como cookie de sesión', async () => {
  const guestToken = signGuestToken({ id: '00000000-0000-4000-8000-000000000000', date: '2030-01-01', timeSlot: '10:00' });
  const res = await request(app).get('/api/v1/auth/me').set('Cookie', `token=${guestToken}`);
  assert.equal(res.status, 401);
});

test('se rechazan tokens sin firma (alg "none") o firmados con otro secreto', async () => {
  const me = await admin.get('/api/v1/auth/me');
  const unsigned = jwt.sign({ sub: me.body.id, role: 'ADMIN', type: 'session' }, null, { algorithm: 'none' });
  const forged = jwt.sign({ sub: me.body.id, role: 'ADMIN', type: 'session' }, 'otro-secreto');

  for (const token of [unsigned, forged]) {
    const res = await request(app).get('/api/v1/users').set('Cookie', `token=${token}`);
    assert.equal(res.status, 401);
  }
});

test('sin TRUST_PROXY no se confía en X-Forwarded-For (evita saltarse el rate limit)', () => {
  assert.equal(process.env.TRUST_PROXY ?? '0', '0');
  assert.equal(app.get('trust proxy'), 0);
  assert.equal(config.trustProxy, 0);
});

test('las respuestas no revelan la tecnología del servidor y llevan cabeceras de seguridad', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.ok(res.headers['strict-transport-security']);
  assert.ok(res.headers['content-security-policy']);
});

test('los errores inesperados no filtran detalles internos', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": ');
  assert.equal(res.status, 400);
  assert.equal(res.body.stack, undefined);
});
