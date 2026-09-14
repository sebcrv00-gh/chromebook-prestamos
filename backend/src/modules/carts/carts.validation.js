const { z } = require('zod');

const createCartSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del carro es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100)
    .trim(),
  description: z.string().max(255).optional(),
  totalChromebooks: z
    .number({ required_error: 'La cantidad total de Chromebooks es obligatoria' })
    .int()
    .positive('La cantidad debe ser un entero positivo'),
  location: z.string().max(100).optional(),
});

const updateCartSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(255).optional(),
  totalChromebooks: z.number().int().positive().optional(),
  location: z.string().max(100).optional(),
  active: z.boolean().optional(),
});

const transferChromebooksSchema = z.object({
  sourceCartId: z.string({ required_error: 'El carro de origen es obligatorio' }).uuid(),
  targetCartId: z.string({ required_error: 'El carro de destino es obligatorio' }).uuid(),
  cycleId: z.string({ required_error: 'El ciclo académico es obligatorio' }).uuid(),
  quantity: z
    .number({ required_error: 'La cantidad a transferir es obligatoria' })
    .int()
    .positive('La cantidad a transferir debe ser mayor a 0'),
  reason: z.string().optional(),
});

module.exports = { createCartSchema, updateCartSchema, transferChromebooksSchema };
