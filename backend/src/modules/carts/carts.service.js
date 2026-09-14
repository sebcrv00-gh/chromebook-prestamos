const prisma = require('../../config/database');

class CartsService {
  async listCarts(cycleId) {
    const carts = await prisma.cart.findMany({
      where: { active: true },
      include: {
        cartCycles: cycleId
          ? {
              where: { cycleId },
              include: {
                reservations: {
                  where: { status: { in: ['APROBADA', 'PARCIAL'] } },
                  select: { quantityApproved: true },
                },
              },
            }
          : true,
      },
      orderBy: { name: 'asc' },
    });

    // Calculate real-time availability if cycleId provided
    return carts.map((cart) => {
      let availability = null;
      if (cycleId && cart.cartCycles.length > 0) {
        const cc = cart.cartCycles[0];
        const reservedCount = cc.reservations.reduce((sum, r) => sum + (r.quantityApproved || 0), 0);
        availability = {
          cartCycleId: cc.id,
          cycleId: cc.cycleId,
          allocatedQuantity: cc.allocatedQuantity,
          reservedQuantity: reservedCount,
          availableQuantity: Math.max(0, cc.allocatedQuantity - reservedCount),
        };
      }

      return {
        id: cart.id,
        name: cart.name,
        description: cart.description,
        totalChromebooks: cart.totalChromebooks,
        location: cart.location,
        active: cart.active,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        availability,
      };
    });
  }

  async getCartById(id, cycleId) {
    const cart = await prisma.cart.findUnique({
      where: { id },
      include: {
        cartCycles: {
          include: {
            cycle: true,
            reservations: {
              where: { status: { in: ['APROBADA', 'PARCIAL'] } },
              select: {
                id: true,
                quantityRequested: true,
                quantityApproved: true,
                status: true,
                reservationDate: true,
                startTime: true,
                endTime: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw { statusCode: 404, message: 'Carro no encontrado' };
    }

    return cart;
  }

  async createCart(cartData) {
    const newCart = await prisma.cart.create({
      data: {
        name: cartData.name,
        description: cartData.description,
        totalChromebooks: cartData.totalChromebooks,
        location: cartData.location,
      },
    });

    return newCart;
  }

  async updateCart(id, cartData) {
    const cart = await prisma.cart.findUnique({ where: { id } });
    if (!cart) {
      throw { statusCode: 404, message: 'Carro no encontrado' };
    }

    const updated = await prisma.cart.update({
      where: { id },
      data: cartData,
    });

    return updated;
  }

  async deleteCart(id) {
    const cart = await prisma.cart.findUnique({ where: { id } });
    if (!cart) {
      throw { statusCode: 404, message: 'Carro no encontrado' };
    }

    // Soft delete
    await prisma.cart.update({
      where: { id },
      data: { active: false },
    });

    return { message: 'Carro desactivado correctamente' };
  }

  /**
   * Transfer Chromebook availability from sourceCart to targetCart within a cycle
   */
  async transferAvailability(data, userId) {
    const { sourceCartId, targetCartId, cycleId, quantity, reason } = data;

    if (sourceCartId === targetCartId) {
      throw { statusCode: 400, message: 'El carro de origen y destino deben ser diferentes' };
    }

    return await prisma.$transaction(async (tx) => {
      // Find source CartCycle
      const sourceCC = await tx.cartCycle.findUnique({
        where: { cartId_cycleId: { cartId: sourceCartId, cycleId } },
        include: {
          cart: true,
          reservations: {
            where: { status: { in: ['APROBADA', 'PARCIAL'] } },
            select: { quantityApproved: true },
          },
        },
      });

      if (!sourceCC) {
        throw { statusCode: 404, message: 'El carro de origen no está configurado para este ciclo' };
      }

      // Check current reserved quantity vs allocated
      const sourceReserved = sourceCC.reservations.reduce((sum, r) => sum + (r.quantityApproved || 0), 0);
      const sourceFree = sourceCC.allocatedQuantity - sourceReserved;

      if (quantity > sourceFree) {
        throw {
          statusCode: 400,
          message: `El carro de origen (${sourceCC.cart.name}) solo tiene ${sourceFree} equipos libres disponibles para transferir (${sourceReserved} están ya reservados).`,
        };
      }

      // Find or create target CartCycle
      let targetCC = await tx.cartCycle.findUnique({
        where: { cartId_cycleId: { cartId: targetCartId, cycleId } },
        include: { cart: true },
      });

      if (!targetCC) {
        const targetCart = await tx.cart.findUnique({ where: { id: targetCartId } });
        if (!targetCart) throw { statusCode: 404, message: 'El carro de destino no existe' };

        targetCC = await tx.cartCycle.create({
          data: {
            cartId: targetCartId,
            cycleId,
            allocatedQuantity: 0,
          },
          include: { cart: true },
        });
      }

      // Perform transfer
      const updatedSource = await tx.cartCycle.update({
        where: { id: sourceCC.id },
        data: { allocatedQuantity: sourceCC.allocatedQuantity - quantity },
      });

      const updatedTarget = await tx.cartCycle.update({
        where: { id: targetCC.id },
        data: { allocatedQuantity: targetCC.allocatedQuantity + quantity },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'TRANSFER',
          entityType: 'CART_CYCLE',
          entityId: sourceCC.id,
          details: {
            sourceCart: sourceCC.cart.name,
            targetCart: targetCC.cart.name,
            cycleId,
            quantityTransferred: quantity,
            sourceNewAllocated: updatedSource.allocatedQuantity,
            targetNewAllocated: updatedTarget.allocatedQuantity,
            reason: reason || 'Sin motivo especificado',
          },
        },
      });

      return {
        message: `Transferencia exitosa de ${quantity} Chromebooks desde ${sourceCC.cart.name} hacia ${targetCC.cart.name}`,
        sourceCart: { name: sourceCC.cart.name, newAllocated: updatedSource.allocatedQuantity },
        targetCart: { name: targetCC.cart.name, newAllocated: updatedTarget.allocatedQuantity },
      };
    });
  }
}

module.exports = new CartsService();
