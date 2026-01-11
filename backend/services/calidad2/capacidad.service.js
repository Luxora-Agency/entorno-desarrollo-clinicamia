const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CapacidadCalidad2Service {
  // ==========================================
  // CAPACIDAD INSTALADA
  // ==========================================

  /**
   * Obtener todas las entradas de capacidad instalada
   */
  async findAllCapacidad(query = {}) {
    const { activo = true } = query;

    const capacidades = await prisma.capacidadInstalada.findMany({
      where: {
        activo: activo === 'true' || activo === true,
      },
      orderBy: { servicio: 'asc' },
    });

    // Calcular campos derivados
    const capacidadesCalculadas = capacidades.map(c => this.calcularCapacidad(c));

    // Calcular totales
    const totales = this.calcularTotalesCapacidad(capacidadesCalculadas);

    return {
      data: capacidadesCalculadas,
      totales,
    };
  }

  /**
   * Obtener capacidad por ID
   */
  async findCapacidadById(id) {
    const capacidad = await prisma.capacidadInstalada.findUnique({
      where: { id },
    });

    if (!capacidad) {
      throw new NotFoundError('Registro de capacidad no encontrado');
    }

    return this.calcularCapacidad(capacidad);
  }

  /**
   * Crear entrada de capacidad
   */
  async createCapacidad(data, userId) {
    const {
      servicio,
      profesional,
      ambientes,
      numeroEquiposAmbiente,
      duracionPromedioMinutos,
    } = data;

    // Calcular campos derivados
    const calculados = this.calcularCamposCapacidad(numeroEquiposAmbiente, duracionPromedioMinutos);

    const capacidad = await prisma.capacidadInstalada.create({
      data: {
        servicio,
        profesional,
        ambientes,
        numeroEquiposAmbiente,
        duracionPromedioMinutos,
        ...calculados,
        creadoPor: userId,
      },
    });

    return this.calcularCapacidad(capacidad);
  }

  /**
   * Actualizar entrada de capacidad
   */
  async updateCapacidad(id, data) {
    const capacidad = await prisma.capacidadInstalada.findUnique({
      where: { id },
    });

    if (!capacidad) {
      throw new NotFoundError('Registro de capacidad no encontrado');
    }

    const {
      servicio,
      profesional,
      ambientes,
      numeroEquiposAmbiente,
      duracionPromedioMinutos,
    } = data;

    // Recalcular si cambian los campos de cálculo
    let calculados = {};
    const numEquipos = numeroEquiposAmbiente ?? capacidad.numeroEquiposAmbiente;
    const duracion = duracionPromedioMinutos ?? capacidad.duracionPromedioMinutos;

    if (numeroEquiposAmbiente !== undefined || duracionPromedioMinutos !== undefined) {
      calculados = this.calcularCamposCapacidad(numEquipos, duracion);
    }

    const updated = await prisma.capacidadInstalada.update({
      where: { id },
      data: {
        ...(servicio && { servicio }),
        ...(profesional && { profesional }),
        ...(ambientes !== undefined && { ambientes }),
        ...(numeroEquiposAmbiente !== undefined && { numeroEquiposAmbiente }),
        ...(duracionPromedioMinutos !== undefined && { duracionPromedioMinutos }),
        ...calculados,
      },
    });

    return this.calcularCapacidad(updated);
  }

  /**
   * Eliminar capacidad (soft delete)
   */
  async deleteCapacidad(id) {
    const capacidad = await prisma.capacidadInstalada.findUnique({
      where: { id },
    });

    if (!capacidad) {
      throw new NotFoundError('Registro de capacidad no encontrado');
    }

    await prisma.capacidadInstalada.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Registro eliminado correctamente' };
  }

  // ==========================================
  // OFERTA
  // ==========================================

  /**
   * Obtener todas las ofertas
   */
  async findAllOferta(query = {}) {
    const { activo = true } = query;

    const ofertas = await prisma.ofertaCapacidad.findMany({
      where: {
        activo: activo === 'true' || activo === true,
      },
      orderBy: { servicio: 'asc' },
    });

    // Calcular campos derivados
    const ofertasCalculadas = ofertas.map(o => this.calcularOferta(o));

    // Calcular totales
    const totales = this.calcularTotalesOferta(ofertasCalculadas);

    return {
      data: ofertasCalculadas,
      totales,
    };
  }

  /**
   * Obtener oferta por ID
   */
  async findOfertaById(id) {
    const oferta = await prisma.ofertaCapacidad.findUnique({
      where: { id },
    });

    if (!oferta) {
      throw new NotFoundError('Registro de oferta no encontrado');
    }

    return this.calcularOferta(oferta);
  }

  /**
   * Crear oferta
   */
  async createOferta(data, userId) {
    const {
      servicio,
      profesionalCargo,
      numeroProfesionales,
      horasTrabajoSemana,
      tiempoPorActividadMin,
      pacientesAtendidosSemana,
    } = data;

    // Calcular campos derivados
    const calculados = this.calcularCamposOferta(tiempoPorActividadMin, pacientesAtendidosSemana);

    const oferta = await prisma.ofertaCapacidad.create({
      data: {
        servicio,
        profesionalCargo,
        numeroProfesionales,
        horasTrabajoSemana,
        tiempoPorActividadMin,
        pacientesAtendidosSemana,
        ...calculados,
        creadoPor: userId,
      },
    });

    return this.calcularOferta(oferta);
  }

  /**
   * Actualizar oferta
   */
  async updateOferta(id, data) {
    const oferta = await prisma.ofertaCapacidad.findUnique({
      where: { id },
    });

    if (!oferta) {
      throw new NotFoundError('Registro de oferta no encontrado');
    }

    const {
      servicio,
      profesionalCargo,
      numeroProfesionales,
      horasTrabajoSemana,
      tiempoPorActividadMin,
      pacientesAtendidosSemana,
    } = data;

    // Recalcular si cambian los campos de cálculo
    let calculados = {};
    const tiempo = tiempoPorActividadMin ?? oferta.tiempoPorActividadMin;
    const pacientesSemana = pacientesAtendidosSemana ?? oferta.pacientesAtendidosSemana;

    if (tiempoPorActividadMin !== undefined || pacientesAtendidosSemana !== undefined) {
      calculados = this.calcularCamposOferta(tiempo, pacientesSemana);
    }

    const updated = await prisma.ofertaCapacidad.update({
      where: { id },
      data: {
        ...(servicio && { servicio }),
        ...(profesionalCargo && { profesionalCargo }),
        ...(numeroProfesionales !== undefined && { numeroProfesionales }),
        ...(horasTrabajoSemana !== undefined && { horasTrabajoSemana }),
        ...(tiempoPorActividadMin !== undefined && { tiempoPorActividadMin }),
        ...(pacientesAtendidosSemana !== undefined && { pacientesAtendidosSemana }),
        ...calculados,
      },
    });

    return this.calcularOferta(updated);
  }

  /**
   * Eliminar oferta (soft delete)
   */
  async deleteOferta(id) {
    const oferta = await prisma.ofertaCapacidad.findUnique({
      where: { id },
    });

    if (!oferta) {
      throw new NotFoundError('Registro de oferta no encontrado');
    }

    await prisma.ofertaCapacidad.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Registro eliminado correctamente' };
  }

  // ==========================================
  // RESUMEN MENSUAL
  // ==========================================

  /**
   * Obtener resumen mensual
   */
  async getResumen(mes, anio) {
    const resumen = await prisma.resumenCapacidadMensual.findFirst({
      where: { mes, anio },
    });

    if (!resumen) {
      // Retornar valores por defecto si no existe
      return {
        mes,
        anio,
        totalPacientesTalentoHumano: null,
        totalPacientesAtendidosMesAnterior: null,
        observaciones: null,
      };
    }

    return resumen;
  }

  /**
   * Guardar/Actualizar resumen mensual
   */
  async saveResumen(data) {
    const { mes, anio, totalPacientesTalentoHumano, totalPacientesAtendidosMesAnterior, observaciones } = data;

    const resumen = await prisma.resumenCapacidadMensual.upsert({
      where: {
        mes_anio: { mes, anio },
      },
      update: {
        totalPacientesTalentoHumano,
        totalPacientesAtendidosMesAnterior,
        observaciones,
      },
      create: {
        mes,
        anio,
        totalPacientesTalentoHumano,
        totalPacientesAtendidosMesAnterior,
        observaciones,
      },
    });

    return resumen;
  }

  /**
   * Obtener resumen completo con capacidad y oferta
   */
  async getResumenCompleto(mes, anio) {
    const [capacidad, oferta, resumenMensual] = await Promise.all([
      this.findAllCapacidad(),
      this.findAllOferta(),
      this.getResumen(mes, anio),
    ]);

    return {
      capacidad,
      oferta,
      resumenMensual,
      comparativo: {
        capacidadMensual: capacidad.totales.totalPacientesMes,
        ofertaMensual: oferta.totales.totalPacientesMes,
        diferencia: capacidad.totales.totalPacientesMes - oferta.totales.totalPacientesMes,
      },
    };
  }

  // ==========================================
  // HELPERS DE CÁLCULO
  // ==========================================

  /**
   * Calcular campos de capacidad
   * Fórmulas:
   * - totalPacientesHora = (60 / duracionPromedioMinutos) * numeroEquiposAmbiente
   * - totalPacientesDia = totalPacientesHora * 8
   * - totalPacientesSemana = totalPacientesDia * 5
   * - totalPacientesMes = totalPacientesSemana * 4
   */
  calcularCamposCapacidad(numeroEquipos, duracionMinutos) {
    if (!duracionMinutos || duracionMinutos <= 0) {
      return {
        totalPacientesHora: 0,
        totalPacientesDia: 0,
        totalPacientesSemana: 0,
        totalPacientesMes: 0,
      };
    }

    const totalPacientesHora = (60 / duracionMinutos) * numeroEquipos;
    const totalPacientesDia = totalPacientesHora * 8;
    const totalPacientesSemana = totalPacientesDia * 5;
    const totalPacientesMes = totalPacientesSemana * 4;

    return {
      totalPacientesHora: Math.round(totalPacientesHora * 100) / 100,
      totalPacientesDia: Math.round(totalPacientesDia * 100) / 100,
      totalPacientesSemana: Math.round(totalPacientesSemana * 100) / 100,
      totalPacientesMes: Math.round(totalPacientesMes * 100) / 100,
    };
  }

  /**
   * Calcular campos de oferta
   * Fórmulas:
   * - pacientesHora = 60 / tiempoPorActividadMin
   * - totalPacientesMes = pacientesAtendidosSemana * 4
   */
  calcularCamposOferta(tiempoPorActividadMin, pacientesAtendidosSemana) {
    const pacientesHora = tiempoPorActividadMin > 0 ? 60 / tiempoPorActividadMin : 0;
    const totalPacientesMes = (pacientesAtendidosSemana || 0) * 4;

    return {
      pacientesHora: Math.round(pacientesHora * 100) / 100,
      totalPacientesMes: Math.round(totalPacientesMes * 100) / 100,
    };
  }

  /**
   * Asegurar que todos los campos calculados estén presentes
   */
  calcularCapacidad(capacidad) {
    const calculados = this.calcularCamposCapacidad(
      capacidad.numeroEquiposAmbiente,
      capacidad.duracionPromedioMinutos
    );
    return { ...capacidad, ...calculados };
  }

  calcularOferta(oferta) {
    const calculados = this.calcularCamposOferta(
      oferta.tiempoPorActividadMin,
      oferta.pacientesAtendidosSemana
    );
    return { ...oferta, ...calculados };
  }

  /**
   * Calcular totales de capacidad
   */
  calcularTotalesCapacidad(capacidades) {
    return {
      totalPacientesHora: capacidades.reduce((sum, c) => sum + (c.totalPacientesHora || 0), 0),
      totalPacientesDia: capacidades.reduce((sum, c) => sum + (c.totalPacientesDia || 0), 0),
      totalPacientesSemana: capacidades.reduce((sum, c) => sum + (c.totalPacientesSemana || 0), 0),
      totalPacientesMes: capacidades.reduce((sum, c) => sum + (c.totalPacientesMes || 0), 0),
    };
  }

  /**
   * Calcular totales de oferta
   */
  calcularTotalesOferta(ofertas) {
    return {
      totalProfesionales: ofertas.reduce((sum, o) => sum + (o.numeroProfesionales || 0), 0),
      totalPacientesHora: ofertas.reduce((sum, o) => sum + (o.pacientesHora || 0), 0),
      totalPacientesSemana: ofertas.reduce((sum, o) => sum + (o.pacientesAtendidosSemana || 0), 0),
      totalPacientesMes: ofertas.reduce((sum, o) => sum + (o.totalPacientesMes || 0), 0),
    };
  }
}

module.exports = new CapacidadCalidad2Service();
