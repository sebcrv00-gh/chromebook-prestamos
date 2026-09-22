const prisma = require('../../config/database');

class CyclesService {
  _formatCartCycle(cc) {
    const reservedQuantity = (cc.reservations || []).reduce(
      (sum, r) => sum + (r.quantityApproved || 0),
      0
    );
    const effectiveName = cc.customName || cc.cart?.name || 'Carro';
    return {
      id: cc.id,
      cartId: cc.cartId,
      cycleId: cc.cycleId,
      allocatedQuantity: cc.allocatedQuantity,
      customName: cc.customName || null,
      reservedQuantity,
      availableQuantity: Math.max(0, cc.allocatedQuantity - reservedQuantity),
      cart: cc.cart
        ? {
            id: cc.cart.id,
            name: effectiveName,
            originalName: cc.cart.name,
            customName: cc.customName || null,
            description: cc.cart.description,
            location: cc.cart.location,
            totalChromebooks: cc.cart.totalChromebooks,
            active: cc.cart.active,
          }
        : null,
    };
  }

  async listCycles() {
    const cycles = await prisma.cycle.findMany({
      include: {
        cartCycles: {
          include: {
            cart: true,
            reservations: {
              where: { status: { in: ['APROBADA', 'PARCIAL'] } },
              select: { quantityApproved: true },
            },
          },
        },
        _count: {
          select: { reservations: true },
        },
      },
      orderBy: [{ active: 'desc' }, { year: 'desc' }, { createdAt: 'desc' }],
    });

    return cycles.map((cycle) => ({
      ...cycle,
      cartCycles: (cycle.cartCycles || []).map((cc) => this._formatCartCycle(cc)),
    }));
  }

  async getActiveCycle() {
    const cycle = await prisma.cycle.findFirst({
      where: { active: true },
      include: {
        cartCycles: {
          include: {
            cart: true,
            reservations: {
              where: { status: { in: ['APROBADA', 'PARCIAL'] } },
              select: { quantityApproved: true },
            },
          },
        },
      },
    });
    if (!cycle) return null;
    return {
      ...cycle,
      cartCycles: (cycle.cartCycles || []).map((cc) => this._formatCartCycle(cc)),
    };
  }

  async getCycleById(id) {
    const cycle = await prisma.cycle.findUnique({
      where: { id },
      include: {
        cartCycles: {
          include: {
            cart: true,
            reservations: {
              where: { status: { in: ['APROBADA', 'PARCIAL'] } },
              select: { quantityApproved: true },
            },
          },
        },
        _count: {
          select: { reservations: true },
        },
      },
    });
    if (!cycle) throw { statusCode: 404, message: 'Ciclo no encontrado' };
    return {
      ...cycle,
      cartCycles: (cycle.cartCycles || []).map((cc) => this._formatCartCycle(cc)),
    };
  }

  async createCycle(data) {
    const willBeActive = data.active !== undefined ? data.active : false;
    const cartCyclesInput = data.cartCycles || [];
    const totalChromebooks = cartCyclesInput.reduce(
      (sum, cc) => sum + (Number(cc.allocatedQuantity) || 0),
      0
    );

    return prisma.$transaction(async (tx) => {
      if (willBeActive) {
        await tx.cycle.updateMany({
          where: { active: true },
          data: { active: false },
        });
      }

      const cycle = await tx.cycle.create({
        data: {
          name: data.name,
          type: data.type,
          gradeRange: data.gradeRange,
          description: data.description || null,
          year: Number(data.year),
          active: willBeActive,
          totalChromebooks,
          reservedChromebooks: 0,
        },
      });

      for (const cc of cartCyclesInput) {
        const qty = Number(cc.allocatedQuantity) || 0;
        if (qty <= 0) continue;
        const customName = cc.customName ? cc.customName.trim() : null;
        await tx.cartCycle.upsert({
          where: {
            cartId_cycleId: { cartId: cc.cartId, cycleId: cycle.id },
          },
          create: {
            cartId: cc.cartId,
            cycleId: cycle.id,
            allocatedQuantity: qty,
            customName,
          },
          update: {
            allocatedQuantity: qty,
            customName,
          },
        });
      }

      return this.getCycleById(cycle.id);
    });
  }

  async updateCycle(id, data) {
    const existing = await prisma.cycle.findUnique({ where: { id } });
    if (!existing) throw { statusCode: 404, message: 'Ciclo no encontrado' };

    return prisma.$transaction(async (tx) => {
      const updatePayload = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.type !== undefined) updatePayload.type = data.type;
      if (data.gradeRange !== undefined) updatePayload.gradeRange = data.gradeRange;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.year !== undefined) updatePayload.year = Number(data.year);
      if (data.active !== undefined) {
        updatePayload.active = data.active;
        if (data.active) {
          await tx.cycle.updateMany({
            where: { active: true, NOT: { id } },
            data: { active: false },
          });
        }
      }

      if (data.cartCycles) {
        const incomingValidCartIds = new Set(
          data.cartCycles
            .filter((cc) => Number(cc.allocatedQuantity) > 0)
            .map((cc) => cc.cartId)
        );

        // Check existing cartCycles to see if any are being removed
        const existingCCs = await tx.cartCycle.findMany({
          where: { cycleId: id },
          include: {
            reservations: {
              where: { status: { in: ['PENDIENTE', 'APROBADA', 'PARCIAL'] } },
            },
          },
        });

        for (const ecc of existingCCs) {
          if (!incomingValidCartIds.has(ecc.cartId)) {
            if (ecc.reservations.length > 0) {
              throw {
                statusCode: 400,
                message: `No se puede quitar el carro "${ecc.customName || ecc.cartId}" porque tiene reservas activas.`,
              };
            }
            await tx.reservation.deleteMany({ where: { cartCycleId: ecc.id } });
            await tx.cartCycle.delete({ where: { id: ecc.id } });
          }
        }

        for (const cc of data.cartCycles) {
          const qty = Number(cc.allocatedQuantity) || 0;
          if (qty <= 0) continue;
          const customName = cc.customName !== undefined ? (cc.customName ? cc.customName.trim() : null) : undefined;
          await tx.cartCycle.upsert({
            where: {
              cartId_cycleId: { cartId: cc.cartId, cycleId: id },
            },
            create: {
              cartId: cc.cartId,
              cycleId: id,
              allocatedQuantity: qty,
              customName: customName || null,
            },
            update: {
              allocatedQuantity: qty,
              ...(customName !== undefined ? { customName } : {}),
            },
          });
        }

        const sum = await tx.cartCycle.aggregate({
          where: { cycleId: id },
          _sum: { allocatedQuantity: true },
        });
        updatePayload.totalChromebooks = Number(sum._sum.allocatedQuantity || 0);
      }

      await tx.cycle.update({ where: { id }, data: updatePayload });
      return this.getCycleById(id);
    });
  }

  async assignCartToCycle(cycleId, { cartId, allocatedQuantity, customName }) {
    const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw { statusCode: 404, message: 'Ciclo no encontrado' };

    const cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw { statusCode: 404, message: 'Carro no encontrado' };

    const qty = Number(allocatedQuantity) || 0;
    if (qty <= 0) {
      throw { statusCode: 400, message: 'La cantidad asignada debe ser mayor a 0' };
    }

    const cName = customName ? customName.trim() : null;

    return prisma.$transaction(async (tx) => {
      await tx.cartCycle.upsert({
        where: {
          cartId_cycleId: { cartId, cycleId },
        },
        create: {
          cartId,
          cycleId,
          allocatedQuantity: qty,
          customName: cName,
        },
        update: {
          allocatedQuantity: qty,
          customName: cName,
        },
      });

      const sum = await tx.cartCycle.aggregate({
        where: { cycleId },
        _sum: { allocatedQuantity: true },
      });
      await tx.cycle.update({
        where: { id: cycleId },
        data: { totalChromebooks: Number(sum._sum.allocatedQuantity || 0) },
      });

      return this.getCycleById(cycleId);
    });
  }

  async updateCartCycle(cycleId, cartCycleId, { allocatedQuantity, customName }) {
    const cartCycle = await prisma.cartCycle.findFirst({
      where: { id: cartCycleId, cycleId },
    });
    if (!cartCycle) throw { statusCode: 404, message: 'Asignación de carro no encontrada en este ciclo' };

    return prisma.$transaction(async (tx) => {
      const data = {};
      if (allocatedQuantity !== undefined) {
        data.allocatedQuantity = Math.max(0, Number(allocatedQuantity) || 0);
      }
      if (customName !== undefined) {
        data.customName = customName ? customName.trim() : null;
      }

      await tx.cartCycle.update({
        where: { id: cartCycleId },
        data,
      });

      const sum = await tx.cartCycle.aggregate({
        where: { cycleId },
        _sum: { allocatedQuantity: true },
      });
      await tx.cycle.update({
        where: { id: cycleId },
        data: { totalChromebooks: Number(sum._sum.allocatedQuantity || 0) },
      });

      return this.getCycleById(cycleId);
    });
  }

  async removeCartFromCycle(cycleId, cartCycleId) {
    const cartCycle = await prisma.cartCycle.findFirst({
      where: { id: cartCycleId, cycleId },
      include: {
        cart: true,
        reservations: {
          where: { status: { in: ['PENDIENTE', 'APROBADA', 'PARCIAL'] } },
        },
      },
    });
    if (!cartCycle) throw { statusCode: 404, message: 'Asignación de carro no encontrada en este ciclo' };

    if (cartCycle.reservations.length > 0) {
      throw {
        statusCode: 400,
        message: `No se puede eliminar el carro "${cartCycle.customName || cartCycle.cart?.name || 'Carro'}" de este ciclo porque tiene ${cartCycle.reservations.length} reserva(s) activa(s) o pendiente(s).`,
      };
    }

    return prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({ where: { cartCycleId } });
      await tx.cartCycle.delete({ where: { id: cartCycleId } });

      const sum = await tx.cartCycle.aggregate({
        where: { cycleId },
        _sum: { allocatedQuantity: true },
      });
      await tx.cycle.update({
        where: { id: cycleId },
        data: { totalChromebooks: Number(sum._sum.allocatedQuantity || 0) },
      });

      return this.getCycleById(cycleId);
    });
  }

  async toggleCycleActive(id) {
    const existing = await prisma.cycle.findUnique({ where: { id } });
    if (!existing) throw { statusCode: 404, message: 'Ciclo no encontrado' };

    const newActive = !existing.active;

    return prisma.$transaction(async (tx) => {
      if (newActive) {
        await tx.cycle.updateMany({
          where: { active: true, NOT: { id } },
          data: { active: false },
        });
      }

      await tx.cycle.update({
        where: { id },
        data: { active: newActive },
      });

      return this.getCycleById(id);
    });
  }
}

module.exports = new CyclesService();
