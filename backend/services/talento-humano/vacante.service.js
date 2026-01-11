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
    if (departamentoId) where.departamento_id = departamentoId;
    if (cargoId) where.cargo_id = cargoId;

    const [data, total] = await Promise.all([
      prisma.th_vacantes.findMany({
        where,
        include: {
          th_cargos: true,
          usuarios: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { th_candidato_vacante: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_vacantes.count({ where })
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
    const vacante = await prisma.th_vacantes.findUnique({
      where: { id },
      include: {
        th_cargos: true,
        usuarios: { select: { id: true, nombre: true, apellido: true } },
        th_candidato_vacante: {
          include: {
            th_candidatos: true
          },
          orderBy: { fecha_aplicacion: 'desc' }
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
      const cargo = await prisma.th_cargos.findUnique({ where: { id: data.cargoId } });
      if (!cargo) throw new ValidationError('Cargo no encontrado');
    }

    // Map camelCase data to snake_case
    const dbData = {
        id: require('uuid').v4(),
        titulo: data.titulo,
        descripcion: data.descripcion,
        departamento_id: data.departamentoId,
        cargo_id: data.cargoId,
        requisitos: data.requisitos,
        salario_min: data.salarioMin,
        salario_max: data.salarioMax,
        tipo_contrato: data.tipoContrato,
        jornada: data.jornada,
        ubicacion: data.ubicacion,
        cantidad_puestos: data.cantidadPuestos,
        fecha_apertura: data.fechaApertura ? new Date(data.fechaApertura) : new Date(),
        fecha_cierre: data.fechaCierre ? new Date(data.fechaCierre) : null,
        estado: data.estado || 'ABIERTA',
        publicar_externo: data.publicarExterno || false,
        urls_publicacion: data.urlsPublicacion,
        created_by: userId,
        updated_at: new Date()
    };

    return prisma.th_vacantes.create({
      data: dbData,
      include: {
        th_cargos: true,
        usuarios: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  /**
   * Actualizar vacante
   */
  async update(id, data) {
    const vacante = await prisma.th_vacantes.findUnique({ where: { id } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    if (data.cargoId) {
      const cargo = await prisma.th_cargos.findUnique({ where: { id: data.cargoId } });
      if (!cargo) throw new ValidationError('Cargo no encontrado');
    }

    // Map camelCase data to snake_case for update
    const dbData = {};
    if (data.titulo !== undefined) dbData.titulo = data.titulo;
    if (data.descripcion !== undefined) dbData.descripcion = data.descripcion;
    if (data.departamentoId !== undefined) dbData.departamento_id = data.departamentoId;
    if (data.cargoId !== undefined) dbData.cargo_id = data.cargoId;
    if (data.requisitos !== undefined) dbData.requisitos = data.requisitos;
    if (data.salarioMin !== undefined) dbData.salario_min = data.salarioMin;
    if (data.salarioMax !== undefined) dbData.salario_max = data.salarioMax;
    if (data.tipoContrato !== undefined) dbData.tipo_contrato = data.tipoContrato;
    if (data.jornada !== undefined) dbData.jornada = data.jornada;
    if (data.ubicacion !== undefined) dbData.ubicacion = data.ubicacion;
    if (data.cantidadPuestos !== undefined) dbData.cantidad_puestos = data.cantidadPuestos;
    if (data.fechaApertura !== undefined) dbData.fecha_apertura = new Date(data.fechaApertura);
    if (data.fechaCierre !== undefined) dbData.fecha_cierre = new Date(data.fechaCierre);
    if (data.estado !== undefined) dbData.estado = data.estado;
    if (data.publicarExterno !== undefined) dbData.publicar_externo = data.publicarExterno;
    if (data.urlsPublicacion !== undefined) dbData.urls_publicacion = data.urlsPublicacion;
    dbData.updated_at = new Date();

    return prisma.th_vacantes.update({
      where: { id },
      data: dbData,
      include: {
        th_cargos: true,
        usuarios: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  /**
   * Eliminar vacante
   */
  async delete(id) {
    const vacante = await prisma.th_vacantes.findUnique({ where: { id } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    // Verificar que no tenga candidatos activos (en proceso)
    const candidatosActivos = await prisma.th_candidato_vacante.count({
      where: {
        vacante_id: id,
        estado: { notIn: ['RECHAZADO', 'RETIRADO', 'CONTRATADO'] }
      }
    });

    if (candidatosActivos > 0) {
      throw new ValidationError('No se puede eliminar una vacante con candidatos activos en proceso de selección');
    }

    // Eliminar en transacción para mantener integridad
    return prisma.$transaction(async (tx) => {
      // Eliminar entrevistas relacionadas
      await tx.th_entrevistas.deleteMany({ where: { vacante_id: id } });

      // Eliminar relaciones candidato-vacante (los que ya están rechazados/retirados/contratados)
      await tx.th_candidato_vacante.deleteMany({ where: { vacante_id: id } });

      // Finalmente eliminar la vacante
      return tx.th_vacantes.delete({ where: { id } });
    });
  }

  /**
   * Cambiar estado de vacante
   */
  async changeStatus(id, estado) {
    const vacante = await prisma.th_vacantes.findUnique({ where: { id } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    return prisma.th_vacantes.update({
      where: { id },
      data: {
        estado,
        ...(estado === 'CERRADA' && { fecha_cierre: new Date() }),
        updated_at: new Date()
      }
    });
  }

  /**
   * Obtener estadísticas de vacantes
   */
  async getStats() {
    const [total, abiertas, enProceso, cerradas] = await Promise.all([
      prisma.th_vacantes.count(),
      prisma.th_vacantes.count({ where: { estado: 'ABIERTA' } }),
      prisma.th_vacantes.count({ where: { estado: 'EN_PROCESO' } }),
      prisma.th_vacantes.count({ where: { estado: 'CERRADA' } })
    ]);

    return { total, abiertas, enProceso, cerradas };
  }
}

module.exports = new VacanteService();
