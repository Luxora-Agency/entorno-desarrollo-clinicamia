const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class AuditoriaService {
  /**
   * Crear nueva auditoría
   */
  async create(data, usuarioId) {
    if (!usuarioId) {
      throw new ValidationError('Usuario no autenticado');
    }

    const { tipo, codigo, nombre, fechaInicio, fechaFin, objetivo, alcance, equipo, estado } = data;

    // Validar que no exista una auditoría con el mismo código
    const existente = await prisma.auditoriaInfraestructura.findUnique({
      where: { codigo },
    });

    if (existente) {
      throw new ValidationError('Ya existe una auditoría con este código');
    }

    // Validar tipo
    if (!['INTERNA', 'EXTERNA'].includes(tipo)) {
      throw new ValidationError('Tipo de auditoría inválido. Debe ser INTERNA o EXTERNA');
    }

    // Validar estado
    const estadosValidos = ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];
    if (estado && !estadosValidos.includes(estado)) {
      throw new ValidationError(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    // Validar fechas
    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      throw new ValidationError('La fecha de fin no puede ser anterior a la fecha de inicio');
    }

    const auditoria = await prisma.auditoriaInfraestructura.create({
      data: {
        tipo,
        codigo,
        nombre,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        objetivo,
        alcance,
        equipo: equipo || [],
        hallazgos: data.hallazgos || null,
        conclusiones: data.conclusiones || null,
        estado: estado || 'PROGRAMADA',
        creador: {
          connect: { id: usuarioId }
        },
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        documentos: true,
      },
    });

    return auditoria;
  }

  /**
   * Obtener todas las auditorías con filtros
   */
  async findAll(filters = {}) {
    const { tipo, estado, anio, page = 1, limit = 20 } = filters;

    const where = {
      activo: true,
    };

    if (tipo) {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (anio) {
      const startDate = new Date(`${anio}-01-01`);
      const endDate = new Date(`${anio}-12-31`);
      where.fechaInicio = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [auditorias, total] = await Promise.all([
      prisma.auditoriaInfraestructura.findMany({
        where,
        include: {
          creador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          documentos: {
            select: {
              id: true,
              nombre: true,
              tipoDocumento: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { fechaInicio: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditoriaInfraestructura.count({ where }),
    ]);

    return {
      auditorias,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener auditoría por ID
   */
  async findById(id) {
    const auditoria = await prisma.auditoriaInfraestructura.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        documentos: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoría no encontrada');
    }

    return auditoria;
  }

  /**
   * Actualizar auditoría
   */
  async update(id, data) {
    const auditoria = await this.findById(id);

    // Validar tipo si se envía
    if (data.tipo && !['INTERNA', 'EXTERNA'].includes(data.tipo)) {
      throw new ValidationError('Tipo de auditoría inválido');
    }

    // Validar estado si se envía
    const estadosValidos = ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];
    if (data.estado && !estadosValidos.includes(data.estado)) {
      throw new ValidationError(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    // Validar código único si se cambia
    if (data.codigo && data.codigo !== auditoria.codigo) {
      const existente = await prisma.auditoriaInfraestructura.findUnique({
        where: { codigo: data.codigo },
      });
      if (existente) {
        throw new ValidationError('Ya existe una auditoría con este código');
      }
    }

    // Validar fechas
    if (data.fechaInicio || data.fechaFin) {
      const fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : auditoria.fechaInicio;
      const fechaFin = data.fechaFin ? new Date(data.fechaFin) : auditoria.fechaFin;

      if (fechaFin && fechaFin < fechaInicio) {
        throw new ValidationError('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
    }

    const updated = await prisma.auditoriaInfraestructura.update({
      where: { id },
      data: {
        tipo: data.tipo,
        codigo: data.codigo,
        nombre: data.nombre,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
        objetivo: data.objetivo,
        alcance: data.alcance,
        equipo: data.equipo,
        hallazgos: data.hallazgos,
        conclusiones: data.conclusiones,
        estado: data.estado,
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        documentos: true,
      },
    });

    return updated;
  }

  /**
   * Eliminar auditoría (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    await prisma.auditoriaInfraestructura.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Auditoría eliminada correctamente' };
  }

  /**
   * Cambiar estado de auditoría
   */
  async cambiarEstado(id, nuevoEstado) {
    const estadosValidos = ['PROGRAMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new ValidationError(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    const auditoria = await this.findById(id);

    // Si se completa, agregar fecha de fin si no existe
    const updateData = { estado: nuevoEstado };
    if (nuevoEstado === 'COMPLETADA' && !auditoria.fechaFin) {
      updateData.fechaFin = new Date();
    }

    const updated = await prisma.auditoriaInfraestructura.update({
      where: { id },
      data: updateData,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        documentos: true,
      },
    });

    return updated;
  }

  /**
   * Subir documento a auditoría
   */
  async uploadDocumento(auditoriaId, documentoData, usuarioId) {
    await this.findById(auditoriaId);

    const { nombre, descripcion, archivoUrl, archivoNombre, archivoTipo, tipoDocumento } = documentoData;

    // Validar tipo de documento
    const tiposValidos = ['PLAN', 'CHECKLIST', 'INFORME', 'EVIDENCIA', 'OTRO'];
    if (!tiposValidos.includes(tipoDocumento)) {
      throw new ValidationError(`Tipo de documento inválido. Debe ser uno de: ${tiposValidos.join(', ')}`);
    }

    const documento = await prisma.documentoAuditoriaInfraestructura.create({
      data: {
        auditoriaId,
        nombre,
        descripcion,
        archivoUrl,
        archivoNombre,
        archivoTipo,
        tipoDocumento,
        subidoPor: usuarioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return documento;
  }

  /**
   * Eliminar documento de auditoría
   */
  async deleteDocumento(documentoId) {
    const documento = await prisma.documentoAuditoriaInfraestructura.findUnique({
      where: { id: documentoId },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    await prisma.documentoAuditoriaInfraestructura.delete({
      where: { id: documentoId },
    });

    return { message: 'Documento eliminado correctamente' };
  }

  /**
   * Obtener auditorías próximas (programadas o en curso)
   */
  async getProximas(limit = 10) {
    const auditorias = await prisma.auditoriaInfraestructura.findMany({
      where: {
        activo: true,
        estado: {
          in: ['PROGRAMADA', 'EN_CURSO'],
        },
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        documentos: {
          select: {
            id: true,
            nombre: true,
            tipoDocumento: true,
          },
        },
      },
      orderBy: {
        fechaInicio: 'asc',
      },
      take: limit,
    });

    return auditorias;
  }

  /**
   * Obtener estadísticas de auditorías
   */
  async getEstadisticas(anio) {
    const where = {
      activo: true,
    };

    if (anio) {
      const startDate = new Date(`${anio}-01-01`);
      const endDate = new Date(`${anio}-12-31`);
      where.fechaInicio = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [
      total,
      internas,
      externas,
      programadas,
      enCurso,
      completadas,
      canceladas,
    ] = await Promise.all([
      prisma.auditoriaInfraestructura.count({ where }),
      prisma.auditoriaInfraestructura.count({ where: { ...where, tipo: 'INTERNA' } }),
      prisma.auditoriaInfraestructura.count({ where: { ...where, tipo: 'EXTERNA' } }),
      prisma.auditoriaInfraestructura.count({ where: { ...where, estado: 'PROGRAMADA' } }),
      prisma.auditoriaInfraestructura.count({ where: { ...where, estado: 'EN_CURSO' } }),
      prisma.auditoriaInfraestructura.count({ where: { ...where, estado: 'COMPLETADA' } }),
      prisma.auditoriaInfraestructura.count({ where: { ...where, estado: 'CANCELADA' } }),
    ]);

    return {
      total,
      porTipo: {
        internas,
        externas,
      },
      porEstado: {
        programadas,
        enCurso,
        completadas,
        canceladas,
      },
    };
  }

  /**
   * Obtener años disponibles
   */
  async getAniosDisponibles() {
    const auditorias = await prisma.auditoriaInfraestructura.findMany({
      where: { activo: true },
      select: { fechaInicio: true },
      orderBy: { fechaInicio: 'desc' },
    });

    const anios = [...new Set(auditorias.map(a => new Date(a.fechaInicio).getFullYear()))];
    return anios;
  }
}

module.exports = new AuditoriaService();
