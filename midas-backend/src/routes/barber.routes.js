const { Router } = require('express');
const controller = require('../controllers/barber.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { setAvailabilityBody, barberIdParam } = require('../schemas/availability.schema');

const router = Router();

// Público: listado de barberos y su horario base (para el flujo de reserva).
router.get('/', controller.list);

// Atajos para el dashboard del barbero autenticado (van antes de /:barberId).
router.get('/me/availability', authenticate, authorize('BARBER'), controller.getMyAvailability);
router.put(
  '/me/availability',
  authenticate,
  authorize('BARBER'),
  validate({ body: setAvailabilityBody }),
  controller.setMyAvailability
);

router.get('/:barberId/availability', validate({ params: barberIdParam }), controller.getAvailability);
router.put(
  '/:barberId/availability',
  authenticate,
  authorize('BARBER', 'ADMIN'),
  validate({ params: barberIdParam, body: setAvailabilityBody }),
  controller.setAvailability
);

module.exports = router;
