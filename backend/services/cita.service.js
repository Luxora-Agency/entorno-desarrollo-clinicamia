/**
 * Service de citas
 *
 * IMPORTANTE: La validación de disponibilidad se realiza DENTRO de la transacción
 * para prevenir race conditions y doble-reservación de citas.
 *
 * NOTA SOBRE IDs:
 * - `Cita.doctorId` apunta a `Usuario.id` (el usuario que es doctor), NO a `Doctor.id`
 * - Esto permite que los usuarios con rol DOCTOR tengan citas directamente asociadas
 * - Para obtener datos del perfil de doctor, use: prisma.doctor.findFirst({ where: { usuarioId: doctorId } })
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { createCitaSchema, updateCitaSchema } = require('../validators/cita.schema');
const { addMinutes, isBefore, isAfter, isEqual } = require('date-fns');
const disponibilidadService = require('./disponibilidad.service');
const { parseSimpleDate, duracionValida } = require('../utils/date');
const emailService = require('./email.service');

// Código de error de Prisma para violación de constraint único
const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

// Límites de duración de citas (en minutos)
const DURACION_MINIMA = 5;
const DURACION_MAXIMA = 480; // 8 horas

class CitaService {
  /**
   * Obtener checksum de la agenda de un doctor
   * Retorna un hash basado en la última modificación de citas
   */
  async getScheduleChecksum(doctorId, startDate, endDate) {
    const start = startDate ? parseSimpleDate(startDate) : new Date();
    const end = endDate ? parseSimpleDate(endDate) : addMinutes(new Date(), 30 * 24 * 60); // Default 30 days

    const citas = await prisma.cita.findMany({
      where: {
        doctorId,
        fecha: {
          gte: start,
          lte: end
        },
        estado: { not: 'Cancelada' }
      },
      select: {
        id: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (citas.length === 0) return { checksum: 'empty', timestamp: Date.now() };

    // Simple hash based on most recent update and count
    const lastUpdate = citas[0].updatedAt.getTime();
    const count = citas.length;
    const checksum = `${count}-${lastUpdate}`;

    return { checksum, timestamp: Date.now() };
  }

  /**
   * Verificar disponibilidad del doctor
   */
  async checkAvailability(doctorId, fecha, hora, duracionMinutos, excludeCitaId = null) {
    if (!doctorId || !fecha || !hora) return true;

    const fechaDate = parseSimpleDate(fecha);
    const horaInicio = new Date(`1970-01-01T${hora}Z`);
    const horaFin = addMinutes(horaInicio, duracionMinutos);

    // Buscar citas del doctor en esa fecha
    const citasDelDia = await prisma.cita.findMany({
      where: {
        doctorId,
        fecha: fechaDate,
        estado: { notIn: ['Cancelada', 'NoAsistio'] },
        ...(excludeCitaId && { id: { not: excludeCitaId } }),
      },
    });

    // Verificar superposición
    for (const cita of citasDelDia) {
      if (!cita.hora) continue;
      
      const citaInicio = new Date(`1970-01-01T${cita.hora.toISOString().split('T')[1]}`);
      const citaFin = addMinutes(citaInicio, cita.duracionMinutos || 30);

      // Superposición: (StartA < EndB) and (EndA > StartB)
      if (isBefore(horaInicio, citaFin) && isAfter(horaFin, citaInicio)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtener todas las citas
   */
  async getAll({ page = 1, limit = 10, fecha = '', fechaDesde = '', estado = '', pacienteId = '', paciente_id = '', doctorId = '', doctor_id = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(fecha && { fecha: parseSimpleDate(fecha) }),
      ...(fechaDesde && { fecha: { gte: parseSimpleDate(fechaDesde) } }),
      ...(estado && { estado }),
      ...((pacienteId || paciente_id) && { pacienteId: pacienteId || paciente_id }),
      ...((doctorId || doctor_id) && { doctorId: doctorId || doctor_id }),
    };

    if (!prisma.cita) {
      console.error('CRITICAL: prisma.cita is undefined in CitaService.getAll');
      throw new Error('Internal Server Error: Database model not initialized');
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              tipoDocumento: true,
              telefono: true,
              email: true,
              fechaNacimiento: true,
              genero: true,
              tipoSangre: true,
              alergias: true,
              enfermedadesCronicas: true,
              fotoUrl: true, // Foto del paciente para mostrar en consulta
            }
          },
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
        nombre: cita.doctor.nombre,
        apellido: cita.doctor.apellido,
        usuario: {
          nombre: cita.doctor.nombre,
          apellido: cita.doctor.apellido,
        }
      } : null,
      // Mapear titulo a nombre para compatibilidad con frontend
      especialidad: cita.especialidad ? {
        ...cita.especialidad,
        nombre: cita.especialidad.titulo || cita.especialidad.nombre,
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
   *
   * IMPORTANTE: La validación de disponibilidad se realiza DENTRO de la transacción
   * para prevenir race conditions. El constraint único en la base de datos
   * (doctorId, fecha, hora) es la última línea de defensa contra doble-reservación.
   *
   * Si es_emergencia=true, se salta la validación de disponibilidad.
   */
  async create(data) {
    // Validar con Zod
    const validatedData = createCitaSchema.parse(data);

    // Validar duración de la cita
    const duracion = validatedData.duracion_minutos || 30;
    if (!duracionValida(duracion, DURACION_MINIMA, DURACION_MAXIMA)) {
      throw new ValidationError(
        `La duración de la cita debe estar entre ${DURACION_MINIMA} y ${DURACION_MAXIMA} minutos.`
      );
    }

    // Las citas de emergencia no requieren validación de disponibilidad ni fecha/hora pasada
    const esEmergencia = validatedData.es_emergencia || false;

    // Validar que la fecha/hora no sea en el pasado (excepto emergencias)
    if (!esEmergencia && validatedData.fecha && validatedData.hora) {
      // Usar la fecha de la cita como string YYYY-MM-DD
      const fechaCitaStr = validatedData.fecha;

      // Obtener fecha de hoy en Colombia (string YYYY-MM-DD)
      const { todayString, nowColombia } = require('../utils/date');
      const hoyStr = todayString();

      // Comparar strings de fecha directamente (formato YYYY-MM-DD es ordenable)
      if (fechaCitaStr < hoyStr) {
        throw new ValidationError('No se puede crear una cita en una fecha pasada.');
      }

      // Si la fecha es hoy, verificar que la hora no haya pasado
      if (fechaCitaStr === hoyStr) {
        const [horaStr, minStr] = validatedData.hora.split(':').map(Number);
        const minutosHoraCita = horaStr * 60 + minStr;

        // Usar hora actual de Colombia
        const ahoraColombia = nowColombia();
        const minutosAhora = ahoraColombia.getUTCHours() * 60 + ahoraColombia.getUTCMinutes();

        if (minutosHoraCita <= minutosAhora) {
          throw new ValidationError('No se puede crear una cita en una hora que ya pasó.');
        }
      }
    }

    try {
      // Crear cita y factura en una transacción con validación de disponibilidad
      const resultado = await prisma.$transaction(async (tx) => {
        // Validar disponibilidad DENTRO de la transacción (excepto emergencias)
        if (!esEmergencia && validatedData.doctor_id && validatedData.fecha && validatedData.hora) {
          // Usar consulta directa para verificar conflictos con lock implícito
          const citasConflicto = await tx.cita.findMany({
            where: {
              doctorId: validatedData.doctor_id,
              fecha: parseSimpleDate(validatedData.fecha),
              estado: { notIn: ['Cancelada', 'NoAsistio'] },
            },
            select: {
              id: true,
              hora: true,
              duracionMinutos: true,
              estado: true,
            }
          });

          // Verificar superposición de horarios
          const horaInicio = new Date(`1970-01-01T${validatedData.hora}Z`);
          const horaFin = addMinutes(horaInicio, validatedData.duracion_minutos || 30);

          for (const citaExistente of citasConflicto) {
            if (!citaExistente.hora) continue;

            const citaInicio = new Date(`1970-01-01T${citaExistente.hora.toISOString().split('T')[1]}`);
            const citaFin = addMinutes(citaInicio, citaExistente.duracionMinutos || 30);

            // Superposición: (StartA < EndB) and (EndA > StartB)
            if (isBefore(horaInicio, citaFin) && isAfter(horaFin, citaInicio)) {
              const horaExistente = citaExistente.hora.toISOString().split('T')[1].substring(0, 5);
              console.log(`[Conflicto] Cita existente ID: ${citaExistente.id}, Hora: ${horaExistente}, Estado: ${citaExistente.estado || 'N/A'}`);
              throw new ValidationError(
                `El horario ${validatedData.hora} no está disponible. Ya existe una cita a las ${horaExistente} (ID: ${citaExistente.id.substring(0, 8)}...).`
              );
            }
          }

          // También verificar contra bloqueos de agenda del doctor
          const bloqueos = await tx.bloqueoAgenda.findMany({
            where: {
              doctorId: validatedData.doctor_id,
              activo: true,
              fechaInicio: { lte: parseSimpleDate(validatedData.fecha) },
              fechaFin: { gte: parseSimpleDate(validatedData.fecha) },
            }
          });

          for (const bloqueo of bloqueos) {
            // Si es bloqueo de día completo
            if (!bloqueo.horaInicio || !bloqueo.horaFin) {
              throw new ValidationError(
                `El doctor no está disponible el ${validatedData.fecha}. Motivo: ${bloqueo.motivo}`
              );
            }

            // Si es bloqueo parcial, verificar superposición
            const bloqueoInicio = new Date(`1970-01-01T${bloqueo.horaInicio}:00Z`);
            const bloqueoFin = new Date(`1970-01-01T${bloqueo.horaFin}:00Z`);

            if (isBefore(horaInicio, bloqueoFin) && isAfter(horaFin, bloqueoInicio)) {
              throw new ValidationError(
                `El horario ${validatedData.hora} está bloqueado. Motivo: ${bloqueo.motivo}`
              );
            }
          }
        }

        // Crear la cita usando connect para relaciones requeridas
        const citaData = {
          paciente: { connect: { id: validatedData.paciente_id } },
          tipoCita: validatedData.tipo_cita,
          fecha: parseSimpleDate(validatedData.fecha),
          hora: validatedData.hora ? new Date(`1970-01-01T${validatedData.hora}Z`) : null,
          duracionMinutos: validatedData.duracion_minutos,
          costo: validatedData.costo,
          motivo: validatedData.motivo || 'Consulta médica',
          notas: validatedData.notas,
          estado: validatedData.estado,
          prioridad: validatedData.prioridad,
          esEmergencia: esEmergencia,
          motivoEmergencia: validatedData.motivo_emergencia || null,
        };

        // Agregar relaciones opcionales solo si existen
        if (validatedData.doctor_id) {
          citaData.doctor = { connect: { id: validatedData.doctor_id } };
        }
        if (validatedData.admision_id) {
          citaData.admision = { connect: { id: validatedData.admision_id } };
        }
        if (validatedData.especialidad_id) {
          citaData.especialidad = { connect: { id: validatedData.especialidad_id } };
        }
        if (validatedData.examen_procedimiento_id) {
          citaData.examenProcedimiento = { connect: { id: validatedData.examen_procedimiento_id } };
        }

        const cita = await tx.cita.create({
          data: citaData,
        });

        // Crear factura automáticamente si es necesario (y si hay costo)
        if (validatedData.costo > 0) {
          await this.crearFacturaCita(cita, validatedData.metodo_pago, validatedData.estado_pago, validatedData.cubierto_por_eps, tx);
        }

        // Audit Log
        await tx.auditLog.create({
          data: {
            action: esEmergencia ? 'CREATE_CITA_EMERGENCIA' : 'CREATE_CITA',
            resource: 'Cita',
            resourceId: cita.id,
            details: { ...validatedData, fecha: validatedData.fecha, esEmergencia },
          }
        });

        return cita;
      });

      return resultado;
    } catch (error) {
      // Manejar error de constraint único (doble-reservación detectada por la BD)
      if (error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR) {
        throw new ValidationError(
          'Este horario acaba de ser reservado por otro usuario. Por favor seleccione otro horario.'
        );
      }
      throw error;
    }
  }

  /**
   * Actualizar una cita
   *
   * IMPORTANTE: La validación de disponibilidad se realiza DENTRO de la transacción
   * para prevenir race conditions cuando se cambia fecha/hora/doctor.
   */
  async update(id, data) {
    // Verificar que existe
    const citaExistente = await this.getById(id);

    // Validar con Zod (partial)
    const validatedData = updateCitaSchema.parse(data);

    // Determinar valores finales para validación
    const doctorId = validatedData.doctor_id !== undefined ? validatedData.doctor_id : citaExistente.doctorId;
    const fecha = validatedData.fecha || (citaExistente.fecha ? citaExistente.fecha.toISOString().split('T')[0] : null);
    const hora = validatedData.hora || (citaExistente.hora ? citaExistente.hora.toISOString().split('T')[1].substring(0, 5) : null);
    const duracion = validatedData.duracion_minutos || citaExistente.duracionMinutos;

    // ¿Se requiere validación de disponibilidad?
    const requiereValidacion = (validatedData.fecha || validatedData.hora || validatedData.doctor_id) &&
      (validatedData.estado !== 'Cancelada' && validatedData.estado !== 'NoAsistio') &&
      !citaExistente.esEmergencia;

    // Construir datos de actualización
    const updateData = {};
    if (validatedData.fecha !== undefined) updateData.fecha = parseSimpleDate(validatedData.fecha);
    if (validatedData.hora !== undefined) updateData.hora = validatedData.hora ? new Date(`1970-01-01T${validatedData.hora}Z`) : null;
    if (validatedData.motivo !== undefined) updateData.motivo = validatedData.motivo;
    if (validatedData.notas !== undefined) updateData.notas = validatedData.notas;
    if (validatedData.estado !== undefined) updateData.estado = validatedData.estado;
    if (validatedData.especialidad_id !== undefined) updateData.especialidadId = validatedData.especialidad_id;
    if (validatedData.doctor_id !== undefined) updateData.doctorId = validatedData.doctor_id;
    if (validatedData.costo !== undefined) updateData.costo = validatedData.costo;
    if (validatedData.duracion_minutos !== undefined) updateData.duracionMinutos = validatedData.duracion_minutos;

    try {
      // Actualizar en transacción con validación de disponibilidad
      const resultado = await prisma.$transaction(async (tx) => {
        // Validar disponibilidad DENTRO de la transacción
        if (requiereValidacion && doctorId && fecha && hora) {
          // Verificar conflictos con otras citas (excluyendo la cita actual)
          const citasConflicto = await tx.cita.findMany({
            where: {
              doctorId,
              fecha: parseSimpleDate(fecha),
              estado: { notIn: ['Cancelada', 'NoAsistio'] },
              id: { not: id }, // Excluir la cita actual
            },
            select: {
              id: true,
              hora: true,
              duracionMinutos: true,
            }
          });

          const horaInicio = new Date(`1970-01-01T${hora}Z`);
          const horaFin = addMinutes(horaInicio, duracion || 30);

          for (const citaConflicto of citasConflicto) {
            if (!citaConflicto.hora) continue;

            const citaInicio = new Date(`1970-01-01T${citaConflicto.hora.toISOString().split('T')[1]}`);
            const citaFin = addMinutes(citaInicio, citaConflicto.duracionMinutos || 30);

            if (isBefore(horaInicio, citaFin) && isAfter(horaFin, citaInicio)) {
              throw new ValidationError(
                `El horario ${hora} no está disponible. Ya existe una cita programada en ese horario.`
              );
            }
          }

          // Verificar bloqueos de agenda
          const bloqueos = await tx.bloqueoAgenda.findMany({
            where: {
              doctorId,
              activo: true,
              fechaInicio: { lte: parseSimpleDate(fecha) },
              fechaFin: { gte: parseSimpleDate(fecha) },
            }
          });

          for (const bloqueo of bloqueos) {
            if (!bloqueo.horaInicio || !bloqueo.horaFin) {
              throw new ValidationError(
                `El doctor no está disponible el ${fecha}. Motivo: ${bloqueo.motivo}`
              );
            }

            const bloqueoInicio = new Date(`1970-01-01T${bloqueo.horaInicio}:00Z`);
            const bloqueoFin = new Date(`1970-01-01T${bloqueo.horaFin}:00Z`);

            if (isBefore(horaInicio, bloqueoFin) && isAfter(horaFin, bloqueoInicio)) {
              throw new ValidationError(
                `El horario ${hora} está bloqueado. Motivo: ${bloqueo.motivo}`
              );
            }
          }
        }

        // Actualizar cita
        const cita = await tx.cita.update({
          where: { id },
          data: updateData,
        });

        // Si la cita tenía estado PorAgendar y ahora se está programando, crear factura
        if (citaExistente.estado === 'PorAgendar' && validatedData.estado === 'Programada') {
          const facturaItem = await tx.facturaItem.findFirst({
            where: { citaId: id },
          });

          if (!facturaItem && cita.costo > 0) {
            await this.crearFacturaCita(cita, validatedData.metodo_pago, validatedData.estado_pago, validatedData.cubierto_por_eps, tx);
          }
        }

        // Si se actualizó el costo, actualizar la factura si existe
        if (validatedData.costo !== undefined) {
          const facturaItem = await tx.facturaItem.findFirst({
            where: { citaId: id },
            include: { factura: true },
          });

          if (facturaItem) {
            const nuevoCosto = parseFloat(validatedData.costo);

            await tx.facturaItem.update({
              where: { id: facturaItem.id },
              data: {
                precioUnitario: nuevoCosto,
                subtotal: nuevoCosto,
              },
            });

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
    } catch (error) {
      // Manejar error de constraint único
      if (error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR) {
        throw new ValidationError(
          'Este horario acaba de ser reservado por otro usuario. Por favor seleccione otro horario.'
        );
      }
      throw error;
    }
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

  // =============================================
  // Métodos para el portal de pacientes
  // =============================================

  /**
   * Obtener citas de un paciente por su email
   */
  async getCitasByPacienteEmail(email, { page = 1, limit = 10, estado = '', upcoming = false }) {
    // Primero obtener el paciente por email
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
      select: { id: true }
    });

    if (!paciente) {
      return { citas: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    // Build where clause - if estado is provided, use it; otherwise use upcoming filter
    const where = {
      pacienteId: paciente.id,
    };

    // Determinar si ordenar ascendente (citas futuras) o descendente (citas pasadas)
    let sortAsc = upcoming;

    if (estado) {
      // Si se especifica un estado, usarlo directamente
      where.estado = estado;
      // Citas programadas y pendientes de pago: orden ascendente (próximas primero)
      // Citas completadas, canceladas, no asistió: orden descendente (más recientes primero)
      sortAsc = ['Programada', 'PendientePago', 'PorAgendar'].includes(estado);
    } else if (upcoming) {
      // Si no hay estado específico y upcoming=true, excluir estados finalizados
      where.fecha = { gte: now };
      where.estado = { notIn: ['Cancelada', 'NoAsistio', 'Completada'] };
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fecha: sortAsc ? 'asc' : 'desc' }, { hora: sortAsc ? 'asc' : 'desc' }],
        include: {
          doctor: { select: { id: true, nombre: true, apellido: true } },
          especialidad: { select: { id: true, titulo: true, costoCOP: true, duracionMinutos: true } },
          examenProcedimiento: { select: { id: true, nombre: true, tipo: true } },
        },
      }),
      prisma.cita.count({ where }),
    ]);

    // Formatear respuesta
    const citasFormateadas = citas.map(cita => ({
      id: cita.id,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      motivo: cita.motivo,
      notas: cita.notas,
      tipoCita: cita.tipoCita,
      costo: cita.costo,
      duracionMinutos: cita.duracionMinutos,
      doctor: cita.doctor ? {
        id: cita.doctor.id,
        nombre: cita.doctor.nombre,
        apellido: cita.doctor.apellido,
        nombreCompleto: `${cita.doctor.nombre} ${cita.doctor.apellido}`,
      } : null,
      especialidad: cita.especialidad ? {
        id: cita.especialidad.id,
        nombre: cita.especialidad.titulo,
      } : null,
      examenProcedimiento: cita.examenProcedimiento,
      createdAt: cita.createdAt,
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
   * Obtener historial de citas de un paciente (citas pasadas)
   */
  async getHistorialByPacienteEmail(email, { page = 1, limit = 10 }) {
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
      select: { id: true }
    });

    if (!paciente) {
      return { citas: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    const where = {
      pacienteId: paciente.id,
      OR: [
        { fecha: { lt: now } },
        { estado: { in: ['Completada', 'Cancelada', 'NoAsistio'] } }
      ]
    };

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
        include: {
          doctor: { select: { id: true, nombre: true, apellido: true } },
          especialidad: { select: { id: true, titulo: true } },
          examenProcedimiento: { select: { id: true, nombre: true, tipo: true } },
        },
      }),
      prisma.cita.count({ where }),
    ]);

    const citasFormateadas = citas.map(cita => ({
      id: cita.id,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      motivo: cita.motivo,
      notas: cita.notas,
      tipoCita: cita.tipoCita,
      costo: cita.costo,
      doctor: cita.doctor ? {
        id: cita.doctor.id,
        nombre: cita.doctor.nombre,
        apellido: cita.doctor.apellido,
        nombreCompleto: `${cita.doctor.nombre} ${cita.doctor.apellido}`,
      } : null,
      especialidad: cita.especialidad ? {
        id: cita.especialidad.id,
        nombre: cita.especialidad.titulo,
      } : null,
      examenProcedimiento: cita.examenProcedimiento,
      createdAt: cita.createdAt,
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
   * Cancelar una cita del paciente (verificando propiedad)
   */
  async cancelByPaciente(citaId, email, motivo = '') {
    // Obtener paciente
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
      select: { id: true }
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Verificar que la cita pertenece al paciente
    const cita = await prisma.cita.findFirst({
      where: { id: citaId, pacienteId: paciente.id }
    });

    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    // Verificar que la cita puede ser cancelada (no pasada, no ya cancelada)
    if (cita.estado === 'Cancelada') {
      throw new ValidationError('La cita ya está cancelada');
    }

    if (cita.estado === 'Completada') {
      throw new ValidationError('No se puede cancelar una cita ya completada');
    }

    const now = new Date();
    if (cita.fecha < now) {
      throw new ValidationError('No se puede cancelar una cita pasada');
    }

    // Cancelar la cita
    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
      data: {
        estado: 'Cancelada',
        notas: motivo ? `${cita.notas || ''}\n[Cancelada por paciente]: ${motivo}`.trim() : cita.notas
      },
    });

    return citaActualizada;
  }

  /**
   * Reprogramar una cita del paciente (verificando propiedad)
   * @param {string} citaId - ID de la cita
   * @param {string} email - Email del paciente
   * @param {string} nuevaFecha - Nueva fecha en formato YYYY-MM-DD
   * @param {string} nuevaHora - Nueva hora en formato HH:MM
   * @param {string} nuevoDoctorId - ID del nuevo doctor (opcional, puede ser Doctor.id o Usuario.id)
   */
  async reprogramarByPaciente(citaId, email, nuevaFecha, nuevaHora, nuevoDoctorId = null) {
    // Obtener paciente con datos para el correo
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
      select: { id: true, nombre: true, apellido: true, email: true }
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Verificar que la cita pertenece al paciente
    const cita = await prisma.cita.findFirst({
      where: { id: citaId, pacienteId: paciente.id },
      include: {
        doctor: true,
        especialidad: { select: { id: true, titulo: true } }
      }
    });

    // Guardar datos de la cita anterior para el correo
    const citaAnterior = cita ? {
      fecha: cita.fecha,
      hora: cita.hora
    } : null;

    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    // Verificar que la cita puede ser reprogramada
    if (cita.estado === 'Cancelada' || cita.estado === 'Completada') {
      throw new ValidationError('No se puede reprogramar esta cita');
    }

    // Determinar el doctor a usar (nuevo o existente)
    let doctorIdToUse = cita.doctorId;

    if (nuevoDoctorId) {
      // Verificar que el nuevo doctor existe y tiene la misma especialidad
      // Primero intentar buscar por Doctor.id
      let doctorRecord = await prisma.doctor.findUnique({
        where: { id: nuevoDoctorId },
        include: {
          usuario: { select: { id: true, activo: true } },
          especialidades: { select: { especialidadId: true } }
        }
      });

      // Si no se encuentra por Doctor.id, buscar por Usuario.id
      if (!doctorRecord) {
        doctorRecord = await prisma.doctor.findFirst({
          where: { usuarioId: nuevoDoctorId },
          include: {
            usuario: { select: { id: true, activo: true } },
            especialidades: { select: { especialidadId: true } }
          }
        });
      }

      if (!doctorRecord || !doctorRecord.usuario?.activo) {
        throw new ValidationError('El doctor seleccionado no está disponible');
      }

      // Verificar que el doctor tenga la especialidad de la cita
      if (cita.especialidadId) {
        const tieneEspecialidad = doctorRecord.especialidades.some(
          e => e.especialidadId === cita.especialidadId
        );
        if (!tieneEspecialidad) {
          throw new ValidationError('El doctor seleccionado no atiende esta especialidad');
        }
      }

      doctorIdToUse = doctorRecord.usuario.id; // Siempre usar Usuario.id para citas
    }

    // Verificar disponibilidad del doctor en la nueva fecha/hora
    if (doctorIdToUse && nuevaFecha && nuevaHora) {
      const disponible = await this.checkAvailability(
        doctorIdToUse,
        nuevaFecha,
        nuevaHora,
        cita.duracionMinutos || 30,
        citaId
      );

      if (!disponible) {
        throw new ValidationError('El horario seleccionado no está disponible');
      }
    }

    // Actualizar la cita
    const updateData = {
      fecha: parseSimpleDate(nuevaFecha),
      hora: nuevaHora ? new Date(`1970-01-01T${nuevaHora}Z`) : cita.hora,
      estado: 'Programada',
    };

    // Si cambió el doctor, actualizar
    if (nuevoDoctorId && doctorIdToUse !== cita.doctorId) {
      updateData.doctorId = doctorIdToUse;
      updateData.notas = `${cita.notas || ''}\n[Reprogramada y cambiada a otro doctor por paciente]`.trim();
    } else {
      updateData.notas = `${cita.notas || ''}\n[Reprogramada por paciente]`.trim();
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
      data: updateData,
      include: {
        doctor: { select: { id: true, nombre: true, apellido: true } },
        especialidad: { select: { id: true, titulo: true } },
      }
    });

    // Enviar correo de confirmación de reprogramación
    try {
      await emailService.sendAppointmentRescheduled({
        to: paciente.email || email,
        paciente: {
          nombre: paciente.nombre,
          apellido: paciente.apellido
        },
        cita: {
          fecha: citaActualizada.fecha,
          hora: nuevaHora
        },
        doctor: citaActualizada.doctor,
        especialidad: citaActualizada.especialidad,
        citaAnterior: citaAnterior
      });
      console.log(`[Email] Correo de reprogramación enviado a ${paciente.email || email}`);
    } catch (emailError) {
      console.error('[Email] Error enviando correo de reprogramación:', emailError);
      // No lanzamos error para no afectar la reprogramación exitosa
    }

    return citaActualizada;
  }

  /**
   * Obtener detalle de una cita del paciente
   */
  async getCitaByIdForPaciente(citaId, email) {
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
      select: { id: true }
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    const cita = await prisma.cita.findFirst({
      where: { id: citaId, pacienteId: paciente.id },
      include: {
        doctor: { select: { id: true, nombre: true, apellido: true } },
        especialidad: { select: { id: true, titulo: true, costoCOP: true, duracionMinutos: true } },
        examenProcedimiento: { select: { id: true, nombre: true, tipo: true } },
      }
    });

    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    return {
      id: cita.id,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      motivo: cita.motivo,
      notas: cita.notas,
      tipoCita: cita.tipoCita,
      costo: cita.costo,
      duracionMinutos: cita.duracionMinutos,
      doctor: cita.doctor ? {
        id: cita.doctor.id,
        nombre: cita.doctor.nombre,
        apellido: cita.doctor.apellido,
        nombreCompleto: `${cita.doctor.nombre} ${cita.doctor.apellido}`,
      } : null,
      especialidad: cita.especialidad ? {
        id: cita.especialidad.id,
        nombre: cita.especialidad.titulo,
        costo: cita.especialidad.costoCOP,
        duracion: cita.especialidad.duracionMinutos,
      } : null,
      examenProcedimiento: cita.examenProcedimiento,
      createdAt: cita.createdAt,
    };
  }
}

module.exports = new CitaService();
