/**
 * Servicio de COPASST (Comite Paritario de Seguridad y Salud en el Trabajo)
 * Gestiona conformacion, reuniones y seguimiento
 * Normativa: Resolucion 2013/1986, Decreto 1072/2015
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CopasstService {
  /**
   * Listar periodos de COPASST
   */
  async findAll({ page = 1, limit = 10, estado }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;

    const [copassts, total] = await Promise.all([
      prisma.sSTCopasst.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaConformacion: 'desc' },
        include: {
          _count: {
            select: { integrantes: true, reuniones: true },
          },
        },
      }),
      prisma.sSTCopasst.count({ where }),
    ]);

    return {
      data: copassts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener COPASST vigente
   */
  async getVigente() {
    const copasst = await prisma.sSTCopasst.findFirst({
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
      },
    });

    return copasst;
  }

  /**
   * Obtener COPASST por ID
   */
  async findById(id) {
    const copasst = await prisma.sSTCopasst.findUnique({
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
          include: {
            _count: {
              select: { asistentes: true, compromisos: true },
            },
          },
        },
      },
    });

    if (!copasst) {
      throw new NotFoundError('COPASST no encontrado');
    }

    return copasst;
  }

  /**
   * Crear nuevo periodo de COPASST
   */
  async create(data) {
    // Verificar si hay uno vigente
    const vigente = await prisma.sSTCopasst.findFirst({
      where: { estado: 'VIGENTE' },
    });

    if (vigente) {
      throw new ValidationError('Ya existe un COPASST vigente. Debe vencer o cancelar el actual primero.');
    }

    const copasst = await prisma.sSTCopasst.create({
      data: {
        periodo: data.periodo,
        fechaConformacion: new Date(data.fechaConformacion),
        fechaVencimiento: new Date(data.fechaVencimiento),
        resolucionConformacion: data.resolucionConformacion,
        estado: 'VIGENTE',
        observaciones: data.observaciones,
      },
    });

    return copasst;
  }

  /**
   * Actualizar COPASST
   */
  async update(id, data) {
    const copasst = await prisma.sSTCopasst.findUnique({
      where: { id },
    });

    if (!copasst) {
      throw new NotFoundError('COPASST no encontrado');
    }

    const updated = await prisma.sSTCopasst.update({
      where: { id },
      data: {
        ...data,
        fechaConformacion: data.fechaConformacion ? new Date(data.fechaConformacion) : undefined,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
      },
    });

    return updated;
  }

  /**
   * Agregar integrante al COPASST
   */
  async agregarIntegrante(copasstId, data) {
    const copasst = await prisma.sSTCopasst.findUnique({
      where: { id: copasstId },
    });

    if (!copasst) {
      throw new NotFoundError('COPASST no encontrado');
    }

    // Validar empleado
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    // Verificar que no sea ya integrante
    const existe = await prisma.sSTCopasstIntegrante.findUnique({
      where: {
        copasstId_empleadoId: {
          copasstId,
          empleadoId: data.empleadoId,
        },
      },
    });

    if (existe) {
      throw new ValidationError('El empleado ya es integrante del COPASST');
    }

    const integrante = await prisma.sSTCopasstIntegrante.create({
      data: {
        copasstId,
        empleadoId: data.empleadoId,
        rol: data.rol, // PRESIDENTE, SECRETARIO, REPRESENTANTE_EMPLEADOR, REPRESENTANTE_TRABAJADORES
        tipo: data.tipo, // PRINCIPAL, SUPLENTE
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
   * Remover integrante
   */
  async removerIntegrante(copasstId, empleadoId, motivoRetiro) {
    const integrante = await prisma.sSTCopasstIntegrante.findUnique({
      where: {
        copasstId_empleadoId: { copasstId, empleadoId },
      },
    });

    if (!integrante) {
      throw new NotFoundError('Integrante no encontrado');
    }

    const updated = await prisma.sSTCopasstIntegrante.update({
      where: {
        copasstId_empleadoId: { copasstId, empleadoId },
      },
      data: {
        fechaRetiro: new Date(),
        motivoRetiro,
        activo: false,
      },
    });

    return updated;
  }

  /**
   * Crear reunion
   */
  async crearReunion(copasstId, data) {
    const copasst = await prisma.sSTCopasst.findUnique({
      where: { id: copasstId },
    });

    if (!copasst) {
      throw new NotFoundError('COPASST no encontrado');
    }

    // Obtener numero de reunion
    const reunionesCount = await prisma.sSTCopasstReunion.count({
      where: { copasstId },
    });

    const reunion = await prisma.sSTCopasstReunion.create({
      data: {
        copasstId,
        numeroReunion: reunionesCount + 1,
        tipoReunion: data.tipoReunion, // ORDINARIA, EXTRAORDINARIA
        fechaReunion: new Date(data.fechaReunion),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        lugar: data.lugar,
        ordenDia: data.ordenDia,
        estado: 'PROGRAMADA',
      },
    });

    return reunion;
  }

  /**
   * Obtener reunion por ID
   */
  async getReunion(reunionId) {
    const reunion = await prisma.sSTCopasstReunion.findUnique({
      where: { id: reunionId },
      include: {
        copasst: true,
        asistentes: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        compromisos: {
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!reunion) {
      throw new NotFoundError('Reunion no encontrada');
    }

    return reunion;
  }

  /**
   * Actualizar reunion (desarrollar acta)
   */
  async actualizarReunion(reunionId, data) {
    const reunion = await prisma.sSTCopasstReunion.findUnique({
      where: { id: reunionId },
    });

    if (!reunion) {
      throw new NotFoundError('Reunion no encontrada');
    }

    const updated = await prisma.sSTCopasstReunion.update({
      where: { id: reunionId },
      data: {
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        temasDesarrollados: data.temasDesarrollados,
        conclusiones: data.conclusiones,
        observaciones: data.observaciones,
        estado: data.estado,
        urlActa: data.urlActa,
      },
    });

    return updated;
  }

  /**
   * Registrar asistencia a reunion
   */
  async registrarAsistencia(reunionId, data) {
    const reunion = await prisma.sSTCopasstReunion.findUnique({
      where: { id: reunionId },
    });

    if (!reunion) {
      throw new NotFoundError('Reunion no encontrada');
    }

    const asistente = await prisma.sSTAsistenteReunion.create({
      data: {
        reunionId,
        empleadoId: data.empleadoId,
        asistio: data.asistio,
        justificacion: data.justificacion,
        horaLlegada: data.horaLlegada,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return asistente;
  }

  /**
   * Agregar compromiso a reunion
   */
  async agregarCompromiso(reunionId, data) {
    const reunion = await prisma.sSTCopasstReunion.findUnique({
      where: { id: reunionId },
    });

    if (!reunion) {
      throw new NotFoundError('Reunion no encontrada');
    }

    const compromiso = await prisma.sSTCompromisoReunion.create({
      data: {
        reunionId,
        descripcion: data.descripcion,
        responsableId: data.responsableId,
        fechaCompromiso: new Date(data.fechaCompromiso),
        estado: 'PENDIENTE',
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return compromiso;
  }

  /**
   * Actualizar estado de compromiso
   */
  async actualizarCompromiso(compromisoId, data) {
    const compromiso = await prisma.sSTCompromisoReunion.findUnique({
      where: { id: compromisoId },
    });

    if (!compromiso) {
      throw new NotFoundError('Compromiso no encontrado');
    }

    const updated = await prisma.sSTCompromisoReunion.update({
      where: { id: compromisoId },
      data: {
        estado: data.estado,
        fechaCumplimiento: data.fechaCumplimiento ? new Date(data.fechaCumplimiento) : null,
        observaciones: data.observaciones,
        evidencia: data.evidencia,
      },
    });

    return updated;
  }

  /**
   * Obtener compromisos pendientes
   */
  async getCompromisosPendientes() {
    return prisma.sSTCompromisoReunion.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
      },
      include: {
        reunion: {
          select: { numeroReunion: true, fechaReunion: true },
        },
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaCompromiso: 'asc' },
    });
  }

  /**
   * Obtener estadisticas del COPASST
   */
  async getEstadisticas(copasstId) {
    const copasst = await prisma.sSTCopasst.findUnique({
      where: { id: copasstId },
      include: {
        reuniones: {
          include: {
            asistentes: true,
            compromisos: true,
          },
        },
        integrantes: {
          where: { activo: true },
        },
      },
    });

    if (!copasst) {
      throw new NotFoundError('COPASST no encontrado');
    }

    const totalReuniones = copasst.reuniones.length;
    const reunionesRealizadas = copasst.reuniones.filter(r => r.estado === 'REALIZADA').length;

    // Calcular porcentaje de asistencia
    let totalAsistencias = 0;
    let totalEsperados = 0;
    copasst.reuniones.forEach(r => {
      totalAsistencias += r.asistentes.filter(a => a.asistio).length;
      totalEsperados += copasst.integrantes.length;
    });

    // Contar compromisos
    let compromisosPendientes = 0;
    let compromisosCompletados = 0;
    copasst.reuniones.forEach(r => {
      r.compromisos.forEach(c => {
        if (c.estado === 'CUMPLIDO') compromisosCompletados++;
        else compromisosPendientes++;
      });
    });

    return {
      periodo: copasst.periodo,
      totalIntegrantes: copasst.integrantes.length,
      reuniones: {
        programadas: totalReuniones,
        realizadas: reunionesRealizadas,
        cumplimiento: totalReuniones > 0 ? (reunionesRealizadas / totalReuniones) * 100 : 0,
      },
      asistencia: {
        total: totalAsistencias,
        esperados: totalEsperados,
        porcentaje: totalEsperados > 0 ? (totalAsistencias / totalEsperados) * 100 : 0,
      },
      compromisos: {
        pendientes: compromisosPendientes,
        completados: compromisosCompletados,
        cumplimiento: (compromisosPendientes + compromisosCompletados) > 0
          ? (compromisosCompletados / (compromisosPendientes + compromisosCompletados)) * 100
          : 0,
      },
    };
  }
}

module.exports = new CopasstService();
