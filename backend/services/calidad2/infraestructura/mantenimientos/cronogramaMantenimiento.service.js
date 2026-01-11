const prisma = require('../../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../../utils/errors');

class CronogramaMantenimientoService {
  /**
   * Crear entrada en cronograma
   */
  async create(data, userId) {
    // Verificar que el equipo existe
    const equipo = await prisma.equipoInfraestructura.findUnique({
      where: { id: data.equipoId },
    });

    if (!equipo) {
      throw new NotFoundError('Equipo no encontrado');
    }

    // Verificar que no exista duplicado
    const existing = await prisma.cronogramaMantenimiento.findUnique({
      where: {
        equipoId_anio_mes_dia: {
          equipoId: data.equipoId,
          anio: data.anio,
          mes: data.mes,
          dia: data.dia || null,
        },
      },
    });

    if (existing) {
      throw new ValidationError(
        `Ya existe un mantenimiento programado para este equipo en ${data.mes}/${data.anio}${data.dia ? `/${data.dia}` : ''}`
      );
    }

    return prisma.cronogramaMantenimiento.create({
      data: {
        ...data,
        creador: { connect: { id: userId } },
        equipo: { connect: { id: data.equipoId } },
      },
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            codigo: true,
          },
        },
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Obtener cronograma con filtros
   */
  async findAll(filters = {}) {
    const where = { activo: true };

    if (filters.equipoId) {
      where.equipoId = filters.equipoId;
    }

    if (filters.anio) {
      where.anio = parseInt(filters.anio);
    }

    if (filters.mes) {
      where.mes = parseInt(filters.mes);
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.tipoMantenimiento) {
      where.tipoMantenimiento = filters.tipoMantenimiento;
    }

    const [cronogramas, total] = await Promise.all([
      prisma.cronogramaMantenimiento.findMany({
        where,
        include: {
          equipo: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              codigo: true,
              ubicacion: true,
            },
          },
          creador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: [{ anio: 'desc' }, { mes: 'asc' }, { dia: 'asc' }],
        take: parseInt(filters.limit) || 100,
      }),
      prisma.cronogramaMantenimiento.count({ where }),
    ]);

    return { cronogramas, total };
  }

  /**
   * Obtener cronograma por ID
   */
  async findById(id) {
    const cronograma = await prisma.cronogramaMantenimiento.findUnique({
      where: { id },
      include: {
        equipo: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!cronograma) {
      throw new NotFoundError('Cronograma no encontrado');
    }

    return cronograma;
  }

  /**
   * Actualizar cronograma
   */
  async update(id, data) {
    await this.findById(id);

    return prisma.cronogramaMantenimiento.update({
      where: { id },
      data,
      include: {
        equipo: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar cronograma (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    return prisma.cronogramaMantenimiento.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener cronograma anual de un equipo
   */
  async getCronogramaAnual(equipoId, anio) {
    const equipo = await prisma.equipoInfraestructura.findUnique({
      where: { id: equipoId },
    });

    if (!equipo) {
      throw new NotFoundError('Equipo no encontrado');
    }

    const cronogramas = await prisma.cronogramaMantenimiento.findMany({
      where: {
        equipoId,
        anio: parseInt(anio),
        activo: true,
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: [{ mes: 'asc' }, { dia: 'asc' }],
    });

    // Agrupar por mes
    const porMes = cronogramas.reduce((acc, item) => {
      if (!acc[item.mes]) {
        acc[item.mes] = [];
      }
      acc[item.mes].push(item);
      return acc;
    }, {});

    return {
      equipo,
      anio,
      cronogramas,
      porMes,
      total: cronogramas.length,
    };
  }

  /**
   * Obtener cronograma mensual (todos los equipos)
   */
  async getCronogramaMensual(mes, anio) {
    const cronogramas = await prisma.cronogramaMantenimiento.findMany({
      where: {
        mes: parseInt(mes),
        anio: parseInt(anio),
        activo: true,
      },
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            codigo: true,
            ubicacion: true,
          },
        },
      },
      orderBy: [{ dia: 'asc' }],
    });

    // Agrupar por tipo de equipo
    const porTipo = cronogramas.reduce((acc, item) => {
      const tipo = item.equipo.tipo;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(item);
      return acc;
    }, {});

    return {
      mes,
      anio,
      cronogramas,
      porTipo,
      total: cronogramas.length,
    };
  }

  /**
   * Marcar como completado y vincular con mantenimiento real
   */
  async marcarCompletado(id, mantenimientoId, userId) {
    const cronograma = await this.findById(id);

    if (cronograma.estado === 'COMPLETADO') {
      throw new ValidationError('El cronograma ya está marcado como completado');
    }

    // Verificar que el mantenimiento existe
    const mantenimiento = await prisma.mantenimientoInfraestructura.findUnique({
      where: { id: mantenimientoId },
    });

    if (!mantenimiento) {
      throw new NotFoundError('Mantenimiento no encontrado');
    }

    return prisma.cronogramaMantenimiento.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        fechaCompletado: new Date(),
        mantenimientoId,
      },
    });
  }

  /**
   * Reprogramar mantenimiento
   */
  async reprogramar(id, nuevaFecha) {
    const cronograma = await this.findById(id);

    if (cronograma.estado === 'COMPLETADO') {
      throw new ValidationError('No se puede reprogramar un mantenimiento completado');
    }

    return this.update(id, {
      mes: nuevaFecha.mes,
      dia: nuevaFecha.dia,
      estado: 'REPROGRAMADO',
    });
  }

  /**
   * Cancelar mantenimiento programado
   */
  async cancelar(id, motivo) {
    const cronograma = await this.findById(id);

    if (cronograma.estado === 'COMPLETADO') {
      throw new ValidationError('No se puede cancelar un mantenimiento completado');
    }

    return this.update(id, {
      estado: 'CANCELADO',
      descripcion: `${cronograma.descripcion}\n\nCancelado: ${motivo}`,
    });
  }

  /**
   * Generar cronograma automático para un año
   */
  async generarCronogramaAnual(equipoId, anio, config, userId) {
    const equipo = await prisma.equipoInfraestructura.findUnique({
      where: { id: equipoId },
    });

    if (!equipo) {
      throw new NotFoundError('Equipo no encontrado');
    }

    const cronogramasCreados = [];

    // Según la frecuencia, crear entradas
    if (config.frecuencia === 'MENSUAL') {
      for (let mes = 1; mes <= 12; mes++) {
        const cronograma = await this.create(
          {
            equipoId,
            anio,
            mes,
            dia: config.dia || null,
            tipoMantenimiento: config.tipoMantenimiento,
            descripcion: config.descripcion,
            frecuencia: 'MENSUAL',
            empresaAsignada: config.empresaAsignada,
            responsableInterno: config.responsableInterno,
          },
          userId
        );
        cronogramasCreados.push(cronograma);
      }
    } else if (config.frecuencia === 'TRIMESTRAL') {
      for (let mes of [1, 4, 7, 10]) {
        const cronograma = await this.create(
          {
            equipoId,
            anio,
            mes,
            dia: config.dia || null,
            tipoMantenimiento: config.tipoMantenimiento,
            descripcion: config.descripcion,
            frecuencia: 'TRIMESTRAL',
            empresaAsignada: config.empresaAsignada,
            responsableInterno: config.responsableInterno,
          },
          userId
        );
        cronogramasCreados.push(cronograma);
      }
    } else if (config.frecuencia === 'SEMESTRAL') {
      for (let mes of [1, 7]) {
        const cronograma = await this.create(
          {
            equipoId,
            anio,
            mes,
            dia: config.dia || null,
            tipoMantenimiento: config.tipoMantenimiento,
            descripcion: config.descripcion,
            frecuencia: 'SEMESTRAL',
            empresaAsignada: config.empresaAsignada,
            responsableInterno: config.responsableInterno,
          },
          userId
        );
        cronogramasCreados.push(cronograma);
      }
    } else if (config.frecuencia === 'ANUAL') {
      const cronograma = await this.create(
        {
          equipoId,
          anio,
          mes: config.mes || 1,
          dia: config.dia || null,
          tipoMantenimiento: config.tipoMantenimiento,
          descripcion: config.descripcion,
          frecuencia: 'ANUAL',
          empresaAsignada: config.empresaAsignada,
          responsableInterno: config.responsableInterno,
        },
        userId
      );
      cronogramasCreados.push(cronograma);
    }

    return {
      equipo,
      anio,
      frecuencia: config.frecuencia,
      cronogramasCreados,
      total: cronogramasCreados.length,
    };
  }

  /**
   * Obtener estadísticas del cronograma
   */
  async getEstadisticas(anio) {
    const where = {
      activo: true,
      anio: parseInt(anio),
    };

    const [
      total,
      programados,
      completados,
      reprogramados,
      cancelados,
      porTipo,
      porMes,
    ] = await Promise.all([
      prisma.cronogramaMantenimiento.count({ where }),
      prisma.cronogramaMantenimiento.count({
        where: { ...where, estado: 'PROGRAMADO' },
      }),
      prisma.cronogramaMantenimiento.count({
        where: { ...where, estado: 'COMPLETADO' },
      }),
      prisma.cronogramaMantenimiento.count({
        where: { ...where, estado: 'REPROGRAMADO' },
      }),
      prisma.cronogramaMantenimiento.count({
        where: { ...where, estado: 'CANCELADO' },
      }),
      prisma.cronogramaMantenimiento.groupBy({
        by: ['tipoMantenimiento'],
        where,
        _count: true,
      }),
      prisma.cronogramaMantenimiento.groupBy({
        by: ['mes'],
        where,
        _count: true,
      }),
    ]);

    return {
      anio,
      total,
      programados,
      completados,
      reprogramados,
      cancelados,
      porcentajeCompletado: total > 0 ? ((completados / total) * 100).toFixed(2) : 0,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipoMantenimiento] = item._count;
        return acc;
      }, {}),
      porMes: porMes.reduce((acc, item) => {
        acc[item.mes] = item._count;
        return acc;
      }, {}),
    };
  }
}

module.exports = new CronogramaMantenimientoService();
