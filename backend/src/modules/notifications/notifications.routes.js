const { Router } = require('express');
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth');

const router = Router();

router.use(authenticate);

// GET /api/notifications - User's notifications
router.get('/', notificationsController.getNotifications);

// PATCH /api/notifications/read-all - Mark all read
router.patch('/read-all', notificationsController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark one read
router.patch('/:id/read', notificationsController.markAsRead);

module.exports = router;
