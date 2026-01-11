
/**
 * Service de Tickets de Soporte
 * Gestión de incidentes internos y soporte técnico
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class TicketService {
  /**
   * Obtener Tickets con filtros
   */
  async getTickets(query = {}) {
    const {
      page = 1,
      limit = 10,
      estado,
      prioridad,
      categoria,
      usuarioReportaId,
      usuarioAsignadoId,
      fechaDesde,
      fechaHasta,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && { estado }),
      ...(prioridad && { prioridad }),
      ...(categoria && { categoria }),
      ...(usuarioReportaId && { usuarioReportaId }),
      ...(usuarioAsignadoId && { usuarioAsignadoId }),
      ...(fechaDesde || fechaHasta
        ? {
            createdAt: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticketSoporte.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          reportador: { select: { nombre: true, apellido: true, email: true } },
          asignado: { select: { nombre: true, apellido: true, email: true } },
        },
      }),
      prisma.ticketSoporte.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener Ticket por ID
   */
  async getTicketById(id) {
    const ticket = await prisma.ticketSoporte.findUnique({
      where: { id },
      include: {
        reportador: { select: { nombre: true, apellido: true, email: true } },
        asignado: { select: { nombre: true, apellido: true, email: true } },
        paciente: { select: { nombre: true, apellido: true, tipoDocumento: true, cedula: true } },
        admision: { select: { id: true, fechaIngreso: true, estado: true } },
        cita: { select: { id: true, fecha: true, hora: true, tipoCita: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket no encontrado');
    }

    return ticket;
  }

  /**
   * Crear Ticket
   */
  async createTicket(data) {
    const {
      asunto,
      descripcion,
      categoria,
      prioridad,
      usuarioReportaId,
      pacienteId,
      admisionId,
      citaId,
    } = data;

    if (!usuarioReportaId) {
      throw new ValidationError('El usuario que reporta es obligatorio');
    }

    const ticket = await prisma.ticketSoporte.create({
      data: {
        asunto,
        descripcion,
        categoria,
        prioridad: prioridad || 'MEDIA',
        usuarioReportaId,
        pacienteId,
        admisionId,
        citaId,
        estado: 'ABIERTO',
      },
    });

    return ticket;
  }

  /**
   * Actualizar Ticket
   */
  async updateTicket(id, data) {
    const { estado, prioridad, usuarioAsignadoId, solucion, categoria } = data;

    const ticket = await prisma.ticketSoporte.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundError('Ticket no encontrado');
    }

    const updateData = {
      ...(estado && { estado }),
      ...(prioridad && { prioridad }),
      ...(categoria && { categoria }),
      ...(usuarioAsignadoId && { usuarioAsignadoId }),
      ...(solucion && { solucion }),
    };

    // Si se resuelve, marcar fecha
    if (estado === 'RESUELTO' && ticket.estado !== 'RESUELTO') {
      updateData.fechaResolucion = new Date();
    }

    const ticketActualizado = await prisma.ticketSoporte.update({
      where: { id },
      data: updateData,
      include: {
        asignado: { select: { nombre: true, apellido: true } },
      },
    });

    return ticketActualizado;
  }

  /**
   * Eliminar Ticket
   */
  async deleteTicket(id) {
    const ticket = await prisma.ticketSoporte.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundError('Ticket no encontrado');
    }

    await prisma.ticketSoporte.delete({ where: { id } });
    return { message: 'Ticket eliminado correctamente' };
  }
}

module.exports = new TicketService();
