/**
 * Service para gestión de incapacidades médicas
 * Basado en normatividad colombiana: Decreto 2126/2023, Resolución 1843/2025
 * Diseño visual alineado con la identidad de Clínica MÍA
 */
const prisma = require('../db/prisma');
const PDFDocument = require('pdfkit');
const { ValidationError, NotFoundError } = require('../utils/errors');
const path = require('path');
const fs = require('fs');

// Colores de marca Clínica MÍA - Turquesa/Teal como primario
const COLORS = {
  primary: '#0d9488',        // Teal 600 - Color principal
  primaryDark: '#0f766e',    // Teal 700
  primaryLight: '#14b8a6',   // Teal 500
  accent: '#2dd4bf',         // Teal 400 - Acento
  secondary: '#0ea5e9',      // Sky 500
  danger: '#dc2626',         // Red 600
  warning: '#f59e0b',        // Amber 500
  success: '#16a34a',        // Green 600
  text: '#1e293b',           // Slate 800
  textLight: '#475569',      // Slate 600
  textMuted: '#64748b',      // Slate 500
  border: '#e2e8f0',         // Slate 200
  headerBg: '#f0fdfa',       // Teal 50
  dangerBg: '#fef2f2',       // Red 50
  warningBg: '#fef3c7',      // Amber 100
  successBg: '#f0fdf4',      // Green 50
  white: '#ffffff',
};

// Información institucional de Clínica MIA
const CLINICA_INFO = {
  nombre: 'CLINICA MIA MEDICINA INTEGRAL SAS',
  nit: '901497975-7',
  codigoHabilitacion: '7300103424',
  tipoEntidad: 'IPS',
  direccion: 'Avenida Ferrocarril 41-23',
  ciudad: 'Ibagué, Tolima',
  telefono: '(608) 324 333 8555',
  celular: '3107839998',
  email: 'infoclinicamia@gmail.com',
  web: 'https://clinicamia.co/',
};

// Tipos de incapacidad
const TIPOS_INCAPACIDAD = {
  EnfermedadGeneral: 'Enfermedad General',
  AccidenteTrabajo: 'Accidente de Trabajo',
  EnfermedadLaboral: 'Enfermedad Laboral',
  LicenciaMaternidad: 'Licencia de Maternidad',
  LicenciaPaternidad: 'Licencia de Paternidad',
};

class IncapacidadService {
  constructor() {
    this.logoPath = path.join(__dirname, '../assets/clinica-mia-logo.png');
  }

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
   * Dibujar encabezado institucional con diseño de marca
   */
  drawHeader(doc, codigo, esProrrogada = false) {
    const pageWidth = doc.page.width - 100;

    // === BARRA SUPERIOR DECORATIVA ===
    doc.rect(0, 0, doc.page.width, 6).fill(COLORS.primary);
    doc.rect(0, 6, doc.page.width, 2).fill(COLORS.accent);

    // === ENCABEZADO INSTITUCIONAL ===
    const headerY = 15;
    const headerHeight = 55;

    doc.rect(50, headerY, pageWidth, headerHeight).fill(COLORS.primary);

    // Logo
    const logoX = 58;
    const logoY = headerY + 5;
    const logoSize = 45;
    let logoMostrado = false;

    try {
      if (fs.existsSync(this.logoPath)) {
        doc.image(this.logoPath, logoX, logoY, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize]
        });
        logoMostrado = true;
      }
    } catch (e) {
      console.log('Error cargando logo:', e.message);
    }

    if (!logoMostrado) {
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, 20).fill(COLORS.white);
      doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.primary)
         .text('CM', logoX + 8, logoY + 12);
    }

    // Info institucional
    const textStartX = logoX + logoSize + 10;
    doc.fillColor(COLORS.white).fontSize(13).font('Helvetica-Bold')
       .text(CLINICA_INFO.nombre, textStartX, headerY + 6, { width: pageWidth - logoSize - 30 });

    doc.fontSize(7).font('Helvetica').fillColor(COLORS.accent)
       .text(`NIT: ${CLINICA_INFO.nit} | Hab: ${CLINICA_INFO.codigoHabilitacion} | ${CLINICA_INFO.tipoEntidad}`, textStartX, headerY + 22);

    doc.fillColor('#e0f2f1').fontSize(7)
       .text(`${CLINICA_INFO.direccion}, ${CLINICA_INFO.ciudad} | Tel: ${CLINICA_INFO.telefono} | ${CLINICA_INFO.celular}`, textStartX, headerY + 32)
       .text(`${CLINICA_INFO.email} | ${CLINICA_INFO.web}`, textStartX, headerY + 42);

    // === TÍTULO DEL DOCUMENTO ===
    let y = headerY + headerHeight + 5;
    doc.rect(50, y, pageWidth, 28).fill(COLORS.headerBg);

    const titulo = esProrrogada ? 'PRÓRROGA DE INCAPACIDAD MÉDICA' : 'CERTIFICADO DE INCAPACIDAD MÉDICA';
    doc.fillColor(COLORS.danger).fontSize(14).font('Helvetica-Bold')
       .text(titulo, 58, y + 6);

    doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
       .text(`No. ${codigo}`, 50 + pageWidth - 100, y + 10, { width: 90, align: 'right' });

    return y + 34;
  }

  /**
   * Dibujar sección con título estilizado
   */
  drawSection(doc, titulo, yPos, color = COLORS.primaryDark) {
    doc.rect(50, yPos, 4, 14).fill(color);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(color)
       .text(titulo, 60, yPos + 2);
    return yPos + 18;
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

      const pageWidth = doc.page.width - 100;

      // === ENCABEZADO ===
      let y = this.drawHeader(doc, incapacidad.codigo, incapacidad.esProrrogada);

      // === DATOS DEL PACIENTE ===
      y = this.drawSection(doc, 'DATOS DEL PACIENTE', y);

      if (incapacidad.paciente) {
        const edad = incapacidad.paciente.fechaNacimiento
          ? Math.floor((new Date() - new Date(incapacidad.paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        // Card de paciente
        doc.rect(50, y, pageWidth, 50)
           .lineWidth(1)
           .fillAndStroke(COLORS.headerBg, COLORS.border);

        doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`${incapacidad.paciente.nombre} ${incapacidad.paciente.apellido}`, 60, y + 8);

        doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
           .text(`${incapacidad.paciente.tipoDocumento || 'CC'}: ${incapacidad.paciente.cedula}`, 60, y + 24);

        if (edad) {
          doc.text(`Edad: ${edad} años`, 220, y + 24);
        }

        if (incapacidad.paciente.eps) {
          doc.text(`EPS: ${incapacidad.paciente.eps}`, 320, y + 24);
        }

        y += 58;
      }

      // === INFORMACIÓN DE LA INCAPACIDAD ===
      y = this.drawSection(doc, 'INFORMACIÓN DE LA INCAPACIDAD', y);

      // Card principal de incapacidad
      doc.rect(50, y, pageWidth, 70)
         .lineWidth(1)
         .fillAndStroke(COLORS.dangerBg, COLORS.danger);

      // Tipo de incapacidad
      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
         .text('Tipo:', 60, y + 8);
      doc.font('Helvetica').fillColor(COLORS.textLight)
         .text(TIPOS_INCAPACIDAD[incapacidad.tipoIncapacidad] || incapacidad.tipoIncapacidad, 100, y + 8);

      // Fechas
      const fechaInicio = new Date(incapacidad.fechaInicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      const fechaFin = new Date(incapacidad.fechaFin).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
         .text('Desde:', 60, y + 24);
      doc.font('Helvetica').fillColor(COLORS.textLight)
         .text(fechaInicio, 100, y + 24);

      doc.font('Helvetica-Bold').fillColor(COLORS.text)
         .text('Hasta:', 280, y + 24);
      doc.font('Helvetica').fillColor(COLORS.textLight)
         .text(fechaFin, 320, y + 24);

      // Días de incapacidad (destacado)
      doc.rect(60, y + 42, 150, 22)
         .lineWidth(1)
         .fillAndStroke(COLORS.danger, COLORS.danger);

      doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.white)
         .text(`${incapacidad.diasIncapacidad} DÍAS DE INCAPACIDAD`, 70, y + 47);

      // Prórroga info
      if (incapacidad.esProrrogada && incapacidad.diasAcumulados) {
        doc.rect(220, y + 42, 150, 22)
           .lineWidth(1)
           .fillAndStroke(COLORS.warning, COLORS.warning);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`Acumulados: ${incapacidad.diasAcumulados} días`, 230, y + 48);
      }

      y += 78;

      // === DIAGNÓSTICO ===
      y = this.drawSection(doc, 'DIAGNÓSTICO', y);

      doc.rect(50, y, pageWidth, 40)
         .lineWidth(1)
         .fillAndStroke(COLORS.warningBg, COLORS.warning);

      if (incapacidad.diagnosticoCIE10) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`CIE-10: ${incapacidad.diagnosticoCIE10}`, 60, y + 8);
      }

      if (incapacidad.descripcionDiagnostico) {
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
           .text(incapacidad.descripcionDiagnostico, 60, y + 24, { width: pageWidth - 20 });
      }

      y += 48;

      // === JUSTIFICACIÓN CLÍNICA ===
      if (incapacidad.justificacion) {
        y = this.drawSection(doc, 'JUSTIFICACIÓN CLÍNICA', y);

        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(incapacidad.justificacion, 50, y, {
             align: 'justify',
             lineGap: 2,
             width: pageWidth,
           });
        y = doc.y + 12;
      }

      // === RESTRICCIONES ===
      if (incapacidad.restricciones) {
        y = this.drawSection(doc, 'RESTRICCIONES', y, COLORS.danger);

        doc.rect(50, y, pageWidth, 35)
           .lineWidth(1)
           .fillAndStroke(COLORS.dangerBg, COLORS.danger);

        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(incapacidad.restricciones, 60, y + 8, {
             width: pageWidth - 20,
           });
        y += 42;
      }

      // === RECOMENDACIONES ===
      if (incapacidad.recomendaciones) {
        y = this.drawSection(doc, 'RECOMENDACIONES', y, COLORS.success);

        doc.rect(50, y, pageWidth, 35)
           .lineWidth(1)
           .fillAndStroke(COLORS.successBg, COLORS.success);

        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(incapacidad.recomendaciones, 60, y + 8, {
             width: pageWidth - 20,
           });
        y += 42;
      }

      // === FIRMA DEL MÉDICO ===
      y = Math.max(y + 30, doc.page.height - 170);

      doc.strokeColor(COLORS.primary).lineWidth(1)
         .moveTo(doc.page.width / 2 - 100, y)
         .lineTo(doc.page.width / 2 + 100, y)
         .stroke();

      y += 5;

      if (incapacidad.doctor) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`Dr(a). ${incapacidad.doctor.nombre} ${incapacidad.doctor.apellido}`, 50, y, { align: 'center' });
        y += 14;
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
           .text(`Reg. Médico: ${incapacidad.doctor.registroMedico || 'N/A'}`, 50, y, { align: 'center' });
        y += 12;
        doc.text(incapacidad.doctor.especialidad || 'Medicina General', 50, y, { align: 'center' });
        y += 12;
      }

      // Fecha de firma
      if (incapacidad.fechaFirma) {
        const fechaFirma = new Date(incapacidad.fechaFirma).toLocaleDateString('es-CO');
        doc.fontSize(8).fillColor(COLORS.textMuted)
           .text(`Firmado: ${fechaFirma}`, 50, y, { align: 'center' });
      }

      // === PIE DE PÁGINA ===
      const footerY = doc.page.height - 50;

      // Línea decorativa
      doc.rect(0, footerY - 8, doc.page.width, 2).fill(COLORS.accent);
      doc.rect(0, footerY - 6, doc.page.width, 6).fill(COLORS.primary);

      doc.fontSize(6).font('Helvetica').fillColor(COLORS.textMuted)
         .text(
           'Documento generado electrónicamente con validez legal según normatividad colombiana ' +
           '(Decreto 2126/2023, Res. 1843/2025). Información protegida por Ley 1581/2012 (Habeas Data).',
           50, footerY + 5, { align: 'center', width: doc.page.width - 100 }
         );

      doc.end();
    });
  }
}

module.exports = new IncapacidadService();
