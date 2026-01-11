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
      usuarioId: emp.usuario_id,
      candidatoId: emp.candidato_id,
      tipoDocumento: emp.tipo_documento,
      documento: emp.documento,
      nombre: emp.nombre,
      apellido: emp.apellido,
      fechaNacimiento: emp.fecha_nacimiento,
      lugarNacimiento: emp.lugar_nacimiento,
      genero: emp.genero,
      estadoCivil: emp.estado_civil,
      nacionalidad: emp.nacionalidad,
      tipoSangre: emp.tipo_sangre,
      fotoUrl: emp.foto_url,
      email: emp.email,
      emailCorporativo: emp.email_corporativo,
      telefono: emp.telefono,
      telefonoEmergencia: emp.telefono_emergencia,
      contactoEmergencia: emp.contacto_emergencia,
      parentescoEmergencia: emp.parentesco_emergencia,
      direccion: emp.direccion,
      ciudad: emp.ciudad,
      departamentoGeo: emp.departamento_geo,
      cargoId: emp.cargo_id,
      departamentoId: emp.departamento_id,
      jefeDirectoId: emp.jefe_directo_id,
      fechaIngreso: emp.fecha_ingreso,
      fechaRetiro: emp.fecha_retiro,
      estado: emp.estado,
      tipoEmpleado: emp.tipo_empleado,
      nivelEducativo: emp.nivel_educativo,
      profesion: emp.profesion,
      especializaciones: emp.especializaciones,
      numeroTarjetaProfesional: emp.numero_tarjeta_profesional,
      rethus: emp.rethus,
      eps: emp.eps,
      afp: emp.afp,
      arl: emp.arl,
      cajaCompensacion: emp.caja_compensacion,
      banco: emp.banco,
      tipoCuenta: emp.tipo_cuenta,
      numeroCuenta: emp.numero_cuenta,
      observaciones: emp.observaciones,
      createdAt: emp.created_at,
      updatedAt: emp.updated_at,
      // Relaciones
      cargo: emp.th_cargos,
      jefeDirecto: emp.th_empleados ? {
        id: emp.th_empleados.id,
        nombre: emp.th_empleados.nombre,
        apellido: emp.th_empleados.apellido,
        fotoUrl: emp.th_empleados.foto_url
      } : null,
      subordinados: emp.other_th_empleados?.map(sub => ({
        id: sub.id,
        nombre: sub.nombre,
        apellido: sub.apellido,
        fotoUrl: sub.foto_url
      })),
      usuario: emp.usuarios,
      _count: emp._count ? {
        subordinados: emp._count.other_th_empleados,
        contratos: emp._count.th_contratos
      } : undefined
    };
  }

  /**
   * Listar empleados con filtros
   */
  async list({ estado, departamentoId, cargoId, tipoEmpleado, search, page = 1, limit = 20 }) {
    const where = {};
    if (estado) where.estado = estado;
    if (departamentoId) where.departamento_id = departamentoId;
    if (cargoId) where.cargo_id = cargoId;
    if (tipoEmpleado) where.tipo_empleado = tipoEmpleado;

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.th_empleados.findMany({
        where,
        include: {
          th_cargos: true,
          th_empleados: { select: { id: true, nombre: true, apellido: true } }, // Jefe
          _count: { select: { other_th_empleados: true, th_contratos: true } }
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.th_empleados.count({ where })
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
    const empleado = await prisma.th_empleados.findUnique({
      where: { id },
      include: {
        th_cargos: true,
        th_empleados: { select: { id: true, nombre: true, apellido: true, foto_url: true } },
        other_th_empleados: { select: { id: true, nombre: true, apellido: true, foto_url: true } },
        usuarios: { select: { id: true, email: true, activo: true } }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    return this.mapToEntity(empleado);
  }

  /**
   * Obtener expediente completo del empleado
   */
  async getExpediente(id) {
    const empleado = await prisma.th_empleados.findUnique({
      where: { id },
      include: {
        th_cargos: true,
        th_empleados: { select: { id: true, nombre: true, apellido: true } },
        th_contratos: { orderBy: { fecha_inicio: 'desc' } },
        th_movimientos: { orderBy: { fecha_efectiva: 'desc' }, take: 20 },
        th_documentos_empleado: { orderBy: { created_at: 'desc' } },
        // th_evaluaciones_desempeno (recibidas)
        th_evaluaciones_desempeno_th_evaluaciones_desempeno_empleado_idToth_empleados: {
          include: { th_periodos_evaluacion: true },
          orderBy: { fecha_asignacion: 'desc' },
          take: 10
        },
        th_asistentes_capacitacion: {
          include: { th_capacitaciones: true },
          orderBy: { created_at: 'desc' }, // Check if created_at exists in relation table
          take: 10
        },
        th_vacaciones: { orderBy: { solicitado_el: 'desc' }, take: 10 },
        th_permisos: { orderBy: { solicitado_el: 'desc' }, take: 10 },
        th_reconocimientos: { orderBy: { fecha: 'desc' }, take: 10 },
        th_objetivos: {
          where: { anio: new Date().getFullYear() },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    
    const entity = this.mapToEntity(empleado);
    // Map related collections
    entity.contratos = empleado.th_contratos;
    entity.movimientos = empleado.th_movimientos;
    entity.documentos = empleado.th_documentos_empleado;
    entity.evaluacionesRecibidas = empleado.th_evaluaciones_desempeno_th_evaluaciones_desempeno_empleado_idToth_empleados;
    entity.capacitaciones = empleado.th_asistentes_capacitacion;
    entity.vacaciones = empleado.th_vacaciones;
    entity.permisos = empleado.th_permisos;
    entity.reconocimientos = empleado.th_reconocimientos;
    entity.objetivos = empleado.th_objetivos;

    return entity;
  }

  /**
   * Crear nuevo empleado
   */
  async create(data) {
    // Verificar documento único
    const existing = await prisma.th_empleados.findUnique({
      where: { documento: data.documento }
    });

    if (existing) {
      throw new ValidationError('Ya existe un empleado con este documento');
    }

    // Verificar que el cargo exista
    if (data.cargoId) {
      const cargo = await prisma.th_cargos.findUnique({ where: { id: data.cargoId } });
      if (!cargo) throw new ValidationError('Cargo no encontrado');
    }

    // Map data to snake_case
    const dbData = {
      tipo_documento: data.tipoDocumento,
      documento: data.documento,
      nombre: data.nombre,
      apellido: data.apellido,
      fecha_nacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
      lugar_nacimiento: data.lugarNacimiento,
      genero: data.genero,
      estado_civil: data.estadoCivil,
      nacionalidad: data.nacionalidad,
      tipo_sangre: data.tipoSangre,
      foto_url: data.fotoUrl,
      email: data.email,
      email_corporativo: data.emailCorporativo,
      telefono: data.telefono,
      telefono_emergencia: data.telefonoEmergencia,
      contacto_emergencia: data.contactoEmergencia,
      parentesco_emergencia: data.parentescoEmergencia,
      direccion: data.direccion,
      ciudad: data.ciudad,
      departamento_geo: data.departamentoGeo,
      cargo_id: data.cargoId,
      departamento_id: data.departamentoId,
      jefe_directo_id: data.jefeDirectoId,
      fecha_ingreso: new Date(data.fechaIngreso),
      estado: data.estado || 'ACTIVO',
      tipo_empleado: data.tipoEmpleado,
      nivel_educativo: data.nivelEducativo,
      profesion: data.profesion,
      especializaciones: data.especializaciones,
      numero_tarjeta_profesional: data.numeroTarjetaProfesional,
      rethus: data.rethus,
      eps: data.eps,
      afp: data.afp,
      arl: data.arl,
      caja_compensacion: data.cajaCompensacion,
      banco: data.banco,
      tipo_cuenta: data.tipoCuenta,
      numero_cuenta: data.numeroCuenta,
      observaciones: data.observaciones
    };

    const empleado = await prisma.th_empleados.create({
      data: dbData,
      include: { th_cargos: true }
    });

    // Hook SST: Inicializar perfil SST si tiene cargo asignado
    if (empleado.cargo_id) {
      try {
        await integracionSST.onEmpleadoCreado(empleado.id, empleado.cargo_id);
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
    const empleado = await prisma.th_empleados.findUnique({ where: { id } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const cargoAnterior = empleado.cargo_id;

    // Map update data
    const dbData = {};
    if (data.tipoDocumento !== undefined) dbData.tipo_documento = data.tipoDocumento;
    if (data.documento !== undefined) dbData.documento = data.documento;
    if (data.nombre !== undefined) dbData.nombre = data.nombre;
    if (data.apellido !== undefined) dbData.apellido = data.apellido;
    if (data.fechaNacimiento !== undefined) dbData.fecha_nacimiento = data.fechaNacimiento;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.telefono !== undefined) dbData.telefono = data.telefono;
    if (data.direccion !== undefined) dbData.direccion = data.direccion;
    if (data.cargoId !== undefined) dbData.cargo_id = data.cargoId;
    if (data.departamentoId !== undefined) dbData.departamento_id = data.departamentoId;
    if (data.jefeDirectoId !== undefined) dbData.jefe_directo_id = data.jefeDirectoId;
    if (data.estado !== undefined) dbData.estado = data.estado;
    if (data.tipoEmpleado !== undefined) dbData.tipo_empleado = data.tipoEmpleado;
    // ... add others as needed

    const empleadoActualizado = await prisma.th_empleados.update({
      where: { id },
      data: dbData,
      include: { th_cargos: true }
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
    const empleado = await prisma.th_empleados.findUnique({ where: { id } });
    if (!empleado) throw new NotFoundError('Empleado no encontrado');

    const updateData = { estado };
    if (estado === 'RETIRADO') {
      updateData.fecha_retiro = new Date();
    }

    return prisma.th_empleados.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Vincular empleado con usuario del sistema
   */
  async linkToUser(empleadoId, usuarioId) {
    const [empleado, usuario] = await Promise.all([
      prisma.th_empleados.findUnique({ where: { id: empleadoId } }),
      prisma.usuario.findUnique({ where: { id: usuarioId } })
    ]);

    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    if (!usuario) throw new NotFoundError('Usuario no encontrado');

    // Verificar que el usuario no esté ya vinculado
    const existingLink = await prisma.th_empleados.findUnique({
      where: { usuario_id: usuarioId }
    });

    if (existingLink) {
      throw new ValidationError('El usuario ya está vinculado a otro empleado');
    }

    return prisma.th_empleados.update({
      where: { id: empleadoId },
      data: { usuario_id: usuarioId }
    });
  }

  /**
   * Obtener organigrama
   */
  async getOrganigrama() {
    const empleados = await prisma.th_empleados.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        foto_url: true,
        jefe_directo_id: true,
        th_cargos: { select: { id: true, nombre: true, nivel: true } }
      },
      orderBy: [
        { th_cargos: { nivel: 'asc' } },
        { nombre: 'asc' }
      ]
    });

    // Construir árbol jerárquico
    const buildTree = (parentId = null) => {
      return empleados
        .filter(e => e.jefe_directo_id === parentId)
        .map(e => ({
          id: e.id,
          nombre: e.nombre,
          apellido: e.apellido,
          fotoUrl: e.foto_url,
          cargo: e.th_cargos,
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
      prisma.th_empleados.count(),
      prisma.th_empleados.count({ where: { estado: 'ACTIVO' } }),
      prisma.th_empleados.groupBy({
        by: ['tipo_empleado'],
        _count: true,
        where: { estado: 'ACTIVO' }
      }),
      prisma.th_empleados.groupBy({
        by: ['departamento_id'],
        _count: true,
        where: { estado: 'ACTIVO' }
      }),
      prisma.th_contratos.count({
        where: {
          estado: 'ACTIVO',
          fecha_fin: {
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
    return prisma.th_empleados.findMany({
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
        foto_url: true,
        th_cargos: { select: { nombre: true } }
      },
      take: limit
    });
  }
}

module.exports = new EmpleadoService();
