const { z } = require('zod');

const createUserSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Correo electrónico inválido')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  lastName: z
    .string({ required_error: 'El apellido es obligatorio' })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres')
    .trim(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'DOCENTE', 'ESTUDIANTE'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: SUPERADMIN, ADMIN, DOCENTE o ESTUDIANTE' }),
  }),
});

const updateUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido').trim().toLowerCase().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100)
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100)
    .trim()
    .optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'DOCENTE', 'ESTUDIANTE']).optional(),
});

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'DOCENTE', 'ESTUDIANTE']).optional(),
  search: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

module.exports = { createUserSchema, updateUserSchema, listUsersQuerySchema };
