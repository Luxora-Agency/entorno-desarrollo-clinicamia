const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class ManualFuncionesService {
  // ==========================================
  // CRUD MANUALES DE FUNCIONES
  // ==========================================

  /**
   * Obtener lista de manuales con paginación y filtros
   */
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      nivel,
      estado,
      area,
    } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(estado && { estado }),
      ...(nivel && { nivel }),
      ...(area && { area: { contains: area, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { denominacionCargo: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
          { area: { contains: search, mode: 'insensitive' } },
          { dependencia: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.manualFunciones.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              funciones: true,
              competencias: true,
            },
          },
          requisitos: {
            select: { formacionAcademica: true, experienciaAnios: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.manualFunciones.count({ where }),
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
   * Obtener manual por ID con todas las relaciones
   */
  async findById(id) {
    const manual = await prisma.manualFunciones.findUnique({
      where: { id },
      include: {
        funciones: { orderBy: { numero: 'asc' } },
        contribuciones: { orderBy: { orden: 'asc' } },
        conocimientos: { orderBy: { orden: 'asc' } },
        requisitos: true,
        responsabilidadesSGC: { orderBy: { orden: 'asc' } },
        competencias: { orderBy: { orden: 'asc' } },
      },
    });

    if (!manual) {
      throw new NotFoundError('Manual de funciones no encontrado');
    }

    return manual;
  }

  /**
   * Generar código único para manual
   */
  async generateCodigo(nivel) {
    const prefijo = {
      DIRECTIVO: 'MF-DIR',
      PROFESIONAL: 'MF-PRO',
      TECNICO: 'MF-TEC',
      OPERATIVO: 'MF-OPE',
    }[nivel] || 'MF-GEN';

    const count = await prisma.manualFunciones.count({
      where: { codigo: { startsWith: prefijo } },
    });

    return `${prefijo}-${String(count + 1).padStart(3, '0')}`;
  }

  /**
   * Crear manual de funciones
   */
  async create(data, userId) {
    const {
      codigo,
      denominacionCargo,
      dependencia,
      cargoJefeInmediato,
      area,
      supervisorDirecto,
      nivel,
      propositoPrincipal,
      funciones,
      contribuciones,
      conocimientos,
      requisitos,
      responsabilidadesSGC,
      competencias,
    } = data;

    // Generar código si no se proporciona
    const codigoFinal = codigo || await this.generateCodigo(nivel || 'PROFESIONAL');

    // Validar código único
    const existente = await prisma.manualFunciones.findUnique({
      where: { codigo: codigoFinal },
    });

    if (existente) {
      throw new ValidationError('Ya existe un manual con este código');
    }

    // Crear manual con todas las relaciones
    const manual = await prisma.manualFunciones.create({
      data: {
        codigo: codigoFinal,
        denominacionCargo,
        dependencia,
        cargoJefeInmediato,
        area,
        supervisorDirecto,
        nivel: nivel || 'PROFESIONAL',
        propositoPrincipal,
        creadoPor: userId,
        // Relaciones
        funciones: funciones?.length > 0 ? {
          create: funciones.map((f, index) => ({
            numero: f.numero || index + 1,
            descripcion: f.descripcion,
          })),
        } : undefined,
        contribuciones: contribuciones?.length > 0 ? {
          create: contribuciones.map((c, index) => ({
            descripcion: c.descripcion,
            orden: c.orden || index,
          })),
        } : undefined,
        conocimientos: conocimientos?.length > 0 ? {
          create: conocimientos.map((c, index) => ({
            tipo: c.tipo,
            descripcion: c.descripcion,
            orden: c.orden || index,
          })),
        } : undefined,
        requisitos: requisitos ? {
          create: {
            formacionAcademica: requisitos.formacionAcademica,
            experienciaAnios: requisitos.experienciaAnios || 0,
            experienciaTipo: requisitos.experienciaTipo || '',
            certificaciones: requisitos.certificaciones || [],
          },
        } : undefined,
        responsabilidadesSGC: responsabilidadesSGC?.length > 0 ? {
          create: responsabilidadesSGC.map((r, index) => ({
            tipo: r.tipo,
            descripcion: r.descripcion,
            orden: r.orden || index,
          })),
        } : undefined,
        competencias: competencias?.length > 0 ? {
          create: competencias.map((c, index) => ({
            tipo: c.tipo,
            nombre: c.nombre,
            nivel: c.nivel || null,
            orden: c.orden || index,
          })),
        } : undefined,
      },
      include: {
        funciones: true,
        contribuciones: true,
        conocimientos: true,
        requisitos: true,
        responsabilidadesSGC: true,
        competencias: true,
      },
    });

    return manual;
  }

  /**
   * Actualizar manual de funciones
   */
  async update(id, data, userId) {
    const manual = await prisma.manualFunciones.findUnique({
      where: { id },
    });

    if (!manual) {
      throw new NotFoundError('Manual de funciones no encontrado');
    }

    const {
      denominacionCargo,
      dependencia,
      cargoJefeInmediato,
      area,
      supervisorDirecto,
      nivel,
      propositoPrincipal,
      funciones,
      contribuciones,
      conocimientos,
      requisitos,
      responsabilidadesSGC,
      competencias,
    } = data;

    // Usar transacción para actualizar todo
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar campos básicos
      const manualUpdated = await tx.manualFunciones.update({
        where: { id },
        data: {
          ...(denominacionCargo && { denominacionCargo }),
          ...(dependencia !== undefined && { dependencia }),
          ...(cargoJefeInmediato !== undefined && { cargoJefeInmediato }),
          ...(area !== undefined && { area }),
          ...(supervisorDirecto !== undefined && { supervisorDirecto }),
          ...(nivel && { nivel }),
          ...(propositoPrincipal && { propositoPrincipal }),
        },
      });

      // Actualizar funciones si se proporcionan
      if (funciones !== undefined) {
        await tx.funcionEsencial.deleteMany({ where: { manualId: id } });
        if (funciones.length > 0) {
          await tx.funcionEsencial.createMany({
            data: funciones.map((f, index) => ({
              manualId: id,
              numero: f.numero || index + 1,
              descripcion: f.descripcion,
            })),
          });
        }
      }

      // Actualizar contribuciones si se proporcionan
      if (contribuciones !== undefined) {
        await tx.contribucionIndividual.deleteMany({ where: { manualId: id } });
        if (contribuciones.length > 0) {
          await tx.contribucionIndividual.createMany({
            data: contribuciones.map((c, index) => ({
              manualId: id,
              descripcion: c.descripcion,
              orden: c.orden || index,
            })),
          });
        }
      }

      // Actualizar conocimientos si se proporcionan
      if (conocimientos !== undefined) {
        await tx.conocimientoBasico.deleteMany({ where: { manualId: id } });
        if (conocimientos.length > 0) {
          await tx.conocimientoBasico.createMany({
            data: conocimientos.map((c, index) => ({
              manualId: id,
              tipo: c.tipo,
              descripcion: c.descripcion,
              orden: c.orden || index,
            })),
          });
        }
      }

      // Actualizar requisitos si se proporcionan
      if (requisitos !== undefined) {
        await tx.requisitosCargo.deleteMany({ where: { manualId: id } });
        if (requisitos) {
          await tx.requisitosCargo.create({
            data: {
              manualId: id,
              formacionAcademica: requisitos.formacionAcademica,
              experienciaAnios: requisitos.experienciaAnios || 0,
              experienciaTipo: requisitos.experienciaTipo || '',
              certificaciones: requisitos.certificaciones || [],
            },
          });
        }
      }

      // Actualizar responsabilidades SGC si se proporcionan
      if (responsabilidadesSGC !== undefined) {
        await tx.responsabilidadSGC.deleteMany({ where: { manualId: id } });
        if (responsabilidadesSGC.length > 0) {
          await tx.responsabilidadSGC.createMany({
            data: responsabilidadesSGC.map((r, index) => ({
              manualId: id,
              tipo: r.tipo,
              descripcion: r.descripcion,
              orden: r.orden || index,
            })),
          });
        }
      }

      // Actualizar competencias si se proporcionan
      if (competencias !== undefined) {
        await tx.competenciaCargo.deleteMany({ where: { manualId: id } });
        if (competencias.length > 0) {
          await tx.competenciaCargo.createMany({
            data: competencias.map((c, index) => ({
              manualId: id,
              tipo: c.tipo,
              nombre: c.nombre,
              nivel: c.nivel || null,
              orden: c.orden || index,
            })),
          });
        }
      }

      return manualUpdated;
    });

    // Retornar manual completo
    return this.findById(id);
  }

  /**
   * Eliminar manual de funciones
   */
  async delete(id) {
    const manual = await prisma.manualFunciones.findUnique({
      where: { id },
    });

    if (!manual) {
      throw new NotFoundError('Manual de funciones no encontrado');
    }

    await prisma.manualFunciones.delete({
      where: { id },
    });

    return { message: 'Manual de funciones eliminado correctamente' };
  }

  /**
   * Aprobar manual (cambiar estado a VIGENTE)
   */
  async aprobar(id, userId) {
    const manual = await prisma.manualFunciones.findUnique({
      where: { id },
    });

    if (!manual) {
      throw new NotFoundError('Manual de funciones no encontrado');
    }

    if (manual.estado === 'VIGENTE') {
      throw new ValidationError('El manual ya está vigente');
    }

    const updated = await prisma.manualFunciones.update({
      where: { id },
      data: {
        estado: 'VIGENTE',
        fechaAprobacion: new Date(),
        aprobadoPor: userId,
      },
    });

    return updated;
  }

  /**
   * Marcar como obsoleto
   */
  async marcarObsoleto(id) {
    const manual = await prisma.manualFunciones.findUnique({
      where: { id },
    });

    if (!manual) {
      throw new NotFoundError('Manual de funciones no encontrado');
    }

    const updated = await prisma.manualFunciones.update({
      where: { id },
      data: {
        estado: 'OBSOLETO',
      },
    });

    return updated;
  }

  /**
   * Duplicar manual para nuevo cargo
   */
  async duplicar(id, nuevoData = {}, userId) {
    const original = await this.findById(id);

    const nuevoCodigo = await this.generateCodigo(nuevoData.nivel || original.nivel);

    const duplicado = await this.create({
      codigo: nuevoCodigo,
      denominacionCargo: nuevoData.denominacionCargo || `${original.denominacionCargo} (Copia)`,
      dependencia: nuevoData.dependencia || original.dependencia,
      cargoJefeInmediato: nuevoData.cargoJefeInmediato || original.cargoJefeInmediato,
      area: nuevoData.area || original.area,
      supervisorDirecto: nuevoData.supervisorDirecto || original.supervisorDirecto,
      nivel: nuevoData.nivel || original.nivel,
      propositoPrincipal: original.propositoPrincipal,
      funciones: original.funciones.map(f => ({
        numero: f.numero,
        descripcion: f.descripcion,
      })),
      contribuciones: original.contribuciones.map(c => ({
        descripcion: c.descripcion,
        orden: c.orden,
      })),
      conocimientos: original.conocimientos.map(c => ({
        tipo: c.tipo,
        descripcion: c.descripcion,
        orden: c.orden,
      })),
      requisitos: original.requisitos ? {
        formacionAcademica: original.requisitos.formacionAcademica,
        experienciaAnios: original.requisitos.experienciaAnios,
        experienciaTipo: original.requisitos.experienciaTipo,
        certificaciones: original.requisitos.certificaciones,
      } : null,
      responsabilidadesSGC: original.responsabilidadesSGC.map(r => ({
        tipo: r.tipo,
        descripcion: r.descripcion,
        orden: r.orden,
      })),
      competencias: original.competencias.map(c => ({
        tipo: c.tipo,
        nombre: c.nombre,
        nivel: c.nivel,
        orden: c.orden,
      })),
    }, userId);

    return duplicado;
  }

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener estadísticas de manuales
   */
  async getStats() {
    const [
      total,
      porEstado,
      porNivel,
    ] = await Promise.all([
      prisma.manualFunciones.count(),
      prisma.manualFunciones.groupBy({
        by: ['estado'],
        _count: true,
      }),
      prisma.manualFunciones.groupBy({
        by: ['nivel'],
        _count: true,
      }),
    ]);

    return {
      total,
      porEstado: porEstado.map(p => ({
        estado: p.estado,
        cantidad: p._count,
      })),
      porNivel: porNivel.map(p => ({
        nivel: p.nivel,
        cantidad: p._count,
      })),
    };
  }

  /**
   * Obtener lista de áreas únicas
   */
  async getAreas() {
    const areas = await prisma.manualFunciones.findMany({
      where: { area: { not: null } },
      select: { area: true },
      distinct: ['area'],
    });

    return areas.map(a => a.area).filter(Boolean);
  }
}

module.exports = new ManualFuncionesService();
