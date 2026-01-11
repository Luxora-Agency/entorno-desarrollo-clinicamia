/**
 * Servicio de Control de Asistencia - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class AsistenciaService {
  // ============ ASISTENCIA ============

  /**
   * Registrar entrada
   */
  async registrarEntrada(empleadoId, data = {}) {
    const empleado = await prisma.th_empleados.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Verificar si ya existe registro
    const existing = await prisma.th_asistencia.findUnique({
      where: {
        empleado_id_fecha: { empleado_id: empleadoId, fecha: hoy }
      }
    });

    if (existing && existing.hora_entrada) {
      throw new ValidationError('Ya se registró entrada para hoy');
    }

    if (existing) {
      return prisma.th_asistencia.update({
        where: { id: existing.id },
        data: {
          hora_entrada: new Date(),
          tipo_registro: data.tipoRegistro || 'MANUAL',
          ubicacion_entrada: data.ubicacion || null
        }
      });
    }

    return prisma.th_asistencia.create({
      data: {
        empleado_id: empleadoId,
        fecha: hoy,
        hora_entrada: new Date(),
        tipo_registro: data.tipoRegistro || 'MANUAL',
        ubicacion_entrada: data.ubicacion || null,
        turno_id: data.turnoId || null,
        estado: 'PRESENTE'
      }
    });
  }

  /**
   * Registrar salida
   */
  async registrarSalida(empleadoId, data = {}) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const asistencia = await prisma.th_asistencia.findUnique({
      where: {
        empleado_id_fecha: { empleado_id: empleadoId, fecha: hoy }
      }
    });

    if (!asistencia) {
      throw new ValidationError('No se ha registrado entrada para hoy');
    }

    if (asistencia.hora_salida) {
      throw new ValidationError('Ya se registró salida para hoy');
    }

    const horaSalida = new Date();
    const horaEntrada = new Date(asistencia.hora_entrada);
    const horasTrabajadas = (horaSalida - horaEntrada) / (1000 * 60 * 60);

    return prisma.th_asistencia.update({
      where: { id: asistencia.id },
      data: {
        hora_salida: horaSalida,
        horas_trabajadas: Math.round(horasTrabajadas * 100) / 100,
        ubicacion_salida: data.ubicacion || null
      }
    });
  }

  /**
   * Listar asistencia por rango de fechas
   */
  async list({ empleadoId, fechaInicio, fechaFin, estado, page = 1, limit = 31 }) {
    const where = {};
    if (empleadoId) where.empleado_id = empleadoId;
    if (estado) where.estado = estado;
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    const [data, total] = await Promise.all([
      prisma.th_asistencia.findMany({
        where,
        include: {
          th_empleados: { select: { id: true, nombre: true, apellido: true } },
          th_turnos: true
        },
        orderBy: [{ fecha: 'desc' }, { hora_entrada: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_asistencia.count({ where })
    ]);

    // Map to camelCase
    const mappedData = data.map(a => ({
      id: a.id,
      empleadoId: a.empleado_id,
      fecha: a.fecha,
      horaEntrada: a.hora_entrada,
      horaSalida: a.hora_salida,
      horasTrabajadas: a.horas_trabajadas,
      tipoRegistro: a.tipo_registro,
      ubicacionEntrada: a.ubicacion_entrada,
      ubicacionSalida: a.ubicacion_salida,
      turnoId: a.turno_id,
      estado: a.estado,
      empleado: a.th_empleados,
      turno: a.th_turnos ? {
        id: a.th_turnos.id,
        nombre: a.th_turnos.nombre,
        horaInicio: a.th_turnos.hora_inicio,
        horaFin: a.th_turnos.hora_fin,
        color: a.th_turnos.color
      } : null
    }));

    return {
      data: mappedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener reporte de asistencia
   */
  async getReporte(fechaInicio, fechaFin, departamentoId = null) {
    const where = {
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    };

    if (departamentoId) {
      where.th_empleados = { departamento_id: departamentoId };
    }

    const asistencias = await prisma.th_asistencia.findMany({
      where,
      include: {
        th_empleados: { select: { id: true, nombre: true, apellido: true, departamento_id: true } }
      }
    });

    // Agrupar por empleado
    const porEmpleado = asistencias.reduce((acc, a) => {
      if (!acc[a.empleado_id]) {
        acc[a.empleado_id] = {
          empleado: a.th_empleados,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0,
          horasTotales: 0
        };
      }
      if (a.estado === 'PRESENTE') acc[a.empleado_id].presentes++;
      if (a.estado === 'AUSENTE') acc[a.empleado_id].ausentes++;
      if (a.estado === 'TARDANZA') acc[a.empleado_id].tardanzas++;
      acc[a.empleado_id].horasTotales += Number(a.horas_trabajadas || 0);
      return acc;
    }, {});

    return Object.values(porEmpleado);
  }

  // ============ TURNOS ============

  /**
   * Listar turnos
   */
  async listTurnos() {
    const turnos = await prisma.th_turnos.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    
    return turnos.map(t => ({
      id: t.id,
      nombre: t.nombre,
      codigo: t.codigo,
      horaInicio: t.hora_inicio,
      horaFin: t.hora_fin,
      color: t.color,
      activo: t.activo
    }));
  }

  /**
   * Crear turno
   */
  async createTurno(data) {
    const existing = await prisma.th_turnos.findUnique({
      where: { codigo: data.codigo }
    });
    if (existing) throw new ValidationError('El código del turno ya existe');

    return prisma.th_turnos.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        color: data.color,
        activo: true
      }
    });
  }

  /**
   * Asignar turno a empleado
   */
  async asignarTurno(empleadoId, turnoId, data) {
    const [empleado, turno] = await Promise.all([
      prisma.th_empleados.findUnique({ where: { id: empleadoId } }),
      prisma.th_turnos.findUnique({ where: { id: turnoId } })
    ]);

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!turno) throw new NotFoundError('Turno no encontrado');

    return prisma.th_asignacion_turnos.create({
      data: {
        empleado_id: empleadoId,
        turno_id: turnoId,
        fecha_inicio: new Date(data.fechaInicio),
        fecha_fin: data.fechaFin ? new Date(data.fechaFin) : null,
        dias_semana: data.diasSemana
      }
    });
  }

  // ============ VACACIONES ============

  /**
   * Solicitar vacaciones
   */
  async solicitarVacaciones(empleadoId, data) {
    const empleado = await prisma.th_empleados.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    // Calcular días hábiles
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFin);
    let diasHabiles = 0;
    const current = new Date(fechaInicio);

    while (current <= fechaFin) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        diasHabiles++;
      }
      current.setDate(current.getDate() + 1);
    }

    return prisma.th_vacaciones.create({
      data: {
        empleado_id: empleadoId,
        tipo: data.tipo || 'ORDINARIAS',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        dias_solicitados: data.diasSolicitados || diasHabiles,
        dias_habiles: diasHabiles,
        observaciones: data.observaciones,
        estado: 'PENDIENTE'
      }
    });
  }

  /**
   * Aprobar vacaciones
   */
  async aprobarVacaciones(id, userId) {
    const vacacion = await prisma.th_vacaciones.findUnique({ where: { id } });
    if (!vacacion) throw new NotFoundError('Solicitud no encontrada');

    if (vacacion.estado !== 'PENDIENTE') {
      throw new ValidationError('La solicitud ya fue procesada');
    }

    return prisma.th_vacaciones.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        aprobado_por: userId,
        fecha_aprobacion: new Date()
      }
    });
  }

  /**
   * Rechazar vacaciones
   */
  async rechazarVacaciones(id, userId, motivo) {
    const vacacion = await prisma.th_vacaciones.findUnique({ where: { id } });
    if (!vacacion) throw new NotFoundError('Solicitud no encontrada');

    return prisma.th_vacaciones.update({
      where: { id },
      data: {
        estado: 'RECHAZADA',
        aprobado_por: userId,
        fecha_aprobacion: new Date(),
        observaciones: motivo
      }
    });
  }

  /**
   * Obtener saldo de vacaciones
   */
  async getSaldoVacaciones(empleadoId) {
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: empleadoId },
      include: {
        th_vacaciones: { where: { estado: 'APROBADA' } }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const fechaIngreso = new Date(empleado.fecha_ingreso);
    const hoy = new Date();
    const diasTrabajados = Math.floor((hoy - fechaIngreso) / (1000 * 60 * 60 * 24));

    // Días de vacaciones por año en Colombia: 15 días hábiles
    const diasGenerados = Math.floor((diasTrabajados / 365) * 15);
    const diasTomados = empleado.th_vacaciones.reduce((acc, v) => acc + v.dias_habiles, 0);
    const diasDisponibles = diasGenerados - diasTomados;

    return {
      fechaIngreso,
      diasTrabajados,
      diasGenerados,
      diasTomados,
      diasDisponibles: Math.max(0, diasDisponibles)
    };
  }

  // ============ PERMISOS ============

  /**
   * Solicitar permiso
   */
  async solicitarPermiso(empleadoId, data) {
    const empleado = await prisma.th_empleados.findUnique({ where: { id: empleadoId } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    return prisma.th_permisos.create({
      data: {
        empleado_id: empleadoId,
        tipo_permiso: data.tipo,
        fecha_inicio: new Date(data.fechaInicio),
        fecha_fin: new Date(data.fechaFin),
        motivo: data.motivo,
        estado: 'PENDIENTE'
      }
    });
  }

  /**
   * Aprobar permiso
   */
  async aprobarPermiso(id, userId) {
    const permiso = await prisma.th_permisos.findUnique({ where: { id } });
    if (!permiso) throw new NotFoundError('Permiso no encontrado');

    return prisma.th_permisos.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        aprobado_por: userId,
        fecha_aprobacion: new Date()
      }
    });
  }

  /**
   * Listar solicitudes pendientes
   */
  async listSolicitudesPendientes(tipo) {
    if (tipo === 'vacaciones') {
      const vacs = await prisma.th_vacaciones.findMany({
        where: { estado: 'PENDIENTE' },
        include: {
          th_empleados: { select: { id: true, nombre: true, apellido: true } }
        },
        orderBy: { solicitado_el: 'asc' }
      });
      
      return vacs.map(v => ({
        id: v.id,
        empleadoId: v.empleado_id,
        tipo: v.tipo,
        fechaInicio: v.fecha_inicio,
        fechaFin: v.fecha_fin,
        diasHabiles: v.dias_habiles,
        estado: v.estado,
        empleado: v.th_empleados
      }));
    }

    const perms = await prisma.th_permisos.findMany({
      where: { estado: 'PENDIENTE' },
      include: {
        th_empleados: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { created_at: 'asc' } // Check created_at field name in schema if it differs
    });
    
    return perms.map(p => ({
      id: p.id,
      empleadoId: p.empleado_id,
      tipo: p.tipo_permiso,
      fechaInicio: p.fecha_inicio,
      fechaFin: p.fecha_fin,
      motivo: p.motivo,
      estado: p.estado,
      empleado: p.th_empleados
    }));
  }
}

module.exports = new AsistenciaService();
