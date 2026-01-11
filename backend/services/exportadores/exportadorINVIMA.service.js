/**
 * Exportador INVIMA
 * Genera reportes de farmacovigilancia y tecnovigilancia
 */
const { create } = require('xmlbuilder2');
const ExcelJS = require('exceljs');
const prisma = require('../../db/prisma');

class ExportadorINVIMAService {
  /**
   * Generar reporte individual de farmacovigilancia (FORAM)
   */
  async generarReporteFarmacovigilancia(reporteId) {
    const reporte = await prisma.reporteFarmacovigilancia.findUnique({
      where: { id: reporteId },
      include: {
        paciente: true,
        producto: true,
      },
    });

    if (!reporte) {
      throw new Error('Reporte de farmacovigilancia no encontrado');
    }

    const paciente = reporte.paciente;
    const producto = reporte.producto;

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('ReporteFarmacovigilancia', {
        xmlns: 'http://www.invima.gov.co/farmacovigilancia',
        version: '1.0',
      })
      .ele('Encabezado')
        .ele('TipoReporte').txt(reporte.tipoReporte).up()
        .ele('FechaEvento').txt(reporte.fechaEvento.toISOString().split('T')[0]).up()
        .ele('FechaReporte').txt(new Date().toISOString().split('T')[0]).up()
        .ele('CodigoIPS').txt(process.env.CODIGO_HABILITACION || '').up()
        .ele('NombreIPS').txt(process.env.NOMBRE_IPS || 'Clínica Mía').up()
      .up()
      .ele('DatosPaciente');

    if (paciente) {
      const edad = paciente.fechaNacimiento
        ? Math.floor((new Date() - new Date(paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      xml.ele('Iniciales').txt(`${paciente.nombre[0]}${paciente.apellido[0]}`).up()
        .ele('Edad').txt(edad?.toString() || '').up()
        .ele('Sexo').txt(paciente.genero === 'Masculino' ? 'M' : paciente.genero === 'Femenino' ? 'F' : 'I').up()
        .ele('Peso').txt(paciente.peso?.toString() || '').up()
        .ele('Altura').txt(paciente.altura?.toString() || '').up();
    }

    xml.up()
      .ele('DatosMedicamento');

    if (producto) {
      xml.ele('NombreComercial').txt(producto.nombre).up()
        .ele('PrincipioActivo').txt(producto.principioActivo || '').up()
        .ele('Concentracion').txt(producto.concentracion || '').up()
        .ele('ViaAdministracion').txt(producto.viaAdministracion || '').up()
        .ele('Laboratorio').txt(producto.laboratorio || '').up()
        .ele('RegistroSanitario').txt(producto.registroSanitario || '').up()
        .ele('Lote').txt(producto.lote || '').up();
    }

    xml.up()
      .ele('DescripcionEvento')
        .ele('DescripcionReaccion').txt(reporte.descripcionReaccion).up()
        .ele('GravedadReaccion').txt(reporte.gravedadReaccion).up()
        .ele('Causalidad').txt(reporte.causalidad || '').up()
        .ele('Desenlace').txt(reporte.desenlace || '').up()
        .ele('AccionTomada').txt(reporte.accionTomada || '').up()
      .up();

    return xml.end({ prettyPrint: true });
  }

  /**
   * Generar reporte individual de tecnovigilancia
   */
  async generarReporteTecnovigilancia(reporteId) {
    const reporte = await prisma.reporteTecnovigilancia.findUnique({
      where: { id: reporteId },
      include: {
        paciente: true,
      },
    });

    if (!reporte) {
      throw new Error('Reporte de tecnovigilancia no encontrado');
    }

    const paciente = reporte.paciente;

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('ReporteTecnovigilancia', {
        xmlns: 'http://www.invima.gov.co/tecnovigilancia',
        version: '1.0',
      })
      .ele('Encabezado')
        .ele('FechaEvento').txt(reporte.fechaEvento.toISOString().split('T')[0]).up()
        .ele('FechaReporte').txt(new Date().toISOString().split('T')[0]).up()
        .ele('CodigoIPS').txt(process.env.CODIGO_HABILITACION || '').up()
        .ele('NombreIPS').txt(process.env.NOMBRE_IPS || 'Clínica Mía').up()
      .up()
      .ele('DatosPaciente');

    if (paciente) {
      const edad = paciente.fechaNacimiento
        ? Math.floor((new Date() - new Date(paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      xml.ele('Iniciales').txt(`${paciente.nombre[0]}${paciente.apellido[0]}`).up()
        .ele('Edad').txt(edad?.toString() || '').up()
        .ele('Sexo').txt(paciente.genero === 'Masculino' ? 'M' : paciente.genero === 'Femenino' ? 'F' : 'I').up();
    }

    xml.up()
      .ele('DatosDispositivo')
        .ele('NombreDispositivo').txt(reporte.nombreDispositivo).up()
        .ele('Fabricante').txt(reporte.fabricante || '').up()
        .ele('RegistroSanitario').txt(reporte.registroSanitario || '').up()
        .ele('Lote').txt(reporte.lote || '').up()
      .up()
      .ele('DescripcionIncidente')
        .ele('Descripcion').txt(reporte.descripcionIncidente).up()
        .ele('Consecuencias').txt(reporte.consecuencias || '').up()
        .ele('Gravedad').txt(reporte.gravedadIncidente).up()
        .ele('AccionTomada').txt(reporte.accionTomada || '').up()
      .up();

    return xml.end({ prettyPrint: true });
  }

  /**
   * Generar consolidado mensual de farmacovigilancia en Excel
   */
  async generarConsolidadoFarmacovigilanciaExcel(mes, anio) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - Farmacovigilancia';
    workbook.created = new Date();

    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    const reportes = await prisma.reporteFarmacovigilancia.findMany({
      where: {
        fechaEvento: {
          gte: primerDia,
          lte: ultimoDia,
        },
      },
      include: {
        paciente: true,
        producto: true,
      },
      orderBy: { fechaEvento: 'asc' },
    });

    const sheet = workbook.addWorksheet('Farmacovigilancia', {
      properties: { tabColor: { argb: 'E74C3C' } },
    });

    // Configurar columnas
    sheet.columns = [
      { header: 'Fecha Evento', key: 'fechaEvento', width: 15 },
      { header: 'Tipo Reporte', key: 'tipoReporte', width: 18 },
      { header: 'Paciente (Iniciales)', key: 'paciente', width: 18 },
      { header: 'Medicamento', key: 'medicamento', width: 30 },
      { header: 'Principio Activo', key: 'principioActivo', width: 25 },
      { header: 'Descripción Reacción', key: 'descripcion', width: 40 },
      { header: 'Gravedad', key: 'gravedad', width: 12 },
      { header: 'Causalidad', key: 'causalidad', width: 15 },
      { header: 'Desenlace', key: 'desenlace', width: 18 },
      { header: 'Reportado INVIMA', key: 'reportadoINVIMA', width: 15 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E74C3C' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Agregar datos
    reportes.forEach((r) => {
      const iniciales = r.paciente
        ? `${r.paciente.nombre[0]}${r.paciente.apellido[0]}`
        : 'N/A';

      const row = sheet.addRow({
        fechaEvento: r.fechaEvento,
        tipoReporte: r.tipoReporte,
        paciente: iniciales,
        medicamento: r.producto?.nombre || 'N/A',
        principioActivo: r.producto?.principioActivo || '',
        descripcion: r.descripcionReaccion,
        gravedad: r.gravedadReaccion,
        causalidad: r.causalidad || '',
        desenlace: r.desenlace || '',
        reportadoINVIMA: r.reportadoINVIMA ? 'Sí' : 'No',
      });

      // Colorear gravedad
      const gravedadCell = row.getCell('gravedad');
      const colores = {
        Leve: '28A745',
        Moderada: 'FFC107',
        Grave: 'DC3545',
        Mortal: '343A40',
      };
      if (colores[r.gravedadReaccion]) {
        gravedadCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colores[r.gravedadReaccion] },
        };
        gravedadCell.font = {
          color: { argb: r.gravedadReaccion === 'Leve' || r.gravedadReaccion === 'Moderada' ? '000000' : 'FFFFFF' },
        };
      }
    });

    // Agregar resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.addRow(['Reporte Mensual de Farmacovigilancia']);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Período:', `${mes}/${anio}`]);
    resumenSheet.addRow(['IPS:', process.env.NOMBRE_IPS || 'Clínica Mía']);
    resumenSheet.addRow(['Fecha Generación:', new Date().toLocaleDateString('es-CO')]);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Total Reportes:', reportes.length]);
    resumenSheet.addRow(['Reportados a INVIMA:', reportes.filter((r) => r.reportadoINVIMA).length]);

    // Por gravedad
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Por Gravedad:']);
    const porGravedad = {};
    reportes.forEach((r) => {
      porGravedad[r.gravedadReaccion] = (porGravedad[r.gravedadReaccion] || 0) + 1;
    });
    Object.entries(porGravedad).forEach(([gravedad, count]) => {
      resumenSheet.addRow([gravedad, count]);
    });

    // Por tipo
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Por Tipo de Reporte:']);
    const porTipo = {};
    reportes.forEach((r) => {
      porTipo[r.tipoReporte] = (porTipo[r.tipoReporte] || 0) + 1;
    });
    Object.entries(porTipo).forEach(([tipo, count]) => {
      resumenSheet.addRow([tipo, count]);
    });

    return workbook;
  }

  /**
   * Generar consolidado mensual de tecnovigilancia en Excel
   */
  async generarConsolidadoTecnovigilanciaExcel(mes, anio) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - Tecnovigilancia';
    workbook.created = new Date();

    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    const reportes = await prisma.reporteTecnovigilancia.findMany({
      where: {
        fechaEvento: {
          gte: primerDia,
          lte: ultimoDia,
        },
      },
      include: {
        paciente: true,
      },
      orderBy: { fechaEvento: 'asc' },
    });

    const sheet = workbook.addWorksheet('Tecnovigilancia', {
      properties: { tabColor: { argb: '9B59B6' } },
    });

    // Configurar columnas
    sheet.columns = [
      { header: 'Fecha Evento', key: 'fechaEvento', width: 15 },
      { header: 'Dispositivo', key: 'dispositivo', width: 30 },
      { header: 'Fabricante', key: 'fabricante', width: 25 },
      { header: 'Registro Sanitario', key: 'registroSanitario', width: 18 },
      { header: 'Lote', key: 'lote', width: 15 },
      { header: 'Descripción Incidente', key: 'descripcion', width: 40 },
      { header: 'Consecuencias', key: 'consecuencias', width: 30 },
      { header: 'Gravedad', key: 'gravedad', width: 12 },
      { header: 'Reportado INVIMA', key: 'reportadoINVIMA', width: 15 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '9B59B6' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Agregar datos
    reportes.forEach((r) => {
      sheet.addRow({
        fechaEvento: r.fechaEvento,
        dispositivo: r.nombreDispositivo,
        fabricante: r.fabricante || '',
        registroSanitario: r.registroSanitario || '',
        lote: r.lote || '',
        descripcion: r.descripcionIncidente,
        consecuencias: r.consecuencias || '',
        gravedad: r.gravedadIncidente,
        reportadoINVIMA: r.reportadoINVIMA ? 'Sí' : 'No',
      });
    });

    return workbook;
  }
}

module.exports = new ExportadorINVIMAService();
