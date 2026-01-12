/**
 * Servicio para gestión de Solicitudes de Historia Clínica
 */

const prisma = require('../db/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');

class SolicitudHCService {
  /**
   * Obtener todas las solicitudes (admin)
   */
  async getAll({ page = 1, limit = 20, estado = '', search = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && { estado }),
      ...(search && {
        OR: [
          { paciente: { nombre: { contains: search, mode: 'insensitive' } } },
          { paciente: { apellido: { contains: search, mode: 'insensitive' } } },
          { paciente: { cedula: { contains: search } } },
        ],
      }),
    };

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudHistoriaClinica.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              email: true,
              telefono: true,
            },
          },
        },
      }),
      prisma.solicitudHistoriaClinica.count({ where }),
    ]);

    return {
      solicitudes: solicitudes.map(s => this.formatSolicitud(s)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una solicitud por ID
   */
  async getById(id) {
    const solicitud = await prisma.solicitudHistoriaClinica.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            email: true,
            telefono: true,
            tipoDocumento: true,
          },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    return this.formatSolicitud(solicitud);
  }

  /**
   * Actualizar estado de una solicitud
   */
  async updateEstado(id, { estado, notas, archivoUrl, procesadoPor }) {
    const solicitud = await prisma.solicitudHistoriaClinica.findUnique({
      where: { id },
      include: { paciente: true },
    });

    if (!solicitud) {
      throw new NotFoundError('Solicitud no encontrada');
    }

    const updateData = {
      estado,
      ...(notas !== undefined && { notas }),
      ...(archivoUrl !== undefined && { archivoUrl }),
      ...(procesadoPor && { procesadoPor }),
    };

    // Set fechaProcesado when changing to LISTA or ENTREGADA
    if (estado === 'LISTA' || estado === 'ENTREGADA') {
      updateData.fechaProcesado = new Date();
    }

    const updated = await prisma.solicitudHistoriaClinica.update({
      where: { id },
      data: updateData,
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            email: true,
          },
        },
      },
    });

    // Send notification email when status changes to LISTA
    if (estado === 'LISTA' && solicitud.paciente?.email) {
      try {
        const emailService = require('./email.service');
        if (emailService.isEnabled()) {
          await emailService.sendMedicalRecordReady({
            to: solicitud.paciente.email,
            paciente: solicitud.paciente,
            solicitud: updated,
          });
        }
      } catch (emailError) {
        console.error('Error enviando email de historia lista:', emailError.message);
      }
    }

    return this.formatSolicitud(updated);
  }

  /**
   * Obtener estadísticas de solicitudes
   */
  async getStats() {
    const [pendientes, enProceso, listas, entregadas, rechazadas, total] = await Promise.all([
      prisma.solicitudHistoriaClinica.count({ where: { estado: 'PENDIENTE' } }),
      prisma.solicitudHistoriaClinica.count({ where: { estado: 'EN_PROCESO' } }),
      prisma.solicitudHistoriaClinica.count({ where: { estado: 'LISTA' } }),
      prisma.solicitudHistoriaClinica.count({ where: { estado: 'ENTREGADA' } }),
      prisma.solicitudHistoriaClinica.count({ where: { estado: 'RECHAZADA' } }),
      prisma.solicitudHistoriaClinica.count(),
    ]);

    return {
      pendientes,
      enProceso,
      listas,
      entregadas,
      rechazadas,
      total,
    };
  }

  /**
   * Formatear solicitud para respuesta
   */
  formatSolicitud(s) {
    const estadoMap = {
      'PENDIENTE': 'Pendiente',
      'EN_PROCESO': 'En Proceso',
      'LISTA': 'Lista',
      'ENTREGADA': 'Entregada',
      'RECHAZADA': 'Rechazada',
    };

    return {
      id: s.id,
      tipo: s.tipo === 'COMPLETA' ? 'completa' : 'parcial',
      periodo: s.periodo,
      motivo: s.motivo,
      estado: estadoMap[s.estado] || s.estado,
      estadoOriginal: s.estado,
      notas: s.notas,
      archivoUrl: s.archivoUrl,
      procesadoPor: s.procesadoPor,
      fechaProcesado: s.fechaProcesado,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      paciente: s.paciente ? {
        id: s.paciente.id,
        nombre: s.paciente.nombre,
        apellido: s.paciente.apellido,
        nombreCompleto: `${s.paciente.nombre} ${s.paciente.apellido}`,
        cedula: s.paciente.cedula,
        tipoDocumento: s.paciente.tipoDocumento,
        email: s.paciente.email,
        telefono: s.paciente.telefono,
      } : null,
    };
  }
}

module.exports = new SolicitudHCService();
