const { Router } = require('express');
const cyclesController = require('./cycles.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validateBody } = require('../../middleware/validate');
const {
  createCycleSchema,
  updateCycleSchema,
  assignCartToCycleSchema,
  updateCartCycleSchema,
} = require('./cycles.validation');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate);

// GET /api/cycles - List cycles
router.get('/', cyclesController.listCycles);

// GET /api/cycles/active - Get currently active cycle
router.get('/active', cyclesController.getActiveCycle);

// GET /api/cycles/:id - Get cycle details
router.get('/:id', cyclesController.getCycleById);

// POST /api/cycles - Create cycle (Admin, Superadmin)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(createCycleSchema),
  cyclesController.createCycle
);

// PUT /api/cycles/:id - Update cycle (Admin, Superadmin)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(updateCycleSchema),
  cyclesController.updateCycle
);

// PATCH /api/cycles/:id/toggle-active - Toggle cycle active status (Admin, Superadmin)
router.patch(
  '/:id/toggle-active',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  cyclesController.toggleActive
);

// POST /api/cycles/:id/carts - Assign a cart to cycle (Admin, Superadmin)
router.post(
  '/:id/carts',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(assignCartToCycleSchema),
  cyclesController.assignCart
);

// PATCH /api/cycles/:id/carts/:cartCycleId - Edit cart in cycle (Admin, Superadmin)
router.patch(
  '/:id/carts/:cartCycleId',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(updateCartCycleSchema),
  cyclesController.updateCart
);

// DELETE /api/cycles/:id/carts/:cartCycleId - Remove cart from cycle (Admin, Superadmin)
router.delete(
  '/:id/carts/:cartCycleId',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  cyclesController.removeCart
);

module.exports = router;
