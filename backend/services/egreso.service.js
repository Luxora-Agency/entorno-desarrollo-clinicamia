/**
 * Service de egresos hospitalarios
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const crypto = require('crypto');

class EgresoService {
  /**
   * Obtener todos los egresos con filtros
   */
  async getAll({ 
    page = 1, 
    limit = 20, 
    paciente_id, 
    tipo_egreso,
    fecha_desde,
    fecha_hasta
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(paciente_id && { 
        admision: { pacienteId: paciente_id } 
      }),
      ...(tipo_egreso && { tipoEgreso: tipo_egreso }),
      ...(fecha_desde && fecha_hasta && {
        fechaEgreso: {
          gte: new Date(fecha_desde),
          lte: new Date(fecha_hasta),
        }
      }),
    };

    const [egresos, total] = await Promise.all([
      prisma.egreso.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaEgreso: 'desc' },
        include: {
          admision: {
            include: {
              paciente: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  cedula: true,
                  tipoSangre: true,
                },
              },
              unidad: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      }),
      prisma.egreso.count({ where }),
    ]);

    return {
      egresos,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  /**
   * Obtener egreso por ID
   */
  async getById(id) {
    const egreso = await prisma.egreso.findUnique({
      where: { id },
      include: {
        admision: {
          include: {
            paciente: true,
            unidad: true,
            cama: {
              include: {
                habitacion: true,
              },
            },
          },
        },
      },
    });

    if (!egreso) {
      throw new NotFoundError('Egreso no encontrado');
    }

    return egreso;
  }

  /**
   * Obtener egreso por admisión ID
   */
  async getByAdmisionId(admisionId) {
    const egreso = await prisma.egreso.findUnique({
      where: { admisionId },
      include: {
        admision: {
          include: {
            paciente: true,
            unidad: true,
          },
        },
      },
    });

    return egreso; // Puede ser null si no existe
  }

  /**
   * Crear nuevo egreso
   */
  async create(data) {
    // Validaciones
    this.validateEgresoData(data);

    // Verificar que la admisión existe y está activa
    const admision = await prisma.admision.findUnique({
      where: { id: data.admision_id },
      include: {
        paciente: true,
        cama: true,
      },
    });

    if (!admision) {
      throw new NotFoundError('Admisión no encontrada');
    }

    if (admision.estado === 'Egresada') {
      throw new ValidationError('Esta admisión ya tiene un egreso registrado');
    }

    // Generar firma digital (hash del contenido crítico)
    const firmaDigital = this.generarFirmaDigital(data);

    // Crear egreso en transacción
    const egreso = await prisma.$transaction(async (tx) => {
      // 1. Crear el egreso
      const nuevoEgreso = await tx.egreso.create({
        data: {
          admisionId: data.admision_id,
          fechaEgreso: data.fecha_egreso || new Date(),
          horaEgreso: data.hora_egreso || new Date(),
          diagnosticoSalida: data.diagnostico_salida,
          descripcionDiagnostico: data.descripcion_diagnostico,
          resumenClinico: data.resumen_clinico,
          tratamientoDomiciliario: data.tratamiento_domiciliario,
          recomendaciones: data.recomendaciones,
          profesionalResponsableId: data.profesional_responsable_id,
          tipoEgreso: data.tipo_egreso,
          estadoPaciente: data.estado_paciente,
          requiereControl: data.requiere_control || false,
          fechaControl: data.fecha_control,
          observaciones: data.observaciones,
          firmaDigital,
        },
      });

      // 2. Actualizar estado de la admisión
      await tx.admision.update({
        where: { id: data.admision_id },
        data: {
          estado: 'Egresada',
          fechaEgreso: data.fecha_egreso || new Date(),
          diagnosticoEgreso: data.diagnostico_salida,
          responsableEgreso: data.profesional_responsable_id,
        },
      });

      // 3. Liberar la cama (si está asignada)
      if (admision.camaId) {
        await tx.cama.update({
          where: { id: admision.camaId },
          data: { estado: 'Mantenimiento' }, // Requiere limpieza antes de ser disponible
        });
      }

      return nuevoEgreso;
    });

    // Retornar con las relaciones
    return this.getById(egreso.id);
  }

  /**
   * Actualizar egreso (solo campos no críticos)
   */
  async update(id, data) {
    const egresoExistente = await this.getById(id);

    // Solo permitir actualizar campos no críticos
    const camposActualizables = {
      ...(data.observaciones !== undefined && { observaciones: data.observaciones }),
      ...(data.requiere_control !== undefined && { requiereControl: data.requiere_control }),
      ...(data.fecha_control !== undefined && { fechaControl: data.fecha_control }),
    };

    const egresoActualizado = await prisma.egreso.update({
      where: { id },
      data: camposActualizables,
    });

    return this.getById(egresoActualizado.id);
  }

  /**
   * Validar datos de egreso
   */
  validateEgresoData(data) {
    if (!data.admision_id) {
      throw new ValidationError('El ID de admisión es requerido');
    }

    if (!data.diagnostico_salida) {
      throw new ValidationError('El diagnóstico de salida es requerido');
    }

    if (!data.descripcion_diagnostico) {
      throw new ValidationError('La descripción del diagnóstico es requerida');
    }

    if (!data.resumen_clinico) {
      throw new ValidationError('El resumen clínico es requerido');
    }

    if (!data.profesional_responsable_id) {
      throw new ValidationError('El profesional responsable es requerido');
    }

    if (!data.tipo_egreso) {
      throw new ValidationError('El tipo de egreso es requerido');
    }

    const tiposValidos = ['AltaMedica', 'Remision', 'Voluntario', 'Fallecimiento', 'Fuga'];
    if (!tiposValidos.includes(data.tipo_egreso)) {
      throw new ValidationError(`Tipo de egreso inválido. Valores válidos: ${tiposValidos.join(', ')}`);
    }

    if (!data.estado_paciente) {
      throw new ValidationError('El estado del paciente es requerido');
    }

    const estadosValidos = ['Mejorado', 'Estable', 'Complicado', 'Fallecido'];
    if (!estadosValidos.includes(data.estado_paciente)) {
      throw new ValidationError(`Estado del paciente inválido. Valores válidos: ${estadosValidos.join(', ')}`);
    }

    if (data.requiere_control && !data.fecha_control) {
      throw new ValidationError('Si requiere control, debe especificar la fecha de control');
    }
  }

  /**
   * Generar firma digital del egreso
   */
  generarFirmaDigital(data) {
    const contenidoCritico = JSON.stringify({
      admision_id: data.admision_id,
      diagnostico_salida: data.diagnostico_salida,
      fecha_egreso: data.fecha_egreso,
      profesional_responsable_id: data.profesional_responsable_id,
      timestamp: new Date().toISOString(),
    });

    return crypto.createHash('sha256').update(contenidoCritico).digest('hex');
  }

  /**
   * Obtener estadísticas de egresos
   */
  async getEstadisticas({ fecha_desde, fecha_hasta }) {
    const where = {};
    
    if (fecha_desde && fecha_hasta) {
      where.fechaEgreso = {
        gte: new Date(fecha_desde),
        lte: new Date(fecha_hasta),
      };
    }

    const [
      totalEgresos,
      porTipo,
      porEstadoPaciente,
      promedioEstancia,
    ] = await Promise.all([
      prisma.egreso.count({ where }),
      
      prisma.egreso.groupBy({
        by: ['tipoEgreso'],
        where,
        _count: true,
      }),
      
      prisma.egreso.groupBy({
        by: ['estadoPaciente'],
        where,
        _count: true,
      }),
      
      // Calcular promedio de días de estancia
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (e.fecha_egreso - a.fecha_ingreso))) as promedio_dias
        FROM egresos e
        INNER JOIN admisiones a ON e.admision_id = a.id
        ${fecha_desde && fecha_hasta ? prisma.Prisma.sql`WHERE e.fecha_egreso BETWEEN ${fecha_desde}::timestamp AND ${fecha_hasta}::timestamp` : prisma.Prisma.empty}
      `,
    ]);

    return {
      total_egresos: totalEgresos,
      por_tipo: porTipo,
      por_estado_paciente: porEstadoPaciente,
      promedio_estancia_dias: promedioEstancia[0]?.promedio_dias || 0,
    };
  }
}

module.exports = new EgresoService();
