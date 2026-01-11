const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class FormatoInstanciaService {
  // ==========================================
  // INSTANCIAS
  // ==========================================

  /**
   * Obtener todas las instancias con filtros
   */
  async findAll(query = {}) {
    const { page = 1, limit = 20, templateId, estado, personalId, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(templateId && { templateId }),
      ...(estado && { estado }),
      ...(personalId && { personalId }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { template: { nombre: { contains: search, mode: 'insensitive' } } },
          { personal: { nombreCompleto: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.formatoInstancia.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          template: { select: { id: true, codigo: true, nombre: true, categoria: true } },
          personal: { select: { id: true, nombreCompleto: true, cargo: true } },
          _count: { select: { respuestas: true, asistentes: true, firmas: true } },
        },
        orderBy: [{ estado: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.formatoInstancia.count({ where }),
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
   * Obtener instancia por ID con todas las relaciones
   */
  async findById(id) {
    const instancia = await prisma.formatoInstancia.findUnique({
      where: { id },
      include: {
        template: {
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
          },
        },
        personal: { select: { id: true, nombreCompleto: true, cargo: true, numeroDocumento: true } },
        respuestas: {
          include: {
            campo: { select: { id: true, nombre: true, clave: true, tipo: true } },
          },
        },
        asistentes: {
          include: {
            personal: { select: { id: true, nombreCompleto: true, cargo: true } },
          },
        },
        firmas: true,
        archivosAdjuntos: true,
      },
    });

    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    return instancia;
  }

  /**
   * Generar número consecutivo para instancias de un template
   */
  async generateNumero(templateId) {
    const max = await prisma.formatoInstancia.aggregate({
      where: { templateId },
      _max: { numero: true },
    });
    return (max._max.numero ?? 0) + 1;
  }

  /**
   * Crear instancia desde template
   */
  async create(data, userId) {
    const { templateId, personalId, titulo, observaciones } = data;

    // Verificar template existe y está activo
    const template = await prisma.formatoTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundError('Template no encontrado');
    }
    if (!template.activo) {
      throw new ValidationError('El template está inactivo');
    }

    // Verificar personal si se provee
    if (personalId) {
      const personal = await prisma.personal.findUnique({ where: { id: personalId } });
      if (!personal) {
        throw new NotFoundError('Personal no encontrado');
      }
    }

    const numero = await this.generateNumero(templateId);

    // Calcular fecha de vencimiento si aplica
    let fechaVencimiento = null;
    if (template.tieneVencimiento && template.diasVigencia) {
      fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + template.diasVigencia);
    }

    const instancia = await prisma.formatoInstancia.create({
      data: {
        templateId,
        numero,
        personalId: personalId || null,
        titulo: titulo || `${template.nombre} #${numero}`,
        observaciones,
        fechaVencimiento,
        creadoPor: userId,
      },
      include: {
        template: { select: { id: true, codigo: true, nombre: true } },
        personal: { select: { id: true, nombreCompleto: true } },
      },
    });

    // Registrar en historial
    await this.addHistorial(instancia.id, 'CREADO', 'Instancia creada', null, userId);

    return instancia;
  }

  /**
   * Actualizar instancia
   */
  async update(id, data, userId) {
    const instancia = await prisma.formatoInstancia.findUnique({ where: { id } });
    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    if (instancia.estado === 'COMPLETADO' || instancia.estado === 'CANCELADO') {
      throw new ValidationError('No se puede modificar una instancia completada o cancelada');
    }

    const updated = await prisma.formatoInstancia.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.observaciones !== undefined && { observaciones: data.observaciones }),
        ...(data.personalId !== undefined && { personalId: data.personalId }),
        ...(data.estado && { estado: data.estado }),
      },
    });

    await this.addHistorial(id, 'MODIFICADO', 'Instancia actualizada', data, userId);

    return updated;
  }

  /**
   * Eliminar instancia
   */
  async delete(id) {
    const instancia = await prisma.formatoInstancia.findUnique({ where: { id } });
    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    if (instancia.estado === 'COMPLETADO') {
      throw new ValidationError('No se puede eliminar una instancia completada');
    }

    await prisma.formatoInstancia.delete({ where: { id } });
    return { message: 'Instancia eliminada correctamente' };
  }

  /**
   * Completar instancia
   */
  async completar(id, userId) {
    const instancia = await prisma.formatoInstancia.findUnique({
      where: { id },
      include: {
        template: true,
        respuestas: {
          include: { campo: true },
        },
        firmas: true,
      },
    });

    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    if (instancia.estado !== 'BORRADOR' && instancia.estado !== 'EN_PROCESO') {
      throw new ValidationError('Solo se pueden completar instancias en borrador o en proceso');
    }

    // Validar campos requeridos
    const camposRequeridos = await prisma.campoFormato.findMany({
      where: { templateId: instancia.templateId, esRequerido: true, activo: true },
    });

    const respuestasMap = new Map(instancia.respuestas.map(r => [r.campoId, r]));
    const camposSinRespuesta = camposRequeridos.filter(c => {
      const resp = respuestasMap.get(c.id);
      return !resp || (resp.valorTexto === null && resp.valorNumero === null && resp.valorFecha === null && resp.valorBoolean === null && resp.valorJson === null);
    });

    if (camposSinRespuesta.length > 0) {
      throw new ValidationError(`Faltan campos requeridos: ${camposSinRespuesta.map(c => c.nombre).join(', ')}`);
    }

    // Validar firmas si se requieren
    if (instancia.template.requiereFirmas && instancia.firmas.length === 0) {
      throw new ValidationError('Este formato requiere al menos una firma');
    }

    const updated = await prisma.formatoInstancia.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        fechaCompletado: new Date(),
        completadoPor: userId,
      },
    });

    await this.addHistorial(id, 'COMPLETADO', 'Instancia marcada como completada', null, userId);

    return updated;
  }

  /**
   * Cancelar instancia
   */
  async cancelar(id, motivo, userId) {
    const instancia = await prisma.formatoInstancia.findUnique({ where: { id } });
    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    if (instancia.estado === 'COMPLETADO' || instancia.estado === 'CANCELADO') {
      throw new ValidationError('No se puede cancelar una instancia ya finalizada');
    }

    const updated = await prisma.formatoInstancia.update({
      where: { id },
      data: {
        estado: 'CANCELADO',
        observaciones: motivo ? `${instancia.observaciones || ''}\nMotivo cancelación: ${motivo}` : instancia.observaciones,
      },
    });

    await this.addHistorial(id, 'CANCELADO', motivo || 'Instancia cancelada', null, userId);

    return updated;
  }

  // ==========================================
  // RESPUESTAS
  // ==========================================

  /**
   * Guardar respuestas (batch)
   */
  async saveRespuestas(instanciaId, respuestas, userId) {
    const instancia = await prisma.formatoInstancia.findUnique({ where: { id: instanciaId } });
    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    if (instancia.estado === 'COMPLETADO' || instancia.estado === 'CANCELADO') {
      throw new ValidationError('No se pueden modificar respuestas de una instancia finalizada');
    }

    // Actualizar estado a EN_PROCESO si está en BORRADOR
    if (instancia.estado === 'BORRADOR') {
      await prisma.formatoInstancia.update({
        where: { id: instanciaId },
        data: { estado: 'EN_PROCESO' },
      });
    }

    // Upsert de respuestas
    const operations = respuestas.map(r => {
      const data = {
        valorTexto: r.valorTexto ?? null,
        valorNumero: r.valorNumero ?? null,
        valorFecha: r.valorFecha ? new Date(r.valorFecha) : null,
        valorBoolean: r.valorBoolean ?? null,
        valorJson: r.valorJson ?? null,
        valorArchivo: r.valorArchivo ?? null,
        cumple: r.cumple ?? null,
        noAplica: r.noAplica ?? null,
        observaciones: r.observaciones ?? null,
        fechaVencimiento: r.fechaVencimiento ? new Date(r.fechaVencimiento) : null,
      };

      return prisma.respuestaCampo.upsert({
        where: {
          instanciaId_campoId: {
            instanciaId,
            campoId: r.campoId,
          },
        },
        update: data,
        create: {
          instanciaId,
          campoId: r.campoId,
          ...data,
        },
      });
    });

    await prisma.$transaction(operations);
    await this.addHistorial(instanciaId, 'MODIFICADO', `${respuestas.length} respuestas guardadas`, null, userId);

    return { saved: respuestas.length };
  }

  // ==========================================
  // ASISTENTES
  // ==========================================

  /**
   * Obtener asistentes de instancia
   */
  async getAsistentes(instanciaId) {
    return prisma.asistenteFormato.findMany({
      where: { instanciaId },
      include: {
        personal: { select: { id: true, nombreCompleto: true, cargo: true } },
      },
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  /**
   * Agregar asistente
   */
  async addAsistente(instanciaId, data) {
    const instancia = await prisma.formatoInstancia.findUnique({ where: { id: instanciaId } });
    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    return prisma.asistenteFormato.create({
      data: {
        instanciaId,
        personalId: data.personalId || null,
        nombreCompleto: data.nombreCompleto,
        cargo: data.cargo || null,
        asistio: data.asistio ?? true,
      },
    });
  }

  /**
   * Actualizar asistente (incluyendo firma)
   */
  async updateAsistente(asistenteteId, data) {
    const asistente = await prisma.asistenteFormato.findUnique({ where: { id: asistenteteId } });
    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    return prisma.asistenteFormato.update({
      where: { id: asistenteteId },
      data: {
        ...(data.nombreCompleto && { nombreCompleto: data.nombreCompleto }),
        ...(data.cargo !== undefined && { cargo: data.cargo }),
        ...(data.asistio !== undefined && { asistio: data.asistio }),
        ...(data.firmaUrl !== undefined && { firmaUrl: data.firmaUrl }),
      },
    });
  }

  /**
   * Eliminar asistente
   */
  async deleteAsistente(asistenteId) {
    const asistente = await prisma.asistenteFormato.findUnique({ where: { id: asistenteId } });
    if (!asistente) {
      throw new NotFoundError('Asistente no encontrado');
    }

    await prisma.asistenteFormato.delete({ where: { id: asistenteId } });
    return { message: 'Asistente eliminado' };
  }

  // ==========================================
  // FIRMAS
  // ==========================================

  /**
   * Agregar firma
   */
  async addFirma(instanciaId, data, userId) {
    const instancia = await prisma.formatoInstancia.findUnique({ where: { id: instanciaId } });
    if (!instancia) {
      throw new NotFoundError('Instancia no encontrada');
    }

    if (instancia.estado === 'CANCELADO') {
      throw new ValidationError('No se puede firmar una instancia cancelada');
    }

    const firma = await prisma.firmaFormato.create({
      data: {
        instanciaId,
        rol: data.rol,
        nombreCompleto: data.nombreCompleto,
        cargo: data.cargo || null,
        firmaUrl: data.firmaUrl || null,
        fechaFirma: data.firmaUrl ? new Date() : null,
      },
    });

    await this.addHistorial(instanciaId, 'FIRMA_AGREGADA', `Firma de ${data.nombreCompleto} (${data.rol})`, null, userId);

    return firma;
  }

  /**
   * Actualizar firma
   */
  async updateFirma(firmaId, data) {
    const firma = await prisma.firmaFormato.findUnique({ where: { id: firmaId } });
    if (!firma) {
      throw new NotFoundError('Firma no encontrada');
    }

    return prisma.firmaFormato.update({
      where: { id: firmaId },
      data: {
        ...(data.rol && { rol: data.rol }),
        ...(data.nombreCompleto && { nombreCompleto: data.nombreCompleto }),
        ...(data.cargo !== undefined && { cargo: data.cargo }),
        ...(data.firmaUrl !== undefined && { firmaUrl: data.firmaUrl }),
        ...(data.firmaUrl && !firma.fechaFirma && { fechaFirma: new Date() }),
      },
    });
  }

  /**
   * Eliminar firma
   */
  async deleteFirma(firmaId) {
    const firma = await prisma.firmaFormato.findUnique({ where: { id: firmaId } });
    if (!firma) {
      throw new NotFoundError('Firma no encontrada');
    }

    await prisma.firmaFormato.delete({ where: { id: firmaId } });
    return { message: 'Firma eliminada' };
  }

  // ==========================================
  // HISTORIAL
  // ==========================================

  /**
   * Obtener historial de instancia
   */
  async getHistorial(instanciaId) {
    return prisma.historialFormato.findMany({
      where: { instanciaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Agregar entrada al historial
   */
  async addHistorial(instanciaId, accion, descripcion, cambios, userId) {
    return prisma.historialFormato.create({
      data: {
        instanciaId,
        accion,
        descripcion,
        cambios: cambios || null,
        realizadoPor: userId,
      },
    });
  }

  // ==========================================
  // ARCHIVOS ADJUNTOS
  // ==========================================

  /**
   * Agregar archivo adjunto
   */
  async addArchivo(instanciaId, data, userId) {
    return prisma.archivoFormato.create({
      data: {
        instanciaId,
        nombre: data.nombre,
        archivoUrl: data.archivoUrl,
        archivoNombre: data.archivoNombre,
        archivoTipo: data.archivoTipo || null,
        archivoTamano: data.archivoTamano || null,
        subidoPor: userId,
      },
    });
  }

  /**
   * Eliminar archivo adjunto
   */
  async deleteArchivo(archivoId) {
    const archivo = await prisma.archivoFormato.findUnique({ where: { id: archivoId } });
    if (!archivo) {
      throw new NotFoundError('Archivo no encontrado');
    }

    await prisma.archivoFormato.delete({ where: { id: archivoId } });
    return { message: 'Archivo eliminado' };
  }

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  /**
   * Estadísticas de instancias
   */
  async getStats(query = {}) {
    const { templateId } = query;
    const where = templateId ? { templateId } : {};

    const [total, porEstado, recientes] = await Promise.all([
      prisma.formatoInstancia.count({ where }),
      prisma.formatoInstancia.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.formatoInstancia.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          template: { select: { nombre: true } },
          personal: { select: { nombreCompleto: true } },
        },
      }),
    ]);

    return {
      total,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      recientes,
    };
  }

  /**
   * Estadísticas de cumplimiento (para checklists C/NC/NA)
   */
  async getCumplimiento(templateId) {
    const instancias = await prisma.formatoInstancia.findMany({
      where: { templateId, estado: 'COMPLETADO' },
      include: {
        respuestas: {
          where: { cumple: { not: null } },
        },
      },
    });

    let totalCampos = 0;
    let cumple = 0;
    let noCumple = 0;
    let noAplica = 0;

    for (const inst of instancias) {
      for (const resp of inst.respuestas) {
        totalCampos++;
        if (resp.noAplica) noAplica++;
        else if (resp.cumple === true) cumple++;
        else if (resp.cumple === false) noCumple++;
      }
    }

    const aplicables = totalCampos - noAplica;
    const porcentajeCumplimiento = aplicables > 0 ? ((cumple / aplicables) * 100).toFixed(1) : 0;

    return {
      totalInstancias: instancias.length,
      totalCampos,
      cumple,
      noCumple,
      noAplica,
      porcentajeCumplimiento,
    };
  }

  // ==========================================
  // ALERTAS DE FORMATOS
  // ==========================================

  /**
   * Obtener todas las alertas con filtros
   */
  async getAlertas(query = {}) {
    const { page = 1, limit = 20, tipo, atendida, instanciaId } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipo && { tipo }),
      ...(atendida !== undefined && { atendida: atendida === 'true' }),
      ...(instanciaId && { instanciaId }),
    };

    const [data, total] = await Promise.all([
      prisma.alertaFormato.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          instancia: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              template: { select: { nombre: true, codigo: true } },
              personal: { select: { nombreCompleto: true } },
            },
          },
        },
        orderBy: [{ atendida: 'asc' }, { fechaAlerta: 'desc' }],
      }),
      prisma.alertaFormato.count({ where }),
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
   * Dashboard de alertas
   */
  async getAlertasDashboard() {
    const [
      pendientes,
      atendidas,
      porTipo,
      recientes,
    ] = await Promise.all([
      prisma.alertaFormato.count({ where: { atendida: false } }),
      prisma.alertaFormato.count({ where: { atendida: true } }),
      prisma.alertaFormato.groupBy({
        by: ['tipo'],
        where: { atendida: false },
        _count: true,
      }),
      prisma.alertaFormato.findMany({
        where: { atendida: false },
        take: 5,
        orderBy: { fechaAlerta: 'desc' },
        include: {
          instancia: {
            select: {
              template: { select: { nombre: true } },
              personal: { select: { nombreCompleto: true } },
            },
          },
        },
      }),
    ]);

    return {
      pendientes,
      atendidas,
      porTipo: porTipo.map(p => ({ tipo: p.tipo, cantidad: p._count })),
      recientes,
    };
  }

  /**
   * Atender una alerta
   */
  async atenderAlerta(id, userId) {
    const alerta = await prisma.alertaFormato.findUnique({ where: { id } });
    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    return prisma.alertaFormato.update({
      where: { id },
      data: {
        atendida: true,
        fechaAtendida: new Date(),
        atendidaPor: userId,
      },
    });
  }

  /**
   * Generar alertas automáticas para vencimientos
   */
  async generarAlertas() {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    // Buscar instancias con vencimiento próximo
    const instanciasProxVencer = await prisma.formatoInstancia.findMany({
      where: {
        estado: { not: 'VENCIDO' },
        fechaVencimiento: {
          gte: hoy,
          lte: en30Dias,
        },
      },
      include: {
        template: { select: { nombre: true } },
        alertas: {
          where: {
            tipo: 'VENCIMIENTO_PROXIMO',
            atendida: false,
          },
        },
      },
    });

    // Buscar instancias vencidas
    const instanciasVencidas = await prisma.formatoInstancia.findMany({
      where: {
        estado: { not: 'VENCIDO' },
        fechaVencimiento: { lt: hoy },
      },
      include: {
        alertas: {
          where: {
            tipo: 'VENCIDO',
            atendida: false,
          },
        },
      },
    });

    let alertasCreadas = 0;

    // Crear alertas para próximos a vencer
    for (const inst of instanciasProxVencer) {
      if (inst.alertas.length === 0) {
        await prisma.alertaFormato.create({
          data: {
            instanciaId: inst.id,
            tipo: 'VENCIMIENTO_PROXIMO',
            mensaje: `El formato "${inst.template.nombre}" vence el ${inst.fechaVencimiento.toISOString().split('T')[0]}`,
            fechaAlerta: new Date(),
          },
        });
        alertasCreadas++;
      }
    }

    // Crear alertas para vencidos y actualizar estado
    for (const inst of instanciasVencidas) {
      if (inst.alertas.length === 0) {
        await prisma.$transaction([
          prisma.alertaFormato.create({
            data: {
              instanciaId: inst.id,
              tipo: 'VENCIDO',
              mensaje: `El formato ha vencido`,
              fechaAlerta: new Date(),
            },
          }),
          prisma.formatoInstancia.update({
            where: { id: inst.id },
            data: { estado: 'VENCIDO' },
          }),
        ]);
        alertasCreadas++;
      }
    }

    return {
      alertasCreadas,
      instanciasProxVencer: instanciasProxVencer.length,
      instanciasVencidas: instanciasVencidas.length,
    };
  }
}

module.exports = new FormatoInstanciaService();
