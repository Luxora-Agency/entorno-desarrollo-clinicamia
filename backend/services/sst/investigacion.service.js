/**
 * Servicio de Investigacion de Accidentes
 * Gestion de investigaciones segun Resolucion 1401/2007
 * Incluye analisis causal, medidas de control y seguimiento
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class InvestigacionService {
  /**
   * Listar investigaciones con filtros
   */
  async findAll({ page = 1, limit = 20, estado, desde, hasta }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) where.estado = estado;

    if (desde || hasta) {
      where.fechaInvestigacion = {};
      if (desde) where.fechaInvestigacion.gte = new Date(desde);
      if (hasta) where.fechaInvestigacion.lte = new Date(hasta);
    }

    const [investigaciones, total] = await Promise.all([
      prisma.sSTInvestigacionAccidente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaInvestigacion: 'desc' },
        include: {
          accidente: {
            include: {
              empleado: {
                select: { id: true, nombre: true, apellido: true },
              },
            },
          },
          investigadorPrincipal: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { medidasControl: true, miembros: true },
          },
        },
      }),
      prisma.sSTInvestigacionAccidente.count({ where }),
    ]);

    return {
      data: investigaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener investigacion por ID
   */
  async findById(id) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id },
      include: {
        accidente: {
          include: {
            empleado: {
              include: {
                cargo: true,
                contratos: { where: { estado: 'ACTIVO' }, take: 1 },
              },
            },
            testigos: {
              include: {
                empleado: {
                  select: { id: true, nombre: true, apellido: true },
                },
              },
            },
          },
        },
        investigadorPrincipal: {
          select: { id: true, nombre: true, apellido: true, cargo: { select: { nombre: true } } },
        },
        miembros: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellido: true, cargo: { select: { nombre: true } } },
            },
          },
        },
        medidasControl: {
          include: {
            responsable: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
          orderBy: { fechaImplementacion: 'asc' },
        },
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    return investigacion;
  }

  /**
   * Iniciar investigacion de accidente
   */
  async create(data) {
    // Validar que el accidente existe
    const accidente = await prisma.sSTAccidenteTrabajo.findUnique({
      where: { id: data.accidenteId },
      include: { investigacion: true },
    });

    if (!accidente) {
      throw new NotFoundError('Accidente no encontrado');
    }

    if (accidente.investigacion) {
      throw new ValidationError('El accidente ya tiene una investigacion asociada');
    }

    // Validar investigador principal
    const investigador = await prisma.tHEmpleado.findUnique({
      where: { id: data.investigadorPrincipalId },
    });

    if (!investigador) {
      throw new ValidationError('Investigador principal no encontrado');
    }

    // Crear investigacion y actualizar estado del accidente
    const investigacion = await prisma.$transaction(async (tx) => {
      const inv = await tx.sSTInvestigacionAccidente.create({
        data: {
          accidenteId: data.accidenteId,
          fechaInvestigacion: new Date(data.fechaInvestigacion),
          investigadorPrincipalId: data.investigadorPrincipalId,
          estado: 'EN_PROCESO',
        },
        include: {
          accidente: {
            select: { id: true },
          },
          investigadorPrincipal: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
      });

      // Cambiar estado del accidente a EN_INVESTIGACION
      await tx.sSTAccidenteTrabajo.update({
        where: { id: data.accidenteId },
        data: { estado: 'EN_INVESTIGACION' },
      });

      return inv;
    });

    return investigacion;
  }

  /**
   * Actualizar investigacion
   */
  async update(id, data) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    if (investigacion.estado === 'CERRADA') {
      throw new ValidationError('No se puede editar una investigacion cerrada');
    }

    const updated = await prisma.sSTInvestigacionAccidente.update({
      where: { id },
      data: {
        descripcionEvento: data.descripcionEvento,
        condicionesAmbientales: data.condicionesAmbientales,
        equiposInvolucrados: data.equiposInvolucrados,
        epiUsados: data.epiUsados,
        epiRequeridos: data.epiRequeridos,
        // Analisis causal - Metodologia arbol de causas
        causasInmediatas: data.causasInmediatas,
        causasBasicas: data.causasBasicas,
        factoresPersonales: data.factoresPersonales,
        factoresTrabajo: data.factoresTrabajo,
        // Conclusiones
        conclusiones: data.conclusiones,
        leccionesAprendidas: data.leccionesAprendidas,
        recomendaciones: data.recomendaciones,
        necesitaReporteARL: data.necesitaReporteARL,
      },
    });

    return updated;
  }

  /**
   * Agregar miembro al equipo investigador
   */
  async agregarMiembro(investigacionId, data) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id: investigacionId },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    // Verificar que el empleado no sea ya miembro
    const existe = await prisma.sSTMiembroInvestigacion.findUnique({
      where: {
        investigacionId_empleadoId: {
          investigacionId,
          empleadoId: data.empleadoId,
        },
      },
    });

    if (existe) {
      throw new ValidationError('El empleado ya es miembro del equipo investigador');
    }

    const miembro = await prisma.sSTMiembroInvestigacion.create({
      data: {
        investigacionId,
        empleadoId: data.empleadoId,
        rol: data.rol,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, cargo: { select: { nombre: true } } },
        },
      },
    });

    return miembro;
  }

  /**
   * Eliminar miembro del equipo
   */
  async eliminarMiembro(investigacionId, empleadoId) {
    const deleted = await prisma.sSTMiembroInvestigacion.delete({
      where: {
        investigacionId_empleadoId: {
          investigacionId,
          empleadoId,
        },
      },
    });

    return deleted;
  }

  /**
   * Agregar medida de control
   */
  async agregarMedidaControl(investigacionId, data) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id: investigacionId },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    const medida = await prisma.sSTMedidaControlAccidente.create({
      data: {
        investigacionId,
        descripcion: data.descripcion,
        tipoControl: data.tipoControl,
        responsableId: data.responsableId,
        fechaImplementacion: new Date(data.fechaImplementacion),
        estado: 'PENDIENTE',
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
   * Actualizar estado de medida de control
   */
  async actualizarMedidaControl(medidaId, data) {
    const medida = await prisma.sSTMedidaControlAccidente.findUnique({
      where: { id: medidaId },
    });

    if (!medida) {
      throw new NotFoundError('Medida de control no encontrada');
    }

    const updated = await prisma.sSTMedidaControlAccidente.update({
      where: { id: medidaId },
      data: {
        estado: data.estado,
        fechaCumplimiento: data.fechaCumplimiento ? new Date(data.fechaCumplimiento) : null,
        evidenciaUrl: data.evidenciaUrl,
      },
    });

    return updated;
  }

  /**
   * Agregar documento a investigacion
   */
  async agregarDocumento(investigacionId, data) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id: investigacionId },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    const documento = await prisma.sSTDocumentoInvestigacion.create({
      data: {
        investigacionId,
        nombre: data.nombre,
        tipo: data.tipo,
        url: data.url,
        descripcion: data.descripcion,
      },
    });

    return documento;
  }

  /**
   * Completar investigacion
   */
  async completar(id) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id },
      include: {
        medidasControl: true,
      },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    // Validar que tenga los campos requeridos
    if (!investigacion.causasInmediatas || !investigacion.causasBasicas) {
      throw new ValidationError('Debe completar el analisis causal antes de cerrar');
    }

    if (!investigacion.conclusiones) {
      throw new ValidationError('Debe agregar conclusiones antes de cerrar');
    }

    if (investigacion.medidasControl.length === 0) {
      throw new ValidationError('Debe agregar al menos una medida de control');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.sSTInvestigacionAccidente.update({
        where: { id },
        data: {
          estado: 'COMPLETADA',
          fechaCierre: new Date(),
        },
      });

      return inv;
    });

    return updated;
  }

  /**
   * Cerrar investigacion (despues de verificar medidas)
   */
  async cerrar(id) {
    const investigacion = await prisma.sSTInvestigacionAccidente.findUnique({
      where: { id },
      include: {
        medidasControl: true,
        accidente: true,
      },
    });

    if (!investigacion) {
      throw new NotFoundError('Investigacion no encontrada');
    }

    if (investigacion.estado !== 'COMPLETADA') {
      throw new ValidationError('La investigacion debe estar completada para cerrarla');
    }

    // Verificar que todas las medidas esten implementadas o verificadas
    const medidasPendientes = investigacion.medidasControl.filter(
      m => m.estado === 'PENDIENTE' || m.estado === 'EN_PROCESO'
    );

    if (medidasPendientes.length > 0) {
      throw new ValidationError(`Hay ${medidasPendientes.length} medidas pendientes de implementar`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.sSTInvestigacionAccidente.update({
        where: { id },
        data: { estado: 'CERRADA' },
      });

      // Cerrar el accidente
      await tx.sSTAccidenteTrabajo.update({
        where: { id: investigacion.accidenteId },
        data: { estado: 'CERRADO' },
      });

      return inv;
    });

    return updated;
  }

  /**
   * Obtener investigaciones con medidas vencidas
   */
  async getMedidasVencidas() {
    const hoy = new Date();

    return prisma.sSTMedidaControlAccidente.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
        fechaImplementacion: { lt: hoy },
      },
      include: {
        investigacion: {
          include: {
            accidente: {
              include: {
                empleado: {
                  select: { id: true, nombre: true, apellido: true },
                },
              },
            },
          },
        },
        responsable: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaImplementacion: 'asc' },
    });
  }

  /**
   * Obtener estadisticas de investigaciones
   */
  async getEstadisticas({ anio }) {
    const fechaInicio = new Date(anio, 0, 1);
    const fechaFin = new Date(anio, 11, 31);

    const where = {
      fechaInvestigacion: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [
      total,
      porEstado,
      medidasPorTipo,
      tiempoPromedioInvestigacion,
    ] = await Promise.all([
      prisma.sSTInvestigacionAccidente.count({ where }),
      prisma.sSTInvestigacionAccidente.groupBy({
        by: ['estado'],
        where,
        _count: true,
      }),
      prisma.sSTMedidaControlAccidente.groupBy({
        by: ['tipoControl'],
        where: {
          investigacion: { fechaInvestigacion: { gte: fechaInicio, lte: fechaFin } },
        },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (fecha_cierre - fecha_investigacion))) as promedio_dias
        FROM sst_investigaciones_accidente
        WHERE fecha_cierre IS NOT NULL
        AND fecha_investigacion >= ${fechaInicio}
        AND fecha_investigacion <= ${fechaFin}
      `,
    ]);

    return {
      anio,
      totalInvestigaciones: total,
      porEstado: porEstado.map(e => ({ estado: e.estado, cantidad: e._count })),
      medidasPorTipo: medidasPorTipo.map(m => ({ tipo: m.tipoControl, cantidad: m._count })),
      tiempoPromedioInvestigacion: tiempoPromedioInvestigacion[0]?.promedio_dias || 0,
    };
  }
}

module.exports = new InvestigacionService();
