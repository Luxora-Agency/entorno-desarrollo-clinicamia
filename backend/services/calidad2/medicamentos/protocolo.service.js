const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ProtocoloMedicamentoService {
  /**
   * Obtener todos los protocolos con filtros opcionales
   */
  async findAll(query = {}) {
    const {
      tipo,
      estado,
      search,
      page = 1,
      limit = 50,
    } = query;

    const where = { activo: true };

    if (tipo) {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { responsable: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [protocolos, total] = await Promise.all([
      prisma.protocoloMedicamento.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          creador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          aprobador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          documentos: {
            where: { activo: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.protocoloMedicamento.count({ where }),
    ]);

    return {
      data: protocolos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un protocolo por ID
   */
  async findById(id) {
    const protocolo = await prisma.protocoloMedicamento.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        documentos: {
          where: { activo: true },
          include: {
            cargador: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!protocolo) {
      throw new NotFoundError('Protocolo no encontrado');
    }

    return protocolo;
  }

  /**
   * Crear un nuevo protocolo
   */
  async create(data, userId) {
    // Validar que el código no exista
    const existing = await prisma.protocoloMedicamento.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError(`Ya existe un protocolo con el código ${data.codigo}`);
    }

    const protocolo = await prisma.protocoloMedicamento.create({
      data: {
        ...data,
        creadoPor: userId,
        estado: 'BORRADOR',
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        documentos: true,
      },
    });

    return protocolo;
  }

  /**
   * Actualizar un protocolo
   */
  async update(id, data, userId) {
    const protocolo = await this.findById(id);

    // Si está aprobado, solo el aprobador puede editarlo
    if (protocolo.estado === 'VIGENTE' && protocolo.aprobadoPor !== userId) {
      throw new ValidationError('Solo el aprobador puede editar un protocolo vigente');
    }

    // Si se cambia el código, validar que no exista
    if (data.codigo && data.codigo !== protocolo.codigo) {
      const existing = await prisma.protocoloMedicamento.findUnique({
        where: { codigo: data.codigo },
      });

      if (existing) {
        throw new ValidationError(`Ya existe un protocolo con el código ${data.codigo}`);
      }
    }

    const updated = await prisma.protocoloMedicamento.update({
      where: { id },
      data,
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        documentos: {
          where: { activo: true },
        },
      },
    });

    return updated;
  }

  /**
   * Eliminar un protocolo (soft delete)
   */
  async delete(id) {
    await this.findById(id);

    await prisma.protocoloMedicamento.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Protocolo eliminado correctamente' };
  }

  /**
   * Aprobar un protocolo
   */
  async aprobar(id, userId) {
    const protocolo = await this.findById(id);

    if (protocolo.estado === 'VIGENTE') {
      throw new ValidationError('El protocolo ya está vigente');
    }

    const updated = await prisma.protocoloMedicamento.update({
      where: { id },
      data: {
        estado: 'VIGENTE',
        aprobadoPor: userId,
        fechaAprobacion: new Date(),
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Subir documento a un protocolo
   */
  async uploadDocumento(protocoloId, file, metadata, userId) {
    await this.findById(protocoloId);

    const documento = await prisma.documentoProtocoloMedicamento.create({
      data: {
        protocoloId,
        nombre: metadata.nombre || file.name,
        archivoUrl: metadata.archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type || 'application/octet-stream',
        archivoTamano: file.size,
        version: metadata.version || '1.0',
        esPrincipal: metadata.esPrincipal || false,
        cargadoPor: userId,
      },
      include: {
        cargador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return documento;
  }

  /**
   * Eliminar documento (soft delete)
   */
  async deleteDocumento(documentoId) {
    const documento = await prisma.documentoProtocoloMedicamento.findUnique({
      where: { id: documentoId },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    await prisma.documentoProtocoloMedicamento.update({
      where: { id: documentoId },
      data: { activo: false },
    });

    return { message: 'Documento eliminado correctamente' };
  }

  /**
   * Obtener protocolos vigentes
   */
  async getVigentes() {
    const protocolos = await prisma.protocoloMedicamento.findMany({
      where: {
        activo: true,
        estado: 'VIGENTE',
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { fechaAprobacion: 'desc' },
    });

    return protocolos;
  }

  /**
   * Obtener protocolos próximos a revisión
   */
  async getProximasRevisiones(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const protocolos = await prisma.protocoloMedicamento.findMany({
      where: {
        activo: true,
        estado: 'VIGENTE',
        proximaRevision: {
          lte: fechaLimite,
          gte: new Date(),
        },
      },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { proximaRevision: 'asc' },
    });

    return protocolos;
  }
}

module.exports = new ProtocoloMedicamentoService();
