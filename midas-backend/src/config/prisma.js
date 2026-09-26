const { PrismaClient } = require('@prisma/client');

// Instancia única de Prisma para toda la aplicación (evita agotar el pool de conexiones).
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
