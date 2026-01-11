const prisma = require('../db/prisma');
const { startOfMonth, endOfMonth, subMonths, format } = require('date-fns');

class ReportesService {
  async getGeneralStats(query) {
    const { periodo } = query; // dia, semana, mes, trimestre, ano
    
    let startDate = startOfMonth(new Date());
    let endDate = endOfMonth(new Date());
    
    // Logic to adjust startDate/endDate based on 'periodo' could be added here
    // For now defaulting to current month logic as requested

    // 1. Total Pacientes
    const totalPacientes = await prisma.paciente.count();

    // 2. Pacientes Nuevos (this month)
    const pacientesNuevos = await prisma.paciente.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 3. Consultas Realizadas
    const consultasRealizadas = await prisma.cita.count({
      where: {
        estado: 'Completada',
        fecha: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 3.1 Evoluciones (HCE)
    const evolucionesRealizadas = await prisma.evolucionClinica.count({
      where: {
        fechaEvolucion: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 4. Ocupación Camas
    const totalCamas = await prisma.cama.count();
    const camasOcupadas = await prisma.cama.count({
      where: {
        estado: 'Ocupada',
      },
    });
    const ocupacionCamas = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;

    // 5. Ingresos (Facturas)
    const facturas = await prisma.factura.findMany({
      where: {
        fechaEmision: {
          gte: startDate,
          lte: endDate,
        },
        estado: {
          not: 'Cancelada',
        },
      },
      select: {
        total: true,
      },
    });
    const ingresosMes = facturas.reduce((sum, f) => sum + Number(f.total), 0);

    // 6. Gastos (Estimated)
    const ordenesMedicas = await prisma.ordenMedica.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        estado: 'Completada'
      },
      include: {
        examenProcedimiento: true
      }
    });
    
    const ordenesMedicamentos = await prisma.ordenMedicamentoItem.findMany({
      where: {
        ordenMedicamento: {
          createdAt: { gte: startDate, lte: endDate },
          estado: 'Despachada'
        }
      },
      include: {
        producto: true
      }
    });

    let gastosMes = 0;
    ordenesMedicas.forEach(o => {
      gastosMes += Number(o.examenProcedimiento?.costoBase || 0);
    });
    ordenesMedicamentos.forEach(o => {
      gastosMes += (Number(o.producto?.precioCompra || 0) * o.cantidad);
    });

    // 7. Utilidad
    const utilidad = ingresosMes - gastosMes;

    // 8. Satisfacción (from PQRSF which has satisfaccionRespuesta field)
    let satisfaccion = 0;
    try {
      const pqrsf = await prisma.pQRSF.findMany({
        where: {
          satisfaccionRespuesta: { not: null },
        },
        select: {
          satisfaccionRespuesta: true,
        },
      });
      const totalScore = pqrsf.reduce((sum, p) => sum + (p.satisfaccionRespuesta || 0), 0);
      satisfaccion = pqrsf.length > 0 ? (totalScore / pqrsf.length).toFixed(1) : 4.5;
    } catch (e) {
      // Default satisfaction if model not available
      satisfaccion = 4.5;
    }

    return {
      totalPacientes,
      pacientesNuevos,
      consultasRealizadas,
      evolucionesRealizadas,
      ocupacionCamas,
      ingresosMes,
      gastosMes,
      utilidad,
      satisfaccion,
    };
  }

  async getFinancialStats() {
    // Last 7 months
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push({
        start: startOfMonth(d),
        end: endOfMonth(d),
        label: format(d, 'MMM'),
      });
    }

    const data = [];

    for (const month of months) {
      const facturas = await prisma.factura.findMany({
        where: {
          fechaEmision: { gte: month.start, lte: month.end },
          estado: { not: 'Cancelada' },
        },
        select: { total: true },
      });
      const ingresos = facturas.reduce((sum, f) => sum + Number(f.total), 0);

      // Estimate expenses
      const ordenesMedicas = await prisma.ordenMedica.findMany({
        where: {
          createdAt: { gte: month.start, lte: month.end },
          estado: 'Completada'
        },
        include: { examenProcedimiento: true }
      });
      const ordenesMedicamentos = await prisma.ordenMedicamentoItem.findMany({
        where: {
          ordenMedicamento: {
            createdAt: { gte: month.start, lte: month.end },
            estado: 'Despachada'
          }
        },
        include: { producto: true }
      });

      let gastos = 0;
      ordenesMedicas.forEach(o => gastos += Number(o.examenProcedimiento?.costoBase || 0));
      ordenesMedicamentos.forEach(o => gastos += (Number(o.producto?.precioCompra || 0) * o.cantidad));

      data.push({
        mes: month.label,
        ingresos,
        gastos,
      });
    }

    return data;
  }

  async getOccupancyStats() {
    // 6-month trend
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push({
        date: endOfMonth(d),
        label: format(d, 'MMM'),
      });
    }

    const totalCamas = await prisma.cama.count();
    
    const data = [];
    for (const month of months) {
      const activeAdmisions = await prisma.admision.count({
        where: {
          fechaIngreso: { lte: month.date },
          OR: [
            { fechaEgreso: null },
            { fechaEgreso: { gte: month.date } }
          ]
        }
      });
      
      const ocupacion = totalCamas > 0 ? Math.round((activeAdmisions / totalCamas) * 100) : 0;
      
      data.push({
        mes: month.label,
        ocupacion,
        capacidad: 100
      });
    }

    return data;
  }

  async getSpecialtyStats() {
    const citas = await prisma.cita.groupBy({
      by: ['especialidadId'],
      _count: {
        id: true,
      },
      where: {
        estado: 'Completada',
        especialidadId: { not: null }
      }
    });

    const especialidades = await prisma.especialidad.findMany({
      where: {
        id: { in: citas.map(c => c.especialidadId) }
      }
    });

    const total = citas.reduce((sum, c) => sum + c._count.id, 0);

    const data = citas.map(c => {
      const esp = especialidades.find(e => e.id === c.especialidadId);
      return {
        especialidad: esp ? esp.titulo : 'Desconocida',
        cantidad: c._count.id,
        porcentaje: total > 0 ? Math.round((c._count.id / total) * 100) : 0
      };
    }).sort((a, b) => b.cantidad - a.cantidad);

    return data;
  }

  async getDemographicsStats() {
    const pacientes = await prisma.paciente.findMany({
      select: { fechaNacimiento: true }
    });

    const ranges = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };

    const now = new Date();
    pacientes.forEach(p => {
      if (!p.fechaNacimiento) return;
      const age = now.getFullYear() - p.fechaNacimiento.getFullYear();
      
      if (age <= 18) ranges['0-18']++;
      else if (age <= 35) ranges['19-35']++;
      else if (age <= 50) ranges['36-50']++;
      else if (age <= 65) ranges['51-65']++;
      else ranges['65+']++;
    });

    const data = Object.keys(ranges).map(r => ({
      rango: r,
      cantidad: ranges[r]
    }));

    return data;
  }

  async getServicesStats() {
    const topServices = await prisma.ordenMedica.groupBy({
      by: ['examenProcedimientoId'],
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' }
      },
      take: 10
    });

    const examenes = await prisma.examenProcedimiento.findMany({
      where: {
        id: { in: topServices.map(s => s.examenProcedimientoId) }
      }
    });

    const data = topServices.map(s => {
      const exam = examenes.find(e => e.id === s.examenProcedimientoId);
      return {
        servicio: exam ? exam.nombre : 'Desconocido',
        cantidad: s._count.id,
        variacion: '+0%' 
      };
    });

    return data;
  }

  async getDoctorsStats() {
    const doctores = await prisma.doctor.findMany({
      include: {
        usuario: true
      }
    });

    const data = [];
    for (const doc of doctores) {
      const consultas = await prisma.cita.count({
        where: { doctorId: doc.usuarioId, estado: 'Completada' }
      });
      
      const cirugias = await prisma.procedimiento.count({
        where: { medicoResponsableId: doc.usuarioId, tipo: 'Quirurgico' }
      });

      const ordenesVal = await prisma.ordenMedica.aggregate({
        where: { doctorId: doc.usuarioId, estado: 'Completada' },
        _sum: { precioAplicado: true }
      });

      data.push({
        medico: `${doc.usuario.nombre} ${doc.usuario.apellido}`,
        consultas,
        cirugias,
        satisfaccion: 4.5, 
        ingresos: Number(ordenesVal._sum.precioAplicado || 0)
      });
    }

    return data.sort((a, b) => b.ingresos - a.ingresos).slice(0, 10);
  }

  async getQualityStats() {
    // Use PQRSF which has satisfaccionRespuesta field
    let satisfaccionAvg = 4.5;
    try {
      const pqrsf = await prisma.pQRSF.findMany({
        where: { satisfaccionRespuesta: { not: null } }
      });
      satisfaccionAvg = pqrsf.length > 0
        ? (pqrsf.reduce((sum, p) => sum + (p.satisfaccionRespuesta || 0), 0) / pqrsf.length)
        : 4.5;
    } catch (e) {
      // Default if model not available
      satisfaccionAvg = 4.5;
    }

    const urgencias = await prisma.atencionUrgencia.findMany({
      where: { horaInicioAtencion: { not: null } },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });
    
    let tiempoEspera = 0;
    if (urgencias.length > 0) {
      const totalMin = urgencias.reduce((sum, u) => {
        const diff = (new Date(u.horaInicioAtencion) - new Date(u.horaLlegada)) / 60000;
        return sum + diff;
      }, 0);
      tiempoEspera = Math.round(totalMin / urgencias.length);
    }

    const totalCamas = await prisma.cama.count();
    const camasOcupadas = await prisma.cama.count({ where: { estado: 'Ocupada' } });
    const ocupacion = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;

    const data = [
      { indicador: 'Satisfacción del Paciente', valor: satisfaccionAvg.toFixed(1), meta: 4.5, cumple: satisfaccionAvg >= 4.5 },
      { indicador: 'Tiempo de Espera Urgencias (min)', valor: tiempoEspera, meta: 30, cumple: tiempoEspera <= 30 },
      { indicador: 'Tasa de Ocupación (%)', valor: ocupacion, meta: 75, cumple: ocupacion >= 75 },
    ];

    return data;
  }

  async getAuditStats() {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    const data = logs.map(log => ({
      id: log.id.substring(0, 8),
      fecha: format(log.createdAt, 'yyyy-MM-dd HH:mm'),
      usuario: log.user ? `${log.user.nombre} ${log.user.apellido}` : 'Sistema',
      accion: log.action,
      modulo: log.resource,
      detalle: JSON.stringify(log.details || {}).substring(0, 50) + '...',
      tipo: log.action.includes('CREATE') ? 'Creación' : log.action.includes('UPDATE') ? 'Modificación' : log.action.includes('DELETE') ? 'Eliminación' : 'Registro'
    }));

    return data;
  }
}

module.exports = new ReportesService();
