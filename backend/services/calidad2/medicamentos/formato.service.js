const prisma = require('../../../db/prisma');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

class FormatoMedicamentoService {
  // ==========================================
  // FORMATOS (PLANTILLAS)
  // ==========================================

  /**
   * Find all format templates with optional filters
   */
  async findAllFormatos(query = {}) {
    try {
      const { categoria, estado, page = 1, limit = 50 } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { activo: true };

      if (categoria) {
        where.categoria = categoria;
      }

      if (estado) {
        where.estado = estado;
      }

      const [formatos, total] = await Promise.all([
        prisma.formatoMedicamento.findMany({
          where,
          include: {
            creador: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
            _count: {
              select: {
                instancias: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: parseInt(limit),
        }),
        prisma.formatoMedicamento.count({ where }),
      ]);

      return {
        data: formatos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      console.error('Error finding formatos:', error);
      throw error;
    }
  }

  /**
   * Find format template by ID
   */
  async findFormatoById(id) {
    try {
      const formato = await prisma.formatoMedicamento.findFirst({
        where: { id, activo: true },
        include: {
          creador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          instancias: {
            where: { activo: true },
            orderBy: { fechaLlenado: 'desc' },
            take: 5, // Last 5 instances
            include: {
              llenador: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
          _count: {
            select: {
              instancias: true,
            },
          },
        },
      });

      if (!formato) {
        throw new NotFoundError('Formato no encontrado');
      }

      return formato;
    } catch (error) {
      console.error('Error finding formato:', error);
      throw error;
    }
  }

  /**
   * Create new format template
   */
  async createFormato(data, userId) {
    try {
      const {
        codigo,
        nombre,
        descripcion,
        categoria,
        version,
        periodicidad,
        archivoUrl,
        archivoNombre,
        archivoTipo,
      } = data;

      // Check if codigo already exists
      const existing = await prisma.formatoMedicamento.findFirst({
        where: { codigo, activo: true },
      });

      if (existing) {
        throw new ValidationError(`Ya existe un formato con el código ${codigo}`);
      }

      const formato = await prisma.formatoMedicamento.create({
        data: {
          codigo,
          nombre,
          descripcion,
          categoria,
          version: version || '1.0',
          estado: 'VIGENTE',
          periodicidad,
          archivoUrl,
          archivoNombre,
          archivoTipo,
          creadoPor: userId,
        },
        include: {
          creador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      return formato;
    } catch (error) {
      console.error('Error creating formato:', error);
      throw error;
    }
  }

  /**
   * Update format template
   */
  async updateFormato(id, data, userId) {
    try {
      // Check if formato exists
      const existing = await this.findFormatoById(id);

      // If updating codigo, check uniqueness
      if (data.codigo && data.codigo !== existing.codigo) {
        const duplicate = await prisma.formatoMedicamento.findFirst({
          where: {
            codigo: data.codigo,
            activo: true,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new ValidationError(`Ya existe un formato con el código ${data.codigo}`);
        }
      }

      const formato = await prisma.formatoMedicamento.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          creador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      return formato;
    } catch (error) {
      console.error('Error updating formato:', error);
      throw error;
    }
  }

  /**
   * Delete format template (soft delete)
   */
  async deleteFormato(id) {
    try {
      const formato = await this.findFormatoById(id);

      // Check if has instances
      const instanceCount = await prisma.instanciaFormatoMedicamento.count({
        where: { formatoId: id, activo: true },
      });

      if (instanceCount > 0) {
        throw new ValidationError(
          `No se puede eliminar el formato porque tiene ${instanceCount} instancia(s) asociada(s)`
        );
      }

      await prisma.formatoMedicamento.update({
        where: { id },
        data: {
          activo: false,
          estado: 'OBSOLETO',
          updatedAt: new Date(),
        },
      });

      return { message: 'Formato eliminado correctamente' };
    } catch (error) {
      console.error('Error deleting formato:', error);
      throw error;
    }
  }

  /**
   * Get formatos vigentes
   */
  async getFormatosVigentes() {
    try {
      const formatos = await prisma.formatoMedicamento.findMany({
        where: {
          activo: true,
          estado: 'VIGENTE',
        },
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          categoria: true,
          periodicidad: true,
        },
      });

      return formatos;
    } catch (error) {
      console.error('Error getting formatos vigentes:', error);
      throw error;
    }
  }

  // ==========================================
  // INSTANCIAS (LLENADOS)
  // ==========================================

  /**
   * Find all instances with optional filters
   */
  async findAllInstancias(query = {}) {
    try {
      const { formatoId, periodo, estado, page = 1, limit = 50 } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { activo: true };

      if (formatoId) {
        where.formatoId = formatoId;
      }

      if (periodo) {
        where.periodo = periodo;
      }

      if (estado) {
        where.estado = estado;
      }

      const [instancias, total] = await Promise.all([
        prisma.instanciaFormatoMedicamento.findMany({
          where,
          include: {
            formato: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                categoria: true,
              },
            },
            llenador: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
            revisor: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
          orderBy: {
            fechaLlenado: 'desc',
          },
          skip,
          take: parseInt(limit),
        }),
        prisma.instanciaFormatoMedicamento.count({ where }),
      ]);

      return {
        data: instancias,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      console.error('Error finding instancias:', error);
      throw error;
    }
  }

  /**
   * Find instance by ID
   */
  async findInstanciaById(id) {
    try {
      const instancia = await prisma.instanciaFormatoMedicamento.findFirst({
        where: { id, activo: true },
        include: {
          formato: true,
          llenador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          revisor: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      if (!instancia) {
        throw new NotFoundError('Instancia no encontrada');
      }

      return instancia;
    } catch (error) {
      console.error('Error finding instancia:', error);
      throw error;
    }
  }

  /**
   * Get instances by formato ID
   */
  async getInstancesByFormato(formatoId, query = {}) {
    try {
      const { periodo, page = 1, limit = 50 } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        formatoId,
        activo: true,
      };

      if (periodo) {
        where.periodo = periodo;
      }

      const [instancias, total] = await Promise.all([
        prisma.instanciaFormatoMedicamento.findMany({
          where,
          include: {
            llenador: {
              select: {
                id: true,
                nombre: true,
              },
            },
            revisor: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: {
            fechaLlenado: 'desc',
          },
          skip,
          take: parseInt(limit),
        }),
        prisma.instanciaFormatoMedicamento.count({ where }),
      ]);

      return {
        data: instancias,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      console.error('Error getting instances by formato:', error);
      throw error;
    }
  }

  /**
   * Create new instance
   */
  async createInstancia(data, userId) {
    try {
      const {
        formatoId,
        periodo,
        fechaLlenado,
        archivoUrl,
        archivoNombre,
        archivoTipo,
        archivoTamano,
        observaciones,
      } = data;

      // Verify formato exists
      const formato = await this.findFormatoById(formatoId);

      // Check if instance already exists for this periodo
      const existing = await prisma.instanciaFormatoMedicamento.findFirst({
        where: {
          formatoId,
          periodo,
          activo: true,
        },
      });

      if (existing) {
        throw new ValidationError(
          `Ya existe una instancia del formato "${formato.nombre}" para el período ${periodo}`
        );
      }

      const instancia = await prisma.instanciaFormatoMedicamento.create({
        data: {
          formatoId,
          periodo,
          fechaLlenado: fechaLlenado ? new Date(fechaLlenado) : new Date(),
          archivoUrl,
          archivoNombre,
          archivoTipo,
          archivoTamano: parseInt(archivoTamano),
          estado: 'COMPLETO',
          observaciones,
          llenadoPor: userId,
        },
        include: {
          formato: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              categoria: true,
            },
          },
          llenador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      return instancia;
    } catch (error) {
      console.error('Error creating instancia:', error);
      throw error;
    }
  }

  /**
   * Update instance
   */
  async updateInstancia(id, data, userId) {
    try {
      const existing = await this.findInstanciaById(id);

      // If updating periodo, check uniqueness
      if (data.periodo && data.periodo !== existing.periodo) {
        const duplicate = await prisma.instanciaFormatoMedicamento.findFirst({
          where: {
            formatoId: existing.formatoId,
            periodo: data.periodo,
            activo: true,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new ValidationError(
            `Ya existe una instancia para el período ${data.periodo}`
          );
        }
      }

      const instancia = await prisma.instanciaFormatoMedicamento.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          formato: true,
          llenador: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          revisor: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      return instancia;
    } catch (error) {
      console.error('Error updating instancia:', error);
      throw error;
    }
  }

  /**
   * Revisar instancia
   */
  async revisarInstancia(id, userId, observaciones = null) {
    try {
      const instancia = await this.findInstanciaById(id);

      const updated = await prisma.instanciaFormatoMedicamento.update({
        where: { id },
        data: {
          estado: 'REVISADO',
          revisadoPor: userId,
          fechaRevision: new Date(),
          observaciones: observaciones || instancia.observaciones,
          updatedAt: new Date(),
        },
        include: {
          formato: true,
          llenador: {
            select: {
              id: true,
              nombre: true,
            },
          },
          revisor: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      return updated;
    } catch (error) {
      console.error('Error revisando instancia:', error);
      throw error;
    }
  }

  /**
   * Delete instance (soft delete)
   */
  async deleteInstancia(id) {
    try {
      await this.findInstanciaById(id);

      await prisma.instanciaFormatoMedicamento.update({
        where: { id },
        data: {
          activo: false,
          updatedAt: new Date(),
        },
      });

      return { message: 'Instancia eliminada correctamente' };
    } catch (error) {
      console.error('Error deleting instancia:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getEstadisticas() {
    try {
      const [
        totalFormatos,
        formatosVigentes,
        totalInstancias,
        instanciasPorCategoria,
      ] = await Promise.all([
        prisma.formatoMedicamento.count({
          where: { activo: true },
        }),
        prisma.formatoMedicamento.count({
          where: { activo: true, estado: 'VIGENTE' },
        }),
        prisma.instanciaFormatoMedicamento.count({
          where: { activo: true },
        }),
        prisma.formatoMedicamento.findMany({
          where: { activo: true },
          select: {
            categoria: true,
            _count: {
              select: {
                instancias: {
                  where: { activo: true },
                },
              },
            },
          },
        }),
      ]);

      // Group by categoria
      const porCategoria = {};
      instanciasPorCategoria.forEach(formato => {
        const cat = formato.categoria;
        if (!porCategoria[cat]) {
          porCategoria[cat] = 0;
        }
        porCategoria[cat] += formato._count.instancias;
      });

      return {
        totalFormatos,
        formatosVigentes,
        totalInstancias,
        instanciasPorCategoria: porCategoria,
      };
    } catch (error) {
      console.error('Error getting estadísticas:', error);
      throw error;
    }
  }
}

module.exports = new FormatoMedicamentoService();
