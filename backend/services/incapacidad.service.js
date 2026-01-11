/**
 * Service para gestión de incapacidades médicas
 * Basado en normatividad colombiana: Decreto 2126/2023, Resolución 1843/2025
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

class IncapacidadService {
  /**
   * Generar código único para la incapacidad
   */
  async generateCodigo() {
    const year = new Date().getFullYear();
    const count = await prisma.incapacidadMedica.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    return `INC-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Calcular días acumulados para prórrogas
   */
  async calcularDiasAcumulados(incapacidadOriginalId) {
    if (!incapacidadOriginalId) return 0;

    const prorrogas = await prisma.incapacidadMedica.findMany({
      where: {
        OR: [
          { id: incapacidadOriginalId },
          { incapacidadOriginalId },
        ],
      },
      select: { diasIncapacidad: true },
    });

    return prorrogas.reduce((sum, p) => sum + p.diasIncapacidad, 0);
  }

  /**
   * Crear incapacidad médica
   */
  async create(data) {
    const codigo = await this.generateCodigo();

    // Calcular días acumulados si es prórroga
    let diasAcumulados = 0;
    if (data.esProrrogada && data.incapacidadOriginalId) {
      diasAcumulados = await this.calcularDiasAcumulados(data.incapacidadOriginalId);
      diasAcumulados += data.diasIncapacidad;
    }

    // Validar fechas
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFin);
    if (fechaFin < fechaInicio) {
      throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const incapacidad = await prisma.incapacidadMedica.create({
      data: {
        codigo,
        pacienteId: data.pacienteId,
        doctorId: data.doctorId,
        citaId: data.citaId,
        tipoIncapacidad: data.tipoIncapacidad,
        fechaInicio,
        fechaFin,
        diasIncapacidad: data.diasIncapacidad,
        diagnosticoCIE10: data.diagnosticoCIE10,
        descripcionDiagnostico: data.descripcionDiagnostico,
        esProrrogada: data.esProrrogada || false,
        incapacidadOriginalId: data.incapacidadOriginalId,
        diasAcumulados: diasAcumulados || null,
        conceptoRehabilitacion: data.conceptoRehabilitacion,
        justificacion: data.justificacion,
        restricciones: data.restricciones,
        recomendaciones: data.recomendaciones,
        firmadoPor: data.doctorId,
        fechaFirma: new Date(),
      },
      include: {
        paciente: true,
        doctor: true,
      },
    });

    return incapacidad;
  }

  /**
   * Obtener incapacidades por paciente
   */
  async getByPaciente(pacienteId) {
    return prisma.incapacidadMedica.findMany({
      where: { pacienteId },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true },
        },
        prorrogas: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  /**
   * Obtener incapacidad por ID
   */
  async getById(id) {
    const incapacidad = await prisma.incapacidadMedica.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
        cita: true,
        incapacidadOriginal: true,
        prorrogas: true,
      },
    });

    if (!incapacidad) {
      throw new NotFoundError('Incapacidad no encontrada');
    }

    return incapacidad;
  }

  /**
   * Obtener incapacidades por doctor
   */
  async getByDoctor(doctorId, filtros = {}) {
    const where = { doctorId };

    if (filtros.fechaDesde) {
      where.fechaInicio = { gte: new Date(filtros.fechaDesde) };
    }
    if (filtros.fechaHasta) {
      where.fechaFin = { lte: new Date(filtros.fechaHasta) };
    }
    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    return prisma.incapacidadMedica.findMany({
      where,
      include: {
        paciente: {
          select: { id: true, nombre: true, apellido: true, cedula: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Actualizar PDF URL
   */
  async updatePdfUrl(id, pdfUrl) {
    return prisma.incapacidadMedica.update({
      where: { id },
      data: { pdfUrl },
    });
  }

  /**
   * Cancelar incapacidad
   */
  async cancel(id, motivo) {
    const incapacidad = await this.getById(id);

    return prisma.incapacidadMedica.update({
      where: { id },
      data: {
        estado: 'Cancelada',
        recomendaciones: `CANCELADA: ${motivo}\n\n${incapacidad.recomendaciones || ''}`,
      },
    });
  }
}

module.exports = new IncapacidadService();
