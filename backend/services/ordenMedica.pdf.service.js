/**
 * Servicio para generación de PDF de Órdenes Médicas
 */

const PDFDocument = require('pdfkit');
const prisma = require('../db/prisma');
const { format } = require('date-fns');

// Intentar cargar locale español
let esLocale = null;
try {
  const localeModule = require('date-fns/locale/es');
  esLocale = localeModule.es || localeModule.default || localeModule;
} catch (e) {
  console.log('[PDF Service] Locale español no disponible, usando formato por defecto');
  esLocale = null;
}

// Helper para formatear fechas de forma segura
const formatDate = (date, formatStr) => {
  try {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    // Solo pasar locale si está disponible
    const options = esLocale ? { locale: esLocale } : {};
    return format(dateObj, formatStr, options);
  } catch (err) {
    console.error('[PDF Service] Error formateando fecha:', err.message);
    return 'N/A';
  }
};

class OrdenMedicaPdfService {
  /**
   * Generar PDF de una orden médica individual
   */
  async generarOrdenPdf(ordenId) {
    console.log('[PDF Service] Buscando orden:', ordenId);

    const orden = await prisma.ordenMedica.findUnique({
      where: { id: ordenId },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        examenProcedimiento: {
          include: {
            categoria: true,
          },
        },
        ejecutador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!orden) {
      console.error('[PDF Service] Orden no encontrada:', ordenId);
      throw new Error('Orden médica no encontrada');
    }

    console.log('[PDF Service] Orden encontrada:', {
      id: orden.id,
      paciente: orden.paciente?.nombre,
      examen: orden.examenProcedimiento?.nombre,
    });

    try {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (err) => {
        console.error('[PDF Service] Error en documento:', err);
      });

      // Header institucional
      this._addHeader(doc);

      // Título
      doc.moveDown();
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
        .text('ORDEN MÉDICA', { align: 'center' });
      doc.moveDown(0.5);

      // Número de orden y fecha
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`No. Orden: ${orden.id.substring(0, 8).toUpperCase()}`, { align: 'right' });

      // Manejar fecha de forma segura
      doc.text(`Fecha: ${formatDate(orden.fechaOrden, 'dd/MM/yyyy HH:mm')}`, { align: 'right' });
      doc.moveDown();

      // Línea divisoria
      this._addDivider(doc);

      // Datos del paciente
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('DATOS DEL PACIENTE');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#333333');

      const paciente = orden.paciente;
      if (paciente) {
        doc.text(`Nombre: ${paciente.nombre || ''} ${paciente.apellido || ''}`);
        doc.text(`Identificación: ${paciente.tipoDocumento || 'CC'} ${paciente.cedula || ''}`);
        if (paciente.fechaNacimiento) {
          doc.text(`Fecha Nacimiento: ${formatDate(paciente.fechaNacimiento, 'dd/MM/yyyy')}`);
        }
        doc.text(`Género: ${paciente.genero || 'N/A'}`);
        if (paciente.telefono) {
          doc.text(`Teléfono: ${paciente.telefono}`);
        }
        if (paciente.eps) {
          doc.text(`EPS: ${paciente.eps}`);
        }
      }
      doc.moveDown();

      // Línea divisoria
      this._addDivider(doc);

      // Datos de la orden
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('DETALLE DE LA ORDEN');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#333333');

      // Tipo de examen/procedimiento
      const tipoOrden = orden.examenProcedimiento?.tipo || orden.tipo || 'No especificado';
      doc.font('Helvetica-Bold').text(`Tipo: `, { continued: true });
      doc.font('Helvetica').text(tipoOrden);

      // Nombre del examen/procedimiento
      doc.font('Helvetica-Bold').text(`Examen/Procedimiento: `, { continued: true });
      doc.font('Helvetica').text(orden.examenProcedimiento?.nombre || orden.descripcion || orden.observaciones || 'No especificado');

      // Código CUPS si existe
      if (orden.examenProcedimiento?.codigoCUPS) {
        doc.font('Helvetica-Bold').text(`Código CUPS: `, { continued: true });
        doc.font('Helvetica').text(orden.examenProcedimiento.codigoCUPS);
      }

      // Categoría
      if (orden.examenProcedimiento?.categoria?.nombre) {
        doc.font('Helvetica-Bold').text(`Categoría: `, { continued: true });
        doc.font('Helvetica').text(orden.examenProcedimiento.categoria.nombre);
      }

      // Prioridad
      doc.font('Helvetica-Bold').text(`Prioridad: `, { continued: true });
      const prioridadColor = this._getPrioridadColor(orden.prioridad);
      doc.fillColor(prioridadColor).font('Helvetica-Bold').text(orden.prioridad || 'Normal');
      doc.fillColor('#333333');

      // Estado
      doc.font('Helvetica-Bold').text(`Estado: `, { continued: true });
      doc.font('Helvetica').text(orden.estado || 'Pendiente');

      doc.moveDown();

      // Observaciones médicas
      if (orden.observaciones) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('INDICACIONES MÉDICAS');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10).fillColor('#333333');
        doc.text(orden.observaciones);
        doc.moveDown();
      }

      // Línea divisoria
      this._addDivider(doc);

      // Resultados (si existen)
      if (orden.resultados || orden.estado === 'Completada') {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('RESULTADOS');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10).fillColor('#333333');

        if (orden.resultados) {
          // Si es JSON, intentar parsear
          let resultadosTexto = orden.resultados;
          try {
            const resultadosObj = JSON.parse(orden.resultados);
            if (typeof resultadosObj === 'object') {
              resultadosTexto = Object.entries(resultadosObj)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            }
          } catch (e) {
            // No es JSON, usar como string
          }
          doc.text(resultadosTexto);
        } else {
          doc.text('Pendiente de resultados');
        }

        if (orden.fechaEjecucion) {
          doc.moveDown(0.5);
          doc.text(`Fecha de ejecución: ${formatDate(orden.fechaEjecucion, 'dd/MM/yyyy HH:mm')}`);
        }

        if (orden.ejecutador) {
          doc.text(`Ejecutado por: ${orden.ejecutador.nombre} ${orden.ejecutador.apellido}`);
        }

        doc.moveDown();
        this._addDivider(doc);
      }

      // Médico solicitante
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('MÉDICO SOLICITANTE');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#333333');

      if (orden.doctor) {
        doc.text(`Dr(a). ${orden.doctor.nombre} ${orden.doctor.apellido}`);
        if (orden.doctor.email) {
          doc.text(`Email: ${orden.doctor.email}`);
        }
      }

      // Espacio para firma
      doc.moveDown(2);
      doc.text('_________________________________', { align: 'center' });
      doc.text('Firma del Médico', { align: 'center' });

      // Footer
      this._addFooter(doc);

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          console.log('[PDF Service] PDF generado correctamente');
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', (err) => {
          console.error('[PDF Service] Error generando PDF:', err);
          reject(err);
        });
      });
    } catch (pdfError) {
      console.error('[PDF Service] Error en generación de PDF:', pdfError);
      throw new Error(`Error generando PDF: ${pdfError.message}`);
    }
  }

  /**
   * Header institucional
   */
  _addHeader(doc) {
    // Logo placeholder (ajustar según logo real)
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af')
      .text('CLÍNICA MÍA', 50, 50, { align: 'center' });

    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text('NIT: 901.234.567-8', { align: 'center' })
      .text('Dirección: Calle Principal #123, Ciudad', { align: 'center' })
      .text('Tel: (601) 123-4567 | Email: contacto@clinicamia.com', { align: 'center' });
  }

  /**
   * Línea divisoria
   */
  _addDivider(doc) {
    const currentY = doc.y;
    doc.strokeColor('#e5e7eb').lineWidth(1)
      .moveTo(50, currentY)
      .lineTo(562, currentY)
      .stroke();
  }

  /**
   * Footer
   */
  _addFooter(doc) {
    const pageHeight = doc.page.height;
    doc.fontSize(8).font('Helvetica').fillColor('#999999');
    doc.text(
      `Documento generado el ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')} | Este documento es válido únicamente con firma del médico tratante`,
      50,
      pageHeight - 50,
      { align: 'center', width: 512 }
    );
  }

  /**
   * Color según tipo de orden
   */
  _getTipoColor(tipo) {
    const colores = {
      'Laboratorio': '#2563eb',
      'Imagenologia': '#7c3aed',
      'Procedimiento': '#059669',
      'Interconsulta': '#d97706',
      'Dieta': '#ea580c',
    };
    return colores[tipo] || '#6b7280';
  }

  /**
   * Color según prioridad
   */
  _getPrioridadColor(prioridad) {
    const colores = {
      'Normal': '#6b7280',
      'Media': '#2563eb',
      'Alta': '#d97706',
      'Urgente': '#dc2626',
    };
    return colores[prioridad] || '#6b7280';
  }
}

module.exports = new OrdenMedicaPdfService();
