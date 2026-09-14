const reportsService = require('./reports.service');
const ApiResponse = require('../../utils/apiResponse');

class ReportsController {
  async getDashboardSummary(req, res, next) {
    try {
      const summary = await reportsService.getDashboardSummary();
      return ApiResponse.success(res, summary);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getUsageReport(req, res, next) {
    try {
      const { cycleId } = req.query;
      const report = await reportsService.getUsageReport(cycleId);
      return ApiResponse.success(res, report);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await reportsService.getAuditLogs(page, limit);
      return ApiResponse.paginated(res, result.logs, result.pagination);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new ReportsController();
