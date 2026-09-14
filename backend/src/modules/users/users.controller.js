const usersService = require('./users.service');
const ApiResponse = require('../../utils/apiResponse');

class UsersController {
  async listUsers(req, res, next) {
    try {
      const result = await usersService.listUsers(req.query);
      return ApiResponse.paginated(res, result.users, result.pagination);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await usersService.getUserById(req.params.id);
      return ApiResponse.success(res, user);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await usersService.createUser(req.body, req.user.role);
      return ApiResponse.created(res, user, 'Usuario creado exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await usersService.updateUser(req.params.id, req.body, req.user.role);
      return ApiResponse.success(res, user, 'Usuario actualizado exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async toggleActive(req, res, next) {
    try {
      const user = await usersService.toggleUserActive(req.params.id, req.user.role);
      const statusText = user.active ? 'activado' : 'desactivado';
      return ApiResponse.success(res, user, `Usuario ${statusText} exitosamente`);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new UsersController();
