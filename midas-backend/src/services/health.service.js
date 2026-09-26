const prisma = require('../config/prisma');

const isDatabaseUp = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

module.exports = { isDatabaseUp };
