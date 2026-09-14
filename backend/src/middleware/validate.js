const { ZodError } = require('zod');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to validate request body using a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return ApiResponse.badRequest(res, 'Error de validación', errors);
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate query parameters using a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return ApiResponse.badRequest(res, 'Parámetros de consulta inválidos', errors);
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate route parameters using a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return ApiResponse.badRequest(res, 'Parámetros de ruta inválidos', errors);
      }
      next(error);
    }
  };
};

module.exports = { validateBody, validateQuery, validateParams };
