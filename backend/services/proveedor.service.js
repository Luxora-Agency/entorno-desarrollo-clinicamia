/**
 * Servicio de Proveedores
 *
 * Gestión completa de proveedores para el módulo de compras,
 * incluyendo sincronización con Siigo.
 */

const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ProveedorService {
  /**
   * Obtener todos los proveedores con filtros
   */
  async getAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      tipoProveedor,
      activo,
      orderBy = 'razonSocial',
      order = 'asc'
    } = filters;

    const where = {};

    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { nombreComercial: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tipoProveedor) {
      where.tipoProveedor = tipoProveedor;
    }

    if (activo !== undefined) {
      where.activo = activo === 'true' || activo === true;
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.proveedor.count({ where })
    ]);

    return {
      data: proveedores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener proveedor por ID
   */
  async getById(id) {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        ordenesCompra: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            numero: true,
            fecha: true,
            total: true,
            estado: true
          }
        },
        facturasProveedor: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            numero: true,
            fechaFactura: true,
            total: true,
            saldoPendiente: true,
            estado: true
          }
        },
        _count: {
          select: {
            ordenesCompra: true,
            facturasProveedor: true
          }
        }
      }
    });

    if (!proveedor) {
      throw new NotFoundError(`Proveedor ${id} no encontrado`);
    }

    return proveedor;
  }

  /**
   * Obtener proveedor por documento
   */
  async getByDocumento(documento) {
    return prisma.proveedor.findUnique({
      where: { documento }
    });
  }

  /**
   * Crear nuevo proveedor
   */
  async create(data) {
    // Validar documento único
    const existing = await this.getByDocumento(data.documento);
    if (existing) {
      throw new ValidationError(`Ya existe un proveedor con documento ${data.documento}`);
    }

    // Validar dígito de verificación para NIT
    if (data.tipoDocumento === 'NIT' && !data.digitoVerificacion) {
      throw new ValidationError('El dígito de verificación es requerido para NIT');
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        tipoDocumento: data.tipoDocumento,
        documento: data.documento,
        digitoVerificacion: data.digitoVerificacion,
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial,
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        telefono: data.telefono,
        email: data.email,
        regimenTributario: data.regimenTributario || 'Simplificado',
        responsabilidadFiscal: data.responsabilidadFiscal || ['R-99-PN'],
        actividadEconomica: data.actividadEconomica,
        banco: data.banco,
        tipoCuenta: data.tipoCuenta,
        numeroCuenta: data.numeroCuenta,
        tipoProveedor: data.tipoProveedor,
        plazoCredito: data.plazoCredito || 30,
        limiteCredito: data.limiteCredito,
        activo: true
      }
    });

    // Sincronizar con Siigo de forma asíncrona (no bloquear)
    this.syncWithSiigo(proveedor.id).catch(err => {
      console.error(`[Proveedor] Error sincronizando con Siigo: ${err.message}`);
    });

    return proveedor;
  }

  /**
   * Actualizar proveedor
   */
  async update(id, data) {
    const proveedor = await this.getById(id);

    // Si cambia el documento, validar que no exista otro
    if (data.documento && data.documento !== proveedor.documento) {
      const existing = await this.getByDocumento(data.documento);
      if (existing) {
        throw new ValidationError(`Ya existe un proveedor con documento ${data.documento}`);
      }
    }

    const updated = await prisma.proveedor.update({
      where: { id },
      data: {
        tipoDocumento: data.tipoDocumento,
        documento: data.documento,
        digitoVerificacion: data.digitoVerificacion,
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial,
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        telefono: data.telefono,
        email: data.email,
        regimenTributario: data.regimenTributario,
        responsabilidadFiscal: data.responsabilidadFiscal,
        actividadEconomica: data.actividadEconomica,
        banco: data.banco,
        tipoCuenta: data.tipoCuenta,
        numeroCuenta: data.numeroCuenta,
        tipoProveedor: data.tipoProveedor,
        plazoCredito: data.plazoCredito,
        limiteCredito: data.limiteCredito,
        activo: data.activo
      }
    });

    // Re-sincronizar con Siigo
    if (updated.siigoId) {
      this.syncWithSiigo(id).catch(err => {
        console.error(`[Proveedor] Error re-sincronizando con Siigo: ${err.message}`);
      });
    }

    return updated;
  }

  /**
   * Eliminar proveedor (soft delete)
   */
  async delete(id) {
    await this.getById(id);

    // Verificar si tiene órdenes de compra o facturas activas
    const ordenesActivas = await prisma.ordenCompra.count({
      where: {
        proveedorId: id,
        estado: { notIn: ['Cancelada', 'Recibida'] }
      }
    });

    if (ordenesActivas > 0) {
      throw new ValidationError(`No se puede eliminar: tiene ${ordenesActivas} órdenes de compra activas`);
    }

    const facturasPendientes = await prisma.facturaProveedor.count({
      where: {
        proveedorId: id,
        estado: { in: ['Pendiente', 'Parcial'] }
      }
    });

    if (facturasPendientes > 0) {
      throw new ValidationError(`No se puede eliminar: tiene ${facturasPendientes} facturas pendientes de pago`);
    }

    // Soft delete
    return prisma.proveedor.update({
      where: { id },
      data: { activo: false }
    });
  }

  /**
   * Obtener proveedores por tipo
   */
  async getByTipo(tipo) {
    return prisma.proveedor.findMany({
      where: {
        tipoProveedor: tipo,
        activo: true
      },
      orderBy: { razonSocial: 'asc' }
    });
  }

  /**
   * Obtener tipos de proveedor disponibles
   */
  getTiposProveedor() {
    return [
      { value: 'Medicamentos', label: 'Medicamentos' },
      { value: 'Insumos', label: 'Insumos Médicos' },
      { value: 'Servicios', label: 'Servicios' },
      { value: 'Equipos', label: 'Equipos Médicos' },
      { value: 'Laboratorio', label: 'Laboratorio' },
      { value: 'Papeleria', label: 'Papelería y Oficina' },
      { value: 'Aseo', label: 'Aseo y Limpieza' },
      { value: 'Tecnologia', label: 'Tecnología' },
      { value: 'Otro', label: 'Otro' }
    ];
  }

  /**
   * Estadísticas de proveedores
   */
  async getStats() {
    const [
      total,
      activos,
      porTipo,
      cuentasPorPagar
    ] = await Promise.all([
      prisma.proveedor.count(),
      prisma.proveedor.count({ where: { activo: true } }),
      prisma.proveedor.groupBy({
        by: ['tipoProveedor'],
        _count: { id: true },
        where: { activo: true }
      }),
      prisma.facturaProveedor.aggregate({
        where: {
          estado: { in: ['Pendiente', 'Parcial'] }
        },
        _sum: { saldoPendiente: true }
      })
    ]);

    return {
      total,
      activos,
      inactivos: total - activos,
      porTipo: porTipo.map(t => ({
        tipo: t.tipoProveedor,
        cantidad: t._count.id
      })),
      totalCuentasPorPagar: cuentasPorPagar._sum.saldoPendiente || 0
    };
  }

  /**
   * Obtener saldo pendiente de un proveedor
   */
  async getSaldoPendiente(proveedorId) {
    const result = await prisma.facturaProveedor.aggregate({
      where: {
        proveedorId,
        estado: { in: ['Pendiente', 'Parcial'] }
      },
      _sum: { saldoPendiente: true }
    });

    return result._sum.saldoPendiente || 0;
  }

  /**
   * Obtener historial de transacciones
   */
  async getHistorial(proveedorId, filters = {}) {
    const { page = 1, limit = 20, tipo } = filters;

    let data = [];

    if (!tipo || tipo === 'ordenes') {
      const ordenes = await prisma.ordenCompra.findMany({
        where: { proveedorId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      data = [...data, ...ordenes.map(o => ({ ...o, tipo: 'orden' }))];
    }

    if (!tipo || tipo === 'facturas') {
      const facturas = await prisma.facturaProveedor.findMany({
        where: { proveedorId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      data = [...data, ...facturas.map(f => ({ ...f, tipo: 'factura' }))];
    }

    if (!tipo || tipo === 'pagos') {
      const pagos = await prisma.pagoProveedor.findMany({
        where: {
          facturaProveedor: { proveedorId }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          facturaProveedor: {
            select: { numero: true }
          }
        }
      });
      data = [...data, ...pagos.map(p => ({ ...p, tipo: 'pago' }))];
    }

    // Ordenar por fecha
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return data.slice(0, limit);
  }

  /**
   * Sincronizar proveedor con Siigo
   */
  async syncWithSiigo(proveedorId) {
    try {
      const customerSiigoService = require('./siigo/customer.siigo.service');
      await customerSiigoService.syncProveedor(proveedorId);
      console.log(`[Proveedor] Sincronizado con Siigo: ${proveedorId}`);
    } catch (error) {
      console.error(`[Proveedor] Error sincronizando ${proveedorId} con Siigo:`, error.message);
      throw error;
    }
  }

  /**
   * Buscar proveedores para autocompletado
   */
  async search(query, limit = 10) {
    return prisma.proveedor.findMany({
      where: {
        activo: true,
        OR: [
          { razonSocial: { contains: query, mode: 'insensitive' } },
          { nombreComercial: { contains: query, mode: 'insensitive' } },
          { documento: { contains: query } }
        ]
      },
      select: {
        id: true,
        documento: true,
        razonSocial: true,
        nombreComercial: true,
        tipoProveedor: true,
        plazoCredito: true
      },
      orderBy: { razonSocial: 'asc' },
      take: limit
    });
  }

  /**
   * Validar límite de crédito
   */
  async validarLimiteCredito(proveedorId, montoNuevo) {
    const proveedor = await this.getById(proveedorId);

    if (!proveedor.limiteCredito) {
      return { valido: true, mensaje: 'Sin límite de crédito configurado' };
    }

    const saldoActual = await this.getSaldoPendiente(proveedorId);
    const saldoProyectado = parseFloat(saldoActual) + parseFloat(montoNuevo);

    if (saldoProyectado > parseFloat(proveedor.limiteCredito)) {
      return {
        valido: false,
        mensaje: `Excede límite de crédito. Límite: $${proveedor.limiteCredito}, Saldo actual: $${saldoActual}, Nuevo monto: $${montoNuevo}`,
        limiteCredito: proveedor.limiteCredito,
        saldoActual,
        disponible: parseFloat(proveedor.limiteCredito) - parseFloat(saldoActual)
      };
    }

    return {
      valido: true,
      limiteCredito: proveedor.limiteCredito,
      saldoActual,
      disponible: parseFloat(proveedor.limiteCredito) - saldoProyectado
    };
  }
}

module.exports = new ProveedorService();
