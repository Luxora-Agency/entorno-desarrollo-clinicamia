/**
 * Servicio de Gestión de Contratos - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class ContratoService {
  /**
   * Listar contratos con filtros
   */
  async list({ empleadoId, estado, tipoContrato, page = 1, limit = 20 }) {
    const where = {};
    if (empleadoId) where.empleado_id = empleadoId;
    if (estado) where.estado = estado;
    if (tipoContrato) where.tipo_contrato = tipoContrato;

    const [data, total] = await Promise.all([
      prisma.th_contratos.findMany({
        where,
        include: {
          th_empleados: {
            select: { id: true, nombre: true, apellido: true, documento: true }
          }
        },
        orderBy: { fecha_inicio: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_contratos.count({ where })
    ]);

    // Map to camelCase
    const mappedData = data.map(c => ({
      id: c.id,
      empleadoId: c.empleado_id,
      numeroContrato: c.numero_contrato,
      tipoContrato: c.tipo_contrato,
      fechaInicio: c.fecha_inicio,
      fechaFin: c.fecha_fin,
      salarioBase: c.salario_base,
      auxTransporte: c.aux_transporte,
      jornada: c.jornada,
      horasSemana: c.horas_semana,
      estado: c.estado,
      documentoUrl: c.documento_url,
      empleado: c.th_empleados ? {
        id: c.th_empleados.id,
        nombre: c.th_empleados.nombre,
        apellido: c.th_empleados.apellido,
        documento: c.th_empleados.documento
      } : null
    }));

    return {
      data: mappedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener contrato por ID
   */
  async getById(id) {
    const contrato = await prisma.th_contratos.findUnique({
      where: { id },
      include: {
        th_empleados: true,
        th_modificaciones_contrato: { orderBy: { fecha_efectiva: 'desc' } }
      }
    });

    if (!contrato) throw new NotFoundError('Contrato no encontrado');
    
    // Map to camelCase
    return {
      id: contrato.id,
      empleadoId: contrato.empleado_id,
      numeroContrato: contrato.numero_contrato,
      tipoContrato: contrato.tipo_contrato,
      fechaInicio: contrato.fecha_inicio,
      fechaFin: contrato.fecha_fin,
      salarioBase: contrato.salario_base,
      auxTransporte: contrato.aux_transporte,
      jornada: contrato.jornada,
      horasSemana: contrato.horas_semana,
      clausulasAdicionales: contrato.clausulas_adicionales,
      estado: contrato.estado,
      documentoUrl: contrato.documento_url,
      motivoTerminacion: contrato.motivo_terminacion,
      fechaTerminacion: contrato.fecha_terminacion,
      empleado: contrato.th_empleados,
      modificaciones: contrato.th_modificaciones_contrato.map(m => ({
        id: m.id,
        tipo: m.tipo,
        fechaEfectiva: m.fecha_efectiva,
        descripcion: m.descripcion,
        valorAnterior: m.valor_anterior,
        valorNuevo: m.valor_nuevo
      }))
    };
  }

  /**
   * Crear nuevo contrato
   */
  async create(data) {
    // Verificar que el empleado exista
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: data.empleadoId }
    });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    // Verificar número de contrato único
    const existing = await prisma.th_contratos.findUnique({
      where: { numero_contrato: data.numeroContrato }
    });
    if (existing) {
      throw new ValidationError('El número de contrato ya existe');
    }

    // Si hay contrato activo, terminarlo
    const contratoActivo = await prisma.th_contratos.findFirst({
      where: { empleado_id: data.empleadoId, estado: 'ACTIVO' }
    });

    if (contratoActivo) {
      await prisma.th_contratos.update({
        where: { id: contratoActivo.id },
        data: {
          estado: 'TERMINADO',
          fecha_terminacion: new Date(data.fechaInicio),
          motivo_terminacion: 'Nuevo contrato'
        }
      });
    }

    const dbData = {
      empleado_id: data.empleadoId,
      numero_contrato: data.numeroContrato,
      tipo_contrato: data.tipoContrato,
      fecha_inicio: new Date(data.fechaInicio),
      fecha_fin: data.fechaFin ? new Date(data.fechaFin) : null,
      salario_base: data.salarioBase,
      aux_transporte: data.auxTransporte !== undefined ? data.auxTransporte : true,
      jornada: data.jornada,
      horas_semana: data.horasSemana,
      clausulas_adicionales: data.clausulasAdicionales,
      estado: 'ACTIVO',
      documento_url: data.documentoUrl
    };

    const contrato = await prisma.th_contratos.create({
      data: dbData,
      include: { th_empleados: true }
    });
    
    return contrato; // TODO: map to entity if needed
  }

  /**
   * Actualizar contrato
   */
  async update(id, data) {
    const contrato = await prisma.th_contratos.findUnique({ where: { id } });
    if (!contrato) throw new NotFoundError('Contrato no encontrado');

    const dbData = {};
    if (data.fechaInicio) dbData.fecha_inicio = new Date(data.fechaInicio);
    if (data.fechaFin !== undefined) dbData.fecha_fin = data.fechaFin ? new Date(data.fechaFin) : null;
    if (data.salarioBase) dbData.salario_base = data.salarioBase;
    if (data.auxTransporte !== undefined) dbData.aux_transporte = data.auxTransporte;
    if (data.clausulasAdicionales !== undefined) dbData.clausulas_adicionales = data.clausulasAdicionales;
    if (data.estado) dbData.estado = data.estado;

    return prisma.th_contratos.update({
      where: { id },
      data: dbData,
      include: { th_empleados: true }
    });
  }

  /**
   * Terminar contrato
   */
  async terminate(id, { motivoTerminacion, fechaTerminacion }) {
    const contrato = await prisma.th_contratos.findUnique({ where: { id } });
    if (!contrato) throw new NotFoundError('Contrato no encontrado');

    if (contrato.estado !== 'ACTIVO') {
      throw new ValidationError('Solo se pueden terminar contratos activos');
    }

    const fecha = fechaTerminacion ? new Date(fechaTerminacion) : new Date();

    // Actualizar contrato
    const contratoActualizado = await prisma.th_contratos.update({
      where: { id },
      data: {
        estado: 'TERMINADO',
        motivo_terminacion: motivoTerminacion,
        fecha_terminacion: fecha
      }
    });

    // Registrar movimiento de retiro
    await prisma.th_movimientos.create({
      data: {
        empleado_id: contrato.empleado_id,
        tipo_movimiento: 'RETIRO_VOLUNTARIO',
        fecha_efectiva: fecha,
        motivo: motivoTerminacion
      }
    });

    return contratoActualizado;
  }

  /**
   * Renovar contrato
   */
  async renew(id, { fechaFin, salarioBase, observaciones }) {
    const contrato = await prisma.th_contratos.findUnique({ where: { id } });
    if (!contrato) throw new NotFoundError('Contrato no encontrado');

    // Generar nuevo número de contrato
    const count = await prisma.th_contratos.count({
      where: { empleado_id: contrato.empleado_id }
    });
    const numeroContrato = `${contrato.numero_contrato}-R${count + 1}`;

    // Terminar contrato actual
    await prisma.th_contratos.update({
      where: { id },
      data: {
        estado: 'TERMINADO',
        fecha_terminacion: new Date(),
        motivo_terminacion: 'Renovación'
      }
    });

    // Crear nuevo contrato
    return prisma.th_contratos.create({
      data: {
        empleado_id: contrato.empleado_id,
        numero_contrato: numeroContrato,
        tipo_contrato: contrato.tipo_contrato,
        fecha_inicio: new Date(),
        fecha_fin: fechaFin ? new Date(fechaFin) : null,
        salario_base: salarioBase || contrato.salario_base,
        aux_transporte: contrato.aux_transporte,
        jornada: contrato.jornada,
        horas_semana: contrato.horas_semana,
        clausulas_adicionales: observaciones,
        estado: 'ACTIVO'
      },
      include: { th_empleados: true }
    });
  }

  /**
   * Agregar modificación al contrato (otrosí)
   */
  async addModification(contratoId, data) {
    const contrato = await prisma.th_contratos.findUnique({ where: { id: contratoId } });
    if (!contrato) throw new NotFoundError('Contrato no encontrado');

    return prisma.th_modificaciones_contrato.create({
      data: {
        contrato_id: contratoId,
        tipo: data.tipo,
        fecha_efectiva: new Date(data.fechaEfectiva),
        descripcion: data.descripcion,
        valor_anterior: data.valorAnterior,
        valor_nuevo: data.valorNuevo
      }
    });
  }

  /**
   * Obtener contratos próximos a vencer
   */
  async getExpiringContracts(dias = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const contracts = await prisma.th_contratos.findMany({
      where: {
        estado: 'ACTIVO',
        fecha_fin: {
          not: null,
          lte: fechaLimite
        }
      },
      include: {
        th_empleados: {
          select: { id: true, nombre: true, apellido: true, email: true }
        }
      },
      orderBy: { fecha_fin: 'asc' }
    });

    return contracts.map(c => ({
      id: c.id,
      numeroContrato: c.numero_contrato,
      fechaFin: c.fecha_fin,
      empleado: c.th_empleados
    }));
  }

  /**
   * Calcular liquidación
   */
  async calculateLiquidation(empleadoId) {
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: empleadoId },
      include: {
        th_contratos: {
          where: { estado: 'ACTIVO' },
          take: 1
        }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!empleado.th_contratos.length) {
      throw new ValidationError('El empleado no tiene contrato activo');
    }

    const contrato = empleado.th_contratos[0];
    const salarioBase = Number(contrato.salario_base);
    const fechaIngreso = empleado.fecha_ingreso;
    const fechaRetiro = new Date();

    // Calcular días trabajados
    const diasTrabajados = Math.floor(
      (fechaRetiro - fechaIngreso) / (1000 * 60 * 60 * 24)
    );

    // Calcular prestaciones (fórmulas colombianas simplificadas)
    const salarioMensual = salarioBase;
    
    // Cesantías: Salario * días trabajados / 360
    const cesantias = (salarioMensual * diasTrabajados) / 360;

    // Intereses cesantías: Cesantías * días trabajados * 0.12 / 360
    const interesCesantias = (cesantias * diasTrabajados * 0.12) / 360;

    // Prima: Salario * días trabajados / 360 (semestre)
    const prima = (salarioMensual * diasTrabajados) / 360;

    // Vacaciones: Salario * días trabajados / 720
    const vacaciones = (salarioMensual * diasTrabajados) / 720;

    return {
      empleado: {
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        documento: empleado.documento,
        fechaIngreso,
        fechaRetiro,
        diasTrabajados
      },
      contrato: {
        numero: contrato.numero_contrato,
        tipo: contrato.tipo_contrato,
        salarioBase
      },
      liquidacion: {
        cesantias: Math.round(cesantias),
        interesCesantias: Math.round(interesCesantias),
        prima: Math.round(prima),
        vacaciones: Math.round(vacaciones),
        total: Math.round(cesantias + interesCesantias + prima + vacaciones)
      }
    };
  }
}

module.exports = new ContratoService();
