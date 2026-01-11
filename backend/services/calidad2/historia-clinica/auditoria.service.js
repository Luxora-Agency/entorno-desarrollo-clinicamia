const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de Auditorías de Historia Clínica
 *
 * Funcionalidades:
 * - CRUD de auditorías HC (internas, externas, concurrentes, retrospectivas)
 * - Gestión de hallazgos por auditoría
 * - Control de acciones correctivas
 * - Estadísticas y reportes
 * - Cierre de auditorías
 */
class AuditoriaHCService {
  /**
   * Obtener todas las auditorías con filtros y paginación
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 10,
      tipo,
      estado,
      auditor,
      fechaDesde,
      fechaHasta,
      search
    } = filters;

    const skip = (page - 1) * limit;
    const where = { activo: true };

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (auditor) where.auditor = auditor;

    if (fechaDesde || fechaHasta) {
      where.fechaAuditoria = {};
      if (fechaDesde) where.fechaAuditoria.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaAuditoria.lte = new Date(fechaHasta);
    }

    if (search) {
      where.OR = [
        { areaAuditada: { contains: search, mode: 'insensitive' } },
        { observaciones: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [auditorias, total] = await Promise.all([
      prisma.auditoriaHC.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaAuditoria: 'desc' },
        include: {
          auditorUsuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          hallazgos: {
            select: {
              id: true,
              tipo: true,
              severidad: true,
              estado: true
            }
          },
          _count: {
            select: { hallazgos: true }
          }
        }
      }),
      prisma.auditoriaHC.count({ where })
    ]);

    return {
      auditorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener una auditoría por ID con todos sus hallazgos
   */
  async getById(id) {
    const auditoria = await prisma.auditoriaHC.findUnique({
      where: { id, activo: true },
      include: {
        auditorUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true
          }
        },
        hallazgos: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          include: {
            responsableUsuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    return auditoria;
  }

  /**
   * Crear nueva auditoría
   */
  async create(data) {
    const {
      tipo,
      fechaAuditoria,
      auditor,
      areaAuditada,
      historiasRevisadas,
      tamanoPoblacion,
      criterioSeleccion,
      observaciones
    } = data;

    // Validaciones básicas
    if (!tipo || !auditor || !areaAuditada) {
      throw new ValidationError('Tipo, auditor y área auditada son requeridos');
    }

    if (!fechaAuditoria) {
      throw new ValidationError('La fecha de auditoría es requerida');
    }

    // Verificar que el auditor existe
    const auditorExiste = await prisma.usuario.findUnique({
      where: { id: auditor }
    });

    if (!auditorExiste) {
      throw new NotFoundError('El auditor no existe');
    }

    const auditoria = await prisma.auditoriaHC.create({
      data: {
        tipo,
        fechaAuditoria: new Date(fechaAuditoria),
        auditor,
        areaAuditada,
        historiasRevisadas: historiasRevisadas || 0,
        tamanoPoblacion,
        criterioSeleccion,
        observaciones,
        estado: 'ABIERTA'
      },
      include: {
        auditorUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    return auditoria;
  }

  /**
   * Actualizar auditoría existente
   */
  async update(id, data) {
    const auditoriaExiste = await prisma.auditoriaHC.findUnique({
      where: { id, activo: true }
    });

    if (!auditoriaExiste) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    // No permitir actualizar si está cerrada
    if (auditoriaExiste.estado === 'CERRADA') {
      throw new ValidationError('No se puede actualizar una auditoría cerrada');
    }

    const {
      tipo,
      fechaAuditoria,
      areaAuditada,
      historiasRevisadas,
      tamanoPoblacion,
      criterioSeleccion,
      hallazgosPositivos,
      hallazgosNegativos,
      hallazgosCriticos,
      observaciones,
      conclusiones,
      planMejoramiento
    } = data;

    const auditoria = await prisma.auditoriaHC.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(fechaAuditoria && { fechaAuditoria: new Date(fechaAuditoria) }),
        ...(areaAuditada && { areaAuditada }),
        ...(historiasRevisadas !== undefined && { historiasRevisadas }),
        ...(tamanoPoblacion !== undefined && { tamanoPoblacion }),
        ...(criterioSeleccion !== undefined && { criterioSeleccion }),
        ...(hallazgosPositivos !== undefined && { hallazgosPositivos }),
        ...(hallazgosNegativos !== undefined && { hallazgosNegativos }),
        ...(hallazgosCriticos !== undefined && { hallazgosCriticos }),
        ...(observaciones !== undefined && { observaciones }),
        ...(conclusiones !== undefined && { conclusiones }),
        ...(planMejoramiento !== undefined && { planMejoramiento })
      },
      include: {
        auditorUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: { hallazgos: true }
        }
      }
    });

    return auditoria;
  }

  /**
   * Eliminar auditoría (soft delete)
   */
  async delete(id) {
    const auditoria = await prisma.auditoriaHC.findUnique({
      where: { id, activo: true }
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    await prisma.auditoriaHC.update({
      where: { id },
      data: { activo: false }
    });

    return { message: 'Auditoría eliminada exitosamente' };
  }

  // ==========================================
  // GESTIÓN DE HALLAZGOS
  // ==========================================

  /**
   * Crear hallazgo en una auditoría
   */
  async createHallazgo(auditoriaId, data) {
    const {
      tipo,
      severidad,
      criterio,
      descripcion,
      evidencia,
      accionCorrectiva,
      responsable,
      fechaLimite
    } = data;

    // Validar que la auditoría existe y está abierta
    const auditoria = await prisma.auditoriaHC.findUnique({
      where: { id: auditoriaId, activo: true }
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    if (auditoria.estado === 'CERRADA') {
      throw new ValidationError('No se pueden agregar hallazgos a una auditoría cerrada');
    }

    // Validaciones
    if (!tipo || !severidad || !criterio || !descripcion) {
      throw new ValidationError('Tipo, severidad, criterio y descripción son requeridos');
    }

    const hallazgo = await prisma.hallazgoHC.create({
      data: {
        auditoriaId,
        tipo,
        severidad,
        criterio,
        descripcion,
        evidencia,
        accionCorrectiva,
        responsable,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        estado: 'ABIERTO'
      },
      include: {
        responsableUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    // Actualizar contadores de la auditoría
    await this._actualizarContadoresAuditoria(auditoriaId);

    return hallazgo;
  }

  /**
   * Obtener todos los hallazgos de una auditoría
   */
  async getHallazgosByAuditoria(auditoriaId, filters = {}) {
    const { tipo, severidad, estado } = filters;

    const where = {
      auditoriaId,
      activo: true
    };

    if (tipo) where.tipo = tipo;
    if (severidad) where.severidad = severidad;
    if (estado) where.estado = estado;

    const hallazgos = await prisma.hallazgoHC.findMany({
      where,
      orderBy: [
        { severidad: 'asc' }, // CRITICA primero
        { createdAt: 'desc' }
      ],
      include: {
        responsableUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    return hallazgos;
  }

  /**
   * Actualizar hallazgo
   */
  async updateHallazgo(hallazgoId, data) {
    const hallazgo = await prisma.hallazgoHC.findUnique({
      where: { id: hallazgoId, activo: true }
    });

    if (!hallazgo) {
      throw new NotFoundError('Hallazgo no encontrado');
    }

    const {
      tipo,
      severidad,
      criterio,
      descripcion,
      evidencia,
      accionCorrectiva,
      responsable,
      fechaLimite,
      estado,
      verificacion
    } = data;

    const hallazgoActualizado = await prisma.hallazgoHC.update({
      where: { id: hallazgoId },
      data: {
        ...(tipo && { tipo }),
        ...(severidad && { severidad }),
        ...(criterio && { criterio }),
        ...(descripcion && { descripcion }),
        ...(evidencia !== undefined && { evidencia }),
        ...(accionCorrectiva !== undefined && { accionCorrectiva }),
        ...(responsable !== undefined && { responsable }),
        ...(fechaLimite !== undefined && { fechaLimite: fechaLimite ? new Date(fechaLimite) : null }),
        ...(estado && { estado }),
        ...(verificacion !== undefined && { verificacion }),
        ...(estado === 'CERRADO' && { fechaCierre: new Date() })
      },
      include: {
        responsableUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Actualizar contadores de la auditoría
    await this._actualizarContadoresAuditoria(hallazgo.auditoriaId);

    return hallazgoActualizado;
  }

  /**
   * Cerrar auditoría
   */
  async cerrarAuditoria(id, data) {
    const { conclusiones, planMejoramiento } = data;

    const auditoria = await prisma.auditoriaHC.findUnique({
      where: { id, activo: true },
      include: {
        hallazgos: {
          where: { activo: true }
        }
      }
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    if (auditoria.estado === 'CERRADA') {
      throw new ValidationError('La auditoría ya está cerrada');
    }

    // Verificar que todos los hallazgos críticos estén cerrados
    const hallazgosCriticosAbiertos = auditoria.hallazgos.filter(
      h => h.severidad === 'CRITICA' && h.estado !== 'CERRADO' && h.estado !== 'VERIFICADO'
    );

    if (hallazgosCriticosAbiertos.length > 0) {
      throw new ValidationError(
        `No se puede cerrar la auditoría. Hay ${hallazgosCriticosAbiertos.length} hallazgos críticos sin cerrar`
      );
    }

    const auditoriaCerrada = await prisma.auditoriaHC.update({
      where: { id },
      data: {
        estado: 'CERRADA',
        fechaCierre: new Date(),
        conclusiones,
        planMejoramiento
      },
      include: {
        auditorUsuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        _count: {
          select: { hallazgos: true }
        }
      }
    });

    return auditoriaCerrada;
  }

  /**
   * Obtener estadísticas de auditorías
   */
  async getStats(filters = {}) {
    const { anio, auditor } = filters;
    const where = { activo: true };

    if (anio) {
      const inicioAnio = new Date(`${anio}-01-01`);
      const finAnio = new Date(`${anio}-12-31`);
      where.fechaAuditoria = {
        gte: inicioAnio,
        lte: finAnio
      };
    }

    if (auditor) {
      where.auditor = auditor;
    }

    const [
      total,
      abiertas,
      cerradas,
      porTipo,
      hallazgosCriticos,
      auditorias
    ] = await Promise.all([
      prisma.auditoriaHC.count({ where }),
      prisma.auditoriaHC.count({ where: { ...where, estado: 'ABIERTA' } }),
      prisma.auditoriaHC.count({ where: { ...where, estado: 'CERRADA' } }),
      prisma.auditoriaHC.groupBy({
        by: ['tipo'],
        where,
        _count: { id: true }
      }),
      prisma.auditoriaHC.aggregate({
        where,
        _sum: { hallazgosCriticos: true }
      }),
      prisma.auditoriaHC.findMany({
        where,
        select: {
          hallazgosPositivos: true,
          hallazgosNegativos: true,
          hallazgosCriticos: true
        }
      })
    ]);

    // Calcular totales de hallazgos
    const totalHallazgos = auditorias.reduce((acc, a) => {
      return {
        positivos: acc.positivos + (a.hallazgosPositivos || 0),
        negativos: acc.negativos + (a.hallazgosNegativos || 0),
        criticos: acc.criticos + (a.hallazgosCriticos || 0)
      };
    }, { positivos: 0, negativos: 0, criticos: 0 });

    return {
      total,
      abiertas,
      cerradas,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count.id;
        return acc;
      }, {}),
      hallazgos: totalHallazgos,
      hallazgosCriticosTotal: hallazgosCriticos._sum.hallazgosCriticos || 0
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Actualizar contadores de hallazgos en la auditoría
   * @private
   */
  async _actualizarContadoresAuditoria(auditoriaId) {
    const hallazgos = await prisma.hallazgoHC.findMany({
      where: {
        auditoriaId,
        activo: true
      },
      select: {
        tipo: true,
        severidad: true
      }
    });

    const positivos = hallazgos.filter(h => h.tipo === 'FORTALEZA').length;
    const negativos = hallazgos.filter(h =>
      h.tipo === 'OPORTUNIDAD_MEJORA' ||
      h.tipo === 'NO_CONFORMIDAD_MENOR' ||
      h.tipo === 'NO_CONFORMIDAD_MAYOR'
    ).length;
    const criticos = hallazgos.filter(h => h.severidad === 'CRITICA').length;

    await prisma.auditoriaHC.update({
      where: { id: auditoriaId },
      data: {
        hallazgosPositivos: positivos,
        hallazgosNegativos: negativos,
        hallazgosCriticos: criticos
      }
    });
  }
}

module.exports = new AuditoriaHCService();
