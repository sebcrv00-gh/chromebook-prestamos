const cartsService = require('./carts.service');
const ApiResponse = require('../../utils/apiResponse');

class CartsController {
  async listCarts(req, res, next) {
    try {
      const { cycleId } = req.query;
      const carts = await cartsService.listCarts(cycleId);
      return ApiResponse.success(res, carts);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getCartById(req, res, next) {
    try {
      const { cycleId } = req.query;
      const cart = await cartsService.getCartById(req.params.id, cycleId);
      return ApiResponse.success(res, cart);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async createCart(req, res, next) {
    try {
      const cart = await cartsService.createCart(req.body);
      return ApiResponse.created(res, cart, 'Carro creado exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async updateCart(req, res, next) {
    try {
      const cart = await cartsService.updateCart(req.params.id, req.body);
      return ApiResponse.success(res, cart, 'Carro actualizado exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async deleteCart(req, res, next) {
    try {
      const result = await cartsService.deleteCart(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async transferChromebooks(req, res, next) {
    try {
      const result = await cartsService.transferAvailability(req.body, req.user.id);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new CartsController();
