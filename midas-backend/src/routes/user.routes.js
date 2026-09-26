const { Router } = require('express');
const controller = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { idParam } = require('../utils/validators');
const { createUserBody, updateUserBody, listUsersQuery } = require('../schemas/user.schema');

const router = Router();

// Toda la gestión de usuarios es exclusiva del Admin.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate({ query: listUsersQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/', validate({ body: createUserBody }), controller.create);
router.patch('/:id', validate({ params: idParam, body: updateUserBody }), controller.update);
router.delete('/:id', validate({ params: idParam }), controller.remove);

module.exports = router;
