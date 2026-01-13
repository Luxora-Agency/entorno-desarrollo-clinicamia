/**
 * Service de Diagnósticos HCE
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const auditoriaService = require('./auditoria.service');

class DiagnosticoHCEService {
  /**
   * Obtener diagnósticos con filtros
   */
  async getAll({ page = 1, limit = 50, paciente_id, estado, es_diferencial }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (paciente_id) where.pacienteId = paciente_id;
    if (estado) where.estadoDiagnostico = estado;
    if (es_diferencial !== undefined) where.esDiferencial = es_diferencial === 'true';

    const [diagnosticos, total] = await Promise.all([
      prisma.diagnosticoHCE.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaDiagnostico: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          doctor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          evolucion: true,
        },
      }),
      prisma.diagnosticoHCE.count({ where }),
    ]);

    return {
      diagnosticos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener diagnóstico por ID
   */
  async getById(id) {
    const diagnostico = await prisma.diagnosticoHCE.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
        evolucion: true,
      },
    });

    if (!diagnostico) {
      throw new NotFoundError('Diagnóstico no encontrado');
    }

    return diagnostico;
  }

  /**
   * Crear diagnóstico
   */
  async create(data, usuarioId, usuarioData, ipOrigen = null) {
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');
    if (!data.codigo_cie11) throw new ValidationError('codigo_cie11 es requerido');
    if (!data.descripcion_cie11) throw new ValidationError('descripcion_cie11 es requerido');

    const diagnostico = await prisma.diagnosticoHCE.create({
      data: {
        pacienteId: data.paciente_id,
        evolucionId: data.evolucion_id || null,
        admisionId: data.admision_id || null,
        doctorId: usuarioId,
        codigoCIE11: data.codigo_cie11,
        descripcionCIE11: data.descripcion_cie11,
        tipoDiagnostico: data.tipo_diagnostico || 'Principal',
        estadoDiagnostico: data.estado_diagnostico || 'Activo',
        clasificacion: data.clasificacion || null, // ImpresionDiagnostica, ConfirmadoNuevo, ConfirmadoRepetido
        esDiferencial: data.es_diferencial || false,
        observaciones: data.observaciones || null,
        severidad: data.severidad || null,
        fechaDiagnostico: data.fecha_diagnostico ? new Date(data.fecha_diagnostico) : new Date(),
      },
      include: {
        paciente: true,
        doctor: true,
      },
    });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'DiagnosticoHCE',
      entidadId: diagnostico.id,
      accion: 'Creacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresNuevos: diagnostico,
      ipOrigen,
    });

    return diagnostico;
  }

  /**
   * Actualizar estado del diagnóstico
   */
  async update(id, data, usuarioId, usuarioData, ipOrigen = null) {
    const diagnosticoAnterior = await this.getById(id);

    const updateData = {};
    if (data.estado_diagnostico) updateData.estadoDiagnostico = data.estado_diagnostico;
    if (data.clasificacion !== undefined) updateData.clasificacion = data.clasificacion || null;
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
    if (data.severidad) updateData.severidad = data.severidad;
    if (data.fecha_resolucion) {
      updateData.fechaResolucion = new Date(data.fecha_resolucion);
    }

    const diagnostico = await prisma.diagnosticoHCE.update({
      where: { id },
      data: updateData,
      include: {
        paciente: true,
        doctor: true,
      },
    });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'DiagnosticoHCE',
      entidadId: id,
      accion: 'Modificacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresAnteriores: diagnosticoAnterior,
      valoresNuevos: diagnostico,
      ipOrigen,
    });

    return diagnostico;
  }

  /**
   * Obtener diagnóstico principal activo de un paciente
   */
  async getDiagnosticoPrincipal(pacienteId) {
    const diagnostico = await prisma.diagnosticoHCE.findFirst({
      where: {
        pacienteId,
        tipoDiagnostico: 'Principal',
        estadoDiagnostico: 'Activo',
      },
      orderBy: { fechaDiagnostico: 'desc' },
      include: {
        doctor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return diagnostico;
  }
}

module.exports = new DiagnosticoHCEService();
