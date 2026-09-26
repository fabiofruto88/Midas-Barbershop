const { Router } = require('express');
const controller = require('../controllers/review.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { idParam } = require('../utils/validators');
const { publicReviewsQuery, listReviewsQuery, visibilityBody } = require('../schemas/review.schema');

const router = Router();

// Testimonios de la landing: solo reseñas visibles.
router.get('/public', validate({ query: publicReviewsQuery }), controller.listPublic);

// Moderación: solo Admin.
router.get('/', authenticate, authorize('ADMIN'), validate({ query: listReviewsQuery }), controller.list);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: visibilityBody }),
  controller.setVisible
);

module.exports = router;
