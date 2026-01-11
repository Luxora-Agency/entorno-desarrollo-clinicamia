/**
 * Servicio para Formularios de Contacto MiaPass
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const miaPassNotificationService = require('./miaPassNotification.service');

class FormularioMiaPassService {
  /**
   * Obtener todos los formularios con filtros
   */
  async getAll(filters = {}) {
    const { estado, page = 1, limit = 20 } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (estado) {
      where.estado = estado;
    }

    const [formularios, total] = await Promise.all([
      prisma.formularioMiaPass.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.formularioMiaPass.count({ where }),
    ]);

    return {
      formularios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener un formulario por ID
   */
  async getById(id) {
    const formulario = await prisma.formularioMiaPass.findUnique({
      where: { id },
    });

    if (!formulario) {
      throw new NotFoundError('Formulario no encontrado');
    }

    return formulario;
  }

  /**
   * Crear nuevo formulario de contacto
   */
  async create(data) {
    const {
      nombreCompleto,
      numeroDocumento,
      correoElectronico,
      celular,
      cantidadPersonas,
      valorTotal,
    } = data;

    // Validaciones básicas
    if (!nombreCompleto || nombreCompleto.trim().length < 3) {
      throw new ValidationError('El nombre completo es requerido (mínimo 3 caracteres)');
    }

    if (!numeroDocumento || numeroDocumento.trim().length < 5) {
      throw new ValidationError('El número de documento es requerido (mínimo 5 caracteres)');
    }

    if (!correoElectronico || !this.isValidEmail(correoElectronico)) {
      throw new ValidationError('El correo electrónico es requerido y debe ser válido');
    }

    if (!celular || celular.trim().length < 7) {
      throw new ValidationError('El celular es requerido (mínimo 7 caracteres)');
    }

    if (!cantidadPersonas || cantidadPersonas < 1) {
      throw new ValidationError('La cantidad de personas debe ser al menos 1');
    }

    if (valorTotal === undefined || valorTotal < 0) {
      throw new ValidationError('El valor total es requerido y debe ser mayor o igual a 0');
    }

    const formulario = await prisma.formularioMiaPass.create({
      data: {
        nombreCompleto: nombreCompleto.trim(),
        numeroDocumento: numeroDocumento.trim(),
        correoElectronico: correoElectronico.trim().toLowerCase(),
        celular: celular.trim(),
        cantidadPersonas: parseInt(cantidadPersonas),
        valorTotal: parseFloat(valorTotal),
        estado: 'Pendiente',
      },
    });

    // Notificar al equipo comercial (no bloqueante)
    miaPassNotificationService.notificarNuevoFormulario(formulario)
      .then(r => r.success && console.log('[MiaPass] Notificación de nuevo lead enviada'))
      .catch(err => console.error('[MiaPass] Error notificando nuevo lead:', err.message));

    return formulario;
  }

  /**
   * Actualizar estado del formulario
   */
  async updateStatus(id, estado, notas) {
    const formulario = await this.getById(id);

    const estadosValidos = ['Pendiente', 'Contactado', 'EnProceso', 'Completado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
      throw new ValidationError(`Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`);
    }

    return prisma.formularioMiaPass.update({
      where: { id },
      data: {
        estado,
        notas: notas || formulario.notas,
      },
    });
  }

  /**
   * Actualizar formulario completo
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};

    if (data.nombreCompleto) updateData.nombreCompleto = data.nombreCompleto.trim();
    if (data.numeroDocumento) updateData.numeroDocumento = data.numeroDocumento.trim();
    if (data.correoElectronico) {
      if (!this.isValidEmail(data.correoElectronico)) {
        throw new ValidationError('El correo electrónico debe ser válido');
      }
      updateData.correoElectronico = data.correoElectronico.trim().toLowerCase();
    }
    if (data.celular) updateData.celular = data.celular.trim();
    if (data.cantidadPersonas) updateData.cantidadPersonas = parseInt(data.cantidadPersonas);
    if (data.valorTotal !== undefined) updateData.valorTotal = parseFloat(data.valorTotal);
    if (data.estado) updateData.estado = data.estado;
    if (data.notas !== undefined) updateData.notas = data.notas;

    return prisma.formularioMiaPass.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Eliminar formulario
   */
  async delete(id) {
    await this.getById(id);

    return prisma.formularioMiaPass.delete({
      where: { id },
    });
  }

  /**
   * Obtener estadísticas de formularios
   */
  async getStats() {
    const [total, porEstado] = await Promise.all([
      prisma.formularioMiaPass.count(),
      prisma.formularioMiaPass.groupBy({
        by: ['estado'],
        _count: { id: true },
      }),
    ]);

    const estadisticas = {
      total,
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count.id;
        return acc;
      }, {}),
    };

    return estadisticas;
  }

  /**
   * Validar email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new FormularioMiaPassService();
