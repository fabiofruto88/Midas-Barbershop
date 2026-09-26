const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');
const { registerBody, loginBody } = require('../schemas/auth.schema');

const router = Router();

router.post('/register', registerLimiter, validate({ body: registerBody }), controller.register);
router.post('/login', loginLimiter, validate({ body: loginBody }), controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;
