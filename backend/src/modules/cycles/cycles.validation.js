const { z } = require('zod');

const createCycleSchema = z
  .object({
    name: z
      .string({ required_error: 'El nombre del ciclo es obligatorio' })
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100)
      .trim(),
    type: z.enum(['EXPLORATORIO', 'CONCEPTUAL', 'CONTEXTUAL', 'PROYECTIVO'], {
      errorMap: () => ({
        message: 'Tipo de ciclo inválido. Debe ser: EXPLORATORIO, CONCEPTUAL, CONTEXTUAL o PROYECTIVO',
      }),
    }),
    gradeRange: z
      .string({ required_error: 'El rango de grados es obligatorio' })
      .min(1, 'El rango de grados es obligatorio')
      .max(100)
      .trim(),
    description: z.string().max(500).trim().optional(),
    year: z
      .number({ required_error: 'El año es obligatorio' })
      .int()
      .min(2020)
      .max(2100),
    active: z.boolean().optional(),
    cartCycles: z
      .array(
        z.object({
          cartId: z.string().min(1, 'ID de carro inválido'),
          allocatedQuantity: z.coerce
            .number({ required_error: 'Cantidad asignada inválida' })
            .int()
            .min(0, 'La cantidad asignada no puede ser negativa'),
          customName: z.string().trim().max(100).optional().nullable(),
        })
      )
      .optional(),
  })
  .strict();

const updateCycleSchema = z.object({
  name: z.string().min(3).max(100).trim().optional(),
  type: z.enum(['EXPLORATORIO', 'CONCEPTUAL', 'CONTEXTUAL', 'PROYECTIVO']).optional(),
  gradeRange: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  year: z.number().int().min(2020).max(2100).optional(),
  active: z.boolean().optional(),
  cartCycles: z
    .array(
      z.object({
        cartId: z.string().min(1),
        allocatedQuantity: z.coerce.number().int().min(0),
        customName: z.string().trim().max(100).optional().nullable(),
      })
    )
    .optional(),
});

const assignCartToCycleSchema = z.object({
  cartId: z.string({ required_error: 'ID de carro obligatorio' }).min(1),
  allocatedQuantity: z.coerce.number({ required_error: 'Cantidad obligatoria' }).int().min(1, 'La cantidad debe ser mayor a 0'),
  customName: z.string().trim().max(100).optional().nullable(),
});

const updateCartCycleSchema = z.object({
  allocatedQuantity: z.coerce.number().int().min(0).optional(),
  customName: z.string().trim().max(100).optional().nullable(),
});

module.exports = {
  createCycleSchema,
  updateCycleSchema,
  assignCartToCycleSchema,
  updateCartCycleSchema,
};
