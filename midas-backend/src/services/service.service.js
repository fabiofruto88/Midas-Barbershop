const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const listServices = ({ includeInactive }) =>
  prisma.service.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' },
  });

const getServiceById = async (id, { includeInactive }) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || (!service.isActive && !includeInactive)) {
    throw new AppError('Servicio no encontrado.', 404);
  }
  return service;
};

const createService = (data) => prisma.service.create({ data });

const updateService = async (id, data) => {
  await getServiceById(id, { includeInactive: true });
  return prisma.service.update({ where: { id }, data });
};

// Borrado lógico: las citas históricas siguen referenciando el servicio.
const deactivateService = async (id) => {
  await getServiceById(id, { includeInactive: true });
  return prisma.service.update({ where: { id }, data: { isActive: false } });
};

module.exports = { listServices, getServiceById, createService, updateService, deactivateService };
