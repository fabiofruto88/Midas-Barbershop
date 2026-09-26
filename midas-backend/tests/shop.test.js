const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { app, prisma, request, loginAdmin, createUserWithRole, cleanup } = require('./helpers');
const storage = require('../src/services/storage.service');

// PNG real de 1x1 píxel.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const realUpload = storage.uploadImage;
const realDelete = storage.deleteImageByUrl;
let uploads;
let deletions;

let admin;
let barber;
let client;
let n = 0;
const label = (base) => `TEST ${base} ${Date.now()}-${(n += 1)}`;

const createCategory = async (name = label('Categoría')) => {
  const res = await admin.post('/api/v1/shop/categories').send({ name });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

const createProduct = async (categoryId, extra = {}) => {
  const res = await admin
    .post('/api/v1/shop/products')
    .send({ categoryId, name: label('Producto'), price: 35000, ...extra });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

before(async () => {
  await cleanup();
  admin = await loginAdmin();
  barber = (await createUserWithRole(admin, 'BARBER', 'tienda')).client;
  client = (await createUserWithRole(admin, 'CLIENT', 'tienda-cliente')).client;
});

beforeEach(() => {
  uploads = [];
  deletions = [];
  storage.uploadImage = async (buffer, options) => {
    uploads.push(options?.folder);
    return { url: `https://res.cloudinary.com/demo/image/upload/v1/midas/products/test-${uploads.length}.png` };
  };
  storage.deleteImageByUrl = async (url) => deletions.push(url);
});

after(async () => {
  storage.uploadImage = realUpload;
  storage.deleteImageByUrl = realDelete;
  await cleanup();
  await prisma.$disconnect();
});

describe('Tienda: categorías', () => {
  test('el admin crea, renombra y lista categorías (públicas, sin sesión)', async () => {
    const category = await createCategory();
    const renamed = label('Renombrada');
    const res = await admin.patch(`/api/v1/shop/categories/${category.id}`).send({ name: renamed, sortOrder: 5 });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, renamed);
    await createProduct(category.id);

    const pub = await request(app).get('/api/v1/shop/categories');
    assert.equal(pub.status, 200);
    assert.ok(pub.body.some((item) => item.id === category.id && item.sortOrder === 5));
  });

  test('el público no ve categorías sin productos visibles ni cuenta los ocultos; el admin sí', async () => {
    const empty = await createCategory();
    const mixed = await createCategory();
    await createProduct(mixed.id);
    await createProduct(mixed.id, { isVisible: false });

    const pub = (await request(app).get('/api/v1/shop/categories')).body;
    assert.ok(!pub.some((item) => item.id === empty.id));
    assert.equal(pub.find((item) => item.id === mixed.id)._count.products, 1);

    const all = (await admin.get('/api/v1/shop/categories')).body;
    assert.ok(all.some((item) => item.id === empty.id));
    assert.equal(all.find((item) => item.id === mixed.id)._count.products, 2);
  });

  test('sortOrder rechaza null y valores no numéricos', async () => {
    const category = await createCategory();
    for (const sortOrder of [null, '', true, 'abc']) {
      const res = await admin.patch(`/api/v1/shop/categories/${category.id}`).send({ sortOrder });
      assert.equal(res.status, 400, `sortOrder=${JSON.stringify(sortOrder)}`);
    }
  });

  test('no permite nombres repetidos sin distinguir mayúsculas', async () => {
    const category = await createCategory();
    const res = await admin.post('/api/v1/shop/categories').send({ name: category.name.toUpperCase() });
    assert.equal(res.status, 409);
  });

  test('no borra una categoría con productos, sí una vacía', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    const blocked = await admin.delete(`/api/v1/shop/categories/${category.id}`);
    assert.equal(blocked.status, 409);
    assert.match(blocked.body.error, /1 producto/);

    await admin.delete(`/api/v1/shop/products/${product.id}`);
    const ok = await admin.delete(`/api/v1/shop/categories/${category.id}`);
    assert.equal(ok.status, 200);
  });
});

describe('Tienda: productos', () => {
  test('el público ve solo los visibles; los destacados salen primero', async () => {
    const category = await createCategory();
    const normal = await createProduct(category.id, { name: 'TEST A normal' });
    const featured = await createProduct(category.id, { name: 'TEST Z destacado', isFeatured: true });
    const hidden = await createProduct(category.id, { isVisible: false });
    const soldOut = await createProduct(category.id, { isAvailable: false });

    const res = await request(app).get(`/api/v1/shop/products?categoryId=${category.id}`);
    assert.equal(res.status, 200);
    const ids = res.body.map((product) => product.id);
    assert.equal(ids[0], featured.id);
    assert.ok(ids.includes(normal.id));
    assert.ok(ids.includes(soldOut.id)); // agotado: se muestra, pero marcado
    assert.ok(!ids.includes(hidden.id));
    assert.equal(res.body[0].category.name, category.name);

    // includeHidden solo funciona para el admin.
    const guest = await request(app).get(`/api/v1/shop/products?categoryId=${category.id}&includeHidden=true`);
    assert.ok(!guest.body.some((product) => product.id === hidden.id));
    const asAdmin = await admin.get(`/api/v1/shop/products?categoryId=${category.id}&includeHidden=true`);
    assert.ok(asAdmin.body.some((product) => product.id === hidden.id));

    assert.equal((await request(app).get(`/api/v1/shop/products/${hidden.id}`)).status, 404);
    assert.equal((await admin.get(`/api/v1/shop/products/${hidden.id}`)).status, 200);
  });

  test('el admin edita y cambia de categoría un producto', async () => {
    const category = await createCategory();
    const other = await createCategory();
    const product = await createProduct(category.id);

    const res = await admin
      .patch(`/api/v1/shop/products/${product.id}`)
      .send({ categoryId: other.id, price: 42000.5, description: 'Fijación fuerte', isAvailable: false });
    assert.equal(res.status, 200);
    assert.equal(res.body.category.id, other.id);
    assert.equal(Number(res.body.price), 42000.5);
    assert.equal(res.body.isAvailable, false);

    const cleared = await admin.patch(`/api/v1/shop/products/${product.id}`).send({ description: null });
    assert.equal(cleared.body.description, null);
  });

  test('valida precio, categoría existente y campos desconocidos', async () => {
    const category = await createCategory();
    const base = { categoryId: category.id, name: 'TEST Validación' };

    assert.equal((await admin.post('/api/v1/shop/products').send({ ...base, price: 0 })).status, 400);
    assert.equal((await admin.post('/api/v1/shop/products').send({ ...base, price: 10.123 })).status, 400);
    assert.equal((await admin.post('/api/v1/shop/products').send({ ...base, price: 100, stock: 3 })).status, 400);
    assert.equal((await admin.patch(`/api/v1/shop/products/${(await createProduct(category.id)).id}`).send({})).status, 400);

    const missing = await admin
      .post('/api/v1/shop/products')
      .send({ ...base, price: 100, categoryId: '00000000-0000-4000-8000-000000000000' });
    assert.equal(missing.status, 400);
    assert.match(missing.body.error, /categoría no existe/);
  });

  test('solo el admin gestiona la tienda', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    for (const agent of [barber, client]) {
      assert.equal((await agent.post('/api/v1/shop/categories').send({ name: 'TEST No' })).status, 403);
      assert.equal((await agent.post('/api/v1/shop/products').send({ categoryId: category.id, name: 'TEST No', price: 1 })).status, 403);
      assert.equal((await agent.patch(`/api/v1/shop/products/${product.id}`).send({ price: 1 })).status, 403);
      assert.equal((await agent.delete(`/api/v1/shop/products/${product.id}`)).status, 403);
    }
    assert.equal((await request(app).delete(`/api/v1/shop/categories/${category.id}`)).status, 401);
  });
});

describe('Tienda: fotos', () => {
  test('sube, reemplaza y quita la foto; al borrar el producto se borra la foto', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    const first = await admin.post(`/api/v1/shop/products/${product.id}/image`).attach('image', PNG, 'foto.png');
    assert.equal(first.status, 200);
    assert.deepEqual(uploads, ['products']);
    assert.match(first.body.imageUrl, /test-1\.png$/);

    const second = await admin.post(`/api/v1/shop/products/${product.id}/image`).attach('image', PNG, 'foto.png');
    assert.match(second.body.imageUrl, /test-2\.png$/);
    assert.deepEqual(deletions, [first.body.imageUrl]);

    const removed = await admin.delete(`/api/v1/shop/products/${product.id}/image`);
    assert.equal(removed.body.imageUrl, null);
    assert.deepEqual(deletions, [first.body.imageUrl, second.body.imageUrl]);

    await admin.post(`/api/v1/shop/products/${product.id}/image`).attach('image', PNG, 'foto.png');
    await admin.delete(`/api/v1/shop/products/${product.id}`);
    assert.equal(deletions.length, 3);
    assert.equal(await prisma.product.count({ where: { id: product.id } }), 0);
  });

  test('rechaza archivos que no son imágenes aunque digan serlo', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);
    const res = await admin
      .post(`/api/v1/shop/products/${product.id}/image`)
      .attach('image', Buffer.from('no soy una imagen'), { filename: 'falsa.png', contentType: 'image/png' });
    assert.equal(res.status, 415);
    assert.equal(uploads.length, 0);
  });
});
