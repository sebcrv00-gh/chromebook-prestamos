const { Router } = require('express');
const cartCyclesController = require('./cartCycles.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validateBody } = require('../../middleware/validate');
const { updateAllocationSchema, createCartCycleSchema } = require('./cartCycles.validation');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate);

// GET /api/cart-cycles/:id/availability - Real-time availability
router.get('/:id/availability', cartCyclesController.getAvailability);

// POST /api/cart-cycles - Create or update cart-cycle allocation (Admin, Superadmin)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(createCartCycleSchema),
  cartCyclesController.createOrUpdate
);

// PUT /api/cart-cycles/:id - Update allocation quantity (Admin, Superadmin)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(updateAllocationSchema),
  cartCyclesController.updateAllocation
);

module.exports = router;
