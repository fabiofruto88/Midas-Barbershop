const webpush = require('web-push');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const isConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
const ensureConfigured = () => {
  if (!isConfigured()) throw new AppError('Las notificaciones push no están configuradas (VAPID).', 503);
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@midas.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    configured = true;
  }
};

const getPublicKey = () => {
  ensureConfigured();
  return process.env.VAPID_PUBLIC_KEY;
};

// POST /notifications/subscribe: guarda el PushSubscription del navegador en User.pushSubscription.
const saveSubscription = async (userId, subscription) => {
  ensureConfigured();
  await prisma.user.update({ where: { id: userId }, data: { pushSubscription: subscription } });
};

const removeSubscription = (userId) =>
  prisma.user.update({ where: { id: userId }, data: { pushSubscription: null } });

// Envía una notificación. Devuelve false si no se pudo; limpia suscripciones caducadas (404/410).
const sendToUser = async (user, payload) => {
  if (!user?.pushSubscription || !isConfigured()) return false;
  ensureConfigured();
  try {
    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload), { TTL: 15 * 60 });
    return true;
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await prisma.user.update({ where: { id: user.id }, data: { pushSubscription: null } });
    } else {
      console.error(`Push fallido para el usuario ${user.id}:`, error.message);
    }
    return false;
  }
};

module.exports = { isConfigured, getPublicKey, saveSubscription, removeSubscription, sendToUser };
