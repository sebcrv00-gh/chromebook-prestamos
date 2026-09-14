const { z } = require('zod');

const updateAllocationSchema = z.object({
  allocatedQuantity: z
    .number({ required_error: 'La cantidad asignada es obligatoria' })
    .int()
    .min(0, 'La cantidad asignada no puede ser negativa'),
});

const createCartCycleSchema = z.object({
  cartId: z.string({ required_error: 'El ID del carro es obligatorio' }).uuid(),
  cycleId: z.string({ required_error: 'El ID del ciclo es obligatorio' }).uuid(),
  allocatedQuantity: z
    .number({ required_error: 'La cantidad asignada es obligatoria' })
    .int()
    .min(0),
});

module.exports = { updateAllocationSchema, createCartCycleSchema };
