const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ActaDesactivacionService {
  /**
   * Crear nueva acta
   */
  async create(data, usuarioId) {
    if (!usuarioId) {
      throw new ValidationError('Usuario no autenticado');
    }

    const { numeroActa, fecha, tipoEquipo, numeroSerie, motivoDesactivacion, responsable, testigos, observaciones, archivoUrl, archivoNombre } = data;

    // Validar número único
    const existente = await prisma.actaDesactivacion.findUnique({
      where: { numeroActa },
    });

    if (existente) {
      throw new ValidationError('Ya existe un acta con este número');
    }

    // Validar testigos (debe haber al menos 1)
    if (!testigos || testigos.length === 0) {
      throw new ValidationError('Debe haber al menos un testigo');
    }

    const acta = await prisma.actaDesactivacion.create({
      data: {
        numeroActa,
        fecha: new Date(fecha),
        tipoEquipo,
        numeroSerie: numeroSerie || null,
        motivoDesactivacion,
        responsable,
        testigos,
        observaciones: observaciones || null,
        archivoUrl: archivoUrl || null,
        archivoNombre: archivoNombre || null,
        registradoPor: usuarioId,
      },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return acta;
  }

  /**
   * Obtener todas las actas con filtros
   */
  async findAll(filters = {}) {
    const { tipoEquipo, anio, page = 1, limit = 20 } = filters;

    const where = {
      activo: true,
    };

    if (tipoEquipo) {
      where.tipoEquipo = {
        contains: tipoEquipo,
        mode: 'insensitive',
      };
    }

    if (anio) {
      const startDate = new Date(`${anio}-01-01`);
      const endDate = new Date(`${anio}-12-31`);
      where.fecha = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [actas, total] = await Promise.all([
      prisma.actaDesactivacion.findMany({
        where,
        include: {
          registrador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.actaDesactivacion.count({ where }),
    ]);

    return {
      actas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener acta por ID
   */
  async findById(id) {
    const acta = await prisma.actaDesactivacion.findUnique({
      where: { id },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!acta) {
      throw new NotFoundError('Acta no encontrada');
    }

    return acta;
  }

  /**
   * Actualizar acta
   */
  async update(id, data) {
    await this.findById(id);

    // Validar número único si se cambia
    if (data.numeroActa) {
      const existente = await prisma.actaDesactivacion.findFirst({
        where: {
          numeroActa: data.numeroActa,
          NOT: { id },
        },
      });

      if (existente) {
        throw new ValidationError('Ya existe un acta con este número');
      }
    }

    // Validar testigos si se envían
    if (data.testigos && data.testigos.length === 0) {
      throw new ValidationError('Debe haber al menos un testigo');
    }

    const updated = await prisma.actaDesactivacion.update({
      where: { id },
      data: {
        numeroActa: data.numeroActa,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        tipoEquipo: data.tipoEquipo,
        numeroSerie: data.numeroSerie,
        motivoDesactivacion: data.motivoDesactivacion,
        responsable: data.responsable,
        testigos: data.testigos,
        observaciones: data.observaciones,
        archivoUrl: data.archivoUrl,
        archivoNombre: data.archivoNombre,
      },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Eliminar acta (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    await prisma.actaDesactivacion.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Acta eliminada correctamente' };
  }

  /**
   * Obtener estadísticas por tipo de equipo
   */
  async getEstadisticasPorTipo(anio) {
    const where = {
      activo: true,
    };

    if (anio) {
      const startDate = new Date(`${anio}-01-01`);
      const endDate = new Date(`${anio}-12-31`);
      where.fecha = {
        gte: startDate,
        lte: endDate,
      };
    }

    const actas = await prisma.actaDesactivacion.findMany({
      where,
      select: {
        tipoEquipo: true,
      },
    });

    // Agrupar por tipo de equipo
    const grupos = {};
    actas.forEach(acta => {
      const tipo = acta.tipoEquipo;
      if (!grupos[tipo]) {
        grupos[tipo] = 0;
      }
      grupos[tipo]++;
    });

    // Convertir a array ordenado
    const estadisticas = Object.entries(grupos)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      total: actas.length,
      porTipo: estadisticas,
    };
  }

  /**
   * Obtener años disponibles
   */
  async getAniosDisponibles() {
    const actas = await prisma.actaDesactivacion.findMany({
      where: { activo: true },
      select: { fecha: true },
      orderBy: { fecha: 'desc' },
    });

    const anios = [...new Set(actas.map(a => new Date(a.fecha).getFullYear()))];
    return anios;
  }
}

module.exports = new ActaDesactivacionService();
