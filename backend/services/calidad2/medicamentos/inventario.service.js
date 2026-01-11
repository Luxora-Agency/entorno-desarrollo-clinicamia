const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class InventarioMedicamentoService {
  /**
   * Find all inventory items with filters and pagination
   */
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      tipo = '',
      vencido = '',
      alertaVencimiento = '',
      alertaStock = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      activo: true,
    };

    // Filter by type
    if (tipo) {
      where.tipo = tipo;
    }

    // Search filter
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { principioActivo: { contains: search, mode: 'insensitive' } },
        { laboratorio: { contains: search, mode: 'insensitive' } },
        { fabricante: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by vencido (expired)
    if (vencido === 'true') {
      where.fechaVencimiento = { lt: new Date() };
    } else if (vencido === 'false') {
      where.fechaVencimiento = { gte: new Date() };
    }

    // Filter by alert status
    if (alertaVencimiento === 'true') {
      where.tieneAlertaVencimiento = true;
    }
    if (alertaStock === 'true') {
      where.tieneAlertaStock = true;
    }

    const [items, total] = await Promise.all([
      prisma.inventarioMedicamento.findMany({
        where,
        include: {
          registrador: {
            select: { id: true, nombre: true, email: true },
          },
          modificador: {
            select: { id: true, nombre: true, email: true },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.inventarioMedicamento.count({ where }),
    ]);

    return {
      data: items,
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
    const item = await prisma.inventarioMedicamento.findUnique({
      where: { id },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
        modificador: {
          select: { id: true, nombre: true, email: true },
        },
        alertas: {
          where: { atendida: false },
          orderBy: { fechaAlerta: 'desc' },
        },
      },
    });

    if (!item || !item.activo) {
      throw new NotFoundError('Item de inventario no encontrado');
    }

    return item;
  }

  /**
   * Create inventory item
   */
  async create(data, userId) {
    // Validate unique codigo
    const existing = await prisma.inventarioMedicamento.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError(`Ya existe un item con el código ${data.codigo}`);
    }

    // Create item
    const item = await prisma.inventarioMedicamento.create({
      data: {
        ...data,
        registradoPor: userId,
      },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    // Calculate alerts immediately
    await this.calcularAlertas(item.id);

    return item;
  }

  /**
   * Update inventory item
   */
  async update(id, data, userId) {
    const existing = await this.findById(id);

    // If codigo changed, validate it's unique
    if (data.codigo && data.codigo !== existing.codigo) {
      const duplicate = await prisma.inventarioMedicamento.findUnique({
        where: { codigo: data.codigo },
      });
      if (duplicate) {
        throw new ValidationError(`Ya existe un item con el código ${data.codigo}`);
      }
    }

    const updated = await prisma.inventarioMedicamento.update({
      where: { id },
      data: {
        ...data,
        modificadoPor: userId,
      },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
        modificador: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    // Recalculate alerts
    await this.calcularAlertas(id);

    return updated;
  }

  /**
   * Soft delete inventory item
   */
  async delete(id) {
    const existing = await this.findById(id);

    await prisma.inventarioMedicamento.update({
      where: { id },
      data: { activo: false },
    });

    return true;
  }

  /**
   * Get medicamentos only
   */
  async getMedicamentos(filters = {}) {
    return this.findAll({
      ...filters,
      tipo: 'MEDICAMENTO',
    });
  }

  /**
   * Get dispositivos only
   */
  async getDispositivos(filters = {}) {
    return this.findAll({
      ...filters,
      tipo: 'DISPOSITIVO_MEDICO',
    });
  }

  /**
   * Get insumos only
   */
  async getInsumos(filters = {}) {
    return this.findAll({
      ...filters,
      tipo: 'INSUMO_MEDICO_QUIRURGICO',
    });
  }

  /**
   * Get items expiring soon
   */
  async getProximosVencer(dias = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(dias));

    const items = await prisma.inventarioMedicamento.findMany({
      where: {
        activo: true,
        fechaVencimiento: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return items;
  }

  /**
   * Get expired items
   */
  async getVencidos() {
    const today = new Date();

    const items = await prisma.inventarioMedicamento.findMany({
      where: {
        activo: true,
        fechaVencimiento: { lt: today },
      },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { fechaVencimiento: 'desc' },
    });

    return items;
  }

  /**
   * Get items with low stock
   */
  async getStockBajo() {
    const items = await prisma.inventarioMedicamento.findMany({
      where: {
        activo: true,
        tieneAlertaStock: true,
      },
      include: {
        registrador: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { cantidadActual: 'asc' },
    });

    return items;
  }

  /**
   * Get inventory statistics
   */
  async getEstadisticas() {
    const today = new Date();

    const [
      totalItems,
      totalMedicamentos,
      totalDispositivos,
      totalInsumos,
      vencidos,
      proximosVencer30,
      proximosVencer60,
      proximosVencer90,
      stockBajo,
    ] = await Promise.all([
      // Total active items
      prisma.inventarioMedicamento.count({
        where: { activo: true },
      }),

      // Total by type
      prisma.inventarioMedicamento.count({
        where: { activo: true, tipo: 'MEDICAMENTO' },
      }),
      prisma.inventarioMedicamento.count({
        where: { activo: true, tipo: 'DISPOSITIVO_MEDICO' },
      }),
      prisma.inventarioMedicamento.count({
        where: { activo: true, tipo: 'INSUMO_MEDICO_QUIRURGICO' },
      }),

      // Vencidos
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: { lt: today },
        },
      }),

      // Próximos a vencer
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: {
            gte: today,
            lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: {
            gte: today,
            lte: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          fechaVencimiento: {
            gte: today,
            lte: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Stock bajo
      prisma.inventarioMedicamento.count({
        where: {
          activo: true,
          tieneAlertaStock: true,
        },
      }),
    ]);

    return {
      total: {
        items: totalItems,
        medicamentos: totalMedicamentos,
        dispositivos: totalDispositivos,
        insumos: totalInsumos,
      },
      alertas: {
        vencidos,
        proximosVencer30,
        proximosVencer60,
        proximosVencer90,
        stockBajo,
      },
    };
  }

  /**
   * Calculate alerts for a specific item
   */
  async calcularAlertas(id) {
    const item = await prisma.inventarioMedicamento.findUnique({
      where: { id },
    });

    if (!item || !item.activo) {
      return;
    }

    const today = new Date();
    const diasParaVencer = Math.floor(
      (item.fechaVencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let tieneAlertaVencimiento = false;
    let tieneAlertaStock = false;

    // Alert for expiration
    if (diasParaVencer <= 90) {
      tieneAlertaVencimiento = true;
    }

    // Alert for low stock
    if (item.stockMinimo && item.cantidadActual <= item.stockMinimo) {
      tieneAlertaStock = true;
    }

    // Update item with calculated values
    await prisma.inventarioMedicamento.update({
      where: { id },
      data: {
        diasParaVencer,
        tieneAlertaVencimiento,
        tieneAlertaStock,
      },
    });

    return {
      diasParaVencer,
      tieneAlertaVencimiento,
      tieneAlertaStock,
    };
  }

  /**
   * Recalculate alerts for all active items (cron job)
   */
  async recalcularTodasAlertas() {
    const items = await prisma.inventarioMedicamento.findMany({
      where: { activo: true },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      items.map((item) => this.calcularAlertas(item.id))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      total: items.length,
      successful,
      failed,
    };
  }
}

module.exports = new InventarioMedicamentoService();
