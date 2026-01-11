/**
 * Servicio de Inspecciones de Seguridad
 * Gestiona inspecciones planeadas y no planeadas
 * Normativa: Decreto 1072/2015
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class InspeccionService {
  /**
   * Listar inspecciones
   */
  async findAll({ page = 1, limit = 20, tipo, estado, desde, hasta }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoInspeccion = tipo;
    if (estado) where.estado = estado;

    if (desde || hasta) {
      where.fechaInspeccion = {};
      if (desde) where.fechaInspeccion.gte = new Date(desde);
      if (hasta) where.fechaInspeccion.lte = new Date(hasta);
    }

    const [inspecciones, total] = await Promise.all([
      prisma.sSTInspeccion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaInspeccion: 'desc' },
        include: {
          inspector: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { hallazgos: true },
          },
        },
      }),
      prisma.sSTInspeccion.count({ where }),
    ]);

    return {
      data: inspecciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener inspeccion por ID
   */
  async findById(id) {
    const inspeccion = await prisma.sSTInspeccion.findUnique({
      where: { id },
      include: {
        inspector: {
          select: { id: true, nombre: true, apellido: true },
        },
        listaVerificacion: {
          include: {
            items: {
              orderBy: { orden: 'asc' },
            },
          },
        },
        hallazgos: {
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!inspeccion) {
      throw new NotFoundError('Inspeccion no encontrada');
    }

    return inspeccion;
  }

  /**
   * Crear inspeccion
   */
  async create(data) {
    // Validar inspector
    const inspector = await prisma.tHEmpleado.findUnique({
      where: { id: data.inspectorId },
    });

    if (!inspector) {
      throw new ValidationError('Inspector no encontrado');
    }

    const inspeccion = await prisma.sSTInspeccion.create({
      data: {
        tipoInspeccion: data.tipoInspeccion, // PLANEADA, NO_PLANEADA, EQUIPOS, LOCATIVA, EPP, EMERGENCIAS
        fechaInspeccion: new Date(data.fechaInspeccion),
        area: data.area,
        proceso: data.proceso,
        inspectorId: data.inspectorId,
        acompanante: data.acompanante,
        listaVerificacionId: data.listaVerificacionId,
        observacionesGenerales: data.observacionesGenerales,
        estado: 'EN_PROCESO',
      },
      include: {
        inspector: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return inspeccion;
  }

  /**
   * Actualizar inspeccion
   */
  async update(id, data) {
    const inspeccion = await prisma.sSTInspeccion.findUnique({
      where: { id },
    });

    if (!inspeccion) {
      throw new NotFoundError('Inspeccion no encontrada');
    }

    const updated = await prisma.sSTInspeccion.update({
      where: { id },
      data: {
        ...data,
        fechaInspeccion: data.fechaInspeccion ? new Date(data.fechaInspeccion) : undefined,
      },
    });

    return updated;
  }

  /**
   * Agregar hallazgo
   */
  async agregarHallazgo(inspeccionId, data) {
    const inspeccion = await prisma.sSTInspeccion.findUnique({
      where: { id: inspeccionId },
    });

    if (!inspeccion) {
      throw new NotFoundError('Inspeccion no encontrada');
    }

    const hallazgo = await prisma.sSTHallazgoInspeccion.create({
      data: {
        inspeccionId,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion,
        tipoHallazgo: data.tipoHallazgo, // CONDICION_INSEGURA, ACTO_INSEGURO, OBSERVACION
        nivelRiesgo: data.nivelRiesgo, // ALTO, MEDIO, BAJO
        accionCorrectiva: data.accionCorrectiva,
        responsableId: data.responsableId,
        fechaCompromiso: data.fechaCompromiso ? new Date(data.fechaCompromiso) : null,
        estado: 'ABIERTO',
        urlFoto: data.urlFoto,
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return hallazgo;
  }

  /**
   * Actualizar hallazgo
   */
  async actualizarHallazgo(hallazgoId, data) {
    const hallazgo = await prisma.sSTHallazgoInspeccion.findUnique({
      where: { id: hallazgoId },
    });

    if (!hallazgo) {
      throw new NotFoundError('Hallazgo no encontrado');
    }

    const updated = await prisma.sSTHallazgoInspeccion.update({
      where: { id: hallazgoId },
      data: {
        estado: data.estado,
        fechaCierre: data.estado === 'CERRADO' ? new Date() : undefined,
        accionEjecutada: data.accionEjecutada,
        evidenciaCierre: data.evidenciaCierre,
        observacionesCierre: data.observacionesCierre,
      },
    });

    return updated;
  }

  /**
   * Finalizar inspeccion
   */
  async finalizar(id, data) {
    const inspeccion = await prisma.sSTInspeccion.findUnique({
      where: { id },
      include: { hallazgos: true },
    });

    if (!inspeccion) {
      throw new NotFoundError('Inspeccion no encontrada');
    }

    const hallazgosAlto = inspeccion.hallazgos.filter(h => h.nivelRiesgo === 'ALTO').length;
    const hallazgosMedio = inspeccion.hallazgos.filter(h => h.nivelRiesgo === 'MEDIO').length;
    const hallazgosBajo = inspeccion.hallazgos.filter(h => h.nivelRiesgo === 'BAJO').length;

    const updated = await prisma.sSTInspeccion.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        conclusiones: data.conclusiones,
        recomendaciones: data.recomendaciones,
        calificacionArea: data.calificacionArea,
        totalHallazgosAlto: hallazgosAlto,
        totalHallazgosMedio: hallazgosMedio,
        totalHallazgosBajo: hallazgosBajo,
      },
    });

    return updated;
  }

  /**
   * Obtener hallazgos abiertos
   */
  async getHallazgosAbiertos() {
    return prisma.sSTHallazgoInspeccion.findMany({
      where: {
        estado: 'ABIERTO',
      },
      include: {
        inspeccion: {
          select: { id: true, area: true, fechaInspeccion: true },
        },
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: [{ nivelRiesgo: 'asc' }, { fechaCompromiso: 'asc' }],
    });
  }

  /**
   * Listas de verificacion
   */
  async getListasVerificacion() {
    return prisma.sSTListaVerificacion.findMany({
      where: { activa: true },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Crear lista de verificacion
   */
  async crearListaVerificacion(data) {
    const lista = await prisma.sSTListaVerificacion.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipoInspeccion: data.tipoInspeccion,
        version: 1,
        activa: true,
      },
    });

    return lista;
  }

  /**
   * Agregar item a lista
   */
  async agregarItemLista(listaId, data) {
    const lista = await prisma.sSTListaVerificacion.findUnique({
      where: { id: listaId },
    });

    if (!lista) {
      throw new NotFoundError('Lista de verificacion no encontrada');
    }

    // Obtener orden del ultimo item
    const ultimoItem = await prisma.sSTItemListaVerificacion.findFirst({
      where: { listaId },
      orderBy: { orden: 'desc' },
    });

    const item = await prisma.sSTItemListaVerificacion.create({
      data: {
        listaId,
        descripcion: data.descripcion,
        categoria: data.categoria,
        criterioEvaluacion: data.criterioEvaluacion,
        orden: (ultimoItem?.orden || 0) + 1,
      },
    });

    return item;
  }

  /**
   * Registrar resultado de item en inspeccion
   */
  async registrarResultadoItem(inspeccionId, itemId, data) {
    // Buscar o crear el resultado
    const resultado = await prisma.sSTResultadoItemInspeccion.upsert({
      where: {
        inspeccionId_itemId: { inspeccionId, itemId },
      },
      create: {
        inspeccionId,
        itemId,
        cumple: data.cumple,
        observaciones: data.observaciones,
        evidencia: data.evidencia,
      },
      update: {
        cumple: data.cumple,
        observaciones: data.observaciones,
        evidencia: data.evidencia,
      },
    });

    return resultado;
  }

  /**
   * Estadisticas de inspecciones
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaInspeccion: { gte: fechaInicio, lte: fechaFin },
    };

    const [
      totalInspecciones,
      porTipo,
      totalHallazgos,
      hallazgosAbiertos,
    ] = await Promise.all([
      prisma.sSTInspeccion.count({ where }),
      prisma.sSTInspeccion.groupBy({
        by: ['tipoInspeccion'],
        where,
        _count: true,
      }),
      prisma.sSTHallazgoInspeccion.count({
        where: { inspeccion: { fechaInspeccion: { gte: fechaInicio, lte: fechaFin } } },
      }),
      prisma.sSTHallazgoInspeccion.count({
        where: {
          estado: 'ABIERTO',
          inspeccion: { fechaInspeccion: { gte: fechaInicio, lte: fechaFin } },
        },
      }),
    ]);

    return {
      anio,
      totalInspecciones,
      porTipo: porTipo.map(t => ({ tipo: t.tipoInspeccion, cantidad: t._count })),
      hallazgos: {
        total: totalHallazgos,
        abiertos: hallazgosAbiertos,
        cerrados: totalHallazgos - hallazgosAbiertos,
      },
    };
  }
}

module.exports = new InspeccionService();
