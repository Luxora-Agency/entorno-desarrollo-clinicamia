/**
 * Servicio de Centros de Costo de Siigo
 *
 * Sincroniza departamentos de la clínica como centros de costo
 * para el análisis contable por área.
 */

const siigoService = require('./siigo.service');
const prisma = require('../../db/prisma');

class CostCenterSiigoService {
  /**
   * Sincroniza los departamentos como centros de costo
   */
  async syncDepartamentos() {
    const departamentos = await prisma.departamento.findMany({
      where: { estado: 'Activo' }
    });

    // Obtener centros de costo existentes en Siigo
    let existingCenters = [];
    try {
      const costCenterApi = siigoService.getCostCenterApi();
      if (costCenterApi) {
        const result = await siigoService.executeWithLogging(
          () => costCenterApi.getCostCenters(),
          {
            operacion: 'getCostCenters',
            endpoint: '/cost-centers',
            metodo: 'GET',
            entidad: 'centro_costo'
          }
        );
        existingCenters = result.results || [];
      }
    } catch (error) {
      console.log('[Siigo] No se pudo obtener centros de costo:', error.message);
    }

    const results = {
      total: departamentos.length,
      sincronizados: 0,
      pendientes: [],
      errores: []
    };

    for (const depto of departamentos) {
      try {
        const codigo = this.generateCostCenterCode(depto);

        // Buscar si ya existe en Siigo
        const existing = existingCenters.find(
          cc => cc.code === codigo || cc.name?.toLowerCase() === depto.nombre.toLowerCase()
        );

        if (existing) {
          // Guardar mapeo
          await prisma.siigoSync.upsert({
            where: {
              entidad_entidadId: {
                entidad: 'departamento',
                entidadId: depto.id
              }
            },
            update: {
              siigoId: existing.id?.toString(),
              estado: 'sincronizado',
              ultimaSync: new Date()
            },
            create: {
              entidad: 'departamento',
              entidadId: depto.id,
              siigoId: existing.id?.toString(),
              estado: 'sincronizado'
            }
          });

          results.sincronizados++;
        } else {
          // Siigo no permite crear centros de costo via API
          // Marcar como pendiente para creación manual
          await prisma.siigoSync.upsert({
            where: {
              entidad_entidadId: {
                entidad: 'departamento',
                entidadId: depto.id
              }
            },
            update: {
              estado: 'pendiente',
              errorMessage: 'Crear manualmente en Siigo',
              ultimaSync: new Date()
            },
            create: {
              entidad: 'departamento',
              entidadId: depto.id,
              siigoId: '',
              estado: 'pendiente',
              errorMessage: 'Crear manualmente en Siigo'
            }
          });

          results.pendientes.push({
            departamentoId: depto.id,
            nombre: depto.nombre,
            codigoSugerido: codigo
          });
        }
      } catch (error) {
        results.errores.push({
          departamentoId: depto.id,
          nombre: depto.nombre,
          error: error.message
        });
      }
    }

    console.log(`[Siigo] Sincronizados ${results.sincronizados}/${results.total} centros de costo`);
    return results;
  }

  /**
   * Genera un código para el centro de costo
   */
  generateCostCenterCode(departamento) {
    const prefijos = {
      'urgencias': 'URG',
      'hospitalizacion': 'HOS',
      'consulta externa': 'CON',
      'laboratorio': 'LAB',
      'imagenologia': 'IMG',
      'quirofano': 'QUI',
      'farmacia': 'FAR',
      'administracion': 'ADM',
      'enfermeria': 'ENF',
      'uci': 'UCI',
      'pediatria': 'PED',
      'ginecologia': 'GIN',
      'cardiologia': 'CAR',
      'neurologia': 'NEU',
      'traumatologia': 'TRA',
      'medicina interna': 'MED',
      'cirugia': 'CIR'
    };

    const nombreLower = departamento.nombre.toLowerCase();

    for (const [key, prefix] of Object.entries(prefijos)) {
      if (nombreLower.includes(key)) {
        return `${prefix}001`;
      }
    }

    // Generar código genérico
    return `DEP${departamento.id.substring(0, 3).toUpperCase()}`;
  }

  /**
   * Obtiene el ID de Siigo para un departamento
   */
  async getSiigoIdForDepartamento(departamentoId) {
    const sync = await prisma.siigoSync.findUnique({
      where: {
        entidad_entidadId: {
          entidad: 'departamento',
          entidadId: departamentoId
        }
      }
    });

    return sync?.siigoId || null;
  }

  /**
   * Lista los centros de costo de Siigo
   */
  async listCostCenters() {
    try {
      const costCenterApi = siigoService.getCostCenterApi();

      if (!costCenterApi) {
        return { message: 'API de centros de costo no disponible' };
      }

      const result = await siigoService.executeWithLogging(
        () => costCenterApi.getCostCenters(),
        {
          operacion: 'listCostCenters',
          endpoint: '/cost-centers',
          metodo: 'GET',
          entidad: 'centro_costo'
        }
      );

      return result;
    } catch (error) {
      console.error('[Siigo] Error listando centros de costo:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el mapeo de departamentos a centros de costo
   */
  async getCostCenterMapping() {
    const departamentos = await prisma.departamento.findMany({
      where: { estado: 'Activo' },
      select: { id: true, nombre: true }
    });

    const syncs = await prisma.siigoSync.findMany({
      where: {
        entidad: 'departamento'
      }
    });

    const syncMap = new Map(syncs.map(s => [s.entidadId, s]));

    return departamentos.map(depto => ({
      departamentoId: depto.id,
      departamentoNombre: depto.nombre,
      siigoId: syncMap.get(depto.id)?.siigoId || null,
      estado: syncMap.get(depto.id)?.estado || 'no_sincronizado',
      codigoSugerido: this.generateCostCenterCode(depto)
    }));
  }

  /**
   * Actualiza manualmente el mapeo de un departamento
   */
  async updateMapping(departamentoId, siigoCostCenterId) {
    await prisma.siigoSync.upsert({
      where: {
        entidad_entidadId: {
          entidad: 'departamento',
          entidadId: departamentoId
        }
      },
      update: {
        siigoId: siigoCostCenterId,
        estado: 'sincronizado',
        errorMessage: null,
        ultimaSync: new Date()
      },
      create: {
        entidad: 'departamento',
        entidadId: departamentoId,
        siigoId: siigoCostCenterId,
        estado: 'sincronizado'
      }
    });

    return { success: true };
  }

  /**
   * Obtiene estadísticas por centro de costo
   */
  async getCostCenterStats(fechaInicio, fechaFin) {
    // Obtener facturas agrupadas por departamento/especialidad
    const facturas = await prisma.factura.findMany({
      where: {
        fechaEmision: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        },
        estado: { not: 'Cancelada' }
      },
      include: {
        items: {
          include: {
            cita: {
              include: {
                especialidad: true
              }
            },
            admision: {
              include: {
                unidad: true
              }
            }
          }
        }
      }
    });

    // Agrupar por origen
    const porCentroCosto = {};

    for (const factura of facturas) {
      let centroCosto = 'Sin asignar';

      // Buscar especialidad o unidad en los items
      for (const item of factura.items) {
        if (item.cita?.especialidad?.nombre) {
          centroCosto = item.cita.especialidad.nombre;
          break;
        } else if (item.admision?.unidad?.nombre) {
          centroCosto = item.admision.unidad.nombre;
          break;
        }
      }

      if (!porCentroCosto[centroCosto]) {
        porCentroCosto[centroCosto] = {
          nombre: centroCosto,
          cantidadFacturas: 0,
          totalIngresos: 0,
          facturas: []
        };
      }

      porCentroCosto[centroCosto].cantidadFacturas++;
      porCentroCosto[centroCosto].totalIngresos += parseFloat(factura.total);
    }

    return {
      periodo: { inicio: fechaInicio, fin: fechaFin },
      centrosCosto: Object.values(porCentroCosto).sort((a, b) => b.totalIngresos - a.totalIngresos)
    };
  }

  /**
   * Mapeo predefinido de departamentos clínicos
   */
  getDepartmentMapping() {
    return {
      'URGENCIAS': { codigo: 'URG001', cuenta: '41050501' },
      'HOSPITALIZACION': { codigo: 'HOS001', cuenta: '41050505' },
      'CONSULTA_EXTERNA': { codigo: 'CON001', cuenta: '41050510' },
      'LABORATORIO': { codigo: 'LAB001', cuenta: '41050515' },
      'IMAGENOLOGIA': { codigo: 'IMG001', cuenta: '41050520' },
      'QUIROFANO': { codigo: 'QUI001', cuenta: '41050525' },
      'FARMACIA': { codigo: 'FAR001', cuenta: '41050530' },
      'ADMINISTRACION': { codigo: 'ADM001', cuenta: '51050501' },
      'UCI': { codigo: 'UCI001', cuenta: '41050535' },
      'PEDIATRIA': { codigo: 'PED001', cuenta: '41050540' },
      'GINECOLOGIA': { codigo: 'GIN001', cuenta: '41050545' },
      'CARDIOLOGIA': { codigo: 'CAR001', cuenta: '41050550' }
    };
  }

  /**
   * Obtiene la cuenta contable de ingresos para un departamento
   */
  getRevenuAccountForDepartment(departamentoNombre) {
    const mapping = this.getDepartmentMapping();
    const key = departamentoNombre.toUpperCase().replace(/ /g, '_');

    if (mapping[key]) {
      return mapping[key].cuenta;
    }

    // Cuenta genérica de ingresos
    return '41050501';
  }
}

module.exports = new CostCenterSiigoService();
