const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return ApiResponse.conflict(res, `Ya existe un registro con ese ${field}`);
  }

  if (err.code === 'P2025') {
    return ApiResponse.notFound(res, 'El registro solicitado no existe');
  }

  if (err.code === 'P2003') {
    return ApiResponse.badRequest(res, 'Referencia a un registro que no existe');
  }

  // JWT errors (catch-all)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token inválido o expirado');
  }

  // Syntax errors (malformed JSON)
  if (err.type === 'entity.parse.failed') {
    return ApiResponse.badRequest(res, 'JSON inválido en el cuerpo de la solicitud');
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = { errorHandler };
