/**
 * Servicio para generación de PDF de Órdenes Médicas
 * Diseño consistente con HCE - Clínica MÍA
 * Soporte para kits/prescripciones con tabla de medicamentos
 */

const PDFDocument = require('pdfkit');
const prisma = require('../db/prisma');
const { format } = require('date-fns');
const path = require('path');
const fs = require('fs');

// Intentar cargar locale español
let esLocale = null;
try {
  const localeModule = require('date-fns/locale/es');
  esLocale = localeModule.es || localeModule.default || localeModule;
} catch (e) {
  esLocale = null;
}

// Helper para formatear fechas
const formatDate = (date, formatStr) => {
  try {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return format(dateObj, formatStr, esLocale ? { locale: esLocale } : {});
  } catch {
    return 'N/A';
  }
};

class OrdenMedicaPdfService {
  constructor() {
    this.margins = { top: 60, bottom: 60, left: 50, right: 50 };

    // Colores de marca Clínica MÍA - Turquesa/Teal
    this.colors = {
      primary: '#0d9488',
      primaryDark: '#0f766e',
      primaryLight: '#14b8a6',
      accent: '#2dd4bf',
      secondary: '#0ea5e9',
      danger: '#dc2626',
      warning: '#f59e0b',
      success: '#16a34a',
      text: '#1e293b',
      textLight: '#475569',
      textMuted: '#64748b',
      border: '#e2e8f0',
      background: '#f8fafc',
      headerBg: '#f0fdfa',
      white: '#ffffff',
      tableBorder: '#cbd5e1',
      tableHeader: '#e0f2f1',
    };

    this.logoPath = path.join(__dirname, '../assets/clinica-mia-logo.png');

    this.institucion = {
      nombre: 'CLÍNICA MÍA MEDICINA INTEGRAL SAS',
      nit: '901497975-7',
      codigoHabilitacion: '7300103424',
      direccion: 'Avenida Ferrocarril 41-23',
      ciudad: 'Ibagué',
      departamento: 'Tolima',
      telefono: '(608) 324 333 8555',
      celular: '3107839998',
      email: 'infoclinicamia@gmail.com',
      web: 'https://clinicamia.co/',
      tipoEntidad: 'IPS',
    };
  }

  /**
   * Parsear información de kit/prescripción desde observaciones
   */
  _parseKitInfo(observaciones) {
    if (!observaciones) return null;

    // Detectar si es un kit/prescripción
    const esKit = observaciones.includes('APLICACIÓN DE KIT') ||
                  observaciones.includes('Kit ') ||
                  observaciones.includes('Medicamentos incluidos');

    if (!esKit) return null;

    const info = {
      nombreKit: null,
      codigoKit: null,
      categoria: null,
      descripcion: null,
      medicamentos: [],
      total: null,
    };

    const lineas = observaciones.split('\n');

    for (const linea of lineas) {
      // Extraer nombre y código del kit
      const kitMatch = linea.match(/(?:APLICACIÓN DE KIT:|Kit\s+)([^(]+)\s*\(([^)]+)\)/i);
      if (kitMatch) {
        info.nombreKit = kitMatch[1].trim();
        info.codigoKit = kitMatch[2].trim();
      }

      // Extraer categoría
      const catMatch = linea.match(/Categoría:\s*(.+)/i);
      if (catMatch) {
        info.categoria = catMatch[1].trim();
      }

      // Extraer descripción
      const descMatch = linea.match(/Descripción:\s*(.+)/i);
      if (descMatch) {
        info.descripcion = descMatch[1].trim();
      }

      // Extraer medicamentos (formato: • Nombre (código) xCantidad - Vía [Frecuencia] [por Duración] [- instrucciones])
      const medMatch = linea.match(/[•\-]\s*([^(]+)\s*\(([^)]+)\)\s*x(\d+)\s*[-–]\s*([^,\[\-]+)/i);
      if (medMatch) {
        const nombreCompleto = medMatch[1].trim();
        const viaBase = medMatch[4].trim();

        // Extraer concentración/dosis (ej: "1g", "500mg", "10ml")
        const concMatch = nombreCompleto.match(/(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|ui|%|cc|meq))/i);
        let concentracion = concMatch ? concMatch[1].trim() : '';

        // Extraer forma farmacéutica (ampolla, tableta, cápsula, jarabe, etc.)
        const formaMatch = nombreCompleto.match(/(ampolla|tableta|cápsula|capsula|jarabe|suspensión|suspension|crema|gel|solución|solucion|inyectable|comprimido|sobre|parche|gotas|spray|óvulo|ovulo|supositorio)/i);
        const forma = formaMatch ? formaMatch[1].trim() : '';

        // Extraer frecuencia - soportar múltiples formatos:
        // [Cada8Horas], [c/8h], cada 8 horas, c/8h
        let frecuencia = '';
        const freqBracketMatch = linea.match(/\[([^\]]*(?:cada|c\/|hora|Hora|Unica|PRN|SOS)[^\]]*)\]/i);
        if (freqBracketMatch) {
          frecuencia = freqBracketMatch[1].trim();
        } else {
          const freqMatch = linea.match(/(?:c\/|cada\s*)(\d+)\s*(?:h|hrs?|horas?)/i);
          if (freqMatch) frecuencia = `c/${freqMatch[1]}h`;
        }

        // Extraer duración - soportar múltiples formatos:
        // [por 5 días], por 5 días, x5d, 5 días
        let duracion = '';
        const durBracketMatch = linea.match(/\[por\s+([^\]]+)\]/i);
        if (durBracketMatch) {
          duracion = durBracketMatch[1].trim();
        } else {
          const durMatch = linea.match(/(?:por|x)\s*(\d+)\s*(?:d|días?|dias?)/i);
          if (durMatch) duracion = `${durMatch[1]} días`;
        }

        // Extraer instrucciones adicionales (texto después del último corchete o después de vía/frecuencia)
        let instrucciones = '';
        // Buscar instrucciones después del último ] seguido de -
        const instrBracketMatch = linea.match(/\]\s*[-–]\s*([^•\n]+?)$/i);
        if (instrBracketMatch) {
          instrucciones = instrBracketMatch[1].trim();
        } else {
          // Buscar patrones como: "- con alimentos", "- en ayunas", etc.
          const instrMatch = linea.match(/[-–]\s*(?:con|en|antes|después|sin|tomar)\s+(.+?)(?:$|c\/|\|)/i);
          if (instrMatch) instrucciones = instrMatch[1].trim();
        }

        // Nombre sin concentración ni forma
        let nombreBase = nombreCompleto
          .replace(/\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|ui|%|cc|meq)/i, '')
          .replace(/(ampolla|tableta|cápsula|capsula|jarabe|suspensión|suspension|crema|gel|solución|solucion|inyectable|comprimido|sobre|parche|gotas|spray|óvulo|ovulo|supositorio)/i, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Si no hay concentración pero viene dosis en otro campo, usar nombreCompleto como dosis
        if (!concentracion && nombreCompleto.includes(' ')) {
          // Intentar extraer la dosis del nombre completo
          const parts = nombreCompleto.split(' ');
          if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (/\d/.test(lastPart)) {
              concentracion = lastPart;
            }
          }
        }

        info.medicamentos.push({
          nombre: nombreBase || nombreCompleto,
          nombreCompleto: nombreCompleto,
          codigo: medMatch[2].trim(),
          cantidad: parseInt(medMatch[3], 10),
          concentracion: concentracion,
          dosis: concentracion, // Alias para compatibilidad
          forma: forma,
          via: viaBase,
          frecuencia: frecuencia,
          duracion: duracion,
          instrucciones: instrucciones,
        });
      }

      // Extraer total
      const totalMatch = linea.match(/Total\s*(?:del\s*kit)?:\s*\$?([\d.,]+)/i);
      if (totalMatch) {
        info.total = totalMatch[1].trim();
      }
    }

    // Solo retornar si encontramos medicamentos
    return info.medicamentos.length > 0 ? info : null;
  }

  /**
   * Parsear información de órdenes de exámenes/procedimientos agrupados
   * Formato: ORDEN DE EXAMEN/PROCEDIMIENTO
   */
  _parseOrdenExamenes(observaciones) {
    if (!observaciones) return null;

    // Detectar si es una orden de exámenes/procedimientos agrupados
    const esOrdenExamenes = observaciones.includes('ORDEN DE EXAMEN') ||
                            observaciones.includes('ORDEN DE PROCEDIMIENTO') ||
                            observaciones.includes('Items solicitados');

    if (!esOrdenExamenes) return null;

    const info = {
      tipoOrden: 'Examen',
      consultaId: null,
      fecha: null,
      items: [],
      total: null,
    };

    const lineas = observaciones.split('\n');

    for (const linea of lineas) {
      // Detectar tipo de orden
      if (linea.includes('ORDEN DE PROCEDIMIENTO')) {
        info.tipoOrden = 'Procedimiento';
      } else if (linea.includes('ORDEN DE EXAMEN/PROCEDIMIENTO')) {
        info.tipoOrden = 'Examen/Procedimiento';
      }

      // Extraer ID de consulta
      const consultaMatch = linea.match(/Consulta:\s*([a-f0-9-]+)/i);
      if (consultaMatch) {
        info.consultaId = consultaMatch[1].trim();
      }

      // Extraer fecha
      const fechaMatch = linea.match(/Fecha:\s*(.+)/i);
      if (fechaMatch) {
        info.fecha = fechaMatch[1].trim();
      }

      // Extraer items (formato: 1. [Tipo] Nombre (CUPS: XXX) - Observaciones)
      const itemMatch = linea.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+)/);
      if (itemMatch) {
        const tipo = itemMatch[1].trim();
        let resto = itemMatch[2].trim();

        // Extraer código CUPS si existe
        const cupsMatch = resto.match(/\(CUPS:\s*([^)]+)\)/);
        const codigoCups = cupsMatch ? cupsMatch[1].trim() : '';
        if (cupsMatch) {
          resto = resto.replace(cupsMatch[0], '').trim();
        }

        // Separar nombre y observaciones
        const partes = resto.split(' - ');
        const nombre = partes[0].trim();
        const observacionesItem = partes.length > 1 ? partes.slice(1).join(' - ').trim() : '';

        info.items.push({
          tipo,
          nombre,
          codigoCups,
          observaciones: observacionesItem,
        });
      }

      // Extraer total
      const totalMatch = linea.match(/Total:\s*\$?([\d.,]+)/i);
      if (totalMatch) {
        info.total = totalMatch[1].trim();
      }
    }

    // Solo retornar si encontramos items
    return info.items.length > 0 ? info : null;
  }

  /**
   * Generar PDF de una orden médica
   */
  async generarOrdenPdf(ordenId) {
    console.log('[PDF Service] Buscando orden:', ordenId);

    const orden = await prisma.ordenMedica.findUnique({
      where: { id: ordenId },
      include: {
        paciente: true,
        doctor: {
          select: {
            id: true, nombre: true, apellido: true, email: true,
            doctor: {
              include: {
                especialidades: {
                  include: { especialidad: true }
                }
              }
            }
          },
        },
        examenProcedimiento: { include: { categoria: true } },
        ejecutador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!orden) {
      throw new Error('Orden médica no encontrada');
    }

    console.log('[PDF Service] Generando PDF para:', orden.id);

    // Parsear información de kit/prescripción si existe
    const kitInfo = this._parseKitInfo(orden.observaciones);

    // Parsear información de órdenes de exámenes agrupados si existe
    const examenesInfo = this._parseOrdenExamenes(orden.observaciones);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: 0,
          autoFirstPage: true,
          bufferPages: false,
          info: {
            Title: `Orden Médica - ${orden.id.substring(0, 8)}`,
            Author: 'Clínica MÍA',
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          console.log('[PDF Service] PDF generado correctamente');
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);

        // Dimensiones
        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const contentW = pageW - 100;
        const leftX = 50;

        // ============ DIBUJAR TODO EN ORDEN DESCENDENTE ============

        // 1. Barra superior decorativa
        doc.rect(0, 0, pageW, 6).fill(this.colors.primary);
        doc.rect(0, 6, pageW, 2).fill(this.colors.accent);

        // 2. Header institucional
        const headerTop = 15;
        const headerH = 55;
        doc.rect(leftX, headerTop, contentW, headerH).fill(this.colors.primary);

        // Logo
        let logoLoaded = false;
        try {
          if (fs.existsSync(this.logoPath)) {
            doc.image(this.logoPath, leftX + 8, headerTop + 5, { fit: [45, 45] });
            logoLoaded = true;
          }
        } catch (e) { /* sin logo */ }

        if (!logoLoaded) {
          doc.circle(leftX + 30, headerTop + 28, 18).fill(this.colors.white);
          doc.fontSize(14).font('Helvetica-Bold').fillColor(this.colors.primary)
             .text('CM', leftX + 17, headerTop + 20, { lineBreak: false });
        }

        // Info institucional
        const infoX = leftX + 60;
        doc.fillColor(this.colors.white).fontSize(12).font('Helvetica-Bold')
           .text(this.institucion.nombre, infoX, headerTop + 8, { lineBreak: false });
        doc.fontSize(7).fillColor(this.colors.accent)
           .text(`NIT: ${this.institucion.nit} | Hab: ${this.institucion.codigoHabilitacion} | ${this.institucion.tipoEntidad}`, infoX, headerTop + 24, { lineBreak: false });
        doc.fillColor('#e0f2f1').fontSize(7)
           .text(`${this.institucion.direccion}, ${this.institucion.ciudad} | Tel: ${this.institucion.telefono}`, infoX, headerTop + 34, { lineBreak: false })
           .text(`${this.institucion.email} | ${this.institucion.web}`, infoX, headerTop + 44, { lineBreak: false });

        // 3. Título del documento - clasificar por tipo
        let y = headerTop + headerH + 8;
        let tipoDoc, tipoColor;
        if (kitInfo) {
          tipoDoc = 'ORDEN DE PRESCRIPCIÓN MÉDICA';
          tipoColor = this.colors.secondary; // Azul para prescripciones
        } else if (examenesInfo) {
          // Orden de exámenes/procedimientos agrupados
          if (examenesInfo.tipoOrden === 'Procedimiento') {
            tipoDoc = 'ORDEN DE PROCEDIMIENTO';
            tipoColor = '#16a34a'; // Verde para procedimientos
          } else if (examenesInfo.tipoOrden === 'Examen/Procedimiento') {
            tipoDoc = 'ORDEN DE EXAMEN / PROCEDIMIENTO';
            tipoColor = this.colors.primary;
          } else {
            tipoDoc = 'ORDEN DE EXAMEN';
            tipoColor = '#7c3aed'; // Púrpura para exámenes
          }
        } else {
          tipoDoc = 'ORDEN DE EXAMEN / PROCEDIMIENTO';
          tipoColor = this.colors.primary; // Teal para exámenes
        }
        doc.rect(leftX, y, contentW, 22).fill(this.colors.headerBg);
        doc.fillColor(tipoColor).fontSize(12).font('Helvetica-Bold')
           .text(tipoDoc, leftX + 10, y + 5, { lineBreak: false });
        doc.fontSize(8).fillColor(this.colors.textLight)
           .text(`No. ${orden.id.substring(0, 8).toUpperCase()}`, leftX + 220, y + 7, { lineBreak: false });
        doc.fontSize(8).fillColor(this.colors.textMuted)
           .text(`Fecha: ${formatDate(orden.fechaOrden, 'dd/MM/yyyy HH:mm')}`, leftX + contentW - 130, y + 7, { lineBreak: false });

        // 4. Datos del paciente (compacto)
        y += 28;
        doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke(this.colors.headerBg, this.colors.primary);
        doc.fillColor(this.colors.primary).fontSize(9).font('Helvetica-Bold')
           .text('DATOS DEL PACIENTE', leftX + 10, y + 3, { lineBreak: false });

        y += 18;
        doc.rect(leftX, y, contentW, 40).fill(this.colors.background);

        const pac = orden.paciente || {};
        const col1 = leftX + 10;
        const col2 = leftX + contentW / 2;
        const lh = 12;

        y += 4;
        this._field(doc, 'Nombre:', `${pac.nombre || ''} ${pac.apellido || ''}`, col1, y);
        this._field(doc, 'Identificación:', `${pac.tipoDocumento || 'CC'} ${pac.cedula || ''}`, col2, y);
        y += lh;
        this._field(doc, 'EPS:', (pac.eps || 'N/A').substring(0, 35), col1, y);
        this._field(doc, 'Teléfono:', pac.telefono || 'N/A', col2, y);
        y += lh;
        this._field(doc, 'Régimen:', pac.regimen || 'N/A', col1, y);
        this._field(doc, 'Género:', pac.genero || 'N/A', col2, y);

        // Si es un kit/prescripción, mostrar información estructurada
        if (kitInfo) {
          y = this._drawKitSection(doc, kitInfo, orden, y + 18, leftX, contentW, col1, col2);
        } else if (examenesInfo) {
          // Mostrar orden de exámenes/procedimientos agrupados con tabla
          y = this._drawOrdenExamenesAgrupados(doc, examenesInfo, orden, y + 18, leftX, contentW, col1, col2);
        } else {
          // Mostrar como orden médica normal (un solo item)
          y = this._drawOrdenNormal(doc, orden, y + 18, leftX, contentW, col1, col2);
        }

        // Médico solicitante y firma
        y += 5;
        doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke(this.colors.headerBg, this.colors.primary);
        doc.fillColor(this.colors.primary).fontSize(9).font('Helvetica-Bold')
           .text('MÉDICO SOLICITANTE', leftX + 10, y + 3, { lineBreak: false });

        y += 18;
        const doctor = orden.doctor;
        if (doctor) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(this.colors.text)
             .text(`Dr(a). ${doctor.nombre || ''} ${doctor.apellido || ''}`, col1, y, { lineBreak: false });
          y += 12;

          const esps = doctor.doctor?.especialidades || [];
          if (esps.length > 0) {
            const espNames = esps.map(e => e.especialidad?.nombre).filter(Boolean).join(', ').substring(0, 50);
            if (espNames) {
              doc.fontSize(8).font('Helvetica').fillColor(this.colors.textLight)
                 .text(espNames, col1, y, { lineBreak: false });
              y += 10;
            }
          }

          if (doctor.doctor?.licenciaMedica) {
            doc.fontSize(7).fillColor(this.colors.textMuted)
               .text(`Lic. Médica: ${doctor.doctor.licenciaMedica}`, col1, y, { lineBreak: false });
            y += 10;
          }
        }

        // Línea de firma
        y += 20;
        const firmaX = leftX + (contentW / 2) - 80;
        doc.strokeColor(this.colors.border).lineWidth(1)
           .moveTo(firmaX, y).lineTo(firmaX + 160, y).stroke();
        doc.fontSize(8).fillColor(this.colors.textMuted)
           .text('Firma y Sello del Médico', firmaX, y + 4, { width: 160, align: 'center', lineBreak: false });

        // Footer
        const footerY = pageH - 48;
        doc.strokeColor(this.colors.border).lineWidth(0.5)
           .moveTo(leftX, footerY).lineTo(leftX + contentW, footerY).stroke();

        doc.fontSize(7).font('Helvetica').fillColor(this.colors.textMuted)
           .text(`Documento generado el ${formatDate(new Date(), "dd/MM/yyyy 'a las' HH:mm")} | Este documento es válido únicamente con firma y sello del médico tratante.`,
                 leftX, footerY + 5, { width: contentW, align: 'center', lineBreak: false });
        doc.text(`${this.institucion.nombre} | NIT: ${this.institucion.nit} | ${this.institucion.direccion}, ${this.institucion.ciudad}`,
                 leftX, footerY + 15, { width: contentW, align: 'center', lineBreak: false });

        // Barra inferior decorativa
        doc.rect(0, pageH - 8, pageW, 2).fill(this.colors.accent);
        doc.rect(0, pageH - 6, pageW, 6).fill(this.colors.primary);

        doc.end();
      } catch (err) {
        console.error('[PDF Service] Error:', err);
        reject(err);
      }
    });
  }

  /**
   * Dibujar sección de Kit/Prescripción con tabla de medicamentos
   */
  _drawKitSection(doc, kitInfo, orden, y, leftX, contentW, col1, col2) {
    // Título de sección: Detalle de Prescripción
    doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke('#e0f7fa', this.colors.secondary);
    doc.fillColor(this.colors.secondary).fontSize(9).font('Helvetica-Bold')
       .text('DETALLE DE PRESCRIPCIÓN', leftX + 10, y + 3, { lineBreak: false });

    y += 18;

    // Info del kit
    this._field(doc, 'Kit:', kitInfo.nombreKit || 'N/A', col1, y);
    this._field(doc, 'Código:', kitInfo.codigoKit || 'N/A', col2, y);
    y += 12;
    if (kitInfo.categoria) {
      this._field(doc, 'Categoría:', kitInfo.categoria, col1, y);
    }
    this._field(doc, 'Prioridad:', orden.prioridad || 'Normal', col2, y, this._getPrioridadColor(orden.prioridad));
    y += 12;
    if (kitInfo.descripcion) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.textLight)
         .text('Descripción:', col1, y, { lineBreak: false });
      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(kitInfo.descripcion.substring(0, 70), col1 + 65, y, { lineBreak: false });
      y += 12;
    }

    // Estado badge
    const estado = orden.estado || 'Pendiente';
    doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.textLight)
       .text('Estado:', col1, y, { lineBreak: false });
    const estadoW = doc.widthOfString(estado) + 14;
    doc.roundedRect(col1 + 45, y - 2, estadoW, 12, 3).fill(this._getEstadoColor(estado));
    doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.white)
       .text(estado, col1 + 52, y, { lineBreak: false });

    y += 20;

    // === TABLA DE MEDICAMENTOS ===
    doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke('#e0f7fa', this.colors.secondary);
    doc.fillColor(this.colors.secondary).fontSize(9).font('Helvetica-Bold')
       .text('MEDICAMENTOS INCLUIDOS', leftX + 10, y + 3, { lineBreak: false });

    y += 18;

    // Encabezados de tabla - 6 columnas: Medicamento, Dosis, Vía, Frecuencia, Duración, Instrucciones
    const tableX = leftX;
    const colWidths = {
      medicamento: contentW * 0.22,
      dosis: contentW * 0.14,
      via: contentW * 0.14,
      frecuencia: contentW * 0.14,
      duracion: contentW * 0.12,
      instrucciones: contentW * 0.24,
    };

    // Header de tabla
    doc.rect(tableX, y, contentW, 16).fill(this.colors.tableHeader);
    doc.strokeColor(this.colors.tableBorder).lineWidth(0.5)
       .rect(tableX, y, contentW, 16).stroke();

    let xPos = tableX + 4;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.text);
    doc.text('Medicamento', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.medicamento;
    doc.text('Dosis', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.dosis;
    doc.text('Vía', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.via;
    doc.text('Frecuencia', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.frecuencia;
    doc.text('Duración', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.duracion;
    doc.text('Instrucciones', xPos, y + 5, { lineBreak: false });

    y += 16;

    // Filas de medicamentos
    for (let i = 0; i < kitInfo.medicamentos.length; i++) {
      const med = kitInfo.medicamentos[i];
      const rowBg = i % 2 === 0 ? this.colors.white : this.colors.background;

      doc.rect(tableX, y, contentW, 14).fill(rowBg);
      doc.strokeColor(this.colors.tableBorder).lineWidth(0.5)
         .rect(tableX, y, contentW, 14).stroke();

      xPos = tableX + 4;
      // Medicamento (nombre + forma + cantidad)
      const nombreMed = `${med.nombre} ${med.forma || ''} x${med.cantidad}`.trim();
      doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.text)
         .text(nombreMed.substring(0, 22), xPos, y + 4, { lineBreak: false });
      xPos += colWidths.medicamento;
      // Dosis por toma (concentración)
      const dosisText = med.concentracion || med.dosis || '-';
      doc.font('Helvetica-Bold').fillColor(this.colors.primary)
         .text(dosisText.substring(0, 12), xPos, y + 4, { lineBreak: false });
      xPos += colWidths.dosis;
      // Vía de administración
      doc.font('Helvetica-Bold').fillColor(this.colors.secondary)
         .text((med.via || '-').substring(0, 12), xPos, y + 4, { lineBreak: false });
      xPos += colWidths.via;
      // Frecuencia
      doc.font('Helvetica').fillColor(this.colors.text)
         .text(med.frecuencia || 'Única', xPos, y + 4, { lineBreak: false });
      xPos += colWidths.frecuencia;
      // Duración
      doc.font('Helvetica').fillColor(this.colors.text)
         .text(med.duracion || 'Única', xPos, y + 4, { lineBreak: false });
      xPos += colWidths.duracion;
      // Instrucciones adicionales
      doc.font('Helvetica').fillColor(this.colors.textLight)
         .text((med.instrucciones || '-').substring(0, 18), xPos, y + 4, { lineBreak: false });

      y += 14;
    }

    // Línea de total
    doc.rect(tableX, y, contentW, 16).fill(this.colors.headerBg);
    doc.strokeColor(this.colors.tableBorder).lineWidth(0.5)
       .rect(tableX, y, contentW, 16).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.text)
       .text('TOTAL KIT:', tableX + 5, y + 4, { lineBreak: false });
    doc.fillColor(this.colors.primary)
       .text(`$${kitInfo.total || orden.precioAplicado || '0'}`, tableX + contentW - 80, y + 4, { lineBreak: false });

    return y + 20;
  }

  /**
   * Dibujar orden médica normal (sin kit)
   */
  _drawOrdenNormal(doc, orden, y, leftX, contentW, col1, col2) {
    // Detalle de la orden
    doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke(this.colors.headerBg, this.colors.primary);
    doc.fillColor(this.colors.primary).fontSize(9).font('Helvetica-Bold')
       .text('DETALLE DE LA ORDEN', leftX + 10, y + 3, { lineBreak: false });

    y += 18;
    const tipo = orden.examenProcedimiento?.tipo || orden.tipo || 'No especificado';
    const prioridad = orden.prioridad || 'Normal';

    this._field(doc, 'Tipo:', tipo, col1, y, this._getTipoColor(tipo));
    this._field(doc, 'Prioridad:', prioridad, col2, y, this._getPrioridadColor(prioridad));

    y += 14;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.textLight)
       .text('Examen/Procedimiento:', col1, y, { lineBreak: false });
    y += 10;
    const nombreExamen = (orden.examenProcedimiento?.nombre || orden.descripcion || 'No especificado').substring(0, 80);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(this.colors.text)
       .text(nombreExamen, col1, y, { lineBreak: false });

    y += 14;
    if (orden.examenProcedimiento?.codigoCUPS) {
      this._field(doc, 'Código CUPS:', orden.examenProcedimiento.codigoCUPS, col1, y);
    }
    if (orden.examenProcedimiento?.categoria?.nombre) {
      this._field(doc, 'Categoría:', orden.examenProcedimiento.categoria.nombre.substring(0, 30), col2, y);
    }

    y += 14;
    const estado = orden.estado || 'Pendiente';
    doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.textLight)
       .text('Estado:', col1, y, { lineBreak: false });
    const estadoW = doc.widthOfString(estado) + 14;
    doc.roundedRect(col1 + 45, y - 2, estadoW, 12, 3).fill(this._getEstadoColor(estado));
    doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.white)
       .text(estado, col1 + 52, y, { lineBreak: false });

    // Indicaciones médicas (si hay y no es kit)
    y += 20;
    if (orden.observaciones) {
      doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke(this.colors.headerBg, this.colors.primary);
      doc.fillColor(this.colors.primary).fontSize(9).font('Helvetica-Bold')
         .text('INDICACIONES MÉDICAS', leftX + 10, y + 3, { lineBreak: false });

      y += 18;
      const obsText = (orden.observaciones || '').substring(0, 300);
      doc.rect(leftX, y, contentW, 40).fill(this.colors.background);
      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text)
         .text(obsText, col1, y + 5, { width: contentW - 20, height: 32, ellipsis: true });
      y += 45;
    }

    return y;
  }

  /**
   * Dibujar orden de exámenes/procedimientos agrupados con tabla
   */
  _drawOrdenExamenesAgrupados(doc, examenesInfo, orden, y, leftX, contentW, col1, col2) {
    // Título de sección
    const sectionColor = examenesInfo.tipoOrden === 'Procedimiento' ? '#16a34a' :
                        examenesInfo.tipoOrden === 'Examen/Procedimiento' ? this.colors.primary : '#7c3aed';

    doc.rect(leftX, y, contentW, 14).lineWidth(1).fillAndStroke('#f0f9ff', sectionColor);
    doc.fillColor(sectionColor).fontSize(9).font('Helvetica-Bold')
       .text(`ITEMS SOLICITADOS (${examenesInfo.items.length})`, leftX + 10, y + 3, { lineBreak: false });

    y += 18;

    // Tabla de items
    const tableX = leftX;
    const colWidths = {
      numero: contentW * 0.06,
      tipo: contentW * 0.14,
      nombre: contentW * 0.50,
      codigo: contentW * 0.15,
      observaciones: contentW * 0.15,
    };

    // Header de tabla
    doc.rect(tableX, y, contentW, 16).fill(this.colors.tableHeader);
    doc.strokeColor(this.colors.tableBorder).lineWidth(0.5)
       .rect(tableX, y, contentW, 16).stroke();

    let xPos = tableX + 4;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.text);
    doc.text('#', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.numero;
    doc.text('Tipo', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.tipo;
    doc.text('Examen / Procedimiento', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.nombre;
    doc.text('Código CUPS', xPos, y + 5, { lineBreak: false });
    xPos += colWidths.codigo;
    doc.text('Indicaciones', xPos, y + 5, { lineBreak: false });

    y += 16;

    // Filas de items
    for (let i = 0; i < examenesInfo.items.length && i < 15; i++) {
      const item = examenesInfo.items[i];
      const rowBg = i % 2 === 0 ? this.colors.white : this.colors.background;

      doc.rect(tableX, y, contentW, 14).fill(rowBg);
      doc.strokeColor(this.colors.tableBorder).lineWidth(0.5)
         .rect(tableX, y, contentW, 14).stroke();

      xPos = tableX + 4;
      // Número
      doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.textMuted)
         .text(String(i + 1), xPos, y + 4, { lineBreak: false });
      xPos += colWidths.numero;
      // Tipo con color
      const tipoColor = this._getTipoColor(item.tipo);
      doc.font('Helvetica-Bold').fillColor(tipoColor)
         .text(item.tipo.substring(0, 12), xPos, y + 4, { lineBreak: false });
      xPos += colWidths.tipo;
      // Nombre
      doc.font('Helvetica-Bold').fillColor(this.colors.text)
         .text(item.nombre.substring(0, 45), xPos, y + 4, { lineBreak: false });
      xPos += colWidths.nombre;
      // Código CUPS
      doc.font('Helvetica').fillColor(this.colors.textLight)
         .text(item.codigoCups || '-', xPos, y + 4, { lineBreak: false });
      xPos += colWidths.codigo;
      // Observaciones
      doc.font('Helvetica').fillColor(this.colors.textMuted)
         .text((item.observaciones || '-').substring(0, 14), xPos, y + 4, { lineBreak: false });

      y += 14;
    }

    // Si hay más de 15 items, mostrar mensaje
    if (examenesInfo.items.length > 15) {
      doc.fontSize(7).font('Helvetica-Oblique').fillColor(this.colors.textMuted)
         .text(`... y ${examenesInfo.items.length - 15} item(s) más`, tableX + 5, y + 2, { lineBreak: false });
      y += 12;
    }

    // Línea de total
    doc.rect(tableX, y, contentW, 16).fill(this.colors.headerBg);
    doc.strokeColor(this.colors.tableBorder).lineWidth(0.5)
       .rect(tableX, y, contentW, 16).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.text)
       .text(`TOTAL (${examenesInfo.items.length} items):`, tableX + 5, y + 4, { lineBreak: false });
    doc.fillColor(this.colors.primary)
       .text(`$${examenesInfo.total || orden.precioAplicado || '0'}`, tableX + contentW - 80, y + 4, { lineBreak: false });

    // Estado y prioridad
    y += 20;
    const estado = orden.estado || 'Pendiente';
    const prioridad = orden.prioridad || 'Normal';
    this._field(doc, 'Estado:', estado, col1, y, this._getEstadoColorText(estado));
    this._field(doc, 'Prioridad:', prioridad, col2, y, this._getPrioridadColor(prioridad));

    return y + 14;
  }

  /**
   * Helper para escribir campo: valor
   */
  _field(doc, label, value, x, y, valueColor = null) {
    doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.textLight)
       .text(label, x, y, { lineBreak: false });
    doc.fontSize(8).font('Helvetica').fillColor(valueColor || this.colors.text)
       .text(String(value || 'N/A').substring(0, 40), x + 65, y, { lineBreak: false });
  }

  _getTipoColor(tipo) {
    const c = { 'Laboratorio': '#2563eb', 'Imagenologia': '#7c3aed', 'Imagenología': '#7c3aed', 'Procedimiento': '#059669', 'Interconsulta': '#d97706' };
    return c[tipo] || this.colors.primary;
  }

  _getPrioridadColor(p) {
    const c = { 'Normal': this.colors.textMuted, 'Media': this.colors.secondary, 'Alta': this.colors.warning, 'Urgente': this.colors.danger };
    return c[p] || this.colors.textMuted;
  }

  _getEstadoColor(e) {
    const c = { 'Pendiente': this.colors.warning, 'En Proceso': this.colors.secondary, 'Completada': this.colors.success, 'Cancelada': this.colors.danger };
    return c[e] || this.colors.textMuted;
  }

  _getEstadoColorText(e) {
    const c = { 'Pendiente': '#d97706', 'EnProceso': '#0ea5e9', 'En Proceso': '#0ea5e9', 'Completada': '#16a34a', 'Cancelada': '#dc2626' };
    return c[e] || this.colors.textMuted;
  }
}

module.exports = new OrdenMedicaPdfService();
