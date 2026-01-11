/**
 * Service de Comités Institucionales
 * Gestión de comités, integrantes, reuniones y compromisos
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ComiteService {
  // ==========================================
  // COMITÉS INSTITUCIONALES
  // ==========================================

  /**
   * Obtener todos los comités
   */
  async getComites(query = {}) {
    const { activo = true } = query;

    const where = {
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
    };

    const comites = await prisma.comiteInstitucional.findMany({
      where,
      include: {
        _count: {
          select: {
            integrantes: { where: { activo: true } },
            reuniones: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return comites;
  }

  /**
   * Obtener comité por ID
   */
  async getComiteById(id) {
    const comite = await prisma.comiteInstitucional.findUnique({
      where: { id },
      include: {
        integrantes: {
          where: { activo: true },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, email: true, rol: true },
            },
          },
          orderBy: { rol: 'asc' },
        },
        reuniones: {
          orderBy: { fechaProgramada: 'desc' },
          take: 10,
        },
      },
    });

    if (!comite) {
      throw new NotFoundError('Comité no encontrado');
    }

    return comite;
  }

  /**
   * Crear comité institucional
   */
  async createComite(data) {
    const { nombre, codigo, normativaBase, objetivo, periodicidad } = data;

    // Validar código único
    const existing = await prisma.comiteInstitucional.findUnique({ where: { codigo } });
    if (existing) {
      throw new ValidationError('Ya existe un comité con este código');
    }

    return prisma.comiteInstitucional.create({
      data: {
        nombre,
        codigo,
        normativaBase,
        objetivo,
        periodicidad,
      },
    });
  }

  /**
   * Actualizar comité
   */
  async updateComite(id, data) {
    const comite = await prisma.comiteInstitucional.findUnique({ where: { id } });
    if (!comite) {
      throw new NotFoundError('Comité no encontrado');
    }

    return prisma.comiteInstitucional.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // INTEGRANTES
  // ==========================================

  /**
   * Agregar integrante a comité
   */
  async agregarIntegrante(data) {
    const { comiteId, usuarioId, rol, actaDesignacion } = data;

    // Validar comité
    const comite = await prisma.comiteInstitucional.findUnique({ where: { id: comiteId } });
    if (!comite) {
      throw new NotFoundError('Comité no encontrado');
    }

    // Validar usuario
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar si ya es integrante activo
    const existingIntegrante = await prisma.integranteComite.findFirst({
      where: { comiteId, usuarioId, activo: true },
    });
    if (existingIntegrante) {
      throw new ValidationError('El usuario ya es integrante activo del comité');
    }

    // Si el rol es Presidente, verificar que no haya otro
    if (rol === 'Presidente') {
      const presidenteActual = await prisma.integranteComite.findFirst({
        where: { comiteId, rol: 'Presidente', activo: true },
      });
      if (presidenteActual) {
        throw new ValidationError('El comité ya tiene un presidente activo');
      }
    }

    return prisma.integranteComite.create({
      data: {
        comiteId,
        usuarioId,
        rol,
        actaDesignacion,
        fechaIngreso: new Date(),
        activo: true,
      },
      include: {
        usuario: { select: { nombre: true, apellido: true, email: true } },
        comite: { select: { nombre: true } },
      },
    });
  }

  /**
   * Retirar integrante de comité
   */
  async retirarIntegrante(id) {
    const integrante = await prisma.integranteComite.findUnique({ where: { id } });
    if (!integrante) {
      throw new NotFoundError('Integrante no encontrado');
    }

    return prisma.integranteComite.update({
      where: { id },
      data: {
        activo: false,
        fechaRetiro: new Date(),
      },
    });
  }

  /**
   * Obtener integrantes de un comité
   */
  async getIntegrantes(comiteId, incluirInactivos = false) {
    const where = {
      comiteId,
      ...(incluirInactivos ? {} : { activo: true }),
    };

    return prisma.integranteComite.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true, rol: true },
        },
      },
      orderBy: [{ activo: 'desc' }, { rol: 'asc' }, { fechaIngreso: 'asc' }],
    });
  }

  // ==========================================
  // REUNIONES
  // ==========================================

  /**
   * Obtener reuniones
   */
  async getReuniones(query = {}) {
    const { page = 1, limit = 10, comiteId, estado, fechaDesde, fechaHasta } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(comiteId && { comiteId }),
      ...(estado && { estado }),
      ...(fechaDesde || fechaHasta
        ? {
            fechaProgramada: {
              ...(fechaDesde && { gte: new Date(fechaDesde) }),
              ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
          }
        : {}),
    };

    const [reuniones, total] = await Promise.all([
      prisma.reunionComite.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          comite: { select: { id: true, nombre: true, codigo: true } },
          _count: { select: { seguimientoCompromisos: true } },
        },
        orderBy: { fechaProgramada: 'desc' },
      }),
      prisma.reunionComite.count({ where }),
    ]);

    return {
      reuniones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener reunión por ID
   */
  async getReunionById(id) {
    const reunion = await prisma.reunionComite.findUnique({
      where: { id },
      include: {
        comite: {
          include: {
            integrantes: {
              where: { activo: true },
              include: {
                usuario: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
        seguimientoCompromisos: {
          include: {
            responsable: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaLimite: 'asc' },
        },
      },
    });

    if (!reunion) {
      throw new NotFoundError('Reunión no encontrada');
    }

    return reunion;
  }

  /**
   * Programar reunión
   */
  async programarReunion(data) {
    const {
      comiteId,
      fechaProgramada,
      lugar,
      ordenDelDia,
    } = data;

    const comite = await prisma.comiteInstitucional.findUnique({ where: { id: comiteId } });
    if (!comite) {
      throw new NotFoundError('Comité no encontrado');
    }

    // Generar número de acta
    const ultimaReunion = await prisma.reunionComite.findFirst({
      where: { comiteId },
      orderBy: { numeroActa: 'desc' },
    });

    const ultimoNumero = ultimaReunion
      ? parseInt(ultimaReunion.numeroActa.split('-').pop()) || 0
      : 0;
    const nuevoNumeroActa = `${comite.codigo}-${new Date().getFullYear()}-${String(ultimoNumero + 1).padStart(3, '0')}`;

    return prisma.reunionComite.create({
      data: {
        comiteId,
        numeroActa: nuevoNumeroActa,
        fechaProgramada: new Date(fechaProgramada),
        lugar,
        ordenDelDia,
        estado: 'Programada',
      },
      include: {
        comite: { select: { nombre: true } },
      },
    });
  }

  /**
   * Registrar reunión realizada
   */
  async registrarReunion(id, data) {
    const {
      fechaRealizacion,
      asistentes,
      invitados,
      temasDiscutidos,
      decisiones,
      compromisos,
      actaUrl,
    } = data;

    const reunion = await prisma.reunionComite.findUnique({ where: { id } });
    if (!reunion) {
      throw new NotFoundError('Reunión no encontrada');
    }

    // Actualizar reunión
    const reunionActualizada = await prisma.reunionComite.update({
      where: { id },
      data: {
        fechaRealizacion: fechaRealizacion ? new Date(fechaRealizacion) : new Date(),
        asistentes,
        invitados,
        temasDiscutidos,
        decisiones,
        compromisos,
        actaUrl,
        estado: 'Realizada',
      },
    });

    // Crear compromisos si se proporcionan
    if (compromisos && Array.isArray(compromisos)) {
      for (const compromiso of compromisos) {
        await prisma.compromisoComite.create({
          data: {
            reunionId: id,
            descripcion: compromiso.descripcion,
            responsableId: compromiso.responsableId,
            fechaLimite: new Date(compromiso.fechaLimite),
            estado: 'Pendiente',
          },
        });
      }
    }

    return reunionActualizada;
  }

  /**
   * Cancelar reunión
   */
  async cancelarReunion(id, motivo) {
    const reunion = await prisma.reunionComite.findUnique({ where: { id } });
    if (!reunion) {
      throw new NotFoundError('Reunión no encontrada');
    }

    return prisma.reunionComite.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        temasDiscutidos: { motivo_cancelacion: motivo },
      },
    });
  }

  // ==========================================
  // COMPROMISOS
  // ==========================================

  /**
   * Obtener compromisos pendientes
   */
  async getCompromisosPendientes(query = {}) {
    const { comiteId, responsableId, vencidos } = query;

    let where = {
      estado: 'Pendiente',
      ...(responsableId && { responsableId }),
    };

    if (comiteId) {
      where.reunion = { comiteId };
    }

    if (vencidos === 'true') {
      where.fechaLimite = { lt: new Date() };
    }

    return prisma.compromisoComite.findMany({
      where,
      include: {
        reunion: {
          include: {
            comite: { select: { nombre: true, codigo: true } },
          },
        },
        responsable: { select: { nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaLimite: 'asc' },
    });
  }

  /**
   * Actualizar estado de compromiso
   */
  async actualizarCompromiso(id, data) {
    const { estado, observacionCierre } = data;

    const compromiso = await prisma.compromisoComite.findUnique({ where: { id } });
    if (!compromiso) {
      throw new NotFoundError('Compromiso no encontrado');
    }

    return prisma.compromisoComite.update({
      where: { id },
      data: {
        estado,
        observacionCierre,
        fechaCierre: estado === 'Cumplido' ? new Date() : null,
      },
    });
  }

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  /**
   * Dashboard de comités
   */
  async getDashboard() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      totalComites,
      comitesActivos,
      reunionesProgramadas,
      reunionesDelMes,
      compromisosPendientes,
      compromisosVencidos,
    ] = await Promise.all([
      prisma.comiteInstitucional.count(),
      prisma.comiteInstitucional.count({ where: { activo: true } }),
      prisma.reunionComite.count({ where: { estado: 'Programada' } }),
      prisma.reunionComite.count({
        where: {
          estado: 'Realizada',
          fechaRealizacion: { gte: inicioMes },
        },
      }),
      prisma.compromisoComite.count({ where: { estado: 'Pendiente' } }),
      prisma.compromisoComite.count({
        where: { estado: 'Pendiente', fechaLimite: { lt: hoy } },
      }),
    ]);

    // Próximas reuniones
    const proximasReuniones = await prisma.reunionComite.findMany({
      where: {
        estado: 'Programada',
        fechaProgramada: { gte: hoy },
      },
      include: {
        comite: { select: { nombre: true, codigo: true } },
      },
      orderBy: { fechaProgramada: 'asc' },
      take: 5,
    });

    // Cumplimiento de reuniones por comité
    const cumplimientoPorComite = await prisma.comiteInstitucional.findMany({
      where: { activo: true },
      include: {
        reuniones: {
          where: {
            fechaProgramada: { gte: new Date(hoy.getFullYear(), 0, 1) },
          },
        },
      },
    });

    const estadisticasPorComite = cumplimientoPorComite.map((comite) => {
      const realizadas = comite.reuniones.filter((r) => r.estado === 'Realizada').length;
      const programadas = comite.reuniones.length;
      return {
        codigo: comite.codigo,
        nombre: comite.nombre,
        periodicidad: comite.periodicidad,
        reunionesProgramadas: programadas,
        reunionesRealizadas: realizadas,
        cumplimiento: programadas > 0 ? (realizadas / programadas) * 100 : 0,
      };
    });

    return {
      resumen: {
        totalComites,
        comitesActivos,
        reunionesProgramadas,
        reunionesDelMes,
        compromisosPendientes,
        compromisosVencidos,
      },
      proximasReuniones,
      estadisticasPorComite,
    };
  }

  /**
   * Generar acta de reunión
   */
  async generarActa(reunionId) {
    const reunion = await this.getReunionById(reunionId);

    return {
      comite: reunion.comite.nombre,
      numeroActa: reunion.numeroActa,
      fechaRealizacion: reunion.fechaRealizacion,
      lugar: reunion.lugar,
      ordenDelDia: reunion.ordenDelDia,
      asistentes: reunion.asistentes,
      invitados: reunion.invitados,
      temasDiscutidos: reunion.temasDiscutidos,
      decisiones: reunion.decisiones,
      compromisos: reunion.seguimientoCompromisos.map((c) => ({
        descripcion: c.descripcion,
        responsable: `${c.responsable.nombre} ${c.responsable.apellido}`,
        fechaLimite: c.fechaLimite,
        estado: c.estado,
      })),
      integrantes: reunion.comite.integrantes.map((i) => ({
        nombre: `${i.usuario.nombre} ${i.usuario.apellido}`,
        rol: i.rol,
      })),
    };
  }
}

module.exports = new ComiteService();
