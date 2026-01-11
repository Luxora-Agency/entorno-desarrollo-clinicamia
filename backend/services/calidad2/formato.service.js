const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class FormatoService {
  // ==========================================
  // TEMPLATES
  // ==========================================

  /**
   * Obtener todos los templates con filtros
   */
  async findAllTemplates(query = {}) {
    const { page = 1, limit = 20, categoria, activo, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(categoria && { categoria }),
      ...(activo !== undefined && { activo: activo === 'true' || activo === true }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
          { descripcion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.formatoTemplate.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { campos: true, instancias: true, secciones: true },
          },
        },
        orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
      }),
      prisma.formatoTemplate.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener template por ID con campos y secciones
   */
  async findTemplateById(id) {
    const template = await prisma.formatoTemplate.findUnique({
      where: { id },
      include: {
        secciones: {
          orderBy: { orden: 'asc' },
          include: {
            campos: {
              where: { activo: true },
              orderBy: { orden: 'asc' },
            },
          },
        },
        campos: {
          where: { activo: true, seccionId: null },
          orderBy: { orden: 'asc' },
        },
        _count: { select: { instancias: true } },
      },
    });

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    return template;
  }

  /**
   * Generar código único para template
   */
  async generateCodigo(prefix = 'FMT') {
    const count = await prisma.formatoTemplate.count();
    const numero = (count + 1).toString().padStart(3, '0');
    return `${prefix}-${numero}`;
  }

  /**
   * Crear template
   */
  async createTemplate(data, userId) {
    const { nombre, descripcion, categoria, requiereFirmas, requiereAsistentes, tieneVencimiento, diasVigencia, secciones, campos } = data;

    // Verificar nombre único
    const existe = await prisma.formatoTemplate.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    if (existe) {
      throw new ValidationError('Ya existe un template con ese nombre');
    }

    const codigo = await this.generateCodigo();

    const template = await prisma.formatoTemplate.create({
      data: {
        codigo,
        nombre,
        descripcion,
        categoria,
        requiereFirmas: requiereFirmas || false,
        requiereAsistentes: requiereAsistentes || false,
        tieneVencimiento: tieneVencimiento || false,
        diasVigencia: diasVigencia || null,
        creadoPor: userId,
        // Crear secciones si se proveen
        ...(secciones?.length > 0 && {
          secciones: {
            create: secciones.map((s, idx) => ({
              nombre: s.nombre,
              descripcion: s.descripcion || null,
              orden: s.orden ?? idx,
              colapsable: s.colapsable || false,
            })),
          },
        }),
      },
      include: {
        secciones: { orderBy: { orden: 'asc' } },
      },
    });

    // Crear campos si se proveen (fuera de sección)
    if (campos?.length > 0) {
      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        await this.addCampo(template.id, {
          ...c,
          orden: c.orden ?? i,
        });
      }
    }

    return this.findTemplateById(template.id);
  }

  /**
   * Actualizar template
   */
  async updateTemplate(id, data) {
    const template = await prisma.formatoTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    // Si cambia nombre, verificar que no exista otro con ese nombre
    if (data.nombre && data.nombre !== template.nombre) {
      const existe = await prisma.formatoTemplate.findFirst({
        where: { nombre: { equals: data.nombre, mode: 'insensitive' }, id: { not: id } },
      });
      if (existe) {
        throw new ValidationError('Ya existe un template con ese nombre');
      }
    }

    return prisma.formatoTemplate.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        requiereFirmas: data.requiereFirmas,
        requiereAsistentes: data.requiereAsistentes,
        tieneVencimiento: data.tieneVencimiento,
        diasVigencia: data.diasVigencia,
        activo: data.activo,
        version: { increment: 1 },
      },
      include: {
        secciones: { orderBy: { orden: 'asc' } },
        campos: { where: { activo: true }, orderBy: { orden: 'asc' } },
      },
    });
  }

  /**
   * Eliminar template (soft delete)
   */
  async deleteTemplate(id) {
    const template = await prisma.formatoTemplate.findUnique({
      where: { id },
      include: { _count: { select: { instancias: true } } },
    });

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    if (template._count.instancias > 0) {
      // Soft delete
      await prisma.formatoTemplate.update({
        where: { id },
        data: { activo: false },
      });
      return { message: 'Template desactivado (tiene instancias asociadas)' };
    }

    // Hard delete si no tiene instancias
    await prisma.formatoTemplate.delete({ where: { id } });
    return { message: 'Template eliminado correctamente' };
  }

  /**
   * Duplicar template
   */
  async duplicateTemplate(id, newData, userId) {
    const original = await this.findTemplateById(id);
    const codigo = await this.generateCodigo();

    // Crear nuevo template
    const nuevoTemplate = await prisma.formatoTemplate.create({
      data: {
        codigo,
        nombre: newData.nombre || `${original.nombre} (Copia)`,
        descripcion: original.descripcion,
        categoria: original.categoria,
        requiereFirmas: original.requiereFirmas,
        requiereAsistentes: original.requiereAsistentes,
        tieneVencimiento: original.tieneVencimiento,
        diasVigencia: original.diasVigencia,
        creadoPor: userId,
      },
    });

    // Copiar secciones
    const seccionMap = {};
    for (const seccion of original.secciones) {
      const nuevaSeccion = await prisma.seccionFormato.create({
        data: {
          templateId: nuevoTemplate.id,
          nombre: seccion.nombre,
          descripcion: seccion.descripcion,
          orden: seccion.orden,
          colapsable: seccion.colapsable,
        },
      });
      seccionMap[seccion.id] = nuevaSeccion.id;

      // Copiar campos de la sección
      for (const campo of seccion.campos) {
        await prisma.campoFormato.create({
          data: {
            templateId: nuevoTemplate.id,
            seccionId: nuevaSeccion.id,
            nombre: campo.nombre,
            clave: campo.clave,
            tipo: campo.tipo,
            descripcion: campo.descripcion,
            placeholder: campo.placeholder,
            esRequerido: campo.esRequerido,
            esObligatorio: campo.esObligatorio,
            configuracion: campo.configuracion,
            tieneVencimiento: campo.tieneVencimiento,
            diasAlertaVencimiento: campo.diasAlertaVencimiento,
            orden: campo.orden,
            anchoColumnas: campo.anchoColumnas,
          },
        });
      }
    }

    // Copiar campos sin sección
    for (const campo of original.campos) {
      await prisma.campoFormato.create({
        data: {
          templateId: nuevoTemplate.id,
          seccionId: null,
          nombre: campo.nombre,
          clave: campo.clave,
          tipo: campo.tipo,
          descripcion: campo.descripcion,
          placeholder: campo.placeholder,
          esRequerido: campo.esRequerido,
          esObligatorio: campo.esObligatorio,
          configuracion: campo.configuracion,
          tieneVencimiento: campo.tieneVencimiento,
          diasAlertaVencimiento: campo.diasAlertaVencimiento,
          orden: campo.orden,
          anchoColumnas: campo.anchoColumnas,
        },
      });
    }

    return this.findTemplateById(nuevoTemplate.id);
  }

  // ==========================================
  // SECCIONES
  // ==========================================

  /**
   * Agregar sección a template
   */
  async addSeccion(templateId, data) {
    const template = await prisma.formatoTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    const maxOrden = await prisma.seccionFormato.aggregate({
      where: { templateId },
      _max: { orden: true },
    });

    return prisma.seccionFormato.create({
      data: {
        templateId,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        orden: data.orden ?? ((maxOrden._max.orden ?? -1) + 1),
        colapsable: data.colapsable || false,
      },
    });
  }

  /**
   * Actualizar sección
   */
  async updateSeccion(seccionId, data) {
    const seccion = await prisma.seccionFormato.findUnique({ where: { id: seccionId } });
    if (!seccion) {
      throw new NotFoundError('Sección no encontrada');
    }

    return prisma.seccionFormato.update({
      where: { id: seccionId },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.orden !== undefined && { orden: data.orden }),
        ...(data.colapsable !== undefined && { colapsable: data.colapsable }),
      },
    });
  }

  /**
   * Eliminar sección
   */
  async deleteSeccion(seccionId) {
    const seccion = await prisma.seccionFormato.findUnique({
      where: { id: seccionId },
      include: { campos: true },
    });

    if (!seccion) {
      throw new NotFoundError('Sección no encontrada');
    }

    // Mover campos a sin sección antes de eliminar
    if (seccion.campos.length > 0) {
      await prisma.campoFormato.updateMany({
        where: { seccionId },
        data: { seccionId: null },
      });
    }

    await prisma.seccionFormato.delete({ where: { id: seccionId } });
    return { message: 'Sección eliminada correctamente' };
  }

  /**
   * Reordenar secciones
   */
  async reorderSecciones(templateId, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      prisma.seccionFormato.update({
        where: { id },
        data: { orden: index },
      })
    );
    await prisma.$transaction(updates);
    return { message: 'Orden actualizado' };
  }

  // ==========================================
  // CAMPOS
  // ==========================================

  /**
   * Agregar campo a template
   */
  async addCampo(templateId, data) {
    const template = await prisma.formatoTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    // Generar clave única si no se provee
    const clave = data.clave || this.generateClave(data.nombre);

    // Verificar clave única en el template
    const existeClave = await prisma.campoFormato.findFirst({
      where: { templateId, clave },
    });
    if (existeClave) {
      throw new ValidationError(`Ya existe un campo con la clave "${clave}" en este template`);
    }

    const maxOrden = await prisma.campoFormato.aggregate({
      where: { templateId, seccionId: data.seccionId || null },
      _max: { orden: true },
    });

    return prisma.campoFormato.create({
      data: {
        templateId,
        seccionId: data.seccionId || null,
        nombre: data.nombre,
        clave,
        tipo: data.tipo,
        descripcion: data.descripcion || null,
        placeholder: data.placeholder || null,
        esRequerido: data.esRequerido || false,
        esObligatorio: data.esObligatorio || false,
        configuracion: data.configuracion || null,
        tieneVencimiento: data.tieneVencimiento || false,
        diasAlertaVencimiento: data.diasAlertaVencimiento || null,
        orden: data.orden ?? ((maxOrden._max.orden ?? -1) + 1),
        anchoColumnas: data.anchoColumnas || 12,
      },
    });
  }

  /**
   * Actualizar campo
   */
  async updateCampo(campoId, data) {
    const campo = await prisma.campoFormato.findUnique({ where: { id: campoId } });
    if (!campo) {
      throw new NotFoundError('Campo no encontrado');
    }

    // Si cambia la clave, verificar que no exista
    if (data.clave && data.clave !== campo.clave) {
      const existeClave = await prisma.campoFormato.findFirst({
        where: { templateId: campo.templateId, clave: data.clave, id: { not: campoId } },
      });
      if (existeClave) {
        throw new ValidationError(`Ya existe un campo con la clave "${data.clave}"`);
      }
    }

    return prisma.campoFormato.update({
      where: { id: campoId },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.clave && { clave: data.clave }),
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.placeholder !== undefined && { placeholder: data.placeholder }),
        ...(data.esRequerido !== undefined && { esRequerido: data.esRequerido }),
        ...(data.esObligatorio !== undefined && { esObligatorio: data.esObligatorio }),
        ...(data.configuracion !== undefined && { configuracion: data.configuracion }),
        ...(data.tieneVencimiento !== undefined && { tieneVencimiento: data.tieneVencimiento }),
        ...(data.diasAlertaVencimiento !== undefined && { diasAlertaVencimiento: data.diasAlertaVencimiento }),
        ...(data.orden !== undefined && { orden: data.orden }),
        ...(data.anchoColumnas !== undefined && { anchoColumnas: data.anchoColumnas }),
        ...(data.seccionId !== undefined && { seccionId: data.seccionId }),
        ...(data.activo !== undefined && { activo: data.activo }),
      },
    });
  }

  /**
   * Eliminar campo (soft delete)
   */
  async deleteCampo(campoId) {
    const campo = await prisma.campoFormato.findUnique({ where: { id: campoId } });
    if (!campo) {
      throw new NotFoundError('Campo no encontrado');
    }

    // Verificar si tiene respuestas
    const respuestas = await prisma.respuestaCampo.count({ where: { campoId } });

    if (respuestas > 0) {
      // Soft delete
      await prisma.campoFormato.update({
        where: { id: campoId },
        data: { activo: false },
      });
      return { message: 'Campo desactivado (tiene respuestas asociadas)' };
    }

    await prisma.campoFormato.delete({ where: { id: campoId } });
    return { message: 'Campo eliminado correctamente' };
  }

  /**
   * Reordenar campos
   */
  async reorderCampos(templateId, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      prisma.campoFormato.update({
        where: { id },
        data: { orden: index },
      })
    );
    await prisma.$transaction(updates);
    return { message: 'Orden actualizado' };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Generar clave desde nombre
   */
  generateClave(nombre) {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]/g, '_') // Solo alfanuméricos
      .replace(/_+/g, '_') // Múltiples _ a uno
      .replace(/^_|_$/g, ''); // Quitar _ al inicio/fin
  }

  /**
   * Obtener categorías únicas
   */
  async getCategorias() {
    const result = await prisma.formatoTemplate.findMany({
      where: { activo: true, categoria: { not: null } },
      distinct: ['categoria'],
      select: { categoria: true },
    });
    return result.map(r => r.categoria).filter(Boolean);
  }

  /**
   * Estadísticas de templates
   */
  async getStats() {
    const [total, activos, porCategoria, conInstancias] = await Promise.all([
      prisma.formatoTemplate.count(),
      prisma.formatoTemplate.count({ where: { activo: true } }),
      prisma.formatoTemplate.groupBy({
        by: ['categoria'],
        where: { activo: true },
        _count: true,
      }),
      prisma.formatoTemplate.count({
        where: {
          activo: true,
          instancias: { some: {} },
        },
      }),
    ]);

    return {
      total,
      activos,
      inactivos: total - activos,
      conInstancias,
      porCategoria: porCategoria.map(c => ({
        categoria: c.categoria || 'Sin categoría',
        cantidad: c._count,
      })),
    };
  }
}

module.exports = new FormatoService();
