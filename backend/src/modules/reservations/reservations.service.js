const prisma = require('../../config/database');
const notificationsService = require('../notifications/notifications.service');

class ReservationsService {
  async createReservation(userId, data) {
    const {
      cartCycleId,
      quantityRequested,
      purpose,
      reservationDate,
      startTime,
      endTime,
      notes,
    } = data;

    const cartCycle = await prisma.cartCycle.findUnique({
      where: { id: cartCycleId },
      include: {
        cart: true,
        cycle: {
          include: {
            reservations: {
              where: { status: { in: ['APROBADA', 'PARCIAL'] } },
              select: { quantityApproved: true },
            },
          },
        },
        reservations: {
          where: { status: { in: ['APROBADA', 'PARCIAL'] } },
          select: { quantityApproved: true },
        },
      },
    });

    if (!cartCycle) {
      throw { statusCode: 404, message: 'La combinación de carro y ciclo seleccionada no existe' };
    }

    if (!cartCycle.cycle?.active) {
      throw { statusCode: 400, message: 'El ciclo académico de este carro no se encuentra activo' };
    }

    const reservedInCart = cartCycle.reservations.reduce(
      (sum, r) => sum + (r.quantityApproved || 0),
      0
    );
    const availableInCart = cartCycle.allocatedQuantity - reservedInCart;

    if (availableInCart <= 0) {
      throw {
        statusCode: 400,
        message: `No quedan Chromebooks disponibles en el ${cartCycle.cart?.name || 'carro'} para el ${cartCycle.cycle.name}. (Asignados: ${cartCycle.allocatedQuantity}, Reservados: ${reservedInCart}).`,
        availableStock: 0,
      };
    }

    if (quantityRequested > availableInCart) {
      throw {
        statusCode: 400,
        message: `Stock insuficiente: solicitaste ${quantityRequested} pero solo hay ${availableInCart} disponibles en el ${cartCycle.cart?.name || 'carro'} durante este ciclo.`,
        availableStock: availableInCart,
      };
    }

    const newReservation = await prisma.reservation.create({
      data: {
        userId,
        cycleId: cartCycle.cycleId,
        cartCycleId: cartCycle.id,
        quantityRequested,
        purpose,
        reservationDate: new Date(reservationDate),
        startTime,
        endTime,
        notes,
        status: 'PENDIENTE',
      },
      include: {
        cycle: true,
        cartCycle: { include: { cart: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, active: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationsService.createNotification({
        userId: admin.id,
        reservationId: newReservation.id,
        type: 'SISTEMA',
        title: 'Nueva solicitud de reserva',
        message: `${newReservation.user.firstName} ${newReservation.user.lastName} solicitó ${quantityRequested} Chromebooks en ${cartCycle.cart?.name || 'carro'} / ${cartCycle.cycle.name} (${purpose}).`,
      });
    }

    return { reservation: newReservation, availableStock: availableInCart };
  }

  async listReservations(user, query) {
    const { page = 1, limit = 20, status, cycleId, userId, date, cartId } = query;
    const skip = (page - 1) * limit;

    const where = {};

    if (['DOCENTE', 'ESTUDIANTE'].includes(user.role)) {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (cycleId) where.cycleId = cycleId;
    if (cartId) {
      where.cartCycle = { cartId };
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      where.reservationDate = { gte: targetDate, lt: nextDate };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          cycle: true,
          cartCycle: { include: { cart: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { reservations, pagination: { page, limit, total } };
  }

  async getReservationById(id, user) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        cycle: true,
        cartCycle: { include: { cart: true } },
      },
    });

    if (!reservation) throw { statusCode: 404, message: 'Reserva no encontrada' };
    if (['DOCENTE', 'ESTUDIANTE'].includes(user.role) && reservation.userId !== user.id) {
      throw { statusCode: 403, message: 'No tienes permiso para ver esta reserva' };
    }

    return reservation;
  }

  async approveReservation(id, reviewerId, data = {}) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        cartCycle: {
          include: {
            reservations: {
              where: { status: { in: ['APROBADA', 'PARCIAL'] }, id: { not: id } },
              select: { quantityApproved: true },
            },
          },
        },
        cycle: true,
        user: true,
      },
    });

    if (!reservation) throw { statusCode: 404, message: 'Reserva no encontrada' };
    if (reservation.status !== 'PENDIENTE') {
      throw { statusCode: 400, message: `La reserva ya fue procesada (estado: ${reservation.status})` };
    }

    const reservedTotal = reservation.cartCycle.reservations.reduce(
      (sum, r) => sum + (r.quantityApproved || 0),
      0
    );
    const currentAvailable = reservation.cartCycle.allocatedQuantity - reservedTotal;

    let approvedCount = data.quantityApproved || reservation.quantityRequested;
    if (approvedCount > currentAvailable) {
      if (currentAvailable <= 0) {
        throw { statusCode: 400, message: `No se puede aprobar: el ${reservation.cartCycle.cart?.name || 'carro'} ya no tiene stock libre.` };
      }
      approvedCount = currentAvailable;
    }

    const isPartial = approvedCount < reservation.quantityRequested;
    const finalStatus = isPartial ? 'PARCIAL' : 'APROBADA';

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: {
          status: finalStatus,
          quantityApproved: approvedCount,
          reviewedBy: reviewerId,
          notes: data.notes || reservation.notes,
        },
        include: { cycle: true, user: true, cartCycle: { include: { cart: true } } },
      });

      const cycleSum = await tx.reservation.aggregate({
        where: { cycleId: reservation.cycleId, status: { in: ['APROBADA', 'PARCIAL'] } },
        _sum: { quantityApproved: true },
      });
      await tx.cycle.update({
        where: { id: reservation.cycleId },
        data: { reservedChromebooks: Number(cycleSum._sum.quantityApproved || 0) },
      });

      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: 'APPROVE',
          entityType: 'RESERVATION',
          entityId: id,
          details: {
            previousStatus: 'PENDIENTE',
            newStatus: finalStatus,
            requested: reservation.quantityRequested,
            approved: approvedCount,
            cartName: res.cartCycle?.cart?.name,
            cycleName: res.cycle.name,
          },
        },
      });

      return res;
    });

    const notificationType = isPartial ? 'RESERVA_PARCIAL' : 'RESERVA_APROBADA';
    const title = isPartial ? 'Reserva aprobada parcialmente' : '¡Reserva Aprobada!';
    const message = isPartial
      ? `Tu solicitud de ${reservation.quantityRequested} Chromebooks fue aprobada parcialmente para ${approvedCount} equipos en ${updated.cartCycle?.cart?.name || 'el ciclo'}.`
      : `Tu reserva de ${approvedCount} Chromebooks para el ${new Date(
          reservation.reservationDate
        ).toLocaleDateString()} ha sido APROBADA en ${updated.cartCycle?.cart?.name || ''} / ${updated.cycle.name}.`;

    await notificationsService.createNotification({
      userId: reservation.userId,
      reservationId: id,
      type: notificationType,
      title,
      message,
    });

    return updated;
  }

  async rejectReservation(id, reviewerId, rejectionReason) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { cycle: true, user: true, cartCycle: { include: { cart: true } } },
    });
    if (!reservation) throw { statusCode: 404, message: 'Reserva no encontrada' };
    if (reservation.status !== 'PENDIENTE') {
      throw { statusCode: 400, message: `La reserva ya fue procesada (estado: ${reservation.status})` };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id },
        data: { status: 'RECHAZADA', reviewedBy: reviewerId, rejectionReason },
        include: { cycle: true, user: true, cartCycle: { include: { cart: true } } },
      });

      await tx.auditLog.create({
        data: {
          userId: reviewerId,
          action: 'REJECT',
          entityType: 'RESERVATION',
          entityId: id,
          details: { rejectionReason, cycleName: reservation.cycle.name, cartName: reservation.cartCycle?.cart?.name },
        },
      });

      return res;
    });

    await notificationsService.createNotification({
      userId: reservation.userId,
      reservationId: id,
      type: 'RESERVA_RECHAZADA',
      title: 'Reserva Rechazada',
      message: `Tu solicitud en ${updated.cartCycle?.cart?.name || 'carro'} / ${reservation.cycle.name} fue rechazada. Motivo: ${rejectionReason}`,
    });

    return updated;
  }

  async cancelReservation(id, user) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { cycle: true, cartCycle: true },
    });
    if (!reservation) throw { statusCode: 404, message: 'Reserva no encontrada' };
    if (['DOCENTE', 'ESTUDIANTE'].includes(user.role) && reservation.userId !== user.id) {
      throw { statusCode: 403, message: 'No tienes permiso para cancelar esta reserva' };
    }
    if (['CANCELADA', 'DEVUELTA', 'RECHAZADA'].includes(reservation.status)) {
      throw { statusCode: 400, message: `La reserva ya está en estado ${reservation.status}` };
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({ where: { id }, data: { status: 'CANCELADA' } });

      if (['APROBADA', 'PARCIAL'].includes(reservation.status)) {
        const cycleSum = await tx.reservation.aggregate({
          where: { cycleId: reservation.cycleId, status: { in: ['APROBADA', 'PARCIAL'] } },
          _sum: { quantityApproved: true },
        });
        await tx.cycle.update({
          where: { id: reservation.cycleId },
          data: { reservedChromebooks: Number(cycleSum._sum.quantityApproved || 0) },
        });
      }

      await tx.auditLog.create({
        data: { userId: user.id, action: 'CANCEL', entityType: 'RESERVATION', entityId: id, details: { cancelledBy: user.email } },
      });

      return updated;
    });
  }

  async returnReservation(id, reviewerId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { cycle: true, cartCycle: true },
    });
    if (!reservation) throw { statusCode: 404, message: 'Reserva no encontrada' };
    if (!['APROBADA', 'PARCIAL'].includes(reservation.status)) {
      throw { statusCode: 400, message: 'Solo se pueden devolver reservas APROBADAS o PARCIALES' };
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({ where: { id }, data: { status: 'DEVUELTA' } });

      const cycleSum = await tx.reservation.aggregate({
        where: { cycleId: reservation.cycleId, status: { in: ['APROBADA', 'PARCIAL'] } },
        _sum: { quantityApproved: true },
      });
      await tx.cycle.update({
        where: { id: reservation.cycleId },
        data: { reservedChromebooks: Number(cycleSum._sum.quantityApproved || 0) },
      });

      await tx.auditLog.create({
        data: { userId: reviewerId, action: 'RETURN', entityType: 'RESERVATION', entityId: id, details: { returnedByAdmin: reviewerId } },
      });

      return updated;
    });
  }
}

module.exports = new ReservationsService();
