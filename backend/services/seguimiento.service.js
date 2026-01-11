/**
 * Service para gestión de seguimientos y controles
 */
const prisma = require('../db/prisma');
const { NotFoundError } = require('../utils/errors');

class SeguimientoService {
  /**
   * Crear seguimiento/control
   */
  async create(data) {
    const fechaSugerida = new Date();
    fechaSugerida.setDate(fechaSugerida.getDate() + data.diasParaControl);

    return prisma.seguimientoControl.create({
      data: {
        pacienteId: data.pacienteId,
        doctorId: data.doctorId,
        citaOrigenId: data.citaOrigenId,
        tipoSeguimiento: data.tipoSeguimiento,
        fechaSugerida,
        diasParaControl: data.diasParaControl,
        motivo: data.motivo,
        instrucciones: data.instrucciones,
        prioridad: data.prioridad || 'Normal',
      },
      include: {
        paciente: true,
        doctor: true,
      },
    });
  }

  /**
   * Obtener seguimientos por paciente
   */
  async getByPaciente(pacienteId) {
    return prisma.seguimientoControl.findMany({
      where: { pacienteId },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaSugerida: 'asc' },
    });
  }

  /**
   * Obtener seguimientos pendientes por doctor
   */
  async getPendientesByDoctor(doctorId) {
    return prisma.seguimientoControl.findMany({
      where: {
        doctorId,
        estado: 'Pendiente',
      },
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, telefono: true },
        },
      },
      orderBy: { fechaSugerida: 'asc' },
    });
  }

  /**
   * Obtener seguimiento por ID
   */
  async getById(id) {
    const seguimiento = await prisma.seguimientoControl.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
      },
    });

    if (!seguimiento) {
      throw new NotFoundError('Seguimiento no encontrado');
    }

    return seguimiento;
  }

  /**
   * Marcar como completado
   */
  async complete(id, notas) {
    return prisma.seguimientoControl.update({
      where: { id },
      data: {
        estado: 'Completado',
        fechaCompletado: new Date(),
        notasCompletado: notas,
      },
    });
  }

  /**
   * Asociar cita generada
   */
  async asociarCita(id, citaGeneradaId) {
    return prisma.seguimientoControl.update({
      where: { id },
      data: {
        citaGeneradaId,
        estado: 'CitaAgendada',
      },
    });
  }

  /**
   * Cancelar seguimiento
   */
  async cancel(id) {
    return prisma.seguimientoControl.update({
      where: { id },
      data: { estado: 'Cancelado' },
    });
  }
}

module.exports = new SeguimientoService();
