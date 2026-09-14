const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');

class UsersService {
  async listUsers(query) {
    const { page = 1, limit = 20, role, search, active } = query;
    const skip = (page - 1) * limit;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (typeof active === 'boolean') {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, pagination: { page, limit, total } };
  }

  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'Usuario no encontrado' };
    }

    return user;
  }

  async createUser(userData, currentUserRole) {
    // Check role assignment rules:
    // Admin can only create DOCENTE or ESTUDIANTE
    // Superadmin can create any role
    if (currentUserRole === 'ADMIN' && ['SUPERADMIN', 'ADMIN'].includes(userData.role)) {
      throw {
        statusCode: 403,
        message: 'Un administrador solo puede crear usuarios con rol DOCENTE o ESTUDIANTE',
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw { statusCode: 409, message: 'El correo electrónico ya está registrado' };
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  async updateUser(id, userData, currentUserRole) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw { statusCode: 404, message: 'Usuario no encontrado' };
    }

    // Role restrictions
    if (currentUserRole === 'ADMIN') {
      if (['SUPERADMIN', 'ADMIN'].includes(user.role)) {
        throw {
          statusCode: 403,
          message: 'No tienes permiso para modificar a otros administradores o superadministradores',
        };
      }
      if (userData.role && ['SUPERADMIN', 'ADMIN'].includes(userData.role)) {
        throw {
          statusCode: 403,
          message: 'Un administrador solo puede asignar roles DOCENTE o ESTUDIANTE',
        };
      }
    }

    if (userData.email && userData.email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (emailExists) {
        throw { statusCode: 409, message: 'El nuevo correo ya está registrado' };
      }
    }

    const updateData = { ...userData };
    if (userData.password) {
      updateData.passwordHash = await bcrypt.hash(userData.password, 10);
      delete updateData.password;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async toggleUserActive(id, currentUserRole) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw { statusCode: 404, message: 'Usuario no encontrado' };
    }

    if (currentUserRole === 'ADMIN' && ['SUPERADMIN', 'ADMIN'].includes(user.role)) {
      throw {
        statusCode: 403,
        message: 'No tienes permiso para desactivar a administradores o superadministradores',
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
      },
    });

    return updatedUser;
  }
}

module.exports = new UsersService();
