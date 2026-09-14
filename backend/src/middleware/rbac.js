const ApiResponse = require('../utils/apiResponse');
const { ROLE_HIERARCHY } = require('../utils/constants');

/**
 * Middleware to check if user has one of the allowed roles
 * @param  {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Debes iniciar sesión');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `No tienes permisos para realizar esta acción. Rol requerido: ${allowedRoles.join(' o ')}`
      );
    }

    next();
  };
};

/**
 * Middleware to check if user has at least a minimum role level
 * @param {string} minimumRole - Minimum role required
 */
const authorizeMinLevel = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Debes iniciar sesión');
    }

    const userLevel = ROLE_HIERARCHY.indexOf(req.user.role);
    const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);

    if (userLevel < requiredLevel) {
      return ApiResponse.forbidden(res, 'No tienes suficientes permisos para esta acción');
    }

    next();
  };
};

module.exports = { authorize, authorizeMinLevel };
