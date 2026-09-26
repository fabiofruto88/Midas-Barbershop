const { Router } = require('express');
const controller = require('../controllers/shop.controller');
const validate = require('../middlewares/validate');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/uploadImage');
const { idParam } = require('../utils/validators');
const {
  createCategoryBody,
  updateCategoryBody,
  createProductBody,
  updateProductBody,
  listProductsQuery,
} = require('../schemas/shop.schema');

const router = Router();
const admin = [authenticate, authorize('ADMIN')];

// Catálogo público: no hace falta sesión (la compra se cierra por WhatsApp).
router.get('/categories', optionalAuth, controller.listCategories);
router.get('/products', optionalAuth, validate({ query: listProductsQuery }), controller.listProducts);
router.get('/products/:id', optionalAuth, validate({ params: idParam }), controller.getProduct);

// Gestión: solo Admin.
router.post('/categories', ...admin, validate({ body: createCategoryBody }), controller.createCategory);
router.patch('/categories/:id', ...admin, validate({ params: idParam, body: updateCategoryBody }), controller.updateCategory);
router.delete('/categories/:id', ...admin, validate({ params: idParam }), controller.removeCategory);

router.post('/products', ...admin, validate({ body: createProductBody }), controller.createProduct);
router.patch('/products/:id', ...admin, validate({ params: idParam, body: updateProductBody }), controller.updateProduct);
router.delete('/products/:id', ...admin, validate({ params: idParam }), controller.removeProduct);

// Foto del producto (multipart/form-data, campo "image").
router.post('/products/:id/image', ...admin, validate({ params: idParam }), uploadImage('image'), controller.uploadImage);
router.delete('/products/:id/image', ...admin, validate({ params: idParam }), controller.removeImage);

module.exports = router;
