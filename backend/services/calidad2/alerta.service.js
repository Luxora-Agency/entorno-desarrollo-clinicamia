const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class AlertaCalidad2Service {
  /**
   * Obtener todas las alertas con filtros
   */
  async findAll(query = {}) {
    const { page = 1, limit = 20, tipo, estado, entidadTipo } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipo && { tipo }),
      ...(estado && { estado }),
      ...(entidadTipo && { entidadTipo }),
    };

    const [alertas, total] = await Promise.all([
      prisma.alertaCalidad2.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { estado: 'asc' }, // PENDIENTE primero
          { fechaVencimiento: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.alertaCalidad2.count({ where }),
    ]);

    return {
      data: alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener alerta por ID
   */
  async findById(id) {
    const alerta = await prisma.alertaCalidad2.findUnique({
      where: { id },
    });

    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    return alerta;
  }

  /**
   * Dashboard de alertas
   */
  async getDashboard() {
    const [
      pendientes,
      porVencer,
      vencidas,
      atendidas,
      porTipo,
    ] = await Promise.all([
      prisma.alertaCalidad2.count({ where: { estado: 'PENDIENTE' } }),
      prisma.alertaCalidad2.count({
        where: {
          estado: 'PENDIENTE',
          tipo: 'DOCUMENTO_POR_VENCER',
        },
      }),
      prisma.alertaCalidad2.count({
        where: {
          estado: 'PENDIENTE',
          tipo: 'DOCUMENTO_VENCIDO',
        },
      }),
      prisma.alertaCalidad2.count({ where: { estado: 'ATENDIDA' } }),
      prisma.alertaCalidad2.groupBy({
        by: ['tipo'],
        where: { estado: 'PENDIENTE' },
        _count: true,
      }),
    ]);

    // Alertas recientes
    const recientes = await prisma.alertaCalidad2.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      resumen: {
        pendientes,
        porVencer,
        vencidas,
        atendidas,
      },
      porTipo: porTipo.map(t => ({
        tipo: t.tipo,
        cantidad: t._count,
      })),
      recientes,
    };
  }

  /**
   * Marcar alerta como atendida
   */
  async atender(id, userId) {
    const alerta = await prisma.alertaCalidad2.findUnique({
      where: { id },
    });

    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    if (alerta.estado !== 'PENDIENTE') {
      throw new ValidationError('Esta alerta ya ha sido procesada');
    }

    const updated = await prisma.alertaCalidad2.update({
      where: { id },
      data: {
        estado: 'ATENDIDA',
        atendidoPor: userId,
        fechaAtencion: new Date(),
      },
    });

    return updated;
  }

  /**
   * Descartar alerta
   */
  async descartar(id, userId) {
    const alerta = await prisma.alertaCalidad2.findUnique({
      where: { id },
    });

    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    if (alerta.estado !== 'PENDIENTE') {
      throw new ValidationError('Esta alerta ya ha sido procesada');
    }

    const updated = await prisma.alertaCalidad2.update({
      where: { id },
      data: {
        estado: 'DESCARTADA',
        atendidoPor: userId,
        fechaAtencion: new Date(),
      },
    });

    return updated;
  }

  /**
   * Obtener documentos próximos a vencer
   */
  async getProximosVencer(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const documentos = await prisma.documentoPersonal.findMany({
      where: {
        fechaVencimiento: {
          gte: new Date(),
          lte: fechaLimite,
        },
      },
      include: {
        personal: {
          select: { id: true, nombreCompleto: true, cargo: true },
        },
        checklistItem: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return documentos.map(doc => ({
      ...doc,
      diasParaVencer: Math.ceil((doc.fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24)),
    }));
  }

  /**
   * Generar alertas de vencimiento
   * Este método se puede llamar desde un cron job
   */
  async generarAlertas() {
    const hoy = new Date();
    let alertasCreadas = 0;
    let alertasVencidas = 0;

    // Obtener documentos con fechas de vencimiento
    const documentos = await prisma.documentoPersonal.findMany({
      where: {
        fechaVencimiento: { not: null },
        alertaGenerada: false,
      },
      include: {
        personal: {
          select: { id: true, nombreCompleto: true },
        },
        checklistItem: {
          select: {
            id: true,
            nombre: true,
            diasAlertaVencimiento: true,
          },
        },
      },
    });

    for (const doc of documentos) {
      const diasParaVencer = Math.ceil((doc.fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
      const diasAlerta = doc.checklistItem?.diasAlertaVencimiento || 30;

      // Documento por vencer
      if (diasParaVencer > 0 && diasParaVencer <= diasAlerta) {
        await this.crearAlerta({
          tipo: 'DOCUMENTO_POR_VENCER',
          entidadTipo: 'DocumentoPersonal',
          entidadId: doc.id,
          titulo: `Documento por vencer: ${doc.nombre}`,
          descripcion: `El documento "${doc.nombre}" de ${doc.personal.nombreCompleto} vence en ${diasParaVencer} días`,
          fechaVencimiento: doc.fechaVencimiento,
        });

        await prisma.documentoPersonal.update({
          where: { id: doc.id },
          data: { alertaGenerada: true },
        });

        alertasCreadas++;
      }
      // Documento vencido
      else if (diasParaVencer <= 0) {
        await this.crearAlerta({
          tipo: 'DOCUMENTO_VENCIDO',
          entidadTipo: 'DocumentoPersonal',
          entidadId: doc.id,
          titulo: `Documento vencido: ${doc.nombre}`,
          descripcion: `El documento "${doc.nombre}" de ${doc.personal.nombreCompleto} ha vencido`,
          fechaVencimiento: doc.fechaVencimiento,
        });

        await prisma.documentoPersonal.update({
          where: { id: doc.id },
          data: { alertaGenerada: true },
        });

        alertasVencidas++;
      }
    }

    // Generar alertas de checklist incompleto
    const personalIncompleto = await this.getPersonalConChecklistIncompleto();
    let alertasChecklist = 0;

    for (const personal of personalIncompleto) {
      // Verificar si ya existe una alerta pendiente
      const alertaExistente = await prisma.alertaCalidad2.findFirst({
        where: {
          tipo: 'CHECKLIST_INCOMPLETO',
          entidadTipo: 'Personal',
          entidadId: personal.id,
          estado: 'PENDIENTE',
        },
      });

      if (!alertaExistente) {
        await this.crearAlerta({
          tipo: 'CHECKLIST_INCOMPLETO',
          entidadTipo: 'Personal',
          entidadId: personal.id,
          titulo: `Checklist incompleto: ${personal.nombreCompleto}`,
          descripcion: `El personal ${personal.nombreCompleto} tiene ${personal.itemsPendientes} documentos obligatorios pendientes`,
        });
        alertasChecklist++;
      }
    }

    return {
      documentosPorVencer: alertasCreadas,
      documentosVencidos: alertasVencidas,
      checklistsIncompletos: alertasChecklist,
      total: alertasCreadas + alertasVencidas + alertasChecklist,
    };
  }

  /**
   * Crear alerta
   */
  async crearAlerta(data) {
    const { tipo, entidadTipo, entidadId, titulo, descripcion, fechaVencimiento } = data;

    const alerta = await prisma.alertaCalidad2.create({
      data: {
        tipo,
        entidadTipo,
        entidadId,
        titulo,
        descripcion,
        fechaVencimiento,
      },
    });

    return alerta;
  }

  /**
   * Obtener personal con checklist incompleto
   */
  async getPersonalConChecklistIncompleto() {
    // Query raw para obtener personal con items obligatorios incumplidos
    const personal = await prisma.$queryRaw`
      SELECT
        p.id,
        p.nombre_completo as "nombreCompleto",
        p.cargo,
        COUNT(CASE WHEN pce.cumple = false OR pce.cumple IS NULL THEN 1 END)::int as "itemsPendientes"
      FROM personal_calidad2 p
      LEFT JOIN personal_checklist_estado pce ON p.id = pce.personal_id
      LEFT JOIN checklist_items_calidad2 ci ON pce.checklist_item_id = ci.id
      WHERE p.estado = 'ACTIVO'
        AND ci.es_obligatorio = true
        AND ci.activo = true
      GROUP BY p.id, p.nombre_completo, p.cargo
      HAVING COUNT(CASE WHEN pce.cumple = false OR pce.cumple IS NULL THEN 1 END) > 0
      ORDER BY "itemsPendientes" DESC
    `;

    return personal;
  }

  /**
   * Resetear flag de alerta generada para documentos renovados
   */
  async resetAlertaDocumento(documentoId) {
    await prisma.documentoPersonal.update({
      where: { id: documentoId },
      data: { alertaGenerada: false },
    });

    // Marcar alertas relacionadas como atendidas
    await prisma.alertaCalidad2.updateMany({
      where: {
        entidadTipo: 'DocumentoPersonal',
        entidadId: documentoId,
        estado: 'PENDIENTE',
      },
      data: {
        estado: 'ATENDIDA',
        fechaAtencion: new Date(),
      },
    });
  }

  // ==========================================
  // ALERTAS TALENTO HUMANO (Nuevo sistema)
  // ==========================================

  /**
   * Obtener alertas de talento humano
   */
  async getAlertasTalentoHumano(query = {}) {
    const { page = 1, limit = 20, tipo, prioridad, atendida, personalId } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(tipo && { tipo }),
      ...(prioridad && { prioridad }),
      ...(atendida !== undefined && { atendida: atendida === 'true' || atendida === true }),
      ...(personalId && { personalId }),
    };

    const [data, total] = await Promise.all([
      prisma.alertaTalentoHumano.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          personal: {
            select: { id: true, nombreCompleto: true, cargo: true, numeroDocumento: true },
          },
        },
        orderBy: [{ atendida: 'asc' }, { prioridad: 'asc' }, { fechaVence: 'asc' }],
      }),
      prisma.alertaTalentoHumano.count({ where }),
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
   * Dashboard de alertas de talento humano
   */
  async getDashboardTalentoHumano() {
    const hoy = new Date();
    const en7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [totalPendientes, porTipo, porPrioridad, vencidasHoy, proximaSemana, proximoMes] = await Promise.all([
      prisma.alertaTalentoHumano.count({ where: { atendida: false } }),
      prisma.alertaTalentoHumano.groupBy({ by: ['tipo'], _count: true, where: { atendida: false } }),
      prisma.alertaTalentoHumano.groupBy({ by: ['prioridad'], _count: true, where: { atendida: false } }),
      prisma.alertaTalentoHumano.count({ where: { atendida: false, fechaVence: { lte: hoy } } }),
      prisma.alertaTalentoHumano.count({ where: { atendida: false, fechaVence: { gt: hoy, lte: en7dias } } }),
      prisma.alertaTalentoHumano.count({ where: { atendida: false, fechaVence: { gt: en7dias, lte: en30dias } } }),
    ]);

    return {
      totalPendientes,
      vencidasHoy,
      proximaSemana,
      proximoMes,
      porTipo: porTipo.map(p => ({ tipo: p.tipo, cantidad: p._count })),
      porPrioridad: porPrioridad.map(p => ({ prioridad: p.prioridad, cantidad: p._count })),
    };
  }

  /**
   * Atender alerta de talento humano
   */
  async atenderAlertaTH(id, userId) {
    const alerta = await prisma.alertaTalentoHumano.findUnique({ where: { id } });
    if (!alerta) throw new NotFoundError('Alerta no encontrada');

    return prisma.alertaTalentoHumano.update({
      where: { id },
      data: { atendida: true, fechaAtendida: new Date(), atendidaPor: userId },
    });
  }

  /**
   * Generar alertas automáticas de talento humano
   */
  async generarAlertasTalentoHumano() {
    const alertasCreadas = [];

    // Obtener personal activo con fechas de vencimiento
    const personal = await prisma.personal.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombreCompleto: true,
        fechaVencimientoVacunas: true,
        fechaVencimientoPoliza: true,
        fechaVencimientoExamen: true,
        fechaFinContrato: true,
        fechaRethus: true,
      },
    });

    for (const p of personal) {
      // Alertas por tipo de vencimiento
      const alertConfigs = [
        { campo: 'fechaVencimientoVacunas', tipo: 'VACUNAS', msg: 'Carnet de vacunas' },
        { campo: 'fechaVencimientoPoliza', tipo: 'POLIZA_RC', msg: 'Póliza RC' },
        { campo: 'fechaVencimientoExamen', tipo: 'EXAMEN_OCUPACIONAL', msg: 'Examen ocupacional' },
        { campo: 'fechaFinContrato', tipo: 'CONTRATO', msg: 'Contrato' },
      ];

      for (const cfg of alertConfigs) {
        if (p[cfg.campo]) {
          const alerta = await this.crearAlertaTHSiNoExiste({
            tipo: cfg.tipo,
            personalId: p.id,
            fechaVence: p[cfg.campo],
            mensaje: `${cfg.msg} de ${p.nombreCompleto} próximo a vencer`,
          });
          if (alerta) alertasCreadas.push(alerta);
        }
      }
    }

    return { alertasCreadas: alertasCreadas.length, alertas: alertasCreadas };
  }

  /**
   * Helper para crear alerta TH si no existe
   */
  async crearAlertaTHSiNoExiste(data) {
    const { tipo, personalId, referencia, fechaVence, mensaje } = data;
    const hoy = new Date();
    const diasParaVencer = Math.ceil((new Date(fechaVence) - hoy) / (1000 * 60 * 60 * 24));

    if (diasParaVencer > 60 || diasParaVencer < -30) return null;

    const existente = await prisma.alertaTalentoHumano.findFirst({
      where: { tipo, personalId, referencia: referencia || null, atendida: false },
    });
    if (existente) return null;

    let prioridad = 'BAJA';
    if (diasParaVencer <= 7) prioridad = 'ALTA';
    else if (diasParaVencer <= 30) prioridad = 'MEDIA';

    return prisma.alertaTalentoHumano.create({
      data: {
        tipo,
        personalId,
        referencia,
        fechaVence: new Date(fechaVence),
        mensaje,
        prioridad,
        diasAnticipacion: Math.max(0, diasParaVencer),
      },
    });
  }
}

module.exports = new AlertaCalidad2Service();
