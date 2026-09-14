const reservationsService = require('./reservations.service');
const ApiResponse = require('../../utils/apiResponse');

class ReservationsController {
  async createReservation(req, res, next) {
    try {
      const result = await reservationsService.createReservation(req.user.id, req.body);
      return ApiResponse.created(
        res,
        result,
        `Solicitud de reserva creada exitosamente. Stock libre restante: ${result.availableStock}`
      );
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode, error);
      next(error);
    }
  }

  async listReservations(req, res, next) {
    try {
      const result = await reservationsService.listReservations(req.user, req.query);
      return ApiResponse.paginated(res, result.reservations, result.pagination);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async getReservationById(req, res, next) {
    try {
      const reservation = await reservationsService.getReservationById(req.params.id, req.user);
      return ApiResponse.success(res, reservation);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async approveReservation(req, res, next) {
    try {
      const reservation = await reservationsService.approveReservation(
        req.params.id,
        req.user.id,
        req.body
      );
      return ApiResponse.success(res, reservation, `Reserva en estado ${reservation.status} exitosamente`);
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async rejectReservation(req, res, next) {
    try {
      const { rejectionReason } = req.body;
      const reservation = await reservationsService.rejectReservation(
        req.params.id,
        req.user.id,
        rejectionReason
      );
      return ApiResponse.success(res, reservation, 'Reserva rechazada exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async cancelReservation(req, res, next) {
    try {
      const reservation = await reservationsService.cancelReservation(req.params.id, req.user);
      return ApiResponse.success(res, reservation, 'Reserva cancelada exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }

  async returnReservation(req, res, next) {
    try {
      const reservation = await reservationsService.returnReservation(req.params.id, req.user.id);
      return ApiResponse.success(res, reservation, 'Reserva marcada como devuelta exitosamente');
    } catch (error) {
      if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new ReservationsController();
