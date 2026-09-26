const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const storage = require('./storage.service');

// ---------- Categorías ----------
// El público solo cuenta (y ve) categorías con productos visibles; el admin las ve todas.
const listCategories = async ({ includeHidden = false } = {}) => {
  const categories = await prisma.productCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: includeHidden ? true : { where: { isVisible: true } } } } },
  });
  return includeHidden ? categories : categories.filter((category) => category._count.products > 0);
};

const getCategory = async (id) => {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new AppError('Categoría no encontrada.', 404);
  return category;
};

// El nombre es único sin distinguir mayúsculas ("Barbería" y "barbería" serían la misma).
const ensureUniqueName = async (name, exceptId) => {
  const taken = await prisma.productCategory.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, NOT: exceptId ? { id: exceptId } : undefined },
    select: { id: true },
  });
  if (taken) throw new AppError('Ya existe una categoría con ese nombre.', 409);
};

const createCategory = async (data) => {
  await ensureUniqueName(data.name);
  return prisma.productCategory.create({ data });
};

const updateCategory = async (id, data) => {
  await getCategory(id);
  if (data.name) await ensureUniqueName(data.name, id);
  return prisma.productCategory.update({ where: { id }, data });
};

// No se borra una categoría con productos: habría que dejarlos huérfanos.
const deleteCategory = async (id) => {
  await getCategory(id);
  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) {
    throw new AppError(
      `La categoría tiene ${products} producto(s). Muévelos a otra categoría o elimínalos antes de borrarla.`,
      409
    );
  }
  await prisma.productCategory.delete({ where: { id } });
};

// ---------- Productos ----------
const productInclude = { category: { select: { id: true, name: true } } };

const listProducts = ({ categoryId, includeHidden }) =>
  prisma.product.findMany({
    where: { categoryId, ...(includeHidden ? {} : { isVisible: true }) },
    include: productInclude,
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  });

const getProduct = async (id, { includeHidden }) => {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product || (!product.isVisible && !includeHidden)) throw new AppError('Producto no encontrado.', 404);
  return product;
};

const ensureCategoryExists = async (categoryId) => {
  const exists = await prisma.productCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!exists) throw new AppError('La categoría no existe.', 400);
};

const createProduct = async (data) => {
  await ensureCategoryExists(data.categoryId);
  return prisma.product.create({ data, include: productInclude });
};

const updateProduct = async (id, data) => {
  await getProduct(id, { includeHidden: true });
  if (data.categoryId) await ensureCategoryExists(data.categoryId);
  return prisma.product.update({ where: { id }, data, include: productInclude });
};

// Borrado real: no hay pedidos guardados que lo referencien. La foto se borra "best effort".
const deleteProduct = async (id) => {
  const product = await getProduct(id, { includeHidden: true });
  await prisma.product.delete({ where: { id } });
  if (product.imageUrl) await storage.deleteImageByUrl(product.imageUrl);
};

// POST /shop/products/:id/image: sube la nueva foto y borra la anterior.
const setProductImage = async (id, buffer) => {
  const product = await getProduct(id, { includeHidden: true });
  const uploaded = await storage.uploadImage(buffer, { folder: 'products' });
  let updated;
  try {
    updated = await prisma.product.update({ where: { id }, data: { imageUrl: uploaded.url }, include: productInclude });
  } catch (error) {
    await storage.deleteImageByUrl(uploaded.url);
    throw error;
  }
  if (product.imageUrl) await storage.deleteImageByUrl(product.imageUrl);
  return updated;
};

const removeProductImage = async (id) => {
  const product = await getProduct(id, { includeHidden: true });
  if (!product.imageUrl) return product;
  const updated = await prisma.product.update({ where: { id }, data: { imageUrl: null }, include: productInclude });
  await storage.deleteImageByUrl(product.imageUrl);
  return updated;
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductImage,
  removeProductImage,
};
