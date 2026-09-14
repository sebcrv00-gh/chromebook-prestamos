const cyclesService = require('./cycles.service');
const ApiResponse = require('../../utils/apiResponse');

class CyclesController {
  async listCycles(req, res, next) {
    try {
      const cycles = await cyclesService.listCycles();
      return ApiResponse.success(res, cycles);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getActiveCycle(req, res, next) {
    try {
      const cycle = await cyclesService.getActiveCycle();
      if (!cycle) {
        return ApiResponse.notFound(res, 'No hay ciclos académicos activos');
      }
      return ApiResponse.success(res, cycle);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getCycleById(req, res, next) {
    try {
      const cycle = await cyclesService.getCycleById(req.params.id);
      return ApiResponse.success(res, cycle);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async createCycle(req, res, next) {
    try {
      const cycle = await cyclesService.createCycle(req.body);
      return ApiResponse.created(res, cycle, 'Ciclo académico creado exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async updateCycle(req, res, next) {
    try {
      const cycle = await cyclesService.updateCycle(req.params.id, req.body);
      return ApiResponse.success(res, cycle, 'Ciclo académico actualizado exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async toggleActive(req, res, next) {
    try {
      const cycle = await cyclesService.toggleCycleActive(req.params.id);
      const msg = cycle.active ? 'Ciclo activado exitosamente' : 'Ciclo desactivado exitosamente';
      return ApiResponse.success(res, cycle, msg);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new CyclesController();
