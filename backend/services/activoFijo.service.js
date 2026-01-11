/**
 * Servicio de Activos Fijos
 *
 * Gestión de activos fijos (equipos médicos, mobiliario, tecnología)
 * con cálculo de depreciación y contabilización en Siigo.
 */

const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ActivoFijoService {
  // =====================================================
  // CRUD ACTIVOS FIJOS
  // =====================================================

  /**
   * Obtener todos los activos fijos con filtros
   */
  async getAll(filtros = {}) {
    const {
      tipo,
      estado,
      departamentoId,
      search,
      limit = 100,
      offset = 0
    } = filtros;

    const where = {};

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (departamentoId) where.departamentoId = departamentoId;

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [activos, total] = await Promise.all([
      prisma.activoFijo.findMany({
        where,
        include: {
          _count: {
            select: {
              depreciaciones: true,
              mantenimientos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.activoFijo.count({ where })
    ]);

    return { activos, total };
  }

  /**
   * Obtener activo por ID
   */
  async getById(id) {
    const activo = await prisma.activoFijo.findUnique({
      where: { id },
      include: {
        depreciaciones: {
          orderBy: { periodo: 'desc' },
          take: 12 // Últimos 12 meses
        },
        mantenimientos: {
          orderBy: { fecha: 'desc' },
          take: 10
        }
      }
    });

    if (!activo) {
      throw new NotFoundError('Activo fijo no encontrado');
    }

    return activo;
  }

  /**
   * Crear nuevo activo fijo
   */
  async create(data) {
    // Verificar código único
    const existente = await prisma.activoFijo.findUnique({
      where: { codigo: data.codigo }
    });

    if (existente) {
      throw new ValidationError(`Ya existe un activo con el código ${data.codigo}`);
    }

    // Calcular valor en libros inicial (= valor adquisición)
    const valorEnLibros = parseFloat(data.valorAdquisicion);

    const activo = await prisma.activoFijo.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        grupo: data.grupo,
        departamentoId: data.departamentoId || null,
        ubicacionFisica: data.ubicacionFisica || null,
        valorAdquisicion: data.valorAdquisicion,
        fechaAdquisicion: new Date(data.fechaAdquisicion),
        vidaUtilAnios: data.vidaUtilAnios,
        valorResidual: data.valorResidual || 0,
        metodoDepreciacion: data.metodoDepreciacion || 'LINEA_RECTA',
        depreciacionAcumulada: 0,
        valorEnLibros: valorEnLibros,
        proveedorId: data.proveedorId || null,
        numeroFactura: data.numeroFactura || null,
        estado: 'Activo',
        proximoMantenimiento: data.proximoMantenimiento ? new Date(data.proximoMantenimiento) : null
      }
    });

    return activo;
  }

  /**
   * Actualizar activo fijo
   */
  async update(id, data) {
    const activo = await prisma.activoFijo.findUnique({ where: { id } });

    if (!activo) {
      throw new NotFoundError('Activo fijo no encontrado');
    }

    // Si cambia el código, verificar que no exista
    if (data.codigo && data.codigo !== activo.codigo) {
      const existente = await prisma.activoFijo.findUnique({
        where: { codigo: data.codigo }
      });
      if (existente) {
        throw new ValidationError(`Ya existe un activo con el código ${data.codigo}`);
      }
    }

    const updateData = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.grupo !== undefined) updateData.grupo = data.grupo;
    if (data.departamentoId !== undefined) updateData.departamentoId = data.departamentoId;
    if (data.ubicacionFisica !== undefined) updateData.ubicacionFisica = data.ubicacionFisica;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.proximoMantenimiento !== undefined) {
      updateData.proximoMantenimiento = data.proximoMantenimiento ? new Date(data.proximoMantenimiento) : null;
    }

    return prisma.activoFijo.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Dar de baja un activo
   */
  async darDeBaja(id, motivo) {
    const activo = await prisma.activoFijo.findUnique({ where: { id } });

    if (!activo) {
      throw new NotFoundError('Activo fijo no encontrado');
    }

    if (activo.estado === 'Dado de baja') {
      throw new ValidationError('El activo ya está dado de baja');
    }

    return prisma.activoFijo.update({
      where: { id },
      data: {
        estado: 'Dado de baja',
        descripcion: activo.descripcion
          ? `${activo.descripcion}\n\n[BAJA] ${new Date().toISOString()}: ${motivo}`
          : `[BAJA] ${new Date().toISOString()}: ${motivo}`
      }
    });
  }

  // =====================================================
  // DEPRECIACIÓN
  // =====================================================

  /**
   * Calcular depreciación mensual de un activo (método línea recta)
   */
  calcularDepreciacionMensual(activo) {
    const valorAdquisicion = parseFloat(activo.valorAdquisicion);
    const valorResidual = parseFloat(activo.valorResidual || 0);
    const vidaUtilMeses = activo.vidaUtilAnios * 12;

    const baseDepreciable = valorAdquisicion - valorResidual;
    const depreciacionAcumulada = parseFloat(activo.depreciacionAcumulada || 0);

    // Si ya está totalmente depreciado
    if (depreciacionAcumulada >= baseDepreciable) {
      return 0;
    }

    const depreciacionMensual = baseDepreciable / vidaUtilMeses;

    // No depreciar más allá de la base depreciable
    const restante = baseDepreciable - depreciacionAcumulada;
    return Math.min(depreciacionMensual, restante);
  }

  /**
   * Ejecutar depreciación mensual para todos los activos activos
   */
  async ejecutarDepreciacionMensual(periodo, usuarioId) {
    // Formato periodo: YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new ValidationError('Formato de período inválido. Use YYYY-MM');
    }

    // Verificar si ya se ejecutó la depreciación del período
    const depreciacionExistente = await prisma.depreciacionActivo.findFirst({
      where: { periodo }
    });

    if (depreciacionExistente) {
      throw new ValidationError(`Ya se ejecutó la depreciación del período ${periodo}`);
    }

    // Obtener activos activos
    const activos = await prisma.activoFijo.findMany({
      where: { estado: 'Activo' }
    });

    const resultados = {
      procesados: 0,
      omitidos: 0,
      totalDepreciacion: 0,
      detalle: []
    };

    for (const activo of activos) {
      const depreciacionMensual = this.calcularDepreciacionMensual(activo);

      if (depreciacionMensual <= 0) {
        resultados.omitidos++;
        continue;
      }

      const nuevaDepreciacionAcumulada = parseFloat(activo.depreciacionAcumulada) + depreciacionMensual;
      const nuevoValorEnLibros = parseFloat(activo.valorAdquisicion) - nuevaDepreciacionAcumulada;

      // Crear registro de depreciación
      await prisma.$transaction([
        prisma.depreciacionActivo.create({
          data: {
            activoFijoId: activo.id,
            periodo,
            valorDepreciacion: depreciacionMensual,
            depreciacionAcumulada: nuevaDepreciacionAcumulada,
            valorEnLibros: Math.max(nuevoValorEnLibros, parseFloat(activo.valorResidual || 0))
          }
        }),
        prisma.activoFijo.update({
          where: { id: activo.id },
          data: {
            depreciacionAcumulada: nuevaDepreciacionAcumulada,
            valorEnLibros: Math.max(nuevoValorEnLibros, parseFloat(activo.valorResidual || 0))
          }
        })
      ]);

      resultados.procesados++;
      resultados.totalDepreciacion += depreciacionMensual;
      resultados.detalle.push({
        activoId: activo.id,
        codigo: activo.codigo,
        nombre: activo.nombre,
        depreciacion: depreciacionMensual,
        nuevoValorEnLibros: Math.max(nuevoValorEnLibros, parseFloat(activo.valorResidual || 0))
      });
    }

    return resultados;
  }

  /**
   * Obtener historial de depreciaciones por período
   */
  async getDepreciacionesPorPeriodo(periodo) {
    const depreciaciones = await prisma.depreciacionActivo.findMany({
      where: { periodo },
      include: {
        activoFijo: {
          select: {
            codigo: true,
            nombre: true,
            tipo: true,
            grupo: true
          }
        }
      },
      orderBy: { activoFijo: { codigo: 'asc' } }
    });

    const totales = {
      cantidad: depreciaciones.length,
      totalDepreciacion: depreciaciones.reduce((sum, d) => sum + parseFloat(d.valorDepreciacion), 0)
    };

    // Agrupar por tipo
    const porTipo = {};
    for (const dep of depreciaciones) {
      const tipo = dep.activoFijo.tipo;
      if (!porTipo[tipo]) {
        porTipo[tipo] = { cantidad: 0, total: 0 };
      }
      porTipo[tipo].cantidad++;
      porTipo[tipo].total += parseFloat(dep.valorDepreciacion);
    }

    return {
      periodo,
      totales,
      porTipo,
      detalle: depreciaciones
    };
  }

  /**
   * Obtener resumen de depreciaciones para contabilización
   * Agrupado por cuenta contable (grupo)
   */
  async getResumenDepreciacionParaContabilizar(periodo) {
    const depreciaciones = await prisma.depreciacionActivo.findMany({
      where: {
        periodo,
        siigoJournalId: null // Solo las no contabilizadas
      },
      include: {
        activoFijo: {
          select: {
            tipo: true,
            grupo: true
          }
        }
      }
    });

    // Agrupar por tipo de activo
    const porTipo = {};
    for (const dep of depreciaciones) {
      const tipo = dep.activoFijo.tipo;
      if (!porTipo[tipo]) {
        porTipo[tipo] = {
          tipo,
          cuentaGasto: this.getCuentaGastoDepreciacion(tipo),
          cuentaAcumulada: this.getCuentaDepreciacionAcumulada(tipo),
          total: 0,
          depreciaciones: []
        };
      }
      porTipo[tipo].total += parseFloat(dep.valorDepreciacion);
      porTipo[tipo].depreciaciones.push(dep);
    }

    return {
      periodo,
      pendientesContabilizar: depreciaciones.length,
      totalGeneral: depreciaciones.reduce((sum, d) => sum + parseFloat(d.valorDepreciacion), 0),
      porTipo: Object.values(porTipo)
    };
  }

  /**
   * Marcar depreciaciones como contabilizadas
   */
  async marcarDepreciacionesContabilizadas(periodo, siigoJournalId) {
    return prisma.depreciacionActivo.updateMany({
      where: { periodo, siigoJournalId: null },
      data: { siigoJournalId }
    });
  }

  // =====================================================
  // MANTENIMIENTOS
  // =====================================================

  /**
   * Registrar mantenimiento
   */
  async registrarMantenimiento(activoId, data, usuarioId) {
    const activo = await prisma.activoFijo.findUnique({ where: { id: activoId } });

    if (!activo) {
      throw new NotFoundError('Activo fijo no encontrado');
    }

    const mantenimiento = await prisma.mantenimientoActivo.create({
      data: {
        activoFijoId: activoId,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        tipo: data.tipo, // Preventivo | Correctivo | Calibración
        descripcion: data.descripcion,
        costo: data.costo || 0,
        proveedorId: data.proveedorId || null,
        registradoPor: usuarioId
      }
    });

    // Actualizar fecha de último mantenimiento en el activo
    await prisma.activoFijo.update({
      where: { id: activoId },
      data: {
        fechaUltimoMantenimiento: mantenimiento.fecha,
        estado: 'Activo' // Volver a activo si estaba en mantenimiento
      }
    });

    return mantenimiento;
  }

  /**
   * Obtener mantenimientos de un activo
   */
  async getMantenimientos(activoId) {
    return prisma.mantenimientoActivo.findMany({
      where: { activoFijoId: activoId },
      orderBy: { fecha: 'desc' }
    });
  }

  /**
   * Obtener activos que requieren mantenimiento
   */
  async getActivosRequierenMantenimiento() {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    return prisma.activoFijo.findMany({
      where: {
        estado: 'Activo',
        proximoMantenimiento: {
          lte: en30Dias
        }
      },
      orderBy: { proximoMantenimiento: 'asc' }
    });
  }

  // =====================================================
  // REPORTES Y ESTADÍSTICAS
  // =====================================================

  /**
   * Dashboard de activos fijos
   */
  async getDashboard() {
    const [
      totalActivos,
      activosPorEstado,
      activosPorTipo,
      valorTotal,
      depreciacionAcumuladaTotal,
      proximosMantenimientos
    ] = await Promise.all([
      prisma.activoFijo.count(),

      prisma.activoFijo.groupBy({
        by: ['estado'],
        _count: true
      }),

      prisma.activoFijo.groupBy({
        by: ['tipo'],
        _count: true,
        _sum: {
          valorAdquisicion: true,
          valorEnLibros: true,
          depreciacionAcumulada: true
        }
      }),

      prisma.activoFijo.aggregate({
        _sum: { valorAdquisicion: true }
      }),

      prisma.activoFijo.aggregate({
        _sum: { depreciacionAcumulada: true }
      }),

      this.getActivosRequierenMantenimiento()
    ]);

    // Calcular valor en libros total
    const valorEnLibrosTotal = parseFloat(valorTotal._sum.valorAdquisicion || 0) -
                               parseFloat(depreciacionAcumuladaTotal._sum.depreciacionAcumulada || 0);

    return {
      resumen: {
        totalActivos,
        valorAdquisicionTotal: parseFloat(valorTotal._sum.valorAdquisicion || 0),
        depreciacionAcumuladaTotal: parseFloat(depreciacionAcumuladaTotal._sum.depreciacionAcumulada || 0),
        valorEnLibrosTotal
      },
      activosPorEstado: activosPorEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      activosPorTipo: activosPorTipo.map(item => ({
        tipo: item.tipo,
        cantidad: item._count,
        valorAdquisicion: parseFloat(item._sum.valorAdquisicion || 0),
        valorEnLibros: parseFloat(item._sum.valorEnLibros || 0),
        depreciacionAcumulada: parseFloat(item._sum.depreciacionAcumulada || 0)
      })),
      proximosMantenimientos: proximosMantenimientos.slice(0, 10),
      alertasMantenimiento: proximosMantenimientos.filter(a =>
        a.proximoMantenimiento && new Date(a.proximoMantenimiento) <= new Date()
      ).length
    };
  }

  /**
   * Generar reporte de activos fijos
   */
  async generarReporte(filtros = {}) {
    const { tipo, estado, departamentoId, fechaDesde, fechaHasta } = filtros;

    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (departamentoId) where.departamentoId = departamentoId;
    if (fechaDesde || fechaHasta) {
      where.fechaAdquisicion = {};
      if (fechaDesde) where.fechaAdquisicion.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaAdquisicion.lte = new Date(fechaHasta);
    }

    const activos = await prisma.activoFijo.findMany({
      where,
      orderBy: [
        { tipo: 'asc' },
        { codigo: 'asc' }
      ]
    });

    // Calcular totales
    const totales = activos.reduce((acc, activo) => ({
      valorAdquisicion: acc.valorAdquisicion + parseFloat(activo.valorAdquisicion),
      depreciacionAcumulada: acc.depreciacionAcumulada + parseFloat(activo.depreciacionAcumulada),
      valorEnLibros: acc.valorEnLibros + parseFloat(activo.valorEnLibros)
    }), { valorAdquisicion: 0, depreciacionAcumulada: 0, valorEnLibros: 0 });

    return {
      filtros,
      fechaGeneracion: new Date(),
      cantidadActivos: activos.length,
      totales,
      activos
    };
  }

  // =====================================================
  // UTILIDADES - CUENTAS CONTABLES PUC
  // =====================================================

  /**
   * Obtener cuenta de gasto de depreciación según tipo de activo
   * PUC Colombia
   */
  getCuentaGastoDepreciacion(tipo) {
    const cuentas = {
      'EquipoMedico': '516515', // Gasto depreciación equipo médico-científico
      'Mobiliario': '516510',   // Gasto depreciación muebles y enseres
      'Vehiculo': '516520',     // Gasto depreciación vehículos
      'Inmueble': '516505',     // Gasto depreciación construcciones
      'Tecnologia': '516525'    // Gasto depreciación equipo de cómputo
    };
    return cuentas[tipo] || '516595'; // Otros
  }

  /**
   * Obtener cuenta de depreciación acumulada según tipo de activo
   * PUC Colombia
   */
  getCuentaDepreciacionAcumulada(tipo) {
    const cuentas = {
      'EquipoMedico': '159215', // Depreciación acumulada equipo médico
      'Mobiliario': '159210',   // Depreciación acumulada muebles
      'Vehiculo': '159220',     // Depreciación acumulada vehículos
      'Inmueble': '159205',     // Depreciación acumulada construcciones
      'Tecnologia': '159225'    // Depreciación acumulada equipo cómputo
    };
    return cuentas[tipo] || '159295'; // Otros
  }

  /**
   * Obtener cuenta de activo según tipo
   * PUC Colombia
   */
  getCuentaActivo(tipo) {
    const cuentas = {
      'EquipoMedico': '152410', // Equipo médico-científico
      'Mobiliario': '152405',   // Muebles y enseres
      'Vehiculo': '154005',     // Vehículos
      'Inmueble': '151605',     // Construcciones y edificaciones
      'Tecnologia': '152805'    // Equipo de cómputo y comunicación
    };
    return cuentas[tipo] || '159995'; // Otros activos
  }

  /**
   * Obtener tipos de activos válidos
   */
  getTiposActivo() {
    return [
      { codigo: 'EquipoMedico', nombre: 'Equipo Médico-Científico', vidaUtilSugerida: 10 },
      { codigo: 'Mobiliario', nombre: 'Muebles y Enseres', vidaUtilSugerida: 10 },
      { codigo: 'Vehiculo', nombre: 'Vehículos', vidaUtilSugerida: 5 },
      { codigo: 'Inmueble', nombre: 'Inmuebles', vidaUtilSugerida: 20 },
      { codigo: 'Tecnologia', nombre: 'Equipo de Cómputo', vidaUtilSugerida: 5 }
    ];
  }
}

module.exports = new ActivoFijoService();
