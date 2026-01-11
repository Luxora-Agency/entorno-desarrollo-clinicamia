/**
 * Service de Administración de Medicamentos (Enfermería)
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class AdministracionService {
  /**
   * Obtener administraciones programadas
   */
  async getAdministracionesProgramadas({ 
    fecha,
    pacienteId,
    enfermera,
    estado,
    unidadId,
    page = 1,
    limit = 100
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (fecha) {
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      
      where.fechaProgramada = {
        gte: fechaInicio,
        lt: fechaFin,
      };
    }
    
    if (pacienteId) where.pacienteId = pacienteId;
    if (enfermera) where.administradoPor = enfermera;
    if (estado) where.estado = estado;

    const [administraciones, total] = await Promise.all([
      prisma.administracionMedicamento.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { fechaProgramada: 'asc' },
          { horaProgramada: 'asc' },
        ],
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              admisiones: {
                where: { estado: 'Activa' },
                select: {
                  id: true,
                  cama: {
                    select: {
                      numero: true,
                      habitacion: {
                        select: {
                          numero: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          prescripcionMedicamento: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true, // Also usually 'nombre' in Producto model, not nombreGenerico
                  // nombreComercial: true, // Producto has 'nombre'
                  concentracion: true,
                  // formaFarmaceutica: true, // Maybe 'presentacion'?
                },
              },
              prescripcion: {
                select: {
                  id: true,
                  medico: {
                    select: {
                      nombre: true,
                      apellido: true,
                    },
                  },
                },
              },
            },
          },
          enfermera: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      prisma.administracionMedicamento.count({ where }),
    ]);

    return {
      data: administraciones,
      total,
      limit: parseInt(limit),
      offset: skip,
    };
  }

  /**
   * Registrar administración de medicamento
   */
  async registrarAdministracion(id, data, enfermeraId) {
    const administracion = await prisma.administracionMedicamento.findUnique({
      where: { id },
      include: {
        prescripcionMedicamento: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!administracion) {
      throw new NotFoundError('Administración no encontrada');
    }

    if (administracion.estado !== 'Programada') {
      throw new ValidationError('Esta administración ya fue procesada');
    }

    const updated = await prisma.administracionMedicamento.update({
      where: { id },
      data: {
        estado: 'Administrada',
        fechaAdministracion: new Date(),
        administradoPor: enfermeraId,
        dosisAdministrada: data.dosisAdministrada || administracion.prescripcionMedicamento.dosis,
        viaAdministrada: data.viaAdministrada || administracion.prescripcionMedicamento.via,
        observaciones: data.observaciones,
        reaccionAdversa: data.reaccionAdversa || false,
        descripcionReaccion: data.descripcionReaccion,
      },
    });

    // Si hay reacción adversa, crear alerta clínica
    if (data.reaccionAdversa) {
      await prisma.alertaClinica.create({
        data: {
          pacienteId: administracion.pacienteId,
          tipoAlerta: 'AlergiaMedicamento', // Matching enum in schema
          titulo: `Reacción adversa a ${administracion.prescripcionMedicamento.producto.nombre}`,
          descripcion: data.descripcionReaccion || 'Reacción adversa al medicamento',
          severidad: 'Moderada', // Matching enum
          activa: true,
        },
      });
    }

    return updated;
  }

  /**
   * Registrar omisión de medicamento
   */
  async registrarOmision(id, motivo, enfermeraId) {
    const administracion = await prisma.administracionMedicamento.findUnique({
      where: { id },
    });

    if (!administracion) {
      throw new NotFoundError('Administración no encontrada');
    }

    if (administracion.estado !== 'Programada') {
      throw new ValidationError('Esta administración ya fue procesada');
    }

    const updated = await prisma.administracionMedicamento.update({
      where: { id },
      data: {
        estado: 'Omitida',
        administradoPor: enfermeraId,
        motivoOmision: motivo,
      },
    });

    return updated;
  }

  /**
   * Registrar rechazo del paciente
   */
  async registrarRechazo(id, motivo, enfermeraId) {
    const administracion = await prisma.administracionMedicamento.findUnique({
      where: { id },
    });

    if (!administracion) {
      throw new NotFoundError('Administración no encontrada');
    }

    if (administracion.estado !== 'Programada') {
      throw new ValidationError('Esta administración ya fue procesada');
    }

    const updated = await prisma.administracionMedicamento.update({
      where: { id },
      data: {
        estado: 'Rechazada',
        administradoPor: enfermeraId,
        motivoRechazo: motivo,
      },
    });

    return updated;
  }

  /**
   * Obtener resumen de administraciones del día
   */
  async getResumenDia(fecha, unidadId) {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    const where = {
      fechaProgramada: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    };

    const [total, administradas, omitidas, rechazadas, pendientes] = await Promise.all([
      prisma.administracionMedicamento.count({ where }),
      prisma.administracionMedicamento.count({ 
        where: { ...where, estado: 'Administrada' } 
      }),
      prisma.administracionMedicamento.count({ 
        where: { ...where, estado: 'Omitida' } 
      }),
      prisma.administracionMedicamento.count({ 
        where: { ...where, estado: 'Rechazada' } 
      }),
      prisma.administracionMedicamento.count({ 
        where: { ...where, estado: 'Programada' } 
      }),
    ]);

    const porcentajeAdministrado = total > 0 ? ((administradas / total) * 100).toFixed(1) : 0;

    return {
      fecha,
      total,
      administradas,
      omitidas,
      rechazadas,
      pendientes,
      porcentajeAdministrado: parseFloat(porcentajeAdministrado),
    };
  }

  /**
   * Obtener historial de administración de un paciente
   */
  async getHistorialPaciente(pacienteId, limit = 50) {
    const administraciones = await prisma.administracionMedicamento.findMany({
      where: {
        pacienteId,
        estado: { not: 'Programada' },
      },
      take: parseInt(limit),
      orderBy: { fechaAdministracion: 'desc' },
      include: {
        prescripcionMedicamento: {
          include: {
            medicamento: {
              select: {
                nombreGenerico: true,
                nombreComercial: true,
              },
            },
          },
        },
        enfermera: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return administraciones;
  }

  /**
   * Obtener administraciones pendientes de un paciente
   */
  async getAdministracionesPendientesPaciente(pacienteId) {
    const ahora = new Date();
    
    const administraciones = await prisma.administracionMedicamento.findMany({
      where: {
        pacienteId,
        estado: 'Programada',
        fechaProgramada: { lte: ahora },
      },
      orderBy: [
        { fechaProgramada: 'asc' },
        { horaProgramada: 'asc' },
      ],
      include: {
        prescripcionMedicamento: {
          include: {
            medicamento: true,
          },
        },
      },
    });

    return administraciones;
  }
}

module.exports = new AdministracionService();
