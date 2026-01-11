/**
 * Servicio de Matriz IPVR (Identificacion de Peligros y Valoracion de Riesgos)
 * Metodologia GTC 45 para gestion de riesgos laborales
 * Normativa: Decreto 1072/2015, GTC 45
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class MatrizIPVRService {
  /**
   * Listar matrices IPVR
   */
  async findAll({ page = 1, limit = 20, estado, area }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;
    if (area) where.area = { contains: area, mode: 'insensitive' };

    const [matrices, total] = await Promise.all([
      prisma.sSTMatrizIPVR.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaElaboracion: 'desc' },
        include: {
          _count: {
            select: { peligros: true },
          },
        },
      }),
      prisma.sSTMatrizIPVR.count({ where }),
    ]);

    return {
      data: matrices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener matriz vigente
   */
  async getVigente() {
    const matriz = await prisma.sSTMatrizIPVR.findFirst({
      where: { estado: 'VIGENTE' },
      include: {
        peligros: {
          include: {
            valoraciones: {
              orderBy: { fechaValoracion: 'desc' },
              take: 1,
            },
            medidas: true,
          },
        },
      },
    });

    return matriz;
  }

  /**
   * Obtener matriz por ID con peligros y valoraciones
   */
  async findById(id) {
    const matriz = await prisma.sSTMatrizIPVR.findUnique({
      where: { id },
      include: {
        peligros: {
          include: {
            valoraciones: {
              orderBy: { fechaValoracion: 'desc' },
            },
            medidas: {
              include: {
                responsable: {
                  select: { id: true, nombre: true, apellido: true },
                },
              },
            },
          },
        },
      },
    });

    if (!matriz) {
      throw new NotFoundError('Matriz IPVR no encontrada');
    }

    return matriz;
  }

  /**
   * Crear nueva matriz IPVR
   */
  async create(data) {
    // Si hay otra matriz vigente, ponerla en revision
    if (data.estado === 'VIGENTE') {
      await prisma.sSTMatrizIPVR.updateMany({
        where: { estado: 'VIGENTE' },
        data: { estado: 'EN_REVISION' },
      });
    }

    const matriz = await prisma.sSTMatrizIPVR.create({
      data: {
        version: data.version,
        fechaElaboracion: new Date(data.fechaElaboracion),
        fechaRevision: data.fechaRevision ? new Date(data.fechaRevision) : null,
        area: data.area,
        proceso: data.proceso,
        actividad: data.actividad,
        tareaRutinaria: data.tareaRutinaria,
        estado: data.estado || 'BORRADOR',
        elaboradoPor: data.elaboradoPor,
        revisadoPor: data.revisadoPor,
        aprobadoPor: data.aprobadoPor,
      },
    });

    return matriz;
  }

  /**
   * Actualizar matriz
   */
  async update(id, data) {
    const matriz = await prisma.sSTMatrizIPVR.findUnique({
      where: { id },
    });

    if (!matriz) {
      throw new NotFoundError('Matriz IPVR no encontrada');
    }

    // Si se pone como vigente, poner las demas en revision
    if (data.estado === 'VIGENTE' && matriz.estado !== 'VIGENTE') {
      await prisma.sSTMatrizIPVR.updateMany({
        where: { estado: 'VIGENTE', id: { not: id } },
        data: { estado: 'EN_REVISION' },
      });
    }

    const updated = await prisma.sSTMatrizIPVR.update({
      where: { id },
      data: {
        ...data,
        fechaElaboracion: data.fechaElaboracion ? new Date(data.fechaElaboracion) : undefined,
        fechaRevision: data.fechaRevision ? new Date(data.fechaRevision) : undefined,
      },
    });

    return updated;
  }

  /**
   * Agregar peligro a la matriz
   */
  async agregarPeligro(matrizId, data) {
    const matriz = await prisma.sSTMatrizIPVR.findUnique({
      where: { id: matrizId },
    });

    if (!matriz) {
      throw new NotFoundError('Matriz IPVR no encontrada');
    }

    const peligro = await prisma.sSTPeligro.create({
      data: {
        matrizId,
        clasificacion: data.clasificacion,
        descripcion: data.descripcion,
        fuenteGeneradora: data.fuenteGeneradora,
        efectosPosibles: data.efectosPosibles,
        controlesExistentes: data.controlesExistentes,
        tipoControl: data.tipoControl,
        trabajadoresExpuestos: data.trabajadoresExpuestos,
        tiempoExposicion: data.tiempoExposicion,
        zona: data.zona,
        cargo: data.cargo,
      },
    });

    return peligro;
  }

  /**
   * Actualizar peligro
   */
  async actualizarPeligro(peligroId, data) {
    const peligro = await prisma.sSTPeligro.findUnique({
      where: { id: peligroId },
    });

    if (!peligro) {
      throw new NotFoundError('Peligro no encontrado');
    }

    const updated = await prisma.sSTPeligro.update({
      where: { id: peligroId },
      data,
    });

    return updated;
  }

  /**
   * Eliminar peligro
   */
  async eliminarPeligro(peligroId) {
    const peligro = await prisma.sSTPeligro.findUnique({
      where: { id: peligroId },
      include: { valoraciones: true, medidas: true },
    });

    if (!peligro) {
      throw new NotFoundError('Peligro no encontrado');
    }

    // Eliminar valoraciones y medidas asociadas
    await prisma.$transaction([
      prisma.sSTValoracionRiesgo.deleteMany({ where: { peligroId } }),
      prisma.sSTMedidaIntervencion.deleteMany({ where: { peligroId } }),
      prisma.sSTPeligro.delete({ where: { id: peligroId } }),
    ]);

    return { message: 'Peligro eliminado correctamente' };
  }

  /**
   * Agregar valoracion de riesgo (Metodologia GTC 45)
   */
  async agregarValoracion(peligroId, data) {
    const peligro = await prisma.sSTPeligro.findUnique({
      where: { id: peligroId },
    });

    if (!peligro) {
      throw new NotFoundError('Peligro no encontrado');
    }

    // Calcular Nivel de Riesgo segun GTC 45
    // NR = NP x NC donde NP = ND x NE
    const nivelDeficiencia = data.nivelDeficiencia; // ND: 10, 6, 2, 0
    const nivelExposicion = data.nivelExposicion; // NE: 4, 3, 2, 1
    const nivelConsecuencia = data.nivelConsecuencia; // NC: 100, 60, 25, 10

    const nivelProbabilidad = nivelDeficiencia * nivelExposicion; // NP
    const nivelRiesgo = nivelProbabilidad * nivelConsecuencia; // NR

    // Determinar interpretacion del NR
    let interpretacionNR;
    let aceptabilidadRiesgo;

    if (nivelRiesgo >= 600) {
      interpretacionNR = 'I';
      aceptabilidadRiesgo = 'NO_ACEPTABLE';
    } else if (nivelRiesgo >= 150) {
      interpretacionNR = 'II';
      aceptabilidadRiesgo = 'NO_ACEPTABLE_CON_CONTROL';
    } else if (nivelRiesgo >= 40) {
      interpretacionNR = 'III';
      aceptabilidadRiesgo = 'MEJORABLE';
    } else {
      interpretacionNR = 'IV';
      aceptabilidadRiesgo = 'ACEPTABLE';
    }

    const valoracion = await prisma.sSTValoracionRiesgo.create({
      data: {
        peligroId,
        fechaValoracion: new Date(),
        nivelDeficiencia,
        nivelExposicion,
        nivelProbabilidad,
        nivelConsecuencia,
        nivelRiesgo,
        interpretacionNR,
        aceptabilidadRiesgo,
        observaciones: data.observaciones,
      },
    });

    return valoracion;
  }

  /**
   * Agregar medida de intervencion
   */
  async agregarMedida(peligroId, data) {
    const peligro = await prisma.sSTPeligro.findUnique({
      where: { id: peligroId },
    });

    if (!peligro) {
      throw new NotFoundError('Peligro no encontrado');
    }

    // Validar responsable
    if (data.responsableId) {
      const responsable = await prisma.tHEmpleado.findUnique({
        where: { id: data.responsableId },
      });
      if (!responsable) {
        throw new ValidationError('Responsable no encontrado');
      }
    }

    const medida = await prisma.sSTMedidaIntervencion.create({
      data: {
        peligroId,
        tipoMedida: data.tipoMedida, // ELIMINACION, SUSTITUCION, CONTROLES_INGENIERIA, CONTROLES_ADMIN, EPP
        descripcion: data.descripcion,
        responsableId: data.responsableId,
        fechaProgramada: new Date(data.fechaProgramada),
        estado: 'PENDIENTE',
        recursos: data.recursos,
        indicadorEficacia: data.indicadorEficacia,
      },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return medida;
  }

  /**
   * Actualizar estado de medida
   */
  async actualizarMedida(medidaId, data) {
    const medida = await prisma.sSTMedidaIntervencion.findUnique({
      where: { id: medidaId },
    });

    if (!medida) {
      throw new NotFoundError('Medida de intervencion no encontrada');
    }

    const updated = await prisma.sSTMedidaIntervencion.update({
      where: { id: medidaId },
      data: {
        estado: data.estado,
        fechaImplementacion: data.fechaImplementacion ? new Date(data.fechaImplementacion) : null,
        evidencia: data.evidencia,
        resultadoEficacia: data.resultadoEficacia,
      },
    });

    return updated;
  }

  /**
   * Obtener resumen de riesgos por nivel
   */
  async getResumenRiesgos() {
    const matriz = await this.getVigente();

    if (!matriz) {
      return { mensaje: 'No hay matriz vigente' };
    }

    // Contar peligros por nivel de riesgo
    const resumen = {
      total: matriz.peligros.length,
      porNivel: {
        I: 0, // No aceptable
        II: 0, // No aceptable con control especifico
        III: 0, // Mejorable
        IV: 0, // Aceptable
      },
      porClasificacion: {},
      medidasPendientes: 0,
    };

    matriz.peligros.forEach(peligro => {
      // Contar por nivel (ultima valoracion)
      if (peligro.valoraciones.length > 0) {
        const ultimaVal = peligro.valoraciones[0];
        resumen.porNivel[ultimaVal.interpretacionNR]++;
      }

      // Contar por clasificacion
      if (!resumen.porClasificacion[peligro.clasificacion]) {
        resumen.porClasificacion[peligro.clasificacion] = 0;
      }
      resumen.porClasificacion[peligro.clasificacion]++;

      // Contar medidas pendientes
      peligro.medidas.forEach(m => {
        if (m.estado === 'PENDIENTE' || m.estado === 'EN_PROCESO') {
          resumen.medidasPendientes++;
        }
      });
    });

    return resumen;
  }

  /**
   * Obtener factores de riesgo del catalogo
   */
  async getFactoresRiesgo() {
    return prisma.sSTFactorRiesgo.findMany({
      where: { activo: true },
      orderBy: [{ clasificacion: 'asc' }, { nombre: 'asc' }],
    });
  }
}

module.exports = new MatrizIPVRService();
