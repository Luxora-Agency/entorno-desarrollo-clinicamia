/**
 * Servicio de Gestión de Vacantes - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class VacanteService {
  /**
   * Listar vacantes con filtros
   */
  async list({ estado, departamentoId, cargoId, page = 1, limit = 20 }) {
    const where = {};
    if (estado) where.estado = estado;
    if (departamentoId) where.departamentoId = departamentoId;
    if (cargoId) where.cargoId = cargoId;

    const [data, total] = await Promise.all([
      prisma.tHVacante.findMany({
        where,
        include: {
          cargo: true,
          creador: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { candidatos: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHVacante.count({ where })
    ]);

    // Map result to cleaner structure if needed, or return snake_case
    // For consistency with other fixed services, we might want to map to camelCase
    // but the route layer might expect DB structure. 
    // Given the previous code returned raw prisma result, I will return raw result but with correct relation names.

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener vacante por ID
   */
  async getById(id) {
    const vacante = await prisma.tHVacante.findUnique({
      where: { id },
      include: {
        cargo: true,
        creador: { select: { id: true, nombre: true, apellido: true } },
        candidatos: {
          include: {
            candidato: true
          },
          orderBy: { fechaAplicacion: 'desc' }
        }
      }
    });

    if (!vacante) {
      throw new NotFoundError('Vacante no encontrada');
    }

    return vacante;
  }

  /**
   * Crear nueva vacante
   */
  async create(data, userId) {
    // Validar que el cargo exista si se proporciona
    if (data.cargoId) {
      const cargo = await prisma.tHCargo.findUnique({ where: { id: data.cargoId } });
      if (!cargo) throw new ValidationError('Cargo no encontrado');
    }

    // Use camelCase field names (Prisma model fields)
    const dbData = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        departamentoId: data.departamentoId,
        cargoId: data.cargoId,
        requisitos: data.requisitos,
        salarioMin: data.salarioMin,
        salarioMax: data.salarioMax,
        tipoContrato: data.tipoContrato,
        jornada: data.jornada,
        ubicacion: data.ubicacion,
        cantidadPuestos: data.cantidadPuestos,
        fechaApertura: data.fechaApertura ? new Date(data.fechaApertura) : new Date(),
        fechaCierre: data.fechaCierre ? new Date(data.fechaCierre) : null,
        estado: data.estado || 'ABIERTA',
        publicarExterno: data.publicarExterno || false,
        urlsPublicacion: data.urlsPublicacion,
        createdBy: userId,
    };

    return prisma.tHVacante.create({
      data: dbData,
      include: {
        cargo: true,
        creador: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  /**
   * Actualizar vacante
   */
  async update(id, data) {
    const vacante = await prisma.tHVacante.findUnique({ where: { id } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    if (data.cargoId) {
      const cargo = await prisma.tHCargo.findUnique({ where: { id: data.cargoId } });
      if (!cargo) throw new ValidationError('Cargo no encontrado');
    }

    // Use camelCase field names (Prisma model fields)
    const dbData = {};
    if (data.titulo !== undefined) dbData.titulo = data.titulo;
    if (data.descripcion !== undefined) dbData.descripcion = data.descripcion;
    if (data.departamentoId !== undefined) dbData.departamentoId = data.departamentoId;
    if (data.cargoId !== undefined) dbData.cargoId = data.cargoId;
    if (data.requisitos !== undefined) dbData.requisitos = data.requisitos;
    if (data.salarioMin !== undefined) dbData.salarioMin = data.salarioMin;
    if (data.salarioMax !== undefined) dbData.salarioMax = data.salarioMax;
    if (data.tipoContrato !== undefined) dbData.tipoContrato = data.tipoContrato;
    if (data.jornada !== undefined) dbData.jornada = data.jornada;
    if (data.ubicacion !== undefined) dbData.ubicacion = data.ubicacion;
    if (data.cantidadPuestos !== undefined) dbData.cantidadPuestos = data.cantidadPuestos;
    if (data.fechaApertura !== undefined) dbData.fechaApertura = new Date(data.fechaApertura);
    if (data.fechaCierre !== undefined) dbData.fechaCierre = new Date(data.fechaCierre);
    if (data.estado !== undefined) dbData.estado = data.estado;
    if (data.publicarExterno !== undefined) dbData.publicarExterno = data.publicarExterno;
    if (data.urlsPublicacion !== undefined) dbData.urlsPublicacion = data.urlsPublicacion;

    return prisma.tHVacante.update({
      where: { id },
      data: dbData,
      include: {
        cargo: true,
        creador: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  /**
   * Eliminar vacante
   */
  async delete(id) {
    const vacante = await prisma.tHVacante.findUnique({ where: { id } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    // Verificar que no tenga candidatos activos (en proceso)
    const candidatosActivos = await prisma.tHCandidatoVacante.count({
      where: {
        vacanteId: id,
        estado: { notIn: ['RECHAZADO', 'RETIRADO', 'CONTRATADO'] }
      }
    });

    if (candidatosActivos > 0) {
      throw new ValidationError('No se puede eliminar una vacante con candidatos activos en proceso de selección');
    }

    // Eliminar en transacción para mantener integridad
    return prisma.$transaction(async (tx) => {
      // Eliminar entrevistas relacionadas
      await tx.tHEntrevista.deleteMany({ where: { vacanteId: id } });

      // Eliminar relaciones candidato-vacante (los que ya están rechazados/retirados/contratados)
      await tx.tHCandidatoVacante.deleteMany({ where: { vacanteId: id } });

      // Finalmente eliminar la vacante
      return tx.tHVacante.delete({ where: { id } });
    });
  }

  /**
   * Cambiar estado de vacante
   */
  async changeStatus(id, estado) {
    const vacante = await prisma.tHVacante.findUnique({ where: { id } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    return prisma.tHVacante.update({
      where: { id },
      data: {
        estado,
        ...(estado === 'CERRADA' && { fechaCierre: new Date() }),
      }
    });
  }

  /**
   * Obtener estadísticas de vacantes
   */
  async getStats() {
    const [total, abiertas, enProceso, cerradas] = await Promise.all([
      prisma.tHVacante.count(),
      prisma.tHVacante.count({ where: { estado: 'ABIERTA' } }),
      prisma.tHVacante.count({ where: { estado: 'EN_PROCESO' } }),
      prisma.tHVacante.count({ where: { estado: 'CERRADA' } })
    ]);

    return { total, abiertas, enProceso, cerradas };
  }
}

module.exports = new VacanteService();
