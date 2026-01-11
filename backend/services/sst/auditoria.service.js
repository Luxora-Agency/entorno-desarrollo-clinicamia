/**
 * Servicio de Auditorias SST
 * Gestiona auditorias internas y externas del SG-SST
 * Normativa: Decreto 1072/2015, ISO 45001
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class AuditoriaSSTService {
  /**
   * Listar auditorias
   */
  async findAll({ page = 1, limit = 20, tipo, estado, anio }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoAuditoria = tipo;
    if (estado) where.estado = estado;

    if (anio) {
      where.fechaProgramada = {
        gte: new Date(anio, 0, 1),
        lte: new Date(anio, 11, 31),
      };
    }

    const [auditorias, total] = await Promise.all([
      prisma.sSTAuditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaProgramada: 'desc' },
        include: {
          auditorLider: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { hallazgos: true, equipo: true },
          },
        },
      }),
      prisma.sSTAuditoria.count({ where }),
    ]);

    return {
      data: auditorias,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener auditoria por ID
   */
  async findById(id) {
    const auditoria = await prisma.sSTAuditoria.findUnique({
      where: { id },
      include: {
        auditorLider: {
          select: { id: true, nombre: true, apellido: true },
        },
        equipo: {
          include: {
            auditor: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        hallazgos: {
          include: {
            accionCorrectiva: true,
          },
          orderBy: { tipo: 'asc' },
        },
      },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoria no encontrada');
    }

    return auditoria;
  }

  /**
   * Crear auditoria
   */
  async create(data) {
    const auditoria = await prisma.sSTAuditoria.create({
      data: {
        tipoAuditoria: data.tipoAuditoria, // INTERNA, EXTERNA
        titulo: data.titulo,
        objetivos: data.objetivos,
        alcance: data.alcance,
        criteriosAuditoria: data.criteriosAuditoria,
        fechaProgramada: new Date(data.fechaProgramada),
        duracionEstimada: data.duracionEstimada,
        auditorLiderId: data.auditorLiderId,
        entidadAuditora: data.entidadAuditora,
        procesosAuditar: data.procesosAuditar,
        estado: 'PROGRAMADA',
      },
      include: {
        auditorLider: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return auditoria;
  }

  /**
   * Actualizar auditoria
   */
  async update(id, data) {
    const auditoria = await prisma.sSTAuditoria.findUnique({
      where: { id },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoria no encontrada');
    }

    return prisma.sSTAuditoria.update({
      where: { id },
      data: {
        ...data,
        fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : undefined,
      },
    });
  }

  /**
   * Agregar auditor al equipo
   */
  async agregarAuditor(auditoriaId, data) {
    const auditoria = await prisma.sSTAuditoria.findUnique({
      where: { id: auditoriaId },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoria no encontrada');
    }

    const auditor = await prisma.sSTAuditorEquipo.create({
      data: {
        auditoriaId,
        auditorId: data.auditorId,
        rol: data.rol, // LIDER, AUDITOR, OBSERVADOR
        procesosAsignados: data.procesosAsignados,
      },
      include: {
        auditor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return auditor;
  }

  /**
   * Iniciar auditoria
   */
  async iniciar(id, data) {
    const auditoria = await prisma.sSTAuditoria.findUnique({
      where: { id },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoria no encontrada');
    }

    return prisma.sSTAuditoria.update({
      where: { id },
      data: {
        estado: 'EN_EJECUCION',
        fechaInicio: new Date(),
        reunionApertura: data.reunionApertura,
      },
    });
  }

  /**
   * Registrar hallazgo
   */
  async registrarHallazgo(auditoriaId, data) {
    const auditoria = await prisma.sSTAuditoria.findUnique({
      where: { id: auditoriaId },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoria no encontrada');
    }

    // Generar numero de hallazgo
    const count = await prisma.sSTHallazgoAuditoria.count({
      where: { auditoriaId },
    });

    const hallazgo = await prisma.sSTHallazgoAuditoria.create({
      data: {
        auditoriaId,
        numeroHallazgo: `H-${String(count + 1).padStart(3, '0')}`,
        tipo: data.tipo, // NO_CONFORMIDAD_MAYOR, NO_CONFORMIDAD_MENOR, OBSERVACION, OPORTUNIDAD_MEJORA
        proceso: data.proceso,
        requisito: data.requisito,
        descripcion: data.descripcion,
        evidencia: data.evidencia,
        causaRaiz: data.causaRaiz,
        estado: 'ABIERTO',
      },
    });

    return hallazgo;
  }

  /**
   * Actualizar hallazgo
   */
  async actualizarHallazgo(hallazgoId, data) {
    const hallazgo = await prisma.sSTHallazgoAuditoria.findUnique({
      where: { id: hallazgoId },
    });

    if (!hallazgo) {
      throw new NotFoundError('Hallazgo no encontrado');
    }

    return prisma.sSTHallazgoAuditoria.update({
      where: { id: hallazgoId },
      data,
    });
  }

  /**
   * Finalizar auditoria
   */
  async finalizar(id, data) {
    const auditoria = await prisma.sSTAuditoria.findUnique({
      where: { id },
      include: { hallazgos: true },
    });

    if (!auditoria) {
      throw new NotFoundError('Auditoria no encontrada');
    }

    const ncMayores = auditoria.hallazgos.filter(h => h.tipo === 'NO_CONFORMIDAD_MAYOR').length;
    const ncMenores = auditoria.hallazgos.filter(h => h.tipo === 'NO_CONFORMIDAD_MENOR').length;
    const observaciones = auditoria.hallazgos.filter(h => h.tipo === 'OBSERVACION').length;
    const oportunidades = auditoria.hallazgos.filter(h => h.tipo === 'OPORTUNIDAD_MEJORA').length;

    return prisma.sSTAuditoria.update({
      where: { id },
      data: {
        estado: 'FINALIZADA',
        fechaFin: new Date(),
        reunionCierre: data.reunionCierre,
        conclusiones: data.conclusiones,
        recomendaciones: data.recomendaciones,
        fortalezas: data.fortalezas,
        totalNCMayores: ncMayores,
        totalNCMenores: ncMenores,
        totalObservaciones: observaciones,
        totalOportunidades: oportunidades,
        urlInforme: data.urlInforme,
      },
    });
  }

  /**
   * Obtener programa anual de auditorias
   */
  async getProgramaAnual(anio) {
    return prisma.sSTAuditoria.findMany({
      where: {
        fechaProgramada: {
          gte: new Date(anio, 0, 1),
          lte: new Date(anio, 11, 31),
        },
      },
      orderBy: { fechaProgramada: 'asc' },
      include: {
        auditorLider: {
          select: { nombre: true, apellido: true },
        },
        _count: {
          select: { hallazgos: true },
        },
      },
    });
  }

  /**
   * Obtener hallazgos abiertos
   */
  async getHallazgosAbiertos() {
    return prisma.sSTHallazgoAuditoria.findMany({
      where: {
        estado: 'ABIERTO',
      },
      include: {
        auditoria: {
          select: { titulo: true, fechaInicio: true },
        },
        accionCorrectiva: {
          select: { id: true, estado: true },
        },
      },
      orderBy: { tipo: 'asc' },
    });
  }

  /**
   * Obtener estadisticas de auditorias
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaProgramada: { gte: fechaInicio, lte: fechaFin },
    };

    const [
      total,
      porEstado,
      hallazgos,
    ] = await Promise.all([
      prisma.sSTAuditoria.count({ where }),
      prisma.sSTAuditoria.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.sSTHallazgoAuditoria.groupBy({
        by: ['tipo'],
        where: {
          auditoria: { fechaProgramada: { gte: fechaInicio, lte: fechaFin } },
        },
        _count: true,
      }),
    ]);

    return {
      anio,
      total,
      realizadas: porEstado.find(e => e.estado === 'FINALIZADA')?._count || 0,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      hallazgos: hallazgos.map(h => ({ tipo: h.tipo, cantidad: h._count })),
    };
  }
}

module.exports = new AuditoriaSSTService();
