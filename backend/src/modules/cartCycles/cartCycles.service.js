const prisma = require('../../config/database');

class CartCyclesService {
  async getAvailability(cartCycleId) {
    const cc = await prisma.cartCycle.findUnique({
      where: { id: cartCycleId },
      include: {
        cart: true,
        cycle: true,
        reservations: {
          where: { status: { in: ['APROBADA', 'PARCIAL'] } },
          select: { quantityApproved: true },
        },
      },
    });

    if (!cc) {
      throw { statusCode: 404, message: 'Asignación de carro-ciclo no encontrada' };
    }

    const reservedCount = cc.reservations.reduce((sum, r) => sum + (r.quantityApproved || 0), 0);
    const availableQuantity = Math.max(0, cc.allocatedQuantity - reservedCount);

    return {
      cartCycleId: cc.id,
      cart: cc.cart,
      cycle: cc.cycle,
      allocated: cc.allocatedQuantity,
      reserved: reservedCount,
      available: availableQuantity,
    };
  }

  async updateAllocation(id, allocatedQuantity) {
    const cc = await prisma.cartCycle.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: { in: ['APROBADA', 'PARCIAL'] } },
          select: { quantityApproved: true },
        },
      },
    });

    if (!cc) {
      throw { statusCode: 404, message: 'Asignación de carro-ciclo no encontrada' };
    }

    const currentReserved = cc.reservations.reduce((sum, r) => sum + (r.quantityApproved || 0), 0);
    if (allocatedQuantity < currentReserved) {
      throw {
        statusCode: 400,
        message: `No se puede reducir la asignación a ${allocatedQuantity} porque ya existen ${currentReserved} Chromebooks reservados para este ciclo.`,
      };
    }

    const updated = await prisma.cartCycle.update({
      where: { id },
      data: { allocatedQuantity },
      include: { cart: true, cycle: true },
    });

    return updated;
  }

  async upsertCartCycle(cartId, cycleId, allocatedQuantity) {
    const cc = await prisma.cartCycle.upsert({
      where: { cartId_cycleId: { cartId, cycleId } },
      update: { allocatedQuantity },
      create: { cartId, cycleId, allocatedQuantity },
      include: { cart: true, cycle: true },
    });

    return cc;
  }
}

module.exports = new CartCyclesService();
