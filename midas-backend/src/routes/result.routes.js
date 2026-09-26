const { Router } = require('express');
const controller = require('../controllers/result.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { idParam } = require('../utils/validators');
const { publicResultsQuery, listResultsQuery, publishResultBody } = require('../schemas/result.schema');

const router = Router();

// Galería pública: solo las fotos que el admin aprobó.
router.get('/public', validate({ query: publicResultsQuery }), controller.listPublic);

// Moderación: solo Admin.
router.get('/', authenticate, authorize('ADMIN'), validate({ query: listResultsQuery }), controller.list);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: publishResultBody }),
  controller.publish
);

module.exports = router;
