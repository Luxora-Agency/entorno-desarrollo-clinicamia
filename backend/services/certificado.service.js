/**
 * Service para gestión de certificados médicos
 */
const prisma = require('../db/prisma');
const PDFDocument = require('pdfkit');
const { ValidationError, NotFoundError } = require('../utils/errors');

class CertificadoService {
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
          Author: 'Clínica Mía',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a365d').text('CLINICA MIA MEDICINA INTEGRAL SAS', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#333').text('NIT: 901497975-7 | Avenida Ferrocarril 41-23, Ibagué, Tolima', { align: 'center' });
      doc.text('Tel: (608) 324 333 8555 | infoclinicamia@gmail.com', { align: 'center' });
      doc.moveDown(0.3);

      // Línea separadora
      doc.strokeColor('#2b6cb0').lineWidth(1.5)
        .moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.8);

      // Título del certificado
      doc.fontSize(13).font('Helvetica-Bold').text(certificado.titulo || 'CERTIFICADO MÉDICO', { align: 'center' });
      doc.moveDown(0.5);

      // Código y fecha en una línea
      doc.fontSize(9).font('Helvetica')
        .text(`Código: ${certificado.codigo} | Fecha: ${new Date(certificado.fechaEmision || certificado.createdAt).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`, { align: 'right' });
      doc.moveDown(1);

      // Destinatario
      if (certificado.destinatario) {
        doc.font('Helvetica-Bold').text('A QUIEN CORRESPONDA:');
        doc.font('Helvetica').text(certificado.destinatario);
        doc.moveDown(0.5);
      }

      // Datos del paciente
      doc.font('Helvetica-Bold').text('DATOS DEL PACIENTE:', { underline: true });
      doc.moveDown(0.3);
      doc.font('Helvetica');
      if (certificado.paciente) {
        const edad = certificado.paciente.fechaNacimiento
          ? Math.floor((new Date() - new Date(certificado.paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
          : null;
        doc.text(`Nombre: ${certificado.paciente.nombre} ${certificado.paciente.apellido}`);
        doc.text(`Documento: ${certificado.paciente.tipoDocumento || 'CC'} ${certificado.paciente.cedula || certificado.paciente.documento}${edad ? ` | Edad: ${edad} años` : ''}`);
      }
      doc.moveDown(1);

      // Contenido del certificado
      doc.font('Helvetica-Bold').text('CONTENIDO:', { underline: true });
      doc.moveDown(0.3);
      doc.font('Helvetica').text(certificado.contenido || '', {
        align: 'justify',
        lineGap: 2,
      });
      doc.moveDown(1);

      // Diagnóstico (si aplica) - compacto
      if (certificado.diagnostico || certificado.codigoCIE10) {
        doc.font('Helvetica-Bold').text('DIAGNÓSTICO:', { underline: true });
        doc.moveDown(0.3);
        doc.font('Helvetica');
        const dxText = [
          certificado.codigoCIE10 ? `CIE-10: ${certificado.codigoCIE10}` : '',
          certificado.diagnostico || ''
        ].filter(Boolean).join(' - ');
        doc.text(dxText);
        doc.moveDown(0.8);
      }

      // Vigencia (si aplica) - compacto
      if (certificado.vigenciaDesde || certificado.vigenciaHasta) {
        const vigenciaText = [
          certificado.vigenciaDesde ? `Desde: ${new Date(certificado.vigenciaDesde).toLocaleDateString('es-CO')}` : '',
          certificado.vigenciaHasta ? `Hasta: ${new Date(certificado.vigenciaHasta).toLocaleDateString('es-CO')}` : ''
        ].filter(Boolean).join(' | ');
        doc.font('Helvetica-Bold').text('VIGENCIA: ', { continued: true });
        doc.font('Helvetica').text(vigenciaText);
      }

      // Firma del médico - espacio antes de firma
      doc.moveDown(2);
      doc.font('Helvetica').fontSize(10).text('_______________________________', { align: 'center' });
      if (certificado.doctor) {
        doc.font('Helvetica-Bold').text(`Dr(a). ${certificado.doctor.nombre} ${certificado.doctor.apellido}`, { align: 'center' });
        doc.font('Helvetica').fontSize(9)
          .text(`Reg. Médico: ${certificado.doctor.registroMedico || 'N/A'} | ${certificado.doctor.especialidad || 'Medicina General'}`, { align: 'center' });
      }
      doc.fontSize(8).text(`Firmado: ${new Date(certificado.fechaFirma || certificado.createdAt).toLocaleDateString('es-CO')}`, { align: 'center' });

      // Footer - espacio y texto compacto
      doc.moveDown(1.5);
      doc.fontSize(7).fillColor('#666').text(
        'Documento generado electrónicamente con validez legal según normativa colombiana.',
        { align: 'center' }
      );

      doc.end();
    });
  }
}

module.exports = new CertificadoService();
