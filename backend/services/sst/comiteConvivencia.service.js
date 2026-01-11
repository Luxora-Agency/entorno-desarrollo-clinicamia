/**
 * Servicio de Comite de Convivencia Laboral (CCL)
 * Gestiona conformacion, reuniones y quejas de acoso laboral
 * Normativa: Resolucion 3461/2025, Ley 1010/2006
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class ComiteConvivenciaService {
  /**
   * Listar periodos del CCL
   */
  async findAll({ page = 1, limit = 10, estado }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;

    const [comites, total] = await Promise.all([
      prisma.sSTComiteConvivencia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaConformacion: 'desc' },
        include: {
          _count: {
            select: { integrantes: true, reuniones: true, quejas: true },
          },
        },
      }),
      prisma.sSTComiteConvivencia.count({ where }),
    ]);

    return {
      data: comites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener CCL vigente
   */
  async getVigente() {
    const ccl = await prisma.sSTComiteConvivencia.findFirst({
      where: { estado: 'VIGENTE' },
      include: {
        integrantes: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                cargo: { select: { nombre: true } },
              },
            },
          },
        },
        reuniones: {
          orderBy: { fechaReunion: 'desc' },
          take: 5,
        },
        _count: {
          select: { quejas: true },
        },
      },
    });

    return ccl;
  }

  /**
   * Obtener CCL por ID
   */
  async findById(id) {
    const ccl = await prisma.sSTComiteConvivencia.findUnique({
      where: { id },
      include: {
        integrantes: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                cargo: { select: { nombre: true } },
              },
            },
          },
        },
        reuniones: {
          orderBy: { fechaReunion: 'desc' },
        },
        quejas: {
          orderBy: { fechaQueja: 'desc' },
        },
      },
    });

    if (!ccl) {
      throw new NotFoundError('Comite de Convivencia no encontrado');
    }

    return ccl;
  }

  /**
   * Crear nuevo CCL
   */
  async create(data) {
    const vigente = await prisma.sSTComiteConvivencia.findFirst({
      where: { estado: 'VIGENTE' },
    });

    if (vigente) {
      throw new ValidationError('Ya existe un CCL vigente');
    }

    const ccl = await prisma.sSTComiteConvivencia.create({
      data: {
        periodo: data.periodo,
        fechaConformacion: new Date(data.fechaConformacion),
        fechaVencimiento: new Date(data.fechaVencimiento),
        resolucionConformacion: data.resolucionConformacion,
        estado: 'VIGENTE',
        observaciones: data.observaciones,
      },
    });

    return ccl;
  }

  /**
   * Agregar integrante al CCL
   */
  async agregarIntegrante(cclId, data) {
    const ccl = await prisma.sSTComiteConvivencia.findUnique({
      where: { id: cclId },
    });

    if (!ccl) {
      throw new NotFoundError('CCL no encontrado');
    }

    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    const integrante = await prisma.sSTCCLIntegrante.create({
      data: {
        cclId,
        empleadoId: data.empleadoId,
        rol: data.rol,
        tipo: data.tipo,
        fechaIngreso: new Date(),
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return integrante;
  }

  /**
   * Crear reunion del CCL
   */
  async crearReunion(cclId, data) {
    const ccl = await prisma.sSTComiteConvivencia.findUnique({
      where: { id: cclId },
    });

    if (!ccl) {
      throw new NotFoundError('CCL no encontrado');
    }

    const reunionesCount = await prisma.sSTCCLReunion.count({
      where: { cclId },
    });

    const reunion = await prisma.sSTCCLReunion.create({
      data: {
        cclId,
        numeroReunion: reunionesCount + 1,
        tipoReunion: data.tipoReunion,
        fechaReunion: new Date(data.fechaReunion),
        horaInicio: data.horaInicio,
        lugar: data.lugar,
        ordenDia: data.ordenDia,
        estado: 'PROGRAMADA',
      },
    });

    return reunion;
  }

  /**
   * Registrar queja de acoso laboral
   */
  async registrarQueja(cclId, data) {
    const ccl = await prisma.sSTComiteConvivencia.findUnique({
      where: { id: cclId },
    });

    if (!ccl) {
      throw new NotFoundError('CCL no encontrado');
    }

    // Generar numero de caso
    const year = new Date().getFullYear();
    const count = await prisma.sSTQuejaAcosoLaboral.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const numeroCaso = `CCL-${year}-${String(count + 1).padStart(4, '0')}`;

    const queja = await prisma.sSTQuejaAcosoLaboral.create({
      data: {
        cclId,
        numeroCaso,
        fechaQueja: new Date(data.fechaQueja),
        fechaHechos: new Date(data.fechaHechos),
        quejanteId: data.quejanteId,
        quejanteExterno: data.quejanteExterno,
        acusadoId: data.acusadoId,
        acusadoExterno: data.acusadoExterno,
        tipoAcoso: data.tipoAcoso, // LABORAL, SEXUAL, DISCRIMINACION
        modalidadAcoso: data.modalidadAcoso, // MALTRATO, PERSECUCION, DISCRIMINACION, ENTORPECIMIENTO, INEQUIDAD, DESPROTECCION
        descripcionHechos: data.descripcionHechos,
        testigos: data.testigos,
        evidenciasAportadas: data.evidenciasAportadas,
        esAnonima: data.esAnonima || false,
        estado: 'RECIBIDA',
      },
    });

    return queja;
  }

  /**
   * Obtener queja por ID
   */
  async getQueja(quejaId) {
    const queja = await prisma.sSTQuejaAcosoLaboral.findUnique({
      where: { id: quejaId },
      include: {
        ccl: true,
        quejante: {
          select: { id: true, nombre: true, apellido: true },
        },
        acusado: {
          select: { id: true, nombre: true, apellido: true },
        },
        seguimientos: {
          orderBy: { fechaSeguimiento: 'desc' },
        },
      },
    });

    if (!queja) {
      throw new NotFoundError('Queja no encontrada');
    }

    return queja;
  }

  /**
   * Actualizar estado de queja
   */
  async actualizarQueja(quejaId, data) {
    const queja = await prisma.sSTQuejaAcosoLaboral.findUnique({
      where: { id: quejaId },
    });

    if (!queja) {
      throw new NotFoundError('Queja no encontrada');
    }

    const updated = await prisma.sSTQuejaAcosoLaboral.update({
      where: { id: quejaId },
      data: {
        estado: data.estado,
        fechaAceptacion: data.estado === 'EN_TRAMITE' ? new Date() : undefined,
        mediadorAsignadoId: data.mediadorAsignadoId,
        fechaConciliacion: data.fechaConciliacion ? new Date(data.fechaConciliacion) : undefined,
        acuerdosConciliacion: data.acuerdosConciliacion,
        fechaResolucion: data.estado === 'RESUELTA' || data.estado === 'CERRADA' ? new Date() : undefined,
        resolucionFinal: data.resolucionFinal,
        medidasCorrectivas: data.medidasCorrectivas,
        remitidaARL: data.remitidaARL,
        fechaRemisionARL: data.fechaRemisionARL ? new Date(data.fechaRemisionARL) : undefined,
      },
    });

    return updated;
  }

  /**
   * Agregar seguimiento a queja
   */
  async agregarSeguimientoQueja(quejaId, data) {
    const queja = await prisma.sSTQuejaAcosoLaboral.findUnique({
      where: { id: quejaId },
    });

    if (!queja) {
      throw new NotFoundError('Queja no encontrada');
    }

    const seguimiento = await prisma.sSTSeguimientoQuejaAcoso.create({
      data: {
        quejaId,
        fechaSeguimiento: new Date(),
        tipoAccion: data.tipoAccion,
        descripcion: data.descripcion,
        realizadoPorId: data.realizadoPorId,
        observaciones: data.observaciones,
        documentosAdjuntos: data.documentosAdjuntos,
      },
    });

    return seguimiento;
  }

  /**
   * Obtener quejas pendientes
   */
  async getQuejasPendientes() {
    return prisma.sSTQuejaAcosoLaboral.findMany({
      where: {
        estado: { in: ['RECIBIDA', 'EN_TRAMITE', 'EN_CONCILIACION'] },
      },
      include: {
        quejante: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaQueja: 'asc' },
    });
  }

  /**
   * Obtener estadisticas del CCL
   */
  async getEstadisticas(cclId) {
    const ccl = await prisma.sSTComiteConvivencia.findUnique({
      where: { id: cclId },
      include: {
        reuniones: true,
        quejas: true,
      },
    });

    if (!ccl) {
      throw new NotFoundError('CCL no encontrado');
    }

    const quejasResuelta = ccl.quejas.filter(q => q.estado === 'RESUELTA').length;
    const quejasEnTramite = ccl.quejas.filter(q => ['RECIBIDA', 'EN_TRAMITE', 'EN_CONCILIACION'].includes(q.estado)).length;

    // Quejas por tipo de acoso
    const porTipoAcoso = {};
    ccl.quejas.forEach(q => {
      porTipoAcoso[q.tipoAcoso] = (porTipoAcoso[q.tipoAcoso] || 0) + 1;
    });

    return {
      periodo: ccl.periodo,
      reuniones: {
        total: ccl.reuniones.length,
        realizadas: ccl.reuniones.filter(r => r.estado === 'REALIZADA').length,
      },
      quejas: {
        total: ccl.quejas.length,
        resueltas: quejasResuelta,
        enTramite: quejasEnTramite,
        porTipo: porTipoAcoso,
      },
    };
  }
}

module.exports = new ComiteConvivenciaService();
