const prisma = require('../../config/database');

class ReportsService {
  /**
   * General KPI Dashboard Summary
   */
  async getDashboardSummary() {
    const [
      totalUsers,
      totalCycles,
      totalReservations,
      pendingReservations,
      approvedReservations,
    ] = await Promise.all([
      prisma.user.count({ where: { active: true } }),
      prisma.cycle.count(),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'PENDIENTE' } }),
      prisma.reservation.count({ where: { status: { in: ['APROBADA', 'PARCIAL'] } } }),
    ]);

    // Active cycles summary
    const cycles = await prisma.cycle.findMany({
      where: { active: true },
      include: {
        reservations: {
          where: { status: { in: ['APROBADA', 'PARCIAL'] } },
          select: { quantityApproved: true },
        },
      },
    });

    const inventorySummary = cycles.map((c) => {
      const reserved = c.reservations.reduce((s, r) => s + (r.quantityApproved || 0), 0);
      return {
        id: c.id,
        cycleName: c.name,
        allocated: c.totalChromebooks,
        reserved,
        available: Math.max(0, c.totalChromebooks - reserved),
      };
    });

    return {
      kpis: {
        totalUsers,
        totalCycles,
        totalReservations,
        pendingReservations,
        approvedReservations,
      },
      inventorySummary,
    };
  }

  /**
   * Usage reports per cycle
   */
  async getUsageReport(cycleId) {
    const where = cycleId ? { id: cycleId } : { active: true };

    const cycles = await prisma.cycle.findMany({
      where,
      include: {
        reservations: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return cycles.map((c) => {
      const approvedReservations = c.reservations.filter((r) =>
        ['APROBADA', 'PARCIAL'].includes(r.status)
      );
      const totalEquipmentLoaned = approvedReservations.reduce(
        (sum, r) => sum + (r.quantityApproved || 0),
        0
      );

      return {
        id: c.id,
        cycleName: c.name,
        cycleType: c.type,
        year: c.year,
        totalChromebooks: c.totalChromebooks,
        totalEquipmentLoaned,
        availableChromebooks: Math.max(0, c.totalChromebooks - totalEquipmentLoaned),
        utilizationPercentage: c.totalChromebooks > 0
          ? Math.round((totalEquipmentLoaned / c.totalChromebooks) * 100)
          : 0,
        totalReservationRequests: c.reservations.length,
        approvedRequestsCount: approvedReservations.length,
      };
    });
  }

  /**
   * Audit log history
   */
  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, pagination: { page, limit, total } };
  }
}

module.exports = new ReportsService();
