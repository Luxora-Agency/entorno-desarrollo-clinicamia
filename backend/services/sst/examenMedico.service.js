/**
 * Servicio de Examenes Medicos Ocupacionales
 * Gestiona examenes de ingreso, periodicos y egreso
 * Normativa: Resolucion 1843/2025, Decreto 1072/2015
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class ExamenMedicoService {
  /**
   * Listar examenes medicos con filtros
   */
  async findAll({ page = 1, limit = 20, tipo, estado, empleadoId, desde, hasta }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipoExamen = tipo;
    if (estado) where.estado = estado;
    if (empleadoId) where.empleadoId = empleadoId;

    if (desde || hasta) {
      where.fechaExamen = {};
      if (desde) where.fechaExamen.gte = new Date(desde);
      if (hasta) where.fechaExamen.lte = new Date(hasta);
    }

    const [examenes, total] = await Promise.all([
      prisma.sSTExamenMedico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaExamen: 'desc' },
        include: {
          empleado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              documento: true,
              cargo: { select: { nombre: true } },
            },
          },
          proveedor: {
            select: { id: true, nombre: true },
          },
        },
      }),
      prisma.sSTExamenMedico.count({ where }),
    ]);

    return {
      data: examenes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener examen por ID con componentes
   */
  async findById(id) {
    const examen = await prisma.sSTExamenMedico.findUnique({
      where: { id },
      include: {
        empleado: {
          include: {
            cargo: true,
          },
        },
        proveedor: true,
        componentes: true,
      },
    });

    if (!examen) {
      throw new NotFoundError('Examen medico no encontrado');
    }

    return examen;
  }

  /**
   * Programar nuevo examen medico
   */
  async create(data) {
    // Validar empleado
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
      include: { cargo: true },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    // Obtener profesiograma del cargo si existe
    let profesiograma = null;
    if (empleado.cargoId) {
      profesiograma = await prisma.sSTProfesiograma.findFirst({
        where: { cargoId: empleado.cargoId, vigente: true },
        include: { examenes: true },
      });
    }

    const examen = await prisma.sSTExamenMedico.create({
      data: {
        empleadoId: data.empleadoId,
        tipoExamen: data.tipoExamen, // INGRESO, PERIODICO, EGRESO, REINTEGRO, CAMBIO_OCUPACION
        fechaExamen: data.fechaExamen ? new Date(data.fechaExamen) : null,
        proveedorId: data.proveedorId,
        profesiogramaId: profesiograma?.id,
        estado: 'PROGRAMADO',
        observaciones: data.observaciones,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Si hay profesiograma, crear componentes automaticamente
    if (profesiograma?.examenes) {
      const componentes = profesiograma.examenes.map(e => ({
        examenMedicoId: examen.id,
        nombreComponente: e.nombre,
        tipoComponente: e.tipo,
        obligatorio: e.obligatorio,
        estado: 'PENDIENTE',
      }));

      await prisma.sSTComponenteExamen.createMany({
        data: componentes,
      });
    }

    return examen;
  }

  /**
   * Actualizar examen
   */
  async update(id, data) {
    const examen = await prisma.sSTExamenMedico.findUnique({
      where: { id },
    });

    if (!examen) {
      throw new NotFoundError('Examen medico no encontrado');
    }

    const updated = await prisma.sSTExamenMedico.update({
      where: { id },
      data: {
        ...data,
        fechaExamen: data.fechaExamen ? new Date(data.fechaExamen) : undefined,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
      },
    });

    return updated;
  }

  /**
   * Registrar resultado del examen
   */
  async registrarResultado(id, data) {
    const examen = await prisma.sSTExamenMedico.findUnique({
      where: { id },
    });

    if (!examen) {
      throw new NotFoundError('Examen medico no encontrado');
    }

    // Calcular fecha de vencimiento segun periodicidad
    let fechaVencimiento = null;
    if (data.periodicidad && data.fechaExamen) {
      const fecha = new Date(data.fechaExamen);
      switch (data.periodicidad) {
        case 'ANUAL':
          fechaVencimiento = new Date(fecha.setFullYear(fecha.getFullYear() + 1));
          break;
        case 'SEMESTRAL':
          fechaVencimiento = new Date(fecha.setMonth(fecha.getMonth() + 6));
          break;
        case 'TRIMESTRAL':
          fechaVencimiento = new Date(fecha.setMonth(fecha.getMonth() + 3));
          break;
        default:
          fechaVencimiento = new Date(fecha.setFullYear(fecha.getFullYear() + 1));
      }
    }

    const updated = await prisma.sSTExamenMedico.update({
      where: { id },
      data: {
        fechaExamen: data.fechaExamen ? new Date(data.fechaExamen) : undefined,
        conceptoAptitud: data.conceptoAptitud, // APTO, APTO_CON_RESTRICCIONES, NO_APTO, APLAZADO
        restricciones: data.restricciones,
        recomendaciones: data.recomendaciones,
        diagnosticos: data.diagnosticos,
        fechaVencimiento,
        estado: 'REALIZADO',
        urlDocumento: data.urlDocumento,
      },
    });

    return updated;
  }

  /**
   * Agregar componente a examen
   */
  async agregarComponente(examenId, data) {
    const examen = await prisma.sSTExamenMedico.findUnique({
      where: { id: examenId },
    });

    if (!examen) {
      throw new NotFoundError('Examen medico no encontrado');
    }

    const componente = await prisma.sSTComponenteExamen.create({
      data: {
        examenMedicoId: examenId,
        nombreComponente: data.nombreComponente,
        tipoComponente: data.tipoComponente,
        obligatorio: data.obligatorio || false,
        estado: 'PENDIENTE',
      },
    });

    return componente;
  }

  /**
   * Actualizar resultado de componente
   */
  async actualizarComponente(componenteId, data) {
    const componente = await prisma.sSTComponenteExamen.findUnique({
      where: { id: componenteId },
    });

    if (!componente) {
      throw new NotFoundError('Componente no encontrado');
    }

    const updated = await prisma.sSTComponenteExamen.update({
      where: { id: componenteId },
      data: {
        resultado: data.resultado,
        valorReferencia: data.valorReferencia,
        interpretacion: data.interpretacion,
        observaciones: data.observaciones,
        estado: 'COMPLETADO',
      },
    });

    return updated;
  }

  /**
   * Obtener examenes proximos a vencer
   */
  async getProximosVencer(diasAnticipacion = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.sSTExamenMedico.findMany({
      where: {
        estado: 'REALIZADO',
        fechaVencimiento: {
          lte: fechaLimite,
          gte: new Date(),
        },
        empleado: {
          estado: 'ACTIVO',
        },
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            cargo: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  /**
   * Obtener examenes vencidos
   */
  async getVencidos() {
    return prisma.sSTExamenMedico.findMany({
      where: {
        estado: 'REALIZADO',
        fechaVencimiento: { lt: new Date() },
        empleado: {
          estado: 'ACTIVO',
        },
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargo: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  /**
   * Obtener cobertura de examenes
   */
  async getCobertura() {
    const totalEmpleados = await prisma.tHEmpleado.count({
      where: { estado: 'ACTIVO' },
    });

    const empleadosConExamenVigente = await prisma.sSTExamenMedico.groupBy({
      by: ['empleadoId'],
      where: {
        estado: 'REALIZADO',
        fechaVencimiento: { gte: new Date() },
      },
    });

    const coberturaExamenes = (empleadosConExamenVigente.length / totalEmpleados) * 100;

    // Cobertura por tipo de examen
    const porTipo = await prisma.sSTExamenMedico.groupBy({
      by: ['tipoExamen'],
      _count: true,
    });

    return {
      totalEmpleados,
      empleadosConExamenVigente: empleadosConExamenVigente.length,
      coberturaExamenes: Math.round(coberturaExamenes * 100) / 100,
      porTipo: porTipo.map(t => ({ tipo: t.tipoExamen, cantidad: t._count })),
    };
  }

  /**
   * Obtener proveedores de salud ocupacional
   */
  async getProveedores() {
    return prisma.sSTProveedorMedico.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Crear proveedor
   */
  async crearProveedor(data) {
    return prisma.sSTProveedorMedico.create({
      data: {
        nombre: data.nombre,
        nit: data.nit,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        contacto: data.contacto,
        licencia: data.licencia,
        activo: true,
      },
    });
  }
}

module.exports = new ExamenMedicoService();
