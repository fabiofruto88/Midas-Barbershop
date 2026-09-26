const serviceService = require('../services/service.service');

const isAdmin = (req) => req.user?.role === 'ADMIN';

const list = async (req, res) => {
  // Solo un admin puede ver servicios inactivos.
  const includeInactive = isAdmin(req) && req.validated.query.includeInactive;
  res.status(200).json(await serviceService.listServices({ includeInactive }));
};

const getById = async (req, res) => {
  const service = await serviceService.getServiceById(req.validated.params.id, {
    includeInactive: isAdmin(req),
  });
  res.status(200).json(service);
};

const create = async (req, res) => {
  res.status(201).json(await serviceService.createService(req.validated.body));
};

const update = async (req, res) => {
  res.status(200).json(await serviceService.updateService(req.validated.params.id, req.validated.body));
};

const remove = async (req, res) => {
  await serviceService.deactivateService(req.validated.params.id);
  res.status(200).json({ message: 'Servicio desactivado.' });
};

module.exports = { list, getById, create, update, remove };
