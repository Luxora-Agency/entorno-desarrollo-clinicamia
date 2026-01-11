const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ManifiestoRecoleccionService {
  /**
   * Crear nuevo manifiesto
   */
  async create(data, usuarioId) {
    if (!usuarioId) {
      throw new ValidationError('Usuario no autenticado');
    }

    const { numeroManifiesto, fecha, empresaRecolectora, tipoResiduo, cantidadKg, responsable, observaciones, archivoUrl, archivoNombre } = data;

    // Validar número único
    const existente = await prisma.manifiestoRecoleccion.findUnique({
      where: { numeroManifiesto },
    });

    if (existente) {
      throw new ValidationError('Ya existe un manifiesto con este número');
    }

    // Validar tipo de residuo
    if (!['PELIGROSO', 'NO_PELIGROSO'].includes(tipoResiduo)) {
      throw new ValidationError('Tipo de residuo inválido. Debe ser PELIGROSO o NO_PELIGROSO');
    }

    // Validar cantidad
    if (cantidadKg <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a 0');
    }

    const manifiesto = await prisma.manifiestoRecoleccion.create({
      data: {
        numeroManifiesto,
        fecha: new Date(fecha),
        empresaRecolectora,
        tipoResiduo,
        cantidadKg: parseFloat(cantidadKg),
        responsable,
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

    return manifiesto;
  }

  /**
   * Obtener todos los manifiestos con filtros
   */
  async findAll(filters = {}) {
    const { tipoResiduo, anio, mes, page = 1, limit = 20 } = filters;

    const where = {
      activo: true,
    };

    if (tipoResiduo) {
      where.tipoResiduo = tipoResiduo;
    }

    if (anio) {
      const startDate = new Date(`${anio}-01-01`);
      const endDate = new Date(`${anio}-12-31`);
      where.fecha = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (mes && anio) {
      const startDate = new Date(anio, mes - 1, 1);
      const endDate = new Date(anio, mes, 0);
      where.fecha = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [manifiestos, total] = await Promise.all([
      prisma.manifiestoRecoleccion.findMany({
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
      prisma.manifiestoRecoleccion.count({ where }),
    ]);

    return {
      manifiestos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener manifiesto por ID
   */
  async findById(id) {
    const manifiesto = await prisma.manifiestoRecoleccion.findUnique({
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

    if (!manifiesto) {
      throw new NotFoundError('Manifiesto no encontrado');
    }

    return manifiesto;
  }

  /**
   * Actualizar manifiesto
   */
  async update(id, data) {
    await this.findById(id);

    // Validar número único si se cambia
    if (data.numeroManifiesto) {
      const existente = await prisma.manifiestoRecoleccion.findFirst({
        where: {
          numeroManifiesto: data.numeroManifiesto,
          NOT: { id },
        },
      });

      if (existente) {
        throw new ValidationError('Ya existe un manifiesto con este número');
      }
    }

    // Validar tipo si se envía
    if (data.tipoResiduo && !['PELIGROSO', 'NO_PELIGROSO'].includes(data.tipoResiduo)) {
      throw new ValidationError('Tipo de residuo inválido');
    }

    // Validar cantidad si se envía
    if (data.cantidadKg !== undefined && data.cantidadKg <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a 0');
    }

    const updated = await prisma.manifiestoRecoleccion.update({
      where: { id },
      data: {
        numeroManifiesto: data.numeroManifiesto,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        empresaRecolectora: data.empresaRecolectora,
        tipoResiduo: data.tipoResiduo,
        cantidadKg: data.cantidadKg ? parseFloat(data.cantidadKg) : undefined,
        responsable: data.responsable,
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
   * Eliminar manifiesto (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    await prisma.manifiestoRecoleccion.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Manifiesto eliminado correctamente' };
  }

  /**
   * Obtener totales por tipo de residuo
   */
  async getTotalesPorTipo(anio, mes) {
    const where = {
      activo: true,
    };

    if (anio) {
      if (mes) {
        const startDate = new Date(anio, mes - 1, 1);
        const endDate = new Date(anio, mes, 0);
        where.fecha = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        const startDate = new Date(`${anio}-01-01`);
        const endDate = new Date(`${anio}-12-31`);
        where.fecha = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const [peligrosos, noPeligrosos] = await Promise.all([
      prisma.manifiestoRecoleccion.aggregate({
        where: { ...where, tipoResiduo: 'PELIGROSO' },
        _sum: { cantidadKg: true },
        _count: true,
      }),
      prisma.manifiestoRecoleccion.aggregate({
        where: { ...where, tipoResiduo: 'NO_PELIGROSO' },
        _sum: { cantidadKg: true },
        _count: true,
      }),
    ]);

    return {
      peligrosos: {
        cantidad: peligrosos._count || 0,
        totalKg: peligrosos._sum.cantidadKg || 0,
      },
      noPeligrosos: {
        cantidad: noPeligrosos._count || 0,
        totalKg: noPeligrosos._sum.cantidadKg || 0,
      },
    };
  }
}

module.exports = new ManifiestoRecoleccionService();
