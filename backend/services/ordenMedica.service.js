/**
 * Service de órdenes médicas
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class OrdenMedicaService {
  /**
   * Obtener todas las órdenes médicas con filtros
   */
  async getAll({ 
    page = 1, 
    limit = 20, 
    paciente_id, 
    estado, 
    cita_id,
    admision_id 
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(paciente_id && { pacienteId: paciente_id }),
      ...(estado && { estado }),
      ...(cita_id && { citaId: cita_id }),
      ...(admision_id && { admisionId: admision_id }),
    };

    const [ordenes, total] = await Promise.all([
      prisma.ordenMedica.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaOrden: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
            },
          },
          examenProcedimiento: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              descripcion: true,
              duracionMinutos: true,
              categoria: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
          doctor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          ejecutador: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      prisma.ordenMedica.count({ where }),
    ]);

    return {
      ordenes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una orden médica por ID
   */
  async getById(id) {
    const orden = await prisma.ordenMedica.findUnique({
      where: { id },
      include: {
        paciente: true,
        examenProcedimiento: {
          include: {
            categoria: true,
          },
        },
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        ejecutador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        cita: true,
        admision: true,
      },
    });

    if (!orden) {
      throw new NotFoundError('Orden médica no encontrada');
    }

    return orden;
  }

  /**
   * Crear una nueva orden médica
   */
  async create(data) {
    // Validar campos requeridos
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');
    if (!data.examen_procedimiento_id) throw new ValidationError('examen_procedimiento_id es requerido');
    if (!data.doctor_id) throw new ValidationError('doctor_id es requerido');
    if (!data.precio_aplicado) throw new ValidationError('precio_aplicado es requerido');

    const orden = await prisma.ordenMedica.create({
      data: {
        pacienteId: data.paciente_id,
        citaId: data.cita_id || null,
        admisionId: data.admision_id || null,
        examenProcedimientoId: data.examen_procedimiento_id,
        doctorId: data.doctor_id,
        estado: data.estado || 'Pendiente',
        prioridad: data.prioridad || 'Normal',
        observaciones: data.observaciones || null,
        precioAplicado: parseFloat(data.precio_aplicado),
        fechaOrden: data.fecha_orden ? new Date(data.fecha_orden) : new Date(),
      },
      include: {
        paciente: true,
        examenProcedimiento: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return orden;
  }

  /**
   * Actualizar una orden médica
   */
  async update(id, data) {
    await this.getById(id);

    const updateData = {};
    
    if (data.estado) updateData.estado = data.estado;
    if (data.prioridad) updateData.prioridad = data.prioridad;
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
    if (data.resultados !== undefined) updateData.resultados = data.resultados;
    if (data.archivo_resultado !== undefined) updateData.archivoResultado = data.archivo_resultado;
    if (data.precio_aplicado) updateData.precioAplicado = parseFloat(data.precio_aplicado);
    if (data.fecha_ejecucion) updateData.fechaEjecucion = new Date(data.fecha_ejecucion);
    if (data.ejecutado_por) updateData.ejecutadoPor = data.ejecutado_por;

    const orden = await prisma.ordenMedica.update({
      where: { id },
      data: updateData,
      include: {
        paciente: true,
        examenProcedimiento: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        ejecutador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return orden;
  }

  /**
   * Completar una orden médica (registrar resultados)
   */
  async completar(id, data, ejecutadoPorId) {
    await this.getById(id);

    // Ensure resultados is stored as a string if it's an object
    let resultados = data.resultados;
    if (typeof resultados === 'object' && resultados !== null) {
      resultados = JSON.stringify(resultados);
    }

    const orden = await prisma.ordenMedica.update({
      where: { id },
      data: {
        estado: 'Completada',
        resultados: resultados,
        archivoResultado: data.archivo_resultado || null,
        fechaEjecucion: new Date(),
        ejecutadoPor: ejecutadoPorId,
      },
      include: {
        paciente: true,
        examenProcedimiento: true,
      },
    });

    return orden;
  }

  /**
   * Cancelar una orden médica
   */
  async cancelar(id, observaciones) {
    await this.getById(id);

    const orden = await prisma.ordenMedica.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        observaciones,
      },
    });

    return orden;
  }

  /**
   * Eliminar una orden médica
   */
  async delete(id) {
    await this.getById(id);
    await prisma.ordenMedica.delete({ where: { id } });
    return true;
  }
}

module.exports = new OrdenMedicaService();
