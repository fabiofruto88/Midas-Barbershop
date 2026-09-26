const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { hashPassword } = require('./auth.service');
const { publicUserSelect } = require('./user.select');

const listUsers = ({ role }) =>
  prisma.user.findMany({
    where: role ? { role } : undefined,
    select: publicUserSelect,
    orderBy: { name: 'asc' },
  });

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
};

const ensureEmailAvailable = async (email, excludeId) => {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    throw new AppError('Ya existe una cuenta con ese email.', 409);
  }
};

const createUser = async ({ password, ...data }) => {
  await ensureEmailAvailable(data.email);
  return prisma.user.create({
    data: { ...data, passwordHash: await hashPassword(password) },
    select: publicUserSelect,
  });
};

const updateUser = async (id, { password, ...data }, currentUserId) => {
  const user = await getUserById(id);

  if (data.email) await ensureEmailAvailable(data.email, id);

  const roleChanges = data.role && data.role !== user.role;
  if (roleChanges && id === currentUserId) {
    throw new AppError('No puedes cambiar tu propio rol.', 400);
  }

  const leavesBarberRole = roleChanges && user.role === 'BARBER';
  if (leavesBarberRole) {
    const pending = await prisma.appointment.count({ where: { barberId: id, status: 'PENDING' } });
    if (pending > 0) {
      throw new AppError('El barbero tiene citas pendientes; cancélalas o reasígnalas antes de cambiar su rol.', 409);
    }
  }

  if (password) data.passwordHash = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    // Si deja de ser barbero, su horario base ya no aplica.
    if (leavesBarberRole) await tx.barberAvailability.deleteMany({ where: { barberId: id } });
    return tx.user.update({ where: { id }, data, select: publicUserSelect });
  });
};

const deleteUser = async (id, currentUserId) => {
  if (id === currentUserId) throw new AppError('No puedes eliminar tu propia cuenta.', 400);
  await getUserById(id);

  const appointments = await prisma.appointment.count({
    where: { OR: [{ barberId: id }, { clientId: id }] },
  });
  if (appointments > 0) {
    throw new AppError('El usuario tiene citas registradas y no puede eliminarse.', 409);
  }

  await prisma.$transaction([
    prisma.barberAvailability.deleteMany({ where: { barberId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
};

// Listado público de barberos para el flujo de reserva: solo datos no sensibles.
const listBarbers = () =>
  prisma.user.findMany({
    where: { role: 'BARBER' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

const ensureBarber = async (id) => {
  const barber = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true } });
  if (!barber || barber.role !== 'BARBER') throw new AppError('Barbero no encontrado.', 404);
  return barber;
};

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser, listBarbers, ensureBarber };
