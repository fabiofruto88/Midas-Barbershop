// Utilidades compartidas por las pruebas de integración.
// Usan la base de datos del .env y borran al final todo lo que crean
// (usuarios con email @test.midas y servicios con nombre "TEST ...").
process.env.NODE_ENV = 'test';
require('dotenv').config({ quiet: true });

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const TEST_DOMAIN = '@test.midas';
const unique = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
const testEmail = (label) => `${label}-${unique()}${TEST_DOMAIN}`;

// Agente con cookies persistentes (simula un navegador).
const agent = () => request.agent(app);

const loginAs = async (email, password) => {
  const client = agent();
  const res = await client.post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login fallido para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return client;
};

const loginAdmin = () => loginAs(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

// Crea un usuario del rol indicado (vía API de admin) y devuelve su agente con sesión.
const createUserWithRole = async (admin, role, label = role.toLowerCase()) => {
  const email = testEmail(label);
  const password = 'Password123';
  const res = await admin.post('/api/v1/users').send({ name: `Test ${label}`, email, password, role });
  if (res.status !== 201) throw new Error(`No se pudo crear ${role}: ${JSON.stringify(res.body)}`);
  return { user: res.body, client: await loginAs(email, password), email, password };
};

const cleanup = async () => {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN } },
    select: { id: true },
  });
  const ids = users.map((user) => user.id);
  const testServices = await prisma.service.findMany({
    where: { name: { startsWith: 'TEST ' } },
    select: { id: true },
  });
  const serviceIds = testServices.map((service) => service.id);

  const appointmentWhere = {
    OR: [{ barberId: { in: ids } }, { clientId: { in: ids } }, { serviceId: { in: serviceIds } }],
  };
  await prisma.serviceResult.deleteMany({ where: { appointment: appointmentWhere } });
  await prisma.appointment.deleteMany({ where: appointmentWhere });
  await prisma.barberAvailability.deleteMany({ where: { barberId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
};

module.exports = { app, prisma, request, agent, loginAs, loginAdmin, createUserWithRole, testEmail, cleanup };
