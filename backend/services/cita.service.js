/**
 * Service de citas
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Convierte una fecha string a Date sin conversión de timezone
 * Maneja la fecha exactamente como viene
 */
function parseSimpleDate(dateString) {
  if (!dateString) return null;
  // Crear fecha sin conversión de timezone
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date;
}

class CitaService {
  /**
   * Obtener todas las citas
   */
  async getAll({ page = 1, limit = 10, fecha = '', fechaDesde = '', estado = '', pacienteId = '', doctorId = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(fecha && { fecha: parseSimpleDate(fecha) }),
      ...(fechaDesde && { fecha: { gte: parseSimpleDate(fechaDesde) } }),
      ...(estado && { estado }),
      ...(pacienteId && { pacienteId }),
      ...(doctorId && { doctorId }),
    };

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        include: {
          paciente: { select: { id: true, nombre: true, apellido: true, cedula: true, telefono: true, email: true } },
          doctor: { select: { id: true, nombre: true, apellido: true } },
          especialidad: { select: { id: true, titulo: true, costoCOP: true, duracionMinutos: true } },
          examenProcedimiento: { select: { id: true, nombre: true, tipo: true, costoBase: true, duracionMinutos: true } },
        },
      }),
      prisma.cita.count({ where }),
    ]);

    // Formatear respuesta
    const citasFormateadas = citas.map(cita => ({
      ...cita,
      doctor: cita.doctor ? {
        id: cita.doctor.id,
        usuario: {
          nombre: cita.doctor.nombre,
          apellido: cita.doctor.apellido,
        }
      } : null,
    }));

    return {
      citas: citasFormateadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener una cita por ID
   */
  async getById(id) {
    const cita = await prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
        especialidad: true,
        examenProcedimiento: true,
      },
    });

    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    return cita;
  }

  /**
   * Crear factura para una cita (dentro de una transacción)
   */
  async crearFacturaCita(cita, metodoPago = 'Efectivo', estadoPago = 'Pendiente', cubiertoPorEPS = false, tx = null) {
    const client = tx || prisma;
    
    // Generar número de factura único
    const año = new Date().getFullYear();
    const ultimaFactura = await client.factura.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    
    let numeroFactura = `F-${año}-00001`;
    if (ultimaFactura && ultimaFactura.numero.startsWith(`F-${año}-`)) {
      const ultimoNumero = parseInt(ultimaFactura.numero.split('-')[2]);
      numeroFactura = `F-${año}-${String(ultimoNumero + 1).padStart(5, '0')}`;
    }

    // Calcular montos
    const subtotal = parseFloat(cita.costo);
    const total = subtotal;
    const saldoPendiente = estadoPago === 'Pagado' ? 0 : total;

    // Crear factura con su item
    const factura = await client.factura.create({
      data: {
        numero: numeroFactura,
        pacienteId: cita.pacienteId,
        estado: estadoPago === 'Pagado' ? 'Pagada' : 'Pendiente',
        subtotal,
        total,
        saldoPendiente,
        cubiertoPorEPS,
        items: {
          create: {
            tipo: 'Consulta',
            descripcion: `Cita - ${cita.motivo || 'Consulta médica'}`,
            cantidad: 1,
            precioUnitario: subtotal,
            subtotal,
            citaId: cita.id,
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Si está pagado, crear registro de pago
    if (estadoPago === 'Pagado') {
      await client.pago.create({
        data: {
          facturaId: factura.id,
          monto: total,
          metodoPago: metodoPago === 'Transferencia' ? 'Transferencia' : 
                     metodoPago === 'Tarjeta' ? 'Tarjeta' : 
                     metodoPago === 'EPS' ? 'EPS' : 'Efectivo',
        },
      });
    }

    return factura;
  }

  /**
   * Crear una cita
   */
  async create(data) {
    // Validar campos requeridos (doctor_id, motivo y notas son opcionales)
    const missing = validateRequired(['paciente_id', 'fecha', 'hora', 'costo'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Validar que el costo sea válido (puede ser 0 para citas PorAgendar)
    if (data.costo === undefined || data.costo === null || isNaN(parseFloat(data.costo))) {
      throw new ValidationError('El costo debe ser un número válido');
    }
    
    // Si el estado es PorAgendar, permitir costo 0, de lo contrario debe ser > 0
    if (data.estado !== 'PorAgendar' && parseFloat(data.costo) <= 0) {
      throw new ValidationError('El costo debe ser mayor a cero');
    }

    // Verificar disponibilidad del doctor (solo si se proporciona)
    if (data.doctor_id) {
      const conflicto = await prisma.cita.findFirst({
        where: {
          doctorId: data.doctor_id,
          fecha: parseSimpleDate(data.fecha),
          hora: new Date(`1970-01-01T${data.hora}Z`),
          estado: { notIn: ['Cancelada', 'NoAsistio'] },
        },
      });
 
      if (conflicto) {
        throw new ValidationError('El doctor ya tiene una cita programada en ese horario');
      }
    }

    // Crear cita y factura en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear cita
      const cita = await tx.cita.create({
        data: {
          pacienteId: data.paciente_id,
          doctorId: data.doctor_id || null,
          admisionId: data.admision_id || null,
          especialidadId: data.especialidad_id,
          examenProcedimientoId: data.examen_procedimiento_id || null,
          tipoCita: data.tipo_cita || 'Especialidad',
          fecha: parseSimpleDate(data.fecha),
          hora:  new Date(`1970-01-01T${data.hora}Z`),
          duracionMinutos: data.duracion_minutos || 30,
          costo: parseFloat(data.costo),
          motivo: data.motivo || null,
          notas: data.notas || null,
          estado: data.estado || 'Programada',
          prioridad: data.prioridad || 'Media',
        },
      });

      // Crear factura automáticamente
      await this.crearFacturaCita(cita, data.metodo_pago, data.estado_pago, data.cubierto_por_eps, tx);

      return cita;
    });

    return resultado;
  }

  /**
   * Actualizar una cita
   */
  async update(id, data) {
    // Verificar que existe
    const citaExistente = await this.getById(id);

    // Validar costo si se proporciona
    if (data.costo !== undefined && parseFloat(data.costo) <= 0) {
      throw new ValidationError('El costo debe ser mayor a cero');
    }

    // Construir datos de actualización
    const updateData = {};
    if (data.fecha) updateData.fecha = parseSimpleDate(data.fecha);
    if (data.hora) updateData.hora = new Date(`1970-01-01T${data.hora}Z`);
    if (data.motivo) updateData.motivo = data.motivo;
    if (data.notas !== undefined) updateData.notas = data.notas;
    if (data.estado) updateData.estado = data.estado;
    if (data.especialidad_id !== undefined) updateData.especialidadId = data.especialidad_id;
    if (data.doctor_id !== undefined) updateData.doctorId = data.doctor_id;
    if (data.costo !== undefined) updateData.costo = parseFloat(data.costo);

    // Actualizar en transacción para manejar factura
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar cita
      const cita = await tx.cita.update({
        where: { id },
        data: updateData,
      });

      // Si la cita tenía estado PorAgendar y ahora se está programando, crear factura
      if (citaExistente.estado === 'PorAgendar' && data.estado === 'Programada' && !citaExistente.facturaCreada) {
        // Buscar si ya existe factura para esta cita
        const facturaExistente = await tx.facturaItem.findFirst({
          where: { citaId: id },
          include: { factura: true },
        });

        if (!facturaExistente) {
          await this.crearFacturaCita(cita, data.metodo_pago, data.estado_pago, data.cubierto_por_eps, tx);
        }
      }

      // Si se actualizó el costo, actualizar la factura si existe
      if (data.costo !== undefined) {
        const facturaItem = await tx.facturaItem.findFirst({
          where: { citaId: id },
          include: { factura: true },
        });

        if (facturaItem) {
          const nuevoCosto = parseFloat(data.costo);
          
          // Actualizar item de factura
          await tx.facturaItem.update({
            where: { id: facturaItem.id },
            data: {
              precioUnitario: nuevoCosto,
              subtotal: nuevoCosto,
            },
          });

          // Actualizar totales de factura
          await tx.factura.update({
            where: { id: facturaItem.facturaId },
            data: {
              subtotal: nuevoCosto,
              total: nuevoCosto,
              saldoPendiente: nuevoCosto,
            },
          });
        }
      }

      return cita;
    });

    return resultado;
  }

  /**
   * Cancelar una cita
   */
  async cancel(id) {
    await this.getById(id);

    const cita = await prisma.cita.update({
      where: { id },
      data: { estado: 'Cancelada' },
    });

    return cita;
  }
}

module.exports = new CitaService();
