const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { deleteFile } = require('../../utils/upload');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class DocumentoCalidad2Service {
  /**
   * Obtener documentos con filtros
   */
  async findAll(query = {}) {
    const { page = 1, limit = 20, carpetaId, search, activo = true } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      activo: activo === 'true' || activo === true,
      ...(carpetaId && { carpetaId: carpetaId === 'null' ? null : carpetaId }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [documentos, total] = await Promise.all([
      prisma.documentoCalidad2.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          carpeta: {
            select: { id: true, nombre: true, tipo: true },
          },
          usuario: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.documentoCalidad2.count({ where }),
    ]);

    return {
      data: documentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener documento por ID
   */
  async findById(id) {
    const documento = await prisma.documentoCalidad2.findUnique({
      where: { id },
      include: {
        carpeta: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Crear documento (subir archivo)
   */
  async create(data, file, userId) {
    const { nombre, descripcion, carpetaId, tipo } = data;

    if (!file) {
      throw new ValidationError('Se requiere un archivo');
    }

    // Validar carpeta si se proporciona
    if (carpetaId) {
      const carpeta = await prisma.carpetaCalidad2.findUnique({
        where: { id: carpetaId },
      });
      if (!carpeta) {
        throw new ValidationError('Carpeta no encontrada');
      }
    }

    // Determinar subdirectorio basado en tipo
    const tipoDir = tipo || 'inscripcion';
    const uploadDir = path.join(__dirname, '../../public/uploads/calidad2', tipoDir);

    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generar nombre único
    const ext = path.extname(file.name);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    const archivoUrl = `/uploads/calidad2/${tipoDir}/${uniqueName}`;

    // Guardar archivo
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Crear registro en BD
    const documento = await prisma.documentoCalidad2.create({
      data: {
        nombre: nombre || file.name,
        descripcion,
        carpetaId: carpetaId || null,
        archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamano: file.size,
        subidoPor: userId,
      },
      include: {
        carpeta: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return documento;
  }

  /**
   * Actualizar metadata del documento
   */
  async update(id, data) {
    const documento = await prisma.documentoCalidad2.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    const { nombre, descripcion } = data;

    const updated = await prisma.documentoCalidad2.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
      },
      include: {
        carpeta: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return updated;
  }

  /**
   * Mover documento a otra carpeta
   */
  async mover(id, carpetaId) {
    const documento = await prisma.documentoCalidad2.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Validar carpeta destino
    if (carpetaId) {
      const carpeta = await prisma.carpetaCalidad2.findUnique({
        where: { id: carpetaId },
      });
      if (!carpeta) {
        throw new ValidationError('Carpeta destino no encontrada');
      }
    }

    const updated = await prisma.documentoCalidad2.update({
      where: { id },
      data: { carpetaId: carpetaId || null },
      include: {
        carpeta: true,
      },
    });

    return updated;
  }

  /**
   * Eliminar documento
   */
  async delete(id) {
    const documento = await prisma.documentoCalidad2.findUnique({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../public', documento.archivoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Soft delete en BD
    await prisma.documentoCalidad2.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Documento eliminado correctamente' };
  }

  /**
   * Obtener documentos de una carpeta
   */
  async getByFolder(carpetaId) {
    const documentos = await prisma.documentoCalidad2.findMany({
      where: {
        carpetaId: carpetaId || null,
        activo: true,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documentos;
  }
}

module.exports = new DocumentoCalidad2Service();
