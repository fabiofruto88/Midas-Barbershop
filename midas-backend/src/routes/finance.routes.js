const { Router } = require('express');
const controller = require('../controllers/finance.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { summaryQuery } = require('../schemas/finance.schema');

const router = Router();

// Resumen de lo generado: el barbero ve lo suyo; el admin puede filtrar por barbero.
router.get('/summary', authenticate, authorize('BARBER', 'ADMIN'), validate({ query: summaryQuery }), controller.summary);

module.exports = router;
