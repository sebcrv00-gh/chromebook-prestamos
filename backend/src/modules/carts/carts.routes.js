const { Router } = require('express');
const cartsController = require('./carts.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validateBody } = require('../../middleware/validate');
const { createCartSchema, updateCartSchema, transferChromebooksSchema } = require('./carts.validation');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate);

// GET /api/carts - List active carts (All authenticated users can see available carts)
router.get('/', cartsController.listCarts);

// GET /api/carts/:id - Get cart details
router.get('/:id', cartsController.getCartById);

// POST /api/carts/transfer - Transfer Chromebooks between carts (Admin, Superadmin)
router.post(
  '/transfer',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(transferChromebooksSchema),
  cartsController.transferChromebooks
);

// POST /api/carts - Create new cart (Admin, Superadmin)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(createCartSchema),
  cartsController.createCart
);

// PUT /api/carts/:id - Update cart (Admin, Superadmin)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(updateCartSchema),
  cartsController.updateCart
);

// DELETE /api/carts/:id - Soft delete cart (Superadmin only)
router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN),
  cartsController.deleteCart
);

module.exports = router;
