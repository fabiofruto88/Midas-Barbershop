const { Router } = require('express');
const authRoutes = require('./auth.routes');
const serviceRoutes = require('./service.routes');
const userRoutes = require('./user.routes');
const barberRoutes = require('./barber.routes');
const appointmentRoutes = require('./appointment.routes');
const notificationRoutes = require('./notification.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/users', userRoutes);
router.use('/barbers', barberRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
