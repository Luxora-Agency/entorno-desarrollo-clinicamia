/**
 * Centros de Costo Service
 * Gestión de centros de costo con sincronización Siigo
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class CentroCostoService {
  /**
   * Obtener todos los centros de costo
   */
  async getAll(filters = {}) {
    const where = { activo: true };

    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.search) {
      where.OR = [
        { codigo: { contains: filters.search } },
        { nombre: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.centroCosto.findMany({
      where,
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
        children: { select: { id: true, codigo: true, nombre: true } }
      },
      orderBy: { codigo: 'asc' }
    });
  }

  /**
   * Obtener centro de costo por ID
   */
  async getById(id) {
    const centro = await prisma.centroCosto.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true
      }
    });

    if (!centro) {
      throw new NotFoundError('Centro de costo no encontrado');
    }

    return centro;
  }

  /**
   * Crear centro de costo
   */
  async create(data) {
    // Validar código único
    const existe = await prisma.centroCosto.findUnique({
      where: { codigo: data.codigo }
    });

    if (existe) {
      throw new ValidationError(`El código ${data.codigo} ya existe`);
    }

    // Calcular nivel
    let nivel = 1;
    if (data.parentId) {
      const parent = await prisma.centroCosto.findUnique({
        where: { id: data.parentId }
      });
      if (parent) {
        nivel = parent.nivel + 1;
      }
    }

    const centro = await prisma.centroCosto.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo || 'OPERATIVO',
        departamentoId: data.departamentoId,
        parentId: data.parentId,
        nivel,
        activo: true
      },
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } }
      }
    });

    return centro;
  }

  /**
   * Actualizar centro de costo
   */
  async update(id, data) {
    const centro = await this.getById(id);

    // Si cambia código, validar que no exista
    if (data.codigo && data.codigo !== centro.codigo) {
      const existe = await prisma.centroCosto.findUnique({
        where: { codigo: data.codigo }
      });
      if (existe) {
        throw new ValidationError(`El código ${data.codigo} ya existe`);
      }
    }

    const updated = await prisma.centroCosto.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        departamentoId: data.departamentoId
      },
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } }
      }
    });

    return updated;
  }

  /**
   * Desactivar centro de costo
   */
  async desactivar(id) {
    // Verificar que no tenga hijos activos
    const hijos = await prisma.centroCosto.count({
      where: { parentId: id, activo: true }
    });

    if (hijos > 0) {
      throw new ValidationError('No se puede desactivar un centro de costo con hijos activos');
    }

    // Verificar que no tenga movimientos
    const movimientos = await prisma.asientoContableLinea.count({
      where: { centroCostoId: id }
    });

    if (movimientos > 0) {
      throw new ValidationError(`El centro de costo tiene ${movimientos} movimientos contables`);
    }

    return prisma.centroCosto.update({
      where: { id },
      data: { activo: false }
    });
  }

  /**
   * Obtener árbol jerárquico
   */
  async getArbol() {
    const centros = await prisma.centroCosto.findMany({
      where: { activo: true },
      orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }]
    });

    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    return buildTree(centros);
  }

  /**
   * Inicializar centros de costo desde departamentos
   */
  async inicializarDesdeDepartamentos() {
    const departamentos = await prisma.departamento.findMany({
      where: { activo: true }
    });

    const creados = [];

    for (const depto of departamentos) {
      const codigo = `CC${String(departamentos.indexOf(depto) + 1).padStart(3, '0')}`;

      const existe = await prisma.centroCosto.findUnique({
        where: { codigo }
      });

      if (!existe) {
        const centro = await prisma.centroCosto.create({
          data: {
            codigo,
            nombre: depto.nombre,
            descripcion: `Centro de costo para ${depto.nombre}`,
            tipo: 'OPERATIVO',
            departamentoId: depto.id,
            nivel: 1,
            activo: true
          }
        });
        creados.push(centro);
      }
    }

    return { creados: creados.length };
  }

  /**
   * Sincronizar con Siigo
   */
  async syncFromSiigo(siigoService) {
    try {
      const costCenterApi = siigoService.getCostCenterApi();
      const response = await costCenterApi.getCostCenters();

      const centros = response.results || [];
      const sincronizados = [];

      for (const centro of centros) {
        // Buscar o crear centro local
        let local = await prisma.centroCosto.findUnique({
          where: { siigoId: centro.id.toString() }
        });

        if (!local) {
          local = await prisma.centroCosto.findFirst({
            where: { codigo: centro.code }
          });
        }

        if (local) {
          // Actualizar con ID de Siigo
          await prisma.centroCosto.update({
            where: { id: local.id },
            data: {
              siigoId: centro.id.toString(),
              nombre: centro.name || local.nombre
            }
          });
          sincronizados.push(local.codigo);
        } else {
          // Crear nuevo
          const nuevo = await prisma.centroCosto.create({
            data: {
              codigo: centro.code || `SIIGO${centro.id}`,
              nombre: centro.name,
              descripcion: centro.description,
              tipo: 'OPERATIVO',
              nivel: 1,
              siigoId: centro.id.toString(),
              activo: centro.active !== false
            }
          });
          sincronizados.push(nuevo.codigo);
        }
      }

      return { sincronizados: sincronizados.length };
    } catch (error) {
      console.error('Error sincronizando centros de costo con Siigo:', error);
      throw error;
    }
  }

  /**
   * Sincronizar hacia Siigo (crear centro si no existe)
   */
  async syncToSiigo(id, siigoService) {
    const centro = await this.getById(id);

    if (centro.siigoId) {
      return { message: 'Centro ya sincronizado', siigoId: centro.siigoId };
    }

    // Nota: Siigo API no permite crear centros de costo via API
    // Solo se pueden sincronizar los existentes
    throw new ValidationError('Los centros de costo deben crearse manualmente en Siigo');
  }

  /**
   * Obtener reporte por centro de costo
   */
  async getReporte(id, fechaInicio, fechaFin) {
    const centro = await this.getById(id);

    const movimientos = await prisma.asientoContableLinea.findMany({
      where: {
        centroCostoId: id,
        asiento: {
          fecha: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin)
          },
          estado: 'APROBADO'
        }
      },
      include: {
        asiento: {
          select: {
            numero: true,
            fecha: true,
            descripcion: true
          }
        }
      },
      orderBy: {
        asiento: { fecha: 'asc' }
      }
    });

    const totales = movimientos.reduce((acc, mov) => {
      acc.debitos += parseFloat(mov.debito) || 0;
      acc.creditos += parseFloat(mov.credito) || 0;
      return acc;
    }, { debitos: 0, creditos: 0 });

    return {
      centroCosto: centro,
      periodo: { fechaInicio, fechaFin },
      movimientos,
      totales,
      saldo: totales.debitos - totales.creditos
    };
  }

  /**
   * Obtener para selector
   */
  async getParaSelector() {
    return prisma.centroCosto.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true
      },
      orderBy: { codigo: 'asc' }
    });
  }
}

module.exports = new CentroCostoService();
