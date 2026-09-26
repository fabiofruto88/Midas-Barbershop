const { Router } = require('express');
const controller = require('../controllers/service.controller');
const validate = require('../middlewares/validate');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { idParam } = require('../utils/validators');
const { createServiceBody, updateServiceBody, listServicesQuery } = require('../schemas/service.schema');

const router = Router();

// Catálogo público (el admin además puede ver inactivos).
router.get('/', optionalAuth, validate({ query: listServicesQuery }), controller.list);
router.get('/:id', optionalAuth, validate({ params: idParam }), controller.getById);

// Gestión: solo Admin.
router.post('/', authenticate, authorize('ADMIN'), validate({ body: createServiceBody }), controller.create);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: updateServiceBody }),
  controller.update
);
router.delete('/:id', authenticate, authorize('ADMIN'), validate({ params: idParam }), controller.remove);

module.exports = router;
