/**
 * Servicio de Acciones Correctivas y Preventivas (CAPA)
 * Gestiona el tratamiento de no conformidades
 * Normativa: Decreto 1072/2015, ISO 45001
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class AccionCorrectivaService {
  /**
   * Listar acciones con filtros
   */
  async findAll({ page = 1, limit = 20, tipo, estado, origen }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoAccion = tipo;
    if (estado) where.estado = estado;
    if (origen) where.origen = origen;

    const [acciones, total] = await Promise.all([
      prisma.sSTAccionCorrectiva.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          responsable: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
      }),
      prisma.sSTAccionCorrectiva.count({ where }),
    ]);

    return {
      data: acciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener accion por ID
   */
  async findById(id) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
        seguimientos: {
          orderBy: { fechaSeguimiento: 'desc' },
        },
        hallazgoAuditoria: true,
      },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    return accion;
  }

  /**
   * Crear accion correctiva/preventiva
   */
  async create(data) {
    // Generar numero de accion
    const year = new Date().getFullYear();
    const count = await prisma.sSTAccionCorrectiva.count({
      where: {
        fechaCreacion: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const numeroAccion = `AC-${year}-${String(count + 1).padStart(4, '0')}`;

    const accion = await prisma.sSTAccionCorrectiva.create({
      data: {
        numeroAccion,
        tipoAccion: data.tipoAccion, // CORRECTIVA, PREVENTIVA, MEJORA
        origen: data.origen, // AUDITORIA, INSPECCION, ACCIDENTE, INCIDENTE, QUEJA, SUGERENCIA
        hallazgoId: data.hallazgoId,
        descripcionNoConformidad: data.descripcionNoConformidad,
        evidenciaNC: data.evidenciaNC,
        analisisCausas: data.analisisCausas,
        metodologiaAnalisis: data.metodologiaAnalisis, // 5_PORQUES, ISHIKAWA, ARBOL_CAUSAS
        causaRaiz: data.causaRaiz,
        accionPropuesta: data.accionPropuesta,
        responsableId: data.responsableId,
        fechaImplementacion: new Date(data.fechaImplementacion),
        recursos: data.recursos,
        indicadorEficacia: data.indicadorEficacia,
        criterioEficacia: data.criterioEficacia,
        estado: 'ABIERTA',
        fechaCreacion: new Date(),
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Si viene de auditoria, actualizar hallazgo
    if (data.hallazgoId) {
      await prisma.sSTHallazgoAuditoria.update({
        where: { id: data.hallazgoId },
        data: { accionCorrectivaId: accion.id },
      });
    }

    return accion;
  }

  /**
   * Actualizar accion
   */
  async update(id, data) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    if (accion.estado === 'CERRADA') {
      throw new ValidationError('No se puede editar una accion cerrada');
    }

    return prisma.sSTAccionCorrectiva.update({
      where: { id },
      data: {
        ...data,
        fechaImplementacion: data.fechaImplementacion ? new Date(data.fechaImplementacion) : undefined,
      },
    });
  }

  /**
   * Registrar implementacion
   */
  async registrarImplementacion(id, data) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    return prisma.sSTAccionCorrectiva.update({
      where: { id },
      data: {
        estado: 'IMPLEMENTADA',
        fechaImplementacionReal: new Date(),
        accionImplementada: data.accionImplementada,
        evidenciaImplementacion: data.evidenciaImplementacion,
      },
    });
  }

  /**
   * Agregar seguimiento
   */
  async agregarSeguimiento(accionId, data) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id: accionId },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    const seguimiento = await prisma.sSTSeguimientoAccion.create({
      data: {
        accionId,
        fechaSeguimiento: new Date(),
        descripcion: data.descripcion,
        avance: data.avance,
        observaciones: data.observaciones,
        realizadoPorId: data.realizadoPorId,
        evidencia: data.evidencia,
      },
    });

    // Actualizar avance en la accion
    await prisma.sSTAccionCorrectiva.update({
      where: { id: accionId },
      data: { porcentajeAvance: data.avance },
    });

    return seguimiento;
  }

  /**
   * Verificar eficacia
   */
  async verificarEficacia(id, data) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    if (accion.estado !== 'IMPLEMENTADA') {
      throw new ValidationError('La accion debe estar implementada para verificar eficacia');
    }

    return prisma.sSTAccionCorrectiva.update({
      where: { id },
      data: {
        estado: data.eficaz ? 'VERIFICADA' : 'NO_EFICAZ',
        fechaVerificacion: new Date(),
        verificadoPorId: data.verificadoPorId,
        resultadoEficacia: data.resultadoEficacia,
        evidenciaEficacia: data.evidenciaEficacia,
        observacionesVerificacion: data.observaciones,
      },
    });
  }

  /**
   * Cerrar accion
   */
  async cerrar(id, data) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    if (accion.estado !== 'VERIFICADA') {
      throw new ValidationError('Solo se pueden cerrar acciones verificadas como eficaces');
    }

    const closed = await prisma.sSTAccionCorrectiva.update({
      where: { id },
      data: {
        estado: 'CERRADA',
        fechaCierre: new Date(),
        conclusiones: data.conclusiones,
      },
    });

    // Si viene de auditoria, cerrar el hallazgo
    if (accion.hallazgoId) {
      await prisma.sSTHallazgoAuditoria.update({
        where: { id: accion.hallazgoId },
        data: { estado: 'CERRADO' },
      });
    }

    return closed;
  }

  /**
   * Reabrir accion no eficaz
   */
  async reabrir(id, data) {
    const accion = await prisma.sSTAccionCorrectiva.findUnique({
      where: { id },
    });

    if (!accion) {
      throw new NotFoundError('Accion correctiva no encontrada');
    }

    if (accion.estado !== 'NO_EFICAZ') {
      throw new ValidationError('Solo se pueden reabrir acciones no eficaces');
    }

    return prisma.sSTAccionCorrectiva.update({
      where: { id },
      data: {
        estado: 'ABIERTA',
        analisisCausas: data.nuevoAnalisis,
        causaRaiz: data.nuevaCausaRaiz,
        accionPropuesta: data.nuevaAccion,
        fechaImplementacion: new Date(data.nuevaFechaImplementacion),
      },
    });
  }

  /**
   * Obtener acciones vencidas
   */
  async getVencidas() {
    return prisma.sSTAccionCorrectiva.findMany({
      where: {
        estado: { in: ['ABIERTA', 'IMPLEMENTADA'] },
        fechaImplementacion: { lt: new Date() },
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
      orderBy: { fechaImplementacion: 'asc' },
    });
  }

  /**
   * Obtener estadisticas
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaCreacion: { gte: fechaInicio, lte: fechaFin },
    };

    const [
      total,
      porEstado,
      porTipo,
      porOrigen,
    ] = await Promise.all([
      prisma.sSTAccionCorrectiva.count({ where }),
      prisma.sSTAccionCorrectiva.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.sSTAccionCorrectiva.groupBy({
        by: ['tipoAccion'],
        where,
        _count: true,
      }),
      prisma.sSTAccionCorrectiva.groupBy({
        by: ['origen'],
        where,
        _count: true,
      }),
    ]);

    const cerradas = porEstado.find(e => e.estado === 'CERRADA')?._count || 0;
    const eficacia = total > 0 ? (cerradas / total) * 100 : 0;

    return {
      anio,
      total,
      cerradas,
      eficacia: Math.round(eficacia * 100) / 100,
      vencidas: await this.getVencidas().then(v => v.length),
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      porTipo: porTipo.map(t => ({ tipo: t.tipoAccion, cantidad: t._count })),
      porOrigen: porOrigen.map(o => ({ origen: o.origen, cantidad: o._count })),
    };
  }
}

module.exports = new AccionCorrectivaService();
