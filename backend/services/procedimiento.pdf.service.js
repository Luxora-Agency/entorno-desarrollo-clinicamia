/**
 * Servicio para generación de PDF de Procedimientos Quirúrgicos
 */

const PDFDocument = require('pdfkit');
const prisma = require('../db/prisma');
const { format } = require('date-fns');

// Intentar cargar locale español, fallback a undefined si no está disponible
let es;
try {
  es = require('date-fns/locale/es');
} catch (e) {
  es = undefined;
}

class ProcedimientoPdfService {
  /**
   * Generar PDF de Bitácora Quirúrgica
   */
  async generarBitacoraPdf(procedimientoId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
      include: {
        paciente: true,
        medicoResponsable: true,
        anestesiologo: true,
        medicoFirma: true,
        quirofano: true,
        admision: true,
      },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    this._addHeader(doc, 'BITÁCORA QUIRÚRGICA');

    // Información del paciente
    doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL PACIENTE', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    const paciente = procedimiento.paciente;
    doc.text(`Nombre: ${paciente.nombre} ${paciente.apellido}`);
    doc.text(`Identificación: ${paciente.tipoDocumento || 'CC'} ${paciente.cedula}`);
    doc.text(`Fecha Nacimiento: ${paciente.fechaNacimiento ? format(new Date(paciente.fechaNacimiento), 'dd/MM/yyyy') : 'N/A'}`);
    doc.text(`Género: ${paciente.genero || 'N/A'}`);
    doc.moveDown();

    // Información del procedimiento
    doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL PROCEDIMIENTO', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    doc.text(`ID Procedimiento: ${procedimiento.id}`);
    doc.text(`Procedimiento: ${procedimiento.nombre}`);
    doc.text(`Código CUPS: ${procedimiento.codigoCUPS || 'N/A'}`);
    doc.text(`Diagnóstico: ${procedimiento.indicacion || 'N/A'}`);
    doc.text(`Código CIE-10: ${procedimiento.codigoCIE10 || 'N/A'}`);
    doc.text(`Tipo de Cirugía: ${procedimiento.tipoCirugia || 'N/A'}`);
    doc.text(`Prioridad: ${procedimiento.prioridad || 'Electivo'}`);
    doc.text(`Nivel de Complejidad: ${procedimiento.nivelComplejidad || 'Media'}`);
    doc.text(`Estado: ${procedimiento.estado}`);
    doc.moveDown();

    // Programación
    doc.fontSize(12).font('Helvetica-Bold').text('PROGRAMACIÓN', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    doc.text(`Fecha Programada: ${procedimiento.fechaProgramada ? format(new Date(procedimiento.fechaProgramada), 'dd/MM/yyyy HH:mm') : 'N/A'}`);
    doc.text(`Quirófano: ${procedimiento.quirofano?.nombre || 'N/A'}`);
    doc.text(`Duración Estimada: ${procedimiento.duracionEstimada ? procedimiento.duracionEstimada + ' min' : 'N/A'}`);
    doc.text(`Tipo de Anestesia: ${procedimiento.tipoAnestesia || 'N/A'}`);
    doc.text(`Clasificación ASA: ${procedimiento.clasificacionASA || 'N/A'}`);
    doc.moveDown();

    // Equipo quirúrgico
    doc.fontSize(12).font('Helvetica-Bold').text('EQUIPO QUIRÚRGICO', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    doc.text(`Cirujano Principal: ${procedimiento.medicoResponsable ? `${procedimiento.medicoResponsable.nombre} ${procedimiento.medicoResponsable.apellido}` : 'N/A'}`);
    doc.text(`Anestesiólogo: ${procedimiento.anestesiologo ? `${procedimiento.anestesiologo.nombre} ${procedimiento.anestesiologo.apellido}` : 'N/A'}`);
    if (procedimiento.ayudantes && procedimiento.ayudantes.length > 0) {
      doc.text(`Ayudantes: ${procedimiento.ayudantes.join(', ')}`);
    }
    doc.moveDown();

    // Tiempos reales (si aplica)
    if (procedimiento.horaInicioReal || procedimiento.horaFinReal) {
      doc.fontSize(12).font('Helvetica-Bold').text('TIEMPOS REALES', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);

      if (procedimiento.horaInicioReal) {
        doc.text(`Hora Inicio Real: ${format(new Date(procedimiento.horaInicioReal), 'dd/MM/yyyy HH:mm')}`);
      }
      if (procedimiento.horaFinReal) {
        doc.text(`Hora Fin Real: ${format(new Date(procedimiento.horaFinReal), 'dd/MM/yyyy HH:mm')}`);
      }
      if (procedimiento.duracionReal) {
        doc.text(`Duración Real: ${procedimiento.duracionReal} min`);
      }
      doc.moveDown();
    }

    // Riesgos potenciales
    if (procedimiento.riesgosPotenciales) {
      doc.fontSize(12).font('Helvetica-Bold').text('RIESGOS POTENCIALES IDENTIFICADOS', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.riesgosPotenciales);
      doc.moveDown();
    }

    // Observaciones
    if (procedimiento.observaciones) {
      doc.fontSize(12).font('Helvetica-Bold').text('OBSERVACIONES', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.observaciones);
      doc.moveDown();
    }

    // Footer
    this._addFooter(doc, procedimiento);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  /**
   * Generar PDF del Protocolo Quirúrgico (para cirugías completadas)
   */
  async generarProtocoloPdf(procedimientoId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
      include: {
        paciente: true,
        medicoResponsable: true,
        anestesiologo: true,
        medicoFirma: true,
        quirofano: true,
        admision: true,
      },
    });

    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }

    if (procedimiento.estado !== 'Completado') {
      throw new Error('El protocolo quirúrgico solo se puede generar para procedimientos completados');
    }

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    this._addHeader(doc, 'PROTOCOLO QUIRÚRGICO');

    // Información del paciente
    doc.fontSize(12).font('Helvetica-Bold').text('IDENTIFICACIÓN DEL PACIENTE', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    const paciente = procedimiento.paciente;
    doc.text(`Nombre Completo: ${paciente.nombre} ${paciente.apellido}`);
    doc.text(`Identificación: ${paciente.tipoDocumento || 'CC'} ${paciente.cedula}`);
    doc.text(`Fecha Nacimiento: ${paciente.fechaNacimiento ? format(new Date(paciente.fechaNacimiento), 'dd/MM/yyyy') : 'N/A'}`);
    doc.text(`Edad: ${paciente.fechaNacimiento ? this._calcularEdad(paciente.fechaNacimiento) + ' años' : 'N/A'}`);
    doc.text(`Género: ${paciente.genero || 'N/A'}`);
    doc.moveDown();

    // Diagnóstico y Procedimiento
    doc.fontSize(12).font('Helvetica-Bold').text('DIAGNÓSTICO Y PROCEDIMIENTO', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    doc.text(`Diagnóstico Preoperatorio: ${procedimiento.indicacion || 'N/A'}`);
    doc.text(`Código CIE-10: ${procedimiento.codigoCIE10 || 'N/A'}`);
    doc.text(`Procedimiento Realizado: ${procedimiento.nombre}`);
    doc.text(`Código CUPS: ${procedimiento.codigoCUPS || 'N/A'}`);
    doc.text(`Tipo de Cirugía: ${procedimiento.tipoCirugia || 'N/A'}`);
    doc.moveDown();

    // Información de la Cirugía
    doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DE LA CIRUGÍA', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    doc.text(`Fecha de Realización: ${procedimiento.fechaRealizada ? format(new Date(procedimiento.fechaRealizada), 'dd/MM/yyyy') : format(new Date(procedimiento.horaInicioReal), 'dd/MM/yyyy')}`);
    doc.text(`Quirófano: ${procedimiento.quirofano?.nombre || 'N/A'}`);
    doc.text(`Hora Inicio: ${procedimiento.horaInicioReal ? format(new Date(procedimiento.horaInicioReal), 'HH:mm') : 'N/A'}`);
    doc.text(`Hora Fin: ${procedimiento.horaFinReal ? format(new Date(procedimiento.horaFinReal), 'HH:mm') : 'N/A'}`);
    doc.text(`Duración Total: ${procedimiento.duracionReal ? procedimiento.duracionReal + ' min' : 'N/A'}`);
    doc.text(`Tipo de Anestesia: ${procedimiento.tipoAnestesia || 'N/A'}`);
    doc.text(`Clasificación ASA: ${procedimiento.clasificacionASA || 'N/A'}`);
    doc.moveDown();

    // Equipo quirúrgico
    doc.fontSize(12).font('Helvetica-Bold').text('EQUIPO QUIRÚRGICO', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    doc.text(`Cirujano Principal: ${procedimiento.medicoResponsable ? `${procedimiento.medicoResponsable.nombre} ${procedimiento.medicoResponsable.apellido}` : 'N/A'}`);
    doc.text(`Anestesiólogo: ${procedimiento.anestesiologo ? `${procedimiento.anestesiologo.nombre} ${procedimiento.anestesiologo.apellido}` : 'N/A'}`);
    if (procedimiento.ayudantes && procedimiento.ayudantes.length > 0) {
      doc.text(`Ayudantes: ${procedimiento.ayudantes.join(', ')}`);
    }
    if (procedimiento.personalAsistente) {
      doc.text(`Personal Asistente: ${procedimiento.personalAsistente}`);
    }
    doc.moveDown();

    // Técnica Quirúrgica
    if (procedimiento.tecnicaUtilizada) {
      doc.fontSize(12).font('Helvetica-Bold').text('TÉCNICA QUIRÚRGICA', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.tecnicaUtilizada);
      doc.moveDown();
    }

    // Hallazgos Intraoperatorios
    if (procedimiento.hallazgos) {
      doc.fontSize(12).font('Helvetica-Bold').text('HALLAZGOS INTRAOPERATORIOS', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.hallazgos);
      doc.moveDown();
    }

    // Complicaciones
    if (procedimiento.complicaciones) {
      doc.fontSize(12).font('Helvetica-Bold').text('COMPLICACIONES', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.complicaciones);
      doc.moveDown();
    } else {
      doc.fontSize(12).font('Helvetica-Bold').text('COMPLICACIONES', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text('Sin complicaciones durante el procedimiento.');
      doc.moveDown();
    }

    // Resultados
    if (procedimiento.resultados) {
      doc.fontSize(12).font('Helvetica-Bold').text('RESULTADOS', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.resultados);
      doc.moveDown();
    }

    // Insumos Utilizados
    if (procedimiento.insumosUtilizados) {
      doc.fontSize(12).font('Helvetica-Bold').text('INSUMOS UTILIZADOS', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.insumosUtilizados);
      doc.moveDown();
    }

    // Sangrado Aproximado
    if (procedimiento.sangradoAproximado) {
      doc.text(`Sangrado Aproximado: ${procedimiento.sangradoAproximado} ml`);
      doc.moveDown();
    }

    // Recomendaciones Postoperatorias
    if (procedimiento.recomendacionesPost) {
      doc.fontSize(12).font('Helvetica-Bold').text('RECOMENDACIONES POSTOPERATORIAS', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.recomendacionesPost);
      doc.moveDown();
    }

    // Cuidados Especiales
    if (procedimiento.cuidadosEspeciales) {
      doc.fontSize(12).font('Helvetica-Bold').text('CUIDADOS ESPECIALES', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.cuidadosEspeciales);
      doc.moveDown();
    }

    // Incapacidad
    if (procedimiento.incapacidadDias) {
      doc.text(`Días de Incapacidad: ${procedimiento.incapacidadDias} días`);
      doc.moveDown();
    }

    // Observaciones
    if (procedimiento.observaciones) {
      doc.fontSize(12).font('Helvetica-Bold').text('OBSERVACIONES', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
      doc.text(procedimiento.observaciones);
      doc.moveDown();
    }

    // Firma del médico
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica');
    doc.text('_________________________________');
    const medicoFirma = procedimiento.medicoFirma || procedimiento.medicoResponsable;
    doc.text(`${medicoFirma ? `Dr(a). ${medicoFirma.nombre} ${medicoFirma.apellido}` : 'Médico Responsable'}`);
    doc.text(`Fecha de Firma: ${procedimiento.fechaFirma ? format(new Date(procedimiento.fechaFirma), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm')}`);

    // Footer
    this._addFooter(doc, procedimiento);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  _addHeader(doc, title) {
    doc.fontSize(18).font('Helvetica-Bold').text('CLINICA MIA MEDICINA INTEGRAL SAS', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('NIT: 901497975-7 | Cód. Habilitación: 7300103424', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();
  }

  _addFooter(doc, procedimiento) {
    const bottomY = doc.page.height - 50;
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')} - ID: ${procedimiento.id}`,
      50,
      bottomY,
      { align: 'center', width: doc.page.width - 100 }
    );
  }

  _calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
}

module.exports = new ProcedimientoPdfService();
