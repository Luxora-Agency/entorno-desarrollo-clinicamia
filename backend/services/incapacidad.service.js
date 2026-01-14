/**
 * Service para gestión de incapacidades médicas
 * Basado en normatividad colombiana: Decreto 2126/2023, Resolución 1843/2025
 */
const prisma = require('../db/prisma');
const PDFDocument = require('pdfkit');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Información institucional de Clínica MIA
const CLINICA_INFO = {
  nombre: 'CLINICA MIA MEDICINA INTEGRAL SAS',
  nit: '901497975-7',
  direccion: 'Cra. 5 #28-85, Ibagué, Tolima',
  telefono: '(608) 324 333 8555',
  celular: '3107839998',
  email: 'infoclinicamia@gmail.com',
  ciudad: 'Ibagué, Tolima',
  codigoHabilitacion: '7300103424',
};

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

  /**
   * Generar PDF de la incapacidad médica
   * @param {string} id - ID de la incapacidad
   * @returns {Promise<Buffer>} - Buffer del PDF generado
   */
  async generatePdf(id) {
    const incapacidad = await this.getById(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Incapacidad Médica - ${incapacidad.codigo}`,
          Author: CLINICA_INFO.nombre,
          Subject: 'Incapacidad Médica',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ============ ENCABEZADO INSTITUCIONAL (compacto) ============
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a365d')
        .text(CLINICA_INFO.nombre, { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#333')
        .text(`NIT: ${CLINICA_INFO.nit} | ${CLINICA_INFO.direccion}`, { align: 'center' })
        .text(`Tel: ${CLINICA_INFO.telefono} | ${CLINICA_INFO.email}`, { align: 'center' });
      doc.moveDown(0.3);

      // Línea separadora
      doc.strokeColor('#2b6cb0').lineWidth(1.5)
        .moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.6);

      // ============ TÍTULO DEL DOCUMENTO ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#c53030')
        .text('CERTIFICADO DE INCAPACIDAD MÉDICA', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#333')
        .text(`No. ${incapacidad.codigo}`, { align: 'center' });
      doc.moveDown(0.7);

      // ============ INFORMACIÓN DEL PACIENTE ============
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d')
        .text('DATOS DEL PACIENTE', { underline: true });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica').fillColor('#333');
      if (incapacidad.paciente) {
        const edad = incapacidad.paciente.fechaNacimiento
          ? Math.floor((new Date() - new Date(incapacidad.paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
          : null;
        doc.text(`Nombre: ${incapacidad.paciente.nombre} ${incapacidad.paciente.apellido}`);
        doc.text(`Documento: ${incapacidad.paciente.tipoDocumento || 'CC'} ${incapacidad.paciente.cedula}${edad ? ` | Edad: ${edad} años` : ''}${incapacidad.paciente.eps ? ` | EPS: ${incapacidad.paciente.eps}` : ''}`);
      }
      doc.moveDown(0.7);

      // ============ INFORMACIÓN DE LA INCAPACIDAD ============
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d')
        .text('INFORMACIÓN DE LA INCAPACIDAD', { underline: true });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica').fillColor('#333');

      // Tipo de incapacidad
      const tiposIncapacidad = {
        EnfermedadGeneral: 'Enfermedad General',
        AccidenteTrabajo: 'Accidente de Trabajo',
        EnfermedadLaboral: 'Enfermedad Laboral',
        LicenciaMaternidad: 'Licencia de Maternidad',
        LicenciaPaternidad: 'Licencia de Paternidad',
      };
      doc.text(`Tipo: ${tiposIncapacidad[incapacidad.tipoIncapacidad] || incapacidad.tipoIncapacidad}`);

      // Fechas en una línea compacta
      const fechaInicio = new Date(incapacidad.fechaInicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin = new Date(incapacidad.fechaFin).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Desde: ${fechaInicio} | Hasta: ${fechaFin}`);
      doc.font('Helvetica-Bold').text(`Días de incapacidad: ${incapacidad.diasIncapacidad} días`);
      doc.font('Helvetica');

      // Prórroga (compacto)
      if (incapacidad.esProrrogada) {
        doc.fillColor('#dd6b20').text(`PRÓRROGA${incapacidad.diasAcumulados ? ` - Días acumulados: ${incapacidad.diasAcumulados}` : ''}`);
        doc.fillColor('#333');
      }
      doc.moveDown(0.7);

      // ============ DIAGNÓSTICO ============
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d')
        .text('DIAGNÓSTICO', { underline: true });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica').fillColor('#333');
      if (incapacidad.diagnosticoCIE10) {
        doc.font('Helvetica-Bold').text(`CIE-10: ${incapacidad.diagnosticoCIE10}`, { continued: true });
        doc.font('Helvetica').text(incapacidad.descripcionDiagnostico ? ` - ${incapacidad.descripcionDiagnostico}` : '');
      } else if (incapacidad.descripcionDiagnostico) {
        doc.text(incapacidad.descripcionDiagnostico);
      }
      doc.moveDown(0.7);

      // ============ JUSTIFICACIÓN CLÍNICA ============
      if (incapacidad.justificacion) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a365d')
          .text('JUSTIFICACIÓN CLÍNICA', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#333')
          .text(incapacidad.justificacion, { align: 'justify', lineGap: 2 });
        doc.moveDown(0.7);
      }

      // ============ RESTRICCIONES Y RECOMENDACIONES (compacto) ============
      if (incapacidad.restricciones) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#c53030')
          .text('RESTRICCIONES:', { underline: true });
        doc.moveDown(0.2);
        doc.fontSize(9).font('Helvetica').fillColor('#333')
          .text(incapacidad.restricciones, { align: 'justify' });
        doc.moveDown(0.5);
      }

      if (incapacidad.recomendaciones) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#38a169')
          .text('RECOMENDACIONES:', { underline: true });
        doc.moveDown(0.2);
        doc.fontSize(9).font('Helvetica').fillColor('#333')
          .text(incapacidad.recomendaciones, { align: 'justify' });
        doc.moveDown(0.5);
      }

      // ============ FIRMA DEL MÉDICO ============
      doc.moveDown(1.5);
      doc.fontSize(10).font('Helvetica').text('_______________________________', { align: 'center' });

      if (incapacidad.doctor) {
        doc.font('Helvetica-Bold').fillColor('#333')
          .text(`Dr(a). ${incapacidad.doctor.nombre} ${incapacidad.doctor.apellido}`, { align: 'center' });
        doc.font('Helvetica').fontSize(9)
          .text(`Reg. Médico: ${incapacidad.doctor.registroMedico || 'N/A'} | ${incapacidad.doctor.especialidad || 'Medicina General'}`, { align: 'center' });
      }

      // Fecha de firma
      if (incapacidad.fechaFirma) {
        const fechaFirma = new Date(incapacidad.fechaFirma).toLocaleDateString('es-CO');
        doc.fontSize(8).text(`Firmado: ${fechaFirma}`, { align: 'center' });
      }

      // ============ PIE DE PÁGINA (flujo natural) ============
      doc.moveDown(1);
      doc.fontSize(7).fillColor('#718096')
        .text(
          'Documento generado electrónicamente con validez legal según normatividad colombiana (Decreto 2126/2023). Información confidencial - Ley 1581/2012.',
          { align: 'center' }
        );

      doc.end();
    });
  }
}

module.exports = new IncapacidadService();
