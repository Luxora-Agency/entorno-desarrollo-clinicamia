/**
 * Servicio de Gestión de Candidatos - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CandidatoService {
  /**
   * Listar candidatos con filtros
   */
  async list({ vacanteId, estado, search, page = 1, limit = 20 }) {
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search } }
      ];
    }

    // Si se especifica vacante, filtrar por candidatos de esa vacante
    if (vacanteId) {
      where.vacantes = { some: { vacanteId, ...(estado && { estado }) } };
    }

    const [data, total] = await Promise.all([
      prisma.tHCandidato.findMany({
        where,
        include: {
          vacantes: {
            include: { vacante: { select: { id: true, titulo: true } } }
          },
          entrevistas: {
            orderBy: { fechaProgramada: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHCandidato.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener candidato por ID
   */
  async getById(id) {
    const candidato = await prisma.tHCandidato.findUnique({
      where: { id },
      include: {
        vacantes: {
          include: {
            vacante: true,
            responsable: { select: { id: true, nombre: true, apellido: true } }
          }
        },
        entrevistas: {
          include: {
            entrevistador: { select: { id: true, nombre: true, apellido: true } }
          },
          orderBy: { fechaProgramada: 'desc' }
        }
      }
    });

    if (!candidato) throw new NotFoundError('Candidato no encontrado');
    return candidato;
  }

  /**
   * Crear nuevo candidato
   */
  async create(data) {
    // Verificar documento único
    const existing = await prisma.tHCandidato.findUnique({
      where: {
        tipoDocumento_documento: {
          tipoDocumento: data.tipoDocumento,
          documento: data.documento
        }
      }
    });

    if (existing) {
      throw new ValidationError('Ya existe un candidato con este documento');
    }

    return prisma.tHCandidato.create({
      data
    });
  }

  /**
   * Actualizar candidato
   */
  async update(id, data) {
    const candidato = await prisma.tHCandidato.findUnique({ where: { id } });
    if (!candidato) throw new NotFoundError('Candidato no encontrado');

    return prisma.tHCandidato.update({
      where: { id },
      data
    });
  }

  /**
   * Eliminar candidato
   */
  async delete(id) {
    const candidato = await prisma.tHCandidato.findUnique({ where: { id } });
    if (!candidato) throw new NotFoundError('Candidato no encontrado');

    // Eliminar relaciones primero
    await prisma.tHEntrevista.deleteMany({ where: { candidatoId: id } });
    await prisma.tHCandidatoVacante.deleteMany({ where: { candidatoId: id } });

    return prisma.tHCandidato.delete({ where: { id } });
  }

  /**
   * Aplicar a una vacante
   */
  async applyToVacante(candidatoId, vacanteId, responsableId = null) {
    // Verificar que existan ambos
    const [candidato, vacante] = await Promise.all([
      prisma.tHCandidato.findUnique({ where: { id: candidatoId } }),
      prisma.tHVacante.findUnique({ where: { id: vacanteId } })
    ]);

    if (!candidato) throw new NotFoundError('Candidato no encontrado');
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    // Verificar que la vacante esté abierta
    if (vacante.estado !== 'ABIERTA' && vacante.estado !== 'EN_PROCESO') {
      throw new ValidationError('La vacante no está disponible para aplicaciones');
    }

    // Verificar que no haya aplicado ya
    const existing = await prisma.tHCandidatoVacante.findUnique({
      where: {
        candidatoId_vacanteId: { candidatoId, vacanteId }
      }
    });

    if (existing) {
      throw new ValidationError('El candidato ya ha aplicado a esta vacante');
    }

    return prisma.tHCandidatoVacante.create({
      data: {
        candidatoId,
        vacanteId,
        responsableId,
        estado: 'APLICADO'
      },
      include: {
        candidato: true,
        vacante: true
      }
    });
  }

  /**
   * Actualizar estado del candidato en una vacante
   */
  async updateStatus(candidatoId, vacanteId, estado, data = {}) {
    const aplicacion = await prisma.tHCandidatoVacante.findUnique({
      where: {
        candidatoId_vacanteId: { candidatoId, vacanteId }
      }
    });

    if (!aplicacion) {
      throw new NotFoundError('Aplicación no encontrada');
    }

    return prisma.tHCandidatoVacante.update({
      where: {
        candidatoId_vacanteId: { candidatoId, vacanteId }
      },
      data: {
        estado,
        ...data
      },
      include: {
        candidato: true,
        vacante: true
      }
    });
  }

  /**
   * Obtener candidatos por vacante (pipeline)
   */
  async getByVacante(vacanteId) {
    const vacante = await prisma.tHVacante.findUnique({ where: { id: vacanteId } });
    if (!vacante) throw new NotFoundError('Vacante no encontrada');

    const candidatos = await prisma.tHCandidatoVacante.findMany({
      where: { vacanteId },
      include: {
        candidato: true,
        responsable: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { fechaAplicacion: 'desc' }
    });

    // Agrupar por estado para vista Kanban
    const pipeline = {
      APLICADO: [],
      EN_REVISION: [],
      PRESELECCIONADO: [],
      ENTREVISTA_PROGRAMADA: [],
      ENTREVISTA_REALIZADA: [],
      PRUEBAS_PENDIENTES: [],
      PRUEBAS_COMPLETADAS: [],
      SELECCIONADO: [],
      OFERTA_ENVIADA: [],
      OFERTA_ACEPTADA: [],
      RECHAZADO: [],
      RETIRADO: [],
      CONTRATADO: []
    };

    candidatos.forEach(c => {
      if (pipeline[c.estado]) {
        pipeline[c.estado].push(c);
      }
    });

    return { vacante, pipeline, total: candidatos.length };
  }

  /**
   * Actualizar resultado de screening IA
   */
  async updateScreeningIA(id, screeningData) {
    const candidato = await prisma.tHCandidato.findUnique({ where: { id } });
    if (!candidato) throw new NotFoundError('Candidato no encontrado');

    return prisma.tHCandidato.update({
      where: { id },
      data: {
        screeningIA: screeningData,
        scoreIA: screeningData.score || null
      }
    });
  }

  /**
   * Convertir candidato a empleado
   */
  async convertToEmpleado(candidatoId, vacanteId, empleadoData) {
    const aplicacion = await prisma.tHCandidatoVacante.findUnique({
      where: {
        candidatoId_vacanteId: { candidatoId, vacanteId }
      },
      include: { candidato: true, vacante: true }
    });

    if (!aplicacion) {
      throw new NotFoundError('Aplicación no encontrada');
    }

    if (aplicacion.estado !== 'OFERTA_ACEPTADA') {
      throw new ValidationError('El candidato debe haber aceptado la oferta');
    }

    const candidato = aplicacion.candidato;

    // Crear empleado con datos del candidato
    const empleado = await prisma.tHEmpleado.create({
      data: {
        candidatoId: candidato.id,
        tipoDocumento: candidato.tipoDocumento,
        documento: candidato.documento,
        nombre: candidato.nombre,
        apellido: candidato.apellido,
        fechaNacimiento: candidato.fechaNacimiento,
        genero: candidato.genero,
        email: candidato.email,
        telefono: candidato.telefono,
        direccion: candidato.direccion,
        ciudad: candidato.ciudad,
        departamentoGeo: candidato.departamentoGeo,
        profesion: candidato.profesion,
        nivelEducativo: candidato.nivelEducativo,
        ...empleadoData
      }
    });

    // Actualizar estado del candidato
    await prisma.tHCandidatoVacante.update({
      where: {
        candidatoId_vacanteId: { candidatoId, vacanteId }
      },
      data: { estado: 'CONTRATADO' }
    });

    return empleado;
  }
}

module.exports = new CandidatoService();
