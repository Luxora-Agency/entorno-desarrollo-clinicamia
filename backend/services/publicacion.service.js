
const prisma = require('../db/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');

class PublicacionService {
  /**
   * Obtener todas las publicaciones con filtros
   */
  async getAllPublicaciones(query = {}) {
    const { 
      estado, 
      categoriaId, 
      autorId, 
      search, 
      limit = 10, 
      page = 1,
      orderBy = 'createdAt',
      orderDir = 'desc' 
    } = query;

    const where = {};
    
    if (estado) where.estado = estado;
    if (categoriaId) where.categoriaId = categoriaId;
    if (autorId) where.autorId = autorId;
    
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { contenido: { contains: search, mode: 'insensitive' } },
        { extracto: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [publicaciones, total] = await Promise.all([
      prisma.publicacion.findMany({
        where,
        include: {
          autor: {
            select: { id: true, nombre: true, apellido: true, email: true }
          },
          categoria: true
        },
        orderBy: { [orderBy]: orderDir },
        take: parseInt(limit),
        skip: parseInt(skip)
      }),
      prisma.publicacion.count({ where })
    ]);

    return {
      data: publicaciones,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener publicación por Slug o ID
   */
  async getPublicacion(identifier) {
    const publicacion = await prisma.publicacion.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ]
      },
      include: {
        autor: {
          select: { id: true, nombre: true, apellido: true }
        },
        categoria: true
      }
    });

    if (!publicacion) {
      throw new NotFoundError('Publicación no encontrada');
    }

    return publicacion;
  }

  /**
   * Crear publicación
   */
  async createPublicacion(data, autorId) {
    const { titulo, slug, contenido, extracto, imagenPortada, categoriaId, estado, diagnosticosRelacionados } = data;

    // Validar slug único
    const existingSlug = await prisma.publicacion.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ValidationError('El slug ya está en uso');
    }

    return await prisma.publicacion.create({
      data: {
        titulo,
        slug,
        contenido,
        extracto,
        imagenPortada,
        estado: estado || 'Borrador',
        fechaPublicacion: estado === 'Publicado' ? new Date() : null,
        autorId,
        categoriaId,
        diagnosticosRelacionados: diagnosticosRelacionados || []
      }
    });
  }

  /**
   * Actualizar publicación
   */
  async updatePublicacion(id, data) {
    const publicacion = await prisma.publicacion.findUnique({ where: { id } });
    if (!publicacion) {
      throw new NotFoundError('Publicación no encontrada');
    }

    if (data.slug && data.slug !== publicacion.slug) {
      const existingSlug = await prisma.publicacion.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        throw new ValidationError('El slug ya está en uso');
      }
    }

    // Actualizar fecha si cambia a Publicado
    let fechaPublicacion = publicacion.fechaPublicacion;
    if (data.estado === 'Publicado' && publicacion.estado !== 'Publicado') {
      fechaPublicacion = new Date();
    }

    return await prisma.publicacion.update({
      where: { id },
      data: {
        ...data,
        fechaPublicacion
      }
    });
  }

  /**
   * Eliminar publicación
   */
  async deletePublicacion(id) {
    const publicacion = await prisma.publicacion.findUnique({ where: { id } });
    if (!publicacion) {
      throw new NotFoundError('Publicación no encontrada');
    }

    return await prisma.publicacion.delete({ where: { id } });
  }

  /**
   * Obtener publicaciones recomendadas por diagnóstico (CIE-11)
   */
  async getRecomendaciones(diagnosticosCie11) {
    if (!diagnosticosCie11 || diagnosticosCie11.length === 0) {
      return [];
    }

    // Buscar publicaciones que tengan ALGUNO de los diagnósticos en su array
    return await prisma.publicacion.findMany({
      where: {
        estado: 'Publicado',
        diagnosticosRelacionados: {
          hasSome: diagnosticosCie11
        }
      },
      take: 5,
      orderBy: { fechaPublicacion: 'desc' }
    });
  }

  // ==========================================
  // CATEGORÍAS
  // ==========================================

  async getAllCategorias() {
    return await prisma.categoriaPublicacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
  }

  async createCategoria(data) {
    const { nombre, slug, descripcion } = data;
    return await prisma.categoriaPublicacion.create({
      data: { nombre, slug, descripcion }
    });
  }

  async updateCategoria(id, data) {
    return await prisma.categoriaPublicacion.update({
      where: { id },
      data
    });
  }
}

module.exports = new PublicacionService();
