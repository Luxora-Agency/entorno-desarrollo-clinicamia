/**
 * Servicio de generación de PDF para Facturas
 */
const PDFDocument = require('pdfkit');

class FacturaPDFService {
  /**
   * Genera el PDF de una factura
   * @param {Object} factura - Datos de la factura con paciente, items y pagos
   * @returns {Promise<Buffer>} Buffer del PDF generado
   */
  async generarPDF(factura) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: 50,
          info: {
            Title: `Factura ${factura.numero}`,
            Author: 'Clínica Mía',
            Subject: 'Factura de Servicios Médicos',
          },
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Generar contenido
        this.generarEncabezado(doc, factura);
        this.generarInfoPaciente(doc, factura);
        this.generarTablaItems(doc, factura);
        this.generarTotales(doc, factura);
        this.generarHistorialPagos(doc, factura);
        this.generarPiePagina(doc, factura);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera el encabezado del documento
   */
  generarEncabezado(doc, factura) {
    // Logo y nombre de la clínica
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#047857')
      .text('CLINICA MIA', 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text('NIT: 901497975-7', 50, 80)
      .text('Dirección: Cra. 5 #28-85, Ibagué, Tolima', 50, 92)
      .text('Teléfono: (608) 324 333 8555 | Cel: 3107839998', 50, 104)
      .text('Email: infoclinicamia@gmail.com', 50, 116);

    // Número de factura
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#047857')
      .text('FACTURA DE VENTA', 400, 50, { align: 'right' });

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(factura.numero, 400, 70, { align: 'right' });

    // Fechas
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text(`Fecha de Emisión: ${this.formatDate(factura.fechaEmision)}`, 400, 95, { align: 'right' });

    if (factura.fechaVencimiento) {
      doc.text(`Fecha de Vencimiento: ${this.formatDate(factura.fechaVencimiento)}`, 400, 107, { align: 'right' });
    }

    // Estado
    const estadoColor = this.getEstadoColor(factura.estado);
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(estadoColor)
      .text(`Estado: ${factura.estado}`, 400, 125, { align: 'right' });

    // Línea divisoria
    doc
      .moveTo(50, 150)
      .lineTo(562, 150)
      .strokeColor('#D1D5DB')
      .stroke();
  }

  /**
   * Genera la información del paciente
   */
  generarInfoPaciente(doc, factura) {
    const paciente = factura.paciente || {};

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('FACTURAR A:', 50, 165);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#111827')
      .text(`${paciente.nombre || ''} ${paciente.apellido || ''}`, 50, 182)
      .text(`Cédula: ${paciente.cedula || 'N/A'}`, 50, 196)
      .text(`Teléfono: ${paciente.telefono || 'N/A'}`, 50, 210)
      .text(`Dirección: ${paciente.direccion || 'N/A'}`, 50, 224);

    // Información de cobertura
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('COBERTURA:', 350, 165);

    const tipoPago = factura.cubiertoPorEPS ? 'EPS' : 'Particular';
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#111827')
      .text(`Tipo: ${tipoPago}`, 350, 182);

    if (paciente.eps) {
      doc.text(`EPS: ${paciente.eps}`, 350, 196);
    }

    if (factura.epsAutorizacion) {
      doc.text(`Autorización: ${factura.epsAutorizacion}`, 350, 210);
    }

    // Línea divisoria
    doc
      .moveTo(50, 250)
      .lineTo(562, 250)
      .strokeColor('#D1D5DB')
      .stroke();
  }

  /**
   * Genera la tabla de items
   */
  generarTablaItems(doc, factura) {
    const tableTop = 265;
    const items = factura.items || [];

    // Encabezados de tabla
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF');

    // Fondo del encabezado
    doc
      .rect(50, tableTop, 512, 20)
      .fill('#047857');

    doc
      .fillColor('#FFFFFF')
      .text('Descripción', 55, tableTop + 6)
      .text('Tipo', 250, tableTop + 6)
      .text('Cant.', 320, tableTop + 6, { width: 40, align: 'center' })
      .text('V. Unit.', 365, tableTop + 6, { width: 60, align: 'right' })
      .text('Desc.', 430, tableTop + 6, { width: 50, align: 'right' })
      .text('Subtotal', 485, tableTop + 6, { width: 72, align: 'right' });

    // Filas de items
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor('#374151');

    items.forEach((item, index) => {
      // Alternar color de fondo
      if (index % 2 === 0) {
        doc.rect(50, y - 3, 512, 18).fill('#F9FAFB');
      }

      doc.fillColor('#374151');

      // Descripción (truncar si es muy larga)
      const descripcion = item.descripcion?.substring(0, 35) || 'Sin descripción';
      doc.text(descripcion, 55, y, { width: 190 });

      // Tipo
      doc.text(item.tipo || '-', 250, y, { width: 65 });

      // Cantidad
      doc.text(String(item.cantidad || 1), 320, y, { width: 40, align: 'center' });

      // Valor unitario
      doc.text(this.formatCurrency(item.precioUnitario), 365, y, { width: 60, align: 'right' });

      // Descuento
      const descuento = parseFloat(item.descuento) || 0;
      doc.text(descuento > 0 ? `-${this.formatCurrency(descuento)}` : '-', 430, y, { width: 50, align: 'right' });

      // Subtotal
      doc.text(this.formatCurrency(item.subtotal), 485, y, { width: 72, align: 'right' });

      y += 18;

      // Nueva página si es necesario
      if (y > 650) {
        doc.addPage();
        y = 50;
      }
    });

    return y;
  }

  /**
   * Genera los totales de la factura
   */
  generarTotales(doc, factura) {
    const items = factura.items || [];
    const lastItemY = 265 + 25 + (items.length * 18);
    let y = Math.min(lastItemY + 20, 550);

    // Si ya estamos muy abajo, agregar página
    if (y > 600) {
      doc.addPage();
      y = 50;
    }

    // Línea superior
    doc
      .moveTo(350, y)
      .lineTo(562, y)
      .strokeColor('#D1D5DB')
      .stroke();

    y += 10;

    // Subtotal
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text('Subtotal:', 350, y)
      .text(this.formatCurrency(factura.subtotal), 485, y, { width: 72, align: 'right' });

    y += 18;

    // Descuentos
    const descuentos = parseFloat(factura.descuentos) || 0;
    if (descuentos > 0) {
      doc
        .text('Descuentos:', 350, y)
        .fillColor('#DC2626')
        .text(`-${this.formatCurrency(descuentos)}`, 485, y, { width: 72, align: 'right' });
      y += 18;
    }

    // Impuestos
    const impuestos = parseFloat(factura.impuestos) || 0;
    if (impuestos > 0) {
      doc
        .fillColor('#374151')
        .text('Impuestos:', 350, y)
        .text(this.formatCurrency(impuestos), 485, y, { width: 72, align: 'right' });
      y += 18;
    }

    // Línea antes del total
    doc
      .moveTo(350, y)
      .lineTo(562, y)
      .strokeColor('#047857')
      .lineWidth(2)
      .stroke();

    y += 8;

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#047857')
      .text('TOTAL:', 350, y)
      .text(this.formatCurrency(factura.total), 485, y, { width: 72, align: 'right' });

    y += 22;

    // Saldo pendiente
    const saldoPendiente = parseFloat(factura.saldoPendiente) || 0;
    if (saldoPendiente > 0 && saldoPendiente < parseFloat(factura.total)) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#D97706')
        .text('Saldo Pendiente:', 350, y)
        .text(this.formatCurrency(saldoPendiente), 485, y, { width: 72, align: 'right' });
    }

    return y + 30;
  }

  /**
   * Genera el historial de pagos
   */
  generarHistorialPagos(doc, factura) {
    const pagos = factura.pagos || [];
    if (pagos.length === 0) return;

    let y = doc.y + 20;

    // Si ya estamos muy abajo, agregar página
    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    // Título
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('HISTORIAL DE PAGOS', 50, y);

    y += 20;

    // Encabezados
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#6B7280')
      .text('Fecha', 50, y)
      .text('Método', 150, y)
      .text('Referencia', 250, y)
      .text('Monto', 400, y, { width: 100, align: 'right' });

    y += 15;

    // Línea
    doc
      .moveTo(50, y)
      .lineTo(500, y)
      .strokeColor('#E5E7EB')
      .lineWidth(1)
      .stroke();

    y += 8;

    // Pagos
    doc.font('Helvetica').fontSize(9).fillColor('#374151');

    pagos.forEach((pago) => {
      doc
        .text(this.formatDate(pago.fechaPago), 50, y)
        .text(pago.metodoPago || '-', 150, y)
        .text(pago.referencia || '-', 250, y)
        .fillColor('#059669')
        .text(this.formatCurrency(pago.monto), 400, y, { width: 100, align: 'right' })
        .fillColor('#374151');

      y += 16;
    });
  }

  /**
   * Genera el pie de página
   */
  generarPiePagina(doc, factura) {
    const pageHeight = doc.page.height;

    // Observaciones
    if (factura.observaciones) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Observaciones:', 50, pageHeight - 150);

      doc
        .font('Helvetica')
        .fillColor('#6B7280')
        .text(factura.observaciones, 50, pageHeight - 135, { width: 512 });
    }

    // Línea final
    doc
      .moveTo(50, pageHeight - 80)
      .lineTo(562, pageHeight - 80)
      .strokeColor('#D1D5DB')
      .lineWidth(1)
      .stroke();

    // Información legal
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9CA3AF')
      .text('Este documento es una factura de venta de servicios médicos.', 50, pageHeight - 70, { align: 'center', width: 512 })
      .text('Clínica Mía - Todos los derechos reservados', 50, pageHeight - 58, { align: 'center', width: 512 })
      .text(`Generado el ${new Date().toLocaleString('es-CO')}`, 50, pageHeight - 46, { align: 'center', width: 512 });
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formatea un valor como moneda colombiana
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  }

  /**
   * Obtiene el color según el estado
   */
  getEstadoColor(estado) {
    switch (estado) {
      case 'Pagada':
        return '#059669';
      case 'Pendiente':
        return '#D97706';
      case 'Parcial':
        return '#2563EB';
      case 'Cancelada':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  }
}

module.exports = new FacturaPDFService();
