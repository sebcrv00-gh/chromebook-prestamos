/**
 * Standardized API response format
 */
class ApiResponse {
  /**
   * Success response
   */
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response (201)
   */
  static created(res, data = null, message = 'Recurso creado exitosamente') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Error response
   */
  static error(res, message = 'Error interno del servidor', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Bad Request (400)
   */
  static badRequest(res, message = 'Solicitud inválida', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(res, message = 'No autorizado') {
    return ApiResponse.error(res, message, 401);
  }

  /**
   * Forbidden (403)
   */
  static forbidden(res, message = 'No tienes permisos para realizar esta acción') {
    return ApiResponse.error(res, message, 403);
  }

  /**
   * Not Found (404)
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return ApiResponse.error(res, message, 404);
  }

  /**
   * Conflict (409)
   */
  static conflict(res, message = 'Conflicto con el estado actual del recurso') {
    return ApiResponse.error(res, message, 409);
  }

  /**
   * Paginated response
   */
  static paginated(res, data, pagination, message = 'Consulta exitosa') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    });
  }
}

module.exports = ApiResponse;
