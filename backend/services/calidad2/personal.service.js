const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const checklistService = require('./checklist.service');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class PersonalCalidad2Service {
  // ==========================================
  // CRUD PERSONAL
  // ==========================================

  /**
   * Obtener lista de personal con paginación y filtros
   */
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      tipoPersonal,
      tipoContrato,
      estado,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && { estado }),
      ...(tipoPersonal && { tipoPersonal }),
      ...(tipoContrato && { tipoContrato }),
      ...(search && {
        OR: [
          { nombreCompleto: { contains: search, mode: 'insensitive' } },
          { numeroDocumento: { contains: search, mode: 'insensitive' } },
          { cargo: { contains: search, mode: 'insensitive' } },
          { correo: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.personal.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { documentos: true },
          },
          checklistEstado: {
            include: {
              checklistItem: {
                select: { esObligatorio: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.personal.count({ where }),
    ]);

    // Calcular estado OK del checklist
    const dataWithStatus = data.map(p => ({
      ...p,
      checklistCompleto: this.calcularChecklistCompleto(p.checklistEstado),
      documentosCount: p._count.documentos,
    }));

    return {
      data: dataWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener personal por ID con documentos y checklist
   */
  async findById(id) {
    const personal = await prisma.personal.findUnique({
      where: { id },
      include: {
        candidatoTalento: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true, rol: true },
        },
        documentos: {
          orderBy: { createdAt: 'desc' },
          include: {
            checklistItem: {
              select: { id: true, nombre: true, categoria: true },
            },
          },
        },
        checklistEstado: {
          include: {
            checklistItem: true,
          },
        },
      },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    // Agregar estado del checklist
    const checklistStatus = await checklistService.getEstadoForPersonal(id);

    return {
      ...personal,
      checklistCompleto: this.calcularChecklistCompleto(personal.checklistEstado),
      checklistDetalle: checklistStatus,
    };
  }

  /**
   * Crear personal manualmente
   */
  async create(data) {
    const {
      tipoDocumento,
      numeroDocumento,
      nombreCompleto,
      cargo,
      tipoPersonal,
      correo,
      telefono,
      tipoContrato,
      fechaIngreso,
      usuarioId,
    } = data;

    // Validar documento único
    const existente = await prisma.personal.findUnique({
      where: { numeroDocumento },
    });

    if (existente) {
      throw new ValidationError('Ya existe personal con este número de documento');
    }

    // Validar usuarioId si se proporciona
    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });
      if (!usuario) {
        throw new ValidationError('Usuario no encontrado');
      }
      // Verificar que no esté vinculado a otro personal
      const vinculado = await prisma.personal.findFirst({
        where: { usuarioId },
      });
      if (vinculado) {
        throw new ValidationError('Este usuario ya está vinculado a otro registro de personal');
      }
    }

    const personal = await prisma.personal.create({
      data: {
        tipoDocumento,
        numeroDocumento,
        nombreCompleto,
        cargo,
        tipoPersonal,
        correo,
        telefono,
        tipoContrato,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
        usuarioId,
      },
    });

    // Inicializar checklist
    await checklistService.initializeForPersonal(personal.id);

    return personal;
  }

  /**
   * Crear personal desde candidato
   */
  async createFromCandidato(candidatoId, additionalData = {}) {
    const candidato = await prisma.candidatoTalento.findUnique({
      where: { id: candidatoId },
    });

    if (!candidato) {
      throw new NotFoundError('Candidato no encontrado');
    }

    // Verificar que no esté ya vinculado
    const existente = await prisma.personal.findFirst({
      where: { candidatoTalentoId: candidatoId },
    });

    if (existente) {
      throw new ValidationError('Este candidato ya ha sido registrado como personal');
    }

    // Verificar documento único
    const docExistente = await prisma.personal.findFirst({
      where: { numeroDocumento: candidato.documentNumber },
    });

    if (docExistente) {
      throw new ValidationError('Ya existe personal con el número de documento de este candidato');
    }

    const personal = await prisma.personal.create({
      data: {
        candidatoTalentoId: candidatoId,
        tipoDocumento: candidato.documentType,
        numeroDocumento: candidato.documentNumber,
        nombreCompleto: `${candidato.firstName} ${candidato.lastName}`,
        cargo: additionalData.cargo || candidato.profession,
        tipoPersonal: additionalData.tipoPersonal || 'OTRO',
        correo: candidato.email,
        telefono: candidato.mobilePhone,
        tipoContrato: additionalData.tipoContrato || 'INDEFINIDO',
        fechaIngreso: additionalData.fechaIngreso ? new Date(additionalData.fechaIngreso) : new Date(),
        usuarioId: additionalData.usuarioId || null,
      },
      include: {
        candidatoTalento: true,
      },
    });

    // Actualizar estado del candidato a Contratado
    await prisma.candidatoTalento.update({
      where: { id: candidatoId },
      data: { estado: 'Contratado' },
    });

    // Inicializar checklist
    await checklistService.initializeForPersonal(personal.id);

    return personal;
  }

  /**
   * Actualizar personal
   */
  async update(id, data) {
    const personal = await prisma.personal.findUnique({
      where: { id },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    const {
      nombreCompleto,
      cargo,
      tipoPersonal,
      correo,
      telefono,
      tipoContrato,
      estado,
      fechaIngreso,
      fechaRetiro,
      usuarioId,
    } = data;

    // Validar usuarioId si cambia
    if (usuarioId && usuarioId !== personal.usuarioId) {
      const vinculado = await prisma.personal.findFirst({
        where: { usuarioId, NOT: { id } },
      });
      if (vinculado) {
        throw new ValidationError('Este usuario ya está vinculado a otro registro de personal');
      }
    }

    const updated = await prisma.personal.update({
      where: { id },
      data: {
        ...(nombreCompleto && { nombreCompleto }),
        ...(cargo && { cargo }),
        ...(tipoPersonal && { tipoPersonal }),
        ...(correo !== undefined && { correo }),
        ...(telefono !== undefined && { telefono }),
        ...(tipoContrato && { tipoContrato }),
        ...(estado && { estado }),
        ...(fechaIngreso !== undefined && { fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null }),
        ...(fechaRetiro !== undefined && { fechaRetiro: fechaRetiro ? new Date(fechaRetiro) : null }),
        ...(usuarioId !== undefined && { usuarioId }),
      },
    });

    return updated;
  }

  /**
   * Eliminar personal (soft delete via estado)
   */
  async delete(id) {
    const personal = await prisma.personal.findUnique({
      where: { id },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    await prisma.personal.update({
      where: { id },
      data: {
        estado: 'RETIRADO',
        fechaRetiro: new Date(),
      },
    });

    return { message: 'Personal marcado como retirado' };
  }

  // ==========================================
  // DOCUMENTOS DE PERSONAL
  // ==========================================

  /**
   * Obtener documentos de un personal
   */
  async getDocumentos(personalId) {
    const personal = await prisma.personal.findUnique({
      where: { id: personalId },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    const documentos = await prisma.documentoPersonal.findMany({
      where: { personalId },
      include: {
        checklistItem: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documentos;
  }

  /**
   * Subir documento de personal
   */
  async uploadDocumento(personalId, data, file, userId) {
    const personal = await prisma.personal.findUnique({
      where: { id: personalId },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    if (!file) {
      throw new ValidationError('Se requiere un archivo');
    }

    const { nombre, checklistItemId, fechaEmision, fechaVencimiento } = data;

    // Validar checklistItemId si se proporciona
    if (checklistItemId) {
      const item = await prisma.checklistItemCalidad2.findUnique({
        where: { id: checklistItemId },
      });
      if (!item) {
        throw new ValidationError('Item de checklist no encontrado');
      }
    }

    // Guardar archivo
    const uploadDir = path.join(__dirname, '../../public/uploads/calidad2/personal');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    const archivoUrl = `/uploads/calidad2/personal/${uniqueName}`;

    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Crear documento
    const documento = await prisma.documentoPersonal.create({
      data: {
        personalId,
        checklistItemId: checklistItemId || null,
        nombre: nombre || file.name,
        archivoUrl,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamano: file.size,
        fechaEmision: fechaEmision ? new Date(fechaEmision) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        subidoPor: userId,
      },
      include: {
        checklistItem: {
          select: { id: true, nombre: true, categoria: true },
        },
      },
    });

    // Si está vinculado a un checklist item, actualizar estado a cumple
    if (checklistItemId) {
      await checklistService.updateEstadoItem(personalId, checklistItemId, { cumple: true }, userId);
    }

    return documento;
  }

  /**
   * Eliminar documento de personal
   */
  async deleteDocumento(personalId, documentoId) {
    const documento = await prisma.documentoPersonal.findFirst({
      where: { id: documentoId, personalId },
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../public', documento.archivoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro
    await prisma.documentoPersonal.delete({
      where: { id: documentoId },
    });

    return { message: 'Documento eliminado correctamente' };
  }

  // ==========================================
  // CHECKLIST
  // ==========================================

  /**
   * Obtener estado del checklist
   */
  async getChecklist(personalId) {
    const personal = await prisma.personal.findUnique({
      where: { id: personalId },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    return checklistService.getEstadoForPersonal(personalId);
  }

  /**
   * Actualizar estado de un item del checklist
   */
  async updateChecklistItem(personalId, checklistItemId, data, userId) {
    const personal = await prisma.personal.findUnique({
      where: { id: personalId },
    });

    if (!personal) {
      throw new NotFoundError('Personal no encontrado');
    }

    return checklistService.updateEstadoItem(personalId, checklistItemId, data, userId);
  }

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener estadísticas de personal
   */
  async getStats() {
    const [
      totalActivos,
      totalInactivos,
      porTipoPersonal,
      porTipoContrato,
      checklistsPendientes,
      documentosPorVencer,
    ] = await Promise.all([
      prisma.personal.count({ where: { estado: 'ACTIVO' } }),
      prisma.personal.count({ where: { estado: { not: 'ACTIVO' } } }),
      prisma.personal.groupBy({
        by: ['tipoPersonal'],
        _count: true,
        where: { estado: 'ACTIVO' },
      }),
      prisma.personal.groupBy({
        by: ['tipoContrato'],
        _count: true,
        where: { estado: 'ACTIVO' },
      }),
      // Personal con checklist incompleto
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT p.id)::int as count
        FROM personal_calidad2 p
        LEFT JOIN personal_checklist_estado pce ON p.id = pce.personal_id
        LEFT JOIN checklist_items_calidad2 ci ON pce.checklist_item_id = ci.id
        WHERE p.estado = 'ACTIVO'
        AND ci.es_obligatorio = true
        AND (pce.cumple IS NULL OR pce.cumple = false)
      `,
      // Documentos por vencer en los próximos 30 días
      prisma.documentoPersonal.count({
        where: {
          fechaVencimiento: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalActivos,
      totalInactivos,
      porTipoPersonal: porTipoPersonal.map(p => ({
        tipo: p.tipoPersonal,
        cantidad: p._count,
      })),
      porTipoContrato: porTipoContrato.map(p => ({
        tipo: p.tipoContrato,
        cantidad: p._count,
      })),
      checklistsPendientes: checklistsPendientes[0]?.count || 0,
      documentosPorVencer,
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Calcular si el checklist está completo
   */
  calcularChecklistCompleto(checklistEstado) {
    if (!checklistEstado || checklistEstado.length === 0) return false;
    const obligatorios = checklistEstado.filter(e => e.checklistItem?.esObligatorio);
    if (obligatorios.length === 0) return true;
    return obligatorios.every(e => e.cumple);
  }

  /**
   * Exportar personal a formato para Excel
   */
  async exportData() {
    const personal = await prisma.personal.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        checklistEstado: {
          include: {
            checklistItem: {
              select: { esObligatorio: true },
            },
          },
        },
        _count: {
          select: { documentos: true },
        },
      },
      orderBy: { nombreCompleto: 'asc' },
    });

    // Formatear datos para exportación
    const data = personal.map((p, index) => ({
      numero: index + 1,
      nombreCompleto: p.nombreCompleto,
      tipoDocumento: p.tipoDocumento,
      numeroDocumento: p.numeroDocumento,
      cargo: p.cargo,
      tipoPersonal: p.tipoPersonal,
      tipoContrato: p.tipoContrato,
      correo: p.correo,
      telefono: p.telefono,
      fechaIngreso: p.fechaIngreso ? new Date(p.fechaIngreso).toLocaleDateString('es-CO') : '',
      estado: p.estado,
      checklistCompleto: this.calcularChecklistCompleto(p.checklistEstado) ? 'SI' : 'NO',
      documentos: p._count.documentos,
    }));

    return {
      data,
      headers: [
        { key: 'numero', label: 'N°' },
        { key: 'nombreCompleto', label: 'Nombre Completo' },
        { key: 'tipoDocumento', label: 'Tipo Documento' },
        { key: 'numeroDocumento', label: 'Número Documento' },
        { key: 'cargo', label: 'Cargo' },
        { key: 'tipoPersonal', label: 'Tipo Personal' },
        { key: 'tipoContrato', label: 'Tipo Contrato' },
        { key: 'correo', label: 'Correo' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'fechaIngreso', label: 'Fecha Ingreso' },
        { key: 'estado', label: 'Estado' },
        { key: 'checklistCompleto', label: 'Checklist OK' },
        { key: 'documentos', label: 'Documentos' },
      ],
    };
  }
}

module.exports = new PersonalCalidad2Service();
