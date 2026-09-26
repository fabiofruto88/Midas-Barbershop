const shopService = require('../services/shop.service');

const isAdmin = (req) => req.user?.role === 'ADMIN';

// ---------- Categorías ----------
const listCategories = async (req, res) => {
  res.status(200).json(await shopService.listCategories({ includeHidden: isAdmin(req) }));
};

const createCategory = async (req, res) => {
  res.status(201).json(await shopService.createCategory(req.validated.body));
};

const updateCategory = async (req, res) => {
  res.status(200).json(await shopService.updateCategory(req.validated.params.id, req.validated.body));
};

const removeCategory = async (req, res) => {
  await shopService.deleteCategory(req.validated.params.id);
  res.status(200).json({ message: 'Categoría eliminada.' });
};

// ---------- Productos ----------
const listProducts = async (req, res) => {
  // Solo un admin puede ver productos ocultos.
  const { categoryId, includeHidden } = req.validated.query;
  res.status(200).json(await shopService.listProducts({ categoryId, includeHidden: isAdmin(req) && includeHidden }));
};

const getProduct = async (req, res) => {
  res.status(200).json(await shopService.getProduct(req.validated.params.id, { includeHidden: isAdmin(req) }));
};

const createProduct = async (req, res) => {
  res.status(201).json(await shopService.createProduct(req.validated.body));
};

const updateProduct = async (req, res) => {
  res.status(200).json(await shopService.updateProduct(req.validated.params.id, req.validated.body));
};

const removeProduct = async (req, res) => {
  await shopService.deleteProduct(req.validated.params.id);
  res.status(200).json({ message: 'Producto eliminado.' });
};

const uploadImage = async (req, res) => {
  res.status(200).json(await shopService.setProductImage(req.validated.params.id, req.file.buffer));
};

const removeImage = async (req, res) => {
  res.status(200).json(await shopService.removeProductImage(req.validated.params.id));
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  removeCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  removeProduct,
  uploadImage,
  removeImage,
};
