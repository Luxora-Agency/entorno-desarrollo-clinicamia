/**
 * Service de admisiones
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AdmisionService {
  /**
   * Obtener todas las admisiones
   */
  async getAll(query = {}) {
    const { pacienteId, paciente_id, estado } = query;

    const where = {};
    if (pacienteId || paciente_id) {
      where.pacienteId = pacienteId || paciente_id;
    }
    if (estado) {
      where.estado = estado;
    }

    const admisiones = await prisma.admision.findMany({
      where,
      include: {
        paciente: true,
        unidad: true,
        cama: {
          include: {
            habitacion: true,
          },
        },
        movimientos: {
          orderBy: { fechaMovimiento: 'desc' },
        },
      },
      orderBy: { fechaIngreso: 'desc' },
    });

    return admisiones;
  }

  /**
   * Obtener una admisión por ID
   */
  async getById(id) {
    const admision = await prisma.admision.findUnique({
      where: { id },
      include: {
        paciente: true,
        unidad: true,
        cama: {
          include: {
            habitacion: true,
          },
        },
        movimientos: {
          orderBy: { fechaMovimiento: 'asc' },
        },
      },
    });

    if (!admision) {
      throw new NotFoundError('Admisión no encontrada');
    }

    return admision;
  }

  /**
   * Crear una admisión (iniciar hospitalización)
   */
  async create(data) {
    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar estado de la cama a Ocupada
      if (data.camaId) {
        await tx.cama.update({
          where: { id: data.camaId },
          data: { estado: 'Ocupada' },
        });
      }

      const admision = await tx.admision.create({
        data: {
          pacienteId: data.pacienteId,
          unidadId: data.unidadId,
          camaId: data.camaId,
          motivoIngreso: data.motivoIngreso,
          diagnosticoIngreso: data.diagnosticoIngreso,
          observaciones: data.observaciones,
          responsableIngreso: data.responsableIngreso,
        },
        include: {
          paciente: true,
          unidad: true,
          cama: {
            include: {
              habitacion: true,
            },
          },
        },
      });

      // Crear movimiento de ingreso
      await tx.movimiento.create({
        data: {
          admisionId: admision.id,
          tipo: 'Ingreso',
          unidadDestinoId: data.unidadId,
          camaDestinoId: data.camaId,
          motivo: data.motivoIngreso,
          responsable: data.responsableIngreso,
        },
      });

      return admision;
    });

    return result;
  }

  /**
   * Registrar egreso (Método Legacy/Simplificado)
   * Nota: Para un egreso completo con firma digital, usar EgresoService
   */
  async egreso(id, data) {
    const admision = await this.getById(id);

    const result = await prisma.$transaction(async (tx) => {
      // Liberar cama
      if (admision.camaId) {
        await tx.cama.update({
          where: { id: admision.camaId },
          data: { estado: 'Disponible' },
        });
      }

      const updated = await tx.admision.update({
        where: { id },
        data: {
          fechaEgreso: new Date(),
          diagnosticoEgreso: data.diagnosticoEgreso,
          estado: 'Egresada',
          responsableEgreso: data.responsableEgreso,
        },
        include: {
          paciente: true,
          unidad: true,
          cama: true,
        },
      });

      // Crear movimiento de egreso
      await tx.movimiento.create({
        data: {
          admisionId: id,
          tipo: 'Egreso',
          unidadOrigenId: admision.unidadId,
          camaOrigenId: admision.camaId,
          motivo: data.diagnosticoEgreso || 'Egreso hospitalario',
          responsable: data.responsableEgreso,
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Eliminar una admisión
   */
  async delete(id) {
    await this.getById(id);
    await prisma.admision.delete({ where: { id } });
    return true;
  }

  /**
   * Obtener admisiones por doctor (responsable de ingreso o con evoluciones)
   */
  async getByDoctor(doctorId, query = {}) {
    const { estado, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Buscar admisiones donde el doctor es responsable o tiene evoluciones
    const where = {
      AND: [
        // Solo admisiones activas (hospitalizados actualmente)
        estado ? { estado } : { estado: 'Activa' },
        {
          OR: [
            // Doctor es responsable del ingreso
            { responsableIngreso: doctorId },
            // Doctor tiene evoluciones en esta admisión
            {
              evolucionesClinicas: {
                some: {
                  doctorId: doctorId,
                },
              },
            },
          ],
        },
      ],
    };

    const [admisiones, total] = await Promise.all([
      prisma.admision.findMany({
        where,
        include: {
          paciente: true,
          unidad: true,
          cama: {
            include: {
              habitacion: true,
            },
          },
          evolucionesClinicas: {
            where: { doctorId },
            orderBy: { fechaEvolucion: 'desc' },
            take: 1,
          },
        },
        orderBy: { fechaIngreso: 'desc' },
        skip,
        take,
      }),
      prisma.admision.count({ where }),
    ]);

    return {
      data: admisiones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Obtener estadísticas del doctor para el selector de atención
   */
  async getDoctorStats(doctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Contar pacientes hospitalizados a cargo
    const hospitalizados = await prisma.admision.count({
      where: {
        estado: 'Activa',
        OR: [
          { responsableIngreso: doctorId },
          {
            evolucionesClinicas: {
              some: { doctorId },
            },
          },
        ],
      },
    });

    // Contar citas de consulta externa para hoy
    const citasHoy = await prisma.cita.count({
      where: {
        doctorId,
        fecha: {
          gte: today,
          lt: tomorrow,
        },
        estado: {
          in: ['PorAgendar', 'Programada', 'Confirmada', 'EnEspera'],
        },
      },
    });

    // Contar citas en espera
    const enEspera = await prisma.cita.count({
      where: {
        doctorId,
        fecha: {
          gte: today,
          lt: tomorrow,
        },
        estado: 'EnEspera',
      },
    });

    // Contar cirugías programadas para hoy
    const cirugias = await prisma.procedimiento.count({
      where: {
        medicoResponsableId: doctorId,
        fechaProgramada: {
          gte: today,
          lt: tomorrow,
        },
        estado: {
          in: ['Programado', 'EnCurso'],
        },
      },
    });

    return {
      hospitalizacion: hospitalizados,
      consultaExterna: citasHoy,
      enEspera,
      cirugias,
    };
  }
}

module.exports = new AdmisionService();
