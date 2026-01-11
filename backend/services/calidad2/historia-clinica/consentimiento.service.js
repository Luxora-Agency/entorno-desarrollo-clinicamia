const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

/**
 * Servicio para gestión de Consentimientos Informados
 * Biblioteca de plantillas y registro con firma digital
 */
class ConsentimientoService {
  // ==========================================
  // TIPOS DE CONSENTIMIENTO (Plantillas)
  // ==========================================

  /**
   * Obtener todos los tipos de consentimiento con filtros
   */
  async getAllTipos(filters = {}) {
    const {
      page = 1,
      limit = 20,
      servicio,
      estado,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      activo: true,
      ...(servicio && { servicio }),
      ...(estado && { estado }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
          { procedimiento: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.consentimientoTipo.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { servicio: 'asc' },
          { nombre: 'asc' },
        ],
      }),
      prisma.consentimientoTipo.count({ where }),
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
   * Obtener tipo de consentimiento por ID
   */
  async getTipoById(id) {
    const tipo = await prisma.consentimientoTipo.findUnique({
      where: { id },
      include: {
        aplicaciones: {
          where: { activo: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            paciente: {
              select: { id: true, nombre: true, apellido: true, documentoIdentidad: true },
            },
            medico: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        _count: {
          select: { aplicaciones: true },
        },
      },
    });

    if (!tipo || !tipo.activo) {
      throw new NotFoundError('Tipo de consentimiento no encontrado');
    }

    return tipo;
  }

  /**
   * Obtener tipo de consentimiento por código
   */
  async getTipoByCodigo(codigo) {
    const tipo = await prisma.consentimientoTipo.findUnique({
      where: { codigo },
    });

    if (!tipo || !tipo.activo) {
      throw new NotFoundError('Tipo de consentimiento no encontrado');
    }

    return tipo;
  }

  /**
   * Obtener tipos por servicio
   */
  async getTiposByServicio(servicio) {
    const tipos = await prisma.consentimientoTipo.findMany({
      where: {
        activo: true,
        servicio,
        estado: 'VIGENTE',
      },
      orderBy: { nombre: 'asc' },
    });

    return tipos;
  }

  /**
   * Crear nuevo tipo de consentimiento
   */
  async createTipo(data) {
    const { codigo } = data;

    // Verificar que no exista el código
    const existente = await prisma.consentimientoTipo.findUnique({
      where: { codigo },
    });

    if (existente) {
      throw new ValidationError('Ya existe un consentimiento con este código');
    }

    const tipo = await prisma.consentimientoTipo.create({
      data,
    });

    return tipo;
  }

  /**
   * Actualizar tipo de consentimiento
   */
  async updateTipo(id, data) {
    const tipo = await prisma.consentimientoTipo.findUnique({
      where: { id },
    });

    if (!tipo || !tipo.activo) {
      throw new NotFoundError('Tipo de consentimiento no encontrado');
    }

    // Si cambia el código, verificar que no exista
    if (data.codigo && data.codigo !== tipo.codigo) {
      const existente = await prisma.consentimientoTipo.findUnique({
        where: { codigo: data.codigo },
      });

      if (existente) {
        throw new ValidationError('Ya existe un consentimiento con este código');
      }
    }

    const actualizado = await prisma.consentimientoTipo.update({
      where: { id },
      data,
    });

    return actualizado;
  }

  /**
   * Eliminar tipo de consentimiento (soft delete)
   */
  async deleteTipo(id) {
    const tipo = await prisma.consentimientoTipo.findUnique({
      where: { id },
      include: {
        _count: {
          select: { aplicaciones: true },
        },
      },
    });

    if (!tipo || !tipo.activo) {
      throw new NotFoundError('Tipo de consentimiento no encontrado');
    }

    // Verificar si tiene aplicaciones
    if (tipo._count.aplicaciones > 0) {
      throw new ValidationError(
        `No se puede eliminar: tiene ${tipo._count.aplicaciones} aplicación(es) registrada(s)`
      );
    }

    await prisma.consentimientoTipo.update({
      where: { id },
      data: { activo: false },
    });

    return { success: true, message: 'Tipo de consentimiento eliminado correctamente' };
  }

  /**
   * Obtener estadísticas de tipos
   */
  async getStatsTipos() {
    const [
      total,
      vigentes,
      porServicio,
    ] = await Promise.all([
      prisma.consentimientoTipo.count({ where: { activo: true } }),

      prisma.consentimientoTipo.count({
        where: { activo: true, estado: 'VIGENTE' },
      }),

      prisma.consentimientoTipo.groupBy({
        by: ['servicio'],
        where: { activo: true },
        _count: true,
      }),
    ]);

    return {
      total,
      vigentes,
      porServicio: porServicio.reduce((acc, item) => {
        acc[item.servicio] = item._count;
        return acc;
      }, {}),
    };
  }

  // ==========================================
  // CONSENTIMIENTOS APLICADOS
  // ==========================================

  /**
   * Aplicar consentimiento a un paciente
   */
  async aplicar(data) {
    const {
      tipoId,
      pacienteId,
      medicoId,
      lugarAplicacion,
      riesgosExplicados,
      observaciones,
      firmaPaciente,
      firmaTestigo,
      firmaFamiliar,
      firmaMedico,
      ipOrigen,
      navegador,
      dispositivoId,
    } = data;

    // Verificar que el tipo existe
    const tipo = await prisma.consentimientoTipo.findUnique({
      where: { id: tipoId },
    });

    if (!tipo || !tipo.activo) {
      throw new NotFoundError('Tipo de consentimiento no encontrado');
    }

    // Validar firmas requeridas
    if (tipo.requiereFirma && !firmaPaciente) {
      throw new ValidationError('Se requiere la firma del paciente');
    }

    if (tipo.requiereTestigo && !firmaTestigo) {
      throw new ValidationError('Se requiere la firma del testigo');
    }

    if (tipo.requiereFamiliar && !firmaFamiliar) {
      throw new ValidationError('Se requiere la firma del familiar');
    }

    // Crear aplicación
    const aplicado = await prisma.consentimientoAplicado.create({
      data: {
        tipoId,
        pacienteId,
        medicoId,
        lugarAplicacion,
        riesgosExplicados,
        observaciones,
        firmaPaciente,
        firmaTestigo,
        firmaFamiliar,
        firmaMedico,
        ipOrigen,
        navegador,
        dispositivoId,
      },
      include: {
        tipo: true,
        paciente: {
          select: { id: true, nombre: true, apellido: true, documentoIdentidad: true },
        },
        medico: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return aplicado;
  }

  /**
   * Obtener todos los consentimientos aplicados con filtros
   */
  async getAllAplicados(filters = {}) {
    const {
      page = 1,
      limit = 20,
      pacienteId,
      medicoId,
      tipoId,
      fechaDesde,
      fechaHasta,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      activo: true,
      ...(pacienteId && { pacienteId }),
      ...(medicoId && { medicoId }),
      ...(tipoId && { tipoId }),
      ...(fechaDesde && {
        fechaAplicacion: {
          gte: new Date(fechaDesde),
        },
      }),
      ...(fechaHasta && {
        fechaAplicacion: {
          ...where.fechaAplicacion,
          lte: new Date(fechaHasta),
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.consentimientoAplicado.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaAplicacion: 'desc' },
        include: {
          tipo: true,
          paciente: {
            select: { id: true, nombre: true, apellido: true, documentoIdentidad: true },
          },
          medico: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
      }),
      prisma.consentimientoAplicado.count({ where }),
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
   * Obtener consentimiento aplicado por ID
   */
  async getAplicadoById(id) {
    const aplicado = await prisma.consentimientoAplicado.findUnique({
      where: { id },
      include: {
        tipo: true,
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            documentoIdentidad: true,
            fechaNacimiento: true,
            telefono: true,
            email: true,
          },
        },
        medico: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidad: true,
            registroMedico: true,
          },
        },
      },
    });

    if (!aplicado || !aplicado.activo) {
      throw new NotFoundError('Consentimiento aplicado no encontrado');
    }

    return aplicado;
  }

  /**
   * Obtener consentimientos aplicados de un paciente
   */
  async getByPaciente(pacienteId) {
    const consentimientos = await prisma.consentimientoAplicado.findMany({
      where: {
        activo: true,
        pacienteId,
      },
      orderBy: { fechaAplicacion: 'desc' },
      include: {
        tipo: true,
        medico: {
          select: { id: true, nombre: true, apellido: true, especialidad: true },
        },
      },
    });

    return consentimientos;
  }

  /**
   * Registrar/Actualizar firma
   */
  async registrarFirma(id, tipoFirma, firmaBase64) {
    const aplicado = await prisma.consentimientoAplicado.findUnique({
      where: { id },
    });

    if (!aplicado || !aplicado.activo) {
      throw new NotFoundError('Consentimiento aplicado no encontrado');
    }

    const campoFirma = {
      paciente: 'firmaPaciente',
      testigo: 'firmaTestigo',
      familiar: 'firmaFamiliar',
      medico: 'firmaMedico',
    }[tipoFirma];

    if (!campoFirma) {
      throw new ValidationError('Tipo de firma inválido');
    }

    const actualizado = await prisma.consentimientoAplicado.update({
      where: { id },
      data: { [campoFirma]: firmaBase64 },
    });

    return actualizado;
  }

  /**
   * Obtener estadísticas de consentimientos aplicados
   */
  async getStatsAplicados() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);

    const [
      total,
      esteMes,
      esteAnio,
      porTipo,
      porServicio,
    ] = await Promise.all([
      prisma.consentimientoAplicado.count({ where: { activo: true } }),

      prisma.consentimientoAplicado.count({
        where: {
          activo: true,
          fechaAplicacion: { gte: inicioMes },
        },
      }),

      prisma.consentimientoAplicado.count({
        where: {
          activo: true,
          fechaAplicacion: { gte: inicioAnio },
        },
      }),

      prisma.consentimientoAplicado.groupBy({
        by: ['tipoId'],
        where: { activo: true },
        _count: true,
      }),

      prisma.$queryRaw`
        SELECT ct.servicio, COUNT(*)::int as count
        FROM consentimientos_aplicados ca
        INNER JOIN consentimientos_tipo ct ON ca.tipo_id = ct.id
        WHERE ca.activo = true
        GROUP BY ct.servicio
        ORDER BY count DESC
      `,
    ]);

    return {
      total,
      esteMes,
      esteAnio,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoId] = item._count;
        return acc;
      }, {}),
      porServicio: porServicio.reduce((acc, item) => {
        acc[item.servicio] = item.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Generar PDF del consentimiento aplicado (para futuro)
   */
  async generarPDF(id) {
    const aplicado = await this.getAplicadoById(id);

    // TODO: Implementar generación de PDF con pdfkit
    // Incluir: plantilla, datos del paciente, firmas, fecha, médico, etc.

    return {
      success: true,
      message: 'Generación de PDF pendiente de implementación',
      data: aplicado,
    };
  }
}

module.exports = new ConsentimientoService();
