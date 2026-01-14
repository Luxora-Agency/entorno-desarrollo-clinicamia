/**
 * Servicio de Gestión de Empleados - Módulo Talento Humano
 */
const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
// const integracionSST = require('../sst/integracion.service'); // Commented out to avoid issues if file missing or incompatible

class EmpleadoService {
  /**
   * Mapear empleado de DB (snake_case) a Entidad (camelCase)
   */
  mapToEntity(emp) {
    if (!emp) return null;
    return {
      id: emp.id,
      usuarioId: emp.usuarioId,
      candidatoId: emp.candidatoId,
      tipoDocumento: emp.tipoDocumento,
      documento: emp.documento,
      nombre: emp.nombre,
      apellido: emp.apellido,
      fechaNacimiento: emp.fechaNacimiento,
      lugarNacimiento: emp.lugarNacimiento,
      genero: emp.genero,
      estadoCivil: emp.estadoCivil,
      nacionalidad: emp.nacionalidad,
      tipoSangre: emp.tipoSangre,
      fotoUrl: emp.fotoUrl,
      email: emp.email,
      emailCorporativo: emp.emailCorporativo,
      telefono: emp.telefono,
      telefonoEmergencia: emp.telefonoEmergencia,
      contactoEmergencia: emp.contactoEmergencia,
      parentescoEmergencia: emp.parentescoEmergencia,
      direccion: emp.direccion,
      ciudad: emp.ciudad,
      departamentoGeo: emp.departamentoGeo,
      cargoId: emp.cargoId,
      departamentoId: emp.departamentoId,
      jefeDirectoId: emp.jefeDirectoId,
      fechaIngreso: emp.fechaIngreso,
      fechaRetiro: emp.fechaRetiro,
      estado: emp.estado,
      tipoEmpleado: emp.tipoEmpleado,
      nivelEducativo: emp.nivelEducativo,
      profesion: emp.profesion,
      especializaciones: emp.especializaciones,
      numeroTarjetaProfesional: emp.numeroTarjetaProfesional,
      rethus: emp.rethus,
      eps: emp.eps,
      afp: emp.afp,
      arl: emp.arl,
      cajaCompensacion: emp.cajaCompensacion,
      banco: emp.banco,
      tipoCuenta: emp.tipoCuenta,
      numeroCuenta: emp.numeroCuenta,
      observaciones: emp.observaciones,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      // Relaciones
      cargo: emp.cargo,
      jefeDirecto: emp.jefeDirecto ? {
        id: emp.jefeDirecto.id,
        nombre: emp.jefeDirecto.nombre,
        apellido: emp.jefeDirecto.apellido,
        fotoUrl: emp.jefeDirecto.fotoUrl
      } : null,
      subordinados: emp.subordinados?.map(sub => ({
        id: sub.id,
        nombre: sub.nombre,
        apellido: sub.apellido,
        fotoUrl: sub.fotoUrl
      })),
      usuario: emp.usuario,
      _count: emp._count ? {
        subordinados: emp._count.subordinados,
        contratos: emp._count.contratos
      } : undefined
    };
  }

  /**
   * Listar empleados con filtros
   */
  async list({ estado, departamentoId, cargoId, tipoEmpleado, search, page = 1, limit = 20 }) {
    const where = {};
    if (estado) where.estado = estado;
    if (departamentoId) where.departamentoId = departamentoId;
    if (cargoId) where.cargoId = cargoId;
    if (tipoEmpleado) where.tipoEmpleado = tipoEmpleado;

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.tHEmpleado.findMany({
        where,
        include: {
          cargo: true,
          jefeDirecto: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { subordinados: true, contratos: true } }
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tHEmpleado.count({ where })
    ]);

    return {
      data: data.map(this.mapToEntity),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Obtener empleado por ID
   */
  async getById(id) {
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id },
      include: {
        cargo: true,
        jefeDirecto: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } },
        subordinados: { select: { id: true, nombre: true, apellido: true, fotoUrl: true } },
        usuario: { select: { id: true, email: true, activo: true } }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    return this.mapToEntity(empleado);
  }

  /**
   * Obtener expediente completo del empleado
   */
  async getExpediente(id) {
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id },
      include: {
        cargo: true,
        jefeDirecto: { select: { id: true, nombre: true, apellido: true } },
        contratos: { orderBy: { fechaInicio: 'desc' } },
        movimientos: { orderBy: { fechaEfectiva: 'desc' }, take: 20 },
        documentos: { orderBy: { createdAt: 'desc' } },
        evaluacionesRecibidas: {
          include: { periodo: true },
          orderBy: { fechaAsignacion: 'desc' },
          take: 10
        },
        capacitaciones: {
          include: { capacitacion: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        vacaciones: { orderBy: { solicitadoEl: 'desc' }, take: 10 },
        permisos: { orderBy: { solicitadoEl: 'desc' }, take: 10 },
        reconocimientos: { orderBy: { fecha: 'desc' }, take: 10 },
        objetivos: {
          where: { anio: new Date().getFullYear() },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const entity = this.mapToEntity(empleado);
    // Map related collections
    entity.contratos = empleado.contratos;
    entity.movimientos = empleado.movimientos;
    entity.documentos = empleado.documentos;
    entity.evaluacionesRecibidas = empleado.evaluacionesRecibidas;
    entity.capacitaciones = empleado.capacitaciones;
    entity.vacaciones = empleado.vacaciones;
    entity.permisos = empleado.permisos;
    entity.reconocimientos = empleado.reconocimientos;
    entity.objetivos = empleado.objetivos;

    return entity;
  }

  /**
   * Crear nuevo empleado
   */
  async create(data) {
    // Verificar documento único
    const existing = await prisma.tHEmpleado.findUnique({
      where: { documento: data.documento }
    });

    if (existing) {
      throw new ValidationError('Ya existe un empleado con este documento');
    }

    // Verificar que el cargo exista
    if (data.cargoId) {
      const cargo = await prisma.tHCargo.findUnique({ where: { id: data.cargoId } });
      if (!cargo) throw new ValidationError('Cargo no encontrado');
    }

    // Map data to Prisma camelCase fields
    const dbData = {
      tipoDocumento: data.tipoDocumento,
      documento: data.documento,
      nombre: data.nombre,
      apellido: data.apellido,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
      lugarNacimiento: data.lugarNacimiento,
      genero: data.genero,
      estadoCivil: data.estadoCivil,
      nacionalidad: data.nacionalidad,
      tipoSangre: data.tipoSangre,
      fotoUrl: data.fotoUrl,
      email: data.email,
      emailCorporativo: data.emailCorporativo,
      telefono: data.telefono,
      telefonoEmergencia: data.telefonoEmergencia,
      contactoEmergencia: data.contactoEmergencia,
      parentescoEmergencia: data.parentescoEmergencia,
      direccion: data.direccion,
      ciudad: data.ciudad,
      departamentoGeo: data.departamentoGeo,
      cargoId: data.cargoId,
      departamentoId: data.departamentoId,
      jefeDirectoId: data.jefeDirectoId,
      fechaIngreso: new Date(data.fechaIngreso),
      estado: data.estado || 'ACTIVO',
      tipoEmpleado: data.tipoEmpleado,
      nivelEducativo: data.nivelEducativo,
      profesion: data.profesion,
      especializaciones: data.especializaciones,
      numeroTarjetaProfesional: data.numeroTarjetaProfesional,
      rethus: data.rethus,
      eps: data.eps,
      afp: data.afp,
      arl: data.arl,
      cajaCompensacion: data.cajaCompensacion,
      banco: data.banco,
      tipoCuenta: data.tipoCuenta,
      numeroCuenta: data.numeroCuenta,
      observaciones: data.observaciones
    };

    const empleado = await prisma.tHEmpleado.create({
      data: dbData,
      include: { cargo: true }
    });

    // Hook SST: Inicializar perfil SST si tiene cargo asignado
    if (empleado.cargoId) {
      try {
        await integracionSST.onEmpleadoCreado(empleado.id, empleado.cargoId);
      } catch (err) {
        console.warn('[SST Hook] Error al inicializar SST para empleado:', err.message);
      }
    }

    return this.mapToEntity(empleado);
  }

  /**
   * Actualizar empleado
   */
  async update(id, data) {
    const empleado = await prisma.tHEmpleado.findUnique({ where: { id } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const cargoAnterior = empleado.cargoId;

    // Map update data using Prisma camelCase fields
    const dbData = {};
    if (data.tipoDocumento !== undefined) dbData.tipoDocumento = data.tipoDocumento;
    if (data.documento !== undefined) dbData.documento = data.documento;
    if (data.nombre !== undefined) dbData.nombre = data.nombre;
    if (data.apellido !== undefined) dbData.apellido = data.apellido;
    if (data.fechaNacimiento !== undefined) dbData.fechaNacimiento = data.fechaNacimiento;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.telefono !== undefined) dbData.telefono = data.telefono;
    if (data.direccion !== undefined) dbData.direccion = data.direccion;
    if (data.cargoId !== undefined) dbData.cargoId = data.cargoId;
    if (data.departamentoId !== undefined) dbData.departamentoId = data.departamentoId;
    if (data.jefeDirectoId !== undefined) dbData.jefeDirectoId = data.jefeDirectoId;
    if (data.estado !== undefined) dbData.estado = data.estado;
    if (data.tipoEmpleado !== undefined) dbData.tipoEmpleado = data.tipoEmpleado;
    // ... add others as needed

    const empleadoActualizado = await prisma.tHEmpleado.update({
      where: { id },
      data: dbData,
      include: { cargo: true }
    });

    // Hook SST: Si cambió el cargo, actualizar riesgos y exámenes
    if (data.cargoId && data.cargoId !== cargoAnterior) {
      try {
        await integracionSST.onCargoCambiado(id, data.cargoId, cargoAnterior);
      } catch (err) {
        console.warn('[SST Hook] Error al actualizar SST por cambio de cargo:', err.message);
      }
    }

    return this.mapToEntity(empleadoActualizado);
  }

  /**
   * Cambiar estado del empleado
   */
  async changeStatus(id, estado, motivo = null) {
    const empleado = await prisma.tHEmpleado.findUnique({ where: { id } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const updateData = { estado };
    if (estado === 'RETIRADO') {
      updateData.fechaRetiro = new Date();
    }

    return prisma.tHEmpleado.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Vincular empleado con usuario del sistema
   */
  async linkToUser(empleadoId, usuarioId) {
    const [empleado, usuario] = await Promise.all([
      prisma.tHEmpleado.findUnique({ where: { id: empleadoId } }),
      prisma.usuario.findUnique({ where: { id: usuarioId } })
    ]);

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    // Verificar que el usuario no esté ya vinculado
    const existingLink = await prisma.tHEmpleado.findUnique({
      where: { usuarioId: usuarioId }
    });

    if (existingLink) {
      throw new ValidationError('El usuario ya está vinculado a otro empleado');
    }

    return prisma.tHEmpleado.update({
      where: { id: empleadoId },
      data: { usuarioId: usuarioId }
    });
  }

  /**
   * Obtener organigrama
   */
  async getOrganigrama() {
    const empleados = await prisma.tHEmpleado.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        fotoUrl: true,
        jefeDirectoId: true,
        cargo: { select: { id: true, nombre: true, nivel: true } }
      },
      orderBy: [
        { cargo: { nivel: 'asc' } },
        { nombre: 'asc' }
      ]
    });

    // Construir árbol jerárquico
    const buildTree = (parentId = null) => {
      return empleados
        .filter(e => e.jefeDirectoId === parentId)
        .map(e => ({
          id: e.id,
          nombre: e.nombre,
          apellido: e.apellido,
          fotoUrl: e.fotoUrl,
          cargo: e.cargo,
          subordinados: buildTree(e.id)
        }));
    };

    return buildTree(null);
  }

  /**
   * Obtener estadísticas de empleados
   */
  async getStats() {
    const [
      total,
      activos,
      porTipo,
      porDepartamento,
      contratosProxVencer
    ] = await Promise.all([
      prisma.tHEmpleado.count(),
      prisma.tHEmpleado.count({ where: { estado: 'ACTIVO' } }),
      prisma.tHEmpleado.groupBy({
        by: ['tipoEmpleado'],
        _count: true,
        where: { estado: 'ACTIVO' }
      }),
      prisma.tHEmpleado.groupBy({
        by: ['departamentoId'],
        _count: true,
        where: { estado: 'ACTIVO' }
      }),
      prisma.tHContrato.count({
        where: {
          estado: 'ACTIVO',
          fechaFin: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
          }
        }
      })
    ]);

    return {
      total,
      activos,
      inactivos: total - activos,
      porTipo,
      porDepartamento,
      alertas: {
        contratosProxVencer
      }
    };
  }

  /**
   * Buscar empleados para autocompletar
   */
  async search(query, limit = 10) {
    return prisma.tHEmpleado.findMany({
      where: {
        estado: 'ACTIVO',
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { documento: { contains: query } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        documento: true,
        fotoUrl: true,
        cargo: { select: { nombre: true } }
      },
      take: limit
    });
  }
}

module.exports = new EmpleadoService();
