/**
 * Service de Alertas Clínicas
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const auditoriaService = require('./auditoria.service');

class AlertaClinicaService {
  /**
   * Obtener alertas con filtros
   */
  async getAll({ page = 1, limit = 50, paciente_id, activa, tipo_alerta, severidad }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (paciente_id) where.pacienteId = paciente_id;
    if (activa !== undefined) where.activa = activa === 'true';
    if (tipo_alerta) where.tipoAlerta = tipo_alerta;
    if (severidad) where.severidad = severidad;

    const [alertas, total] = await Promise.all([
      prisma.alertaClinica.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaAlerta: 'desc' },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          reconocedor: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      prisma.alertaClinica.count({ where }),
    ]);

    return {
      alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener alerta por ID
   */
  async getById(id) {
    const alerta = await prisma.alertaClinica.findUnique({
      where: { id },
      include: {
        paciente: true,
        reconocedor: true,
      },
    });

    if (!alerta) {
      throw new NotFoundError('Alerta no encontrada');
    }

    return alerta;
  }

  /**
   * Crear alerta clínica
   */
  async create(data, usuarioId, usuarioData, ipOrigen = null) {
    if (!data.paciente_id) throw new ValidationError('paciente_id es requerido');
    if (!data.tipo_alerta) throw new ValidationError('tipo_alerta es requerido');
    if (!data.titulo) throw new ValidationError('titulo es requerido');
    if (!data.descripcion) throw new ValidationError('descripcion es requerido');

    const alerta = await prisma.alertaClinica.create({
      data: {
        pacienteId: data.paciente_id,
        tipoAlerta: data.tipo_alerta,
        severidad: data.severidad || 'Moderada',
        titulo: data.titulo,
        descripcion: data.descripcion,
        origen: data.origen || null,
        valorReferencia: data.valor_referencia || null,
        visiblePara: data.visible_para || ['DOCTOR', 'NURSE', 'ADMIN'],
        colorAlerta: data.color_alerta || this.getColorPorSeveridad(data.severidad),
        iconoAlerta: data.icono_alerta || null,
        fechaExpiracion: data.fecha_expiracion ? new Date(data.fecha_expiracion) : null,
      },
      include: {
        paciente: true,
      },
    });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'AlertaClinica',
      entidadId: alerta.id,
      accion: 'Creacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresNuevos: alerta,
      ipOrigen,
    });

    return alerta;
  }

  /**
   * Reconocer alerta
   */
  async reconocer(id, usuarioId, usuarioData, ipOrigen = null) {
    const alerta = await this.getById(id);

    if (!alerta.activa) {
      throw new ValidationError('La alerta ya ha sido reconocida');
    }

    const alertaActualizada = await prisma.alertaClinica.update({
      where: { id },
      data: {
        activa: false,
        reconocidaPor: usuarioId,
        fechaReconocimiento: new Date(),
      },
    });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'AlertaClinica',
      entidadId: id,
      accion: 'Modificacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresAnteriores: alerta,
      valoresNuevos: alertaActualizada,
      ipOrigen,
    });

    return alertaActualizada;
  }

  /**
   * Obtener alertas activas de un paciente
   */
  async getAlertasActivas(pacienteId) {
    const alertas = await prisma.alertaClinica.findMany({
      where: {
        pacienteId,
        activa: true,
      },
      orderBy: [
        { severidad: 'desc' },
        { fechaAlerta: 'desc' },
      ],
    });

    return alertas;
  }

  /**
   * Eliminar alerta
   */
  async delete(id, usuarioId, usuarioData) {
    const alerta = await this.getById(id);

    await prisma.alertaClinica.delete({ where: { id } });

    // Auditoría
    await auditoriaService.registrarAccion({
      entidad: 'AlertaClinica',
      entidadId: id,
      accion: 'Eliminacion',
      usuarioId,
      nombreUsuario: `${usuarioData.nombre} ${usuarioData.apellido}`,
      rol: usuarioData.rol,
      valoresAnteriores: alerta,
    });

    return true;
  }

  /**
   * Obtener color según severidad
   */
  getColorPorSeveridad(severidad) {
    const colores = {
      Leve: 'yellow',
      Moderada: 'orange',
      Grave: 'red',
      Critica: 'purple',
    };
    return colores[severidad] || 'gray';
  }
}

module.exports = new AlertaClinicaService();
