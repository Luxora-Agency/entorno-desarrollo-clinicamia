const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class ChecklistCalidad2Service {
  // ==========================================
  // TEMPLATES
  // ==========================================

  /**
   * Obtener todos los templates
   */
  async findAllTemplates(query = {}) {
    const { tipoEntidad, activo = true } = query;

    const where = {
      activo: activo === 'true' || activo === true,
      ...(tipoEntidad && { tipoEntidad }),
    };

    const templates = await prisma.checklistTemplateCalidad2.findMany({
      where,
      include: {
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return templates;
  }

  /**
   * Obtener template por ID con items
   */
  async findTemplateById(id) {
    const template = await prisma.checklistTemplateCalidad2.findUnique({
      where: { id },
      include: {
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    return template;
  }

  /**
   * Obtener templates por tipo de entidad
   */
  async findByEntityType(tipoEntidad) {
    const templates = await prisma.checklistTemplateCalidad2.findMany({
      where: {
        tipoEntidad,
        activo: true,
      },
      include: {
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return templates;
  }

  /**
   * Crear template
   */
  async createTemplate(data, userId) {
    const { nombre, descripcion, tipoEntidad, categoria, orden } = data;

    const tiposValidos = ['PERSONAL', 'INSCRIPCION', 'PROCESOS', 'CAPACIDAD'];
    if (!tiposValidos.includes(tipoEntidad)) {
      throw new ValidationError(`Tipo de entidad inválido. Valores permitidos: ${tiposValidos.join(', ')}`);
    }

    const template = await prisma.checklistTemplateCalidad2.create({
      data: {
        nombre,
        descripcion,
        tipoEntidad,
        categoria,
        orden: orden || 0,
        creadoPor: userId,
      },
    });

    return template;
  }

  /**
   * Actualizar template
   */
  async updateTemplate(id, data) {
    const template = await prisma.checklistTemplateCalidad2.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    const { nombre, descripcion, categoria, orden, activo } = data;

    const updated = await prisma.checklistTemplateCalidad2.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(categoria !== undefined && { categoria }),
        ...(orden !== undefined && { orden }),
        ...(activo !== undefined && { activo }),
      },
      include: {
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    return updated;
  }

  /**
   * Eliminar template
   */
  async deleteTemplate(id) {
    const template = await prisma.checklistTemplateCalidad2.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    // Soft delete template y sus items
    await prisma.$transaction([
      prisma.checklistItemCalidad2.updateMany({
        where: { templateId: id },
        data: { activo: false },
      }),
      prisma.checklistTemplateCalidad2.update({
        where: { id },
        data: { activo: false },
      }),
    ]);

    return { message: 'Template eliminado correctamente' };
  }

  // ==========================================
  // ITEMS
  // ==========================================

  /**
   * Agregar item a template
   */
  async addItem(templateId, data) {
    const template = await prisma.checklistTemplateCalidad2.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }

    const {
      nombre,
      descripcion,
      categoria,
      esObligatorio = true,
      requiereVencimiento = false,
      diasAlertaVencimiento,
      permiteMultiplesArchivos = false,
      orden,
    } = data;

    const item = await prisma.checklistItemCalidad2.create({
      data: {
        templateId,
        nombre,
        descripcion,
        categoria,
        esObligatorio,
        requiereVencimiento,
        diasAlertaVencimiento,
        permiteMultiplesArchivos,
        orden: orden || 0,
      },
    });

    return item;
  }

  /**
   * Actualizar item
   */
  async updateItem(itemId, data) {
    const item = await prisma.checklistItemCalidad2.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado');
    }

    const {
      nombre,
      descripcion,
      categoria,
      esObligatorio,
      requiereVencimiento,
      diasAlertaVencimiento,
      permiteMultiplesArchivos,
      orden,
      activo,
    } = data;

    const updated = await prisma.checklistItemCalidad2.update({
      where: { id: itemId },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(categoria !== undefined && { categoria }),
        ...(esObligatorio !== undefined && { esObligatorio }),
        ...(requiereVencimiento !== undefined && { requiereVencimiento }),
        ...(diasAlertaVencimiento !== undefined && { diasAlertaVencimiento }),
        ...(permiteMultiplesArchivos !== undefined && { permiteMultiplesArchivos }),
        ...(orden !== undefined && { orden }),
        ...(activo !== undefined && { activo }),
      },
    });

    return updated;
  }

  /**
   * Eliminar item
   */
  async deleteItem(itemId) {
    const item = await prisma.checklistItemCalidad2.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado');
    }

    await prisma.checklistItemCalidad2.update({
      where: { id: itemId },
      data: { activo: false },
    });

    return { message: 'Item eliminado correctamente' };
  }

  /**
   * Reordenar items
   */
  async reorderItems(templateId, itemsOrder) {
    const updates = itemsOrder.map((item, index) =>
      prisma.checklistItemCalidad2.update({
        where: { id: item.id },
        data: { orden: index },
      })
    );

    await prisma.$transaction(updates);

    return { message: 'Items reordenados correctamente' };
  }

  // ==========================================
  // ESTADO DE CHECKLIST POR PERSONAL
  // ==========================================

  /**
   * Obtener estado del checklist para un personal
   */
  async getEstadoForPersonal(personalId) {
    // Obtener todos los items de templates de tipo PERSONAL
    const templates = await prisma.checklistTemplateCalidad2.findMany({
      where: {
        tipoEntidad: 'PERSONAL',
        activo: true,
      },
      include: {
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    // Obtener estados actuales del personal
    const estados = await prisma.personalChecklistEstado.findMany({
      where: { personalId },
      include: {
        checklistItem: true,
      },
    });

    // Obtener documentos vinculados a items
    const documentos = await prisma.documentoPersonal.findMany({
      where: { personalId },
      select: {
        id: true,
        checklistItemId: true,
        nombre: true,
        fechaVencimiento: true,
      },
    });

    // Mapear estados por item
    const estadoMap = new Map(estados.map(e => [e.checklistItemId, e]));
    const docsByItem = documentos.reduce((acc, doc) => {
      if (doc.checklistItemId) {
        if (!acc[doc.checklistItemId]) acc[doc.checklistItemId] = [];
        acc[doc.checklistItemId].push(doc);
      }
      return acc;
    }, {});

    // Construir respuesta con estado de cada item
    const result = templates.map(template => ({
      ...template,
      items: template.items.map(item => ({
        ...item,
        estado: estadoMap.get(item.id) || { cumple: false, observaciones: null },
        documentos: docsByItem[item.id] || [],
      })),
    }));

    // Calcular resumen
    const totalItems = templates.reduce((sum, t) => sum + t.items.length, 0);
    const itemsCumplidos = estados.filter(e => e.cumple).length;
    const obligatoriosCumplidos = templates.reduce((sum, t) => {
      return sum + t.items.filter(i => {
        const estado = estadoMap.get(i.id);
        return i.esObligatorio && estado?.cumple;
      }).length;
    }, 0);
    const totalObligatorios = templates.reduce((sum, t) =>
      sum + t.items.filter(i => i.esObligatorio).length, 0);

    return {
      templates: result,
      resumen: {
        totalItems,
        itemsCumplidos,
        porcentajeCumplimiento: totalItems > 0 ? Math.round((itemsCumplidos / totalItems) * 100) : 0,
        obligatoriosCumplidos,
        totalObligatorios,
        checklistCompleto: obligatoriosCumplidos === totalObligatorios,
      },
    };
  }

  /**
   * Actualizar estado de un item para un personal
   */
  async updateEstadoItem(personalId, checklistItemId, data, userId) {
    const { cumple, observaciones } = data;

    // Verificar que el item existe
    const item = await prisma.checklistItemCalidad2.findUnique({
      where: { id: checklistItemId },
    });

    if (!item) {
      throw new NotFoundError('Item de checklist no encontrado');
    }

    // Upsert estado
    const estado = await prisma.personalChecklistEstado.upsert({
      where: {
        personalId_checklistItemId: {
          personalId,
          checklistItemId,
        },
      },
      update: {
        cumple,
        observaciones,
        verificadoPor: userId,
        fechaVerificacion: new Date(),
      },
      create: {
        personalId,
        checklistItemId,
        cumple,
        observaciones,
        verificadoPor: userId,
        fechaVerificacion: new Date(),
      },
      include: {
        checklistItem: true,
      },
    });

    return estado;
  }

  /**
   * Inicializar checklist para un nuevo personal
   */
  async initializeForPersonal(personalId) {
    // Obtener todos los items de templates PERSONAL
    const templates = await prisma.checklistTemplateCalidad2.findMany({
      where: {
        tipoEntidad: 'PERSONAL',
        activo: true,
      },
      include: {
        items: {
          where: { activo: true },
        },
      },
    });

    const allItems = templates.flatMap(t => t.items);

    // Crear estados iniciales (todos en cumple: false)
    const creates = allItems.map(item =>
      prisma.personalChecklistEstado.create({
        data: {
          personalId,
          checklistItemId: item.id,
          cumple: false,
        },
      })
    );

    await prisma.$transaction(creates);

    return { message: `Checklist inicializado con ${allItems.length} items` };
  }
}

module.exports = new ChecklistCalidad2Service();
