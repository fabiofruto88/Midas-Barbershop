const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { subscribeBody } = require('../schemas/notification.schema');

const router = Router();

router.get('/vapid-public-key', controller.getPublicKey);
router.post('/subscribe', authenticate, validate({ body: subscribeBody }), controller.subscribe);
router.delete('/subscribe', authenticate, controller.unsubscribe);

module.exports = router;
