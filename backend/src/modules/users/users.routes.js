const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validateBody, validateQuery } = require('../../middleware/validate');
const { createUserSchema, updateUserSchema, listUsersQuerySchema } = require('./users.validation');
const { ROLES } = require('../../utils/constants');

const router = Router();

// Require authentication for all user management routes
router.use(authenticate);

// GET /api/users - List users (Admin, Superadmin)
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateQuery(listUsersQuerySchema),
  usersController.listUsers
);

// GET /api/users/:id - View user detail (Admin, Superadmin)
router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  usersController.getUserById
);

// POST /api/users - Create user (Admin, Superadmin)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(createUserSchema),
  usersController.createUser
);

// PUT /api/users/:id - Edit user (Admin, Superadmin)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(updateUserSchema),
  usersController.updateUser
);

// PATCH /api/users/:id/toggle-active - Enable/Disable user (Admin, Superadmin)
router.patch(
  '/:id/toggle-active',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  usersController.toggleActive
);

module.exports = router;
