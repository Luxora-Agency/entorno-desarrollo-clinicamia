/**
 * Exportador SISPRO
 * Genera archivos XML y Excel para reporte de indicadores Res. 256/2016
 */
const ExcelJS = require('exceljs');
const { create } = require('xmlbuilder2');
const prisma = require('../../db/prisma');

class ExportadorSISPROService {
  /**
   * Generar reporte XML semestral de indicadores
   */
  async generarReporteSemestralXML(periodo) {
    // Formato periodo: 2025-S1 o 2025-S2
    const [anio, sem] = periodo.split('-');
    const mesesSemestre = sem === 'S1'
      ? ['01', '02', '03', '04', '05', '06']
      : ['07', '08', '09', '10', '11', '12'];

    const periodos = mesesSemestre.map((mes) => `${anio}-${mes}`);

    // Obtener mediciones del semestre
    const mediciones = await prisma.medicionSIC.findMany({
      where: {
        periodo: { in: periodos },
      },
      include: {
        indicador: true,
      },
      orderBy: [{ indicadorId: 'asc' }, { periodo: 'asc' }],
    });

    // Consolidar por indicador
    const indicadoresMap = new Map();
    mediciones.forEach((m) => {
      if (!indicadoresMap.has(m.indicadorId)) {
        indicadoresMap.set(m.indicadorId, {
          codigo: m.indicador.codigo,
          nombre: m.indicador.nombre,
          dominio: m.indicador.dominio,
          numeradorTotal: 0,
          denominadorTotal: 0,
          mediciones: [],
        });
      }
      const data = indicadoresMap.get(m.indicadorId);
      data.numeradorTotal += parseFloat(m.numerador);
      data.denominadorTotal += parseFloat(m.denominador);
      data.mediciones.push({
        periodo: m.periodo,
        numerador: m.numerador,
        denominador: m.denominador,
        resultado: m.resultado,
      });
    });

    // Generar XML según especificación SISPRO
    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('ReporteIndicadoresSIC', {
        xmlns: 'http://www.minsalud.gov.co/indicadores',
        version: '1.0',
      })
      .ele('Encabezado')
        .ele('CodigoHabilitacion').txt(process.env.CODIGO_HABILITACION || 'SIN_CODIGO').up()
        .ele('NombreIPS').txt(process.env.NOMBRE_IPS || 'Clínica Mía').up()
        .ele('Periodo').txt(periodo).up()
        .ele('FechaGeneracion').txt(new Date().toISOString()).up()
      .up()
      .ele('Indicadores');

    for (const [, data] of indicadoresMap) {
      const resultado = data.denominadorTotal > 0
        ? data.numeradorTotal / data.denominadorTotal
        : 0;

      xml.ele('Indicador')
        .ele('Codigo').txt(data.codigo).up()
        .ele('Nombre').txt(data.nombre).up()
        .ele('Dominio').txt(data.dominio).up()
        .ele('Numerador').txt(data.numeradorTotal.toFixed(2)).up()
        .ele('Denominador').txt(data.denominadorTotal.toFixed(2)).up()
        .ele('Resultado').txt(resultado.toFixed(4)).up()
        .ele('Mediciones')
          .forEach((el) => {
            data.mediciones.forEach((m) => {
              el.ele('Medicion')
                .ele('Periodo').txt(m.periodo).up()
                .ele('Numerador').txt(parseFloat(m.numerador).toFixed(2)).up()
                .ele('Denominador').txt(parseFloat(m.denominador).toFixed(2)).up()
                .ele('Resultado').txt(parseFloat(m.resultado).toFixed(4)).up()
              .up();
            });
          })
        .up()
      .up();
    }

    return xml.end({ prettyPrint: true });
  }

  /**
   * Generar plantilla Excel formato PISIS
   */
  async generarPlantillaPISIS(periodo) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - Sistema de Calidad';
    workbook.created = new Date();

    // Hoja de indicadores
    const sheet = workbook.addWorksheet('Indicadores SIC', {
      properties: { tabColor: { argb: '4ECDC4' } },
    });

    // Configurar columnas
    sheet.columns = [
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Nombre del Indicador', key: 'nombre', width: 50 },
      { header: 'Dominio', key: 'dominio', width: 15 },
      { header: 'Numerador', key: 'numerador', width: 15 },
      { header: 'Denominador', key: 'denominador', width: 15 },
      { header: 'Resultado', key: 'resultado', width: 15 },
      { header: 'Meta', key: 'meta', width: 12 },
      { header: 'Cumple Meta', key: 'cumpleMeta', width: 12 },
      { header: 'Semáforo', key: 'semaforo', width: 12 },
      { header: 'Análisis', key: 'analisis', width: 40 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A3A52' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Obtener datos
    const [anio, sem] = periodo.split('-');
    const mesesSemestre = sem === 'S1'
      ? ['01', '02', '03', '04', '05', '06']
      : ['07', '08', '09', '10', '11', '12'];
    const periodos = mesesSemestre.map((mes) => `${anio}-${mes}`);

    const indicadores = await prisma.indicadorSIC.findMany({
      where: { activo: true },
      include: {
        mediciones: {
          where: { periodo: { in: periodos } },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    // Agregar datos
    indicadores.forEach((indicador) => {
      // Consolidar mediciones del semestre
      let numTotal = 0;
      let denTotal = 0;
      indicador.mediciones.forEach((m) => {
        numTotal += parseFloat(m.numerador);
        denTotal += parseFloat(m.denominador);
      });

      const resultado = denTotal > 0 ? numTotal / denTotal : 0;
      const meta = indicador.metaInstitucional || indicador.metaNacional;
      const cumpleMeta = meta ? resultado >= parseFloat(meta) : null;

      let semaforo = 'Verde';
      if (meta) {
        const porcentaje = (resultado / parseFloat(meta)) * 100;
        if (porcentaje < 70) semaforo = 'Rojo';
        else if (porcentaje < 90) semaforo = 'Amarillo';
      }

      const row = sheet.addRow({
        codigo: indicador.codigo,
        nombre: indicador.nombre,
        dominio: indicador.dominio,
        numerador: numTotal,
        denominador: denTotal,
        resultado: resultado.toFixed(4),
        meta: meta || 'N/A',
        cumpleMeta: cumpleMeta === null ? 'N/A' : cumpleMeta ? 'Sí' : 'No',
        semaforo,
        analisis: indicador.mediciones.length > 0
          ? indicador.mediciones[indicador.mediciones.length - 1].analisis || ''
          : '',
      });

      // Colorear semáforo
      const semaforoCell = row.getCell('semaforo');
      const colores = {
        Verde: '28A745',
        Amarillo: 'FFC107',
        Rojo: 'DC3545',
      };
      semaforoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colores[semaforo] },
      };
      semaforoCell.font = { color: { argb: semaforo === 'Amarillo' ? '000000' : 'FFFFFF' } };
    });

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.addRow(['Reporte de Indicadores SIC - Resolución 256/2016']);
    resumenSheet.addRow(['']);
    resumenSheet.addRow(['Período:', periodo]);
    resumenSheet.addRow(['Fecha Generación:', new Date().toLocaleDateString('es-CO')]);
    resumenSheet.addRow(['IPS:', process.env.NOMBRE_IPS || 'Clínica Mía']);
    resumenSheet.addRow(['Código Habilitación:', process.env.CODIGO_HABILITACION || '']);
    resumenSheet.addRow(['']);
    resumenSheet.addRow(['Total Indicadores:', indicadores.length]);

    // Contar por dominio
    const porDominio = {};
    indicadores.forEach((i) => {
      porDominio[i.dominio] = (porDominio[i.dominio] || 0) + 1;
    });

    resumenSheet.addRow(['']);
    resumenSheet.addRow(['Indicadores por Dominio:']);
    Object.entries(porDominio).forEach(([dominio, count]) => {
      resumenSheet.addRow([dominio, count]);
    });

    return workbook;
  }

  /**
   * Generar archivo CSV para carga masiva
   */
  async generarCSV(periodo) {
    const [anio, sem] = periodo.split('-');
    const mesesSemestre = sem === 'S1'
      ? ['01', '02', '03', '04', '05', '06']
      : ['07', '08', '09', '10', '11', '12'];
    const periodos = mesesSemestre.map((mes) => `${anio}-${mes}`);

    const mediciones = await prisma.medicionSIC.findMany({
      where: { periodo: { in: periodos } },
      include: { indicador: true },
      orderBy: [{ indicadorId: 'asc' }, { periodo: 'asc' }],
    });

    // Generar CSV
    const headers = [
      'Codigo_Indicador',
      'Nombre_Indicador',
      'Dominio',
      'Periodo',
      'Numerador',
      'Denominador',
      'Resultado',
      'Meta',
      'Cumple_Meta',
      'Semaforo',
    ];

    let csv = headers.join(';') + '\n';

    mediciones.forEach((m) => {
      const row = [
        m.indicador.codigo,
        `"${m.indicador.nombre.replace(/"/g, '""')}"`,
        m.indicador.dominio,
        m.periodo,
        m.numerador,
        m.denominador,
        m.resultado,
        m.metaVigente || '',
        m.cumpleMeta === null ? '' : m.cumpleMeta ? 'SI' : 'NO',
        m.semaforoEstado || '',
      ];
      csv += row.join(';') + '\n';
    });

    return csv;
  }
}

module.exports = new ExportadorSISPROService();
