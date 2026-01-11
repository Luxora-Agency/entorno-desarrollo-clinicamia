/**
 * Service de órdenes de medicamentos
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class OrdenMedicamentoService {
  /**
   * Obtener todas las órdenes de medicamentos con filtros
   */
  async getAll({ 
    page = 1, 
    limit = 20, 
    paciente_id, 
    estado, 
    cita_id,
    admision_id 
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(paciente_id && { pacienteId: paciente_id }),
      ...(estado && { estado }),
      ...(cita_id && { citaId: cita_id }),
      ...(admision_id && { admisionId: admision_id }),
    };

    const [ordenes, total] = await Promise.all([
      prisma.ordenMedicamento.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaOrden: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
            },
          },
          doctor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          despachador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          items: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  presentacion: true,
                  principioActivo: true,
                },
              },
            },
          },
        },
      }),
      prisma.ordenMedicamento.count({ where }),
    ]);

    return {
      ordenes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una orden de medicamento por ID
   */
  async getById(id) {
    const orden = await prisma.ordenMedicamento.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        despachador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        cita: true,
        admision: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundError('Orden de medicamento no encontrada');
    }

    return orden;
  }

  /**
   * Crear una nueva orden de medicamento
   */
  async create(data) {
    // Validar campos requeridos
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');
    if (!data.doctor_id) throw new ValidationError('doctor_id es requerido');
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError('items es requerido y debe contener al menos un producto');
    }

    // Calcular total
    let total = 0;
    const itemsData = [];

    for (const item of data.items) {
      if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
        throw new ValidationError('Cada item debe tener producto_id, cantidad y precio_unitario');
      }

      const subtotal = (parseFloat(item.precio_unitario) * parseInt(item.cantidad)) - (parseFloat(item.descuento) || 0);
      total += subtotal;

      itemsData.push({
        productoId: item.producto_id,
        cantidad: parseInt(item.cantidad),
        precioUnitario: parseFloat(item.precio_unitario),
        descuento: parseFloat(item.descuento) || 0,
        subtotal,
        indicaciones: item.indicaciones || null,
      });
    }

    // Crear orden con items
    const orden = await prisma.ordenMedicamento.create({
      data: {
        pacienteId: data.paciente_id,
        citaId: data.cita_id || null,
        admisionId: data.admision_id || null,
        doctorId: data.doctor_id,
        estado: data.estado || 'Pendiente',
        observaciones: data.observaciones || null,
        recetaDigital: data.receta_digital || null,
        archivoReceta: data.archivo_receta || null,
        total,
        fechaOrden: data.fecha_orden ? new Date(data.fecha_orden) : new Date(),
        items: {
          create: itemsData,
        },
      },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    return orden;
  }

  /**
   * Actualizar una orden de medicamento
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    
    if (data.estado) updateData.estado = data.estado;
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
    if (data.receta_digital !== undefined) updateData.recetaDigital = data.receta_digital;
    if (data.archivo_receta !== undefined) updateData.archivoReceta = data.archivo_receta;
    if (data.fecha_despacho) updateData.fechaDespacho = new Date(data.fecha_despacho);
    if (data.despachado_por) updateData.despachadoPor = data.despachado_por;

    const orden = await prisma.ordenMedicamento.update({
      where: { id },
      data: updateData,
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        despachador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    return orden;
  }

  /**
   * Despachar una orden de medicamento
   */
  async despachar(id, despachadoPorId) {
    const orden = await this.getById(id);

    if (orden.estado === 'Despachada') {
      throw new ValidationError('La orden ya ha sido despachada');
    }

    if (orden.estado === 'Cancelada') {
      throw new ValidationError('No se puede despachar una orden cancelada');
    }

    // Verificar stock disponible para todos los items
    for (const item of orden.items) {
      const producto = await prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new NotFoundError(`Producto no encontrado: ${item.productoId}`);
      }

      const disponible = producto.cantidadTotal - producto.cantidadConsumida;
      if (disponible < item.cantidad) {
        throw new ValidationError(
          `Stock insuficiente para ${producto.nombre}. Solicitado: ${item.cantidad}, Disponible: ${disponible}`
        );
      }
    }

    // Actualizar inventario de productos y marcar orden como despachada
    // Usar transacción para asegurar consistencia
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      for (const item of orden.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            cantidadConsumida: {
              increment: item.cantidad,
            },
          },
        });
      }

      return await tx.ordenMedicamento.update({
        where: { id },
        data: {
          estado: 'Despachada',
          fechaDespacho: new Date(),
          despachadoPor: despachadoPorId,
        },
        include: {
          paciente: true,
          items: {
            include: {
              producto: true,
            },
          },
        },
      });
    });

    return ordenActualizada;
  }

  /**
   * Cancelar una orden de medicamento
   */
  async cancelar(id, observaciones) {
    await this.getById(id);

    const orden = await prisma.ordenMedicamento.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        observaciones,
      },
    });

    return orden;
  }

  /**
   * Eliminar una orden de medicamento
   */
  async delete(id) {
    await this.getById(id);
    
    // Prisma eliminará los items automáticamente por cascade
    await prisma.ordenMedicamento.delete({ where: { id } });
    return true;
  }
}

module.exports = new OrdenMedicamentoService();
