const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Correo electrónico inválido')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Correo electrónico inválido')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'Nombre muy corto'),
  lastName: z.string({ required_error: 'El apellido es obligatorio' }).min(2, 'Apellido muy corto'),
  role: z.enum(['DOCENTE', 'ESTUDIANTE'], { 
    required_error: 'El rol es obligatorio',
    invalid_type_error: 'Rol inválido, debe ser DOCENTE o ESTUDIANTE'
  })
});

module.exports = { loginSchema, registerSchema };
