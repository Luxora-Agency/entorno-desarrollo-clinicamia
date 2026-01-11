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
      doc.fontSize(18).font('Helvetica-Bold').text('CLÍNICA MÍA', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('NIT: 901.XXX.XXX-X', { align: 'center' });
      doc.text('Cra. 5 #28-85, Ibagué, Tolima', { align: 'center' });
      doc.text('Tel: 324 333 8555', { align: 'center' });
      doc.moveDown(2);

      // Título del certificado
      doc.fontSize(14).font('Helvetica-Bold').text(certificado.titulo || 'CERTIFICADO MÉDICO', { align: 'center' });
      doc.moveDown(1);

      // Código y fecha
      doc.fontSize(10).font('Helvetica')
        .text(`Código: ${certificado.codigo}`, { align: 'right' })
        .text(`Fecha: ${new Date(certificado.fechaEmision || certificado.createdAt).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`, { align: 'right' });
      doc.moveDown(2);

      // Destinatario
      if (certificado.destinatario) {
        doc.font('Helvetica-Bold').text('A QUIEN CORRESPONDA:');
        doc.font('Helvetica').text(certificado.destinatario);
        doc.moveDown(1);
      }

      // Datos del paciente
      doc.font('Helvetica-Bold').text('DATOS DEL PACIENTE:', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      if (certificado.paciente) {
        doc.text(`Nombre: ${certificado.paciente.nombre} ${certificado.paciente.apellido}`);
        doc.text(`Documento: ${certificado.paciente.tipoDocumento || 'CC'} ${certificado.paciente.cedula || certificado.paciente.documento}`);
        if (certificado.paciente.fechaNacimiento) {
          const edad = Math.floor((new Date() - new Date(certificado.paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000));
          doc.text(`Edad: ${edad} años`);
        }
      }
      doc.moveDown(2);

      // Contenido del certificado
      doc.font('Helvetica-Bold').text('CONTENIDO:', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').text(certificado.contenido || '', {
        align: 'justify',
        lineGap: 3,
      });
      doc.moveDown(2);

      // Diagnóstico (si aplica)
      if (certificado.diagnostico || certificado.codigoCIE10) {
        doc.font('Helvetica-Bold').text('DIAGNÓSTICO:', { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica');
        if (certificado.codigoCIE10) {
          doc.text(`Código CIE-10: ${certificado.codigoCIE10}`);
        }
        if (certificado.diagnostico) {
          doc.text(`${certificado.diagnostico}`);
        }
        doc.moveDown(2);
      }

      // Vigencia
      if (certificado.vigenciaDesde || certificado.vigenciaHasta) {
        doc.font('Helvetica-Bold').text('VIGENCIA:', { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica');
        if (certificado.vigenciaDesde) {
          doc.text(`Desde: ${new Date(certificado.vigenciaDesde).toLocaleDateString('es-CO')}`);
        }
        if (certificado.vigenciaHasta) {
          doc.text(`Hasta: ${new Date(certificado.vigenciaHasta).toLocaleDateString('es-CO')}`);
        }
        doc.moveDown(2);
      }

      // Firma del médico
      doc.moveDown(3);
      doc.text('_______________________________', { align: 'center' });
      if (certificado.doctor) {
        doc.font('Helvetica-Bold').text(`Dr(a). ${certificado.doctor.nombre} ${certificado.doctor.apellido}`, { align: 'center' });
        doc.font('Helvetica').text(`Registro Médico: ${certificado.doctor.registroMedico || 'N/A'}`, { align: 'center' });
        doc.text(`Especialidad: ${certificado.doctor.especialidad || 'Medicina General'}`, { align: 'center' });
      }
      doc.moveDown(1);
      doc.fontSize(8).text(`Fecha de firma: ${new Date(certificado.fechaFirma || certificado.createdAt).toLocaleDateString('es-CO')}`, { align: 'center' });

      // Footer
      doc.fontSize(7).text(
        'Este documento ha sido generado electrónicamente y cuenta con validez legal según la normativa colombiana.',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();
    });
  }
}

module.exports = new CertificadoService();
