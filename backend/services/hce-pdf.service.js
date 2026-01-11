/**
 * Servicio de Generación de PDF de Historia Clínica Electrónica
 * Conforme a la normatividad colombiana vigente:
 *
 * - Resolución 1995 de 1999 (Normas para el manejo de la Historia Clínica)
 * - Resolución 839 de 2017 (Modificaciones a Res. 1995/1999)
 * - Resolución 3100 de 2019 (Habilitación de servicios de salud)
 * - Resolución 866 de 2021 (Interoperabilidad de Historia Clínica Electrónica)
 * - Ley 2015 de 2020 (Historia Clínica Electrónica Interoperable)
 * - Ley 1581 de 2012 (Protección de Datos Personales)
 * - Resolución 2003 de 2014 (Estándares de calidad)
 *
 * Estructura según Art. 10 Resolución 1995/1999:
 * 1. Identificación del usuario
 * 2. Registros específicos (motivo de consulta, enfermedad actual, antecedentes)
 * 3. Diagnósticos
 * 4. Plan de manejo (conducta)
 * 5. Consentimientos informados
 * 6. Evolución y notas
 */
const PDFDocument = require('pdfkit');
const prisma = require('../db/prisma');
const { NotFoundError } = require('../utils/errors');

class HCEPdfService {
  constructor() {
    this.margins = { top: 60, bottom: 60, left: 50, right: 50 };
    this.colors = {
      primary: '#1a365d',        // Azul institucional oscuro
      secondary: '#2b6cb0',      // Azul institucional
      accent: '#38a169',         // Verde salud
      danger: '#c53030',         // Rojo alertas
      warning: '#dd6b20',        // Naranja advertencias
      text: '#1a202c',           // Negro texto
      textLight: '#4a5568',      // Gris texto secundario
      textMuted: '#718096',      // Gris texto terciario
      border: '#e2e8f0',         // Borde claro
      background: '#f7fafc',     // Fondo gris muy claro
      headerBg: '#ebf8ff',       // Fondo azul claro
      successBg: '#f0fff4',      // Fondo verde claro
      warningBg: '#fffaf0',      // Fondo naranja claro
      dangerBg: '#fff5f5',       // Fondo rojo claro
    };

    // Información institucional (debería venir de configuración)
    this.institucion = {
      nombre: 'CLÍNICA MÍA S.A.S.',
      nit: '900.XXX.XXX-X',
      codigoHabilitacion: 'XXXXXXXXXX',
      direccion: 'Dirección de la Institución',
      telefono: '(XXX) XXX-XXXX',
      ciudad: 'Ciudad, Departamento',
      email: 'contacto@clinicamia.com',
      representanteLegal: 'Nombre del Representante Legal',
    };
  }

  /**
   * Generar PDF completo de la Historia Clínica Electrónica
   */
  async generarPDF(pacienteId) {
    const datos = await this.obtenerDatosCompletos(pacienteId);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: this.margins,
      bufferPages: true,
      info: {
        Title: `Historia Clínica Electrónica - ${datos.paciente.cedula}`,
        Author: this.institucion.nombre,
        Subject: 'Historia Clínica Electrónica - Documento Confidencial',
        Keywords: 'historia clínica, HCE, salud, Colombia, confidencial',
        Creator: 'Sistema HCE - Clínica Mía',
        Producer: 'PDFKit - Node.js',
        CreationDate: new Date(),
      },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    await this.generarContenido(doc, datos);
    this.agregarNumerosPagina(doc);
    this.agregarMarcaAgua(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  /**
   * Obtener todos los datos del paciente para la HCE
   */
  async obtenerDatosCompletos(pacienteId) {
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    const [
      evoluciones,
      signosVitales,
      diagnosticos,
      alertas,
      prescripciones,
      procedimientos,
      urgencias,
      hospitalizaciones,
      interconsultas,
      ordenesMedicas,
      notasEnfermeria,
      imagenologia,
      citas,
    ] = await Promise.all([
      prisma.evolucionClinica.findMany({
        where: { pacienteId },
        include: {
          doctor: true,
          admision: { include: { unidad: true } },
        },
        orderBy: { fechaEvolucion: 'desc' },
      }),
      prisma.signoVital.findMany({
        where: { pacienteId },
        include: { registrador: true },
        orderBy: { fechaRegistro: 'desc' },
      }),
      prisma.diagnosticoHCE.findMany({
        where: { pacienteId },
        include: { doctor: true },
        orderBy: { fechaDiagnostico: 'desc' },
      }),
      prisma.alertaClinica.findMany({
        where: { pacienteId },
        include: { reconocedor: true },
        orderBy: { fechaAlerta: 'desc' },
      }),
      prisma.prescripcion.findMany({
        where: { pacienteId },
        include: {
          medico: true,
          medicamentos: { include: { producto: true } },
        },
        orderBy: { fechaPrescripcion: 'desc' },
      }),
      prisma.procedimiento.findMany({
        where: { pacienteId },
        include: {
          medicoResponsable: true,
          anestesiologo: true,
          quirofano: true,
          medicoFirma: true,
        },
        orderBy: { fechaProgramada: 'desc' },
      }),
      prisma.atencionUrgencia.findMany({
        where: { pacienteId },
        include: {
          medicoAsignado: true,
          enfermeraAsignada: true,
        },
        orderBy: { horaLlegada: 'desc' },
      }),
      prisma.admision.findMany({
        where: { pacienteId },
        include: {
          unidad: true,
          cama: { include: { habitacion: true } },
          movimientos: true,
        },
        orderBy: { fechaIngreso: 'desc' },
      }),
      prisma.interconsulta.findMany({
        where: { pacienteId },
        include: {
          medicoSolicitante: true,
          medicoEspecialista: true,
        },
        orderBy: { fechaSolicitud: 'desc' },
      }),
      prisma.ordenMedica.findMany({
        where: { pacienteId },
        include: {
          doctor: true,
          examenProcedimiento: true,
        },
        orderBy: { fechaOrden: 'desc' },
      }),
      prisma.notaEnfermeria.findMany({
        where: { pacienteId },
        include: { enfermera: true },
        orderBy: { fechaHora: 'desc' },
      }),
      prisma.estudioImagenologia.findMany({
        where: { pacienteId },
        include: {
          medicoSolicitante: true,
          radiologo: true,
        },
        orderBy: { fechaSolicitud: 'desc' },
      }),
      prisma.cita.findMany({
        where: { pacienteId },
        include: { doctor: true },
        orderBy: { fecha: 'desc' },
        take: 20,
      }),
    ]);

    const laboratorios = ordenesMedicas.filter(
      (o) => o.tipo === 'Laboratorio' || o.examenProcedimiento?.categoria === 'Laboratorio'
    );

    // Filtrar cirugías (procedimientos quirúrgicos)
    const cirugias = procedimientos.filter(
      (p) => p.tipo === 'Quirurgico' || p.tipoCirugia
    );

    // Procedimientos no quirúrgicos
    const procedimientosNoQuirurgicos = procedimientos.filter(
      (p) => p.tipo !== 'Quirurgico' && !p.tipoCirugia
    );

    return {
      paciente,
      evoluciones,
      signosVitales,
      diagnosticos,
      alertas,
      prescripciones,
      procedimientos: procedimientosNoQuirurgicos,
      cirugias,
      urgencias,
      hospitalizaciones,
      interconsultas,
      ordenesMedicas,
      notasEnfermeria,
      imagenologia,
      laboratorios,
      citas,
      fechaGeneracion: new Date(),
      institucion: this.institucion,
    };
  }

  /**
   * Generar contenido completo del PDF según normativa colombiana
   */
  async generarContenido(doc, datos) {
    // === SECCIÓN 1: PORTADA ===
    this.generarPortada(doc, datos);

    // === SECCIÓN 2: ÍNDICE DE CONTENIDO ===
    doc.addPage();
    this.generarIndice(doc, datos);

    // === SECCIÓN 3: DATOS DE IDENTIFICACIÓN DEL PACIENTE ===
    // (Art. 10, Res. 1995/1999 - Identificación del usuario)
    doc.addPage();
    this.generarIdentificacionPaciente(doc, datos.paciente);

    // === SECCIÓN 4: ANTECEDENTES CLÍNICOS ===
    // (Art. 10, Res. 1995/1999 - Registros específicos: antecedentes)
    doc.addPage();
    this.generarAntecedentesClinico(doc, datos);

    // === SECCIÓN 5: ALERTAS MÉDICAS Y ALERGIAS ===
    if (datos.alertas.length > 0) {
      doc.addPage();
      this.generarSeccionAlertas(doc, datos.alertas);
    }

    // === SECCIÓN 6: DIAGNÓSTICOS ===
    // (Art. 10, Res. 1995/1999 - Diagnóstico)
    if (datos.diagnosticos.length > 0) {
      doc.addPage();
      this.generarSeccionDiagnosticos(doc, datos.diagnosticos);
    }

    // === SECCIÓN 7: EVOLUCIONES MÉDICAS ===
    // (Notas SOAP - Res. 1995/1999)
    if (datos.evoluciones.length > 0) {
      doc.addPage();
      this.generarSeccionEvoluciones(doc, datos.evoluciones);
    }

    // === SECCIÓN 8: SIGNOS VITALES ===
    if (datos.signosVitales.length > 0) {
      doc.addPage();
      this.generarSeccionSignosVitales(doc, datos.signosVitales);
    }

    // === SECCIÓN 9: ÓRDENES MÉDICAS ===
    // (Art. 10, Res. 1995/1999 - Plan de manejo)
    if (datos.ordenesMedicas.length > 0) {
      doc.addPage();
      this.generarSeccionOrdenesMedicas(doc, datos.ordenesMedicas);
    }

    // === SECCIÓN 10: PRESCRIPCIONES ===
    if (datos.prescripciones.length > 0) {
      doc.addPage();
      this.generarSeccionPrescripciones(doc, datos.prescripciones);
    }

    // === SECCIÓN 11: PROCEDIMIENTOS ===
    if (datos.procedimientos.length > 0) {
      doc.addPage();
      this.generarSeccionProcedimientos(doc, datos.procedimientos);
    }

    // === SECCIÓN 11B: CIRUGÍAS ===
    if (datos.cirugias && datos.cirugias.length > 0) {
      doc.addPage();
      this.generarSeccionCirugias(doc, datos.cirugias);
    }

    // === SECCIÓN 12: INTERCONSULTAS ===
    if (datos.interconsultas.length > 0) {
      doc.addPage();
      this.generarSeccionInterconsultas(doc, datos.interconsultas);
    }

    // === SECCIÓN 13: NOTAS DE ENFERMERÍA ===
    if (datos.notasEnfermeria.length > 0) {
      doc.addPage();
      this.generarSeccionNotasEnfermeria(doc, datos.notasEnfermeria);
    }

    // === SECCIÓN 14: RESULTADOS DE LABORATORIO ===
    if (datos.laboratorios.length > 0) {
      doc.addPage();
      this.generarSeccionLaboratorios(doc, datos.laboratorios);
    }

    // === SECCIÓN 15: IMAGENOLOGÍA ===
    if (datos.imagenologia.length > 0) {
      doc.addPage();
      this.generarSeccionImagenologia(doc, datos.imagenologia);
    }

    // === SECCIÓN 16: ATENCIONES DE URGENCIAS ===
    if (datos.urgencias.length > 0) {
      doc.addPage();
      this.generarSeccionUrgencias(doc, datos.urgencias);
    }

    // === SECCIÓN 17: HOSPITALIZACIONES Y EPICRISIS ===
    if (datos.hospitalizaciones.length > 0) {
      doc.addPage();
      this.generarSeccionHospitalizaciones(doc, datos.hospitalizaciones);
    }

    // === SECCIÓN 18: RESUMEN ESTADÍSTICO ===
    doc.addPage();
    this.generarResumenEstadistico(doc, datos);

    // === SECCIÓN 19: CONSTANCIA DE AUTENTICIDAD ===
    doc.addPage();
    this.generarConstanciaAutenticidad(doc, datos);
  }

  /**
   * Generar portada institucional completa
   */
  generarPortada(doc, datos) {
    const { paciente, fechaGeneracion, institucion } = datos;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const centerX = this.margins.left;

    // === ENCABEZADO INSTITUCIONAL ===
    doc.rect(this.margins.left - 10, this.margins.top - 10, pageWidth + 20, 100)
       .fill(this.colors.primary);

    // Logo placeholder y nombre institucional
    doc.fillColor('#ffffff')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(institucion.nombre, centerX, this.margins.top + 10, {
         width: pageWidth,
         align: 'center',
       });

    doc.fontSize(11)
       .font('Helvetica')
       .text('SISTEMA DE HISTORIA CLÍNICA ELECTRÓNICA', {
         width: pageWidth,
         align: 'center',
       });

    doc.fontSize(9)
       .text(`NIT: ${institucion.nit} | Código Habilitación: ${institucion.codigoHabilitacion}`, {
         width: pageWidth,
         align: 'center',
       });

    doc.text(`${institucion.direccion} - ${institucion.ciudad}`, {
         width: pageWidth,
         align: 'center',
       });

    // === TÍTULO PRINCIPAL ===
    doc.fillColor(this.colors.primary)
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('HISTORIA CLÍNICA', centerX, 200, {
         width: pageWidth,
         align: 'center',
       });

    doc.fontSize(18)
       .font('Helvetica')
       .text('ELECTRÓNICA INTEGRAL', {
         width: pageWidth,
         align: 'center',
       });

    // Línea decorativa
    doc.moveTo(this.margins.left + 100, 260)
       .lineTo(this.margins.left + pageWidth - 100, 260)
       .lineWidth(2)
       .stroke(this.colors.secondary);

    // === INFORMACIÓN DEL PACIENTE ===
    const boxY = 290;
    doc.rect(this.margins.left + 30, boxY, pageWidth - 60, 200)
       .lineWidth(2)
       .stroke(this.colors.primary);

    // Encabezado del box
    doc.rect(this.margins.left + 30, boxY, pageWidth - 60, 30)
       .fill(this.colors.primary);

    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('DATOS DEL PACIENTE', this.margins.left + 30, boxY + 9, {
         width: pageWidth - 60,
         align: 'center',
       });

    // Datos del paciente
    const datosY = boxY + 45;
    const col1X = this.margins.left + 50;
    const col2X = this.margins.left + pageWidth / 2;

    doc.fillColor(this.colors.text).fontSize(10).font('Helvetica');

    const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim();

    // Columna 1
    this.escribirCampoPortada(doc, 'Nombre Completo:', nombreCompleto, col1X, datosY);
    this.escribirCampoPortada(doc, 'Tipo Documento:', paciente.tipoDocumento || 'CC', col1X, datosY + 28);
    this.escribirCampoPortada(doc, 'Número Documento:', paciente.cedula || 'N/A', col1X, datosY + 56);
    this.escribirCampoPortada(doc, 'Fecha Nacimiento:', this.formatearFecha(paciente.fechaNacimiento), col1X, datosY + 84);

    // Columna 2
    this.escribirCampoPortada(doc, 'Sexo:', paciente.genero || 'N/A', col2X, datosY);
    this.escribirCampoPortada(doc, 'Estado Civil:', paciente.estadoCivil || 'N/A', col2X, datosY + 28);
    this.escribirCampoPortada(doc, 'Tipo Sangre:', paciente.tipoSangre || 'N/A', col2X, datosY + 56);
    this.escribirCampoPortada(doc, 'Edad:', this.calcularEdad(paciente.fechaNacimiento), col2X, datosY + 84);

    // EPS
    this.escribirCampoPortada(doc, 'EPS / Aseguradora:', paciente.eps || 'N/A', col1X, datosY + 120);
    this.escribirCampoPortada(doc, 'Régimen:', paciente.regimen || 'N/A', col2X, datosY + 120);

    // === INFORMACIÓN DE GENERACIÓN ===
    doc.fontSize(10)
       .fillColor(this.colors.textLight)
       .font('Helvetica')
       .text(`Documento generado el: ${this.formatearFechaHoraCompleta(fechaGeneracion)}`,
              centerX, 530, { width: pageWidth, align: 'center' });

    doc.text(`ID Historia Clínica: ${paciente.id}`, { width: pageWidth, align: 'center' });

    // === CLASIFICACIÓN Y ADVERTENCIAS ===
    doc.rect(this.margins.left, 580, pageWidth, 60)
       .fill(this.colors.dangerBg);

    doc.fillColor(this.colors.danger)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('DOCUMENTO CONFIDENCIAL', centerX, 590, { width: pageWidth, align: 'center' });

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.colors.text)
       .text(
         'Este documento contiene información médica confidencial protegida por la Ley 1581 de 2012 ' +
         '(Protección de Datos Personales) y la Ley 23 de 1981 (Ética Médica). Su divulgación, ' +
         'reproducción o uso no autorizado está prohibido y puede constituir delito.',
         centerX + 20, 608, { width: pageWidth - 40, align: 'center' }
       );

    // === MARCO NORMATIVO ===
    doc.fontSize(7)
       .fillColor(this.colors.textMuted)
       .text(
         'Documento generado conforme a: Resolución 1995/1999, Resolución 839/2017, ' +
         'Resolución 3100/2019, Resolución 866/2021 y Ley 2015/2020',
         centerX, 660, { width: pageWidth, align: 'center' }
       );
  }

  escribirCampoPortada(doc, etiqueta, valor, x, y) {
    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor(this.colors.textLight)
       .text(etiqueta, x, y);
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(this.colors.text)
       .text(valor || 'N/A', x, y + 12);
  }

  /**
   * Generar índice de contenido
   */
  generarIndice(doc, datos) {
    this.generarEncabezadoSeccion(doc, 'ÍNDICE DE CONTENIDO');

    let y = 140;
    let indiceNum = 1;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    const secciones = [
      { nombre: 'Identificación del Paciente', tiene: true, obligatorio: true },
      { nombre: 'Antecedentes Clínicos', tiene: true, obligatorio: true },
      { nombre: 'Alertas Médicas y Alergias', tiene: datos.alertas.length > 0, obligatorio: false },
      { nombre: 'Diagnósticos (CIE-10/CIE-11)', tiene: datos.diagnosticos.length > 0, obligatorio: false },
      { nombre: 'Evoluciones Médicas (Notas SOAP)', tiene: datos.evoluciones.length > 0, obligatorio: false },
      { nombre: 'Signos Vitales', tiene: datos.signosVitales.length > 0, obligatorio: false },
      { nombre: 'Órdenes Médicas', tiene: datos.ordenesMedicas.length > 0, obligatorio: false },
      { nombre: 'Prescripciones y Medicamentos', tiene: datos.prescripciones.length > 0, obligatorio: false },
      { nombre: 'Procedimientos Realizados', tiene: datos.procedimientos.length > 0, obligatorio: false },
      { nombre: 'Procedimientos Quirúrgicos', tiene: datos.cirugias?.length > 0, obligatorio: false },
      { nombre: 'Interconsultas', tiene: datos.interconsultas.length > 0, obligatorio: false },
      { nombre: 'Notas de Enfermería', tiene: datos.notasEnfermeria.length > 0, obligatorio: false },
      { nombre: 'Resultados de Laboratorio', tiene: datos.laboratorios.length > 0, obligatorio: false },
      { nombre: 'Estudios de Imagenología', tiene: datos.imagenologia.length > 0, obligatorio: false },
      { nombre: 'Atenciones de Urgencias', tiene: datos.urgencias.length > 0, obligatorio: false },
      { nombre: 'Hospitalizaciones y Epicrisis', tiene: datos.hospitalizaciones.length > 0, obligatorio: false },
      { nombre: 'Resumen Estadístico', tiene: true, obligatorio: true },
      { nombre: 'Constancia de Autenticidad', tiene: true, obligatorio: true },
    ];

    doc.fontSize(10).font('Helvetica');

    for (const seccion of secciones) {
      if (seccion.tiene) {
        const indicador = seccion.obligatorio ? '●' : '○';
        doc.fillColor(seccion.obligatorio ? this.colors.primary : this.colors.textLight)
           .text(indicador, this.margins.left + 10, y);

        doc.fillColor(this.colors.text)
           .text(`${indiceNum}. ${seccion.nombre}`, this.margins.left + 30, y);

        y += 22;
        indiceNum++;
      }
    }

    // Leyenda
    y += 20;
    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .text('● Sección obligatoria según Res. 1995/1999    ○ Sección condicional', this.margins.left + 10, y);

    // Resumen estadístico
    y += 40;
    doc.rect(this.margins.left, y, pageWidth, 140)
       .fill(this.colors.headerBg);

    y += 15;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text('RESUMEN ESTADÍSTICO DE LA HISTORIA CLÍNICA', this.margins.left + 20, y);

    y += 25;
    doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

    const col1X = this.margins.left + 30;
    const col2X = this.margins.left + pageWidth / 2;

    const estadisticas = [
      [`Evoluciones registradas: ${datos.evoluciones.length}`, `Signos vitales: ${datos.signosVitales.length}`],
      [`Diagnósticos documentados: ${datos.diagnosticos.length}`, `Alertas activas: ${datos.alertas.filter(a => a.activa).length}`],
      [`Prescripciones emitidas: ${datos.prescripciones.length}`, `Procedimientos: ${datos.procedimientos.length}`],
      [`Cirugías: ${datos.cirugias?.length || 0}`, `Interconsultas: ${datos.interconsultas.length}`],
      [`Atenciones de urgencia: ${datos.urgencias.length}`, `Hospitalizaciones: ${datos.hospitalizaciones.length}`],
    ];

    for (const [stat1, stat2] of estadisticas) {
      doc.text(`• ${stat1}`, col1X, y);
      doc.text(`• ${stat2}`, col2X, y);
      y += 18;
    }
  }

  /**
   * Generar sección de identificación completa del paciente
   * (Art. 10 Res. 1995/1999)
   */
  generarIdentificacionPaciente(doc, paciente) {
    this.generarEncabezadoSeccion(doc, 'IDENTIFICACIÓN DEL PACIENTE');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Nota normativa
    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .font('Helvetica-Oblique')
       .text('Conforme al Artículo 10 de la Resolución 1995 de 1999 - Contenido mínimo obligatorio',
              this.margins.left, y, { width: pageWidth });
    y += 20;

    // === DATOS DE IDENTIFICACIÓN ===
    y = this.generarSubseccion(doc, 'DATOS DE IDENTIFICACIÓN', y);

    const datosIdentificacion = [
      ['Tipo de Documento', paciente.tipoDocumento || 'Cédula de Ciudadanía'],
      ['Número de Documento', paciente.cedula || 'N/A'],
      ['Primer Nombre', paciente.nombre || 'N/A'],
      ['Primer Apellido', paciente.apellido || 'N/A'],
      ['Fecha de Nacimiento', this.formatearFecha(paciente.fechaNacimiento)],
      ['Edad Actual', this.calcularEdad(paciente.fechaNacimiento)],
      ['Sexo Biológico', paciente.genero || 'N/A'],
      ['Estado Civil', paciente.estadoCivil || 'N/A'],
      ['Ocupación', paciente.ocupacion || 'N/A'],
      ['Nivel Educativo', paciente.nivelEducacion || 'N/A'],
    ];

    y = this.generarTablaDatos(doc, datosIdentificacion, y);
    y += 15;

    // === DATOS DE UBICACIÓN Y CONTACTO ===
    y = this.generarSubseccion(doc, 'UBICACIÓN Y CONTACTO', y);

    const datosContacto = [
      ['País de Nacimiento', paciente.paisNacimiento || 'Colombia'],
      ['Departamento', paciente.departamento || 'N/A'],
      ['Municipio/Ciudad', paciente.municipio || 'N/A'],
      ['Barrio', paciente.barrio || 'N/A'],
      ['Dirección de Residencia', paciente.direccion || 'N/A'],
      ['Teléfono de Contacto', paciente.telefono || 'N/A'],
      ['Correo Electrónico', paciente.email || 'N/A'],
    ];

    y = this.generarTablaDatos(doc, datosContacto, y);
    y += 15;

    // === ASEGURAMIENTO EN SALUD ===
    y = this.generarSubseccion(doc, 'ASEGURAMIENTO EN SALUD (SGSSS)', y);

    const datosAseguramiento = [
      ['EPS / EAPB', paciente.eps || 'N/A'],
      ['Régimen de Afiliación', paciente.regimen || 'N/A'],
      ['Tipo de Afiliación', paciente.tipoAfiliacion || 'N/A'],
      ['Nivel SISBEN', paciente.nivelSisben || 'N/A'],
      ['Número Autorización', paciente.numeroAutorizacion || 'N/A'],
      ['ARL', paciente.arl || 'N/A'],
    ];

    y = this.generarTablaDatos(doc, datosAseguramiento, y);
    y += 15;

    // === CONTACTO DE EMERGENCIA ===
    const contactos = paciente.contactosEmergencia;
    if (contactos && Array.isArray(contactos) && contactos.length > 0) {
      y = this.generarSubseccion(doc, 'CONTACTO DE EMERGENCIA', y);

      for (let i = 0; i < Math.min(contactos.length, 2); i++) {
        const contacto = contactos[i];
        const datosEmergencia = [
          ['Nombre Completo', contacto.nombre || 'N/A'],
          ['Parentesco', contacto.parentesco || 'N/A'],
          ['Teléfono', contacto.telefono || 'N/A'],
        ];
        y = this.generarTablaDatos(doc, datosEmergencia, y);
        y += 10;
      }
    }
  }

  /**
   * Generar sección de antecedentes clínicos
   * (Art. 10 Res. 1995/1999 - Registros específicos)
   */
  generarAntecedentesClinico(doc, datos) {
    this.generarEncabezadoSeccion(doc, 'ANTECEDENTES CLÍNICOS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const paciente = datos.paciente;

    // Nota normativa
    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .font('Helvetica-Oblique')
       .text('Art. 10 Res. 1995/1999 - Los antecedentes son de registro obligatorio en la historia clínica',
              this.margins.left, y, { width: pageWidth });
    y += 25;

    // === DATOS BIOMÉTRICOS ===
    y = this.generarSubseccion(doc, 'DATOS BIOMÉTRICOS', y);

    const datosBiometricos = [
      ['Grupo Sanguíneo y RH', paciente.tipoSangre || 'No registrado'],
      ['Peso (kg)', paciente.peso ? `${paciente.peso} kg` : 'No registrado'],
      ['Talla (cm)', paciente.altura ? `${paciente.altura} cm` : 'No registrado'],
      ['IMC', paciente.peso && paciente.altura ?
        `${(paciente.peso / Math.pow(paciente.altura / 100, 2)).toFixed(1)} kg/m²` : 'No calculable'],
    ];

    y = this.generarTablaDatos(doc, datosBiometricos, y);
    y += 15;

    // === ANTECEDENTES PATOLÓGICOS ===
    y = this.generarSubseccion(doc, 'ANTECEDENTES PATOLÓGICOS', y);

    doc.fontSize(10).font('Helvetica').fillColor(this.colors.text);

    // Alergias
    doc.font('Helvetica-Bold').text('Alergias:', this.margins.left + 10, y);
    y += 15;
    const alergias = paciente.alergias || 'No se reportan alergias conocidas';
    doc.font('Helvetica').text(alergias, this.margins.left + 20, y, { width: pageWidth - 40 });
    y += doc.heightOfString(alergias, { width: pageWidth - 40 }) + 15;

    // Enfermedades Crónicas
    doc.font('Helvetica-Bold').text('Enfermedades Crónicas:', this.margins.left + 10, y);
    y += 15;
    const cronicas = paciente.enfermedadesCronicas || 'No se reportan enfermedades crónicas';
    doc.font('Helvetica').text(cronicas, this.margins.left + 20, y, { width: pageWidth - 40 });
    y += doc.heightOfString(cronicas, { width: pageWidth - 40 }) + 15;

    // Antecedentes Quirúrgicos
    doc.font('Helvetica-Bold').text('Antecedentes Quirúrgicos:', this.margins.left + 10, y);
    y += 15;
    const quirurgicos = paciente.antecedentesQuirurgicos || 'No se reportan antecedentes quirúrgicos';
    doc.font('Helvetica').text(quirurgicos, this.margins.left + 20, y, { width: pageWidth - 40 });
    y += doc.heightOfString(quirurgicos, { width: pageWidth - 40 }) + 15;

    // === MEDICAMENTOS ACTUALES ===
    y = this.generarSubseccion(doc, 'MEDICAMENTOS DE USO ACTUAL', y);

    const medicamentos = paciente.medicamentosActuales || 'No se reportan medicamentos de uso actual';
    doc.font('Helvetica').text(medicamentos, this.margins.left + 10, y, { width: pageWidth - 20 });
    y += doc.heightOfString(medicamentos, { width: pageWidth - 20 }) + 20;

    // === ALERTAS ACTIVAS ===
    const alertasActivas = datos.alertas.filter(a => a.activa);
    if (alertasActivas.length > 0) {
      y = this.generarSubseccion(doc, '⚠ ALERTAS CLÍNICAS ACTIVAS', y);

      doc.rect(this.margins.left, y, pageWidth, 20 + alertasActivas.length * 18)
         .fill(this.colors.dangerBg);

      y += 10;
      for (const alerta of alertasActivas) {
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(this.colors.danger)
           .text(`• ${alerta.tipo}: ${alerta.titulo}`, this.margins.left + 10, y);
        y += 18;
      }
    }
  }

  /**
   * Generar sección de alertas médicas
   */
  generarSeccionAlertas(doc, alertas) {
    this.generarEncabezadoSeccion(doc, 'ALERTAS MÉDICAS Y ALERGIAS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(9)
       .fillColor(this.colors.danger)
       .font('Helvetica-Bold')
       .text('⚠ INFORMACIÓN CRÍTICA PARA LA SEGURIDAD DEL PACIENTE', this.margins.left, y);
    y += 25;

    for (const alerta of alertas) {
      if (y > doc.page.height - 150) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'ALERTAS MÉDICAS (Continuación)');
        y = 140;
      }

      const esActiva = alerta.activa;
      const colorFondo = alerta.tipo === 'Alergia' ? this.colors.dangerBg :
                         alerta.tipo === 'Contraindicacion' ? this.colors.warningBg : this.colors.successBg;
      const colorBorde = alerta.tipo === 'Alergia' ? this.colors.danger :
                         alerta.tipo === 'Contraindicacion' ? this.colors.warning : this.colors.accent;

      doc.rect(this.margins.left, y, pageWidth, 70)
         .fillAndStroke(colorFondo, colorBorde);

      y += 10;

      // Estado
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(esActiva ? this.colors.danger : this.colors.textMuted)
         .text(esActiva ? '● ACTIVA' : '○ INACTIVA', this.margins.left + pageWidth - 80, y);

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(colorBorde)
         .text(`${alerta.tipo?.toUpperCase() || 'ALERTA'}: ${alerta.titulo || 'Sin título'}`,
                this.margins.left + 10, y);

      y += 18;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(this.colors.text)
         .text(`Descripción: ${alerta.descripcion || 'N/A'}`, this.margins.left + 10, y, {
           width: pageWidth - 20,
         });

      y += 25;

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Registrado: ${this.formatearFechaHora(alerta.fechaAlerta)} | ` +
                `Por: ${alerta.reconocedor?.nombre || 'N/A'} ${alerta.reconocedor?.apellido || ''}`,
                this.margins.left + 10, y);

      y += 30;
    }
  }

  /**
   * Generar sección de diagnósticos
   */
  generarSeccionDiagnosticos(doc, diagnosticos) {
    this.generarEncabezadoSeccion(doc, 'DIAGNÓSTICOS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .font('Helvetica-Oblique')
       .text('Codificación según CIE-10 / CIE-11 - Clasificación Internacional de Enfermedades',
              this.margins.left, y);
    y += 20;

    // Tabla de diagnósticos
    const headers = ['Fecha', 'Código', 'Diagnóstico', 'Tipo', 'Estado'];
    const colWidths = [70, 70, 200, 80, 70];

    y = this.generarEncabezadoTabla(doc, headers, colWidths, y);

    for (const diag of diagnosticos) {
      if (y > doc.page.height - 100) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'DIAGNÓSTICOS (Continuación)');
        y = 140;
        y = this.generarEncabezadoTabla(doc, headers, colWidths, y);
      }

      const rowData = [
        this.formatearFechaCorta(diag.fechaDiagnostico),
        diag.codigoCIE11 || diag.codigoCIE10 || '-',
        (diag.descripcionCIE11 || diag.descripcion || 'N/A').substring(0, 45),
        diag.tipoDiagnostico || 'Principal',
        diag.estadoDiagnostico || 'Activo',
      ];

      y = this.generarFilaTabla(doc, rowData, colWidths, y);
    }

    // Detalle expandido
    y += 30;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text('DETALLE DE DIAGNÓSTICOS', this.margins.left, y);
    y += 20;

    for (const diag of diagnosticos.slice(0, 10)) {
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = this.margins.top;
      }

      doc.rect(this.margins.left, y, pageWidth, 80)
         .stroke(this.colors.border);

      y += 10;

      // Código y descripción
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(this.colors.primary)
         .text(`[${diag.codigoCIE11 || 'S/C'}] ${diag.descripcionCIE11 || 'Sin descripción'}`,
                this.margins.left + 10, y, { width: pageWidth - 20 });

      y += 20;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(this.colors.text);

      doc.text(`Tipo: ${diag.tipoDiagnostico || 'Principal'} | ` +
               `Estado: ${diag.estadoDiagnostico || 'Activo'} | ` +
               `Fecha: ${this.formatearFecha(diag.fechaDiagnostico)}`,
               this.margins.left + 10, y);

      y += 15;

      if (diag.observaciones) {
        doc.text(`Observaciones: ${diag.observaciones}`, this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 15;
      }

      const nombreMedico = diag.doctor ? `Dr(a). ${diag.doctor.nombre} ${diag.doctor.apellido}` : 'N/A';
      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Diagnosticado por: ${nombreMedico}`, this.margins.left + 10, y);

      y += 30;
    }
  }

  /**
   * Generar sección de evoluciones médicas (SOAP)
   */
  generarSeccionEvoluciones(doc, evoluciones) {
    this.generarEncabezadoSeccion(doc, 'EVOLUCIONES MÉDICAS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .font('Helvetica-Oblique')
       .text('Formato SOAP (Subjetivo - Objetivo - Análisis - Plan) según estándares de documentación clínica',
              this.margins.left, y);
    y += 25;

    for (let i = 0; i < evoluciones.length; i++) {
      const evol = evoluciones[i];

      if (y > doc.page.height - 280) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'EVOLUCIONES MÉDICAS (Continuación)');
        y = 140;
      }

      // Encabezado de evolución
      doc.rect(this.margins.left, y, pageWidth, 28)
         .fill(this.colors.primary);

      const nombreMedico = evol.doctor ? `Dr(a). ${evol.doctor.nombre} ${evol.doctor.apellido}` : 'N/A';

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`EVOLUCIÓN #${evoluciones.length - i}`, this.margins.left + 10, y + 8);

      doc.fontSize(9)
         .font('Helvetica')
         .text(`${this.formatearFechaHora(evol.fechaEvolucion)} | ${nombreMedico}`,
                this.margins.left + pageWidth - 280, y + 9);

      y += 35;

      // Secciones SOAP
      const secciones = [
        { titulo: 'S - SUBJETIVO', contenido: evol.subjetivo, color: '#3182ce' },
        { titulo: 'O - OBJETIVO', contenido: evol.objetivo, color: '#38a169' },
        { titulo: 'A - ANÁLISIS', contenido: evol.analisis, color: '#dd6b20' },
        { titulo: 'P - PLAN', contenido: evol.plan, color: '#805ad5' },
      ];

      for (const seccion of secciones) {
        if (seccion.contenido) {
          if (y > doc.page.height - 80) {
            doc.addPage();
            y = this.margins.top;
          }

          doc.rect(this.margins.left, y, 4, 35).fill(seccion.color);

          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor(seccion.color)
             .text(seccion.titulo, this.margins.left + 12, y + 2);

          doc.fontSize(9)
             .font('Helvetica')
             .fillColor(this.colors.text)
             .text(seccion.contenido, this.margins.left + 12, y + 14, {
               width: pageWidth - 22,
               align: 'justify',
             });

          const textHeight = doc.heightOfString(seccion.contenido, { width: pageWidth - 22 });
          y += Math.max(40, textHeight + 20);
        }
      }

      // Línea separadora
      doc.moveTo(this.margins.left, y)
         .lineTo(this.margins.left + pageWidth, y)
         .stroke(this.colors.border);
      y += 20;
    }
  }

  /**
   * Generar sección de signos vitales
   */
  generarSeccionSignosVitales(doc, signosVitales) {
    this.generarEncabezadoSeccion(doc, 'REGISTROS DE SIGNOS VITALES');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Tabla resumen
    const headers = ['Fecha/Hora', 'PA (mmHg)', 'FC (lpm)', 'FR (rpm)', 'T° (°C)', 'SpO2 (%)', 'Glasgow'];
    const colWidths = [100, 70, 60, 60, 60, 60, 60];

    y = this.generarEncabezadoTabla(doc, headers, colWidths, y);

    for (const sv of signosVitales.slice(0, 20)) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'SIGNOS VITALES (Continuación)');
        y = 140;
        y = this.generarEncabezadoTabla(doc, headers, colWidths, y);
      }

      const pa = sv.presionSistolica && sv.presionDiastolica
        ? `${sv.presionSistolica}/${sv.presionDiastolica}` : '-';

      const rowData = [
        this.formatearFechaHoraCorta(sv.fechaRegistro),
        pa,
        sv.frecuenciaCardiaca || '-',
        sv.frecuenciaRespiratoria || '-',
        sv.temperatura || '-',
        sv.saturacionOxigeno || '-',
        sv.escalaGlasgow ? `${sv.escalaGlasgow}/15` : '-',
      ];

      y = this.generarFilaTabla(doc, rowData, colWidths, y);
    }

    // Último registro detallado
    if (signosVitales.length > 0) {
      const ultimo = signosVitales[0];
      y += 30;

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(this.colors.primary)
         .text('ÚLTIMO REGISTRO DETALLADO', this.margins.left, y);

      y += 20;

      doc.rect(this.margins.left, y, pageWidth, 100)
         .fill(this.colors.headerBg);

      y += 15;

      const col1 = this.margins.left + 20;
      const col2 = this.margins.left + pageWidth / 3;
      const col3 = this.margins.left + (pageWidth * 2) / 3;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      doc.text(`Presión Arterial: ${ultimo.presionSistolica || '-'}/${ultimo.presionDiastolica || '-'} mmHg`, col1, y);
      doc.text(`Frecuencia Cardíaca: ${ultimo.frecuenciaCardiaca || '-'} lpm`, col2, y);
      doc.text(`Frecuencia Respiratoria: ${ultimo.frecuenciaRespiratoria || '-'} rpm`, col3, y);

      y += 18;
      doc.text(`Temperatura: ${ultimo.temperatura || '-'} °C`, col1, y);
      doc.text(`Saturación O2: ${ultimo.saturacionOxigeno || '-'}%`, col2, y);
      doc.text(`Escala Glasgow: ${ultimo.escalaGlasgow || '-'}/15`, col3, y);

      y += 18;
      doc.text(`Peso: ${ultimo.peso || '-'} kg`, col1, y);
      doc.text(`Talla: ${ultimo.talla || '-'} cm`, col2, y);

      if (ultimo.peso && ultimo.talla) {
        const imc = (ultimo.peso / Math.pow(ultimo.talla / 100, 2)).toFixed(1);
        doc.text(`IMC: ${imc} kg/m²`, col3, y);
      }

      y += 18;
      doc.text(`Escala de Dolor: ${ultimo.escalaDolor || '-'}/10`, col1, y);

      y += 25;
      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Registrado: ${this.formatearFechaHora(ultimo.fechaRegistro)} | ` +
                `Por: ${ultimo.registrador?.nombre || 'N/A'} ${ultimo.registrador?.apellido || ''}`,
                col1, y);
    }
  }

  /**
   * Generar sección de órdenes médicas
   */
  generarSeccionOrdenesMedicas(doc, ordenes) {
    this.generarEncabezadoSeccion(doc, 'ÓRDENES MÉDICAS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const orden of ordenes) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'ÓRDENES MÉDICAS (Continuación)');
        y = 140;
      }

      const colorEstado = orden.estado === 'Completada' ? this.colors.accent :
                          orden.estado === 'Pendiente' ? this.colors.warning : this.colors.textLight;

      doc.rect(this.margins.left, y, pageWidth, 70)
         .stroke(this.colors.border);

      y += 10;

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(this.colors.text)
         .text(`Orden: ${orden.tipo || 'General'}`, this.margins.left + 10, y);

      doc.fillColor(colorEstado)
         .text(orden.estado || 'Pendiente', this.margins.left + pageWidth - 100, y);

      y += 18;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(this.colors.text)
         .text(orden.descripcion || orden.contenido || 'Sin descripción', this.margins.left + 10, y, {
           width: pageWidth - 20,
         });

      y += 25;

      const nombreMedico = orden.doctor ? `Dr(a). ${orden.doctor.nombre} ${orden.doctor.apellido}` : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Fecha: ${this.formatearFechaHora(orden.fechaOrden)} | Ordenado por: ${nombreMedico}`,
                this.margins.left + 10, y);

      y += 30;
    }
  }

  /**
   * Generar sección de prescripciones
   */
  generarSeccionPrescripciones(doc, prescripciones) {
    this.generarEncabezadoSeccion(doc, 'PRESCRIPCIONES Y MEDICAMENTOS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const presc of prescripciones) {
      if (y > doc.page.height - 150) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'PRESCRIPCIONES (Continuación)');
        y = 140;
      }

      doc.rect(this.margins.left, y, pageWidth, 110)
         .stroke(this.colors.border);

      // Encabezado verde
      doc.rect(this.margins.left, y, pageWidth, 25)
         .fill(this.colors.accent);

      const medicamentoNombre = presc.medicamentos?.[0]?.producto?.nombre || presc.diagnostico || 'Prescripción';
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`Rx: ${medicamentoNombre}`, this.margins.left + 10, y + 7);
      doc.text(this.formatearFechaCorta(presc.fechaPrescripcion), this.margins.left + pageWidth - 100, y + 7);

      y += 32;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      const col1 = this.margins.left + 10;
      const col2 = this.margins.left + pageWidth / 2;

      doc.font('Helvetica-Bold').text('Dosis:', col1, y);
      doc.font('Helvetica').text(presc.dosis || 'N/A', col1 + 45, y);

      doc.font('Helvetica-Bold').text('Frecuencia:', col2, y);
      doc.font('Helvetica').text(presc.frecuencia || 'N/A', col2 + 70, y);

      y += 15;

      doc.font('Helvetica-Bold').text('Vía:', col1, y);
      doc.font('Helvetica').text(presc.via || 'Oral', col1 + 45, y);

      doc.font('Helvetica-Bold').text('Duración:', col2, y);
      doc.font('Helvetica').text(presc.duracion || 'Según indicación', col2 + 70, y);

      y += 15;

      if (presc.indicaciones) {
        doc.font('Helvetica-Bold').text('Indicaciones:', col1, y);
        doc.font('Helvetica').text(presc.indicaciones, col1, y + 12, { width: pageWidth - 20 });
        y += 25;
      }

      const nombreMedico = presc.medico ? `Dr(a). ${presc.medico.nombre} ${presc.medico.apellido}` : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Prescrito por: ${nombreMedico}`, col1, y + 10);

      y += 40;
    }
  }

  /**
   * Generar sección de procedimientos
   */
  generarSeccionProcedimientos(doc, procedimientos) {
    this.generarEncabezadoSeccion(doc, 'PROCEDIMIENTOS REALIZADOS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .font('Helvetica-Oblique')
       .text('Codificación según CUPS - Clasificación Única de Procedimientos en Salud',
              this.margins.left, y);
    y += 20;

    for (const proc of procedimientos) {
      if (y > doc.page.height - 160) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'PROCEDIMIENTOS (Continuación)');
        y = 140;
      }

      doc.rect(this.margins.left, y, pageWidth, 120)
         .stroke(this.colors.border);

      // Encabezado
      doc.rect(this.margins.left, y, pageWidth, 28)
         .fill(this.colors.secondary);

      const nombreProc = proc.examenProcedimiento?.nombre || proc.nombre || 'Procedimiento';
      const codigoCups = proc.examenProcedimiento?.codigoCups || proc.codigoCups || '';

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`${codigoCups ? `[${codigoCups}] ` : ''}${nombreProc}`, this.margins.left + 10, y + 8);

      y += 35;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      doc.font('Helvetica-Bold').text('Fecha:', this.margins.left + 10, y);
      doc.font('Helvetica').text(this.formatearFechaHora(proc.fechaRealizada || proc.fechaProgramada),
                                  this.margins.left + 55, y);

      doc.font('Helvetica-Bold').text('Estado:', this.margins.left + 250, y);
      doc.font('Helvetica').text(proc.estado || 'Realizado', this.margins.left + 300, y);

      y += 18;

      if (proc.descripcion) {
        doc.font('Helvetica-Bold').text('Descripción:', this.margins.left + 10, y);
        doc.font('Helvetica').text(proc.descripcion, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      if (proc.hallazgos) {
        doc.font('Helvetica-Bold').text('Hallazgos:', this.margins.left + 10, y);
        doc.font('Helvetica').text(proc.hallazgos, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      const nombreMedico = proc.medicoResponsable
        ? `Dr(a). ${proc.medicoResponsable.nombre} ${proc.medicoResponsable.apellido}`
        : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Realizado por: ${nombreMedico}`, this.margins.left + 10, y);

      y += 35;
    }
  }

  /**
   * Generar sección de cirugías (procedimientos quirúrgicos)
   */
  generarSeccionCirugias(doc, cirugias) {
    this.generarEncabezadoSeccion(doc, 'PROCEDIMIENTOS QUIRÚRGICOS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .font('Helvetica-Oblique')
       .text('Registro de intervenciones quirúrgicas - Codificación CUPS',
              this.margins.left, y);
    y += 20;

    for (const cirugia of cirugias) {
      // Verificar espacio disponible
      if (y > doc.page.height - 280) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'PROCEDIMIENTOS QUIRÚRGICOS (Continuación)');
        y = 140;
      }

      // Calcular altura dinámica del card
      let cardHeight = 180;
      if (cirugia.tecnicaUtilizada) cardHeight += 40;
      if (cirugia.hallazgos) cardHeight += 40;
      if (cirugia.complicaciones) cardHeight += 40;
      if (cirugia.resultados) cardHeight += 30;

      // Borde del card
      doc.rect(this.margins.left, y, pageWidth, cardHeight)
         .stroke(this.colors.border);

      // Header con color según estado
      const headerColor = cirugia.estado === 'Completado' ? this.colors.accent :
                          cirugia.estado === 'Cancelado' ? this.colors.danger :
                          this.colors.secondary;

      doc.rect(this.margins.left, y, pageWidth, 35)
         .fill(headerColor);

      // Nombre de la cirugía
      const codigoCups = cirugia.codigoCUPS ? `[${cirugia.codigoCUPS}] ` : '';
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`${codigoCups}${cirugia.nombre || 'Procedimiento Quirúrgico'}`,
                this.margins.left + 10, y + 6, { width: pageWidth - 120 });

      // Badges de estado y prioridad
      doc.fontSize(8)
         .text(`${cirugia.estado || 'N/A'} | ${cirugia.prioridad || 'Electivo'}`,
                this.margins.left + pageWidth - 100, y + 12);

      y += 42;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      // Fila 1: Fecha, Quirófano, Duración
      doc.font('Helvetica-Bold').text('Fecha:', this.margins.left + 10, y);
      doc.font('Helvetica').text(this.formatearFechaHora(cirugia.fechaProgramada || cirugia.fechaRealizada),
                                  this.margins.left + 55, y);

      doc.font('Helvetica-Bold').text('Quirófano:', this.margins.left + 200, y);
      doc.font('Helvetica').text(cirugia.quirofano?.nombre || 'N/A', this.margins.left + 260, y);

      doc.font('Helvetica-Bold').text('Duración:', this.margins.left + 400, y);
      const duracion = cirugia.duracionReal || cirugia.duracionEstimada;
      doc.font('Helvetica').text(duracion ? `${duracion} min` : 'N/A', this.margins.left + 455, y);

      y += 18;

      // Fila 2: Diagnóstico con código CIE-10
      if (cirugia.indicacion || cirugia.codigoCIE10) {
        doc.font('Helvetica-Bold').text('Diagnóstico:', this.margins.left + 10, y);
        const diagnostico = cirugia.codigoCIE10 ? `[${cirugia.codigoCIE10}] ${cirugia.indicacion || ''}` : cirugia.indicacion;
        doc.font('Helvetica').text(diagnostico, this.margins.left + 80, y, { width: pageWidth - 90 });
        y += 18;
      }

      // Fila 3: Equipo Quirúrgico
      const cirujano = cirugia.medicoResponsable
        ? `Dr(a). ${cirugia.medicoResponsable.nombre} ${cirugia.medicoResponsable.apellido}`
        : 'N/A';
      const anestesiologo = cirugia.anestesiologo
        ? `Dr(a). ${cirugia.anestesiologo.nombre} ${cirugia.anestesiologo.apellido}`
        : 'N/A';

      doc.font('Helvetica-Bold').text('Cirujano:', this.margins.left + 10, y);
      doc.font('Helvetica').text(cirujano, this.margins.left + 65, y);

      doc.font('Helvetica-Bold').text('Anestesiólogo:', this.margins.left + 280, y);
      doc.font('Helvetica').text(anestesiologo, this.margins.left + 365, y);

      y += 18;

      // Fila 4: Tipo de anestesia y ASA
      doc.font('Helvetica-Bold').text('Anestesia:', this.margins.left + 10, y);
      doc.font('Helvetica').text(cirugia.tipoAnestesia || 'N/A', this.margins.left + 70, y);

      if (cirugia.clasificacionASA) {
        doc.font('Helvetica-Bold').text('Clasificación ASA:', this.margins.left + 200, y);
        doc.font('Helvetica').text(cirugia.clasificacionASA, this.margins.left + 305, y);
      }

      if (cirugia.tipoCirugia) {
        doc.font('Helvetica-Bold').text('Tipo:', this.margins.left + 380, y);
        doc.font('Helvetica').text(cirugia.tipoCirugia, this.margins.left + 415, y);
      }

      y += 22;

      // Técnica Quirúrgica (si está completada)
      if (cirugia.tecnicaUtilizada) {
        doc.font('Helvetica-Bold').text('Técnica Quirúrgica:', this.margins.left + 10, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).text(cirugia.tecnicaUtilizada,
          this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 25;
      }

      // Hallazgos
      if (cirugia.hallazgos) {
        doc.fontSize(9).font('Helvetica-Bold').text('Hallazgos Intraoperatorios:', this.margins.left + 10, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).text(cirugia.hallazgos,
          this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 25;
      }

      // Complicaciones (en rojo si existen)
      if (cirugia.complicaciones) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.danger)
           .text('Complicaciones:', this.margins.left + 10, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).text(cirugia.complicaciones,
          this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 25;
        doc.fillColor(this.colors.text);
      }

      // Resultados
      if (cirugia.resultados) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.accent)
           .text('Resultados:', this.margins.left + 10, y);
        y += 12;
        doc.font('Helvetica').fontSize(8).fillColor(this.colors.text)
           .text(cirugia.resultados, this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 20;
      }

      // Firma del médico
      if (cirugia.medicoFirma || cirugia.fechaFirma) {
        doc.fontSize(8).fillColor(this.colors.textMuted);
        const firmante = cirugia.medicoFirma
          ? `Dr(a). ${cirugia.medicoFirma.nombre} ${cirugia.medicoFirma.apellido}`
          : cirujano;
        doc.text(`Firmado por: ${firmante}`, this.margins.left + 10, y);
        if (cirugia.fechaFirma) {
          doc.text(` - ${this.formatearFechaHora(cirugia.fechaFirma)}`, this.margins.left + 200, y);
        }
      }

      y += 30;
    }

    // Resumen de cirugías
    y += 10;
    if (y < doc.page.height - 80) {
      doc.rect(this.margins.left, y, pageWidth, 50)
         .fill(this.colors.headerBg);

      doc.fontSize(10).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text('Resumen de Procedimientos Quirúrgicos', this.margins.left + 10, y + 8);

      const completadas = cirugias.filter(c => c.estado === 'Completado').length;
      const programadas = cirugias.filter(c => c.estado === 'Programado').length;
      const canceladas = cirugias.filter(c => c.estado === 'Cancelado').length;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text)
         .text(`Total: ${cirugias.length} | Completadas: ${completadas} | Programadas: ${programadas} | Canceladas: ${canceladas}`,
                this.margins.left + 10, y + 28);
    }
  }

  /**
   * Generar sección de interconsultas
   */
  generarSeccionInterconsultas(doc, interconsultas) {
    this.generarEncabezadoSeccion(doc, 'INTERCONSULTAS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const ic of interconsultas) {
      if (y > doc.page.height - 160) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'INTERCONSULTAS (Continuación)');
        y = 140;
      }

      const colorEstado = ic.estado === 'Completada' ? this.colors.accent :
                          ic.estado === 'Pendiente' ? this.colors.warning : this.colors.secondary;

      doc.rect(this.margins.left, y, pageWidth, 120)
         .stroke(this.colors.border);

      doc.rect(this.margins.left, y, pageWidth, 28)
         .fill(this.colors.primary);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`Interconsulta: ${ic.especialidadSolicitada?.titulo || 'Especialidad'}`,
                this.margins.left + 10, y + 8);

      doc.fillColor(ic.estado === 'Completada' ? '#90EE90' : '#FFD700')
         .text(ic.estado || 'Pendiente', this.margins.left + pageWidth - 100, y + 8);

      y += 35;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      doc.font('Helvetica-Bold').text('Motivo:', this.margins.left + 10, y);
      doc.font('Helvetica').text(ic.motivo || 'N/A', this.margins.left + 10, y + 12, { width: pageWidth - 20 });

      y += 30;

      const solicitante = ic.medicoSolicitante
        ? `Dr(a). ${ic.medicoSolicitante.nombre} ${ic.medicoSolicitante.apellido}`
        : 'N/A';
      const especialista = ic.medicoEspecialista
        ? `Dr(a). ${ic.medicoEspecialista.nombre} ${ic.medicoEspecialista.apellido}`
        : 'Pendiente';

      doc.font('Helvetica-Bold').text('Solicitada por:', this.margins.left + 10, y);
      doc.font('Helvetica').text(solicitante, this.margins.left + 95, y);

      y += 15;

      doc.font('Helvetica-Bold').text('Atendida por:', this.margins.left + 10, y);
      doc.font('Helvetica').text(especialista, this.margins.left + 95, y);

      y += 20;

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Solicitada: ${this.formatearFechaHora(ic.fechaSolicitud)}` +
                (ic.fechaRespuesta ? ` | Respondida: ${this.formatearFechaHora(ic.fechaRespuesta)}` : ''),
                this.margins.left + 10, y);

      y += 30;
    }
  }

  /**
   * Generar sección de notas de enfermería
   */
  generarSeccionNotasEnfermeria(doc, notas) {
    this.generarEncabezadoSeccion(doc, 'NOTAS DE ENFERMERÍA');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const nota of notas) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'NOTAS DE ENFERMERÍA (Continuación)');
        y = 140;
      }

      doc.rect(this.margins.left, y, pageWidth, 80)
         .stroke(this.colors.border);

      doc.rect(this.margins.left, y, pageWidth, 22)
         .fill('#ec4899');

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`${this.formatearFechaHora(nota.fechaHora)} - ${nota.tipoNota || 'Nota General'}`,
                this.margins.left + 10, y + 6);

      const nombreEnfermera = nota.enfermera
        ? `${nota.enfermera.nombre} ${nota.enfermera.apellido}`
        : 'N/A';
      doc.text(nombreEnfermera, this.margins.left + pageWidth - 180, y + 6);

      y += 28;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(this.colors.text)
         .text(nota.contenido || nota.nota || 'Sin contenido', this.margins.left + 10, y, {
           width: pageWidth - 20,
           align: 'justify',
         });

      y += 65;
    }
  }

  /**
   * Generar sección de laboratorios
   */
  generarSeccionLaboratorios(doc, laboratorios) {
    this.generarEncabezadoSeccion(doc, 'RESULTADOS DE LABORATORIO');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const lab of laboratorios) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'LABORATORIOS (Continuación)');
        y = 140;
      }

      doc.rect(this.margins.left, y, pageWidth, 90)
         .stroke(this.colors.border);

      doc.rect(this.margins.left, y, pageWidth, 25)
         .fill('#0891b2');

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`Orden de Laboratorio - ${this.formatearFechaCorta(lab.fechaOrden)}`,
                this.margins.left + 10, y + 7);

      doc.fillColor(lab.estado === 'Completado' ? '#90EE90' : '#FFD700')
         .text(lab.estado || 'Pendiente', this.margins.left + pageWidth - 100, y + 7);

      y += 32;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      doc.font('Helvetica-Bold').text('Exámenes:', this.margins.left + 10, y);
      doc.font('Helvetica').text(lab.descripcion || lab.examenProcedimiento?.nombre || 'Ver detalle',
               this.margins.left + 70, y);

      y += 18;

      const nombreMedico = lab.doctor
        ? `Dr(a). ${lab.doctor.nombre} ${lab.doctor.apellido}`
        : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Ordenado por: ${nombreMedico}`, this.margins.left + 10, y);

      y += 45;
    }
  }

  /**
   * Generar sección de imagenología
   */
  generarSeccionImagenologia(doc, estudios) {
    this.generarEncabezadoSeccion(doc, 'ESTUDIOS DE IMAGENOLOGÍA');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const estudio of estudios) {
      if (y > doc.page.height - 150) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'IMAGENOLOGÍA (Continuación)');
        y = 140;
      }

      doc.rect(this.margins.left, y, pageWidth, 120)
         .stroke(this.colors.border);

      doc.rect(this.margins.left, y, pageWidth, 25)
         .fill('#7c3aed');

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`${estudio.tipoEstudio || 'Estudio'} - ${this.formatearFechaCorta(estudio.fechaSolicitud)}`,
                this.margins.left + 10, y + 7);

      y += 32;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      doc.font('Helvetica-Bold').text('Zona/Región:', this.margins.left + 10, y);
      doc.font('Helvetica').text(estudio.zonaCuerpo || 'N/A', this.margins.left + 85, y);

      y += 18;

      if (estudio.indicacionClinica) {
        doc.font('Helvetica-Bold').text('Indicación:', this.margins.left + 10, y);
        doc.font('Helvetica').text(estudio.indicacionClinica, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      if (estudio.hallazgos || estudio.conclusion) {
        doc.font('Helvetica-Bold').text('Hallazgos/Conclusión:', this.margins.left + 10, y);
        doc.font('Helvetica').text(estudio.hallazgos || estudio.conclusion || 'Pendiente',
                 this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      const nombreMedico = estudio.medicoSolicitante
        ? `Dr(a). ${estudio.medicoSolicitante.nombre} ${estudio.medicoSolicitante.apellido}`
        : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Solicitado por: ${nombreMedico} | Estado: ${estudio.estado || 'Pendiente'}`,
                this.margins.left + 10, y);

      y += 35;
    }
  }

  /**
   * Generar sección de urgencias
   */
  generarSeccionUrgencias(doc, urgencias) {
    this.generarEncabezadoSeccion(doc, 'ATENCIONES DE URGENCIAS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    const categoriaColores = {
      'Rojo': '#dc2626',
      'Naranja': '#ea580c',
      'Amarillo': '#ca8a04',
      'Verde': '#16a34a',
      'Azul': '#2563eb',
    };

    for (const urg of urgencias) {
      if (y > doc.page.height - 280) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'URGENCIAS (Continuación)');
        y = 140;
      }

      const colorCategoria = categoriaColores[urg.categoriaManchester] || this.colors.secondary;

      doc.rect(this.margins.left, y, pageWidth, 220)
         .stroke(this.colors.border);

      // Encabezado con color de triaje
      doc.rect(this.margins.left, y, pageWidth, 30)
         .fill(colorCategoria);

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`TRIAJE ${urg.categoriaManchester?.toUpperCase() || 'N/A'} - Prioridad ${urg.prioridad || 'N/A'}`,
                this.margins.left + 10, y + 8);
      doc.text(this.formatearFechaHora(urg.horaLlegada), this.margins.left + pageWidth - 180, y + 8);

      y += 38;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      // Motivo de consulta
      doc.font('Helvetica-Bold').text('Motivo de Consulta:', this.margins.left + 10, y);
      doc.font('Helvetica').text(urg.motivoConsulta || 'N/A', this.margins.left + 10, y + 12, { width: pageWidth - 20 });

      y += 35;

      // Signos vitales al ingreso
      doc.font('Helvetica-Bold').fillColor(this.colors.primary).text('Signos Vitales al Ingreso:', this.margins.left + 10, y);

      y += 15;
      doc.font('Helvetica').fillColor(this.colors.text);

      const col1 = this.margins.left + 15;
      const col2 = this.margins.left + 170;
      const col3 = this.margins.left + 340;

      doc.text(`PA: ${urg.presionSistolica || '-'}/${urg.presionDiastolica || '-'} mmHg`, col1, y);
      doc.text(`FC: ${urg.frecuenciaCardiaca || '-'} lpm`, col2, y);
      doc.text(`FR: ${urg.frecuenciaRespiratoria || '-'} rpm`, col3, y);

      y += 15;
      doc.text(`Temp: ${urg.temperatura || '-'} °C`, col1, y);
      doc.text(`SpO2: ${urg.saturacionOxigeno || '-'}%`, col2, y);
      doc.text(`Glasgow: ${urg.escalaGlasgow || '-'}/15`, col3, y);

      y += 20;

      // Diagnóstico
      if (urg.diagnosticoInicial) {
        doc.font('Helvetica-Bold').text('Diagnóstico:', this.margins.left + 10, y);
        doc.font('Helvetica').text(urg.diagnosticoInicial, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      // Tratamiento
      if (urg.tratamientoAplicado) {
        doc.font('Helvetica-Bold').text('Tratamiento:', this.margins.left + 10, y);
        doc.font('Helvetica').text(urg.tratamientoAplicado, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      // Disposición
      doc.font('Helvetica-Bold').text('Disposición:', this.margins.left + 10, y);
      doc.font('Helvetica').text(urg.disposicion || urg.estado || 'N/A', this.margins.left + 75, y);

      y += 20;

      // Personal
      const medico = urg.medicoAsignado ? `Dr(a). ${urg.medicoAsignado.nombre} ${urg.medicoAsignado.apellido}` : 'N/A';
      const enfermera = urg.enfermeraAsignada ? `${urg.enfermeraAsignada.nombre} ${urg.enfermeraAsignada.apellido}` : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Médico: ${medico} | Enfermera: ${enfermera}`, this.margins.left + 10, y);

      y += 35;
    }
  }

  /**
   * Generar sección de hospitalizaciones
   */
  generarSeccionHospitalizaciones(doc, hospitalizaciones) {
    this.generarEncabezadoSeccion(doc, 'HOSPITALIZACIONES Y EPICRISIS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const hosp of hospitalizaciones) {
      if (y > doc.page.height - 300) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'HOSPITALIZACIONES (Continuación)');
        y = 140;
      }

      const colorEstado = hosp.estado === 'Activa' ? this.colors.accent :
                          hosp.estado === 'Egresada' ? this.colors.secondary : this.colors.textLight;

      doc.rect(this.margins.left, y, pageWidth, 240)
         .stroke(this.colors.border);

      // Encabezado
      doc.rect(this.margins.left, y, pageWidth, 30)
         .fill(this.colors.primary);

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`ADMISIÓN - ${hosp.unidad?.nombre || 'Unidad'}`, this.margins.left + 10, y + 8);

      doc.fillColor(hosp.estado === 'Activa' ? '#90EE90' : '#87CEEB')
         .text(hosp.estado || 'N/A', this.margins.left + pageWidth - 100, y + 8);

      y += 38;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      // Ubicación
      doc.font('Helvetica-Bold').fillColor(this.colors.primary).text('Ubicación Hospitalaria:', this.margins.left + 10, y);
      y += 15;
      doc.font('Helvetica').fillColor(this.colors.text);
      doc.text(`Unidad: ${hosp.unidad?.nombre || 'N/A'} | ` +
               `Habitación: ${hosp.cama?.habitacion?.numero || 'N/A'} | ` +
               `Cama: ${hosp.cama?.numero || 'N/A'}`,
               this.margins.left + 10, y);

      y += 20;

      // Período
      const diasEstancia = this.calcularDiasEstancia(hosp.fechaIngreso, hosp.fechaEgreso);
      doc.font('Helvetica-Bold').fillColor(this.colors.primary).text('Período de Hospitalización:', this.margins.left + 10, y);
      y += 15;
      doc.font('Helvetica').fillColor(this.colors.text);
      doc.text(`Ingreso: ${this.formatearFechaHora(hosp.fechaIngreso)} | ` +
               `Egreso: ${hosp.fechaEgreso ? this.formatearFechaHora(hosp.fechaEgreso) : 'Hospitalizado'} | ` +
               `Estancia: ${diasEstancia} días`,
               this.margins.left + 10, y);

      y += 20;

      // Motivo y diagnósticos
      if (hosp.motivoIngreso) {
        doc.font('Helvetica-Bold').text('Motivo de Ingreso:', this.margins.left + 10, y);
        doc.font('Helvetica').text(hosp.motivoIngreso, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      if (hosp.diagnosticoIngreso) {
        doc.font('Helvetica-Bold').text('Diagnóstico de Ingreso:', this.margins.left + 10, y);
        doc.font('Helvetica').text(hosp.diagnosticoIngreso, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      if (hosp.diagnosticoEgreso) {
        doc.font('Helvetica-Bold').text('Diagnóstico de Egreso:', this.margins.left + 10, y);
        doc.font('Helvetica').text(hosp.diagnosticoEgreso, this.margins.left + 10, y + 12, { width: pageWidth - 20 });
        y += 30;
      }

      // Movimientos
      if (hosp.movimientos && hosp.movimientos.length > 0) {
        doc.font('Helvetica-Bold').fillColor(this.colors.primary).text('Movimientos:', this.margins.left + 10, y);
        y += 15;

        for (const mov of hosp.movimientos.slice(0, 3)) {
          doc.fontSize(8)
             .font('Helvetica')
             .fillColor(this.colors.text)
             .text(`• ${this.formatearFechaHoraCorta(mov.fechaMovimiento)} - ${mov.tipo}: ${mov.motivo || 'N/A'}`,
                    this.margins.left + 15, y);
          y += 12;
        }
      }

      y += 30;
    }
  }

  /**
   * Generar resumen estadístico
   */
  generarResumenEstadistico(doc, datos) {
    this.generarEncabezadoSeccion(doc, 'RESUMEN ESTADÍSTICO');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.rect(this.margins.left, y, pageWidth, 280)
       .fill(this.colors.headerBg);

    y += 20;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text('ESTADÍSTICAS DE LA HISTORIA CLÍNICA', this.margins.left + 20, y);

    y += 30;

    const col1X = this.margins.left + 30;
    const col2X = this.margins.left + pageWidth / 2 + 20;

    doc.fontSize(10).font('Helvetica').fillColor(this.colors.text);

    const estadisticas = [
      ['Total de Evoluciones:', datos.evoluciones.length, 'Total de Prescripciones:', datos.prescripciones.length],
      ['Registros de Signos Vitales:', datos.signosVitales.length, 'Procedimientos Realizados:', datos.procedimientos.length],
      ['Diagnósticos Documentados:', datos.diagnosticos.length, 'Interconsultas:', datos.interconsultas.length],
      ['Alertas Activas:', datos.alertas.filter(a => a.activa).length, 'Notas de Enfermería:', datos.notasEnfermeria.length],
      ['Atenciones de Urgencia:', datos.urgencias.length, 'Estudios de Imagenología:', datos.imagenologia.length],
      ['Hospitalizaciones:', datos.hospitalizaciones.length, 'Órdenes de Laboratorio:', datos.laboratorios.length],
    ];

    for (const [label1, value1, label2, value2] of estadisticas) {
      doc.font('Helvetica-Bold').text(label1, col1X, y);
      doc.font('Helvetica').text(String(value1), col1X + 180, y);

      doc.font('Helvetica-Bold').text(label2, col2X, y);
      doc.font('Helvetica').text(String(value2), col2X + 180, y);

      y += 25;
    }

    y += 20;

    // Última actualización
    const ultimaEvolucion = datos.evoluciones[0];
    const ultimoSigno = datos.signosVitales[0];

    doc.fontSize(9)
       .fillColor(this.colors.textMuted)
       .text(`Última evolución: ${ultimaEvolucion ? this.formatearFechaHora(ultimaEvolucion.fechaEvolucion) : 'N/A'}`,
              col1X, y);
    y += 15;
    doc.text(`Últimos signos vitales: ${ultimoSigno ? this.formatearFechaHora(ultimoSigno.fechaRegistro) : 'N/A'}`,
             col1X, y);

    // Total de registros
    y += 40;
    const totalRegistros = datos.evoluciones.length + datos.signosVitales.length + datos.diagnosticos.length +
                          datos.prescripciones.length + datos.procedimientos.length + datos.urgencias.length +
                          datos.hospitalizaciones.length + datos.notasEnfermeria.length;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text(`TOTAL DE REGISTROS CLÍNICOS: ${totalRegistros}`, this.margins.left + 20, y, {
         width: pageWidth - 40,
         align: 'center',
       });
  }

  /**
   * Generar constancia de autenticidad
   */
  generarConstanciaAutenticidad(doc, datos) {
    this.generarEncabezadoSeccion(doc, 'CONSTANCIA DE AUTENTICIDAD');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Marco legal
    doc.rect(this.margins.left, y, pageWidth, 200)
       .stroke(this.colors.primary);

    y += 20;

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.colors.text)
       .text(
         'El presente documento constituye una copia fiel e íntegra de la Historia Clínica Electrónica ' +
         'del paciente identificado, generada desde el Sistema de Historia Clínica Electrónica de ' +
         `${datos.institucion.nombre}.`,
         this.margins.left + 15, y, { width: pageWidth - 30, align: 'justify' }
       );

    y += 50;

    doc.text('Este documento cumple con los requisitos establecidos en la normatividad colombiana vigente:',
             this.margins.left + 15, y, { width: pageWidth - 30 });

    y += 25;

    doc.fontSize(9);
    const normativas = [
      '• Resolución 1995 de 1999 - Normas para el manejo de la Historia Clínica',
      '• Resolución 839 de 2017 - Modificaciones a la Resolución 1995/1999',
      '• Resolución 3100 de 2019 - Habilitación de servicios de salud',
      '• Resolución 866 de 2021 - Interoperabilidad de HCE',
      '• Ley 2015 de 2020 - Historia Clínica Electrónica Interoperable',
      '• Ley 1581 de 2012 - Protección de datos personales',
      '• Ley 23 de 1981 - Ética Médica',
    ];

    for (const norma of normativas) {
      doc.text(norma, this.margins.left + 25, y);
      y += 14;
    }

    y += 30;

    // Datos de generación
    doc.rect(this.margins.left, y, pageWidth, 120)
       .fill(this.colors.background);

    y += 15;

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text('DATOS DE GENERACIÓN DEL DOCUMENTO', this.margins.left + 15, y);

    y += 25;

    doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

    doc.text(`Fecha y hora de generación: ${this.formatearFechaHoraCompleta(datos.fechaGeneracion)}`,
             this.margins.left + 15, y);
    y += 15;

    doc.text(`Paciente: ${datos.paciente.nombre} ${datos.paciente.apellido}`,
             this.margins.left + 15, y);
    y += 15;

    doc.text(`Documento: ${datos.paciente.tipoDocumento || 'CC'} ${datos.paciente.cedula}`,
             this.margins.left + 15, y);
    y += 15;

    doc.text(`ID Historia Clínica: ${datos.paciente.id}`,
             this.margins.left + 15, y);
    y += 15;

    doc.text(`Institución: ${datos.institucion.nombre} - NIT: ${datos.institucion.nit}`,
             this.margins.left + 15, y);

    // Advertencia legal
    y += 50;

    doc.rect(this.margins.left, y, pageWidth, 70)
       .fill(this.colors.dangerBg);

    y += 10;

    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(this.colors.danger)
       .text('ADVERTENCIA LEGAL', this.margins.left + 15, y);

    y += 15;

    doc.font('Helvetica')
       .fillColor(this.colors.text)
       .text(
         'Este documento contiene información confidencial protegida por la Ley 1581 de 2012 (Habeas Data) ' +
         'y la Ley 23 de 1981 (Ética Médica). Su divulgación, reproducción o uso no autorizado está ' +
         'prohibido y puede constituir delito. Solo debe ser utilizado para los fines médicos y legales autorizados.',
         this.margins.left + 15, y, { width: pageWidth - 30, align: 'justify' }
       );

    // Pie de página final
    y += 50;

    doc.fontSize(8)
       .fillColor(this.colors.textMuted)
       .text(
         'Documento generado electrónicamente por el Sistema de Historia Clínica Electrónica. ' +
         'Para verificar su autenticidad, contacte a la institución prestadora de servicios de salud.',
         this.margins.left, y, { width: pageWidth, align: 'center' }
       );
  }

  // ==================== UTILIDADES ====================

  /**
   * Agregar marca de agua a todas las páginas
   */
  agregarMarcaAgua(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Marca de agua diagonal
      doc.save();
      doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.fontSize(60)
         .fillColor('#e2e8f0')
         .opacity(0.15)
         .text('CONFIDENCIAL', 100, doc.page.height / 2 - 50, {
           width: doc.page.width,
           align: 'center',
         });
      doc.restore();
      doc.opacity(1);
    }
  }

  /**
   * Generar encabezado de sección
   */
  generarEncabezadoSeccion(doc, titulo) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.rect(this.margins.left, this.margins.top, pageWidth, 55)
       .fill(this.colors.primary);

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(titulo, this.margins.left, this.margins.top + 18, {
         width: pageWidth,
         align: 'center',
       });

    // Línea decorativa
    doc.moveTo(this.margins.left + 60, this.margins.top + 48)
       .lineTo(this.margins.left + pageWidth - 60, this.margins.top + 48)
       .lineWidth(1)
       .stroke('#ffffff');
  }

  /**
   * Generar subsección
   */
  generarSubseccion(doc, titulo, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.rect(this.margins.left, y, pageWidth, 22)
       .fill(this.colors.headerBg);

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text(titulo, this.margins.left + 10, y + 6);

    return y + 28;
  }

  /**
   * Generar tabla de datos (clave-valor)
   */
  generarTablaDatos(doc, datos, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const colWidth = pageWidth / 2;

    for (let i = 0; i < datos.length; i += 2) {
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(this.colors.textLight)
         .text(datos[i][0], this.margins.left + 10, y);
      doc.font('Helvetica')
         .fillColor(this.colors.text)
         .text(datos[i][1] || 'N/A', this.margins.left + 10, y + 11);

      if (datos[i + 1]) {
        doc.font('Helvetica-Bold')
           .fillColor(this.colors.textLight)
           .text(datos[i + 1][0], this.margins.left + colWidth, y);
        doc.font('Helvetica')
           .fillColor(this.colors.text)
           .text(datos[i + 1][1] || 'N/A', this.margins.left + colWidth, y + 11);
      }

      y += 28;
    }

    return y;
  }

  /**
   * Generar encabezado de tabla
   */
  generarEncabezadoTabla(doc, headers, colWidths, y) {
    let x = this.margins.left;

    doc.rect(this.margins.left, y, doc.page.width - this.margins.left - this.margins.right, 20)
       .fill(this.colors.primary);

    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#ffffff');

    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + 4, y + 6, { width: colWidths[i] - 8 });
      x += colWidths[i];
    }

    return y + 22;
  }

  /**
   * Generar fila de tabla
   */
  generarFilaTabla(doc, rowData, colWidths, y) {
    let x = this.margins.left;

    doc.rect(this.margins.left, y, doc.page.width - this.margins.left - this.margins.right, 18)
       .stroke(this.colors.border);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.colors.text);

    for (let i = 0; i < rowData.length; i++) {
      doc.text(String(rowData[i] || '-'), x + 4, y + 5, { width: colWidths[i] - 8 });
      x += colWidths[i];
    }

    return y + 19;
  }

  /**
   * Agregar números de página
   */
  agregarNumerosPagina(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      const pageWidth = doc.page.width - this.margins.left - this.margins.right;

      // Pie de página
      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(
           `Historia Clínica Electrónica - ${this.institucion.nombre} | Página ${i + 1} de ${pages.count}`,
           this.margins.left,
           doc.page.height - 35,
           { width: pageWidth, align: 'center' }
         );

      // Fecha de impresión
      doc.fontSize(7)
         .text(
           `Impreso: ${this.formatearFechaHoraCompleta(new Date())}`,
           this.margins.left,
           doc.page.height - 22,
           { width: pageWidth, align: 'center' }
         );
    }
  }

  // ==================== FORMATEADORES ====================

  formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatearFechaCorta(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatearFechaHora(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearFechaHoraCorta(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearFechaHoraCompleta(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  calcularEdad(fechaNacimiento) {
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

  calcularDiasEstancia(fechaIngreso, fechaEgreso) {
    const inicio = new Date(fechaIngreso);
    const fin = fechaEgreso ? new Date(fechaEgreso) : new Date();
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

module.exports = new HCEPdfService();
