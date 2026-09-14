const prisma = require('../../config/database');

class CyclesService {
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
      cartCycles: (cycle.cartCycles || []).map((cc) => {
        const reservedQuantity = cc.reservations.reduce(
          (sum, r) => sum + (r.quantityApproved || 0),
          0
        );
        return {
          id: cc.id,
          cartId: cc.cartId,
          cycleId: cc.cycleId,
          allocatedQuantity: cc.allocatedQuantity,
          reservedQuantity,
          availableQuantity: Math.max(0, cc.allocatedQuantity - reservedQuantity),
          cart: cc.cart
            ? {
                id: cc.cart.id,
                name: cc.cart.name,
                description: cc.cart.description,
                location: cc.cart.location,
                totalChromebooks: cc.cart.totalChromebooks,
                active: cc.cart.active,
              }
            : null,
        };
      }),
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
      cartCycles: (cycle.cartCycles || []).map((cc) => {
        const reservedQuantity = cc.reservations.reduce(
          (sum, r) => sum + (r.quantityApproved || 0),
          0
        );
        return {
          id: cc.id,
          cartId: cc.cartId,
          cycleId: cc.cycleId,
          allocatedQuantity: cc.allocatedQuantity,
          reservedQuantity,
          availableQuantity: Math.max(0, cc.allocatedQuantity - reservedQuantity),
          cart: cc.cart,
        };
      }),
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
      cartCycles: (cycle.cartCycles || []).map((cc) => {
        const reservedQuantity = cc.reservations.reduce(
          (sum, r) => sum + (r.quantityApproved || 0),
          0
        );
        return {
          id: cc.id,
          cartId: cc.cartId,
          cycleId: cc.cycleId,
          allocatedQuantity: cc.allocatedQuantity,
          reservedQuantity,
          availableQuantity: Math.max(0, cc.allocatedQuantity - reservedQuantity),
          cart: cc.cart,
        };
      }),
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
        await tx.cartCycle.upsert({
          where: {
            cartId_cycleId: { cartId: cc.cartId, cycleId: cycle.id },
          },
          create: {
            cartId: cc.cartId,
            cycleId: cycle.id,
            allocatedQuantity: qty,
          },
          update: { allocatedQuantity: qty },
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

      let totalChromebooks = existing.totalChromebooks;
      if (data.cartCycles) {
        for (const cc of data.cartCycles) {
          const qty = Number(cc.allocatedQuantity) || 0;
          await tx.cartCycle.upsert({
            where: {
              cartId_cycleId: { cartId: cc.cartId, cycleId: id },
            },
            create: {
              cartId: cc.cartId,
              cycleId: id,
              allocatedQuantity: qty,
            },
            update: { allocatedQuantity: qty },
          });
        }
        const sum = await tx.cartCycle.aggregate({
          where: { cycleId: id },
          _sum: { allocatedQuantity: true },
        });
        totalChromebooks = Number(sum._sum.allocatedQuantity || 0);
        updatePayload.totalChromebooks = totalChromebooks;
      }

      await tx.cycle.update({ where: { id }, data: updatePayload });
      return this.getCycleById(id);
    });
  }

  async toggleCycleActive(id) {
    const existing = await prisma.cycle.findUnique({ where: { id } });
    if (!existing) throw { statusCode: 404, message: 'Ciclo no encontrado' };

    const newActive = !existing.active;

    return prisma.$transaction(async (tx) => {
      if (newActive) {
        // Deactivate all other cycles first
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
