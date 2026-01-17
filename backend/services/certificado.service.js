/**
 * Service para gestión de certificados médicos
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
  text: '#1e293b',           // Slate 800
  textLight: '#475569',      // Slate 600
  textMuted: '#64748b',      // Slate 500
  border: '#e2e8f0',         // Slate 200
  headerBg: '#f0fdfa',       // Teal 50
  white: '#ffffff',
};

// Información institucional
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

class CertificadoService {
  constructor() {
    this.logoPath = path.join(__dirname, '../assets/clinica-mia-logo.png');
  }

  /**
   * Generar código único para el certificado
   */
  async generateCodigo() {
    const year = new Date().getFullYear();
    const count = await prisma.certificadoMedico.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    return `CERT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Crear certificado médico
   */
  async create(data) {
    const codigo = await this.generateCodigo();

    const certificado = await prisma.certificadoMedico.create({
      data: {
        codigo,
        pacienteId: data.pacienteId,
        doctorId: data.doctorId,
        citaId: data.citaId,
        tipoCertificado: data.tipoCertificado,
        titulo: data.titulo,
        contenido: data.contenido,
        diagnostico: data.diagnostico,
        codigoCIE10: data.codigoCIE10,
        destinatario: data.destinatario,
        vigenciaDesde: data.vigenciaDesde ? new Date(data.vigenciaDesde) : null,
        vigenciaHasta: data.vigenciaHasta ? new Date(data.vigenciaHasta) : null,
        firmadoPor: data.doctorId,
        fechaFirma: new Date(),
      },
      include: {
        paciente: true,
        doctor: true,
      },
    });

    return certificado;
  }

  /**
   * Obtener certificados por paciente
   */
  async getByPaciente(pacienteId) {
    return prisma.certificadoMedico.findMany({
      where: { pacienteId },
      include: {
        doctor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  /**
   * Obtener certificado por ID
   */
  async getById(id) {
    const certificado = await prisma.certificadoMedico.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: true,
        cita: true,
      },
    });

    if (!certificado) {
      throw new NotFoundError('Certificado no encontrado');
    }

    return certificado;
  }

  /**
   * Actualizar PDF URL
   */
  async updatePdfUrl(id, pdfUrl) {
    return prisma.certificadoMedico.update({
      where: { id },
      data: { pdfUrl },
    });
  }

  /**
   * Dibujar encabezado institucional con diseño de marca
   */
  drawHeader(doc, titulo, codigo) {
    const pageWidth = doc.page.width - 100; // margins 50 each side

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
    doc.rect(50, y, pageWidth, 24).fill(COLORS.headerBg);

    doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold')
       .text(titulo || 'CERTIFICADO MÉDICO', 58, y + 6);

    doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
       .text(`No. ${codigo}`, 50 + pageWidth - 100, y + 8, { width: 90, align: 'right' });

    return y + 30;
  }

  /**
   * Dibujar sección con título estilizado
   */
  drawSection(doc, titulo, yPos) {
    doc.rect(50, yPos, 4, 14).fill(COLORS.primary);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primaryDark)
       .text(titulo, 60, yPos + 2);
    return yPos + 18;
  }

  /**
   * Generar PDF del certificado
   * @param {string} id - ID del certificado
   * @returns {Promise<Buffer>} - Buffer del PDF generado
   */
  async generatePdf(id) {
    const certificado = await this.getById(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Certificado Médico - ${certificado.codigo}`,
          Author: CLINICA_INFO.nombre,
          Subject: 'Certificado Médico',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // === ENCABEZADO ===
      let y = this.drawHeader(doc, certificado.titulo || 'CERTIFICADO MÉDICO', certificado.codigo);

      // Fecha de emisión
      const fechaEmision = new Date(certificado.fechaEmision || certificado.createdAt).toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
         .text(`${CLINICA_INFO.ciudad}, ${fechaEmision}`, 50, y, { align: 'right' });
      y += 20;

      // === DESTINATARIO ===
      if (certificado.destinatario) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('A QUIEN CORRESPONDA:', 50, y);
        y += 14;
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.textLight)
           .text(certificado.destinatario, 50, y);
        y += 20;
      } else {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text('A QUIEN CORRESPONDA', 50, y);
        y += 20;
      }

      // === DATOS DEL PACIENTE ===
      y = this.drawSection(doc, 'DATOS DEL PACIENTE', y);

      if (certificado.paciente) {
        const edad = certificado.paciente.fechaNacimiento
          ? Math.floor((new Date() - new Date(certificado.paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        // Card de paciente
        doc.rect(50, y, doc.page.width - 100, 40)
           .lineWidth(1)
           .fillAndStroke(COLORS.headerBg, COLORS.border);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`${certificado.paciente.nombre} ${certificado.paciente.apellido}`, 60, y + 8);

        doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
           .text(`${certificado.paciente.tipoDocumento || 'CC'}: ${certificado.paciente.cedula || certificado.paciente.documento}`, 60, y + 22);

        if (edad) {
          doc.text(`Edad: ${edad} años`, 250, y + 22);
        }

        y += 50;
      }

      // === CONTENIDO DEL CERTIFICADO ===
      y = this.drawSection(doc, 'CERTIFICACIÓN', y);

      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(certificado.contenido || '', 50, y, {
           align: 'justify',
           lineGap: 3,
           width: doc.page.width - 100,
         });
      y = doc.y + 15;

      // === DIAGNÓSTICO (si aplica) ===
      if (certificado.diagnostico || certificado.codigoCIE10) {
        y = this.drawSection(doc, 'DIAGNÓSTICO', y);

        const dxText = [
          certificado.codigoCIE10 ? `CIE-10: ${certificado.codigoCIE10}` : '',
          certificado.diagnostico || ''
        ].filter(Boolean).join(' - ');

        doc.rect(50, y, doc.page.width - 100, 30)
           .lineWidth(1)
           .fillAndStroke('#fef3c7', '#f59e0b');

        doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
           .text(dxText, 60, y + 10, { width: doc.page.width - 120 });

        y += 40;
      }

      // === VIGENCIA (si aplica) ===
      if (certificado.vigenciaDesde || certificado.vigenciaHasta) {
        y = this.drawSection(doc, 'VIGENCIA', y);

        const vigenciaText = [
          certificado.vigenciaDesde ? `Desde: ${new Date(certificado.vigenciaDesde).toLocaleDateString('es-CO')}` : '',
          certificado.vigenciaHasta ? `Hasta: ${new Date(certificado.vigenciaHasta).toLocaleDateString('es-CO')}` : ''
        ].filter(Boolean).join('  |  ');

        doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
           .text(vigenciaText, 50, y);
        y += 20;
      }

      // === FIRMA DEL MÉDICO ===
      y = Math.max(y + 40, doc.page.height - 180);

      doc.strokeColor(COLORS.primary).lineWidth(1)
         .moveTo(doc.page.width / 2 - 100, y)
         .lineTo(doc.page.width / 2 + 100, y)
         .stroke();

      y += 5;

      if (certificado.doctor) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text)
           .text(`Dr(a). ${certificado.doctor.nombre} ${certificado.doctor.apellido}`, 50, y, { align: 'center' });
        y += 14;
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight)
           .text(`Reg. Médico: ${certificado.doctor.registroMedico || 'N/A'}`, 50, y, { align: 'center' });
        y += 12;
        doc.text(certificado.doctor.especialidad || 'Medicina General', 50, y, { align: 'center' });
      }

      // === PIE DE PÁGINA ===
      const footerY = doc.page.height - 50;

      // Línea decorativa
      doc.rect(0, footerY - 8, doc.page.width, 2).fill(COLORS.accent);
      doc.rect(0, footerY - 6, doc.page.width, 6).fill(COLORS.primary);

      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(
           'Documento generado electrónicamente con validez legal según normativa colombiana. ' +
           'Información protegida por Ley 1581/2012 (Habeas Data).',
           50, footerY + 5, { align: 'center', width: doc.page.width - 100 }
         );

      doc.end();
    });
  }
}

module.exports = new CertificadoService();
