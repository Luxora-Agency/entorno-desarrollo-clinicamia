const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de Certificaciones de Historia Clínica
 * Controla vigencias de certificaciones de software HC, habilitación, acreditación, etc.
 * Genera alertas automáticas de vencimiento
 */
class CertificacionHCService {
  /**
   * Obtener todas las certificaciones con filtros
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      tipo,
      estado,
      search,
      responsable,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      activo: true,
      ...(tipo && { tipo }),
      ...(estado && { estado }),
      ...(responsable && { responsable }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { entidadEmisora: { contains: search, mode: 'insensitive' } },
          { numeroRegistro: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.certificacionHC.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { estado: 'asc' },
          { fechaVencimiento: 'asc' },
        ],
        include: {
          responsableUsuario: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
      }),
      prisma.certificacionHC.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener certificación por ID
   */
  async getById(id) {
    const certificacion = await prisma.certificacionHC.findUnique({
      where: { id },
      include: {
        responsableUsuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!certificacion || !certificacion.activo) {
      throw new NotFoundError('Certificación no encontrada');
    }

    const hoy = new Date();
    const diasParaVencer = Math.ceil(
      (new Date(certificacion.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24)
    );

    return {
      ...certificacion,
      diasParaVencer,
    };
  }

  /**
   * Crear nueva certificación
   */
  async create(data) {
    const { numeroRegistro } = data;

    if (numeroRegistro) {
      const existente = await prisma.certificacionHC.findFirst({
        where: {
          numeroRegistro,
          activo: true,
        },
      });

      if (existente) {
        throw new ValidationError('Ya existe una certificación con este número de registro');
      }
    }

    const estado = this._calcularEstado(data.fechaVencimiento);

    const certificacion = await prisma.certificacionHC.create({
      data: {
        ...data,
        estado,
      },
      include: {
        responsableUsuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return certificacion;
  }

  /**
   * Actualizar certificación
   */
  async update(id, data) {
    const certificacion = await prisma.certificacionHC.findUnique({
      where: { id },
    });

    if (!certificacion || !certificacion.activo) {
      throw new NotFoundError('Certificación no encontrada');
    }

    let updateData = { ...data };
    if (data.fechaVencimiento) {
      updateData.estado = this._calcularEstado(data.fechaVencimiento);
      updateData.alertaGenerada60 = false;
      updateData.alertaGenerada30 = false;
      updateData.alertaGenerada15 = false;
    }

    const actualizada = await prisma.certificacionHC.update({
      where: { id },
      data: updateData,
      include: {
        responsableUsuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return actualizada;
  }

  /**
   * Eliminar certificación (soft delete)
   */
  async delete(id) {
    const certificacion = await prisma.certificacionHC.findUnique({
      where: { id },
    });

    if (!certificacion || !certificacion.activo) {
      throw new NotFoundError('Certificación no encontrada');
    }

    await prisma.certificacionHC.update({
      where: { id },
      data: { activo: false },
    });

    return { success: true, message: 'Certificación eliminada correctamente' };
  }

  /**
   * Obtener certificaciones próximas a vencer
   */
  async getVencimientos(diasAnticipacion = 60) {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    const certificaciones = await prisma.certificacionHC.findMany({
      where: {
        activo: true,
        fechaVencimiento: {
          gte: hoy,
          lte: fechaLimite,
        },
        estado: {
          in: ['VIGENTE', 'EN_RENOVACION'],
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        responsableUsuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return certificaciones.map((cert) => ({
      ...cert,
      diasParaVencer: Math.ceil(
        (new Date(cert.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24)
      ),
    }));
  }

  /**
   * Obtener estadísticas de certificaciones
   */
  async getStats() {
    const hoy = new Date();

    const [
      total,
      vigentes,
      enRenovacion,
      vencidas,
      porTipo,
      proximasVencer30,
      proximasVencer60,
    ] = await Promise.all([
      prisma.certificacionHC.count({ where: { activo: true } }),

      prisma.certificacionHC.count({
        where: { activo: true, estado: 'VIGENTE' },
      }),

      prisma.certificacionHC.count({
        where: { activo: true, estado: 'EN_RENOVACION' },
      }),

      prisma.certificacionHC.count({
        where: { activo: true, estado: 'VENCIDA' },
      }),

      prisma.certificacionHC.groupBy({
        by: ['tipo'],
        where: { activo: true },
        _count: true,
      }),

      prisma.certificacionHC.count({
        where: {
          activo: true,
          fechaVencimiento: {
            gte: hoy,
            lte: new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.certificacionHC.count({
        where: {
          activo: true,
          fechaVencimiento: {
            gte: hoy,
            lte: new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      vigentes,
      enRenovacion,
      vencidas,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      proximasVencer30,
      proximasVencer60,
    };
  }

  /**
   * Verificar y generar alertas de vencimiento (para cron job)
   */
  async checkAndGenerateAlerts() {
    const hoy = new Date();
    const alertasGeneradas = [];

    const certificaciones = await prisma.certificacionHC.findMany({
      where: {
        activo: true,
        estado: { in: ['VIGENTE', 'EN_RENOVACION'] },
      },
      include: {
        responsableUsuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    for (const cert of certificaciones) {
      const diasParaVencer = Math.ceil(
        (new Date(cert.fechaVencimiento) - hoy) / (1000 * 60 * 60 * 24)
      );

      if (diasParaVencer <= 60 && diasParaVencer > 30 && !cert.alertaGenerada60) {
        await prisma.certificacionHC.update({
          where: { id: cert.id },
          data: {
            alertaGenerada60: true,
            estado: 'EN_RENOVACION',
          },
        });
        alertasGeneradas.push({
          certificacionId: cert.id,
          nombre: cert.nombre,
          diasParaVencer,
          tipo: '60_DIAS',
          responsable: cert.responsableUsuario,
        });
      }

      if (diasParaVencer <= 30 && diasParaVencer > 15 && !cert.alertaGenerada30) {
        await prisma.certificacionHC.update({
          where: { id: cert.id },
          data: {
            alertaGenerada30: true,
            estado: 'EN_RENOVACION',
          },
        });
        alertasGeneradas.push({
          certificacionId: cert.id,
          nombre: cert.nombre,
          diasParaVencer,
          tipo: '30_DIAS',
          responsable: cert.responsableUsuario,
        });
      }

      if (diasParaVencer <= 15 && diasParaVencer > 0 && !cert.alertaGenerada15) {
        await prisma.certificacionHC.update({
          where: { id: cert.id },
          data: {
            alertaGenerada15: true,
            estado: 'EN_RENOVACION',
          },
        });
        alertasGeneradas.push({
          certificacionId: cert.id,
          nombre: cert.nombre,
          diasParaVencer,
          tipo: '15_DIAS',
          responsable: cert.responsableUsuario,
        });
      }

      if (diasParaVencer <= 0 && cert.estado !== 'VENCIDA') {
        await prisma.certificacionHC.update({
          where: { id: cert.id },
          data: { estado: 'VENCIDA' },
        });
        alertasGeneradas.push({
          certificacionId: cert.id,
          nombre: cert.nombre,
          diasParaVencer,
          tipo: 'VENCIDA',
          responsable: cert.responsableUsuario,
        });
      }
    }

    return {
      success: true,
      alertasGeneradas: alertasGeneradas.length,
      detalles: alertasGeneradas,
    };
  }

  /**
   * Calcular estado según fecha de vencimiento
   * @private
   */
  _calcularEstado(fechaVencimiento) {
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    const diasParaVencer = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

    if (diasParaVencer <= 0) {
      return 'VENCIDA';
    } else if (diasParaVencer <= 60) {
      return 'EN_RENOVACION';
    } else {
      return 'VIGENTE';
    }
  }
}

module.exports = new CertificacionHCService();
