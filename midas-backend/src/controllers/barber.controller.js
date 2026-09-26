const userService = require('../services/user.service');
const availabilityService = require('../services/availability.service');
const AppError = require('../utils/AppError');

const list = async (req, res) => {
  res.status(200).json(await userService.listBarbers());
};

const getAvailability = async (req, res) => {
  res.status(200).json(await availabilityService.getAvailability(req.validated.params.barberId));
};

const setAvailability = async (req, res) => {
  const { barberId } = req.validated.params;
  // Un barbero solo puede editar su propio horario; el admin puede editar el de cualquiera.
  if (req.user.role !== 'ADMIN' && req.user.id !== barberId) {
    throw new AppError('Solo puedes modificar tu propio horario.', 403);
  }
  const result = await availabilityService.setAvailability(barberId, req.validated.body.schedule);
  res.status(200).json(result);
};

const getMyAvailability = async (req, res) => {
  res.status(200).json(await availabilityService.getAvailability(req.user.id));
};

const setMyAvailability = async (req, res) => {
  const result = await availabilityService.setAvailability(req.user.id, req.validated.body.schedule);
  res.status(200).json(result);
};

module.exports = { list, getAvailability, setAvailability, getMyAvailability, setMyAvailability };
