const prisma = require('../../config/database');
const emailService = require('./email.service');

class NotificationsService {
  /**
   * Create internal notification for a user and trigger email if enabled
   */
  async createNotification(data) {
    const { userId, reservationId, type, title, message } = data;

    const notification = await prisma.notification.create({
      data: {
        userId,
        reservationId,
        type,
        title,
        message,
      },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    // Send email asynchronously if available
    if (notification.user?.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #DC2626;">Corporación San Bonifacio de las Lanzas</h2>
          <h3>${title}</h3>
          <p>Hola ${notification.user.firstName},</p>
          <p>${message}</p>
          <hr style="border: 1px solid #eee;" />
          <p style="font-size: 12px; color: #777;">Sistema de Gestión de Préstamos de Chromebooks</p>
        </div>
      `;
      emailService.sendEmail(notification.user.email, title, emailHtml).catch(() => {});
    }

    return notification;
  }

  /**
   * Send stock alerts to all Admins and Superadmins
   */
  async notifyStockAlert(cartCycleId, type, title, message) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, active: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.id,
        type,
        title,
        message,
      });
    }
  }

  /**
   * Get list of notifications for a user
   */
  async getUserNotifications(userId, limit = 20) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return { notifications, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw { statusCode: 404, message: 'Notificación no encontrada' };
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'Todas las notificaciones marcadas como leídas' };
  }
}

module.exports = new NotificationsService();
