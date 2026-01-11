const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ImagenologiaService {
  /**
   * Generar código único para estudio
   */
  async generateCodigo() {
    const today = new Date();
    const prefix = `IMG-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const lastStudy = await prisma.estudioImagenologia.findFirst({
      where: {
        codigo: {
          startsWith: prefix
        }
      },
      orderBy: {
        codigo: 'desc'
      }
    });

    let sequence = 1;
    if (lastStudy && lastStudy.codigo) {
      const lastSeq = parseInt(lastStudy.codigo.split('-').pop(), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Crear un nuevo estudio de imagenología
   */
  async create(data) {
    const {
      pacienteId,
      medicoSolicitanteId,
      tipoEstudio,
      zonaCuerpo,
      prioridad = 'Normal',
      indicacionClinica,
      observaciones,
      ordenMedicaId,
      radiologoId
    } = data;

    // Validar campos requeridos
    const missing = validateRequired(
      ['pacienteId', 'medicoSolicitanteId', 'tipoEstudio', 'zonaCuerpo', 'indicacionClinica'],
      { pacienteId, medicoSolicitanteId, tipoEstudio, zonaCuerpo, indicacionClinica }
    );

    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Generar código único
    const codigo = await this.generateCodigo();

    const estudio = await prisma.estudioImagenologia.create({
      data: {
        codigo,
        pacienteId,
        medicoSolicitanteId,
        radiologoId: radiologoId || null,
        ordenMedicaId: ordenMedicaId || null,
        tipoEstudio,
        zonaCuerpo,
        prioridad,
        indicacionClinica,
        observaciones: observaciones || null,
        estado: 'Pendiente',
        fechaSolicitud: new Date(),
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true
          }
        },
        medicoSolicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true
          }
        }
      }
    });

    return estudio;
  }

  /**
   * Obtener todos los estudios con filtros
   */
  async getAll({ page = 1, limit = 10, search = '', estado = '', pacienteId = '', prioridad = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && estado !== 'todos' && { estado }),
      ...(prioridad && { prioridad }),
      ...(pacienteId && { pacienteId }),
      ...(search && {
        OR: [
          { codigo: { contains: search, mode: 'insensitive' } },
          { paciente: { nombre: { contains: search, mode: 'insensitive' } } },
          { paciente: { apellido: { contains: search, mode: 'insensitive' } } },
          { paciente: { cedula: { contains: search, mode: 'insensitive' } } },
        ]
      })
    };

    const [items, total] = await Promise.all([
      prisma.estudioImagenologia.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaSolicitud: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              fechaNacimiento: true
            }
          },
          medicoSolicitante: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          },
          radiologo: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        }
      }),
      prisma.estudioImagenologia.count({ where })
    ]);

    // Calcular edad para el frontend
    const itemsWithAge = items.map(item => {
      let edad = 0;
      if (item.paciente?.fechaNacimiento) {
        const diff = Date.now() - new Date(item.paciente.fechaNacimiento).getTime();
        edad = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      }
      return {
        ...item,
        paciente: {
          ...item.paciente,
          edad
        }
      };
    });

    return {
      items: itemsWithAge,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Obtener estudio por ID
   */
  async getById(id) {
    const item = await prisma.estudioImagenologia.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            fechaNacimiento: true,
            genero: true,
            telefono: true,
            email: true,
            tipoSangre: true,
            alergias: true
          }
        },
        medicoSolicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true
          }
        },
        radiologo: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundError('Estudio de imagenología no encontrado');
    }

    // Calcular edad
    let edad = 0;
    if (item.paciente?.fechaNacimiento) {
      const diff = Date.now() - new Date(item.paciente.fechaNacimiento).getTime();
      edad = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    return {
      ...item,
      paciente: {
        ...item.paciente,
        edad
      }
    };
  }

  /**
   * Actualizar informe (Radiólogo)
   */
  async updateInforme(id, data, radiologoId) {
    const study = await this.getById(id);

    if (study.estado === 'Cancelado') {
      throw new ValidationError('No se puede informar un estudio cancelado');
    }

    const updated = await prisma.estudioImagenologia.update({
      where: { id },
      data: {
        hallazgos: data.hallazgos,
        conclusion: data.conclusion,
        recomendaciones: data.recomendaciones,
        radiologoId: radiologoId || study.radiologoId,
        fechaInforme: new Date(),
        estado: 'Completado',
        ...(data.imagenesUrl && { imagenesUrl: data.imagenesUrl })
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true
          }
        },
        radiologo: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Cambiar estado (En Proceso, Cancelado, etc.)
   */
  async updateEstado(id, estado, fechaProgramada = null) {
    // Verificar que el estudio existe
    await this.getById(id);

    const data = { estado };

    if (estado === 'EnProceso') {
      data.fechaRealizacion = new Date();
    }
    if (estado === 'Programado' && fechaProgramada) {
      data.fechaProgramada = new Date(fechaProgramada);
    }

    const updated = await prisma.estudioImagenologia.update({
      where: { id },
      data,
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Obtener estadísticas del dashboard
   */
  async getEstadisticas() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [pendientes, enProceso, completadosHoy, totalMes] = await Promise.all([
      prisma.estudioImagenologia.count({ where: { estado: 'Pendiente' } }),
      prisma.estudioImagenologia.count({ where: { estado: 'EnProceso' } }),
      prisma.estudioImagenologia.count({
        where: {
          estado: 'Completado',
          fechaInforme: {
            gte: today
          }
        }
      }),
      prisma.estudioImagenologia.count({
        where: {
          fechaSolicitud: {
            gte: firstDayOfMonth
          }
        }
      })
    ]);

    return {
      pendientes,
      enProceso,
      completadosHoy,
      totalMes
    };
  }

  /**
   * Eliminar un estudio (solo si está pendiente)
   */
  async delete(id) {
    const study = await this.getById(id);

    if (study.estado !== 'Pendiente') {
      throw new ValidationError('Solo se pueden eliminar estudios pendientes');
    }

    await prisma.estudioImagenologia.delete({ where: { id } });
    return true;
  }
}

module.exports = new ImagenologiaService();
