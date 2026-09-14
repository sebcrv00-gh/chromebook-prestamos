const env = require('../../config/env');
const logger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.enabled = env.isEmailEnabled;
    if (!this.enabled) {
      logger.info('Servicio de correo desactivado (Credenciales SMTP no configuradas). Las notificaciones serán solo internas.');
    }
  }

  /**
   * Send notification email
   */
  async sendEmail(to, subject, htmlBody) {
    if (!this.enabled) {
      logger.debug(`[EMAIL OMITIDO - SMTP DESHABILITADO] Para: ${to} | Asunto: ${subject}`);
      return false;
    }

    try {
      // Lazy load nodemailer if enabled
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to,
        subject,
        html: htmlBody,
      });

      logger.info(`Correo enviado exitosamente a ${to}`);
      return true;
    } catch (error) {
      logger.error(`Error enviando correo a ${to}:`, error);
      return false;
    }
  }
}

module.exports = new EmailService();
