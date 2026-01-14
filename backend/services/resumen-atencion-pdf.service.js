/**
 * Servicio de Generación de PDF "Resumen de Atención"
 * Conforme a la normatividad colombiana vigente:
 *
 * - Resolución 1995 de 1999 (Normas para el manejo de la Historia Clínica)
 * - Resolución 839 de 2017 (Modificaciones a Res. 1995/1999)
 * - Resolución 3100 de 2019 (Habilitación de servicios de salud)
 * - Resolución 866 de 2021 (Interoperabilidad de Historia Clínica Electrónica)
 * - Ley 2015 de 2020 (Historia Clínica Electrónica Interoperable)
 *
 * Estructura del documento "Resumen de Atención":
 * 1. Identificación del paciente
 * 2. Antecedentes (Farmacológicos, Gineco, Patológicos, Quirúrgicos)
 * 3. Motivo de Consulta
 * 4. Enfermedad Actual
 * 5. Signos Vitales
 * 6. Examen Físico por Sistemas (13 sistemas)
 * 7. Paraclínicos
 * 8. Análisis Médico
 * 9. Diagnósticos (CIE-10/CIE-11)
 * 10. Formulación
 * 11. Exámenes / Órdenes
 * 12. Procedimientos
 * 13. Firma del Profesional
 */
const PDFDocument = require('pdfkit');
const prisma = require('../db/prisma');
const { NotFoundError } = require('../utils/errors');

// Configuración de sistemas para examen físico (orden del PDF)
const SISTEMAS_EXAMEN_FISICO = [
  { id: 'piel', label: 'Piel y Faneras' },
  { id: 'cabeza', label: 'Cabeza' },
  { id: 'ojos', label: 'Ojos' },
  { id: 'nariz', label: 'Nariz' },
  { id: 'oidos', label: 'Oídos' },
  { id: 'bocaFaringe', label: 'Boca y Faringe' },
  { id: 'cuello', label: 'Cuello' },
  { id: 'torax', label: 'Tórax' },
  { id: 'corazon', label: 'Corazón' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'genitourinario', label: 'Genitourinario' },
  { id: 'extremidades', label: 'Extremidades' },
  { id: 'sistemaNervioso', label: 'Sistema Nervioso' },
];

class ResumenAtencionPdfService {
  constructor() {
    this.margins = { top: 50, bottom: 50, left: 40, right: 40 };
    this.colors = {
      primary: '#0d9488',        // Teal principal (Clínica Mía)
      secondary: '#14b8a6',      // Teal secundario
      accent: '#f97316',         // Naranja acento
      text: '#1a202c',           // Negro texto
      textLight: '#4a5568',      // Gris texto secundario
      textMuted: '#718096',      // Gris texto terciario
      border: '#e2e8f0',         // Borde claro
      background: '#f0fdfa',     // Fondo teal muy claro
      headerBg: '#ccfbf1',       // Fondo header teal
      sectionBg: '#f7fafc',      // Fondo sección
    };

    // Información institucional de Clínica MÍA
    this.institucion = {
      nombre: 'CLINICA MIA MEDICINA INTEGRAL SAS',
      nit: '901497975-7',
      codigoHabilitacion: '7300103424',
      direccion: 'Cra. 5 #28-85',
      ciudad: 'Ibagué',
      departamento: 'Tolima',
      telefono: '(608) 324 333 8555',
      email: 'infoclinicamia@gmail.com',
      web: 'www.clinicamiacolombia.com',
    };
  }

  /**
   * Generar PDF de Resumen de Atención para una consulta específica
   */
  async generarResumenAtencion(consultaId) {
    const consulta = await this.obtenerDatosConsulta(consultaId);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: this.margins,
      bufferPages: true,
      info: {
        Title: `Resumen de Atención - ${consulta.paciente.documento}`,
        Author: this.institucion.nombre,
        Subject: 'Resumen de Atención Médica',
        Keywords: 'resumen atención, consulta médica, HCE, Colombia',
        Creator: 'Sistema HCE - Clínica Mía',
        CreationDate: new Date(),
      },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    await this.generarContenidoResumen(doc, consulta);
    this.agregarNumerosPagina(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  /**
   * Generar PDF de Fórmula Médica
   */
  async generarFormulaMedica(consultaId) {
    const consulta = await this.obtenerDatosConsulta(consultaId);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: this.margins,
      bufferPages: true,
      info: {
        Title: `Fórmula Médica - ${consulta.paciente.documento}`,
        Author: this.institucion.nombre,
        Subject: 'Fórmula Médica',
        Creator: 'Sistema HCE - Clínica Mía',
        CreationDate: new Date(),
      },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    await this.generarContenidoFormula(doc, consulta);
    this.agregarNumerosPagina(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  /**
   * Generar PDF de Órdenes Médicas
   */
  async generarOrdenesMedicas(consultaId) {
    const consulta = await this.obtenerDatosConsulta(consultaId);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: this.margins,
      bufferPages: true,
      info: {
        Title: `Órdenes Médicas - ${consulta.paciente.documento}`,
        Author: this.institucion.nombre,
        Subject: 'Órdenes Médicas',
        Creator: 'Sistema HCE - Clínica Mía',
        CreationDate: new Date(),
      },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    await this.generarContenidoOrdenes(doc, consulta);
    this.agregarNumerosPagina(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  /**
   * Obtener datos completos de la consulta
   */
  async obtenerDatosConsulta(consultaId) {
    const consulta = await prisma.evolucionClinica.findUnique({
      where: { id: consultaId },
      include: {
        paciente: true,
        doctor: true,
        admision: true,
      },
    });

    if (!consulta) {
      throw new NotFoundError('Consulta no encontrada');
    }

    // Obtener datos adicionales
    const [antecedentes, diagnosticos, prescripciones, procedimientos, laboratorios] = await Promise.all([
      prisma.antecedente.findFirst({
        where: { pacienteId: consulta.pacienteId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.diagnosticoHCE.findMany({
        where: {
          pacienteId: consulta.pacienteId,
          evolucionId: consultaId,
        },
        orderBy: { fechaDiagnostico: 'desc' },
      }),
      prisma.prescripcion.findMany({
        where: {
          pacienteId: consulta.pacienteId,
          citaId: consulta.citaId,
        },
        include: {
          medicamentos: {
            include: { producto: true },
          },
        },
      }),
      prisma.ordenMedica.findMany({
        where: {
          pacienteId: consulta.pacienteId,
          citaId: consulta.citaId,
        },
      }),
      prisma.laboratorio.findMany({
        where: {
          pacienteId: consulta.pacienteId,
          evolucionId: consultaId,
        },
      }),
    ]);

    return {
      ...consulta,
      paciente: {
        ...consulta.paciente,
        documento: consulta.paciente.cedula || consulta.paciente.documentoId,
      },
      antecedentes,
      diagnosticos,
      prescripciones,
      procedimientos,
      laboratorios,
    };
  }

  /**
   * Generar contenido del Resumen de Atención
   */
  async generarContenidoResumen(doc, consulta) {
    let y = this.margins.top;

    // Header
    y = this.agregarHeader(doc, 'RESUMEN DE ATENCIÓN', y);

    // Identificación del paciente
    y = this.agregarSeccionIdentificacion(doc, consulta, y);

    // Antecedentes
    y = this.agregarSeccionAntecedentes(doc, consulta, y);

    // Motivo de consulta
    y = this.agregarSeccionMotivoConsulta(doc, consulta, y);

    // Signos Vitales
    y = this.agregarSeccionSignosVitales(doc, consulta, y);

    // Examen Físico
    y = this.agregarSeccionExamenFisico(doc, consulta, y);

    // Paraclínicos
    y = this.agregarSeccionParaclinicos(doc, consulta, y);

    // Análisis
    y = this.agregarSeccionAnalisis(doc, consulta, y);

    // Diagnósticos
    y = this.agregarSeccionDiagnosticos(doc, consulta, y);

    // Formulación (resumen)
    y = this.agregarSeccionFormulacionResumen(doc, consulta, y);

    // Órdenes (resumen)
    y = this.agregarSeccionOrdenesResumen(doc, consulta, y);

    // Firma del profesional
    this.agregarFirmaProfesional(doc, consulta);
  }

  /**
   * Generar contenido de Fórmula Médica
   */
  async generarContenidoFormula(doc, consulta) {
    let y = this.margins.top;

    // Header
    y = this.agregarHeader(doc, 'FÓRMULA MÉDICA', y);

    // Identificación del paciente (compacta)
    y = this.agregarIdentificacionCompacta(doc, consulta, y);

    // Diagnóstico principal
    if (consulta.diagnosticos?.length > 0) {
      const dxPrincipal = consulta.diagnosticos.find(d => d.tipoDiagnostico === 'Principal') || consulta.diagnosticos[0];
      y = this.agregarSeccion(doc, 'DIAGNÓSTICO', `${dxPrincipal.codigoCIE11 || dxPrincipal.codigoCIE10} - ${dxPrincipal.descripcionCIE11 || dxPrincipal.descripcion}`, y);
    }

    // Medicamentos
    y = this.agregarSeccionMedicamentos(doc, consulta, y);

    // Firma del profesional
    this.agregarFirmaProfesional(doc, consulta);
  }

  /**
   * Generar contenido de Órdenes Médicas
   */
  async generarContenidoOrdenes(doc, consulta) {
    let y = this.margins.top;

    // Header
    y = this.agregarHeader(doc, 'ÓRDENES MÉDICAS', y);

    // Identificación del paciente (compacta)
    y = this.agregarIdentificacionCompacta(doc, consulta, y);

    // Diagnóstico principal
    if (consulta.diagnosticos?.length > 0) {
      const dxPrincipal = consulta.diagnosticos.find(d => d.tipoDiagnostico === 'Principal') || consulta.diagnosticos[0];
      y = this.agregarSeccion(doc, 'DIAGNÓSTICO', `${dxPrincipal.codigoCIE11 || dxPrincipal.codigoCIE10} - ${dxPrincipal.descripcionCIE11 || dxPrincipal.descripcion}`, y);
    }

    // Laboratorios
    y = this.agregarSeccionLaboratorios(doc, consulta, y);

    // Procedimientos
    y = this.agregarSeccionProcedimientos(doc, consulta, y);

    // Firma del profesional
    this.agregarFirmaProfesional(doc, consulta);
  }

  // ============ MÉTODOS AUXILIARES ============

  agregarHeader(doc, titulo, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Logo placeholder y nombre institución
    doc.fontSize(14)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text(this.institucion.nombre, this.margins.left, y, { width: pageWidth * 0.6 });

    doc.fontSize(8)
      .fillColor(this.colors.textMuted)
      .font('Helvetica')
      .text(`NIT: ${this.institucion.nit}`, this.margins.left, y + 18)
      .text(`${this.institucion.direccion}, ${this.institucion.ciudad}`, this.margins.left, y + 28)
      .text(`Tel: ${this.institucion.telefono}`, this.margins.left, y + 38);

    // Título del documento
    doc.fontSize(16)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text(titulo, this.margins.left, y + 55, { width: pageWidth, align: 'center' });

    // Línea divisora
    y = y + 75;
    doc.moveTo(this.margins.left, y)
      .lineTo(doc.page.width - this.margins.right, y)
      .strokeColor(this.colors.primary)
      .lineWidth(2)
      .stroke();

    return y + 15;
  }

  agregarSeccionIdentificacion(doc, consulta, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const paciente = consulta.paciente;

    // Título de sección
    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('IDENTIFICACIÓN DEL PACIENTE', this.margins.left, y);

    y += 18;

    // Datos en dos columnas
    const col1X = this.margins.left;
    const col2X = this.margins.left + pageWidth / 2;

    doc.fontSize(9)
      .fillColor(this.colors.text)
      .font('Helvetica');

    // Columna 1
    doc.font('Helvetica-Bold').text('Fecha:', col1X, y, { continued: true })
      .font('Helvetica').text(` ${this.formatearFecha(consulta.fechaEvolucion || consulta.createdAt)}`);

    doc.font('Helvetica-Bold').text('Paciente:', col1X, y + 14, { continued: true })
      .font('Helvetica').text(` ${paciente.nombre} ${paciente.apellido}`);

    doc.font('Helvetica-Bold').text('Documento:', col1X, y + 28, { continued: true })
      .font('Helvetica').text(` ${paciente.tipoDocumento || 'CC'} ${paciente.documento}`);

    doc.font('Helvetica-Bold').text('Dirección:', col1X, y + 42, { continued: true })
      .font('Helvetica').text(` ${paciente.direccion || 'N/A'}`);

    // Columna 2
    doc.font('Helvetica-Bold').text('Fecha Nac:', col2X, y, { continued: true })
      .font('Helvetica').text(` ${this.formatearFecha(paciente.fechaNacimiento)}`);

    doc.font('Helvetica-Bold').text('Teléfono:', col2X, y + 14, { continued: true })
      .font('Helvetica').text(` ${paciente.telefono || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Aseguradora:', col2X, y + 28, { continued: true })
      .font('Helvetica').text(` ${paciente.eps || 'N/A'}`);

    doc.font('Helvetica-Bold').text('Género:', col2X, y + 42, { continued: true })
      .font('Helvetica').text(` ${paciente.genero || 'N/A'}`);

    return y + 65;
  }

  agregarIdentificacionCompacta(doc, consulta, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const paciente = consulta.paciente;

    doc.fontSize(9)
      .fillColor(this.colors.text)
      .font('Helvetica');

    doc.font('Helvetica-Bold').text('Paciente: ', this.margins.left, y, { continued: true })
      .font('Helvetica').text(`${paciente.nombre} ${paciente.apellido} | ${paciente.tipoDocumento || 'CC'} ${paciente.documento} | Fecha: ${this.formatearFecha(consulta.fechaEvolucion || consulta.createdAt)}`);

    return y + 25;
  }

  agregarSeccionAntecedentes(doc, consulta, y) {
    const antecedentes = consulta.antecedentes;
    if (!antecedentes) return y;

    y = this.verificarEspacioPagina(doc, y, 100);

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('ANTECEDENTES', this.margins.left, y);

    y += 16;

    const tipos = [
      { key: 'farmacologicos', label: 'Farmacológicos' },
      { key: 'ginecoObstetrico', label: 'Gineco-Obstétricos' },
      { key: 'patologicos', label: 'Patológicos' },
      { key: 'quirurgicos', label: 'Quirúrgicos' },
    ];

    doc.fontSize(9).fillColor(this.colors.text);

    for (const tipo of tipos) {
      const valor = antecedentes[tipo.key];
      if (valor && typeof valor === 'object' && Object.keys(valor).length > 0) {
        doc.font('Helvetica-Bold').text(`${tipo.label}: `, this.margins.left, y, { continued: true })
          .font('Helvetica').text(this.formatearAntecedente(valor));
        y += 14;
      } else if (typeof valor === 'string' && valor) {
        doc.font('Helvetica-Bold').text(`${tipo.label}: `, this.margins.left, y, { continued: true })
          .font('Helvetica').text(valor);
        y += 14;
      }
    }

    return y + 10;
  }

  agregarSeccionMotivoConsulta(doc, consulta, y) {
    y = this.verificarEspacioPagina(doc, y, 80);

    const evolucion = consulta.evolucion || {};

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('MOTIVO DE CONSULTA', this.margins.left, y);

    y += 16;

    doc.fontSize(9)
      .fillColor(this.colors.text)
      .font('Helvetica')
      .text(evolucion.subjetivo || consulta.motivoConsulta || 'No registrado', this.margins.left, y, {
        width: doc.page.width - this.margins.left - this.margins.right,
      });

    y = doc.y + 15;

    // Enfermedad actual si existe
    if (evolucion.enfermedadActual) {
      doc.fontSize(11)
        .fillColor(this.colors.primary)
        .font('Helvetica-Bold')
        .text('ENFERMEDAD ACTUAL', this.margins.left, y);

      y += 16;

      doc.fontSize(9)
        .fillColor(this.colors.text)
        .font('Helvetica')
        .text(evolucion.enfermedadActual, this.margins.left, y, {
          width: doc.page.width - this.margins.left - this.margins.right,
        });

      y = doc.y + 15;
    }

    return y;
  }

  agregarSeccionSignosVitales(doc, consulta, y) {
    y = this.verificarEspacioPagina(doc, y, 80);

    const vitales = consulta.signosVitales || consulta.vitales || {};

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('SIGNOS VITALES', this.margins.left, y);

    y += 16;

    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const colWidth = pageWidth / 4;

    doc.fontSize(9).fillColor(this.colors.text);

    // Fila 1
    doc.font('Helvetica-Bold').text('FC: ', this.margins.left, y, { continued: true })
      .font('Helvetica').text(`${vitales.frecuenciaCardiaca || '--'} lpm`);

    doc.font('Helvetica-Bold').text('FR: ', this.margins.left + colWidth, y, { continued: true })
      .font('Helvetica').text(`${vitales.frecuenciaRespiratoria || '--'} rpm`);

    doc.font('Helvetica-Bold').text('T: ', this.margins.left + colWidth * 2, y, { continued: true })
      .font('Helvetica').text(`${vitales.temperatura || '--'} °C`);

    doc.font('Helvetica-Bold').text('PA: ', this.margins.left + colWidth * 3, y, { continued: true })
      .font('Helvetica').text(`${vitales.presionSistolica || '--'}/${vitales.presionDiastolica || '--'} mmHg`);

    y += 14;

    // Fila 2
    doc.font('Helvetica-Bold').text('SatO2: ', this.margins.left, y, { continued: true })
      .font('Helvetica').text(`${vitales.saturacionOxigeno || '--'} %`);

    doc.font('Helvetica-Bold').text('Peso: ', this.margins.left + colWidth, y, { continued: true })
      .font('Helvetica').text(`${vitales.peso || '--'} kg`);

    doc.font('Helvetica-Bold').text('Talla: ', this.margins.left + colWidth * 2, y, { continued: true })
      .font('Helvetica').text(`${vitales.talla || '--'} cm`);

    const imc = vitales.peso && vitales.talla ? (vitales.peso / Math.pow(vitales.talla / 100, 2)).toFixed(1) : '--';
    doc.font('Helvetica-Bold').text('IMC: ', this.margins.left + colWidth * 3, y, { continued: true })
      .font('Helvetica').text(`${imc}`);

    return y + 25;
  }

  agregarSeccionExamenFisico(doc, consulta, y) {
    y = this.verificarEspacioPagina(doc, y, 150);

    const examenFisico = consulta.signosVitales?.examenFisico || consulta.examenFisico || {};

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('EXAMEN FÍSICO', this.margins.left, y);

    y += 16;

    doc.fontSize(9).fillColor(this.colors.text);

    for (const sistema of SISTEMAS_EXAMEN_FISICO) {
      const hallazgo = examenFisico[sistema.id];
      const texto = hallazgo || 'Sin alteraciones';

      doc.font('Helvetica-Bold').text(`${sistema.label}: `, this.margins.left, y, { continued: true })
        .font('Helvetica').text(texto);

      y += 12;

      // Verificar si necesitamos nueva página
      if (y > doc.page.height - this.margins.bottom - 50) {
        doc.addPage();
        y = this.margins.top;
      }
    }

    return y + 10;
  }

  agregarSeccionParaclinicos(doc, consulta, y) {
    const laboratorios = consulta.laboratorios || [];
    if (laboratorios.length === 0) return y;

    y = this.verificarEspacioPagina(doc, y, 80);

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('PARACLÍNICOS', this.margins.left, y);

    y += 16;

    doc.fontSize(9).fillColor(this.colors.text);

    for (const lab of laboratorios.slice(0, 5)) {
      doc.font('Helvetica-Bold').text(`${lab.nombre || lab.examen}: `, this.margins.left, y, { continued: true })
        .font('Helvetica').text(`${lab.resultado || 'Pendiente'}`);
      y += 12;
    }

    return y + 10;
  }

  agregarSeccionAnalisis(doc, consulta, y) {
    y = this.verificarEspacioPagina(doc, y, 80);

    const analisis = consulta.evolucion?.analisis || consulta.analisis || '';

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('ANÁLISIS MÉDICO', this.margins.left, y);

    y += 16;

    doc.fontSize(9)
      .fillColor(this.colors.text)
      .font('Helvetica')
      .text(analisis || 'No registrado', this.margins.left, y, {
        width: doc.page.width - this.margins.left - this.margins.right,
      });

    return doc.y + 15;
  }

  agregarSeccionDiagnosticos(doc, consulta, y) {
    const diagnosticos = consulta.diagnosticos || [];
    if (diagnosticos.length === 0) return y;

    y = this.verificarEspacioPagina(doc, y, 80);

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('DIAGNÓSTICOS', this.margins.left, y);

    y += 16;

    doc.fontSize(9).fillColor(this.colors.text);

    for (const dx of diagnosticos) {
      const codigo = dx.codigoCIE11 || dx.codigoCIE10 || 'N/A';
      const descripcion = dx.descripcionCIE11 || dx.descripcion || 'Sin descripción';
      const tipo = dx.tipoDiagnostico || 'Relacionado';

      doc.font('Helvetica-Bold').text(`[${tipo}] ${codigo}: `, this.margins.left, y, { continued: true })
        .font('Helvetica').text(descripcion);

      y += 14;
    }

    return y + 10;
  }

  agregarSeccionFormulacionResumen(doc, consulta, y) {
    const prescripciones = consulta.prescripciones || [];
    if (prescripciones.length === 0) return y;

    y = this.verificarEspacioPagina(doc, y, 60);

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('FORMULACIÓN', this.margins.left, y);

    y += 16;

    doc.fontSize(9).fillColor(this.colors.text);

    let medicamentosCount = 0;
    for (const prescripcion of prescripciones) {
      for (const med of (prescripcion.medicamentos || [])) {
        const nombre = med.producto?.nombre || med.nombreMedicamento || 'Medicamento';
        doc.font('Helvetica').text(`• ${nombre} - ${med.dosis || ''} ${med.via || ''} ${med.frecuencia || ''}`, this.margins.left, y);
        y += 12;
        medicamentosCount++;
        if (medicamentosCount >= 5) break;
      }
      if (medicamentosCount >= 5) break;
    }

    return y + 10;
  }

  agregarSeccionOrdenesResumen(doc, consulta, y) {
    const ordenes = consulta.procedimientos || [];
    if (ordenes.length === 0) return y;

    y = this.verificarEspacioPagina(doc, y, 60);

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('ÓRDENES MÉDICAS', this.margins.left, y);

    y += 16;

    doc.fontSize(9).fillColor(this.colors.text);

    for (const orden of ordenes.slice(0, 5)) {
      doc.font('Helvetica').text(`• ${orden.descripcion || orden.nombre || 'Orden médica'}`, this.margins.left, y);
      y += 12;
    }

    return y + 10;
  }

  agregarSeccionMedicamentos(doc, consulta, y) {
    const prescripciones = consulta.prescripciones || [];
    if (prescripciones.length === 0) {
      doc.fontSize(10)
        .fillColor(this.colors.textMuted)
        .text('No se han registrado medicamentos para esta consulta.', this.margins.left, y);
      return y + 30;
    }

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('MEDICAMENTOS FORMULADOS', this.margins.left, y);

    y += 20;

    let counter = 1;
    for (const prescripcion of prescripciones) {
      for (const med of (prescripcion.medicamentos || [])) {
        y = this.verificarEspacioPagina(doc, y, 60);

        const nombre = med.producto?.nombre || med.nombreMedicamento || 'Medicamento';

        // Número y nombre del medicamento
        doc.fontSize(10)
          .fillColor(this.colors.text)
          .font('Helvetica-Bold')
          .text(`${counter}. ${nombre}`, this.margins.left, y);

        y += 14;

        // Detalles
        doc.fontSize(9)
          .font('Helvetica')
          .fillColor(this.colors.textLight);

        doc.text(`   Dosis: ${med.dosis || 'N/A'}`, this.margins.left, y);
        y += 12;
        doc.text(`   Vía: ${med.via || 'N/A'} | Frecuencia: ${med.frecuencia || 'N/A'}`, this.margins.left, y);
        y += 12;
        doc.text(`   Duración: ${med.duracion || 'N/A'} | Cantidad: ${med.cantidad || 'N/A'}`, this.margins.left, y);
        y += 12;

        if (med.indicaciones) {
          doc.text(`   Indicaciones: ${med.indicaciones}`, this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right - 20,
          });
          y = doc.y + 5;
        }

        y += 10;
        counter++;
      }
    }

    return y;
  }

  agregarSeccionLaboratorios(doc, consulta, y) {
    const ordenes = consulta.procedimientos?.filter(o => o.tipoOrden === 'laboratorio' || o.tipo === 'LABORATORIO') || [];
    const laboratorios = consulta.laboratorios || [];

    if (ordenes.length === 0 && laboratorios.length === 0) return y;

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('ÓRDENES DE LABORATORIO', this.margins.left, y);

    y += 20;

    doc.fontSize(9).fillColor(this.colors.text).font('Helvetica');

    const items = ordenes.length > 0 ? ordenes : laboratorios;
    for (const item of items) {
      doc.text(`• ${item.nombre || item.examen || item.descripcion}`, this.margins.left, y);
      y += 14;
    }

    return y + 10;
  }

  agregarSeccionProcedimientos(doc, consulta, y) {
    const procedimientos = consulta.procedimientos?.filter(o =>
      o.tipoOrden !== 'laboratorio' && o.tipo !== 'LABORATORIO'
    ) || [];

    if (procedimientos.length === 0) return y;

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text('PROCEDIMIENTOS', this.margins.left, y);

    y += 20;

    doc.fontSize(9).fillColor(this.colors.text).font('Helvetica');

    for (const proc of procedimientos) {
      doc.text(`• ${proc.nombre || proc.descripcion}`, this.margins.left, y);
      y += 14;
    }

    return y + 10;
  }

  agregarSeccion(doc, titulo, contenido, y) {
    y = this.verificarEspacioPagina(doc, y, 50);

    doc.fontSize(11)
      .fillColor(this.colors.primary)
      .font('Helvetica-Bold')
      .text(titulo, this.margins.left, y);

    y += 16;

    doc.fontSize(9)
      .fillColor(this.colors.text)
      .font('Helvetica')
      .text(contenido || 'No registrado', this.margins.left, y, {
        width: doc.page.width - this.margins.left - this.margins.right,
      });

    return doc.y + 15;
  }

  agregarFirmaProfesional(doc, consulta) {
    const doctor = consulta.doctor || {};
    const y = doc.page.height - this.margins.bottom - 100;

    // Línea de firma
    const lineaX = this.margins.left + 100;
    const lineaWidth = 200;

    doc.moveTo(lineaX, y + 30)
      .lineTo(lineaX + lineaWidth, y + 30)
      .strokeColor(this.colors.text)
      .lineWidth(0.5)
      .stroke();

    // Nombre del doctor
    doc.fontSize(10)
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .text(`${doctor.nombre || ''} ${doctor.apellido || ''}`, lineaX, y + 35, {
        width: lineaWidth,
        align: 'center',
      });

    // RM (Registro Médico)
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor(this.colors.textLight)
      .text(`RM: ${doctor.registroMedico || doctor.rm || 'N/A'}`, lineaX, y + 48, {
        width: lineaWidth,
        align: 'center',
      });

    // Especialidad
    if (doctor.especialidad) {
      doc.text(doctor.especialidad, lineaX, y + 60, {
        width: lineaWidth,
        align: 'center',
      });
    }

    // Aviso legal
    doc.fontSize(7)
      .fillColor(this.colors.textMuted)
      .text('Documento generado electrónicamente. Válido según Ley 527/1999.', this.margins.left, y + 80, {
        width: doc.page.width - this.margins.left - this.margins.right,
        align: 'center',
      });
  }

  agregarNumerosPagina(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Número de página
      doc.fontSize(8)
        .fillColor(this.colors.textMuted)
        .text(
          `Página ${i + 1} de ${pages.count}`,
          this.margins.left,
          doc.page.height - 30,
          {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center',
          }
        );

      // Footer institucional
      doc.fontSize(7)
        .text(
          `${this.institucion.nombre} | ${this.institucion.direccion}, ${this.institucion.ciudad} | Tel: ${this.institucion.telefono}`,
          this.margins.left,
          doc.page.height - 20,
          {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center',
          }
        );
    }
  }

  verificarEspacioPagina(doc, y, espacioRequerido) {
    if (y + espacioRequerido > doc.page.height - this.margins.bottom) {
      doc.addPage();
      return this.margins.top;
    }
    return y;
  }

  formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatearAntecedente(antecedente) {
    if (!antecedente || typeof antecedente !== 'object') return 'Sin datos';

    const partes = [];
    for (const [key, value] of Object.entries(antecedente)) {
      if (value && value !== 'No' && value !== false && value !== 'N/A') {
        partes.push(`${key}: ${value}`);
      }
    }

    return partes.length > 0 ? partes.join(', ') : 'Sin antecedentes relevantes';
  }
}

module.exports = new ResumenAtencionPdfService();
