const authService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');
const logger = require('../../utils/logger');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      logger.info(`Login exitoso: ${email}`);
      return ApiResponse.success(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      // The schema already validates that role is either DOCENTE or ESTUDIANTE
      const userData = req.body;
      const result = await authService.register(userData);
      
      logger.info(`Registro exitoso: ${userData.email} como ${userData.role}`);
      return ApiResponse.created(res, result, 'Usuario registrado exitosamente');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Token de refresco requerido');
      }

      const result = await authService.refreshToken(refreshToken);
      return ApiResponse.success(res, result, 'Token renovado exitosamente');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return ApiResponse.success(res, user);
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async logout(req, res) {
    // With JWT we just acknowledge the logout — client removes token
    logger.info(`Logout: ${req.user.email}`);
    return ApiResponse.success(res, null, 'Sesión cerrada exitosamente');
  }
}

module.exports = new AuthController();
