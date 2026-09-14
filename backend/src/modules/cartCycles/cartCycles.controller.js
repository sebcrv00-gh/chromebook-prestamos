const cartCyclesService = require('./cartCycles.service');
const ApiResponse = require('../../utils/apiResponse');

class CartCyclesController {
  async getAvailability(req, res, next) {
    try {
      const data = await cartCyclesService.getAvailability(req.params.id);
      return ApiResponse.success(res, data);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async updateAllocation(req, res, next) {
    try {
      const { allocatedQuantity } = req.body;
      const updated = await cartCyclesService.updateAllocation(req.params.id, allocatedQuantity);
      return ApiResponse.success(res, updated, 'Asignación actualizada exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async createOrUpdate(req, res, next) {
    try {
      const { cartId, cycleId, allocatedQuantity } = req.body;
      const result = await cartCyclesService.upsertCartCycle(cartId, cycleId, allocatedQuantity);
      return ApiResponse.success(res, result, 'Asignación de carro-ciclo guardada exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new CartCyclesController();
