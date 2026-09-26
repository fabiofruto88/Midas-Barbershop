const appointmentService = require('../services/appointment.service');
const resultService = require('../services/result.service');

const getAvailability = async (req, res) => {
  res.status(200).json(await appointmentService.getAvailability(req.validated.query));
};

const create = async (req, res) => {
  const appointment = await appointmentService.createAppointment(req.validated.body, req.user);
  res.status(201).json(appointment);
};

const cancel = async (req, res) => {
  await appointmentService.cancelAppointment(
    req.validated.params.id,
    req.user,
    req.get('X-Guest-Token')
  );
  res.status(200).json({ message: 'Cita cancelada exitosamente.' });
};

const listMine = async (req, res) => {
  res.status(200).json(await appointmentService.listMyAppointments(req.user));
};

const getAgenda = async (req, res) => {
  res.status(200).json(await appointmentService.getAgenda(req.validated.query, req.user));
};

const complete = async (req, res) => {
  res
    .status(200)
    .json(await appointmentService.completeAppointment(req.validated.params.id, req.user, req.validated.body));
};

const updateCharge = async (req, res) => {
  res.status(200).json(await appointmentService.updateCharge(req.validated.params.id, req.user, req.validated.body));
};

const uploadResult = async (req, res) => {
  const result = await resultService.uploadResult(req.validated.params.id, req.user, {
    buffer: req.file.buffer,
    notes: req.validated.body.notes,
  });
  res.status(201).json(result);
};

module.exports = { getAvailability, create, cancel, listMine, getAgenda, complete, updateCharge, uploadResult };
