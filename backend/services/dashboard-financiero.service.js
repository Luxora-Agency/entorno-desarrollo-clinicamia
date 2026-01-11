/**
 * Servicio de Dashboard Financiero Ejecutivo
 *
 * Proporciona KPIs financieros consolidados para la gestión
 * ejecutiva de la clínica.
 */

const prisma = require('../db/prisma');

class DashboardFinancieroService {
  /**
   * Obtiene todos los KPIs financieros principales
   */
  async getKPIs(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    const [
      ingresos,
      cartera,
      cxp,
      nomina,
      inventarioFarmacia,
      activosFijos
    ] = await Promise.all([
      this.getIngresos(inicio, fin),
      this.getCarteraPorCobrar(),
      this.getCuentasPorPagar(),
      this.getGastosNomina(inicio, fin),
      this.getValorInventario(),
      this.getValorActivosFijos()
    ]);

    // Calcular utilidad bruta
    const gastos = (cxp.totalPagado || 0) + (nomina.total || 0);
    const utilidadBruta = (ingresos.total || 0) - gastos;

    return {
      periodo: { inicio: fechaInicio, fin: fechaFin },
      ingresos,
      cartera,
      cuentasPorPagar: cxp,
      nomina,
      inventario: inventarioFarmacia,
      activosFijos,
      utilidadBruta,
      margenBruto: ingresos.total > 0
        ? ((utilidadBruta / ingresos.total) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Obtiene los ingresos del período
   */
  async getIngresos(fechaInicio, fechaFin) {
    const facturas = await prisma.factura.aggregate({
      where: {
        fechaEmision: { gte: fechaInicio, lte: fechaFin },
        estado: { not: 'Cancelada' }
      },
      _sum: { total: true },
      _count: true
    });

    // Período anterior para comparación
    const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
    const inicioAnterior = new Date(fechaInicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - diasPeriodo);

    const facturasAnterior = await prisma.factura.aggregate({
      where: {
        fechaEmision: { gte: inicioAnterior, lt: fechaInicio },
        estado: { not: 'Cancelada' }
      },
      _sum: { total: true }
    });

    const totalActual = parseFloat(facturas._sum.total) || 0;
    const totalAnterior = parseFloat(facturasAnterior._sum.total) || 0;
    const variacion = totalAnterior > 0
      ? (((totalActual - totalAnterior) / totalAnterior) * 100).toFixed(2)
      : 0;

    return {
      total: totalActual,
      cantidad: facturas._count,
      variacionPorcentual: parseFloat(variacion),
      periodoAnterior: totalAnterior
    };
  }

  /**
   * Obtiene la cartera por cobrar (aging)
   */
  async getCarteraPorCobrar() {
    const facturas = await prisma.factura.findMany({
      where: {
        estado: { in: ['Pendiente', 'Parcial'] },
        saldoPendiente: { gt: 0 }
      },
      select: {
        id: true,
        numero: true,
        fechaEmision: true,
        fechaVencimiento: true,
        saldoPendiente: true,
        paciente: {
          select: { id: true, nombre: true, apellido: true }
        }
      }
    });

    const hoy = new Date();
    const aging = {
      corriente: { cantidad: 0, monto: 0 },
      vencido_1_30: { cantidad: 0, monto: 0 },
      vencido_31_60: { cantidad: 0, monto: 0 },
      vencido_61_90: { cantidad: 0, monto: 0 },
      vencido_90_mas: { cantidad: 0, monto: 0 }
    };

    let total = 0;

    for (const factura of facturas) {
      const fechaVenc = factura.fechaVencimiento || factura.fechaEmision;
      const diasVencido = Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24));
      const saldo = parseFloat(factura.saldoPendiente);
      total += saldo;

      let categoria;
      if (diasVencido <= 0) categoria = 'corriente';
      else if (diasVencido <= 30) categoria = 'vencido_1_30';
      else if (diasVencido <= 60) categoria = 'vencido_31_60';
      else if (diasVencido <= 90) categoria = 'vencido_61_90';
      else categoria = 'vencido_90_mas';

      aging[categoria].cantidad++;
      aging[categoria].monto += saldo;
    }

    return {
      total,
      cantidad: facturas.length,
      aging,
      topDeudores: await this.getTopDeudores(5)
    };
  }

  /**
   * Obtiene los top deudores
   */
  async getTopDeudores(limit = 5) {
    const facturas = await prisma.factura.groupBy({
      by: ['pacienteId'],
      where: {
        estado: { in: ['Pendiente', 'Parcial'] },
        saldoPendiente: { gt: 0 }
      },
      _sum: { saldoPendiente: true },
      _count: true,
      orderBy: { _sum: { saldoPendiente: 'desc' } },
      take: limit
    });

    const deudores = [];
    for (const f of facturas) {
      const paciente = await prisma.paciente.findUnique({
        where: { id: f.pacienteId },
        select: { id: true, nombre: true, apellido: true }
      });
      if (paciente) {
        deudores.push({
          paciente: `${paciente.nombre} ${paciente.apellido}`,
          pacienteId: paciente.id,
          saldo: parseFloat(f._sum.saldoPendiente),
          facturas: f._count
        });
      }
    }

    return deudores;
  }

  /**
   * Obtiene las cuentas por pagar
   */
  async getCuentasPorPagar() {
    try {
      const facturas = await prisma.facturaProveedor.findMany({
        where: {
          estado: { in: ['Pendiente', 'Parcial'] },
          saldoPendiente: { gt: 0 }
        },
        select: {
          id: true,
          numero: true,
          fechaVencimiento: true,
          saldoPendiente: true,
          proveedor: {
            select: { id: true, razonSocial: true }
          }
        }
      });

      const hoy = new Date();
      const aging = {
        corriente: { cantidad: 0, monto: 0 },
        vencido_1_30: { cantidad: 0, monto: 0 },
        vencido_31_60: { cantidad: 0, monto: 0 },
        vencido_61_90: { cantidad: 0, monto: 0 },
        vencido_90_mas: { cantidad: 0, monto: 0 }
      };

      let total = 0;

      for (const factura of facturas) {
        const diasVencido = Math.floor((hoy - factura.fechaVencimiento) / (1000 * 60 * 60 * 24));
        const saldo = parseFloat(factura.saldoPendiente);
        total += saldo;

        let categoria;
        if (diasVencido <= 0) categoria = 'corriente';
        else if (diasVencido <= 30) categoria = 'vencido_1_30';
        else if (diasVencido <= 60) categoria = 'vencido_31_60';
        else if (diasVencido <= 90) categoria = 'vencido_61_90';
        else categoria = 'vencido_90_mas';

        aging[categoria].cantidad++;
        aging[categoria].monto += saldo;
      }

      // Pagos realizados en el período (para calcular gastos)
      const pagosRealizados = await prisma.pagoProveedor.aggregate({
        _sum: { monto: true }
      });

      return {
        total,
        cantidad: facturas.length,
        aging,
        totalPagado: parseFloat(pagosRealizados._sum?.monto) || 0
      };
    } catch (error) {
      return { total: 0, cantidad: 0, aging: {}, totalPagado: 0 };
    }
  }

  /**
   * Obtiene gastos de nómina del período
   */
  async getGastosNomina(fechaInicio, fechaFin) {
    try {
      const periodos = await prisma.periodoNomina.findMany({
        where: {
          fechaInicio: { gte: fechaInicio },
          fechaFin: { lte: fechaFin },
          estado: { in: ['CERRADO', 'PAGADO'] }
        },
        include: {
          _count: { select: { itemsNomina: true } }
        }
      });

      let total = 0;
      let empleados = 0;

      for (const periodo of periodos) {
        total += parseFloat(periodo.totalNomina || 0);
        empleados = Math.max(empleados, periodo._count.itemsNomina);
      }

      return {
        total,
        empleados,
        periodos: periodos.length
      };
    } catch (error) {
      return { total: 0, empleados: 0, periodos: 0 };
    }
  }

  /**
   * Obtiene el valor del inventario de farmacia
   */
  async getValorInventario() {
    try {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        select: {
          id: true,
          cantidadTotal: true,
          precioCompra: true,
          precioVenta: true
        }
      });

      let valorCosto = 0;
      let valorVenta = 0;
      let items = 0;

      for (const producto of productos) {
        const cantidad = parseInt(producto.cantidadTotal) || 0;
        if (cantidad > 0) {
          valorCosto += cantidad * (parseFloat(producto.precioCompra) || 0);
          valorVenta += cantidad * (parseFloat(producto.precioVenta) || 0);
          items++;
        }
      }

      return {
        valorCosto,
        valorVenta,
        margenPotencial: valorVenta - valorCosto,
        items
      };
    } catch (error) {
      return { valorCosto: 0, valorVenta: 0, margenPotencial: 0, items: 0 };
    }
  }

  /**
   * Obtiene el valor de los activos fijos
   */
  async getValorActivosFijos() {
    try {
      const activos = await prisma.activoFijo.aggregate({
        where: { estado: 'Activo' },
        _sum: {
          valorAdquisicion: true,
          depreciacionAcumulada: true,
          valorEnLibros: true
        },
        _count: true
      });

      return {
        valorAdquisicion: parseFloat(activos._sum.valorAdquisicion) || 0,
        depreciacionAcumulada: parseFloat(activos._sum.depreciacionAcumulada) || 0,
        valorEnLibros: parseFloat(activos._sum.valorEnLibros) || 0,
        cantidad: activos._count
      };
    } catch (error) {
      return {
        valorAdquisicion: 0,
        depreciacionAcumulada: 0,
        valorEnLibros: 0,
        cantidad: 0
      };
    }
  }

  /**
   * Obtiene ingresos agrupados por departamento/especialidad
   */
  async getIngresosPorDepartamento(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Agrupar por tipo de item de factura
    const items = await prisma.facturaItem.groupBy({
      by: ['tipo'],
      where: {
        factura: {
          fechaEmision: { gte: inicio, lte: fin },
          estado: { not: 'Cancelada' }
        }
      },
      _sum: { subtotal: true },
      _count: true
    });

    // Formatear para gráfico
    return items.map(item => ({
      categoria: this.formatTipoItem(item.tipo),
      ingresos: parseFloat(item._sum.subtotal) || 0,
      cantidad: item._count
    })).sort((a, b) => b.ingresos - a.ingresos);
  }

  /**
   * Formatea el tipo de item de factura
   */
  formatTipoItem(tipo) {
    const tipos = {
      'Consulta': 'Consultas Médicas',
      'Procedimiento': 'Procedimientos',
      'Laboratorio': 'Laboratorio',
      'Imagenologia': 'Imagenología',
      'Medicamento': 'Farmacia',
      'Hospitalizacion': 'Hospitalización',
      'Cirugia': 'Cirugías',
      'Otro': 'Otros Servicios'
    };
    return tipos[tipo] || tipo;
  }

  /**
   * Obtiene tendencias de los últimos N meses
   */
  async getTendencias(meses = 12) {
    const tendencias = [];
    const hoy = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0);

      const [ingresos, gastos] = await Promise.all([
        prisma.factura.aggregate({
          where: {
            fechaEmision: { gte: fechaInicio, lte: fechaFin },
            estado: { not: 'Cancelada' }
          },
          _sum: { total: true }
        }),
        prisma.facturaProveedor.aggregate({
          where: {
            fechaFactura: { gte: fechaInicio, lte: fechaFin }
          },
          _sum: { total: true }
        }).catch(() => ({ _sum: { total: 0 } }))
      ]);

      const ingreso = parseFloat(ingresos._sum.total) || 0;
      const gasto = parseFloat(gastos._sum.total) || 0;

      tendencias.push({
        mes: fechaInicio.toISOString().substring(0, 7),
        mesNombre: fechaInicio.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
        ingresos: ingreso,
        gastos: gasto,
        utilidad: ingreso - gasto
      });
    }

    return tendencias;
  }

  /**
   * Obtiene indicadores de liquidez
   */
  async getIndicadoresLiquidez() {
    // Obtener saldos bancarios
    const bancos = await prisma.cuentaBancaria.aggregate({
      where: { activa: true },
      _sum: { saldoActual: true }
    });

    // Cuentas por cobrar corrientes (no vencidas)
    const cxcCorriente = await prisma.factura.aggregate({
      where: {
        estado: { in: ['Pendiente', 'Parcial'] },
        saldoPendiente: { gt: 0 },
        fechaVencimiento: { gte: new Date() }
      },
      _sum: { saldoPendiente: true }
    });

    // Cuentas por pagar corrientes
    const cxpCorriente = await prisma.facturaProveedor.aggregate({
      where: {
        estado: { in: ['Pendiente', 'Parcial'] },
        saldoPendiente: { gt: 0 },
        fechaVencimiento: { gte: new Date() }
      },
      _sum: { saldoPendiente: true }
    }).catch(() => ({ _sum: { saldoPendiente: 0 } }));

    const efectivo = parseFloat(bancos._sum?.saldoActual) || 0;
    const cxc = parseFloat(cxcCorriente._sum?.saldoPendiente) || 0;
    const cxp = parseFloat(cxpCorriente._sum?.saldoPendiente) || 0;

    // Calcular ratios
    const activoCorriente = efectivo + cxc;
    const pasivoCorriente = cxp;

    return {
      efectivo,
      cuentasPorCobrar: cxc,
      cuentasPorPagar: cxp,
      capitalDeTrabajo: activoCorriente - pasivoCorriente,
      razonCorriente: pasivoCorriente > 0 ? (activoCorriente / pasivoCorriente).toFixed(2) : 'N/A',
      pruebAcida: pasivoCorriente > 0 ? (efectivo / pasivoCorriente).toFixed(2) : 'N/A'
    };
  }

  /**
   * Dashboard ejecutivo completo
   */
  async getDashboardEjecutivo() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);

    const [
      kpisMes,
      kpisAño,
      tendencias,
      ingresosPorDepto,
      liquidez
    ] = await Promise.all([
      this.getKPIs(inicioMes.toISOString(), hoy.toISOString()),
      this.getKPIs(inicioAño.toISOString(), hoy.toISOString()),
      this.getTendencias(12),
      this.getIngresosPorDepartamento(inicioMes.toISOString(), hoy.toISOString()),
      this.getIndicadoresLiquidez()
    ]);

    return {
      resumenMes: {
        ingresos: kpisMes.ingresos.total,
        gastos: (kpisMes.cuentasPorPagar.totalPagado || 0) + (kpisMes.nomina.total || 0),
        utilidad: kpisMes.utilidadBruta,
        margen: kpisMes.margenBruto
      },
      resumenAño: {
        ingresos: kpisAño.ingresos.total,
        utilidad: kpisAño.utilidadBruta
      },
      cartera: kpisMes.cartera,
      cuentasPorPagar: kpisMes.cuentasPorPagar,
      inventario: kpisMes.inventario,
      activosFijos: kpisMes.activosFijos,
      liquidez,
      tendencias,
      ingresosPorDepartamento: ingresosPorDepto
    };
  }
}

module.exports = new DashboardFinancieroService();
