/**
 * Servicio de Brigada de Emergencias
 * Gestiona conformacion, capacitacion y actividades de brigadas
 * Normativa: Decreto 1072/2015
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class BrigadaService {
  /**
   * Obtener brigada activa
   */
  async getActiva() {
    return prisma.sSTBrigadaEmergencia.findFirst({
      where: { estado: 'ACTIVA' },
      include: {
        miembros: {
          where: { activo: true },
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
                email: true,
                cargo: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Listar brigadas
   */
  async findAll({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [brigadas, total] = await Promise.all([
      prisma.sSTBrigadaEmergencia.findMany({
        skip,
        take: limit,
        orderBy: { fechaConformacion: 'desc' },
        include: {
          _count: { select: { miembros: true } },
        },
      }),
      prisma.sSTBrigadaEmergencia.count(),
    ]);

    return {
      data: brigadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener brigada por ID
   */
  async findById(id) {
    const brigada = await prisma.sSTBrigadaEmergencia.findUnique({
      where: { id },
      include: {
        miembros: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
                email: true,
                cargo: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    if (!brigada) {
      throw new NotFoundError('Brigada no encontrada');
    }

    return brigada;
  }

  /**
   * Crear brigada
   */
  async create(data) {
    // Desactivar brigadas anteriores
    await prisma.sSTBrigadaEmergencia.updateMany({
      where: { estado: 'ACTIVA' },
      data: { estado: 'INACTIVA' },
    });

    const brigada = await prisma.sSTBrigadaEmergencia.create({
      data: {
        nombre: data.nombre || 'Brigada de Emergencias',
        fechaConformacion: new Date(data.fechaConformacion),
        resolucionConformacion: data.resolucionConformacion,
        objetivos: data.objetivos,
        funciones: data.funciones,
        equipamiento: data.equipamiento,
        frecuenciaEntrenamiento: data.frecuenciaEntrenamiento,
        estado: 'ACTIVA',
      },
    });

    return brigada;
  }

  /**
   * Actualizar brigada
   */
  async update(id, data) {
    const brigada = await prisma.sSTBrigadaEmergencia.findUnique({
      where: { id },
    });

    if (!brigada) {
      throw new NotFoundError('Brigada no encontrada');
    }

    return prisma.sSTBrigadaEmergencia.update({
      where: { id },
      data,
    });
  }

  /**
   * Agregar miembro a brigada
   */
  async agregarMiembro(brigadaId, data) {
    const brigada = await prisma.sSTBrigadaEmergencia.findUnique({
      where: { id: brigadaId },
    });

    if (!brigada) {
      throw new NotFoundError('Brigada no encontrada');
    }

    // Validar empleado
    const empleado = await prisma.tHEmpleado.findUnique({
      where: { id: data.empleadoId },
    });

    if (!empleado) {
      throw new ValidationError('Empleado no encontrado');
    }

    // Verificar que no sea ya miembro
    const existe = await prisma.sSTMiembroBrigada.findUnique({
      where: {
        brigadaId_empleadoId: { brigadaId, empleadoId: data.empleadoId },
      },
    });

    if (existe) {
      throw new ValidationError('El empleado ya es miembro de la brigada');
    }

    const miembro = await prisma.sSTMiembroBrigada.create({
      data: {
        brigadaId,
        empleadoId: data.empleadoId,
        rol: data.rol, // COORDINADOR, LIDER_EVACUACION, LIDER_PRIMEROS_AUXILIOS, LIDER_INCENDIOS, BRIGADISTA
        especialidad: data.especialidad, // EVACUACION, PRIMEROS_AUXILIOS, INCENDIOS, RESCATE
        certificaciones: data.certificaciones,
        fechaIngreso: new Date(),
        activo: true,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return miembro;
  }

  /**
   * Actualizar miembro
   */
  async actualizarMiembro(brigadaId, empleadoId, data) {
    const miembro = await prisma.sSTMiembroBrigada.findUnique({
      where: {
        brigadaId_empleadoId: { brigadaId, empleadoId },
      },
    });

    if (!miembro) {
      throw new NotFoundError('Miembro no encontrado');
    }

    return prisma.sSTMiembroBrigada.update({
      where: {
        brigadaId_empleadoId: { brigadaId, empleadoId },
      },
      data: {
        rol: data.rol,
        especialidad: data.especialidad,
        certificaciones: data.certificaciones,
      },
    });
  }

  /**
   * Remover miembro
   */
  async removerMiembro(brigadaId, empleadoId, motivo) {
    const miembro = await prisma.sSTMiembroBrigada.findUnique({
      where: {
        brigadaId_empleadoId: { brigadaId, empleadoId },
      },
    });

    if (!miembro) {
      throw new NotFoundError('Miembro no encontrado');
    }

    return prisma.sSTMiembroBrigada.update({
      where: {
        brigadaId_empleadoId: { brigadaId, empleadoId },
      },
      data: {
        activo: false,
        fechaRetiro: new Date(),
        motivoRetiro: motivo,
      },
    });
  }

  /**
   * Obtener miembros por especialidad
   */
  async getMiembrosPorEspecialidad(brigadaId) {
    const miembros = await prisma.sSTMiembroBrigada.findMany({
      where: { brigadaId, activo: true },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, telefono: true },
        },
      },
    });

    const porEspecialidad = {};
    miembros.forEach(m => {
      if (!porEspecialidad[m.especialidad]) {
        porEspecialidad[m.especialidad] = [];
      }
      porEspecialidad[m.especialidad].push(m);
    });

    return porEspecialidad;
  }

  /**
   * Obtener directorio de emergencias
   */
  async getDirectorioEmergencias(brigadaId) {
    const brigada = await prisma.sSTBrigadaEmergencia.findUnique({
      where: { id: brigadaId },
      include: {
        miembros: {
          where: { activo: true },
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
                email: true,
              },
            },
          },
          orderBy: { rol: 'asc' },
        },
      },
    });

    if (!brigada) {
      throw new NotFoundError('Brigada no encontrada');
    }

    // Organizar por rol
    const directorio = {
      coordinador: null,
      lideres: [],
      brigadistas: [],
    };

    brigada.miembros.forEach(m => {
      if (m.rol === 'COORDINADOR') {
        directorio.coordinador = m;
      } else if (m.rol.startsWith('LIDER_')) {
        directorio.lideres.push(m);
      } else {
        directorio.brigadistas.push(m);
      }
    });

    return directorio;
  }

  /**
   * Registrar entrenamiento de brigada
   */
  async registrarEntrenamiento(brigadaId, data) {
    // Crear capacitacion especifica para brigada
    const capacitacion = await prisma.sSTCapacitacionSST.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipoCapacitacion: 'BRIGADA',
        modalidad: data.modalidad || 'PRESENCIAL',
        fechaProgramada: new Date(data.fechaProgramada),
        duracionHoras: data.duracionHoras,
        lugar: data.lugar,
        facilitadorExterno: data.facilitador,
        estado: 'PROGRAMADA',
      },
    });

    // Inscribir miembros de brigada automaticamente
    const miembros = await prisma.sSTMiembroBrigada.findMany({
      where: { brigadaId, activo: true },
    });

    for (const miembro of miembros) {
      await prisma.sSTAsistenteCapacitacion.create({
        data: {
          capacitacionId: capacitacion.id,
          empleadoId: miembro.empleadoId,
          estado: 'INSCRITO',
        },
      });
    }

    return capacitacion;
  }

  /**
   * Obtener estadisticas de brigada
   */
  async getEstadisticas(brigadaId) {
    const brigada = await prisma.sSTBrigadaEmergencia.findUnique({
      where: { id: brigadaId },
      include: {
        miembros: { where: { activo: true } },
      },
    });

    if (!brigada) {
      throw new NotFoundError('Brigada no encontrada');
    }

    // Contar simulacros del año
    const anioActual = new Date().getFullYear();
    const simulacros = await prisma.sSTSimulacro.count({
      where: {
        fechaProgramada: {
          gte: new Date(anioActual, 0, 1),
          lte: new Date(anioActual, 11, 31),
        },
        estado: 'REALIZADO',
      },
    });

    // Contar capacitaciones de brigada
    const capacitaciones = await prisma.sSTCapacitacionSST.count({
      where: {
        tipoCapacitacion: 'BRIGADA',
        estado: 'REALIZADA',
        fechaEjecucion: {
          gte: new Date(anioActual, 0, 1),
          lte: new Date(anioActual, 11, 31),
        },
      },
    });

    // Miembros por especialidad
    const porEspecialidad = {};
    brigada.miembros.forEach(m => {
      porEspecialidad[m.especialidad] = (porEspecialidad[m.especialidad] || 0) + 1;
    });

    return {
      totalMiembros: brigada.miembros.length,
      porEspecialidad,
      simulacrosAnio: simulacros,
      capacitacionesAnio: capacitaciones,
    };
  }
}

module.exports = new BrigadaService();
