/**
 * Servicio de EPP (Elementos de Proteccion Personal)
 * Gestiona catalogo, entregas y control de dotacion
 * Normativa: Decreto 1072/2015, Resolucion 2400/1979
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class EPPService {
  /**
   * Obtener catalogo de EPP
   */
  async getCatalogo({ categoria }) {
    const where = { activo: true };
    if (categoria) where.categoria = categoria;

    return prisma.sSTElementoEPP.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  /**
   * Obtener elemento EPP por ID
   */
  async getElemento(id) {
    const elemento = await prisma.sSTElementoEPP.findUnique({
      where: { id },
    });

    if (!elemento) {
      throw new NotFoundError('Elemento EPP no encontrado');
    }

    return elemento;
  }

  /**
   * Crear elemento EPP
   */
  async crearElemento(data) {
    return prisma.sSTElementoEPP.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria, // CABEZA, OJOS, OIDOS, RESPIRATORIO, MANOS, PIES, CUERPO, CAIDAS
        normaAplicable: data.normaAplicable,
        vidaUtilDias: data.vidaUtilDias,
        frecuenciaReposicion: data.frecuenciaReposicion,
        tallas: data.tallas,
        instruccionesUso: data.instruccionesUso,
        instruccionesMantenimiento: data.instruccionesMantenimiento,
        activo: true,
      },
    });
  }

  /**
   * Actualizar elemento EPP
   */
  async actualizarElemento(id, data) {
    const elemento = await prisma.sSTElementoEPP.findUnique({
      where: { id },
    });

    if (!elemento) {
      throw new NotFoundError('Elemento EPP no encontrado');
    }

    return prisma.sSTElementoEPP.update({
      where: { id },
      data,
    });
  }

  /**
   * Registrar entrega de EPP
   */
  async registrarEntrega(data) {
    // Validar empleado
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    // Validar elemento
    const elemento = await prisma.sSTElementoEPP.findUnique({
      where: { id: data.elementoId },
    });

    if (!elemento) {
      throw new ValidationError('Elemento EPP no encontrado');
    }

    // Calcular fecha vencimiento
    let fechaVencimiento = null;
    if (elemento.vidaUtilDias) {
      const fechaEntrega = new Date(data.fechaEntrega);
      fechaVencimiento = new Date(fechaEntrega.setDate(fechaEntrega.getDate() + elemento.vidaUtilDias));
    }

    const entrega = await prisma.sSTEntregaEPP.create({
      data: {
        empleadoId: data.empleadoId,
        elementoId: data.elementoId,
        fechaEntrega: new Date(data.fechaEntrega),
        cantidad: data.cantidad || 1,
        talla: data.talla,
        lote: data.lote,
        marca: data.marca,
        proveedor: data.proveedor,
        fechaVencimiento,
        observaciones: data.observaciones,
        entregadoPorId: data.entregadoPorId,
        firmaDigitalEmpleado: data.firmaDigitalEmpleado,
        estado: 'ENTREGADO',
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
        elemento: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
    });

    return entrega;
  }

  /**
   * Obtener entregas de un empleado
   */
  async getEntregasEmpleado(empleadoId) {
    return prisma.sSTEntregaEPP.findMany({
      where: { empleadoId },
      include: {
        elemento: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
      orderBy: { fechaEntrega: 'desc' },
    });
  }

  /**
   * Obtener entregas con filtros
   */
  async getEntregas({ page = 1, limit = 20, empleadoId, elementoId, desde, hasta }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (empleadoId) where.empleadoId = empleadoId;
    if (elementoId) where.elementoId = elementoId;

    if (desde || hasta) {
      where.fechaEntrega = {};
      if (desde) where.fechaEntrega.gte = new Date(desde);
      if (hasta) where.fechaEntrega.lte = new Date(hasta);
    }

    const [entregas, total] = await Promise.all([
      prisma.sSTEntregaEPP.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaEntrega: 'desc' },
        include: {
          empleado: {
            select: { id: true, nombre: true, apellido: true },
          },
          elemento: {
            select: { id: true, nombre: true, categoria: true },
          },
        },
      }),
      prisma.sSTEntregaEPP.count({ where }),
    ]);

    return {
      data: entregas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Registrar devolucion de EPP
   */
  async registrarDevolucion(entregaId, data) {
    const entrega = await prisma.sSTEntregaEPP.findUnique({
      where: { id: entregaId },
    });

    if (!entrega) {
      throw new NotFoundError('Entrega no encontrada');
    }

    const updated = await prisma.sSTEntregaEPP.update({
      where: { id: entregaId },
      data: {
        fechaDevolucion: new Date(),
        motivoDevolucion: data.motivoDevolucion,
        estadoDevolucion: data.estadoDevolucion, // BUEN_ESTADO, DETERIORADO, DANADO
        estado: 'DEVUELTO',
      },
    });

    return updated;
  }

  /**
   * Obtener EPP proximos a vencer
   */
  async getProximosVencer(diasAnticipacion = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.sSTEntregaEPP.findMany({
      where: {
        estado: 'ENTREGADO',
        fechaVencimiento: {
          lte: fechaLimite,
          gte: new Date(),
        },
        empleado: { estado: 'ACTIVO' },
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        elemento: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  /**
   * Obtener EPP vencidos
   */
  async getVencidos() {
    return prisma.sSTEntregaEPP.findMany({
      where: {
        estado: 'ENTREGADO',
        fechaVencimiento: { lt: new Date() },
        empleado: { estado: 'ACTIVO' },
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
        elemento: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  /**
   * Obtener EPP requerido por cargo
   */
  async getEPPPorCargo(cargoId) {
    const profesiograma = await prisma.sSTProfesiograma.findFirst({
      where: { cargoId, vigente: true },
    });

    if (!profesiograma || !profesiograma.eppsRequeridos) {
      return [];
    }

    // eppsRequeridos es un array de IDs de elementos EPP
    return prisma.sSTElementoEPP.findMany({
      where: {
        id: { in: profesiograma.eppsRequeridos },
        activo: true,
      },
    });
  }

  /**
   * Obtener estadisticas de EPP
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaEntrega: { gte: fechaInicio, lte: fechaFin },
    };

    const [
      totalEntregas,
      porCategoria,
      empleadosConEPP,
      vencidos,
    ] = await Promise.all([
      prisma.sSTEntregaEPP.count({ where }),
      prisma.sSTEntregaEPP.groupBy({
        by: ['elementoId'],
        where,
        _count: true,
        _sum: { cantidad: true },
      }),
      prisma.sSTEntregaEPP.groupBy({
        by: ['empleadoId'],
        where,
      }),
      prisma.sSTEntregaEPP.count({
        where: {
          estado: 'ENTREGADO',
          fechaVencimiento: { lt: new Date() },
        },
      }),
    ]);

    // Agrupar por categoria
    const elementosIds = porCategoria.map(p => p.elementoId);
    const elementos = await prisma.sSTElementoEPP.findMany({
      where: { id: { in: elementosIds } },
      select: { id: true, categoria: true },
    });

    const porCategoriaAgrupado = {};
    porCategoria.forEach(p => {
      const elem = elementos.find(e => e.id === p.elementoId);
      if (elem) {
        if (!porCategoriaAgrupado[elem.categoria]) {
          porCategoriaAgrupado[elem.categoria] = { entregas: 0, cantidad: 0 };
        }
        porCategoriaAgrupado[elem.categoria].entregas += p._count;
        porCategoriaAgrupado[elem.categoria].cantidad += p._sum.cantidad || 0;
      }
    });

    return {
      anio,
      totalEntregas,
      empleadosConEPP: empleadosConEPP.length,
      eppVencidos: vencidos,
      porCategoria: Object.entries(porCategoriaAgrupado).map(([cat, data]) => ({
        categoria: cat,
        ...data,
      })),
    };
  }
}

module.exports = new EPPService();
