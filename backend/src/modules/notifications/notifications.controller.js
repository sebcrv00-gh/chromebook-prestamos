const notificationsService = require('./notifications.service');
const ApiResponse = require('../../utils/apiResponse');

class NotificationsController {
  async getNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const data = await notificationsService.getUserNotifications(req.user.id, limit);
      return ApiResponse.success(res, data);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationsService.markAsRead(req.params.id, req.user.id);
      return ApiResponse.success(res, updated, 'Notificación marcada como leída');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new NotificationsController();
