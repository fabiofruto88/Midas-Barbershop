const { Router } = require('express');
const controller = require('../controllers/appointment.controller');
const validate = require('../middlewares/validate');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/uploadImage');
const { bookingLimiter } = require('../middlewares/rateLimiter');
const {
  availabilityQuery,
  createAppointmentBody,
  agendaQuery,
  resultBody,
  appointmentIdParam,
} = require('../schemas/appointment.schema');

const router = Router();

router.get('/availability', validate({ query: availabilityQuery }), controller.getAvailability);
router.get('/me', authenticate, controller.listMine);
router.get('/agenda', authenticate, authorize('BARBER', 'ADMIN'), validate({ query: agendaQuery }), controller.getAgenda);

// Clientes registrados o invitados.
router.post('/', optionalAuth, bookingLimiter, validate({ body: createAppointmentBody }), controller.create);
// Cookie de sesión o cabecera X-Guest-Token para invitados.
router.patch('/:id/cancel', optionalAuth, validate({ params: appointmentIdParam }), controller.cancel);
router.patch(
  '/:id/complete',
  authenticate,
  authorize('BARBER', 'ADMIN'),
  validate({ params: appointmentIdParam }),
  controller.complete
);

// Foto del resultado: solo barberos (multipart/form-data, campo "image").
router.post(
  '/:id/results',
  authenticate,
  authorize('BARBER'),
  validate({ params: appointmentIdParam }),
  uploadImage('image'),
  validate({ body: resultBody }),
  controller.uploadResult
);

module.exports = router;
