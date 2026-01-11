const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ActaService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      comiteId = '',
      aprobada = '',
      fechaInicio = '',
      fechaFin = '',
      sortBy = 'fechaReunion',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { numeroActa: { contains: search, mode: 'insensitive' } },
        { lugar: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (comiteId) where.comiteId = comiteId;
    if (aprobada !== '') where.aprobada = aprobada === 'true';

    if (fechaInicio || fechaFin) {
      where.fechaReunion = {};
      if (fechaInicio) where.fechaReunion.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaReunion.lte = new Date(fechaFin);
    }

    const [actas, total] = await Promise.all([
      prisma.actaComite.findMany({
        where,
        include: {
          comite: {
            select: { id: true, codigo: true, nombre: true, tipo: true },
          },
          elaborador: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          asistentes: {
            include: {
              usuario: {
                select: { id: true, nombre: true, apellido: true },
              },
            },
          },
          _count: {
            select: { anexos: true },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.actaComite.count({ where }),
    ]);

    return {
      data: actas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const acta = await prisma.actaComite.findUnique({
      where: { id },
      include: {
        comite: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            tipo: true,
            presidenteUsuario: {
              select: { id: true, nombre: true, apellido: true },
            },
            secretarioUsuario: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        elaborador: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        asistentes: {
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        anexos: {
          where: { activo: true },
          include: {
            cargador: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!acta || !acta.activo) {
      throw new NotFoundError('Acta no encontrada');
    }

    return acta;
  }

  async findByComite(comiteId, query = {}) {
    const { page = 1, limit = 50 } = query;
    return this.findAll({ ...query, comiteId, page, limit });
  }

  async create(data, userId) {
    // Check if acta number already exists for this committee
    const existing = await prisma.actaComite.findFirst({
      where: {
        comiteId: data.comiteId,
        numeroActa: data.numeroActa,
      },
    });

    if (existing) {
      throw new ValidationError('Ya existe un acta con este número para este comité');
    }

    const acta = await prisma.actaComite.create({
      data: {
        ...data,
        elaboradaPor: userId,
        aprobada: false,
      },
      include: {
        comite: {
          select: { id: true, nombre: true, codigo: true },
        },
        elaborador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Update cronograma if exists
    if (data.cronogramaId) {
      await prisma.cronogramaComite.update({
        where: { id: data.cronogramaId },
        data: {
          estado: 'REALIZADA',
          actaId: acta.id,
        },
      });
    }

    return acta;
  }

  async update(id, data) {
    const existing = await this.findById(id);

    if (existing.aprobada) {
      throw new ValidationError('No se puede editar un acta aprobada');
    }

    const updated = await prisma.actaComite.update({
      where: { id },
      data,
      include: {
        comite: {
          select: { id: true, nombre: true, codigo: true },
        },
        elaborador: {
          select: { id: true, nombre: true, apellido: true },
        },
        asistentes: {
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    return updated;
  }

  async delete(id) {
    const existing = await this.findById(id);

    if (existing.aprobada) {
      throw new ValidationError('No se puede eliminar un acta aprobada');
    }

    await prisma.actaComite.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Acta eliminada exitosamente' };
  }

  async aprobar(id) {
    const existing = await this.findById(id);

    if (existing.aprobada) {
      throw new ValidationError('Esta acta ya está aprobada');
    }

    const aprobada = await prisma.actaComite.update({
      where: { id },
      data: {
        aprobada: true,
        fechaAprobacion: new Date(),
      },
      include: {
        comite: {
          select: { id: true, nombre: true },
        },
        elaborador: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return aprobada;
  }

  // Attendance management
  async addAsistente(actaId, data) {
    await this.findById(actaId);

    // Check if already exists
    const existing = await prisma.asistenteActaComite.findFirst({
      where: {
        actaId,
        usuarioId: data.usuarioId,
      },
    });

    if (existing) {
      throw new ValidationError('Este usuario ya está registrado en la asistencia');
    }

    const asistente = await prisma.asistenteActaComite.create({
      data: {
        actaId,
        ...data,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    // Update quorum
    await this.updateQuorum(actaId);

    return asistente;
  }

  async updateAsistente(id, data) {
    const asistente = await prisma.asistenteActaComite.update({
      where: { id },
      data,
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Update quorum
    await this.updateQuorum(asistente.actaId);

    return asistente;
  }

  async updateQuorum(actaId) {
    const asistentes = await prisma.asistenteActaComite.count({
      where: {
        actaId,
        asistio: true,
      },
    });

    const totalMiembros = await prisma.asistenteActaComite.count({
      where: { actaId },
    });

    // Quorum = more than 50% attendance
    const quorum = asistentes > totalMiembros / 2;

    await prisma.actaComite.update({
      where: { id: actaId },
      data: { quorum },
    });

    return quorum;
  }

  // Anexos management
  async uploadAnexo(actaId, file, metadata, userId) {
    await this.findById(actaId);

    const anexo = await prisma.documentoActaComite.create({
      data: {
        actaId,
        nombre: metadata.nombre || file.name,
        archivoUrl: metadata.archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamano: file.size,
        cargadoPor: userId,
      },
    });

    return anexo;
  }

  async deleteAnexo(anexoId) {
    await prisma.documentoActaComite.update({
      where: { id: anexoId },
      data: { activo: false },
    });

    return { message: 'Anexo eliminado exitosamente' };
  }
}

module.exports = new ActaService();
