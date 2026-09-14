const { Router } = require('express');
const reservationsController = require('./reservations.controller');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/rbac');
const { validateBody, validateQuery } = require('../../middleware/validate');
const {
  createReservationSchema,
  approveReservationSchema,
  rejectReservationSchema,
  listReservationsQuerySchema,
} = require('./reservations.validation');
const { ROLES } = require('../../utils/constants');

const router = Router();

router.use(authenticate);

// GET /api/reservations - List reservations (filtered by role internally)
router.get('/', validateQuery(listReservationsQuerySchema), reservationsController.listReservations);

// GET /api/reservations/:id - Get reservation details
router.get('/:id', reservationsController.getReservationById);

// POST /api/reservations - Create reservation request (Docente, Estudiante, Admin, Superadmin)
router.post('/', validateBody(createReservationSchema), reservationsController.createReservation);

// PATCH /api/reservations/:id/approve - Approve (Full/Partial) (Admin, Superadmin)
router.patch(
  '/:id/approve',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(approveReservationSchema),
  reservationsController.approveReservation
);

// PATCH /api/reservations/:id/reject - Reject (Admin, Superadmin)
router.patch(
  '/:id/reject',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateBody(rejectReservationSchema),
  reservationsController.rejectReservation
);

// PATCH /api/reservations/:id/cancel - Cancel reservation (Owner or Admin)
router.patch('/:id/cancel', reservationsController.cancelReservation);

// PATCH /api/reservations/:id/return - Mark as returned (Admin, Superadmin)
router.patch(
  '/:id/return',
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  reservationsController.returnReservation
);

module.exports = router;
