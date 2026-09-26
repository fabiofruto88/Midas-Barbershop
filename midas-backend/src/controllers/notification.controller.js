const notificationService = require('../services/notification.service');

const getPublicKey = (req, res) => {
  res.status(200).json({ publicKey: notificationService.getPublicKey() });
};

const subscribe = async (req, res) => {
  await notificationService.saveSubscription(req.user.id, req.validated.body);
  res.status(200).json({ message: 'Suscripción guardada.' });
};

const unsubscribe = async (req, res) => {
  await notificationService.removeSubscription(req.user.id);
  res.status(200).json({ message: 'Suscripción eliminada.' });
};

module.exports = { getPublicKey, subscribe, unsubscribe };
