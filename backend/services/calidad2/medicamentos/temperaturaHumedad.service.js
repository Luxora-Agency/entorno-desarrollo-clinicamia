const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class TemperaturaHumedadService {
  /**
   * Find all records with filters and pagination
   */
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      area = '',
      fechaInicio = '',
      fechaFin = '',
      requiereAlerta = '',
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      activo: true,
    };

    // Filters
    if (area) where.area = area;
    if (requiereAlerta === 'true') where.requiereAlerta = true;
    else if (requiereAlerta === 'false') where.requiereAlerta = false;

    // Date range
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [registros, total] = await Promise.all([
      prisma.registroTemperaturaHumedad.findMany({
        where,
        include: {
          registrador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.registroTemperaturaHumedad.count({ where }),
    ]);

    return {
      data: registros,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Find by ID
   */
  async findById(id) {
    const registro = await prisma.registroTemperaturaHumedad.findUnique({
      where: { id },
      include: {
        registrador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        alertas: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!registro || !registro.activo) {
      throw new NotFoundError('Registro de temperatura/humedad no encontrado');
    }

    return registro;
  }

  /**
   * Create temperature/humidity record with automatic validation
   */
  async create(data, userId) {
    const {
      fecha,
      area,
      temperatura,
      humedad,
      temperaturaMin,
      temperaturaMax,
      humedadMin,
      humedadMax,
      accionCorrectiva = null,
      responsableAccion = null,
    } = data;

    // Parse date and extract components
    const fechaObj = new Date(fecha);
    const mes = fechaObj.getMonth() + 1;
    const anio = fechaObj.getFullYear();
    const dia = fechaObj.getDate();
    const hora = fechaObj.getHours();

    // Check for duplicate (same fecha + area)
    const existing = await prisma.registroTemperaturaHumedad.findFirst({
      where: {
        fecha: fechaObj,
        area,
        activo: true,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Ya existe un registro para ${area} en la fecha ${fechaObj.toLocaleString()}`
      );
    }

    // Validate ranges
    const temperaturaEnRango = temperatura >= temperaturaMin && temperatura <= temperaturaMax;
    const humedadEnRango = humedad >= humedadMin && humedad <= humedadMax;
    const requiereAlerta = !temperaturaEnRango || !humedadEnRango;

    const registro = await prisma.registroTemperaturaHumedad.create({
      data: {
        fecha: fechaObj,
        mes,
        anio,
        dia,
        hora,
        area,
        temperatura,
        humedad,
        temperaturaMin,
        temperaturaMax,
        humedadMin,
        humedadMax,
        temperaturaEnRango,
        humedadEnRango,
        requiereAlerta,
        accionCorrectiva,
        responsableAccion,
        registradoPor: userId,
      },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    // If requires alert, create alert record
    if (requiereAlerta) {
      await this.generarAlerta(registro, userId);
    }

    return registro;
  }

  /**
   * Update record
   */
  async update(id, data, userId) {
    const existing = await this.findById(id);

    const {
      temperatura,
      humedad,
      temperaturaMin,
      temperaturaMax,
      humedadMin,
      humedadMax,
      accionCorrectiva,
      responsableAccion,
    } = data;

    // Recalculate validation if temperature or humidity changed
    let updateData = { ...data };

    if (
      temperatura !== undefined ||
      humedad !== undefined ||
      temperaturaMin !== undefined ||
      temperaturaMax !== undefined ||
      humedadMin !== undefined ||
      humedadMax !== undefined
    ) {
      const temp = temperatura ?? existing.temperatura;
      const hum = humedad ?? existing.humedad;
      const tempMin = temperaturaMin ?? existing.temperaturaMin;
      const tempMax = temperaturaMax ?? existing.temperaturaMax;
      const humMin = humedadMin ?? existing.humedadMin;
      const humMax = humedadMax ?? existing.humedadMax;

      updateData.temperaturaEnRango = temp >= tempMin && temp <= tempMax;
      updateData.humedadEnRango = hum >= humMin && hum <= humMax;
      updateData.requiereAlerta = !updateData.temperaturaEnRango || !updateData.humedadEnRango;
    }

    const updated = await prisma.registroTemperaturaHumedad.update({
      where: { id },
      data: updateData,
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    // Generate alert if now requires one and didn't before
    if (updated.requiereAlerta && !existing.requiereAlerta) {
      await this.generarAlerta(updated, userId);
    }

    return updated;
  }

  /**
   * Soft delete record
   */
  async delete(id) {
    await this.findById(id);

    await prisma.registroTemperaturaHumedad.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Registro eliminado exitosamente' };
  }

  /**
   * Get records by area and date range
   */
  async getByArea(area, fechaInicio = null, fechaFin = null) {
    const where = {
      activo: true,
      area,
    };

    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const registros = await prisma.registroTemperaturaHumedad.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    return registros;
  }

  /**
   * Get all alerts (out of range records)
   */
  async getAlertas(area = null) {
    const where = {
      activo: true,
      requiereAlerta: true,
    };

    if (area) where.area = area;

    const registros = await prisma.registroTemperaturaHumedad.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    return registros;
  }

  /**
   * Get trends for charts (last N days)
   */
  async getTendencias(area, periodo = '30') {
    const dias = parseInt(periodo);
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const registros = await prisma.registroTemperaturaHumedad.findMany({
      where: {
        activo: true,
        area,
        fecha: {
          gte: fechaInicio,
        },
      },
      orderBy: { fecha: 'asc' },
      select: {
        id: true,
        fecha: true,
        temperatura: true,
        humedad: true,
        temperaturaMin: true,
        temperaturaMax: true,
        humedadMin: true,
        humedadMax: true,
        temperaturaEnRango: true,
        humedadEnRango: true,
      },
    });

    return registros;
  }

  /**
   * Get statistics
   */
  async getEstadisticas(filters = {}) {
    const { area, fechaInicio, fechaFin } = filters;

    const whereBase = {
      activo: true,
    };

    if (area) whereBase.area = area;

    if (fechaInicio || fechaFin) {
      whereBase.fecha = {};
      if (fechaInicio) whereBase.fecha.gte = new Date(fechaInicio);
      if (fechaFin) whereBase.fecha.lte = new Date(fechaFin);
    }

    const [
      totalRegistros,
      totalAlertas,
      alertasTemperatura,
      alertasHumedad,
      porArea,
      ultimaSemana,
    ] = await Promise.all([
      prisma.registroTemperaturaHumedad.count({ where: whereBase }),

      prisma.registroTemperaturaHumedad.count({
        where: { ...whereBase, requiereAlerta: true },
      }),

      prisma.registroTemperaturaHumedad.count({
        where: { ...whereBase, temperaturaEnRango: false },
      }),

      prisma.registroTemperaturaHumedad.count({
        where: { ...whereBase, humedadEnRango: false },
      }),

      prisma.registroTemperaturaHumedad.groupBy({
        by: ['area'],
        where: whereBase,
        _count: true,
      }),

      prisma.registroTemperaturaHumedad.count({
        where: {
          activo: true,
          fecha: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total: totalRegistros,
      totalAlertas,
      alertasTemperatura,
      alertasHumedad,
      porArea: porArea.reduce((acc, item) => {
        acc[item.area] = item._count;
        return acc;
      }, {}),
      ultimaSemana,
    };
  }

  /**
   * Generate alert for out-of-range record
   */
  async generarAlerta(registro, userId) {
    const motivos = [];
    if (!registro.temperaturaEnRango) {
      motivos.push(
        `Temperatura ${registro.temperatura}°C fuera de rango (${registro.temperaturaMin}°C - ${registro.temperaturaMax}°C)`
      );
    }
    if (!registro.humedadEnRango) {
      motivos.push(
        `Humedad ${registro.humedad}% fuera de rango (${registro.humedadMin}% - ${registro.humedadMax}%)`
      );
    }

    const prioridad = !registro.temperaturaEnRango ? 'CRITICA' : 'MEDIA';

    await prisma.alertaCalidad2.create({
      data: {
        tipo: !registro.temperaturaEnRango ? 'TEMPERATURA_FUERA_RANGO' : 'HUMEDAD_FUERA_RANGO',
        prioridad,
        titulo: `Alerta: ${registro.area}`,
        descripcion: motivos.join('. '),
        fechaAlerta: new Date(),
        moduloOrigen: 'MEDICAMENTOS',
        entityType: 'RegistroTemperaturaHumedad',
        entityId: registro.id,
        creadoPor: userId,
      },
    });
  }

  /**
   * Export data to CSV/Excel (returns data array)
   */
  async exportar(area, fechaInicio, fechaFin) {
    const registros = await this.getByArea(area, fechaInicio, fechaFin);

    // Format for export
    return registros.map(r => ({
      Fecha: r.fecha.toLocaleString(),
      Area: r.area,
      'Temperatura (°C)': r.temperatura,
      'Temp Min (°C)': r.temperaturaMin,
      'Temp Max (°C)': r.temperaturaMax,
      'Temp en Rango': r.temperaturaEnRango ? 'Sí' : 'No',
      'Humedad (%)': r.humedad,
      'Humedad Min (%)': r.humedadMin,
      'Humedad Max (%)': r.humedadMax,
      'Humedad en Rango': r.humedadEnRango ? 'Sí' : 'No',
      'Requiere Alerta': r.requiereAlerta ? 'Sí' : 'No',
      'Acción Correctiva': r.accionCorrectiva || '',
      'Registrado Por': r.registrador?.nombre || '',
    }));
  }
}

module.exports = new TemperaturaHumedadService();
