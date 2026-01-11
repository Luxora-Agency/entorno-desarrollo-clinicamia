const prisma = require('../../db/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_CAMPOS = [
  'programadoEne', 'programadoFeb', 'programadoMar', 'programadoAbr',
  'programadoMay', 'programadoJun', 'programadoJul', 'programadoAgo',
  'programadoSep', 'programadoOct', 'programadoNov', 'programadoDic'
];

class CapacitacionService {
  async findAll(query = {}) {
    const { anio, categoriaId, estado, activo = true, page = 1, limit = 50, search } = query;

    const where = {};
    if (anio) where.anio = parseInt(anio);
    if (categoriaId) where.categoriaId = categoriaId;
    if (estado) where.estado = estado;
    if (activo !== undefined) where.activo = activo === 'true' || activo === true;
    if (search) {
      where.OR = [
        { tema: { contains: search, mode: 'insensitive' } },
        { actividad: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [capacitaciones, total] = await Promise.all([
      prisma.capacitacion.findMany({
        where,
        include: {
          categoria: { select: { id: true, nombre: true, color: true } },
          responsable: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { sesiones: true, evaluaciones: true } }
        },
        orderBy: [{ categoria: { orden: 'asc' } }, { tema: 'asc' }],
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.capacitacion.count({ where })
    ]);

    return {
      capacitaciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCronogramaAnual(anio) {
    const capacitaciones = await prisma.capacitacion.findMany({
      where: { anio: parseInt(anio), activo: true },
      include: {
        categoria: { select: { id: true, nombre: true, color: true, orden: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
        carpetaMaterial: { select: { id: true, nombre: true } },
        sesiones: {
          include: {
            acta: { select: { id: true, numero: true } },
            _count: { select: { asistentes: true } }
          },
          orderBy: { fechaProgramada: 'desc' }
        },
        _count: { select: { sesiones: true } }
      },
      orderBy: [{ categoria: { orden: 'asc' } }, { tema: 'asc' }]
    });

    // Group by category
    const categorias = {};
    let numeroGlobal = 1;

    capacitaciones.forEach(cap => {
      const catId = cap.categoria.id;
      if (!categorias[catId]) {
        categorias[catId] = {
          id: catId,
          nombre: cap.categoria.nombre,
          color: cap.categoria.color,
          orden: cap.categoria.orden,
          capacitaciones: []
        };
      }

      // Get status for each month based on sessions
      const mesesEstado = MESES_CAMPOS.map((campo, index) => {
        if (!cap[campo]) return null;

        // Check if there's a completed session for this month
        const sesionMes = cap.sesiones.find(s => {
          const fecha = new Date(s.fechaProgramada);
          return fecha.getMonth() === index;
        });

        if (sesionMes) {
          return sesionMes.estado;
        }
        return 'PROGRAMADA';
      });

      // Count total participants across all sessions
      const totalParticipantes = cap.sesiones.reduce(
        (sum, s) => sum + (s._count.asistentes || 0), 0
      );

      // Get last acta
      const ultimaActa = cap.sesiones.find(s => s.acta)?.acta || null;

      categorias[catId].capacitaciones.push({
        numero: numeroGlobal++,
        id: cap.id,
        tema: cap.tema,
        actividad: cap.actividad,
        responsable: cap.responsable
          ? `${cap.responsable.nombre} ${cap.responsable.apellido}`
          : null,
        meses: mesesEstado,
        participantes: totalParticipantes,
        periodicidad: cap.periodicidad,
        carpetaMaterial: cap.carpetaMaterial,
        ultimaActa,
        estado: cap.estado,
        sesionesCount: cap._count.sesiones
      });
    });

    // Convert to array and sort
    const resultado = Object.values(categorias).sort((a, b) => a.orden - b.orden);

    return {
      anio: parseInt(anio),
      meses: MESES,
      categorias: resultado,
      totalCapacitaciones: capacitaciones.length
    };
  }

  async findById(id) {
    const capacitacion = await prisma.capacitacion.findUnique({
      where: { id },
      include: {
        categoria: true,
        responsable: { select: { id: true, nombre: true, apellido: true, email: true } },
        carpetaMaterial: {
          include: {
            documentos: {
              where: { activo: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        sesiones: {
          include: {
            acta: { select: { id: true, numero: true } },
            _count: { select: { asistentes: true, respuestasEvaluacion: true } }
          },
          orderBy: { fechaProgramada: 'desc' }
        },
        evaluaciones: {
          where: { activo: true },
          include: {
            _count: { select: { preguntas: true } }
          }
        }
      }
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitación no encontrada');
    }

    return capacitacion;
  }

  async create(data, userId) {
    // Validate at least one month is selected
    const mesesSeleccionados = MESES_CAMPOS.filter(campo => data[campo] === true);
    if (mesesSeleccionados.length === 0) {
      throw new ValidationError('Debe seleccionar al menos un mes');
    }

    // Validate category exists
    const categoria = await prisma.categoriaCapacitacion.findUnique({
      where: { id: data.categoriaId }
    });
    if (!categoria) {
      throw new ValidationError('Categoría no encontrada');
    }

    // Create material folder if needed
    let carpetaMaterialId = data.carpetaMaterialId;
    if (!carpetaMaterialId) {
      const carpeta = await prisma.carpetaCalidad2.create({
        data: {
          nombre: `Material: ${data.tema}`,
          tipo: 'CAPACIDAD',
          descripcion: `Materiales para capacitación: ${data.tema}`
        }
      });
      carpetaMaterialId = carpeta.id;
    }

    return prisma.capacitacion.create({
      data: {
        ...data,
        carpetaMaterialId,
        creadoPor: userId
      },
      include: {
        categoria: true,
        responsable: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  async update(id, data) {
    const existing = await prisma.capacitacion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Capacitación no encontrada');
    }

    // Validate months if updating
    if (MESES_CAMPOS.some(campo => data[campo] !== undefined)) {
      const mesesSeleccionados = MESES_CAMPOS.filter(campo =>
        data[campo] !== undefined ? data[campo] === true : existing[campo]
      );
      if (mesesSeleccionados.length === 0) {
        throw new ValidationError('Debe seleccionar al menos un mes');
      }
    }

    return prisma.capacitacion.update({
      where: { id },
      data,
      include: {
        categoria: true,
        responsable: { select: { id: true, nombre: true, apellido: true } }
      }
    });
  }

  async delete(id) {
    const existing = await prisma.capacitacion.findUnique({
      where: { id },
      include: { _count: { select: { sesiones: true } } }
    });

    if (!existing) {
      throw new NotFoundError('Capacitación no encontrada');
    }

    // Soft delete
    return prisma.capacitacion.update({
      where: { id },
      data: { activo: false }
    });
  }

  async getMateriales(id) {
    const capacitacion = await prisma.capacitacion.findUnique({
      where: { id },
      include: {
        carpetaMaterial: {
          include: {
            documentos: {
              where: { activo: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!capacitacion) {
      throw new NotFoundError('Capacitación no encontrada');
    }

    return capacitacion.carpetaMaterial?.documentos || [];
  }

  async getStats(anio) {
    const where = anio ? { anio: parseInt(anio) } : {};

    const [total, porEstado, porCategoria] = await Promise.all([
      prisma.capacitacion.count({ where: { ...where, activo: true } }),
      prisma.capacitacion.groupBy({
        by: ['estado'],
        where: { ...where, activo: true },
        _count: true
      }),
      prisma.capacitacion.groupBy({
        by: ['categoriaId'],
        where: { ...where, activo: true },
        _count: true
      })
    ]);

    // Get category names
    const categoriaIds = porCategoria.map(c => c.categoriaId);
    const categorias = await prisma.categoriaCapacitacion.findMany({
      where: { id: { in: categoriaIds } },
      select: { id: true, nombre: true, color: true }
    });

    const porCategoriaConNombre = porCategoria.map(c => ({
      ...c,
      categoria: categorias.find(cat => cat.id === c.categoriaId)
    }));

    // Calculate adherence
    const sesionesCompletadas = await prisma.sesionCapacitacion.count({
      where: {
        capacitacion: { ...where, activo: true },
        estado: 'COMPLETADA'
      }
    });

    const totalSesiones = await prisma.sesionCapacitacion.count({
      where: {
        capacitacion: { ...where, activo: true }
      }
    });

    const adherencia = totalSesiones > 0
      ? Math.round((sesionesCompletadas / totalSesiones) * 100)
      : 0;

    return {
      total,
      porEstado: porEstado.reduce((acc, e) => ({ ...acc, [e.estado]: e._count }), {}),
      porCategoria: porCategoriaConNombre,
      sesionesCompletadas,
      totalSesiones,
      adherencia
    };
  }
}

module.exports = new CapacitacionService();
