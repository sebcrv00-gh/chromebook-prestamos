const { z } = require('zod');

const createReservationSchema = z.object({
  cartCycleId: z.string({ required_error: 'Debe seleccionar un carro y ciclo' }).uuid(),
  quantityRequested: z
    .number({ required_error: 'La cantidad solicitada es obligatoria' })
    .int()
    .positive('La cantidad debe ser mayor a 0'),
  purpose: z
    .string({ required_error: 'El motivo / clase es obligatorio' })
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(255)
    .trim(),
  reservationDate: z
    .string({ required_error: 'La fecha de la reserva es obligatoria' })
    .datetime({ offset: true }),
  startTime: z
    .string({ required_error: 'La hora de inicio es obligatoria' })
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  endTime: z
    .string({ required_error: 'La hora de fin es obligatoria' })
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  notes: z.string().max(500).optional(),
});

const approveReservationSchema = z.object({
  quantityApproved: z.number().int().positive().optional(), // if empty, approves full requested
  notes: z.string().optional(),
});

const rejectReservationSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'El motivo de rechazo es obligatorio' })
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .trim(),
});

const listReservationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['PENDIENTE', 'APROBADA', 'PARCIAL', 'RECHAZADA', 'CANCELADA', 'DEVUELTA']).optional(),
  cartId: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  date: z.string().optional(),
});

module.exports = {
  createReservationSchema,
  approveReservationSchema,
  rejectReservationSchema,
  listReservationsQuerySchema,
};
