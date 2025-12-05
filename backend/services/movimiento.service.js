/**
 * Service de movimientos
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class MovimientoService {
  /**
   * Obtener todos los movimientos
   */
  async getAll(query = {}) {
    const { admisionId, tipo } = query;
    
    const where = {};
    if (admisionId) {
      where.admisionId = admisionId;
    }
    if (tipo) {
      where.tipo = tipo;
    }

    const movimientos = await prisma.movimiento.findMany({
      where,
      include: {
        admision: {
          include: {
            paciente: true,
          },
        },
        unidadOrigen: true,
        unidadDestino: true,
        camaOrigen: {
          include: {
            habitacion: true,
          },
        },
        camaDestino: {
          include: {
            habitacion: true,
          },
        },
      },
      orderBy: { fechaMovimiento: 'desc' },
    });

    // Cargar información del usuario responsable para cada movimiento
    const movimientosConResponsable = await Promise.all(
      movimientos.map(async (movimiento) => {
        let responsableInfo = null;
        
        if (movimiento.responsable) {
          try {
            const usuario = await prisma.usuario.findUnique({
              where: { id: movimiento.responsable },
              select: { nombre: true, apellido: true, rol: true },
            });
            if (usuario) {
              responsableInfo = {
                nombre: `${usuario.nombre} ${usuario.apellido}`,
                rol: usuario.rol,
              };
            }
          } catch (error) {
            console.error('Error cargando usuario responsable:', error);
          }
        }

        return {
          ...movimiento,
          responsableInfo,
        };
      })
    );

    return movimientosConResponsable;
  }

  /**
   * Obtener un movimiento por ID
   */
  async getById(id) {
    const movimiento = await prisma.movimiento.findUnique({
      where: { id },
      include: {
        admision: {
          include: {
            paciente: true,
          },
        },
      },
    });

    if (!movimiento) {
      throw new NotFoundError('Movimiento no encontrado');
    }

    return movimiento;
  }

  /**
   * Crear un movimiento (traslado, cambio de cama)
   */
  async create(data) {
    const movimiento = await prisma.movimiento.create({
      data: {
        admisionId: data.admisionId,
        tipo: data.tipo,
        unidadOrigenId: data.unidadOrigenId,
        unidadDestinoId: data.unidadDestinoId,
        camaOrigenId: data.camaOrigenId,
        camaDestinoId: data.camaDestinoId,
        motivo: data.motivo,
        observaciones: data.observaciones,
        responsable: data.responsable,
      },
    });

    // Si hay cambio de cama, actualizar estados
    if (data.camaOrigenId && data.camaDestinoId) {
      await prisma.cama.update({
        where: { id: data.camaOrigenId },
        data: { estado: 'Disponible' },
      });
      await prisma.cama.update({
        where: { id: data.camaDestinoId },
        data: { estado: 'Ocupada' },
      });
    }

    // Actualizar admisión con nueva cama/unidad
    if (data.camaDestinoId || data.unidadDestinoId) {
      await prisma.admision.update({
        where: { id: data.admisionId },
        data: {
          camaId: data.camaDestinoId || undefined,
          unidadId: data.unidadDestinoId || undefined,
        },
      });
    }

    return movimiento;
  }

  /**
   * Eliminar un movimiento
   */
  async delete(id) {
    await this.getById(id);
    await prisma.movimiento.delete({ where: { id } });
    return true;
  }
}

module.exports = new MovimientoService();
