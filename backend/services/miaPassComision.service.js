/**
 * Servicio de Comisiones Mia Pass
 * Implementa las políticas v1.1 para liquidación de comisiones.
 */
const prisma = require('../db/prisma');
const { ValidationError } = require('../utils/errors');

class MiaPassComisionService {
  // Constantes de política MIA PASS v1.1 (2026)
  BASE_COMISIONAL = 199900;
  META_SOBRECUMPLIMIENTO = 30;

  VALOR_REFERIDO_N1 = 10000;
  VALOR_REFERIDO_N2 = 5000;

  PORCENTAJE_VENDEDOR_BASE = 0.25;  // 25% ventas 1-30
  PORCENTAJE_VENDEDOR_SOBRE = 0.30; // 30% ventas 31+

  PORCENTAJE_DIRECTOR_REDES = 0.10; // 10% ventas por redes sociales
  PORCENTAJE_CM_REDES = 0.05;       // 5% ventas por redes sociales
  PORCENTAJE_DIRECTOR_TOTAL = 0.06; // 6% de todas las ventas orgánicas (nuevo v1.1)

  /**
   * Calcular y registrar comisiones para una suscripción activada
   */
  async liquidarSuscripcion(suscripcionId) {
    const suscripcion = await prisma.miaPassSuscripcion.findUnique({
      where: { id: suscripcionId },
      include: {
        vendedor: {
          include: { vendedorPadre: { include: { vendedorPadre: true } } }
        }
      }
    });

    if (!suscripcion) throw new Error('Suscripción no encontrada');
    if (suscripcion.estado !== 'ACTIVA') return null; // Solo liquidar activas (enum)

    const comisionesACrear = [];
    const vendedor = suscripcion.vendedor;

    if (vendedor) {
      // 1. Comisión para el Vendedor (Escalafón según Política v1.1)
      const ventasMes = await this.getVentasMesVendedor(vendedor.id);
      const porcentaje = ventasMes > this.META_SOBRECUMPLIMIENTO
        ? this.PORCENTAJE_VENDEDOR_SOBRE
        : this.PORCENTAJE_VENDEDOR_BASE;

      comisionesACrear.push({
        suscripcionId: suscripcion.id,
        vendedorId: vendedor.id,
        rolBeneficiario: 'VENDEDOR',
        baseCalculo: this.BASE_COMISIONAL,
        porcentaje: porcentaje,
        valor: this.BASE_COMISIONAL * porcentaje,
        estado: 'PENDIENTE'
      });

      // 2. Comisiones Multinivel (Referidos)
      // Nivel 1 (Padre) - $10,000 fijo
      if (vendedor.vendedorPadreId) {
        comisionesACrear.push({
          suscripcionId: suscripcion.id,
          vendedorId: vendedor.vendedorPadreId,
          rolBeneficiario: 'REFERIDOR_N1',
          baseCalculo: this.BASE_COMISIONAL,
          porcentaje: 0, // Valor fijo
          valor: this.VALOR_REFERIDO_N1,
          estado: 'PENDIENTE'
        });

        // Nivel 2 (Abuelo) - $5,000 fijo
        if (vendedor.vendedorPadre?.vendedorPadreId) {
          comisionesACrear.push({
            suscripcionId: suscripcion.id,
            vendedorId: vendedor.vendedorPadre.vendedorPadreId,
            rolBeneficiario: 'REFERIDOR_N2',
            baseCalculo: this.BASE_COMISIONAL,
            porcentaje: 0, // Valor fijo
            valor: this.VALOR_REFERIDO_N2,
            estado: 'PENDIENTE'
          });
        }
      }
    }

    // 3. Comisión Director Comercial 6% de TODAS las ventas orgánicas (Política v1.1)
    const director = await this.getUsuarioPorRolSistema('DIRECTOR_COMERCIAL');
    if (director) {
      comisionesACrear.push({
        suscripcionId: suscripcion.id,
        vendedorId: director.id,
        rolBeneficiario: 'DIRECTOR_TOTAL',
        baseCalculo: this.BASE_COMISIONAL,
        porcentaje: this.PORCENTAJE_DIRECTOR_TOTAL,
        valor: this.BASE_COMISIONAL * this.PORCENTAJE_DIRECTOR_TOTAL, // $11,994
        estado: 'PENDIENTE'
      });
    }

    // 4. Comisiones adicionales por Canal (Redes Sociales)
    if (suscripcion.canal === 'Redes Sociales') {
      // Director Comercial 10% adicional por redes
      if (director) {
        comisionesACrear.push({
          suscripcionId: suscripcion.id,
          vendedorId: director.id,
          rolBeneficiario: 'DIRECTOR_REDES',
          baseCalculo: this.BASE_COMISIONAL,
          porcentaje: this.PORCENTAJE_DIRECTOR_REDES,
          valor: this.BASE_COMISIONAL * this.PORCENTAJE_DIRECTOR_REDES,
          estado: 'PENDIENTE'
        });
      }

      // Community Manager 5%
      const cm = await this.getUsuarioPorRolSistema('COMMUNITY_MANAGER');
      if (cm) {
        comisionesACrear.push({
          suscripcionId: suscripcion.id,
          vendedorId: cm.id,
          rolBeneficiario: 'CM',
          baseCalculo: this.BASE_COMISIONAL,
          porcentaje: this.PORCENTAJE_CM_REDES,
          valor: this.BASE_COMISIONAL * this.PORCENTAJE_CM_REDES,
          estado: 'PENDIENTE'
        });
      }
    }

    // Registrar todas las comisiones en lote
    if (comisionesACrear.length > 0) {
      await prisma.miaPassComision.createMany({
        data: comisionesACrear
      });
    }

    return comisionesACrear;
  }

  async getVentasMesVendedor(vendedorId) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    return await prisma.miaPassSuscripcion.count({
      where: {
        vendedorId,
        estado: 'ACTIVA', // Enum EstadoSuscripcionMiaPass
        fechaInicio: { gte: inicioMes }
      }
    });
  }

  async getUsuarioPorRolSistema(nombreRol) {
    // Buscar usuario que tenga asignado el rol específico
    return await prisma.usuario.findFirst({
      where: {
        userRoles: {
          some: { role: { name: nombreRol } }
        },
        activo: true
      }
    });
  }

  /**
   * Generar reporte consolidado para un corte
   */
  async generarReporteCorte(periodo, elaboradoPorId) {
    // Periodo formato YYYY-MM
    const [anio, mes] = periodo.split('-').map(Number);
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

    // 1. Obtener todas las comisiones pendientes del periodo
    const comisiones = await prisma.miaPassComision.findMany({
      where: { 
        estado: 'PENDIENTE',
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: { beneficiario: true, suscripcion: true }
    });

    if (comisiones.length === 0) throw new ValidationError('No hay comisiones pendientes para este periodo');

    const total = comisiones.reduce((sum, c) => sum + Number(c.valor), 0);

    // 2. Crear el Corte
    const corte = await prisma.miaPassCorte.create({
      data: {
        periodo,
        totalComisiones: total,
        elaboradoPor: elaboradoPorId,
        estado: 'CERRADO'
      }
    });

    // 3. Vincular comisiones al corte y actualizar estado
    await prisma.miaPassComision.updateMany({
      where: { id: { in: comisiones.map(c => c.id) } },
      data: { 
        estado: 'LIQUIDADO',
        corteId: corte.id
      }
    });

    return corte;
  }

  /**
   * Revertir comisiones por cancelación/devolución (Política v1.1)
   */
  async revertirComisiones(suscripcionId, motivo) {
    const comisiones = await prisma.miaPassComision.findMany({
      where: {
        suscripcionId,
        estado: { in: ['PENDIENTE', 'LIQUIDADO'] } // Solo revertir las no pagadas
      }
    });

    if (comisiones.length === 0) return [];

    await prisma.miaPassComision.updateMany({
      where: {
        suscripcionId,
        estado: { in: ['PENDIENTE', 'LIQUIDADO'] }
      },
      data: {
        estado: 'REVERTIDO',
        motivoReverso: motivo,
        fechaReverso: new Date()
      }
    });

    return comisiones;
  }

  /**
   * Obtener estructura de red de referidos (N1 y N2)
   */
  async getEstructuraRed(vendedorId) {
    // Nivel 1: Hijos directos
    const hijos = await prisma.usuario.findMany({
      where: {
        vendedorPadreId: vendedorId,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        vendedorCodigo: true
      }
    });

    // Nivel 2: Nietos
    const hijosIds = hijos.map(h => h.id);
    const nietos = await prisma.usuario.findMany({
      where: {
        vendedorPadreId: { in: hijosIds },
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        vendedorCodigo: true,
        vendedorPadreId: true
      }
    });

    // Ventas por nivel
    const [ventasN1, ventasN2] = await Promise.all([
      prisma.miaPassSuscripcion.count({
        where: {
          vendedorId: { in: hijosIds },
          estado: 'ACTIVA'
        }
      }),
      prisma.miaPassSuscripcion.count({
        where: {
          vendedorId: { in: nietos.map(n => n.id) },
          estado: 'ACTIVA'
        }
      })
    ]);

    // Comisiones ganadas por red
    const [comisionesN1, comisionesN2] = await Promise.all([
      prisma.miaPassComision.aggregate({
        where: {
          vendedorId,
          rolBeneficiario: 'REFERIDOR_N1',
          estado: { not: 'REVERTIDO' }
        },
        _sum: { valor: true }
      }),
      prisma.miaPassComision.aggregate({
        where: {
          vendedorId,
          rolBeneficiario: 'REFERIDOR_N2',
          estado: { not: 'REVERTIDO' }
        },
        _sum: { valor: true }
      })
    ]);

    return {
      nivel1: {
        cantidad: hijos.length,
        ventas: ventasN1,
        comisionesGanadas: Number(comisionesN1._sum.valor || 0)
      },
      nivel2: {
        cantidad: nietos.length,
        ventas: ventasN2,
        comisionesGanadas: Number(comisionesN2._sum.valor || 0)
      },
      hijos,
      nietos
    };
  }

  /**
   * Obtener estadísticas del vendedor
   */
  async getEstadoVendedor(vendedorId) {
    const vendedor = await prisma.usuario.findUnique({
      where: { id: vendedorId },
      include: {
        _count: {
          select: { referidos: true }
        }
      }
    });

    if (!vendedor) throw new ValidationError('Vendedor no encontrado');

    const ventasMes = await this.getVentasMesVendedor(vendedorId);
    const estructuraRed = await this.getEstructuraRed(vendedorId);

    return {
      vendedor: {
        id: vendedor.id,
        nombre: `${vendedor.nombre} ${vendedor.apellido}`,
        vendedorCodigo: vendedor.vendedorCodigo,
        vendedorTipo: vendedor.vendedorTipo || 'VENDEDOR',
        _count: vendedor._count
      },
      ventasMes,
      meta: this.META_SOBRECUMPLIMIENTO,
      porcentajeActual: ventasMes > this.META_SOBRECUMPLIMIENTO
        ? this.PORCENTAJE_VENDEDOR_SOBRE
        : this.PORCENTAJE_VENDEDOR_BASE,
      estructuraRed
    };
  }

  /**
   * Obtener comisiones de un vendedor
   */
  async getMisComisiones(vendedorId) {
    const comisiones = await prisma.miaPassComision.findMany({
      where: { vendedorId },
      include: {
        suscripcion: {
          include: {
            paciente: {
              select: { nombre: true, apellido: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      totalPagado: 0,
      saldoPendiente: 0,
      totalRevertido: 0
    };

    for (const c of comisiones) {
      const valor = Number(c.valor);
      if (c.estado === 'PAGADO') stats.totalPagado += valor;
      else if (c.estado === 'PENDIENTE' || c.estado === 'LIQUIDADO') stats.saldoPendiente += valor;
      else if (c.estado === 'REVERTIDO') stats.totalRevertido += valor;
    }

    return { comisiones, stats };
  }
}

module.exports = new MiaPassComisionService();
