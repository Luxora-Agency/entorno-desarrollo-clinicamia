/**
 * Servicio de generación de PDF para informes de imagenología
 */
const PDFDocument = require('pdfkit');

/**
 * Formatea una fecha a formato legible
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula la edad a partir de fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 'N/A';
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return `${edad} años`;
}

/**
 * Genera un PDF del informe radiológico
 * @param {Object} estudio - Datos del estudio de imagenología
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
async function generateInformePDF(estudio) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        info: {
          Title: `Informe Radiológico - ${estudio.codigo || estudio.id}`,
          Author: 'Clínica Mía',
          Subject: 'Informe de Estudio de Imagenología',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // === ENCABEZADO ===
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CLINICA MIA MEDICINA INTEGRAL SAS', { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text('NIT: 901497975-7 | Centro de Diagnóstico por Imagen', { align: 'center' });

      doc.moveDown(0.5);

      // Línea separadora
      doc
        .strokeColor('#3b82f6')
        .lineWidth(2)
        .moveTo(60, doc.y)
        .lineTo(doc.page.width - 60, doc.y)
        .stroke();

      doc.moveDown(1);

      // === TÍTULO DEL INFORME ===
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('INFORME RADIOLÓGICO', { align: 'center' });

      doc.moveDown(0.5);

      // Código del estudio
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Código: ${estudio.codigo || estudio.id}`, { align: 'center' });

      doc.moveDown(1.5);

      // === INFORMACIÓN DEL PACIENTE ===
      drawSectionHeader(doc, 'DATOS DEL PACIENTE');

      const paciente = estudio.paciente || {};
      const infoBoxY = doc.y;

      // Caja de información del paciente
      doc
        .rect(60, infoBoxY, doc.page.width - 120, 80)
        .fillColor('#f8fafc')
        .fill();

      doc.fillColor('#1f2937');

      const col1X = 70;
      const col2X = 300;
      let currentY = infoBoxY + 12;

      // Columna 1
      doc.fontSize(10).font('Helvetica-Bold').text('Nombre:', col1X, currentY);
      doc
        .font('Helvetica')
        .text(
          `${paciente.nombre || ''} ${paciente.apellido || ''}`,
          col1X + 55,
          currentY
        );

      currentY += 18;
      doc.font('Helvetica-Bold').text('Documento:', col1X, currentY);
      doc
        .font('Helvetica')
        .text(`${paciente.tipoDocumento || 'CC'}: ${paciente.cedula || 'N/A'}`, col1X + 70, currentY);

      currentY += 18;
      doc.font('Helvetica-Bold').text('Edad:', col1X, currentY);
      doc
        .font('Helvetica')
        .text(calcularEdad(paciente.fechaNacimiento), col1X + 40, currentY);

      // Columna 2
      currentY = infoBoxY + 12;
      doc.font('Helvetica-Bold').text('Género:', col2X, currentY);
      doc
        .font('Helvetica')
        .text(paciente.genero || 'N/A', col2X + 50, currentY);

      currentY += 18;
      doc.font('Helvetica-Bold').text('EPS:', col2X, currentY);
      doc.font('Helvetica').text(paciente.eps || 'N/A', col2X + 35, currentY);

      currentY += 18;
      doc.font('Helvetica-Bold').text('Teléfono:', col2X, currentY);
      doc
        .font('Helvetica')
        .text(paciente.telefono || 'N/A', col2X + 55, currentY);

      doc.y = infoBoxY + 90;
      doc.moveDown(1);

      // === INFORMACIÓN DEL ESTUDIO ===
      drawSectionHeader(doc, 'DATOS DEL ESTUDIO');

      const estudiosData = [
        ['Tipo de Estudio:', estudio.tipoEstudio || 'N/A'],
        ['Zona Anatómica:', estudio.zonaCuerpo || 'N/A'],
        ['Prioridad:', estudio.prioridad || 'Normal'],
        ['Fecha Solicitud:', formatDate(estudio.fechaSolicitud)],
        ['Fecha Realización:', formatDate(estudio.fechaRealizacion)],
        [
          'Médico Solicitante:',
          estudio.medicoSolicitante
            ? `${estudio.medicoSolicitante.nombre} ${estudio.medicoSolicitante.apellido}`
            : 'N/A',
        ],
      ];

      estudiosData.forEach(([label, value]) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text(label, {
          continued: true,
        });
        doc.font('Helvetica').fillColor('#1f2937').text(` ${value}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);

      // Indicación Clínica
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Indicación Clínica:');
      doc
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(estudio.indicacionClinica || 'No especificada', {
          align: 'justify',
        });

      doc.moveDown(1.5);

      // === HALLAZGOS ===
      drawSectionHeader(doc, 'HALLAZGOS');

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(estudio.hallazgos || 'Sin hallazgos registrados.', {
          align: 'justify',
          lineGap: 3,
        });

      doc.moveDown(1.5);

      // === CONCLUSIÓN ===
      drawSectionHeader(doc, 'CONCLUSIÓN');

      // Caja destacada para la conclusión
      const conclusionY = doc.y;
      const conclusionText = estudio.conclusion || 'Sin conclusión.';
      const conclusionHeight = doc.heightOfString(conclusionText, {
        width: doc.page.width - 140,
      });

      doc
        .rect(60, conclusionY - 5, doc.page.width - 120, conclusionHeight + 20)
        .fillColor('#eff6ff')
        .fill();

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(conclusionText, 70, conclusionY + 5, {
          width: doc.page.width - 140,
          align: 'justify',
          lineGap: 3,
        });

      doc.y = conclusionY + conclusionHeight + 25;
      doc.moveDown(1);

      // === RECOMENDACIONES ===
      if (estudio.recomendaciones) {
        drawSectionHeader(doc, 'RECOMENDACIONES');

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text(estudio.recomendaciones, {
            align: 'justify',
            lineGap: 2,
          });

        doc.moveDown(1.5);
      }

      // === FIRMA DEL RADIÓLOGO ===
      doc.moveDown(2);

      // Línea de firma
      const signatureY = doc.y;
      const signatureX = (doc.page.width - 200) / 2;

      doc
        .strokeColor('#9ca3af')
        .lineWidth(1)
        .moveTo(signatureX, signatureY)
        .lineTo(signatureX + 200, signatureY)
        .stroke();

      doc.moveDown(0.3);

      // Nombre del radiólogo
      const radiologo = estudio.radiologo;
      if (radiologo) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text(`Dr(a). ${radiologo.nombre} ${radiologo.apellido}`, {
            align: 'center',
          });
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text('Médico Radiólogo', { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text(`Fecha del Informe: ${formatDate(estudio.fechaInforme)}`, {
          align: 'center',
        });

      // === PIE DE PÁGINA ===
      const footerY = doc.page.height - 50;

      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(60, footerY - 10)
        .lineTo(doc.page.width - 60, footerY - 10)
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#9ca3af')
        .text(
          'Este documento es confidencial y de uso exclusivo para el paciente y personal médico autorizado.',
          60,
          footerY,
          { align: 'center', width: doc.page.width - 120 }
        );

      doc.text(
        `Generado el: ${formatDate(new Date())} | Clínica Mía - Sistema de Imagenología`,
        60,
        footerY + 12,
        { align: 'center', width: doc.page.width - 120 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Dibuja un encabezado de sección
 */
function drawSectionHeader(doc, title) {
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#1e40af')
    .text(title);

  doc
    .strokeColor('#3b82f6')
    .lineWidth(1)
    .moveTo(60, doc.y + 2)
    .lineTo(200, doc.y + 2)
    .stroke();

  doc.moveDown(0.8);
}

module.exports = {
  generateInformePDF,
};
