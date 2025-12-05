/**
 * Service de paquetes de hospitalización
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PaqueteHospitalizacionService {
  /**
   * Obtener todos los paquetes
   */
  async getAll({ activo = true } = {}) {
    const where = {};
    
    if (activo !== undefined && activo !== 'all') {
      where.activo = activo === 'true' || activo === true;
    }

    const paquetes = await prisma.paqueteHospitalizacion.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    return paquetes;
  }

  /**
   * Obtener un paquete por ID
   */
  async getById(id) {
    const paquete = await prisma.paqueteHospitalizacion.findUnique({
      where: { id },
    });

    if (!paquete) {
      throw new NotFoundError('Paquete de hospitalización no encontrado');
    }

    return paquete;
  }

  /**
   * Obtener paquete por tipo de unidad
   */
  async getByTipoUnidad(tipoUnidad) {
    const paquete = await prisma.paqueteHospitalizacion.findFirst({
      where: {
        tipoUnidad,
        activo: true,
      },
    });

    return paquete;
  }

  /**
   * Crear un nuevo paquete
   */
  async create(data) {
    // Validar campos requeridos
    if (!data.nombre) throw new ValidationError('nombre es requerido');
    if (!data.tipo_unidad) throw new ValidationError('tipo_unidad es requerido');
    if (!data.precio_dia) throw new ValidationError('precio_dia es requerido');

    const paquete = await prisma.paqueteHospitalizacion.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipoUnidad: data.tipo_unidad,
        precioDia: parseFloat(data.precio_dia),
        incluye: data.incluye || null,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    return paquete;
  }

  /**
   * Actualizar un paquete
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipo_unidad) updateData.tipoUnidad = data.tipo_unidad;
    if (data.precio_dia) updateData.precioDia = parseFloat(data.precio_dia);
    if (data.incluye !== undefined) updateData.incluye = data.incluye;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const paquete = await prisma.paqueteHospitalizacion.update({
      where: { id },
      data: updateData,
    });

    return paquete;
  }

  /**
   * Eliminar un paquete
   */
  async delete(id) {
    await this.getById(id);
    await prisma.paqueteHospitalizacion.delete({ where: { id } });
    return true;
  }

  /**
   * Calcular costo de hospitalización
   */
  async calcularCosto(tipoUnidad, fechaIngreso, fechaEgreso = null) {
    const paquete = await this.getByTipoUnidad(tipoUnidad);
    
    if (!paquete) {
      // Si no hay paquete, usar tarifa por defecto
      return {
        precioDia: 500000,
        dias: this.calcularDias(fechaIngreso, fechaEgreso),
        total: 500000 * this.calcularDias(fechaIngreso, fechaEgreso),
        paquete: null,
      };
    }

    const dias = this.calcularDias(fechaIngreso, fechaEgreso);
    const total = parseFloat(paquete.precioDia) * dias;

    return {
      precioDia: parseFloat(paquete.precioDia),
      dias,
      total,
      paquete,
    };
  }

  /**
   * Calcular días de hospitalización
   */
  calcularDias(fechaIngreso, fechaEgreso = null) {
    const inicio = new Date(fechaIngreso);
    const fin = fechaEgreso ? new Date(fechaEgreso) : new Date();
    
    const diferenciaMilisegundos = fin - inicio;
    const dias = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    return dias > 0 ? dias : 1; // Mínimo 1 día
  }
}

module.exports = new PaqueteHospitalizacionService();
