/**
 * Service de admisiones
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AdmisionService {
  /**
   * Obtener todas las admisiones
   */
  async getAll(query = {}) {
    const { pacienteId, estado } = query;
    
    const where = {};
    if (pacienteId) {
      where.pacienteId = pacienteId;
    }
    if (estado) {
      where.estado = estado;
    }

    const admisiones = await prisma.admision.findMany({
      where,
      include: {
        paciente: true,
        unidad: true,
        cama: {
          include: {
            habitacion: true,
          },
        },
        movimientos: {
          orderBy: { fechaMovimiento: 'desc' },
        },
      },
      orderBy: { fechaIngreso: 'desc' },
    });

    return admisiones;
  }

  /**
   * Obtener una admisión por ID
   */
  async getById(id) {
    const admision = await prisma.admision.findUnique({
      where: { id },
      include: {
        paciente: true,
        unidad: true,
        cama: {
          include: {
            habitacion: true,
          },
        },
        movimientos: {
          orderBy: { fechaMovimiento: 'asc' },
        },
      },
    });

    if (!admision) {
      throw new NotFoundError('Admisión no encontrada');
    }

    return admision;
  }

  /**
   * Crear una admisión (iniciar hospitalización)
   */
  async create(data) {
    // Actualizar estado de la cama a Ocupada
    if (data.camaId) {
      await prisma.cama.update({
        where: { id: data.camaId },
        data: { estado: 'Ocupada' },
      });
    }

    const admision = await prisma.admision.create({
      data: {
        pacienteId: data.pacienteId,
        unidadId: data.unidadId,
        camaId: data.camaId,
        motivoIngreso: data.motivoIngreso,
        diagnosticoIngreso: data.diagnosticoIngreso,
        observaciones: data.observaciones,
        responsableIngreso: data.responsableIngreso,
      },
      include: {
        paciente: true,
        unidad: true,
        cama: {
          include: {
            habitacion: true,
          },
        },
      },
    });

    // Crear movimiento de ingreso
    await prisma.movimiento.create({
      data: {
        admisionId: admision.id,
        tipo: 'Ingreso',
        unidadDestinoId: data.unidadId,
        camaDestinoId: data.camaId,
        motivo: data.motivoIngreso,
        responsable: data.responsableIngreso,
      },
    });

    return admision;
  }

  /**
   * Registrar egreso
   */
  async egreso(id, data) {
    const admision = await this.getById(id);

    // Liberar cama
    if (admision.camaId) {
      await prisma.cama.update({
        where: { id: admision.camaId },
        data: { estado: 'Disponible' },
      });
    }

    const updated = await prisma.admision.update({
      where: { id },
      data: {
        fechaEgreso: new Date(),
        diagnosticoEgreso: data.diagnosticoEgreso,
        estado: 'Egresada',
        responsableEgreso: data.responsableEgreso,
      },
      include: {
        paciente: true,
        unidad: true,
        cama: true,
      },
    });

    // Crear movimiento de egreso
    await prisma.movimiento.create({
      data: {
        admisionId: id,
        tipo: 'Egreso',
        unidadOrigenId: admision.unidadId,
        camaOrigenId: admision.camaId,
        motivo: data.diagnosticoEgreso || 'Egreso hospitalario',
        responsable: data.responsableEgreso,
      },
    });

    return updated;
  }

  /**
   * Eliminar una admisión
   */
  async delete(id) {
    await this.getById(id);
    await prisma.admision.delete({ where: { id } });
    return true;
  }
}

module.exports = new AdmisionService();
