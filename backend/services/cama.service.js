/**
 * Service de camas
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class CamaService {
  /**
   * Obtener todas las camas
   */
  async getAll(query = {}) {
    const { habitacionId, estado } = query;
    
    const where = {};
    if (habitacionId) {
      where.habitacionId = habitacionId;
    }
    if (estado) {
      where.estado = estado;
    }

    const camas = await prisma.cama.findMany({
      where,
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return camas;
  }

  /**
   * Obtener una cama por ID
   */
  async getById(id) {
    const cama = await prisma.cama.findUnique({
      where: { id },
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
    });

    if (!cama) {
      throw new NotFoundError('Cama no encontrada');
    }

    return cama;
  }

  /**
   * Crear una cama
   */
  async create(data) {
    const cama = await prisma.cama.create({
      data: {
        numero: data.numero,
        habitacionId: data.habitacionId,
        estado: data.estado || 'Disponible',
        observaciones: data.observaciones,
      },
    });

    return cama;
  }

  /**
   * Actualizar una cama
   */
  async update(id, data) {
    await this.getById(id);

    const cama = await prisma.cama.update({
      where: { id },
      data: {
        numero: data.numero,
        estado: data.estado,
        observaciones: data.observaciones,
      },
    });

    return cama;
  }

  /**
   * Eliminar una cama
   */
  async delete(id) {
    await this.getById(id);
    await prisma.cama.delete({ where: { id } });
    return true;
  }

  /**
   * Obtener camas disponibles
   */
  async getDisponibles(unidadId) {
    const where = { estado: 'Disponible' };
    
    if (unidadId) {
      where.habitacion = {
        unidadId,
      };
    }

    const camas = await prisma.cama.findMany({
      where,
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
    });

    return camas;
  }

  /**
   * Obtener mapa completo de ocupación
   */
  async getMapaOcupacion(unidadId) {
    const where = unidadId ? { unidadId } : {};

    const habitaciones = await prisma.habitacion.findMany({
      where,
      include: {
        unidad: true,
        camas: {
          include: {
            admisiones: {
              where: { estado: 'Activa' },
              include: {
                paciente: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    cedula: true,
                    genero: true,
                  },
                },
              },
            },
          },
          orderBy: { numero: 'asc' },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return { habitaciones };
  }

  /**
   * Obtener estadísticas de ocupación
   */
  async getEstadisticas(unidadId) {
    const where = {};
    if (unidadId) {
      where.habitacion = {
        unidadId,
      };
    }

    const [
      totalCamas,
      disponibles,
      ocupadas,
      enMantenimiento,
      reservadas,
    ] = await Promise.all([
      prisma.cama.count({ where }),
      prisma.cama.count({ where: { ...where, estado: 'Disponible' } }),
      prisma.cama.count({ where: { ...where, estado: 'Ocupada' } }),
      prisma.cama.count({ where: { ...where, estado: 'Mantenimiento' } }),
      prisma.cama.count({ where: { ...where, estado: 'Reservada' } }),
    ]);

    const porcentajeOcupacion = totalCamas > 0 ? ((ocupadas / totalCamas) * 100).toFixed(1) : 0;

    // Estadísticas por unidad
    let porUnidad = [];
    if (!unidadId) {
      const unidades = await prisma.unidad.findMany({
        include: {
          habitaciones: {
            include: {
              camas: true,
            },
          },
        },
      });

      porUnidad = unidades.map(unidad => {
        const camasUnidad = unidad.habitaciones.flatMap(h => h.camas);
        const total = camasUnidad.length;
        const ocupadasUnidad = camasUnidad.filter(c => c.estado === 'Ocupada').length;
        const disponiblesUnidad = camasUnidad.filter(c => c.estado === 'Disponible').length;

        return {
          unidad_id: unidad.id,
          unidad_nombre: unidad.nombre,
          total,
          ocupadas: ocupadasUnidad,
          disponibles: disponiblesUnidad,
          porcentaje_ocupacion: total > 0 ? ((ocupadasUnidad / total) * 100).toFixed(1) : 0,
        };
      });
    }

    return {
      total_camas: totalCamas,
      disponibles,
      ocupadas,
      en_limpieza: enMantenimiento, // Mantenimiento incluye limpieza
      en_mantenimiento: enMantenimiento,
      reservadas,
      porcentaje_ocupacion: parseFloat(porcentajeOcupacion),
      por_unidad: porUnidad,
    };
  }

  /**
   * Cambiar estado de una cama
   */
  async cambiarEstado(id, nuevoEstado, motivo = null) {
    const cama = await this.getById(id);

    // Validar estado
    const estadosValidos = ['Disponible', 'Ocupada', 'Mantenimiento', 'Reservada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new ValidationError(`Estado inválido. Valores válidos: ${estadosValidos.join(', ')}`);
    }

    // Si está ocupada, no permitir cambio manual a disponible (debe hacerse a través de egreso)
    if (cama.estado === 'Ocupada' && nuevoEstado === 'Disponible') {
      // Verificar si realmente hay una admisión activa
      const admisionActiva = await prisma.admision.findFirst({
        where: {
          camaId: id,
          estado: 'Activa',
        },
      });

      if (admisionActiva) {
        throw new ValidationError('No se puede liberar una cama con admisión activa. Debe realizar el egreso del paciente primero.');
      }
    }

    const camaActualizada = await prisma.cama.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        observaciones: motivo || cama.observaciones,
      },
      include: {
        habitacion: {
          include: {
            unidad: true,
          },
        },
      },
    });

    return camaActualizada;
  }
}

module.exports = new CamaService();
