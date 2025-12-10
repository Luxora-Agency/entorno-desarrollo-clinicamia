/**
 * Service de Productos/Medicamentos (Vademécum)
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ProductoService {
  /**
   * Obtener todos los medicamentos con filtros y búsqueda
   */
  async getAll({ 
    page = 1, 
    limit = 50, 
    search, 
    activo,
    controlado,
    requiereReceta 
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    // Filtro de búsqueda (nombre, principio activo)
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { principioActivo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (activo !== undefined) where.activo = activo === 'true' || activo === true;
    if (controlado !== undefined) where.controlado = controlado === 'true' || controlado === true;
    if (requiereReceta !== undefined) where.requiereReceta = requiereReceta === 'true' || requiereReceta === true;

    const [medicamentos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { nombre: 'asc' },
      }),
      prisma.producto.count({ where }),
    ]);

    // Retornar en formato plano para que success() lo envuelva correctamente
    return medicamentos;
  }

  /**
   * Obtener medicamento por ID
   */
  async getById(id) {
    const medicamento = await prisma.producto.findUnique({
      where: { id },
      include: {
        prescripciones: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!medicamento) {
      throw new NotFoundError('Medicamento no encontrado');
    }

    return medicamento;
  }

  /**
   * Crear medicamento/producto
   */
  async create(data) {
    // Validaciones básicas
    if (!data.nombre) {
      throw new ValidationError('El nombre es requerido');
    }
    if (!data.sku) {
      throw new ValidationError('El SKU es requerido');
    }
    if (!data.categoriaId) {
      throw new ValidationError('La categoría es requerida');
    }

    const producto = await prisma.producto.create({
      data: {
        sku: data.sku,
        nombre: data.nombre,
        descripcion: data.descripcion,
        principioActivo: data.principioActivo,
        concentracion: data.concentracion,
        presentacion: data.presentacion,
        viaAdministracion: data.viaAdministracion,
        requiereReceta: data.requiereReceta !== false,
        categoriaId: data.categoriaId,
        precioVenta: data.precioVenta || 0,
        precioCompra: data.precioCompra || 0,
        cantidadTotal: data.cantidadTotal || 0,
        cantidadMinAlerta: data.cantidadMinAlerta || 10,
        activo: data.activo !== false,
      },
    });

    return producto;
  }

  /**
   * Actualizar producto/medicamento
   */
  async update(id, data) {
    const producto = await this.getById(id);

    const updated = await prisma.producto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        principioActivo: data.principioActivo,
        concentracion: data.concentracion,
        presentacion: data.presentacion,
        viaAdministracion: data.viaAdministracion,
        requiereReceta: data.requiereReceta,
        precioVenta: data.precioVenta,
        precioCompra: data.precioCompra,
        cantidadTotal: data.cantidadTotal,
        cantidadMinAlerta: data.cantidadMinAlerta,
        activo: data.activo,
      },
    });

    return updated;
  }

  /**
   * Eliminar medicamento (soft delete)
   */
  async delete(id) {
    await this.getById(id);

    const deleted = await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    return deleted;
  }

  /**
   * Verificar interacciones medicamentosas
   */
  async verificarInteracciones(medicamentosIds) {
    const medicamentos = await prisma.producto.findMany({
      where: {
        id: { in: medicamentosIds },
      },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
        descripcion: true,
      },
    });

    const alertas = [];

    // Verificar interacciones entre los medicamentos
    for (let i = 0; i < medicamentos.length; i++) {
      for (let j = i + 1; j < medicamentos.length; j++) {
        const med1 = medicamentos[i];
        const med2 = medicamentos[j];

        // Verificar si med1 tiene interacciones con med2 (basado en descripción)
        if (med1.descripcion && med2.principioActivo) {
          if (med1.descripcion.toLowerCase().includes('interaccion') &&
              med1.descripcion.toLowerCase().includes(med2.principioActivo.toLowerCase())) {
            alertas.push({
              tipo: 'interaccion',
              medicamento1: med1.nombre,
              medicamento2: med2.nombre,
              mensaje: `Posible interacción entre ${med1.nombre} y ${med2.nombre}`,
            });
          }
        }
      }
    }

    return alertas;
  }

  /**
   * Verificar alergias del paciente
   */
  async verificarAlergias(pacienteId, medicamentosIds) {
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        alergias: true,
        alertasClinicas: {
          where: {
            tipoAlerta: 'AlergiaMedicamento',
          },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    const medicamentos = await prisma.producto.findMany({
      where: {
        id: { in: medicamentosIds },
      },
      select: {
        id: true,
        nombre: true,
        principioActivo: true,
      },
    });

    const alertas = [];

    // Verificar alergias del campo texto
    if (paciente.alergias) {
      medicamentos.forEach(med => {
        if (paciente.alergias.toLowerCase().includes(med.nombre.toLowerCase()) ||
            (med.principioActivo && paciente.alergias.toLowerCase().includes(med.principioActivo.toLowerCase()))) {
          alertas.push({
            tipo: 'alergia',
            medicamento: med.nombre,
            mensaje: `ALERTA: El paciente tiene alergia registrada a ${med.nombre}`,
            severidad: 'alta',
          });
        }
      });
    }

    // Verificar alertas clínicas formales
    paciente.alertasClinicas.forEach(alerta => {
      medicamentos.forEach(med => {
        if (alerta.descripcion.toLowerCase().includes(med.nombre.toLowerCase()) ||
            (med.principioActivo && alerta.descripcion.toLowerCase().includes(med.principioActivo.toLowerCase()))) {
          alertas.push({
            tipo: 'alergia',
            medicamento: med.nombre,
            mensaje: `ALERTA: ${alerta.titulo} - ${alerta.descripcion}`,
            severidad: alerta.severidad || 'alta',
          });
        }
      });
    });

    return alertas;
  }
}

module.exports = new ProductoService();
