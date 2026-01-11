/**
 * Exportador REPS
 * Genera declaraciones de autoevaluación para el Registro Especial de Prestadores
 */
const { create } = require('xmlbuilder2');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../../db/prisma');

class ExportadorREPSService {
  /**
   * Generar declaración de autoevaluación de habilitación
   */
  async generarDeclaracionAutoevaluacion(fecha = new Date()) {
    // Obtener todos los estándares con sus autoevaluaciones más recientes
    const estandares = await prisma.estandarHabilitacion.findMany({
      where: { activo: true },
      include: {
        criterios: {
          where: { activo: true },
        },
        autoevaluaciones: {
          orderBy: { fechaEvaluacion: 'desc' },
          take: 1,
          include: {
            criteriosEvaluados: true,
          },
        },
      },
      orderBy: { tipo: 'asc' },
    });

    // Calcular cumplimiento por estándar
    const resumen = estandares.map((estandar) => {
      const ultimaAutoevaluacion = estandar.autoevaluaciones[0];
      let porcentaje = 0;

      if (ultimaAutoevaluacion && ultimaAutoevaluacion.criteriosEvaluados.length > 0) {
        const evaluados = ultimaAutoevaluacion.criteriosEvaluados;
        const cumple = evaluados.filter(
          (e) => e.cumplimiento === 'CUMPLE' || e.cumplimiento === 'NO_APLICA'
        ).length;
        porcentaje = (cumple / evaluados.length) * 100;
      }

      return {
        tipo: estandar.tipo,
        codigo: estandar.codigo,
        nombre: estandar.nombre,
        totalCriterios: estandar.criterios.length,
        evaluados: ultimaAutoevaluacion?.criteriosEvaluados.length || 0,
        porcentajeCumplimiento: porcentaje,
        fechaUltimaEvaluacion: ultimaAutoevaluacion?.fechaEvaluacion || null,
        estado: ultimaAutoevaluacion?.estado || 'Sin Evaluar',
      };
    });

    // Calcular cumplimiento global
    const totalCriterios = resumen.reduce((sum, e) => sum + e.totalCriterios, 0);
    const totalEvaluados = resumen.reduce((sum, e) => sum + e.evaluados, 0);
    const promedioGlobal =
      resumen.length > 0
        ? resumen.reduce((sum, e) => sum + e.porcentajeCumplimiento, 0) / resumen.length
        : 0;

    return {
      fechaGeneracion: fecha.toISOString(),
      codigoHabilitacion: process.env.CODIGO_HABILITACION || '',
      nombreIPS: process.env.NOMBRE_IPS || 'Clínica Mía',
      nit: process.env.NIT_IPS || '',
      direccion: process.env.DIRECCION_IPS || '',
      municipio: process.env.MUNICIPIO_IPS || '',
      departamento: process.env.DEPARTAMENTO_IPS || '',
      representanteLegal: process.env.REPRESENTANTE_LEGAL || '',
      resumen: {
        totalEstandares: estandares.length,
        totalCriterios,
        totalEvaluados,
        porcentajeCumplimientoGlobal: promedioGlobal,
      },
      estandares: resumen,
      declaracion: {
        texto: `Declaro bajo la gravedad de juramento que la información contenida en este documento es veraz y corresponde a la autoevaluación de las condiciones de habilitación de ${process.env.NOMBRE_IPS || 'esta IPS'}, realizada conforme a lo establecido en la Resolución 3100 de 2019 del Ministerio de Salud y Protección Social.`,
        fecha: fecha.toLocaleDateString('es-CO'),
      },
    };
  }

  /**
   * Generar XML de declaración para REPS
   */
  async generarDeclaracionXML(fecha = new Date()) {
    const declaracion = await this.generarDeclaracionAutoevaluacion(fecha);

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('DeclaracionHabilitacion', {
        xmlns: 'http://www.minsalud.gov.co/reps',
        version: '1.0',
      })
      .ele('DatosIPS')
        .ele('CodigoHabilitacion').txt(declaracion.codigoHabilitacion).up()
        .ele('NombreIPS').txt(declaracion.nombreIPS).up()
        .ele('NIT').txt(declaracion.nit).up()
        .ele('Direccion').txt(declaracion.direccion).up()
        .ele('Municipio').txt(declaracion.municipio).up()
        .ele('Departamento').txt(declaracion.departamento).up()
        .ele('RepresentanteLegal').txt(declaracion.representanteLegal).up()
      .up()
      .ele('FechaGeneracion').txt(declaracion.fechaGeneracion).up()
      .ele('ResumenGeneral')
        .ele('TotalEstandares').txt(declaracion.resumen.totalEstandares.toString()).up()
        .ele('TotalCriterios').txt(declaracion.resumen.totalCriterios.toString()).up()
        .ele('TotalEvaluados').txt(declaracion.resumen.totalEvaluados.toString()).up()
        .ele('PorcentajeCumplimientoGlobal').txt(declaracion.resumen.porcentajeCumplimientoGlobal.toFixed(2)).up()
      .up()
      .ele('Estandares');

    declaracion.estandares.forEach((estandar) => {
      xml.ele('Estandar')
        .ele('Tipo').txt(estandar.tipo).up()
        .ele('Codigo').txt(estandar.codigo).up()
        .ele('Nombre').txt(estandar.nombre).up()
        .ele('TotalCriterios').txt(estandar.totalCriterios.toString()).up()
        .ele('Evaluados').txt(estandar.evaluados.toString()).up()
        .ele('PorcentajeCumplimiento').txt(estandar.porcentajeCumplimiento.toFixed(2)).up()
        .ele('FechaUltimaEvaluacion').txt(estandar.fechaUltimaEvaluacion?.toISOString().split('T')[0] || '').up()
        .ele('Estado').txt(estandar.estado).up()
      .up();
    });

    xml.up()
      .ele('Declaracion')
        .ele('Texto').txt(declaracion.declaracion.texto).up()
        .ele('Fecha').txt(declaracion.declaracion.fecha).up()
      .up();

    return xml.end({ prettyPrint: true });
  }

  /**
   * Generar Excel de autoevaluación de habilitación
   */
  async generarAutoevaluacionExcel() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - Habilitación';
    workbook.created = new Date();

    // Obtener estándares con criterios y evaluaciones
    const estandares = await prisma.estandarHabilitacion.findMany({
      where: { activo: true },
      include: {
        criterios: {
          where: { activo: true },
          orderBy: { codigo: 'asc' },
        },
        autoevaluaciones: {
          orderBy: { fechaEvaluacion: 'desc' },
          take: 1,
          include: {
            criteriosEvaluados: true,
            evaluador: { select: { nombre: true, apellido: true } },
          },
        },
      },
      orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }],
    });

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.addRow(['Autoevaluación de Condiciones de Habilitación']);
    resumenSheet.addRow(['Resolución 3100 de 2019']);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['IPS:', process.env.NOMBRE_IPS || 'Clínica Mía']);
    resumenSheet.addRow(['Código Habilitación:', process.env.CODIGO_HABILITACION || '']);
    resumenSheet.addRow(['Fecha Generación:', new Date().toLocaleDateString('es-CO')]);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Resumen por Estándar:']);
    resumenSheet.addRow([]);

    // Headers del resumen
    const resumenHeaders = ['Estándar', 'Tipo', 'Total Criterios', 'Evaluados', '% Cumplimiento', 'Estado'];
    const headerRow = resumenSheet.addRow(resumenHeaders);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A3A52' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
    });

    estandares.forEach((estandar) => {
      const ultimaAutoevaluacion = estandar.autoevaluaciones[0];
      let porcentaje = 0;

      if (ultimaAutoevaluacion && ultimaAutoevaluacion.criteriosEvaluados.length > 0) {
        const evaluados = ultimaAutoevaluacion.criteriosEvaluados;
        const cumple = evaluados.filter(
          (e) => e.cumplimiento === 'CUMPLE' || e.cumplimiento === 'NO_APLICA'
        ).length;
        porcentaje = (cumple / evaluados.length) * 100;
      }

      resumenSheet.addRow([
        estandar.nombre,
        estandar.tipo,
        estandar.criterios.length,
        ultimaAutoevaluacion?.criteriosEvaluados.length || 0,
        `${porcentaje.toFixed(1)}%`,
        ultimaAutoevaluacion?.estado || 'Sin Evaluar',
      ]);
    });

    // Crear hoja por cada tipo de estándar
    const tiposEstandar = [
      'TALENTO_HUMANO',
      'INFRAESTRUCTURA',
      'DOTACION',
      'MEDICAMENTOS_DISPOSITIVOS',
      'PROCESOS_PRIORITARIOS',
      'HISTORIA_CLINICA',
      'INTERDEPENDENCIA',
    ];

    for (const tipo of tiposEstandar) {
      const estandaresTipo = estandares.filter((e) => e.tipo === tipo);
      if (estandaresTipo.length === 0) continue;

      const nombreHoja = tipo.substring(0, 30).replace(/_/g, ' ');
      const sheet = workbook.addWorksheet(nombreHoja);

      sheet.columns = [
        { header: 'Código', key: 'codigo', width: 12 },
        { header: 'Estándar', key: 'estandar', width: 25 },
        { header: 'Criterio', key: 'criterio', width: 50 },
        { header: 'Modo Verificación', key: 'modoVerificacion', width: 30 },
        { header: 'Cumplimiento', key: 'cumplimiento', width: 15 },
        { header: 'Observación', key: 'observacion', width: 40 },
      ];

      // Estilo del encabezado
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A3A52' } };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      estandaresTipo.forEach((estandar) => {
        const ultimaAutoevaluacion = estandar.autoevaluaciones[0];
        const evaluacionesCriterio = {};

        if (ultimaAutoevaluacion) {
          ultimaAutoevaluacion.criteriosEvaluados.forEach((e) => {
            evaluacionesCriterio[e.criterioId] = e;
          });
        }

        estandar.criterios.forEach((criterio) => {
          const evaluacion = evaluacionesCriterio[criterio.id];

          const row = sheet.addRow({
            codigo: criterio.codigo,
            estandar: estandar.nombre,
            criterio: criterio.descripcion,
            modoVerificacion: criterio.modoVerificacion || '',
            cumplimiento: evaluacion?.cumplimiento || 'NO EVALUADO',
            observacion: evaluacion?.observacion || '',
          });

          // Colorear según cumplimiento
          const cumplimientoCell = row.getCell('cumplimiento');
          const colores = {
            CUMPLE: '28A745',
            CUMPLE_PARCIAL: 'FFC107',
            NO_CUMPLE: 'DC3545',
            NO_APLICA: '6C757D',
          };
          if (colores[evaluacion?.cumplimiento]) {
            cumplimientoCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: colores[evaluacion.cumplimiento] },
            };
            cumplimientoCell.font = {
              color: {
                argb: evaluacion.cumplimiento === 'CUMPLE_PARCIAL' ? '000000' : 'FFFFFF',
              },
            };
          }
        });
      });
    }

    return workbook;
  }

  /**
   * Generar PDF de declaración de habilitación
   */
  async generarDeclaracionPDF() {
    const declaracion = await this.generarDeclaracionAutoevaluacion();

    return new Promise((resolve, reject) => {
      const chunks = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(18).font('Helvetica-Bold').text('DECLARACIÓN DE AUTOEVALUACIÓN', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('Condiciones de Habilitación - Resolución 3100/2019', { align: 'center' });
      doc.moveDown(2);

      // Datos de la IPS
      doc.fontSize(12).font('Helvetica-Bold').text('DATOS DE LA IPS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${declaracion.nombreIPS}`);
      doc.text(`NIT: ${declaracion.nit}`);
      doc.text(`Código de Habilitación: ${declaracion.codigoHabilitacion}`);
      doc.text(`Dirección: ${declaracion.direccion}`);
      doc.text(`Municipio: ${declaracion.municipio}, ${declaracion.departamento}`);
      doc.text(`Representante Legal: ${declaracion.representanteLegal}`);
      doc.moveDown(2);

      // Resumen de autoevaluación
      doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN DE AUTOEVALUACIÓN');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total de Estándares: ${declaracion.resumen.totalEstandares}`);
      doc.text(`Total de Criterios: ${declaracion.resumen.totalCriterios}`);
      doc.text(`Criterios Evaluados: ${declaracion.resumen.totalEvaluados}`);
      doc.text(`Porcentaje de Cumplimiento Global: ${declaracion.resumen.porcentajeCumplimientoGlobal.toFixed(2)}%`);
      doc.moveDown(2);

      // Tabla de estándares
      doc.fontSize(12).font('Helvetica-Bold').text('CUMPLIMIENTO POR ESTÁNDAR');
      doc.moveDown(0.5);

      // Encabezados de tabla
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 350;
      const col4 = 450;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Estándar', col1, tableTop);
      doc.text('Evaluados', col2, tableTop);
      doc.text('% Cumple', col3, tableTop);
      doc.text('Estado', col4, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Filas
      doc.font('Helvetica');
      let y = tableTop + 20;
      declaracion.estandares.forEach((estandar) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(estandar.nombre.substring(0, 35), col1, y);
        doc.text(`${estandar.evaluados}/${estandar.totalCriterios}`, col2, y);
        doc.text(`${estandar.porcentajeCumplimiento.toFixed(1)}%`, col3, y);
        doc.text(estandar.estado, col4, y);
        y += 18;
      });

      // Declaración juramentada
      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').text('DECLARACIÓN JURAMENTADA', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text(declaracion.declaracion.texto, { align: 'justify' });
      doc.moveDown(3);

      // Firma
      doc.text('_______________________________', { align: 'center' });
      doc.text(declaracion.representanteLegal || 'Representante Legal', { align: 'center' });
      doc.text(`Fecha: ${declaracion.declaracion.fecha}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generar reporte de servicios habilitados
   */
  async generarReporteServiciosHabilitados() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - REPS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Servicios Habilitados');

    sheet.columns = [
      { header: 'Código Servicio', key: 'codigo', width: 15 },
      { header: 'Nombre Servicio', key: 'nombre', width: 40 },
      { header: 'Grupo', key: 'grupo', width: 20 },
      { header: 'Modalidad', key: 'modalidad', width: 15 },
      { header: 'Complejidad', key: 'complejidad', width: 12 },
      { header: 'Estado Habilitación', key: 'estado', width: 18 },
      { header: 'Fecha Habilitación', key: 'fechaHabilitacion', width: 18 },
      { header: 'Capacidad Instalada', key: 'capacidad', width: 18 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A3A52' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Obtener servicios/departamentos habilitados
    const servicios = await prisma.departamento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    servicios.forEach((servicio) => {
      sheet.addRow({
        codigo: servicio.codigo || '',
        nombre: servicio.nombre,
        grupo: servicio.grupo || 'N/A',
        modalidad: servicio.modalidad || 'Intramural',
        complejidad: servicio.complejidad || 'Media',
        estado: 'Habilitado',
        fechaHabilitacion: servicio.fechaHabilitacion?.toLocaleDateString('es-CO') || '',
        capacidad: servicio.capacidadInstalada || '',
      });
    });

    // Hoja de datos generales
    const datosSheet = workbook.addWorksheet('Datos IPS');
    datosSheet.addRow(['Datos del Prestador']);
    datosSheet.addRow([]);
    datosSheet.addRow(['Código Habilitación:', process.env.CODIGO_HABILITACION || '']);
    datosSheet.addRow(['Razón Social:', process.env.NOMBRE_IPS || 'Clínica Mía']);
    datosSheet.addRow(['NIT:', process.env.NIT_IPS || '']);
    datosSheet.addRow(['Naturaleza Jurídica:', process.env.NATURALEZA_JURIDICA || 'Privada']);
    datosSheet.addRow(['Nivel de Atención:', process.env.NIVEL_ATENCION || 'II Nivel']);
    datosSheet.addRow(['Carácter:', process.env.CARACTER_IPS || 'IPS']);
    datosSheet.addRow(['Dirección:', process.env.DIRECCION_IPS || '']);
    datosSheet.addRow(['Municipio:', process.env.MUNICIPIO_IPS || '']);
    datosSheet.addRow(['Departamento:', process.env.DEPARTAMENTO_IPS || '']);
    datosSheet.addRow(['Teléfono:', process.env.TELEFONO_IPS || '']);
    datosSheet.addRow(['Email:', process.env.EMAIL_IPS || '']);
    datosSheet.addRow(['Representante Legal:', process.env.REPRESENTANTE_LEGAL || '']);
    datosSheet.addRow([]);
    datosSheet.addRow(['Fecha de Generación:', new Date().toLocaleDateString('es-CO')]);

    return workbook;
  }

  /**
   * Generar consolidado de novedades REPS
   */
  async generarConsolidadoNovedades(fechaDesde, fechaHasta) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - Novedades REPS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Novedades');

    sheet.columns = [
      { header: 'Tipo Novedad', key: 'tipoNovedad', width: 20 },
      { header: 'Código Servicio', key: 'codigoServicio', width: 15 },
      { header: 'Nombre Servicio', key: 'nombreServicio', width: 35 },
      { header: 'Fecha Novedad', key: 'fechaNovedad', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Observaciones', key: 'observaciones', width: 40 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B35' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
    });

    // Obtener novedades del período (basado en visitas de verificación)
    const visitas = await prisma.visitaVerificacion.findMany({
      where: {
        fechaVisita: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta),
        },
      },
      orderBy: { fechaVisita: 'desc' },
    });

    visitas.forEach((visita) => {
      sheet.addRow({
        tipoNovedad: visita.tipoVisita,
        codigoServicio: '',
        nombreServicio: 'Todos los servicios',
        fechaNovedad: visita.fechaVisita,
        descripcion: `Visita de ${visita.tipoVisita}`,
        estado: visita.estado,
        observaciones: visita.observaciones || '',
      });
    });

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.addRow(['Consolidado de Novedades REPS']);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['IPS:', process.env.NOMBRE_IPS || 'Clínica Mía']);
    resumenSheet.addRow(['Código Habilitación:', process.env.CODIGO_HABILITACION || '']);
    resumenSheet.addRow(['Período:', `${new Date(fechaDesde).toLocaleDateString('es-CO')} - ${new Date(fechaHasta).toLocaleDateString('es-CO')}`]);
    resumenSheet.addRow(['Fecha Generación:', new Date().toLocaleDateString('es-CO')]);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Total Novedades:', visitas.length]);

    // Contar por tipo
    const porTipo = {};
    visitas.forEach((v) => {
      porTipo[v.tipoVisita] = (porTipo[v.tipoVisita] || 0) + 1;
    });

    resumenSheet.addRow([]);
    resumenSheet.addRow(['Por Tipo de Novedad:']);
    Object.entries(porTipo).forEach(([tipo, count]) => {
      resumenSheet.addRow([tipo, count]);
    });

    return workbook;
  }
}

module.exports = new ExportadorREPSService();
