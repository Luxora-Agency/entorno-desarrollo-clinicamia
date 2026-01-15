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
const path = require('path');
const fs = require('fs');

class HCEPdfService {
  constructor() {
    this.margins = { top: 60, bottom: 60, left: 50, right: 50 };

    // Colores de marca Clínica MÍA - Turquesa/Teal como primario
    this.colors = {
      primary: '#0d9488',        // Teal 600 - Color principal de marca
      primaryDark: '#0f766e',    // Teal 700 - Variante oscura
      primaryLight: '#14b8a6',   // Teal 500 - Variante clara
      secondary: '#0ea5e9',      // Sky 500 - Azul complementario
      secondaryDark: '#0284c7',  // Sky 600 - Azul oscuro
      accent: '#2dd4bf',         // Teal 400 - Acento vibrante
      danger: '#dc2626',         // Red 600 - Alertas
      warning: '#f59e0b',        // Amber 500 - Advertencias
      success: '#16a34a',        // Green 600 - Éxito
      text: '#1e293b',           // Slate 800 - Texto principal
      textLight: '#475569',      // Slate 600 - Texto secundario
      textMuted: '#64748b',      // Slate 500 - Texto terciario
      border: '#e2e8f0',         // Slate 200 - Bordes
      background: '#f8fafc',     // Slate 50 - Fondo
      headerBg: '#f0fdfa',       // Teal 50 - Fondo header (tono marca)
      successBg: '#f0fdf4',      // Green 50 - Fondo éxito
      warningBg: '#fffbeb',      // Amber 50 - Fondo advertencia
      dangerBg: '#fef2f2',       // Red 50 - Fondo peligro
    };

    // Ruta al logo de la clínica
    this.logoPath = path.join(__dirname, '../assets/clinica-mia-logo.png');

    // Información institucional de Clínica MÍA
    // Conforme a Resolución 3100/2019 - Habilitación de Servicios de Salud
    this.institucion = {
      nombre: 'CLINICA MIA MEDICINA INTEGRAL SAS',
      razonSocial: 'CLINICA MIA MEDICINA INTEGRAL SAS',
      nit: '901497975-7',
      codigoHabilitacion: '7300103424', // Código prestador ante MinSalud
      codigoRethus: 'IPS-TOL-001', // Registro RETHUS
      direccion: 'Avenida Ferrocarril 41-23',
      ciudad: 'Ibagué',
      departamento: 'Tolima',
      pais: 'Colombia',
      telefono: '(608) 324 333 8555',
      celular: '3107839998',
      email: 'infoclinicamia@gmail.com',
      web: 'https://clinicamia.co/',
      representanteLegal: 'Director Médico',
      nivelAtencion: 'II', // Nivel de atención
      naturaleza: 'Privada',
      tipoEntidad: 'IPS - Institución Prestadora de Servicios de Salud',
    };
  }

  /**
   * Formatear contenido que puede contener JSON embebido
   * Convierte JSON a texto legible para el PDF
   */
  formatearContenidoEvolucion(contenido) {
    if (!contenido) return '';

    let texto = contenido;

    // Detectar y formatear "REVISIÓN POR SISTEMAS:" con JSON
    const revisionMatch = texto.match(/REVISIÓN POR SISTEMAS:\s*(\{[\s\S]*?\})\s*(?=\n[A-Z]|$)/);
    if (revisionMatch) {
      try {
        const jsonData = JSON.parse(revisionMatch[1]);
        const formateado = this.formatearRevisionSistemas(jsonData);
        texto = texto.replace(revisionMatch[0], `REVISIÓN POR SISTEMAS:\n${formateado}`);
      } catch (e) {
        // Si no es JSON válido, limpiar caracteres problemáticos
        texto = texto.replace(revisionMatch[1], '[Datos de revisión por sistemas]');
      }
    }

    // Detectar y formatear "PLAN DE MANEJO:" con JSON
    const planMatch = texto.match(/PLAN DE MANEJO:\s*(\{[\s\S]*?\})/);
    if (planMatch) {
      try {
        const jsonData = JSON.parse(planMatch[1]);
        const formateado = this.formatearPlanManejo(jsonData);
        texto = texto.replace(planMatch[0], `PLAN DE MANEJO:\n${formateado}`);
      } catch (e) {
        texto = texto.replace(planMatch[1], '[Datos del plan]');
      }
    }

    // Limpiar cualquier JSON restante que no se haya procesado
    texto = texto.replace(/\{[^}]*"[^"]*":[^}]*\}/g, (match) => {
      try {
        const obj = JSON.parse(match);
        return this.jsonATextoSimple(obj);
      } catch (e) {
        return '[Datos estructurados]';
      }
    });

    return texto.trim();
  }

  /**
   * Formatear revisión por sistemas de JSON a texto legible
   */
  formatearRevisionSistemas(data) {
    const sistemasMap = {
      general: 'General',
      cardiovascular: 'Cardiovascular',
      respiratorio: 'Respiratorio',
      gastrointestinal: 'Gastrointestinal',
      genitourinario: 'Genitourinario',
      musculoesqueletico: 'Musculoesquelético',
      neurologico: 'Neurológico',
      piel: 'Piel y Anexos',
      endocrino: 'Endocrino',
      hematologico: 'Hematológico',
      psiquiatrico: 'Psiquiátrico'
    };

    const sintomasMap = {
      escalofrios: 'Escalofríos',
      fiebre: 'Fiebre',
      fatiga: 'Fatiga',
      perdidaPeso: 'Pérdida de peso',
      dolorPecho: 'Dolor de pecho',
      palpitaciones: 'Palpitaciones',
      edema: 'Edema',
      disnea: 'Disnea',
      tos: 'Tos',
      sibilancias: 'Sibilancias',
      nauseas: 'Náuseas',
      vomito: 'Vómito',
      diarrea: 'Diarrea',
      estrenimiento: 'Estreñimiento',
      dolorAbdominal: 'Dolor abdominal',
      disuria: 'Disuria',
      hematuria: 'Hematuria',
      poliuria: 'Poliuria',
      dolorArticular: 'Dolor articular',
      rigidez: 'Rigidez',
      debilidad: 'Debilidad muscular',
      cefalea: 'Cefalea',
      mareo: 'Mareo',
      convulsiones: 'Convulsiones',
      parestesias: 'Parestesias',
      erupciones: 'Erupciones',
      prurito: 'Prurito',
      lesiones: 'Lesiones cutáneas'
    };

    let resultado = [];

    if (data.observacionesGenerales) {
      resultado.push(`• Observaciones generales: ${data.observacionesGenerales}`);
    }

    for (const [sistema, nombreSistema] of Object.entries(sistemasMap)) {
      if (data[sistema] && typeof data[sistema] === 'object') {
        const sintomas = Object.entries(data[sistema])
          .filter(([key, value]) => value === true)
          .map(([key]) => sintomasMap[key] || key)
          .join(', ');

        if (sintomas) {
          resultado.push(`• ${nombreSistema}: ${sintomas}`);
        }
      }
    }

    return resultado.length > 0 ? resultado.join('\n') : 'Sin hallazgos relevantes';
  }

  /**
   * Formatear plan de manejo de JSON a texto legible
   */
  formatearPlanManejo(data) {
    let resultado = [];

    if (data.incapacidades) resultado.push(`• Incapacidades: ${data.incapacidades} día(s)`);
    if (data.certificados) resultado.push(`• Certificados médicos: ${data.certificados}`);
    if (data.seguimientos) resultado.push(`• Seguimientos programados: ${data.seguimientos}`);
    if (data.observaciones) resultado.push(`• Observaciones: ${data.observaciones}`);
    if (data.recomendaciones) resultado.push(`• Recomendaciones: ${data.recomendaciones}`);

    return resultado.length > 0 ? resultado.join('\n') : 'Plan indicado';
  }

  /**
   * Convertir objeto JSON simple a texto
   */
  jsonATextoSimple(obj) {
    if (typeof obj !== 'object' || obj === null) return String(obj);

    return Object.entries(obj)
      .filter(([key, value]) => value !== null && value !== undefined && value !== false)
      .map(([key, value]) => {
        const keyFormatted = key.replace(/([A-Z])/g, ' $1').trim();
        if (typeof value === 'object') {
          return `${keyFormatted}: ${this.jsonATextoSimple(value)}`;
        }
        return `${keyFormatted}: ${value}`;
      })
      .join(', ');
  }

  /**
   * Formatear estado civil para mostrar de forma legible
   */
  formatearEstadoCivil(valor) {
    if (!valor) return 'N/A';
    const mapeo = {
      'soltero': 'Soltero(a)',
      'casado': 'Casado(a)',
      'union_libre': 'Unión Libre',
      'divorciado': 'Divorciado(a)',
      'viudo': 'Viudo(a)',
      'separado': 'Separado(a)',
    };
    return mapeo[valor.toLowerCase()] || valor.charAt(0).toUpperCase() + valor.slice(1).replace(/_/g, ' ');
  }

  /**
   * Formatear nivel de educación para mostrar de forma legible
   */
  formatearNivelEducacion(valor) {
    if (!valor) return 'N/A';
    const mapeo = {
      'ninguno': 'Ninguno',
      'preescolar': 'Preescolar',
      'primaria': 'Primaria',
      'secundaria': 'Secundaria',
      'bachillerato': 'Bachillerato',
      'tecnico': 'Técnico',
      'tecnologico': 'Tecnológico',
      'universitario': 'Universitario',
      'profesional': 'Profesional',
      'especializacion': 'Especialización',
      'maestria': 'Maestría',
      'doctorado': 'Doctorado',
    };
    return mapeo[valor.toLowerCase()] || valor.charAt(0).toUpperCase() + valor.slice(1).replace(/_/g, ' ');
  }

  /**
   * Formatear valor genérico - capitaliza y reemplaza guiones bajos
   */
  formatearValor(valor) {
    if (!valor || valor === 'null' || valor === 'undefined') return 'N/A';
    if (typeof valor !== 'string') return String(valor);
    return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  /**
   * Generar PDF completo de la Historia Clínica Electrónica
   * @param {string} pacienteId - ID del paciente
   * @param {Object} opciones - Opciones de generación
   * @param {Date} opciones.fechaDesde - Fecha inicial del rango (opcional)
   * @param {Date} opciones.fechaHasta - Fecha final del rango (opcional)
   */
  async generarPDF(pacienteId, opciones = {}) {
    const datos = await this.obtenerDatosCompletos(pacienteId, opciones);

    const rangoTexto = opciones.fechaDesde && opciones.fechaHasta
      ? ` (${opciones.fechaDesde.toLocaleDateString('es-CO')} - ${opciones.fechaHasta.toLocaleDateString('es-CO')})`
      : ' (Completa)';

    console.log(`[PDF] Generando HCE para paciente ${pacienteId}${rangoTexto} - Evoluciones: ${datos.evoluciones.length}, Signos Vitales: ${datos.signosVitales.length}, Diagnósticos: ${datos.diagnosticos.length}`);

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
   * @param {string} pacienteId - ID del paciente
   * @param {Object} opciones - Opciones de filtrado
   * @param {Date} opciones.fechaDesde - Fecha inicial del rango
   * @param {Date} opciones.fechaHasta - Fecha final del rango
   */
  async obtenerDatosCompletos(pacienteId, opciones = {}) {
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Helper para crear filtro de fecha
    const { fechaDesde, fechaHasta } = opciones;
    const tieneRango = fechaDesde && fechaHasta;

    // Crear filtro de fecha para diferentes campos
    const filtroFecha = (campoFecha) => {
      if (!tieneRango) return {};
      return {
        [campoFecha]: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      };
    };

    // Obtener datos clínicos del paciente (filtrados por rango si aplica)

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
        where: { pacienteId: pacienteId, ...filtroFecha('fechaEvolucion') },
        include: {
          doctor: {
            include: {
              doctor: {
                include: {
                  especialidades: true, // Incluye especialidades del doctor
                },
              },
            },
          },
          admision: { include: { unidad: true } },
          cita: true, // Incluye cita para obtener tipoCita
        },
        orderBy: { fechaEvolucion: 'desc' },
      }),
      prisma.signoVital.findMany({
        where: { pacienteId, ...filtroFecha('fechaRegistro') },
        include: { registrador: true },
        orderBy: { fechaRegistro: 'desc' },
      }),
      prisma.diagnosticoHCE.findMany({
        where: { pacienteId, ...filtroFecha('fechaDiagnostico') },
        include: {
          doctor: {
            include: {
              doctor: true, // Incluye modelo Doctor con firma y sello
            },
          },
        },
        orderBy: { fechaDiagnostico: 'desc' },
      }),
      prisma.alertaClinica.findMany({
        where: { pacienteId, ...filtroFecha('fechaAlerta') },
        include: { reconocedor: true },
        orderBy: { fechaAlerta: 'desc' },
      }),
      prisma.prescripcion.findMany({
        where: { pacienteId, ...filtroFecha('fechaPrescripcion') },
        include: {
          medico: {
            include: {
              doctor: true, // Incluye modelo Doctor con firma y sello
            },
          },
          medicamentos: { include: { producto: true } },
        },
        orderBy: { fechaPrescripcion: 'desc' },
      }),
      prisma.procedimiento.findMany({
        where: { pacienteId, ...filtroFecha('fechaProgramada') },
        include: {
          medicoResponsable: {
            include: { doctor: true },
          },
          anestesiologo: {
            include: { doctor: true },
          },
          quirofano: true,
          medicoFirma: {
            include: { doctor: true },
          },
        },
        orderBy: { fechaProgramada: 'desc' },
      }),
      prisma.atencionUrgencia.findMany({
        where: { pacienteId, ...filtroFecha('horaLlegada') },
        include: {
          medicoAsignado: true,
          enfermeraAsignada: true,
        },
        orderBy: { horaLlegada: 'desc' },
      }),
      prisma.admision.findMany({
        where: { pacienteId, ...filtroFecha('fechaIngreso') },
        include: {
          unidad: true,
          cama: { include: { habitacion: true } },
          movimientos: true,
        },
        orderBy: { fechaIngreso: 'desc' },
      }),
      prisma.interconsulta.findMany({
        where: { pacienteId, ...filtroFecha('fechaSolicitud') },
        include: {
          medicoSolicitante: true,
          medicoEspecialista: true,
        },
        orderBy: { fechaSolicitud: 'desc' },
      }),
      prisma.ordenMedica.findMany({
        where: { pacienteId, ...filtroFecha('fechaOrden') },
        include: {
          doctor: {
            include: { doctor: true },
          },
          examenProcedimiento: true,
        },
        orderBy: { fechaOrden: 'desc' },
      }),
      prisma.notaEnfermeria.findMany({
        where: { pacienteId, ...filtroFecha('fechaHora') },
        include: { enfermera: true },
        orderBy: { fechaHora: 'desc' },
      }),
      prisma.estudioImagenologia.findMany({
        where: { pacienteId, ...filtroFecha('fechaSolicitud') },
        include: {
          medicoSolicitante: true,
          radiologo: true,
        },
        orderBy: { fechaSolicitud: 'desc' },
      }),
      prisma.cita.findMany({
        where: { pacienteId, ...filtroFecha('fecha') },
        include: { doctor: true },
        orderBy: { fecha: 'desc' },
        take: 20,
      }),
    ]);

    // Datos obtenidos del paciente

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

    // Paraclínicos: Órdenes ejecutadas/completadas con resultados
    const paraclinicos = ordenesMedicas.filter(
      (o) => (o.estado === 'Ejecutada' || o.estado === 'Completada') && o.resultados
    );

    // Exámenes ordenados: Órdenes pendientes o sin resultados
    const examenesOrdenados = ordenesMedicas.filter(
      (o) => o.estado === 'Pendiente' || ((o.estado === 'Ejecutada' || o.estado === 'Completada') && !o.resultados)
    );

    // === OBTENER ANTECEDENTES ESTRUCTURADOS ===
    const [
      antecedentesPatologicos,
      antecedentesQuirurgicos,
      antecedentesAlergicos,
      antecedentesFamiliares,
      antecedentesFarmacologicos,
      antecedenteGinecoObstetrico,
    ] = await Promise.all([
      prisma.antecedentePatologico.findMany({
        where: { pacienteId, activo: true },
        orderBy: { fechaDiagnostico: 'desc' },
      }),
      prisma.antecedenteQuirurgico.findMany({
        where: { pacienteId, activo: true },
        orderBy: { fecha: 'desc' },
      }),
      prisma.antecedenteAlergico.findMany({
        where: { pacienteId, activo: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.antecedenteFamiliar.findMany({
        where: { pacienteId, activo: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.antecedenteFarmacologico.findMany({
        where: { pacienteId, activo: true },
        orderBy: { fechaInicio: 'desc' },
      }),
      prisma.antecedenteGinecoObstetrico.findUnique({
        where: { pacienteId },
      }),
    ]);

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
      paraclinicos,
      examenesOrdenados,
      citas,
      // Antecedentes estructurados
      antecedentes: {
        patologicos: antecedentesPatologicos,
        quirurgicos: antecedentesQuirurgicos,
        alergicos: antecedentesAlergicos,
        familiares: antecedentesFamiliares,
        farmacologicos: antecedentesFarmacologicos,
        ginecoObstetrico: antecedenteGinecoObstetrico,
      },
      fechaGeneracion: new Date(),
      institucion: this.institucion,
      // Rango de fechas si se filtró
      rangoFechas: tieneRango ? { desde: fechaDesde, hasta: fechaHasta } : null,
    };
  }

  /**
   * Verificar si hay espacio suficiente en la página actual
   * @param {Object} doc - Documento PDF
   * @param {number} espacioRequerido - Espacio mínimo requerido en puntos
   * @param {number} yActual - Posición Y actual
   * @returns {boolean} true si hay espacio suficiente
   */
  hayEspacioEnPagina(doc, espacioRequerido, yActual) {
    const espacioDisponible = doc.page.height - this.margins.bottom - yActual;
    return espacioDisponible >= espacioRequerido;
  }

  /**
   * Generar contenido completo del PDF según normativa colombiana
   * Resolución 1995/1999, Ley 2015/2020, Resolución 866/2021
   * OPTIMIZADO V3: Sin páginas en blanco, máxima eficiencia
   */
  async generarContenido(doc, datos) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // === PÁGINA 1: PORTADA CON IDENTIFICACIÓN DEL PACIENTE ===
    let y = this.generarPortada(doc, datos);

    // Verificar si necesitamos nueva página para el contenido clínico
    y = this.verificarEspacio(doc, y, 100);

    // === DIAGNÓSTICOS Y ALERTAS (en misma página si caben) ===
    if (datos.alertas.length > 0 || datos.diagnosticos.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarTituloSeccion(doc, 'DIAGNÓSTICOS Y ALERTAS CLÍNICAS', y);

      if (datos.alertas.length > 0) {
        y = this.generarAlertasInline(doc, datos.alertas, y);
      }
      if (datos.diagnosticos.length > 0) {
        y = this.generarDiagnosticosInline(doc, datos.diagnosticos, y);
      }
    }

    // === EVOLUCIONES MÉDICAS (SOAP) ===
    if (datos.evoluciones.length > 0) {
      y = this.verificarEspacio(doc, y, 200);
      y = this.generarEvolucionesInline(doc, datos.evoluciones, y);
    }

    // === SIGNOS VITALES ===
    if (datos.signosVitales.length > 0) {
      y = this.verificarEspacio(doc, y, 120);
      y = this.generarSignosVitalesInline(doc, datos.signosVitales, y);
    }

    // === ANTECEDENTES ESTRUCTURADOS ===
    if (datos.antecedentes) {
      y = this.verificarEspacio(doc, y, 120);
      y = this.generarAntecedentesEstructurados(doc, datos.antecedentes, datos.paciente, y);
    }

    // === PARACLÍNICOS (Resultados de laboratorio) ===
    if (datos.paraclinicos && datos.paraclinicos.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarParaclinicosInline(doc, datos.paraclinicos, y);
    }

    // === FORMULACIÓN (Prescripciones detalladas) ===
    if (datos.prescripciones.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarFormulacionInline(doc, datos.prescripciones, y);
    }

    // === EXÁMENES ORDENADOS ===
    if (datos.examenesOrdenados && datos.examenesOrdenados.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarExamenesOrdenadosInline(doc, datos.examenesOrdenados, y);
    }

    // === ÓRDENES MÉDICAS ===
    if (datos.ordenesMedicas.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarOrdenesMedicasInline(doc, datos.ordenesMedicas, y);
    }

    // === PROCEDIMIENTOS ===
    if (datos.procedimientos.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarProcedimientosInline(doc, datos.procedimientos, y);
    }

    // === CIRUGÍAS ===
    if (datos.cirugias && datos.cirugias.length > 0) {
      y = this.verificarEspacio(doc, y, 120);
      y = this.generarCirugiasInline(doc, datos.cirugias, y);
    }

    // === INTERCONSULTAS ===
    if (datos.interconsultas.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarInterconsultasInline(doc, datos.interconsultas, y);
    }

    // === NOTAS DE ENFERMERÍA ===
    if (datos.notasEnfermeria.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarNotasEnfermeriaInline(doc, datos.notasEnfermeria, y);
    }

    // === LABORATORIOS ===
    if (datos.laboratorios.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarLaboratoriosInline(doc, datos.laboratorios, y);
    }

    // === IMAGENOLOGÍA ===
    if (datos.imagenologia.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarImagenologiaInline(doc, datos.imagenologia, y);
    }

    // === URGENCIAS ===
    if (datos.urgencias.length > 0) {
      y = this.verificarEspacio(doc, y, 100);
      y = this.generarUrgenciasInline(doc, datos.urgencias, y);
    }

    // === HOSPITALIZACIONES ===
    if (datos.hospitalizaciones.length > 0) {
      y = this.verificarEspacio(doc, y, 120);
      y = this.generarHospitalizacionesInline(doc, datos.hospitalizaciones, y);
    }

    // === CONSTANCIA DE AUTENTICIDAD ===
    y = this.verificarEspacio(doc, y, 130);
    this.generarResumenFinal(doc, datos, y);

    // PDF generado exitosamente
  }

  /**
   * Verificar espacio y agregar página si es necesario
   */
  verificarEspacio(doc, y, espacioRequerido) {
    const espacioDisponible = doc.page.height - this.margins.bottom - y;
    if (espacioDisponible < espacioRequerido) {
      doc.addPage();
      return 60;
    }
    return y;
  }

  /**
   * Verificar espacio - versión antigua para compatibilidad
   */
  verificarEspacioAntiguo(doc, y, espacioRequerido) {
    if (y + espacioRequerido > doc.page.height - this.margins.bottom) {
      doc.addPage();
      return 60;
    }
    return y;
  }

  /**
   * Generar título de sección inline - COMPACTO
   */
  generarTituloSeccion(doc, titulo, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.rect(this.margins.left, y, pageWidth, 18)
       .fill(this.colors.primary);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
       .text(titulo, this.margins.left + 10, y + 4);

    return y + 22;
  }

  /**
   * Índice compacto
   */
  generarIndiceCompacto(doc, datos) {
    let y = 60;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Header
    doc.rect(this.margins.left, y, pageWidth, 35)
       .fill(this.colors.primary);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
       .text('ÍNDICE DE CONTENIDO', this.margins.left + 15, y + 10);

    y += 45;

    const secciones = [
      { nombre: 'Identificación del Paciente', tiene: true },
      { nombre: 'Diagnósticos y Alertas', tiene: datos.diagnosticos.length > 0 || datos.alertas.length > 0 },
      { nombre: 'Evoluciones Médicas (SOAP)', tiene: datos.evoluciones.length > 0 },
      { nombre: 'Signos Vitales', tiene: datos.signosVitales.length > 0 },
      { nombre: 'Prescripciones', tiene: datos.prescripciones.length > 0 },
      { nombre: 'Órdenes Médicas', tiene: datos.ordenesMedicas.length > 0 },
      { nombre: 'Procedimientos', tiene: datos.procedimientos.length > 0 },
      { nombre: 'Cirugías', tiene: datos.cirugias?.length > 0 },
      { nombre: 'Interconsultas', tiene: datos.interconsultas.length > 0 },
      { nombre: 'Notas de Enfermería', tiene: datos.notasEnfermeria.length > 0 },
      { nombre: 'Laboratorios', tiene: datos.laboratorios.length > 0 },
      { nombre: 'Imagenología', tiene: datos.imagenologia.length > 0 },
      { nombre: 'Urgencias', tiene: datos.urgencias.length > 0 },
      { nombre: 'Hospitalizaciones', tiene: datos.hospitalizaciones.length > 0 },
      { nombre: 'Resumen y Constancia', tiene: true },
    ];

    let num = 1;
    for (const sec of secciones) {
      if (sec.tiene) {
        doc.fontSize(9).font('Helvetica').fillColor(this.colors.text)
           .text(`${num}. ${sec.nombre}`, this.margins.left + 20, y);
        y += 16;
        num++;
      }
    }

    // Nota normativa
    y += 20;
    doc.rect(this.margins.left, y, pageWidth, 45)
       .fill(this.colors.headerBg);

    doc.fontSize(8).font('Helvetica-Oblique').fillColor(this.colors.textMuted)
       .text('Documento conforme a: Resolución 1995/1999, Ley 2015/2020 (HCE Interoperable),',
             this.margins.left + 10, y + 10)
       .text('Resolución 866/2021, Ley 1581/2012 (Protección de Datos)',
             this.margins.left + 10, y + 22);
  }

  /**
   * Identificación del paciente inline - COMPLETA CON TODOS LOS CAMPOS
   */
  generarIdentificacionInline(doc, paciente, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const col2Width = pageWidth / 2;
    const col3Width = pageWidth / 3;
    const col4Width = pageWidth / 4;

    // Título
    y = this.generarTituloSeccion(doc, 'IDENTIFICACIÓN DEL PACIENTE (Art. 10 Res. 1995/1999)', y);

    // === TARJETA PRINCIPAL DEL PACIENTE ===
    doc.rect(this.margins.left, y, pageWidth, 55)
       .lineWidth(1)
       .fillAndStroke(this.colors.headerBg, this.colors.primary);

    // Foto del paciente
    const fotoX = this.margins.left + 6;
    const fotoY = y + 5;
    const fotoSize = 44;
    let fotoMostrada = false;

    if (paciente.fotoUrl) {
      try {
        if (paciente.fotoUrl.startsWith('data:image')) {
          const base64Data = paciente.fotoUrl.replace(/^data:image\/\w+;base64,/, '');
          const fotoBuffer = Buffer.from(base64Data, 'base64');
          doc.image(fotoBuffer, fotoX, fotoY, { width: fotoSize, height: fotoSize, fit: [fotoSize, fotoSize] });
          fotoMostrada = true;
        } else if (paciente.fotoUrl.startsWith('/uploads/') || paciente.fotoUrl.startsWith('uploads/')) {
          const fotoPath = path.join(__dirname, '..', 'public', paciente.fotoUrl);
          if (fs.existsSync(fotoPath)) {
            doc.image(fotoPath, fotoX, fotoY, { width: fotoSize, height: fotoSize, fit: [fotoSize, fotoSize] });
            fotoMostrada = true;
          }
        }
      } catch (e) { /* ignorar */ }
    }
    if (!fotoMostrada) {
      this.dibujarFotoPlaceholder(doc, fotoX, fotoY, fotoSize);
    }

    // Datos principales al lado de la foto
    const dataX = fotoX + fotoSize + 10;
    const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim().toUpperCase();

    doc.fontSize(11).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text(nombreCompleto || 'NOMBRE NO REGISTRADO', dataX, y + 5, { width: pageWidth - fotoSize - 30 });

    doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
       .text(`${paciente.tipoDocumento || 'CC'}: ${paciente.cedula || 'N/A'} | Exp: ${paciente.lugarExpedicion || 'N/A'} | Sangre: ${paciente.tipoSangre || 'N/A'}`, dataX, y + 19);

    doc.fontSize(7).fillColor(this.colors.textLight)
       .text(`Edad: ${this.calcularEdad(paciente.fechaNacimiento, true)} | Sexo: ${this.formatearValor(paciente.genero)} | Id. Género: ${this.formatearValor(paciente.identidadGenero)} | Nac: ${this.formatearFecha(paciente.fechaNacimiento)}`, dataX, y + 31)
       .text(`EPS: ${paciente.eps || 'N/A'} | Régimen: ${this.formatearValor(paciente.regimen)} | Afiliación: ${this.formatearValor(paciente.tipoAfiliacion)}`, dataX, y + 42);

    y += 58;

    // === DATOS PERSONALES ===
    doc.rect(this.margins.left, y, pageWidth, 14).fill(this.colors.primary);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
       .text('DATOS PERSONALES Y DEMOGRÁFICOS', this.margins.left + 6, y + 4);
    y += 16;

    // Fila 1: País, Estado Civil, Ocupación, Escolaridad
    doc.rect(this.margins.left, y, pageWidth, 13).fill('#f8fafc');
    const r1c1 = this.margins.left + 4;
    const r1c2 = this.margins.left + col4Width;
    const r1c3 = this.margins.left + col4Width * 2;
    const r1c4 = this.margins.left + col4Width * 3;

    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
    doc.text('País:', r1c1, y + 3);
    doc.text('Estado Civil:', r1c2, y + 3);
    doc.text('Ocupación:', r1c3, y + 3);
    doc.text('Escolaridad:', r1c4, y + 3);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
    doc.text(paciente.paisNacimiento || 'N/A', r1c1 + 22, y + 3);
    doc.text(this.formatearEstadoCivil(paciente.estadoCivil), r1c2 + 48, y + 3);
    doc.text((paciente.ocupacion || 'N/A').substring(0, 18), r1c3 + 45, y + 3);
    doc.text(this.formatearNivelEducacion(paciente.nivelEducacion).substring(0, 15), r1c4 + 45, y + 3);
    y += 14;

    // Fila 2: Etnia, Pref. Llamado, Tipo Usuario, Empleador
    doc.rect(this.margins.left, y, pageWidth, 13).fill('#ffffff');
    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
    doc.text('Etnia:', r1c1, y + 3);
    doc.text('Pref. Llamado:', r1c2, y + 3);
    doc.text('Tipo Usuario:', r1c3, y + 3);
    doc.text('Empleador:', r1c4, y + 3);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
    doc.text(paciente.etnia || 'N/A', r1c1 + 25, y + 3);
    doc.text(paciente.preferenciaLlamado || 'N/A', r1c2 + 55, y + 3);
    doc.text(paciente.tipoUsuario || 'N/A', r1c3 + 48, y + 3);
    doc.text((paciente.empleadorActual || 'N/A').substring(0, 15), r1c4 + 42, y + 3);
    y += 14;

    // Fila 3: Discapacidad (siempre mostrar el estado)
    const tieneDiscapacidad = paciente.discapacidad === 'Aplica';
    const bgDiscapacidad = tieneDiscapacidad ? '#fae8ff' : '#f8fafc';
    const colorDiscapacidad = tieneDiscapacidad ? '#9333ea' : this.colors.text;
    doc.rect(this.margins.left, y, pageWidth, 13).fill(bgDiscapacidad);
    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
    doc.text('Discapacidad:', r1c1, y + 3);
    doc.text('Tipo Discapacidad:', this.margins.left + col2Width, y + 3);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(colorDiscapacidad);
    doc.text(paciente.discapacidad || 'No aplica', r1c1 + 50, y + 3);
    doc.text(tieneDiscapacidad ? (paciente.tipoDiscapacidad || 'No especificado') : 'N/A', this.margins.left + col2Width + 70, y + 3);
    y += 15;

    // === UBICACIÓN Y CONTACTO ===
    doc.rect(this.margins.left, y, pageWidth, 14).fill(this.colors.secondary);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
       .text('UBICACIÓN Y CONTACTO', this.margins.left + 6, y + 4);
    y += 16;

    // Dirección completa
    doc.rect(this.margins.left, y, pageWidth, 13).fill('#f0f9ff');
    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted).text('Dirección:', this.margins.left + 4, y + 3);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text)
       .text(`${paciente.direccion || 'N/A'}, ${paciente.barrio || ''} - ${paciente.municipio || ''}, ${paciente.departamento || ''} | Zona: ${paciente.zona || 'N/A'}`, this.margins.left + 40, y + 3);
    y += 14;

    // Teléfono y email
    doc.rect(this.margins.left, y, pageWidth, 13).fill('#ffffff');
    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
    doc.text('Teléfono:', this.margins.left + 4, y + 3);
    doc.text('Email:', this.margins.left + col2Width, y + 3);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
    doc.text(paciente.telefono || 'N/A', this.margins.left + 40, y + 3);
    doc.text(paciente.email || 'N/A', this.margins.left + col2Width + 25, y + 3, { width: col2Width - 30 });
    y += 15;

    // === RESPONSABLE (si existe) ===
    if (paciente.responsable && paciente.responsable.nombre) {
      doc.rect(this.margins.left, y, pageWidth, 16)
         .fillAndStroke('#fff7ed', '#f59e0b');
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#b45309')
         .text('RESPONSABLE:', this.margins.left + 6, y + 5);
      doc.font('Helvetica').fontSize(7).fillColor(this.colors.text)
         .text(`${paciente.responsable.nombre} | ${paciente.responsable.parentesco || ''} | Tel: ${paciente.responsable.telefono || 'N/A'}`, this.margins.left + 65, y + 5);
      y += 18;
    }

    // === ACOMPAÑANTE (si existe) ===
    if (paciente.acompanante && paciente.acompanante.nombre) {
      doc.rect(this.margins.left, y, pageWidth, 16)
         .fillAndStroke('#eff6ff', '#3b82f6');
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#1d4ed8')
         .text('ACOMPAÑANTE:', this.margins.left + 6, y + 5);
      doc.font('Helvetica').fontSize(7).fillColor(this.colors.text)
         .text(`${paciente.acompanante.nombre} | ${paciente.acompanante.parentesco || ''} | Tel: ${paciente.acompanante.telefono || 'N/A'}`, this.margins.left + 65, y + 5);
      y += 18;
    }

    // === CONTACTOS DE EMERGENCIA ===
    let contactosEmergencia = [];
    if (paciente.contactosEmergencia) {
      try {
        const contactos = typeof paciente.contactosEmergencia === 'string'
          ? JSON.parse(paciente.contactosEmergencia)
          : paciente.contactosEmergencia;
        if (Array.isArray(contactos)) {
          contactosEmergencia = contactos;
        } else if (contactos.nombre) {
          contactosEmergencia = [contactos];
        }
      } catch (e) { /* ignorar */ }
    }

    if (contactosEmergencia.length > 0) {
      doc.rect(this.margins.left, y, pageWidth, 16)
         .fillAndStroke('#fef2f2', '#dc2626');
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#dc2626')
         .text('EMERGENCIA:', this.margins.left + 6, y + 5);
      const contactoTexto = contactosEmergencia.slice(0, 2).map(c => `${c.nombre || ''} (${c.parentesco || ''}) ${c.telefono || ''}`).join(' | ');
      doc.font('Helvetica').fontSize(7).fillColor(this.colors.text)
         .text(contactoTexto, this.margins.left + 55, y + 5, { width: pageWidth - 65 });
      y += 18;
    }

    // === ASEGURAMIENTO EN SALUD ===
    doc.rect(this.margins.left, y, pageWidth, 14).fill('#7c3aed');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
       .text('ASEGURAMIENTO EN SALUD', this.margins.left + 6, y + 4);
    y += 16;

    // Fila 1: ARL, SISBEN, Convenio, Carnet
    doc.rect(this.margins.left, y, pageWidth, 13).fill('#f5f3ff');
    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
    doc.text('ARL:', r1c1, y + 3);
    doc.text('SISBEN:', r1c2, y + 3);
    doc.text('Convenio:', r1c3, y + 3);
    doc.text('Carnet/Póliza:', r1c4, y + 3);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
    doc.text((paciente.arl || 'N/A').substring(0, 18), r1c1 + 18, y + 3);
    doc.text(paciente.nivelSisben || 'N/A', r1c2 + 32, y + 3);
    doc.text((paciente.convenio || 'N/A').substring(0, 15), r1c3 + 38, y + 3);
    doc.text((paciente.carnetPoliza || 'N/A').substring(0, 12), r1c4 + 52, y + 3);
    y += 14;

    // Fila 2: No. Autorización, Fecha Afiliación, Categoría, Tipo Paciente
    doc.rect(this.margins.left, y, pageWidth, 13).fill('#ffffff');
    doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
    doc.text('No. Autoriz:', r1c1, y + 3);
    doc.text('F. Afiliación:', r1c2, y + 3);
    doc.text('Categoría:', r1c3, y + 3);
    doc.text('Tipo Paciente:', r1c4, y + 3);

    doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
    doc.text((paciente.numeroAutorizacion || 'N/A').substring(0, 15), r1c1 + 45, y + 3);
    doc.text(this.formatearFechaCorta(paciente.fechaAfiliacion) || 'N/A', r1c2 + 48, y + 3);
    doc.text((paciente.categoria || 'N/A').substring(0, 12), r1c3 + 40, y + 3);
    doc.text((paciente.tipoPaciente || 'N/A').substring(0, 12), r1c4 + 52, y + 3);
    y += 15;

    // === REFERENCIA ===
    if (paciente.referidoPor || paciente.nombreRefiere) {
      doc.rect(this.margins.left, y, pageWidth, 14).fill('#fef3c7');
      doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
      doc.text('Referido por:', this.margins.left + 4, y + 4);
      doc.text('Nombre quien refiere:', this.margins.left + col2Width, y + 4);

      doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
      doc.text(paciente.referidoPor || 'N/A', this.margins.left + 50, y + 4);
      doc.text(paciente.nombreRefiere || 'N/A', this.margins.left + col2Width + 80, y + 4);
      y += 16;
    }

    // === DATOS ANTROPOMÉTRICOS ===
    if (paciente.peso || paciente.altura) {
      doc.rect(this.margins.left, y, pageWidth, 14).fill('#ecfdf5');
      doc.fontSize(6).font('Helvetica').fillColor(this.colors.textMuted);
      doc.text('Peso:', this.margins.left + 4, y + 4);
      doc.text('Altura:', this.margins.left + col3Width, y + 4);
      doc.text('IMC:', this.margins.left + col3Width * 2, y + 4);

      doc.font('Helvetica-Bold').fontSize(7).fillColor(this.colors.text);
      doc.text(paciente.peso ? `${paciente.peso} kg` : 'N/A', this.margins.left + 25, y + 4);
      const alturaDisplay = paciente.altura ? (paciente.altura > 3 ? `${paciente.altura} cm` : `${(paciente.altura * 100).toFixed(0)} cm`) : 'N/A';
      doc.text(alturaDisplay, this.margins.left + col3Width + 28, y + 4);
      if (paciente.peso && paciente.altura) {
        const alturaM = paciente.altura > 3 ? paciente.altura / 100 : paciente.altura;
        const imc = (paciente.peso / (alturaM * alturaM)).toFixed(1);
        doc.text(imc, this.margins.left + col3Width * 2 + 18, y + 4);
      } else {
        doc.text('N/A', this.margins.left + col3Width * 2 + 18, y + 4);
      }
      y += 16;
    }

    // === ANTECEDENTES CLÍNICOS ===
    doc.rect(this.margins.left, y, pageWidth, 14).fill(this.colors.danger);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
       .text('ANTECEDENTES CLÍNICOS', this.margins.left + 6, y + 4);
    y += 16;

    const antecedentes = [
      ['Alergias', paciente.alergias || 'Ninguna conocida', '#fef2f2'],
      ['Enf. Crónicas', paciente.enfermedadesCronicas || 'Ninguna reportada', '#fffbeb'],
      ['Medicamentos', paciente.medicamentosActuales || 'Ninguno actual', '#eff6ff'],
      ['Quirúrgicos', paciente.antecedentesQuirurgicos || 'Sin antecedentes', '#f0fdf4'],
    ];

    for (const [label, value, bgColor] of antecedentes) {
      doc.rect(this.margins.left, y, pageWidth, 12).fill(bgColor);
      doc.fontSize(6).font('Helvetica-Bold').fillColor(this.colors.textMuted)
         .text(label + ':', this.margins.left + 6, y + 3);
      doc.fontSize(7).font('Helvetica').fillColor(this.colors.text)
         .text((value || '').substring(0, 90), this.margins.left + 65, y + 3, { width: pageWidth - 75 });
      y += 13;
    }

    return y + 6;
  }

  /**
   * Alertas inline
   */
  generarAlertasInline(doc, alertas, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.danger)
       .text('⚠ ALERTAS ACTIVAS', this.margins.left, y);
    y += 14;

    for (const alerta of alertas.slice(0, 5)) {
      y = this.verificarEspacio(doc, y, 25);

      const colorFondo = alerta.tipo === 'Alergia' ? this.colors.dangerBg : this.colors.warningBg;
      const colorBorde = alerta.tipo === 'Alergia' ? this.colors.danger : this.colors.warning;

      doc.rect(this.margins.left, y, pageWidth, 20)
         .fillAndStroke(colorFondo, colorBorde);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(colorBorde)
         .text(`${alerta.tipo || 'ALERTA'}: ${alerta.titulo || 'Sin título'}`, this.margins.left + 8, y + 5, { width: pageWidth - 16 });

      y += 24;
    }

    return y + 8;
  }

  /**
   * Diagnósticos inline
   */
  generarDiagnosticosInline(doc, diagnosticos, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('DIAGNÓSTICOS (CIE-10/CIE-11)', this.margins.left, y);
    y += 14;

    // Header tabla
    doc.rect(this.margins.left, y, pageWidth, 16).fill(this.colors.primary);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
       .text('Código', this.margins.left + 5, y + 4)
       .text('Descripción', this.margins.left + 65, y + 4)
       .text('Tipo', this.margins.left + pageWidth - 95, y + 4)
       .text('Fecha', this.margins.left + pageWidth - 50, y + 4);
    y += 18;

    for (let i = 0; i < Math.min(diagnosticos.length, 10); i++) {
      y = this.verificarEspacio(doc, y, 16);
      const diag = diagnosticos[i];
      const bgColor = i % 2 === 0 ? '#f8fafc' : '#ffffff';

      doc.rect(this.margins.left, y, pageWidth, 15).fill(bgColor);

      doc.fontSize(7).font('Helvetica').fillColor(this.colors.text)
         .text(diag.codigoCIE11 || diag.codigoCIE10 || '-', this.margins.left + 5, y + 4)
         .text((diag.descripcionCIE11 || diag.descripcion || 'N/A').substring(0, 45), this.margins.left + 65, y + 4)
         .text(diag.tipoDiagnostico || 'Principal', this.margins.left + pageWidth - 95, y + 4)
         .text(this.formatearFechaCorta(diag.fechaDiagnostico), this.margins.left + pageWidth - 50, y + 4);
      y += 15;
    }

    return y + 10;
  }

  /**
   * Evoluciones inline con SOAP mejorado
   */
  generarEvolucionesInline(doc, evoluciones, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Procesar evoluciones

    y = this.generarTituloSeccion(doc, 'EVOLUCIONES MÉDICAS - FORMATO SOAP', y);

    const soapColors = {
      S: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },
      O: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
      A: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
      P: { bg: '#f3e8ff', border: '#9333ea', text: '#7c3aed' },
    };

    for (let i = 0; i < evoluciones.length; i++) {
      const evol = evoluciones[i];

      // Verificar espacio para evolución completa (~250px para incluir info adicional)
      y = this.verificarEspacio(doc, y, 250);

      // Header de evolución - más alto para incluir más información
      doc.rect(this.margins.left, y, pageWidth, 36)
         .fill(this.colors.primary);

      const nombreMedico = evol.doctor ? `Dr(a). ${evol.doctor.nombre} ${evol.doctor.apellido}` : 'N/A';
      const licenciaMedico = evol.doctor?.doctor?.licenciaMedica || '';
      // Obtener primera especialidad del doctor (es un array)
      const especialidadMedico = evol.doctor?.doctor?.especialidades?.[0]?.nombre || '';

      // Título de evolución
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
         .text(`EVOLUCIÓN #${evoluciones.length - i}`, this.margins.left + 10, y + 5);

      // Fecha y hora
      doc.fontSize(7).font('Helvetica').fillColor(this.colors.accent)
         .text(this.formatearFechaHora(evol.fechaEvolucion), this.margins.left + pageWidth - 130, y + 6);

      // Profesional (nombre prominente)
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
         .text(`Profesional: ${nombreMedico}`, this.margins.left + 10, y + 18);

      if (licenciaMedico) {
        doc.fontSize(7).font('Helvetica').fillColor(this.colors.accent)
           .text(`RM: ${licenciaMedico}`, this.margins.left + pageWidth - 130, y + 19);
      }

      // Tipo de consulta y tipo de atención
      const tipoEvolucion = evol.tipoEvolucion || 'Consulta';
      const tipoAtencion = evol.cita?.tipoCita || 'Consulta Externa';
      const esPrimeraConsulta = evol.esPrimeraConsulta ? 'Primera vez' : 'Control';

      doc.fontSize(7).font('Helvetica').fillColor(this.colors.accent)
         .text(`Tipo Consulta: ${tipoEvolucion} | Tipo Atención: ${tipoAtencion} | ${esPrimeraConsulta}`,
               this.margins.left + 10, y + 28);

      y += 40;

      // SOAP en grid 2x2
      const cardWidth = (pageWidth - 8) / 2;
      const cardHeight = 70;
      const secciones = [
        { key: 'S', titulo: 'SUBJETIVO', contenido: this.formatearContenidoEvolucion(evol.subjetivo) },
        { key: 'O', titulo: 'OBJETIVO', contenido: this.formatearContenidoEvolucion(evol.objetivo) },
        { key: 'A', titulo: 'ANÁLISIS', contenido: this.formatearContenidoEvolucion(evol.analisis) },
        { key: 'P', titulo: 'PLAN', contenido: this.formatearContenidoEvolucion(evol.plan) },
      ];

      let cardY = y;
      let cardCol = 0;

      for (const seccion of secciones) {
        const contenido = seccion.contenido?.trim() || 'Sin información';
        const colors = soapColors[seccion.key];
        const cardX = this.margins.left + (cardCol * (cardWidth + 8));

        doc.rect(cardX, cardY, cardWidth, cardHeight)
           .lineWidth(1.5)
           .fillAndStroke(colors.bg, colors.border);

        // Letra grande
        doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.border)
           .text(seccion.key, cardX + 6, cardY + 4);

        // Título
        doc.fontSize(7).font('Helvetica-Bold').fillColor(colors.text)
           .text(seccion.titulo, cardX + 28, cardY + 7);

        // Contenido truncado
        const maxLen = 150;
        const displayContent = contenido.length > maxLen ? contenido.substring(0, maxLen) + '...' : contenido;

        doc.fontSize(7).font('Helvetica').fillColor(this.colors.text)
           .text(displayContent, cardX + 8, cardY + 22, {
             width: cardWidth - 16,
             height: cardHeight - 28,
             ellipsis: true
           });

        cardCol++;
        if (cardCol >= 2) {
          cardCol = 0;
          cardY += cardHeight + 6;
        }
      }

      y = cardY + (cardCol > 0 ? cardHeight + 6 : 0);

      // Firma del médico - Ley 2015/2020 requiere firma digital
      // Formato según documento de referencia: Profesional + RM + Especialidad(es)
      const firmaDoctor = evol.doctor?.doctor?.firma;
      const licencia = evol.doctor?.doctor?.licenciaMedica;

      // Obtener especialidades del doctor
      const especialidades = evol.doctor?.doctor?.especialidades || [];
      const especialidadesTexto = especialidades.length > 0
        ? especialidades.map(e => e.nombre).join(', ')
        : '';

      // Altura dinámica según contenido
      const tieneEspecialidad = especialidadesTexto.length > 0;
      const alturaFirma = firmaDoctor ? 65 : (tieneEspecialidad ? 45 : 35);

      doc.rect(this.margins.left, y, pageWidth, alturaFirma)
         .fill('#f8fafc');

      // Profesional
      doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.text)
         .text(`Profesional: ${nombreMedico}`, this.margins.left + 10, y + 6);

      // Registro Médico
      if (licencia) {
        doc.fontSize(7).font('Helvetica').fillColor(this.colors.textMuted)
           .text(`RM: ${licencia}`, this.margins.left + 10, y + 17);
      }

      // Especialidad(es)
      if (tieneEspecialidad) {
        doc.fontSize(7).font('Helvetica').fillColor(this.colors.primary)
           .text(especialidadesTexto.toUpperCase(), this.margins.left + 10, y + 28);
      }

      // Mostrar imagen de firma digital si existe
      if (firmaDoctor && firmaDoctor.startsWith('data:image')) {
        try {
          const firmaBase64 = firmaDoctor.replace(/^data:image\/\w+;base64,/, '');
          const firmaBuffer = Buffer.from(firmaBase64, 'base64');
          doc.image(firmaBuffer, this.margins.left + pageWidth - 100, y + 5, {
            width: 80,
            height: 50,
            fit: [80, 50]
          });
        } catch (e) {
          // Si falla, mostrar texto de firma
          if (evol.firmada) {
            doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.success)
               .text('✓ FIRMADO DIGITALMENTE', this.margins.left + pageWidth - 100, y + 20);
          }
        }
      } else if (evol.firmada) {
        doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.success)
           .text('✓ FIRMADO', this.margins.left + pageWidth - 60, y + 15);
      }

      y += alturaFirma + 7;
    }

    return y;
  }

  /**
   * Signos vitales inline
   */
  generarSignosVitalesInline(doc, signosVitales, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'REGISTROS DE SIGNOS VITALES', y);

    // Header tabla - incluye IMC y Peso Ideal como en el documento de referencia
    const headers = ['Fecha', 'PA', 'FC', 'FR', 'Temp', 'SpO2', 'Peso', 'Talla', 'IMC', 'Peso Ideal'];
    const colWidths = [65, 50, 35, 30, 35, 35, 40, 40, 45, 60];

    doc.rect(this.margins.left, y, pageWidth, 14).fill(this.colors.headerBg);

    let xPos = this.margins.left + 4;
    doc.fontSize(6).font('Helvetica-Bold').fillColor(this.colors.primary);
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos, y + 4);
      xPos += colWidths[i];
    }
    y += 16;

    for (let i = 0; i < Math.min(signosVitales.length, 15); i++) {
      y = this.verificarEspacio(doc, y, 14);
      const sv = signosVitales[i];
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';

      doc.rect(this.margins.left, y, pageWidth, 13).fill(bgColor);

      const pa = sv.presionSistolica && sv.presionDiastolica
        ? `${sv.presionSistolica}/${sv.presionDiastolica}` : '-';

      // Calcular IMC: peso(kg) / talla(m)²
      let imc = '-';
      if (sv.peso && sv.talla) {
        const tallaM = sv.talla / 100;
        imc = (sv.peso / (tallaM * tallaM)).toFixed(2);
      }

      // Calcular Peso Ideal usando fórmula de Lorentz
      // Hombres: Talla(cm) - 100 - ((Talla - 150) / 4)
      // Mujeres: Talla(cm) - 100 - ((Talla - 150) / 2.5)
      // Usamos promedio si no sabemos el sexo
      let pesoIdeal = '-';
      if (sv.talla) {
        const pesoIdealMin = sv.talla - 100 - ((sv.talla - 150) / 2.5);
        const pesoIdealMax = sv.talla - 100 - ((sv.talla - 150) / 4);
        pesoIdeal = `${pesoIdealMin.toFixed(1)}-${pesoIdealMax.toFixed(1)}`;
      }

      const rowData = [
        this.formatearFechaHoraCorta(sv.fechaRegistro),
        pa,
        sv.frecuenciaCardiaca || '-',
        sv.frecuenciaRespiratoria || '-',
        sv.temperatura ? `${sv.temperatura}°` : '-',
        sv.saturacionOxigeno ? `${sv.saturacionOxigeno}%` : '-',
        sv.peso ? `${sv.peso}kg` : '-',
        sv.talla ? `${sv.talla}cm` : '-',
        imc !== '-' ? `${imc}` : '-',
        pesoIdeal !== '-' ? `${pesoIdeal}kg` : '-',
      ];

      xPos = this.margins.left + 4;
      doc.fontSize(6).font('Helvetica').fillColor(this.colors.text);
      for (let j = 0; j < rowData.length; j++) {
        doc.text(String(rowData[j]), xPos, y + 4);
        xPos += colWidths[j];
      }
      y += 13;
    }

    return y + 10;
  }

  /**
   * Prescripciones inline
   */
  generarPrescripcionesInline(doc, prescripciones, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'PRESCRIPCIONES MÉDICAS', y);

    for (const presc of prescripciones.slice(0, 8)) {
      y = this.verificarEspacio(doc, y, 50);

      const medicamento = presc.medicamentos?.[0]?.producto?.nombre || presc.diagnostico || 'Prescripción';

      doc.rect(this.margins.left, y, pageWidth, 45)
         .lineWidth(1)
         .fillAndStroke('#f0fdf4', this.colors.success);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.success)
         .text(`Rx: ${medicamento}`, this.margins.left + 10, y + 6, { width: pageWidth - 100 });

      doc.fontSize(7).fillColor(this.colors.textMuted)
         .text(this.formatearFechaCorta(presc.fechaPrescripcion), this.margins.left + pageWidth - 70, y + 7);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Dosis: ${presc.dosis || 'N/A'} | Frecuencia: ${presc.frecuencia || 'N/A'} | Vía: ${presc.via || 'Oral'}`,
                this.margins.left + 10, y + 22);

      if (presc.indicaciones) {
        doc.fontSize(7).text(`Indicaciones: ${presc.indicaciones.substring(0, 50)}`, this.margins.left + 10, y + 34);
      }

      y += 50;
    }

    return y + 5;
  }

  /**
   * Órdenes médicas inline
   */
  generarOrdenesMedicasInline(doc, ordenes, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'ÓRDENES MÉDICAS', y);

    for (const orden of ordenes.slice(0, 15)) {
      // Calcular altura dinámica según contenido
      const tieneObservaciones = orden.observaciones && orden.observaciones.trim().length > 0;
      const tieneDescripcion = orden.examenProcedimiento?.descripcion && orden.examenProcedimiento.descripcion.trim().length > 0;
      const alturaBase = 65;
      const alturaExtra = (tieneObservaciones ? 25 : 0) + (tieneDescripcion ? 20 : 0);
      const alturaTotal = alturaBase + alturaExtra;

      y = this.verificarEspacio(doc, y, alturaTotal + 10);

      const colorEstado = orden.estado === 'Completada' ? this.colors.success :
                          orden.estado === 'Ejecutada' ? this.colors.accent :
                          orden.estado === 'Pendiente' ? this.colors.warning : this.colors.textLight;

      // Box de la orden
      doc.rect(this.margins.left, y, pageWidth, alturaTotal)
         .lineWidth(1)
         .fillAndStroke('#fafafa', this.colors.border);

      // Header con tipo y estado
      doc.rect(this.margins.left, y, pageWidth, 18)
         .fill(this.colors.primary);

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
         .text(`${orden.tipo || 'Orden Médica'}`, this.margins.left + 10, y + 4);

      doc.fontSize(8).fillColor('#ffffff')
         .text(orden.estado || 'Pendiente', this.margins.left + pageWidth - 80, y + 4);

      y += 22;

      // Nombre del examen/procedimiento si existe
      const nombreExamen = orden.examenProcedimiento?.nombre || 'Examen no especificado';
      const codigoExamen = orden.examenProcedimiento?.codigo || '';

      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text(codigoExamen ? `[${codigoExamen}] ${nombreExamen}` : nombreExamen,
               this.margins.left + 10, y, { width: pageWidth - 20 });

      y += 14;

      // Descripción del examen (si existe)
      if (tieneDescripcion) {
        doc.fontSize(7).font('Helvetica-Oblique').fillColor(this.colors.textLight)
           .text(`Descripción: ${orden.examenProcedimiento.descripcion.substring(0, 100)}`,
                 this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 14;
      }

      // Observaciones/Notas del médico (si existen)
      if (tieneObservaciones) {
        doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
           .text(`📝 Nota: ${orden.observaciones.substring(0, 150)}`,
                 this.margins.left + 10, y, { width: pageWidth - 20 });
        y += 18;
      }

      // Detalles adicionales
      const medicoNombre = orden.doctor ? `Dr(a). ${orden.doctor.nombre} ${orden.doctor.apellido}` :
                           orden.medicoOrdenante ? `Dr(a). ${orden.medicoOrdenante.nombre} ${orden.medicoOrdenante.apellido}` : 'N/A';

      doc.fontSize(7).font('Helvetica').fillColor(this.colors.textMuted)
         .text(`Fecha: ${this.formatearFechaCorta(orden.fechaOrden || orden.createdAt)} | Ordenado por: ${medicoNombre}`,
               this.margins.left + 10, y);

      // Si tiene resultados, mostrar indicador
      if (orden.resultados) {
        doc.fontSize(7).fillColor(this.colors.success)
           .text('✓ Con resultados', this.margins.left + pageWidth - 80, y);
      }

      y += 18;
    }

    return y + 5;
  }

  /**
   * Procedimientos inline
   */
  generarProcedimientosInline(doc, procedimientos, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'PROCEDIMIENTOS (CUPS)', y);

    for (const proc of procedimientos.slice(0, 6)) {
      y = this.verificarEspacio(doc, y, 50);

      doc.rect(this.margins.left, y, pageWidth, 45)
         .stroke(this.colors.border);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text(`[${proc.codigoCUPS || 'S/C'}] ${proc.nombre || 'Procedimiento'}`, this.margins.left + 10, y + 6);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Estado: ${proc.estado || 'N/A'} | Fecha: ${this.formatearFechaCorta(proc.fechaProgramada)}`,
               this.margins.left + 10, y + 20);

      const medico = proc.medicoResponsable ? `Dr(a). ${proc.medicoResponsable.nombre} ${proc.medicoResponsable.apellido}` : 'N/A';
      doc.fontSize(7).fillColor(this.colors.textMuted)
         .text(`Médico: ${medico}`, this.margins.left + 10, y + 34);

      y += 50;
    }

    return y + 5;
  }

  /**
   * Cirugías inline
   */
  generarCirugiasInline(doc, cirugias, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'PROCEDIMIENTOS QUIRÚRGICOS', y);

    for (const cirugia of cirugias.slice(0, 5)) {
      y = this.verificarEspacio(doc, y, 60);

      doc.rect(this.margins.left, y, pageWidth, 55)
         .lineWidth(1)
         .fillAndStroke('#faf5ff', '#9333ea');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#9333ea')
         .text(cirugia.nombre || cirugia.tipoCirugia || 'Cirugía', this.margins.left + 10, y + 6);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Fecha: ${this.formatearFechaHora(cirugia.fechaProgramada)}`, this.margins.left + 10, y + 22)
         .text(`Estado: ${cirugia.estado || 'N/A'}`, this.margins.left + pageWidth - 120, y + 22);

      const cirujano = cirugia.medicoResponsable ? `Dr(a). ${cirugia.medicoResponsable.nombre} ${cirugia.medicoResponsable.apellido}` : 'N/A';
      doc.fontSize(7).fillColor(this.colors.textMuted)
         .text(`Cirujano: ${cirujano}`, this.margins.left + 10, y + 38);

      y += 60;
    }

    return y + 5;
  }

  /**
   * Interconsultas inline
   */
  generarInterconsultasInline(doc, interconsultas, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'INTERCONSULTAS', y);

    for (const ic of interconsultas.slice(0, 6)) {
      y = this.verificarEspacio(doc, y, 45);

      doc.rect(this.margins.left, y, pageWidth, 40)
         .stroke(this.colors.border);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.secondary)
         .text(`Especialidad: ${ic.especialidadDestino || 'N/A'}`, this.margins.left + 10, y + 6);

      doc.fontSize(8).fillColor(ic.estado === 'Respondida' ? this.colors.success : this.colors.warning)
         .text(ic.estado || 'Pendiente', this.margins.left + pageWidth - 80, y + 6);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Motivo: ${(ic.motivo || 'N/A').substring(0, 60)}`, this.margins.left + 10, y + 20);

      doc.fontSize(7).fillColor(this.colors.textMuted)
         .text(this.formatearFechaCorta(ic.fechaSolicitud), this.margins.left + 10, y + 32);

      y += 44;
    }

    return y + 5;
  }

  /**
   * Notas de enfermería inline
   */
  generarNotasEnfermeriaInline(doc, notas, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'NOTAS DE ENFERMERÍA', y);

    for (const nota of notas.slice(0, 8)) {
      y = this.verificarEspacio(doc, y, 40);

      doc.rect(this.margins.left, y, pageWidth, 35)
         .fill('#fdf2f8');

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#be185d')
         .text(this.formatearFechaHora(nota.fechaHora), this.margins.left + 10, y + 5);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text((nota.contenido || nota.nota || 'N/A').substring(0, 80), this.margins.left + 10, y + 18, { width: pageWidth - 20 });

      y += 38;
    }

    return y + 5;
  }

  /**
   * Laboratorios inline
   */
  generarLaboratoriosInline(doc, laboratorios, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'RESULTADOS DE LABORATORIO', y);

    for (const lab of laboratorios.slice(0, 8)) {
      y = this.verificarEspacio(doc, y, 35);

      doc.rect(this.margins.left, y, pageWidth, 30)
         .stroke(this.colors.border);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.text)
         .text(lab.examenProcedimiento?.nombre || lab.descripcion || 'Examen', this.margins.left + 10, y + 6);

      doc.fontSize(7).fillColor(lab.estado === 'Completada' ? this.colors.success : this.colors.warning)
         .text(lab.estado || 'Pendiente', this.margins.left + pageWidth - 70, y + 6);

      doc.fontSize(7).font('Helvetica').fillColor(this.colors.textMuted)
         .text(this.formatearFechaCorta(lab.fechaOrden), this.margins.left + 10, y + 20);

      y += 33;
    }

    return y + 5;
  }

  /**
   * Antecedentes estructurados - según Resolución 1995/1999
   * Incluye: Patológicos, Quirúrgicos, Alérgicos, Familiares, Farmacológicos, Gineco-Obstétricos
   */
  generarAntecedentesEstructurados(doc, antecedentes, paciente, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'ANTECEDENTES CLÍNICOS', y);

    // === ANTECEDENTES PATOLÓGICOS ===
    if (antecedentes.patologicos && antecedentes.patologicos.length > 0) {
      y = this.verificarEspacio(doc, y, 30);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text('» Patológicos:', this.margins.left + 5, y);
      y += 14;

      const patologicosTexto = antecedentes.patologicos.map(p => {
        let texto = p.enfermedad;
        if (p.codigoCIE10) texto += ` (${p.codigoCIE10})`;
        if (p.enTratamiento) texto += ' - En tratamiento';
        return texto;
      }).join(', ');

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(patologicosTexto || 'Ninguno reportado', this.margins.left + 10, y, { width: pageWidth - 20 });
      y += doc.heightOfString(patologicosTexto || 'Ninguno reportado', { width: pageWidth - 20 }) + 8;
    }

    // === ANTECEDENTES QUIRÚRGICOS ===
    if (antecedentes.quirurgicos && antecedentes.quirurgicos.length > 0) {
      y = this.verificarEspacio(doc, y, 30);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text('» Quirúrgicos:', this.margins.left + 5, y);
      y += 14;

      const quirurgicosTexto = antecedentes.quirurgicos.map(q => {
        let texto = q.procedimiento;
        if (q.codigoCUPS) texto += ` (CUPS: ${q.codigoCUPS})`;
        if (q.fecha) texto += ` - ${this.formatearFechaCorta(q.fecha)}`;
        return texto;
      }).join(', ');

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(quirurgicosTexto || 'Sin antecedentes', this.margins.left + 10, y, { width: pageWidth - 20 });
      y += doc.heightOfString(quirurgicosTexto || 'Sin antecedentes', { width: pageWidth - 20 }) + 8;
    }

    // === ANTECEDENTES ALÉRGICOS ===
    y = this.verificarEspacio(doc, y, 30);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.danger)
       .text('» Alergias:', this.margins.left + 5, y);
    y += 14;

    if (antecedentes.alergicos && antecedentes.alergicos.length > 0) {
      const alergiasTexto = antecedentes.alergicos.map(a => {
        let texto = a.sustancia;
        if (a.tipoAlergia) texto = `${a.tipoAlergia}: ${texto}`;
        if (a.severidad) texto += ` (${a.severidad})`;
        return texto;
      }).join(', ');

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(alergiasTexto, this.margins.left + 10, y, { width: pageWidth - 20 });
      y += doc.heightOfString(alergiasTexto, { width: pageWidth - 20 }) + 8;
    } else {
      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(paciente.alergias || 'Ninguna conocida', this.margins.left + 10, y);
      y += 14;
    }

    // === ANTECEDENTES FARMACOLÓGICOS ===
    y = this.verificarEspacio(doc, y, 30);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('» Farmacológicos:', this.margins.left + 5, y);
    y += 14;

    if (antecedentes.farmacologicos && antecedentes.farmacologicos.length > 0) {
      const farmacosTexto = antecedentes.farmacologicos.map(f => {
        let texto = f.medicamento;
        if (f.dosis) texto += ` ${f.dosis}`;
        if (f.frecuencia) texto += ` ${f.frecuencia}`;
        return texto;
      }).join(', ');

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(farmacosTexto, this.margins.left + 10, y, { width: pageWidth - 20 });
      y += doc.heightOfString(farmacosTexto, { width: pageWidth - 20 }) + 8;
    } else {
      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(paciente.medicamentosActuales || 'Ninguno actual', this.margins.left + 10, y);
      y += 14;
    }

    // === ANTECEDENTES FAMILIARES ===
    if (antecedentes.familiares && antecedentes.familiares.length > 0) {
      y = this.verificarEspacio(doc, y, 30);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text('» Familiares:', this.margins.left + 5, y);
      y += 14;

      const familiaresTexto = antecedentes.familiares.map(f => {
        let texto = `${f.parentesco}: ${f.enfermedad}`;
        if (f.codigoCIE10) texto += ` (${f.codigoCIE10})`;
        return texto;
      }).join(', ');

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(familiaresTexto, this.margins.left + 10, y, { width: pageWidth - 20 });
      y += doc.heightOfString(familiaresTexto, { width: pageWidth - 20 }) + 8;
    }

    // === ANTECEDENTES GINECO-OBSTÉTRICOS (solo si es mujer y tiene datos) ===
    if (antecedentes.ginecoObstetrico && paciente.genero?.toLowerCase().includes('fem')) {
      y = this.verificarEspacio(doc, y, 40);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text('» Gineco-Obstétricos:', this.margins.left + 5, y);
      y += 14;

      const go = antecedentes.ginecoObstetrico;
      const ciclos = go.cicloMenstrual || 'No reportado';
      const formulaGest = `G${go.gestas || 0}C${go.cesareas || 0}P${go.partos || 0}A${go.abortos || 0}`;

      const ginecoTexto = `Ciclos: ${ciclos}, Fórmula Gestacional: ${formulaGest}`;

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(ginecoTexto, this.margins.left + 10, y, { width: pageWidth - 20 });
      y += 18;
    }

    return y + 10;
  }

  /**
   * Paraclínicos - Resultados de laboratorio con fechas (según documento de referencia)
   */
  generarParaclinicosInline(doc, paraclinicos, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'PARACLÍNICOS', y);

    // Agrupar por fecha
    const porFecha = {};
    for (const p of paraclinicos) {
      const fecha = this.formatearFechaCorta(p.fechaOrden || p.fechaEjecucion);
      if (!porFecha[fecha]) porFecha[fecha] = [];
      porFecha[fecha].push(p);
    }

    // Mostrar resultados agrupados por fecha
    for (const [fecha, items] of Object.entries(porFecha)) {
      y = this.verificarEspacio(doc, y, 40);

      // Fecha como encabezado
      doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text(fecha, this.margins.left + 5, y);
      y += 12;

      // Resultados de esa fecha
      for (const item of items.slice(0, 5)) {
        const nombreExamen = item.examenProcedimiento?.nombre || item.descripcion || 'Examen';
        const resultado = item.resultados || 'Pendiente';

        doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
           .text(`${nombreExamen}: ${resultado.substring(0, 100)}`, this.margins.left + 10, y, { width: pageWidth - 20 });
        y += doc.heightOfString(`${nombreExamen}: ${resultado.substring(0, 100)}`, { width: pageWidth - 20 }) + 4;
      }

      y += 6;
    }

    return y + 5;
  }

  /**
   * Formulación detallada - según documento de referencia
   * Formato: Medicamento + Dosis + Vía + Frecuencia + Duración
   */
  generarFormulacionInline(doc, prescripciones, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'FORMULACIÓN', y);

    for (const presc of prescripciones.slice(0, 10)) {
      y = this.verificarEspacio(doc, y, 35);

      // Si tiene medicamentos detallados
      if (presc.medicamentos && presc.medicamentos.length > 0) {
        for (const med of presc.medicamentos) {
          const nombreMed = med.producto?.nombre || med.nombreMedicamento || 'Medicamento';
          const dosis = med.dosis || presc.dosis || '';
          const via = med.viaAdministracion || presc.via || 'Oral';
          const frecuencia = med.frecuencia || presc.frecuencia || '';
          const duracion = med.duracionDias ? `por ${med.duracionDias} Día(s)` : '';

          // Formato: » Medicamento Dosis Tomar X vía Y cada Z Hora(s) por N Día(s).
          const textoFormulacion = `» ${nombreMed} ${dosis} Tomar vía ${via} cada ${frecuencia} ${duracion}.`.trim();

          doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
             .text(textoFormulacion, this.margins.left + 5, y, { width: pageWidth - 10 });
          y += doc.heightOfString(textoFormulacion, { width: pageWidth - 10 }) + 6;
        }
      } else {
        // Usar datos de la prescripción directamente
        const nombreMed = presc.diagnostico || 'Prescripción';
        const dosis = presc.dosis || '';
        const via = presc.via || 'Oral';
        const frecuencia = presc.frecuencia || '';

        const textoFormulacion = `» ${nombreMed} ${dosis} vía ${via} ${frecuencia}`.trim();

        doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
           .text(textoFormulacion, this.margins.left + 5, y, { width: pageWidth - 10 });
        y += doc.heightOfString(textoFormulacion, { width: pageWidth - 10 }) + 6;
      }
    }

    return y + 5;
  }

  /**
   * Exámenes ordenados con códigos CUPS - según documento de referencia
   */
  generarExamenesOrdenadosInline(doc, examenes, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'EXÁMENES ORDENADOS (Pendientes) - CUPS', y);

    // Agrupar por tipo de examen
    const examenesPorTipo = {};
    examenes.forEach(examen => {
      const tipo = examen.tipo || examen.examenProcedimiento?.tipo || 'Otros';
      if (!examenesPorTipo[tipo]) examenesPorTipo[tipo] = [];
      examenesPorTipo[tipo].push(examen);
    });

    for (const [tipo, listaExamenes] of Object.entries(examenesPorTipo)) {
      y = this.verificarEspacio(doc, y, 30);

      // Subtítulo por tipo
      doc.rect(this.margins.left, y, pageWidth, 16)
         .fill('#f0f9ff');

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0369a1')
         .text(tipo.toUpperCase(), this.margins.left + 10, y + 4);

      y += 20;

      for (const examen of listaExamenes.slice(0, 15)) {
        const tieneObservaciones = examen.observaciones && examen.observaciones.trim().length > 0;
        const tieneDescripcion = examen.examenProcedimiento?.descripcion && examen.examenProcedimiento.descripcion.trim().length > 0;
        const alturaItem = 22 + (tieneObservaciones ? 16 : 0) + (tieneDescripcion ? 12 : 0);

        y = this.verificarEspacio(doc, y, alturaItem);

        // Obtener código CUPS del modelo ExamenProcedimiento
        const codigoCUPS = examen.examenProcedimiento?.codigoCUPS || '';
        const nombre = examen.examenProcedimiento?.nombre || 'Examen';
        const descripcion = examen.examenProcedimiento?.descripcion || '';
        const estado = examen.estado || 'Pendiente';
        const fecha = this.formatearFechaCorta(examen.fechaOrden || examen.createdAt);

        // Icono de estado
        const colorEstado = estado === 'Pendiente' ? this.colors.warning :
                           estado === 'Ejecutada' ? this.colors.accent : this.colors.success;

        // Bullet con código CUPS
        doc.circle(this.margins.left + 8, y + 5, 3).fill(colorEstado);

        // Mostrar código CUPS prominente
        if (codigoCUPS) {
          doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.primary)
             .text(`CUPS: ${codigoCUPS}`, this.margins.left + 15, y);
          doc.font('Helvetica').fillColor(this.colors.text)
             .text(nombre, this.margins.left + 95, y, { width: pageWidth - 200 });
        } else {
          doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.textMuted)
             .text('CUPS: N/A', this.margins.left + 15, y);
          doc.font('Helvetica').fillColor(this.colors.text)
             .text(nombre, this.margins.left + 75, y, { width: pageWidth - 180 });
        }

        // Estado y fecha
        doc.fontSize(7).fillColor(colorEstado)
           .text(estado, this.margins.left + pageWidth - 100, y);

        doc.fillColor(this.colors.textMuted)
           .text(fecha, this.margins.left + pageWidth - 55, y);

        y += 14;

        // Mostrar descripción del examen si existe
        if (tieneDescripcion) {
          doc.fontSize(7).font('Helvetica').fillColor(this.colors.textLight)
             .text(`   Descripción: ${descripcion.substring(0, 100)}`,
                   this.margins.left + 15, y, { width: pageWidth - 30 });
          y += 12;
        }

        // Mostrar observaciones/notas si existen
        if (tieneObservaciones) {
          doc.fontSize(7).font('Helvetica-Oblique').fillColor(this.colors.textLight)
             .text(`   → Nota: ${examen.observaciones.substring(0, 120)}`,
                   this.margins.left + 15, y, { width: pageWidth - 30 });
          y += 16;
        }
      }
    }

    return y + 10;
  }

  /**
   * Imagenología inline
   */
  generarImagenologiaInline(doc, estudios, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'ESTUDIOS DE IMAGENOLOGÍA', y);

    for (const estudio of estudios.slice(0, 6)) {
      y = this.verificarEspacio(doc, y, 40);

      doc.rect(this.margins.left, y, pageWidth, 35)
         .fill('#f0f9ff');

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0369a1')
         .text(estudio.tipoEstudio || 'Estudio', this.margins.left + 10, y + 6);

      doc.fontSize(7).fillColor(estudio.estado === 'Completado' ? this.colors.success : this.colors.warning)
         .text(estudio.estado || 'Pendiente', this.margins.left + pageWidth - 70, y + 6);

      doc.fontSize(7).font('Helvetica').fillColor(this.colors.text)
         .text(`Región: ${estudio.regionAnatomica || 'N/A'}`, this.margins.left + 10, y + 20);

      doc.fontSize(7).fillColor(this.colors.textMuted)
         .text(this.formatearFechaCorta(estudio.fechaSolicitud), this.margins.left + pageWidth - 70, y + 20);

      y += 38;
    }

    return y + 5;
  }

  /**
   * Urgencias inline
   */
  generarUrgenciasInline(doc, urgencias, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'ATENCIONES DE URGENCIAS', y);

    for (const urg of urgencias.slice(0, 5)) {
      y = this.verificarEspacio(doc, y, 55);

      const colorTriaje = urg.categoriaManchester === 'Rojo' ? this.colors.danger :
                          urg.categoriaManchester === 'Naranja' ? '#f97316' :
                          urg.categoriaManchester === 'Amarillo' ? this.colors.warning : this.colors.success;

      doc.rect(this.margins.left, y, pageWidth, 50)
         .lineWidth(2)
         .fillAndStroke('#fef2f2', colorTriaje);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(colorTriaje)
         .text(`TRIAJE ${urg.categoriaManchester || 'N/A'}`, this.margins.left + 10, y + 6);

      doc.fontSize(7).fillColor(this.colors.text)
         .text(this.formatearFechaHora(urg.horaLlegada), this.margins.left + pageWidth - 120, y + 7);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Motivo: ${(urg.motivoConsulta || 'N/A').substring(0, 60)}`, this.margins.left + 10, y + 22);

      doc.fontSize(7).fillColor(this.colors.textMuted)
         .text(`Disposición: ${urg.disposicion || urg.estado || 'N/A'}`, this.margins.left + 10, y + 38);

      y += 55;
    }

    return y + 5;
  }

  /**
   * Hospitalizaciones inline
   */
  generarHospitalizacionesInline(doc, hospitalizaciones, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    y = this.generarTituloSeccion(doc, 'HOSPITALIZACIONES Y EPICRISIS', y);

    for (const hosp of hospitalizaciones.slice(0, 4)) {
      y = this.verificarEspacio(doc, y, 70);

      doc.rect(this.margins.left, y, pageWidth, 65)
         .lineWidth(1)
         .fillAndStroke('#eef2ff', '#6366f1');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#6366f1')
         .text(`ADMISIÓN - ${hosp.unidad?.nombre || 'Unidad'}`, this.margins.left + 10, y + 6);

      doc.fontSize(7).fillColor(hosp.estado === 'Activa' ? this.colors.success : this.colors.textMuted)
         .text(hosp.estado || 'N/A', this.margins.left + pageWidth - 60, y + 7);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Habitación: ${hosp.cama?.habitacion?.numero || 'N/A'} | Cama: ${hosp.cama?.numero || 'N/A'}`,
               this.margins.left + 10, y + 22);

      const diasEstancia = this.calcularDiasEstancia(hosp.fechaIngreso, hosp.fechaEgreso);
      doc.text(`Ingreso: ${this.formatearFechaCorta(hosp.fechaIngreso)} | Estancia: ${diasEstancia} días`,
               this.margins.left + 10, y + 36);

      if (hosp.diagnosticoIngreso) {
        doc.fontSize(7).fillColor(this.colors.textMuted)
           .text(`Dx: ${hosp.diagnosticoIngreso.substring(0, 60)}`, this.margins.left + 10, y + 50);
      }

      y += 70;
    }

    return y + 5;
  }

  /**
   * Constancia de autenticidad final (sin resumen estadístico)
   */
  generarResumenFinal(doc, datos, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Constancia de autenticidad y cumplimiento normativo
    doc.rect(this.margins.left, y, pageWidth, 120)
       .lineWidth(2)
       .fillAndStroke(this.colors.headerBg, this.colors.primary);

    y += 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('CONSTANCIA DE AUTENTICIDAD Y CUMPLIMIENTO NORMATIVO', this.margins.left + 15, y);

    y += 16;
    doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
       .text('Este documento es una copia fiel de la Historia Clínica Electrónica almacenada en el sistema de información de ' +
             `${datos.institucion.nombre}. El contenido cumple con la normatividad colombiana vigente:`,
             this.margins.left + 15, y, { width: pageWidth - 30 });

    y += 24;
    doc.fontSize(7).fillColor(this.colors.textMuted)
       .text('• Res. 1995/1999 - Historia Clínica | • Ley 2015/2020 - Interoperabilidad HCE | • Res. 866/2021 - Datos Clínicos | • Ley 1581/2012 - Habeas Data',
             this.margins.left + 15, y, { width: pageWidth - 30 });

    y += 18;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.text)
       .text(`Generado: ${this.formatearFechaHoraCompleta(datos.fechaGeneracion)} | Hash: ${this.generarHashSimple(datos.paciente.id)}`, this.margins.left + 15, y);

    y += 12;
    doc.fontSize(6).font('Helvetica-Oblique').fillColor(this.colors.textMuted)
       .text('ADVERTENCIA: La divulgación no autorizada de esta información está penada por la Ley 1581 de 2012.',
             this.margins.left + 15, y, { width: pageWidth - 30, align: 'center' });
  }

  /**
   * Identificación del paciente compacta (sin antecedentes separados)
   */
  generarIdentificacionPacienteCompacta(doc, paciente) {
    this.generarEncabezadoSeccion(doc, 'IDENTIFICACIÓN DEL PACIENTE');

    let y = 130;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Tarjeta principal compacta
    doc.rect(this.margins.left, y, pageWidth, 80)
       .lineWidth(1)
       .fillAndStroke(this.colors.headerBg, this.colors.primary);

    // Foto placeholder
    const fotoX = this.margins.left + 10;
    const fotoY = y + 8;
    const fotoSize = 64;

    if (paciente.fotoUrl) {
      try {
        if (paciente.fotoUrl.startsWith('data:image')) {
          const base64Data = paciente.fotoUrl.replace(/^data:image\/\w+;base64,/, '');
          const fotoBuffer = Buffer.from(base64Data, 'base64');
          doc.image(fotoBuffer, fotoX, fotoY, { width: fotoSize, height: fotoSize, fit: [fotoSize, fotoSize] });
        } else {
          this.dibujarFotoPlaceholder(doc, fotoX, fotoY, fotoSize);
        }
      } catch (e) {
        this.dibujarFotoPlaceholder(doc, fotoX, fotoY, fotoSize);
      }
    } else {
      this.dibujarFotoPlaceholder(doc, fotoX, fotoY, fotoSize);
    }

    // Datos principales
    const dataX = fotoX + fotoSize + 15;
    const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim().toUpperCase();

    doc.fontSize(14).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text(nombreCompleto || 'NOMBRE NO REGISTRADO', dataX, y + 10, { width: pageWidth - fotoSize - 40 });

    doc.fontSize(10).font('Helvetica').fillColor(this.colors.text)
       .text(`${paciente.tipoDocumento || 'CC'}: ${paciente.cedula || 'N/A'}`, dataX, y + 30);

    doc.fontSize(9).fillColor(this.colors.textLight)
       .text(`Edad: ${this.calcularEdad(paciente.fechaNacimiento)} | Sexo: ${paciente.genero || 'N/A'} | Sangre: ${paciente.tipoSangre || 'N/A'}`, dataX, y + 45);

    doc.text(`EPS: ${paciente.eps || 'N/A'} | Régimen: ${paciente.regimen || 'N/A'}`, dataX, y + 58);

    y += 90;

    // Datos de contacto compactos
    doc.rect(this.margins.left, y, pageWidth, 45)
       .fill('#f8fafc');

    y += 8;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('CONTACTO', this.margins.left + 10, y);

    y += 12;
    doc.fontSize(9).font('Helvetica').fillColor(this.colors.text)
       .text(`Tel: ${paciente.telefono || 'N/A'} | Email: ${paciente.email || 'N/A'}`, this.margins.left + 10, y);

    doc.text(`Dirección: ${paciente.direccion || 'N/A'}, ${paciente.municipio || ''} ${paciente.departamento || ''}`, this.margins.left + 10, y + 13);

    y += 45;

    // Antecedentes resumidos
    y = this.generarAntecedentesResumidos(doc, paciente, y);
  }

  /**
   * Antecedentes en formato resumido
   */
  generarAntecedentesResumidos(doc, paciente, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.rect(this.margins.left, y, pageWidth, 22)
       .fill(this.colors.primary);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
       .text('ANTECEDENTES CLÍNICOS', this.margins.left + 10, y + 6);

    y += 28;

    const items = [
      ['Alergias', paciente.alergias || 'Ninguna conocida'],
      ['Enf. Crónicas', paciente.enfermedadesCronicas || 'Ninguna reportada'],
      ['Medicamentos', paciente.medicamentosActuales || 'Ninguno actual'],
      ['Quirúrgicos', paciente.antecedentesQuirurgicos || 'Sin antecedentes'],
    ];

    for (const [label, value] of items) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.textMuted)
         .text(label + ':', this.margins.left + 10, y);
      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text)
         .text(value.substring(0, 80) + (value.length > 80 ? '...' : ''), this.margins.left + 90, y, { width: pageWidth - 100 });
      y += 16;
    }

    return y + 10;
  }

  /**
   * Alertas en formato compacto
   */
  generarAlertasCompactas(doc, alertas, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(this.colors.danger)
       .text('⚠ ALERTAS ACTIVAS', this.margins.left, y);
    y += 18;

    for (const alerta of alertas.slice(0, 5)) {
      const colorFondo = alerta.tipo === 'Alergia' ? this.colors.dangerBg : this.colors.warningBg;
      const colorBorde = alerta.tipo === 'Alergia' ? this.colors.danger : this.colors.warning;

      doc.rect(this.margins.left, y, pageWidth, 22)
         .fillAndStroke(colorFondo, colorBorde);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(colorBorde)
         .text(`${alerta.tipo || 'ALERTA'}: ${alerta.titulo || 'Sin título'}`, this.margins.left + 8, y + 6, { width: pageWidth - 16 });

      y += 26;
    }

    return y + 10;
  }

  /**
   * Diagnósticos en formato compacto (tabla)
   */
  generarDiagnosticosCompactos(doc, diagnosticos, y) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('DIAGNÓSTICOS (CIE-10/CIE-11)', this.margins.left, y);
    y += 18;

    // Header de tabla
    doc.rect(this.margins.left, y, pageWidth, 18).fill(this.colors.primary);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
       .text('Código', this.margins.left + 5, y + 5)
       .text('Descripción', this.margins.left + 70, y + 5)
       .text('Tipo', this.margins.left + pageWidth - 100, y + 5)
       .text('Fecha', this.margins.left + pageWidth - 55, y + 5);
    y += 20;

    for (const diag of diagnosticos.slice(0, 10)) {
      const bgColor = diagnosticos.indexOf(diag) % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(this.margins.left, y, pageWidth, 18).fill(bgColor);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(diag.codigoCIE11 || diag.codigoCIE10 || '-', this.margins.left + 5, y + 5)
         .text((diag.descripcionCIE11 || diag.descripcion || 'N/A').substring(0, 50), this.margins.left + 70, y + 5)
         .text(diag.tipoDiagnostico || 'Principal', this.margins.left + pageWidth - 100, y + 5)
         .text(this.formatearFechaCorta(diag.fechaDiagnostico), this.margins.left + pageWidth - 55, y + 5);
      y += 18;
    }

    return y + 10;
  }

  /**
   * Evoluciones SOAP con diseño mejorado y compacto
   */
  generarSeccionEvolucionesCompacta(doc, evoluciones) {
    this.generarEncabezadoSeccion(doc, 'EVOLUCIONES MÉDICAS (SOAP)');

    let y = 130;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Colores SOAP profesionales
    const soapColors = {
      S: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },  // Sky/Azul
      O: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },  // Green
      A: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },  // Amber
      P: { bg: '#f3e8ff', border: '#9333ea', text: '#7c3aed' },  // Purple
    };

    for (let i = 0; i < evoluciones.length; i++) {
      const evol = evoluciones[i];

      // Verificar espacio para encabezado de evolución
      if (y > doc.page.height - 200) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'EVOLUCIONES MÉDICAS (Continuación)');
        y = 130;
      }

      // === ENCABEZADO DE EVOLUCIÓN ===
      doc.rect(this.margins.left, y, pageWidth, 24)
         .fill(this.colors.primary);

      const nombreMedico = evol.doctor ? `Dr(a). ${evol.doctor.nombre} ${evol.doctor.apellido}` : 'N/A';

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
         .text(`EVOLUCIÓN #${evoluciones.length - i}`, this.margins.left + 10, y + 7);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.accent)
         .text(`${this.formatearFechaHora(evol.fechaEvolucion)} | ${nombreMedico}`, this.margins.left + pageWidth - 250, y + 8);

      y += 30;

      // === TARJETAS SOAP EN GRID 2x2 ===
      const secciones = [
        { key: 'S', titulo: 'SUBJETIVO', contenido: this.formatearContenidoEvolucion(evol.subjetivo) },
        { key: 'O', titulo: 'OBJETIVO', contenido: this.formatearContenidoEvolucion(evol.objetivo) },
        { key: 'A', titulo: 'ANÁLISIS', contenido: this.formatearContenidoEvolucion(evol.analisis) },
        { key: 'P', titulo: 'PLAN', contenido: this.formatearContenidoEvolucion(evol.plan) },
      ];

      const cardWidth = (pageWidth - 10) / 2;
      const cardHeight = 80;
      let cardY = y;
      let cardCol = 0;

      for (const seccion of secciones) {
        const contenido = seccion.contenido?.trim() || 'Sin información';
        const colors = soapColors[seccion.key];
        const cardX = this.margins.left + (cardCol * (cardWidth + 10));

        // Verificar si necesitamos nueva página
        if (cardY + cardHeight > doc.page.height - 100) {
          doc.addPage();
          cardY = 60;
        }

        // Fondo de tarjeta
        doc.rect(cardX, cardY, cardWidth, cardHeight)
           .lineWidth(2)
           .fillAndStroke(colors.bg, colors.border);

        // Letra indicadora
        doc.fontSize(20).font('Helvetica-Bold').fillColor(colors.border)
           .text(seccion.key, cardX + 8, cardY + 5);

        // Título
        doc.fontSize(8).font('Helvetica-Bold').fillColor(colors.text)
           .text(seccion.titulo, cardX + 35, cardY + 8);

        // Contenido (truncado si es muy largo)
        const maxContentLength = 180;
        const displayContent = contenido.length > maxContentLength
          ? contenido.substring(0, maxContentLength) + '...'
          : contenido;

        doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
           .text(displayContent, cardX + 10, cardY + 25, {
             width: cardWidth - 20,
             height: cardHeight - 35,
             ellipsis: true
           });

        cardCol++;
        if (cardCol >= 2) {
          cardCol = 0;
          cardY += cardHeight + 8;
        }
      }

      // Si terminamos en columna impar, ajustar Y
      if (cardCol > 0) {
        cardY += cardHeight + 8;
      }

      y = cardY;

      // === FIRMA COMPACTA ===
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 60;
      }

      doc.rect(this.margins.left, y, pageWidth, 35)
         .fill('#f8fafc');

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.textMuted)
         .text(`Firmado por: ${nombreMedico}`, this.margins.left + 10, y + 8);

      const licencia = evol.doctor?.doctor?.licenciaMedica;
      if (licencia) {
        doc.text(`Reg. Médico: ${licencia}`, this.margins.left + 10, y + 20);
      }

      if (evol.firmada) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.success)
           .text('✓ FIRMADO DIGITALMENTE', this.margins.left + pageWidth - 130, y + 12);
      }

      y += 45;

      // Separador entre evoluciones
      if (i < evoluciones.length - 1) {
        doc.moveTo(this.margins.left, y - 5)
           .lineTo(this.margins.left + pageWidth, y - 5)
           .lineWidth(1)
           .stroke(this.colors.border);
      }
    }
  }

  /**
   * Signos vitales en formato tabla compacta
   */
  generarSignosVitalesCompactos(doc, signosVitales, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Título
    doc.rect(this.margins.left, y, pageWidth, 22)
       .fill(this.colors.primary);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
       .text('SIGNOS VITALES', this.margins.left + 10, y + 6);

    y += 28;

    // Header de tabla
    const headers = ['Fecha', 'PA', 'FC', 'FR', 'Temp', 'SpO2', 'Peso', 'Talla'];
    const colWidths = [85, 65, 50, 45, 50, 50, 55, 55];

    doc.rect(this.margins.left, y, pageWidth, 16).fill(this.colors.headerBg);

    let xPos = this.margins.left + 5;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(this.colors.primary);
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos, y + 4);
      xPos += colWidths[i];
    }
    y += 18;

    // Filas de datos (máximo 10)
    for (const sv of signosVitales.slice(0, 10)) {
      const bgColor = signosVitales.indexOf(sv) % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(this.margins.left, y, pageWidth, 16).fill(bgColor);

      const pa = sv.presionSistolica && sv.presionDiastolica
        ? `${sv.presionSistolica}/${sv.presionDiastolica}` : '-';

      const rowData = [
        this.formatearFechaHoraCorta(sv.fechaRegistro),
        pa,
        sv.frecuenciaCardiaca || '-',
        sv.frecuenciaRespiratoria || '-',
        sv.temperatura ? `${sv.temperatura}°` : '-',
        sv.saturacionOxigeno ? `${sv.saturacionOxigeno}%` : '-',
        sv.peso ? `${sv.peso}kg` : '-',
        sv.talla ? `${sv.talla}cm` : '-',
      ];

      xPos = this.margins.left + 5;
      doc.fontSize(7).font('Helvetica').fillColor(this.colors.text);
      for (let i = 0; i < rowData.length; i++) {
        doc.text(String(rowData[i]), xPos, y + 4);
        xPos += colWidths[i];
      }
      y += 16;
    }

    return y + 15;
  }

  /**
   * Prescripciones en formato compacto
   */
  generarPrescripcionesCompactas(doc, prescripciones, startY) {
    let y = startY;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Título
    doc.rect(this.margins.left, y, pageWidth, 22)
       .fill(this.colors.success);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
       .text('PRESCRIPCIONES', this.margins.left + 10, y + 6);

    y += 28;

    for (const presc of prescripciones.slice(0, 5)) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 60;
      }

      const medicamento = presc.medicamentos?.[0]?.producto?.nombre || presc.diagnostico || 'Prescripción';

      doc.rect(this.margins.left, y, pageWidth, 50)
         .lineWidth(1)
         .fillAndStroke('#f0fdf4', this.colors.success);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(this.colors.success)
         .text(`Rx: ${medicamento}`, this.margins.left + 10, y + 8, { width: pageWidth - 100 });

      doc.fontSize(8).fillColor(this.colors.textMuted)
         .text(this.formatearFechaCorta(presc.fechaPrescripcion), this.margins.left + pageWidth - 80, y + 8);

      doc.fontSize(8).font('Helvetica').fillColor(this.colors.text)
         .text(`Dosis: ${presc.dosis || 'N/A'} | Frecuencia: ${presc.frecuencia || 'N/A'} | Vía: ${presc.via || 'Oral'}`,
                this.margins.left + 10, y + 25);

      if (presc.indicaciones) {
        doc.text(`Indicaciones: ${presc.indicaciones.substring(0, 60)}`, this.margins.left + 10, y + 38);
      }

      y += 55;
    }

    return y + 10;
  }

  /**
   * Resumen y constancia combinados
   */
  generarResumenYConstancia(doc, datos) {
    this.generarEncabezadoSeccion(doc, 'RESUMEN Y CONSTANCIA');

    let y = 130;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // === RESUMEN ESTADÍSTICO ===
    doc.rect(this.margins.left, y, pageWidth, 150)
       .fill(this.colors.headerBg);

    y += 15;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('ESTADÍSTICAS DE LA HISTORIA CLÍNICA', this.margins.left + 15, y);

    y += 25;

    const col1X = this.margins.left + 20;
    const col2X = this.margins.left + pageWidth / 2 + 10;

    const stats = [
      [`Evoluciones: ${datos.evoluciones.length}`, `Prescripciones: ${datos.prescripciones.length}`],
      [`Signos Vitales: ${datos.signosVitales.length}`, `Procedimientos: ${datos.procedimientos.length}`],
      [`Diagnósticos: ${datos.diagnosticos.length}`, `Interconsultas: ${datos.interconsultas.length}`],
      [`Alertas: ${datos.alertas.length}`, `Notas Enfermería: ${datos.notasEnfermeria.length}`],
      [`Urgencias: ${datos.urgencias.length}`, `Hospitalizaciones: ${datos.hospitalizaciones.length}`],
    ];

    doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

    for (const [stat1, stat2] of stats) {
      doc.text(`• ${stat1}`, col1X, y);
      doc.text(`• ${stat2}`, col2X, y);
      y += 18;
    }

    y += 30;

    // === CONSTANCIA DE AUTENTICIDAD ===
    doc.rect(this.margins.left, y, pageWidth, 120)
       .lineWidth(2)
       .stroke(this.colors.primary);

    y += 15;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(this.colors.primary)
       .text('CONSTANCIA DE AUTENTICIDAD', this.margins.left + 15, y);

    y += 20;
    doc.fontSize(9).font('Helvetica').fillColor(this.colors.text)
       .text('Este documento es una copia fiel de la Historia Clínica Electrónica almacenada en el sistema de información de ' +
             `${datos.institucion.nombre}, conforme a la Ley 2015 de 2020 y la Resolución 866 de 2021.`,
             this.margins.left + 15, y, { width: pageWidth - 30 });

    y += 40;
    doc.fontSize(8).fillColor(this.colors.textMuted)
       .text(`Generado: ${this.formatearFechaHoraCompleta(datos.fechaGeneracion)}`, this.margins.left + 15, y);

    doc.text(`Hash de integridad: ${this.generarHashSimple(datos.paciente.id)}`, this.margins.left + 15, y + 12);

    y += 30;
    doc.fontSize(7).font('Helvetica-Oblique').fillColor(this.colors.textMuted)
       .text('La divulgación no autorizada de esta información está penada por la Ley 1581 de 2012.',
             this.margins.left + 15, y, { width: pageWidth - 30, align: 'center' });
  }

  /**
   * Generar hash simple para integridad
   */
  generarHashSimple(id) {
    const str = id + new Date().toISOString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  /**
   * Generar portada institucional completa - Diseño profesional centrado
   * Con colores de marca Clínica MÍA (turquesa/teal)
   */
  generarPortada(doc, datos) {
    const { paciente, fechaGeneracion, institucion } = datos;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const centerX = this.margins.left;

    // === BARRA SUPERIOR DECORATIVA ===
    doc.rect(0, 0, doc.page.width, 6).fill(this.colors.primary);
    doc.rect(0, 6, doc.page.width, 2).fill(this.colors.accent);

    // === ENCABEZADO INSTITUCIONAL COMPACTO ===
    const headerY = 15;
    const headerHeight = 55;

    doc.rect(this.margins.left, headerY, pageWidth, headerHeight)
       .fill(this.colors.primary);

    // Logo compacto
    const logoX = this.margins.left + 8;
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
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, 20).fill('#ffffff');
      doc.fontSize(16).font('Helvetica-Bold').fillColor(this.colors.primary)
         .text('CM', logoX + 8, logoY + 12);
    }

    // Info institucional compacta
    const textStartX = logoX + logoSize + 10;
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
       .text(institucion.nombre, textStartX, headerY + 6, { width: pageWidth - logoSize - 30 });

    doc.fontSize(7).font('Helvetica').fillColor(this.colors.accent)
       .text(`NIT: ${institucion.nit} | Hab: ${institucion.codigoHabilitacion} | ${institucion.tipoEntidad || 'IPS'}`, textStartX, headerY + 22);

    doc.fillColor('#e0f2f1').fontSize(7)
       .text(`${institucion.direccion}, ${institucion.ciudad} | Tel: ${institucion.telefono} | ${institucion.celular}`, textStartX, headerY + 32)
       .text(`${institucion.email} | ${institucion.web}`, textStartX, headerY + 42);

    // === TÍTULO Y FECHA ===
    let y = headerY + headerHeight + 5;

    // Fila con título y fecha de generación
    doc.rect(this.margins.left, y, pageWidth, 20).fill(this.colors.headerBg);

    doc.fillColor(this.colors.primary).fontSize(12).font('Helvetica-Bold')
       .text('HISTORIA CLÍNICA ELECTRÓNICA', this.margins.left + 8, y + 5);

    // Rango de fechas si aplica
    if (datos.rangoFechas) {
      const desde = datos.rangoFechas.desde.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
      const hasta = datos.rangoFechas.hasta.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.fontSize(7).font('Helvetica').fillColor(this.colors.warning)
         .text(`Período: ${desde} - ${hasta}`, this.margins.left + 200, y + 6);
    }

    doc.fontSize(7).font('Helvetica').fillColor(this.colors.textMuted)
       .text(`Generado: ${this.formatearFechaHoraCompleta(fechaGeneracion)}`, this.margins.left + pageWidth - 140, y + 6, { width: 130, align: 'right' });

    y += 22;

    // === IDENTIFICACIÓN DEL PACIENTE ===
    y = this.generarIdentificacionInline(doc, paciente, y);

    // === ADVERTENCIA CONFIDENCIAL (compacta) ===
    doc.rect(this.margins.left, y, pageWidth, 22)
       .lineWidth(1)
       .fillAndStroke(this.colors.dangerBg, this.colors.danger);

    doc.fillColor(this.colors.danger).fontSize(7).font('Helvetica-Bold')
       .text('⚠ DOCUMENTO CONFIDENCIAL', this.margins.left + 8, y + 4);

    doc.fontSize(6).font('Helvetica').fillColor(this.colors.text)
       .text('Información protegida por Ley 1581/2012 (Habeas Data), Ley 23/1981 (Ética Médica) y Ley 2015/2020. Conforme a Res. 1995/1999, 839/2017, 3100/2019, 866/2021.',
             this.margins.left + 8, y + 13, { width: pageWidth - 16 });

    return y + 25; // Retorna posición Y para continuar contenido
  }

  /**
   * Escribir campo simple para portada
   */
  escribirCampoPortadaSimple(doc, etiqueta, valor, x, y) {
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor(this.colors.textMuted)
       .text(etiqueta, x, y);
    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor(this.colors.text)
       .text(valor || 'N/A', x + 65, y);
  }

  /**
   * Escribir campo de portada con diseño mejorado
   */
  escribirCampoPortadaMejorado(doc, etiqueta, valor, x, y) {
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor(this.colors.textMuted)
       .text(etiqueta, x, y);
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(this.colors.text)
       .text(valor || 'N/A', x + 70, y);
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
   * (Art. 10 Res. 1995/1999) - Diseño mejorado
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

    // === TARJETA DE IDENTIFICACIÓN PRINCIPAL ===
    const cardHeight = 100;
    doc.rect(this.margins.left, y, pageWidth, cardHeight)
       .lineWidth(1)
       .fillAndStroke(this.colors.headerBg, this.colors.primary);

    // Foto del paciente
    const fotoX = this.margins.left + 15;
    const fotoY = y + 12;
    const fotoSize = 75;
    let fotoMostrada = false;

    if (paciente.fotoUrl) {
      try {
        // Intentar cargar la foto - puede ser base64 o URL
        if (paciente.fotoUrl.startsWith('data:image')) {
          // Es base64
          const base64Data = paciente.fotoUrl.replace(/^data:image\/\w+;base64,/, '');
          const fotoBuffer = Buffer.from(base64Data, 'base64');
          doc.image(fotoBuffer, fotoX, fotoY, { width: fotoSize, height: fotoSize, fit: [fotoSize, fotoSize] });
          fotoMostrada = true;
        } else if (paciente.fotoUrl.startsWith('http')) {
          // Es URL - intentar cargar
          doc.image(paciente.fotoUrl, fotoX, fotoY, { width: fotoSize, height: fotoSize, fit: [fotoSize, fotoSize] });
          fotoMostrada = true;
        }
      } catch (e) {
        console.log('Error cargando foto del paciente:', e.message);
        fotoMostrada = false;
      }
    }

    if (!fotoMostrada) {
      this.dibujarFotoPlaceholder(doc, fotoX, fotoY, fotoSize);
    }

    // Nombre destacado
    const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim().toUpperCase();
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text(nombreCompleto || 'NOMBRE NO REGISTRADO', fotoX + fotoSize + 20, y + 15, { width: pageWidth - fotoSize - 60 });

    // Documento de identidad destacado
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.colors.text)
       .text(`${paciente.tipoDocumento || 'CC'}: ${paciente.cedula || 'N/A'}`, fotoX + fotoSize + 20, y + 38);

    // Datos rápidos
    const quickDataY = y + 58;
    doc.fontSize(9)
       .fillColor(this.colors.textLight);

    const edad = this.calcularEdad(paciente.fechaNacimiento);
    const sexo = paciente.genero || 'N/A';
    const sangre = paciente.tipoSangre || 'N/A';

    doc.text(`Edad: ${edad}  |  Sexo: ${sexo}  |  Tipo Sangre: ${sangre}`, fotoX + fotoSize + 20, quickDataY);

    doc.fontSize(9)
       .text(`EPS: ${paciente.eps || 'N/A'}  |  Régimen: ${paciente.regimen || 'N/A'}`, fotoX + fotoSize + 20, quickDataY + 14);

    y += cardHeight + 15;

    // === DATOS DE IDENTIFICACIÓN - GRID MEJORADO ===
    y = this.generarSubseccionConIcono(doc, 'DATOS DE IDENTIFICACIÓN', y, 'user');

    const datosIdentificacion = [
      ['Tipo de Documento', paciente.tipoDocumento || 'Cédula de Ciudadanía'],
      ['Número de Documento', paciente.cedula || 'N/A'],
      ['Nombres', paciente.nombre || 'N/A'],
      ['Apellidos', paciente.apellido || 'N/A'],
      ['Fecha de Nacimiento', this.formatearFecha(paciente.fechaNacimiento)],
      ['Edad Actual', this.calcularEdad(paciente.fechaNacimiento)],
      ['Sexo Biológico', paciente.genero || 'N/A'],
      ['Estado Civil', paciente.estadoCivil || 'N/A'],
      ['Ocupación', paciente.ocupacion || 'N/A'],
      ['Nivel Educativo', paciente.nivelEducacion || 'N/A'],
      ['Empleador Actual', paciente.empleadorActual || 'N/A'],
      ['Tipo Paciente', paciente.tipoPaciente || 'N/A'],
    ];

    y = this.generarTablaDatosGrid(doc, datosIdentificacion, y, 2);
    y += 15;

    // === DATOS DE UBICACIÓN Y CONTACTO ===
    y = this.generarSubseccionConIcono(doc, 'UBICACIÓN Y CONTACTO', y, 'location');

    const datosContacto = [
      ['País de Nacimiento', paciente.paisNacimiento || 'Colombia'],
      ['Departamento', paciente.departamento || 'N/A'],
      ['Municipio/Ciudad', paciente.municipio || 'N/A'],
      ['Barrio', paciente.barrio || 'N/A'],
      ['Dirección de Residencia', paciente.direccion || 'N/A'],
      ['Teléfono de Contacto', paciente.telefono || 'N/A'],
      ['Correo Electrónico', paciente.email || 'N/A'],
    ];

    y = this.generarTablaDatosGrid(doc, datosContacto, y, 2);
    y += 15;

    // === ASEGURAMIENTO EN SALUD ===
    if (y > doc.page.height - 200) {
      doc.addPage();
      this.generarEncabezadoSeccion(doc, 'IDENTIFICACIÓN DEL PACIENTE (Continuación)');
      y = 140;
    }

    y = this.generarSubseccionConIcono(doc, 'ASEGURAMIENTO EN SALUD (SGSSS)', y, 'health');

    const datosAseguramiento = [
      ['EPS / EAPB', paciente.eps || 'N/A'],
      ['Régimen de Afiliación', paciente.regimen || 'N/A'],
      ['Tipo de Afiliación', paciente.tipoAfiliacion || 'N/A'],
      ['Nivel SISBEN', paciente.nivelSisben || 'N/A'],
      ['Número Autorización', paciente.numeroAutorizacion || 'N/A'],
      ['ARL', paciente.arl || 'N/A'],
      ['Fecha Afiliación', this.formatearFecha(paciente.fechaAfiliacion)],
      ['Carnet/Póliza', paciente.carnetPoliza || 'N/A'],
    ];

    y = this.generarTablaDatosGrid(doc, datosAseguramiento, y, 2);
    y += 15;

    // === CONTACTO DE EMERGENCIA ===
    const contactos = paciente.contactosEmergencia;
    if (contactos && Array.isArray(contactos) && contactos.length > 0) {
      y = this.generarSubseccionConIcono(doc, 'CONTACTO DE EMERGENCIA', y, 'emergency');

      // Box de emergencia con estilo destacado
      doc.rect(this.margins.left, y, pageWidth, contactos.length * 45 + 10)
         .lineWidth(1)
         .fillAndStroke(this.colors.warningBg, this.colors.warning);

      y += 10;

      for (let i = 0; i < Math.min(contactos.length, 3); i++) {
        const contacto = contactos[i];

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(this.colors.text)
           .text(`${i + 1}. ${contacto.nombre || 'N/A'}`, this.margins.left + 15, y);

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text(`Parentesco: ${contacto.parentesco || 'N/A'}  |  Teléfono: ${contacto.telefono || 'N/A'}`,
                  this.margins.left + 25, y + 15);

        if (contacto.direccion) {
          doc.text(`Dirección: ${contacto.direccion}`, this.margins.left + 25, y + 28);
        }

        y += 40;
      }
      y += 10;
    }

    // === INFORMACIÓN ADICIONAL ===
    if (paciente.referidoPor || paciente.nombreRefiere || paciente.convenio) {
      y += 10;
      y = this.generarSubseccionConIcono(doc, 'INFORMACIÓN ADICIONAL', y, 'info');

      const datosAdicionales = [];
      if (paciente.referidoPor) datosAdicionales.push(['Referido Por', paciente.referidoPor]);
      if (paciente.nombreRefiere) datosAdicionales.push(['Nombre Refiere', paciente.nombreRefiere]);
      if (paciente.convenio) datosAdicionales.push(['Convenio', paciente.convenio]);
      if (paciente.categoria) datosAdicionales.push(['Categoría', paciente.categoria]);

      y = this.generarTablaDatosGrid(doc, datosAdicionales, y, 2);
    }
  }

  /**
   * Dibujar placeholder de foto con ícono de usuario
   */
  dibujarFotoPlaceholder(doc, x, y, size) {
    doc.rect(x, y, size, size)
       .lineWidth(1)
       .fillAndStroke('#e0e0e0', this.colors.border);

    // Ícono de usuario simplificado
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Cabeza
    doc.circle(centerX, centerY - 8, 12).fill(this.colors.textMuted);
    // Cuerpo
    doc.ellipse(centerX, centerY + 18, 18, 12).fill(this.colors.textMuted);

    doc.fontSize(7)
       .font('Helvetica')
       .fillColor(this.colors.textMuted)
       .text('Sin foto', x, y + size - 12, { width: size, align: 'center' });
  }

  /**
   * Generar subsección con ícono
   */
  generarSubseccionConIcono(doc, titulo, y, iconType) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    // Fondo del encabezado
    doc.rect(this.margins.left, y, pageWidth, 22)
       .fill(this.colors.primary);

    // Ícono según tipo
    const iconX = this.margins.left + 8;
    const iconY = y + 6;

    doc.fillColor('#ffffff');

    if (iconType === 'user') {
      doc.circle(iconX + 5, iconY + 3, 4).fill();
      doc.rect(iconX + 1, iconY + 8, 8, 5).fill();
    } else if (iconType === 'location') {
      doc.circle(iconX + 5, iconY + 4, 4).stroke('#ffffff');
      doc.circle(iconX + 5, iconY + 4, 2).fill();
    } else if (iconType === 'health') {
      doc.rect(iconX + 2, iconY + 4, 6, 2).fill();
      doc.rect(iconX + 4, iconY + 2, 2, 6).fill();
    } else if (iconType === 'emergency') {
      doc.fontSize(12).font('Helvetica-Bold').text('!', iconX + 3, iconY);
    } else if (iconType === 'info') {
      doc.fontSize(10).font('Helvetica-Bold').text('i', iconX + 4, iconY + 1);
    }

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(titulo, this.margins.left + 25, y + 6);

    return y + 28;
  }

  /**
   * Generar tabla de datos en formato grid (2 columnas)
   */
  generarTablaDatosGrid(doc, datos, y, columnas = 2) {
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;
    const colWidth = pageWidth / columnas;
    let currentY = y;
    let currentCol = 0;
    let rowStartY = y;

    for (let i = 0; i < datos.length; i++) {
      const [label, valor] = datos[i];
      const x = this.margins.left + (currentCol * colWidth) + 10;

      // Alternar fondo de filas
      if (currentCol === 0) {
        const rowHeight = 22;
        const fillColor = Math.floor(i / columnas) % 2 === 0 ? '#f8f9fa' : '#ffffff';
        doc.rect(this.margins.left, currentY, pageWidth, rowHeight).fill(fillColor);
      }

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(this.colors.textMuted)
         .text(label, x, currentY + 3, { width: colWidth - 20 });

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(this.colors.text)
         .text(valor || 'N/A', x, currentY + 12, { width: colWidth - 20 });

      currentCol++;
      if (currentCol >= columnas) {
        currentCol = 0;
        currentY += 22;
      }
    }

    // Si terminamos en columna impar, avanzar
    if (currentCol > 0) {
      currentY += 22;
    }

    return currentY;
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
   * Con firma y sello digital del médico responsable
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

      if (y > doc.page.height - 320) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'EVOLUCIONES MÉDICAS (Continuación)');
        y = 140;
      }

      // Encabezado de evolución
      doc.rect(this.margins.left, y, pageWidth, 28)
         .fill(this.colors.primary);

      const nombreMedico = evol.doctor ? `Dr(a). ${evol.doctor.nombre} ${evol.doctor.apellido}` : 'N/A';
      const licenciaMedica = evol.doctor?.doctor?.licenciaMedica || '';

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`EVOLUCIÓN #${evoluciones.length - i}`, this.margins.left + 10, y + 8);

      doc.fontSize(9)
         .font('Helvetica')
         .text(`${this.formatearFechaHora(evol.fechaEvolucion)} | ${nombreMedico}`,
                this.margins.left + pageWidth - 280, y + 9);

      y += 35;

      // Secciones SOAP - Formatear contenido para eliminar JSON embebido
      const secciones = [
        { titulo: 'S - SUBJETIVO', contenido: this.formatearContenidoEvolucion(evol.subjetivo), color: '#3182ce' },
        { titulo: 'O - OBJETIVO', contenido: this.formatearContenidoEvolucion(evol.objetivo), color: '#38a169' },
        { titulo: 'A - ANÁLISIS', contenido: this.formatearContenidoEvolucion(evol.analisis), color: '#dd6b20' },
        { titulo: 'P - PLAN', contenido: this.formatearContenidoEvolucion(evol.plan), color: '#805ad5' },
      ];

      for (const seccion of secciones) {
        const contenidoLimpio = seccion.contenido?.trim();
        if (contenidoLimpio && contenidoLimpio.length > 0) {
          // Calcular altura del contenido para mejor manejo de páginas
          const textHeight = doc.heightOfString(contenidoLimpio, { width: pageWidth - 22 });
          const seccionHeight = Math.max(45, textHeight + 25);

          // Verificar si necesitamos nueva página
          if (y + seccionHeight > doc.page.height - 100) {
            doc.addPage();
            y = this.margins.top + 20;
          }

          // Barra lateral de color
          doc.rect(this.margins.left, y, 4, seccionHeight).fill(seccion.color);

          // Título de la sección
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor(seccion.color)
             .text(seccion.titulo, this.margins.left + 12, y + 3);

          // Contenido formateado
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor(this.colors.text)
             .text(contenidoLimpio, this.margins.left + 12, y + 16, {
               width: pageWidth - 24,
               align: 'left',
               lineGap: 2,
             });

          y += seccionHeight + 8;
        }
      }

      // === SECCIÓN DE FIRMA Y SELLO DEL MÉDICO ===
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = this.margins.top;
      }

      // Box de firma
      doc.rect(this.margins.left, y, pageWidth, 85)
         .lineWidth(1)
         .stroke(this.colors.border);

      // Título del área de firma
      doc.rect(this.margins.left, y, pageWidth, 18)
         .fill(this.colors.headerBg);

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor(this.colors.textLight)
         .text('RESPONSABLE DE LA EVOLUCIÓN', this.margins.left + 10, y + 5);

      y += 25;

      // Obtener datos del doctor (firma, sello, licencia)
      const doctorData = evol.doctor?.doctor;
      const firmaBase64 = doctorData?.firma;
      const selloBase64 = doctorData?.sello;

      // Columna de firma
      const firmaX = this.margins.left + 20;
      const selloX = this.margins.left + pageWidth / 2 + 20;
      const imgY = y;

      // Mostrar firma si existe
      if (firmaBase64) {
        try {
          const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(firmaBuffer, firmaX, imgY, { width: 100, height: 45 });
        } catch (e) {
          doc.fontSize(8).fillColor(this.colors.textMuted)
             .text('[Firma digital]', firmaX, imgY + 15);
        }
      } else {
        // Línea para firma manual
        doc.moveTo(firmaX, imgY + 40)
           .lineTo(firmaX + 120, imgY + 40)
           .lineWidth(0.5)
           .stroke(this.colors.textMuted);
      }

      // Etiqueta de firma
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(this.colors.textMuted)
         .text('Firma del Profesional', firmaX, imgY + 48);

      // Mostrar sello si existe
      if (selloBase64) {
        try {
          const selloBuffer = Buffer.from(selloBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(selloBuffer, selloX, imgY, { width: 80, height: 45 });
        } catch (e) {
          doc.fontSize(8).fillColor(this.colors.textMuted)
             .text('[Sello]', selloX, imgY + 15);
        }
      } else {
        // Espacio para sello
        doc.rect(selloX, imgY, 80, 45)
           .lineWidth(0.5)
           .dash(3, { space: 2 })
           .stroke(this.colors.textMuted)
           .undash();
      }

      // Etiqueta de sello
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(this.colors.textMuted)
         .text('Sello Profesional', selloX, imgY + 48);

      // Datos del médico
      const datosX = this.margins.left + pageWidth - 180;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(this.colors.text)
         .text(nombreMedico, datosX, imgY, { width: 170 });

      if (licenciaMedica) {
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(this.colors.textMuted)
           .text(`Reg. Médico: ${licenciaMedica}`, datosX, imgY + 14);
      }

      doc.fontSize(8)
         .text(`Fecha: ${this.formatearFechaHora(evol.fechaEvolucion)}`, datosX, imgY + 28);

      if (evol.firmada) {
        doc.fontSize(7)
           .font('Helvetica-Bold')
           .fillColor(this.colors.accent)
           .text('✓ FIRMADO DIGITALMENTE', datosX, imgY + 42);
      }

      y += 75;

      // Línea separadora entre evoluciones
      doc.moveTo(this.margins.left, y)
         .lineTo(this.margins.left + pageWidth, y)
         .lineWidth(1)
         .stroke(this.colors.border);
      y += 25;
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
   * Generar sección de urgencias - Altura dinámica
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
      // Calcular altura dinámica
      let alturaEstimada = 130; // Base
      if (urg.diagnosticoInicial) alturaEstimada += 25;
      if (urg.tratamientoAplicado) alturaEstimada += 25;

      if (y > doc.page.height - alturaEstimada - 50) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'URGENCIAS (Continuación)');
        y = 140;
      }

      const colorCategoria = categoriaColores[urg.categoriaManchester] || this.colors.secondary;

      // Encabezado con color de triaje
      doc.rect(this.margins.left, y, pageWidth, 26)
         .fill(colorCategoria);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`TRIAJE ${urg.categoriaManchester?.toUpperCase() || 'N/A'} - Prioridad ${urg.prioridad || 'N/A'}`,
                this.margins.left + 10, y + 7);
      doc.text(this.formatearFechaHoraCorta(urg.horaLlegada), this.margins.left + pageWidth - 130, y + 7);

      y += 32;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      // Motivo de consulta
      doc.font('Helvetica-Bold').text('Motivo:', this.margins.left + 10, y);
      doc.font('Helvetica').text(urg.motivoConsulta || 'N/A', this.margins.left + 55, y, { width: pageWidth - 70 });

      y += 18;

      // Signos vitales en una línea
      doc.text(`PA: ${urg.presionSistolica || '-'}/${urg.presionDiastolica || '-'} | ` +
               `FC: ${urg.frecuenciaCardiaca || '-'} | FR: ${urg.frecuenciaRespiratoria || '-'} | ` +
               `T: ${urg.temperatura || '-'}°C | SpO2: ${urg.saturacionOxigeno || '-'}%`,
               this.margins.left + 10, y);

      y += 18;

      // Diagnóstico
      if (urg.diagnosticoInicial) {
        doc.font('Helvetica-Bold').text('Dx:', this.margins.left + 10, y);
        doc.font('Helvetica').text(urg.diagnosticoInicial, this.margins.left + 30, y, { width: pageWidth - 45 });
        y += 18;
      }

      // Tratamiento
      if (urg.tratamientoAplicado) {
        doc.font('Helvetica-Bold').text('Tx:', this.margins.left + 10, y);
        doc.font('Helvetica').text(urg.tratamientoAplicado, this.margins.left + 30, y, { width: pageWidth - 45 });
        y += 18;
      }

      // Disposición y personal en una línea
      const medico = urg.medicoAsignado ? `${urg.medicoAsignado.nombre} ${urg.medicoAsignado.apellido}` : 'N/A';

      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(`Disposición: ${urg.disposicion || urg.estado || 'N/A'} | Médico: ${medico}`, this.margins.left + 10, y);

      y += 25;

      // Línea separadora
      doc.moveTo(this.margins.left, y - 5)
         .lineTo(this.margins.left + pageWidth, y - 5)
         .lineWidth(0.5)
         .stroke(this.colors.border);
    }
  }

  /**
   * Generar sección de hospitalizaciones - Altura dinámica
   */
  generarSeccionHospitalizaciones(doc, hospitalizaciones) {
    this.generarEncabezadoSeccion(doc, 'HOSPITALIZACIONES Y EPICRISIS');

    let y = 140;
    const pageWidth = doc.page.width - this.margins.left - this.margins.right;

    for (const hosp of hospitalizaciones) {
      // Calcular altura dinámica basada en contenido
      let alturaEstimada = 100; // Base: encabezado + ubicación + período
      if (hosp.motivoIngreso) alturaEstimada += 35;
      if (hosp.diagnosticoIngreso) alturaEstimada += 35;
      if (hosp.diagnosticoEgreso) alturaEstimada += 35;
      if (hosp.movimientos && hosp.movimientos.length > 0) {
        alturaEstimada += 20 + Math.min(hosp.movimientos.length, 3) * 15;
      }

      if (y > doc.page.height - alturaEstimada - 50) {
        doc.addPage();
        this.generarEncabezadoSeccion(doc, 'HOSPITALIZACIONES (Continuación)');
        y = 140;
      }

      const startY = y;

      // Encabezado
      doc.rect(this.margins.left, y, pageWidth, 28)
         .fill(this.colors.primary);

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text(`ADMISIÓN - ${hosp.unidad?.nombre || 'Unidad'}`, this.margins.left + 10, y + 7);

      doc.fillColor(hosp.estado === 'Activa' ? '#90EE90' : '#87CEEB')
         .text(hosp.estado || 'N/A', this.margins.left + pageWidth - 100, y + 7);

      y += 35;

      doc.fontSize(9).font('Helvetica').fillColor(this.colors.text);

      // Ubicación en una línea
      doc.text(`Unidad: ${hosp.unidad?.nombre || 'N/A'} | ` +
               `Habitación: ${hosp.cama?.habitacion?.numero || 'N/A'} | ` +
               `Cama: ${hosp.cama?.numero || 'N/A'}`,
               this.margins.left + 10, y);

      y += 18;

      // Período
      const diasEstancia = this.calcularDiasEstancia(hosp.fechaIngreso, hosp.fechaEgreso);
      doc.text(`Ingreso: ${this.formatearFechaHora(hosp.fechaIngreso)} | ` +
               `Egreso: ${hosp.fechaEgreso ? this.formatearFechaHora(hosp.fechaEgreso) : 'Hospitalizado'} | ` +
               `Estancia: ${diasEstancia} días`,
               this.margins.left + 10, y);

      y += 20;

      // Motivo y diagnósticos (solo si existen)
      if (hosp.motivoIngreso) {
        doc.font('Helvetica-Bold').text('Motivo:', this.margins.left + 10, y);
        doc.font('Helvetica').text(hosp.motivoIngreso, this.margins.left + 55, y, { width: pageWidth - 70 });
        y += 18;
      }

      if (hosp.diagnosticoIngreso) {
        doc.font('Helvetica-Bold').text('Dx Ingreso:', this.margins.left + 10, y);
        doc.font('Helvetica').text(hosp.diagnosticoIngreso, this.margins.left + 75, y, { width: pageWidth - 90 });
        y += 18;
      }

      if (hosp.diagnosticoEgreso) {
        doc.font('Helvetica-Bold').text('Dx Egreso:', this.margins.left + 10, y);
        doc.font('Helvetica').text(hosp.diagnosticoEgreso, this.margins.left + 70, y, { width: pageWidth - 85 });
        y += 18;
      }

      // Movimientos (máximo 3)
      if (hosp.movimientos && hosp.movimientos.length > 0) {
        y += 5;
        doc.font('Helvetica-Bold').fillColor(this.colors.textMuted).text('Movimientos:', this.margins.left + 10, y);
        y += 12;

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
           lineBreak: false
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
    const totalPages = pages.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);

      const pageWidth = doc.page.width - this.margins.left - this.margins.right;
      const footerY = doc.page.height - 35;
      const dateY = doc.page.height - 22;

      // Usar height limitado para prevenir auto-paginación
      doc.fontSize(8)
         .fillColor(this.colors.textMuted)
         .text(
           `Historia Clínica Electrónica - ${this.institucion.nombre} | Página ${i + 1} de ${totalPages}`,
           this.margins.left,
           footerY,
           { width: pageWidth, height: 12, align: 'center', lineBreak: false }
         );

      doc.fontSize(7)
         .text(
           `Impreso: ${this.formatearFechaHoraCompleta(new Date())}`,
           this.margins.left,
           dateY,
           { width: pageWidth, height: 10, align: 'center', lineBreak: false }
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

  calcularEdad(fechaNacimiento, formatoDetallado = false) {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    // Ajustar días negativos
    if (dias < 0) {
      meses--;
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      dias += ultimoDiaMesAnterior;
    }

    // Ajustar meses negativos
    if (meses < 0) {
      años--;
      meses += 12;
    }

    // Si se pide formato detallado, retornar años, meses y días
    if (formatoDetallado) {
      return `${años} Años ${meses} Meses ${dias} Días`;
    }

    // Formato simple solo años
    return `${años} años`;
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
