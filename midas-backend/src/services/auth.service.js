const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { publicUserSelect } = require('./user.select');

const SALT_ROUNDS = 12;
// Hash señuelo: se compara aunque el email no exista para no revelar qué cuentas existen por tiempo de respuesta.
const DUMMY_HASH = bcrypt.hashSync('midas-dummy-password', SALT_ROUNDS);

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const register = async ({ name, email, password, phone }) => {
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) throw new AppError('Ya existe una cuenta con ese email.', 409);

  return prisma.user.create({
    data: { name, email, phone, passwordHash: await hashPassword(password), role: 'CLIENT' },
    select: publicUserSelect,
  });
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !valid) {
    throw new AppError('Email o contraseña incorrectos.', 401);
  }

  const { passwordHash, pushSubscription, ...publicUser } = user;
  return publicUser;
};

const getCurrentUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!user) throw new AppError('La cuenta ya no existe.', 401);
  return user;
};

module.exports = { register, login, getCurrentUser, hashPassword };
