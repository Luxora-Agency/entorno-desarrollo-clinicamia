const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class ProtocoloService {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      categoria = '',
      tipo = '',
      estado = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { activo: true };

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { responsable: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoria) where.categoria = categoria;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const [protocolos, total] = await Promise.all([
      prisma.protocoloProcesosPrioritarios.findMany({
        where,
        include: {
          creador: { select: { id: true, nombre: true, apellido: true, email: true } },
          aprobador: { select: { id: true, nombre: true, apellido: true, email: true } },
          documentos: {
            where: { activo: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.protocoloProcesosPrioritarios.count({ where }),
    ]);

    return {
      data: protocolos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findById(id) {
    const protocolo = await prisma.protocoloProcesosPrioritarios.findUnique({
      where: { id },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true, email: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true, email: true } },
        documentos: {
          where: { activo: true },
          include: {
            cargador: { select: { id: true, nombre: true, apellido: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!protocolo || !protocolo.activo) {
      throw new NotFoundError('Protocolo no encontrado');
    }

    return protocolo;
  }

  async findByCategoria(categoria, query = {}) {
    const { page = 1, limit = 50 } = query;
    return this.findAll({ ...query, categoria, page, limit });
  }

  async create(data, userId) {
    // Check if code already exists
    const existing = await prisma.protocoloProcesosPrioritarios.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      throw new ValidationError('Ya existe un protocolo con este código');
    }

    const protocolo = await prisma.protocoloProcesosPrioritarios.create({
      data: {
        ...data,
        creadoPor: userId,
        estado: data.estado || 'BORRADOR',
      },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        documentos: true,
      },
    });

    return protocolo;
  }

  async update(id, data) {
    const existing = await this.findById(id);

    // Cannot edit approved protocols
    if (existing.estado === 'VIGENTE' && data.estado !== 'OBSOLETO') {
      throw new ValidationError(
        'No se puede editar un protocolo vigente. Debe marcarlo como obsoleto primero.'
      );
    }

    const updated = await prisma.protocoloProcesosPrioritarios.update({
      where: { id },
      data,
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } },
        documentos: { where: { activo: true } },
      },
    });

    return updated;
  }

  async delete(id) {
    const existing = await this.findById(id);

    if (existing.estado === 'VIGENTE') {
      throw new ValidationError(
        'No se puede eliminar un protocolo vigente. Debe marcarlo como obsoleto primero.'
      );
    }

    await prisma.protocoloProcesosPrioritarios.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Protocolo eliminado exitosamente' };
  }

  async aprobar(id, userId) {
    const existing = await this.findById(id);

    if (existing.estado !== 'BORRADOR') {
      throw new ValidationError('Solo se pueden aprobar protocolos en borrador');
    }

    const aprobado = await prisma.protocoloProcesosPrioritarios.update({
      where: { id },
      data: {
        estado: 'VIGENTE',
        aprobadoPor: userId,
        fechaAprobacion: new Date(),
      },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    return aprobado;
  }

  async marcarObsoleto(id, userId) {
    const existing = await this.findById(id);

    const obsoleto = await prisma.protocoloProcesosPrioritarios.update({
      where: { id },
      data: {
        estado: 'OBSOLETO',
        esObsoleto: true,
      },
    });

    return obsoleto;
  }

  async uploadDocumento(protocoloId, file, metadata, userId) {
    await this.findById(protocoloId);

    const documento = await prisma.documentoProtocoloPP.create({
      data: {
        protocoloId,
        nombre: metadata.nombre || file.name,
        archivoUrl: metadata.archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamano: file.size,
        version: metadata.version,
        esPrincipal: metadata.esPrincipal || false,
        cargadoPor: userId,
      },
    });

    return documento;
  }

  async deleteDocumento(documentoId) {
    await prisma.documentoProtocoloPP.update({
      where: { id: documentoId },
      data: { activo: false },
    });

    return { message: 'Documento eliminado exitosamente' };
  }

  async getEstadisticas(filters = {}) {
    const { categoria } = filters;
    const whereBase = { activo: true };
    if (categoria) whereBase.categoria = categoria;

    const [
      total,
      porTipo,
      porEstado,
      porCategoria,
      proximosRevision,
      obsoletos,
    ] = await Promise.all([
      prisma.protocoloProcesosPrioritarios.count({ where: whereBase }),

      prisma.protocoloProcesosPrioritarios.groupBy({
        by: ['tipo'],
        where: whereBase,
        _count: true,
      }),

      prisma.protocoloProcesosPrioritarios.groupBy({
        by: ['estado'],
        where: whereBase,
        _count: true,
      }),

      prisma.protocoloProcesosPrioritarios.groupBy({
        by: ['categoria'],
        where: whereBase,
        _count: true,
      }),

      prisma.protocoloProcesosPrioritarios.count({
        where: {
          ...whereBase,
          proximaRevision: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.protocoloProcesosPrioritarios.count({
        where: { ...whereBase, esObsoleto: true },
      }),
    ]);

    return {
      total,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {}),
      porCategoria: porCategoria.reduce((acc, item) => {
        acc[item.categoria] = item._count;
        return acc;
      }, {}),
      proximosRevision,
      obsoletos,
    };
  }
}

module.exports = new ProtocoloService();
