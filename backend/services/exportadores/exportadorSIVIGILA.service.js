/**
 * Exportador SIVIGILA
 * Genera fichas epidemiológicas y archivos para el INS
 */
const { create } = require('xmlbuilder2');
const ExcelJS = require('exceljs');
const prisma = require('../../db/prisma');

class ExportadorSIVIGILAService {
  /**
   * Generar ficha epidemiológica individual en XML
   */
  async generarFichaEpidemiologica(notificacionId) {
    const notificacion = await prisma.notificacionSIVIGILA.findUnique({
      where: { id: notificacionId },
      include: {
        paciente: true,
      },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    const paciente = notificacion.paciente;
    const edad = paciente.fechaNacimiento
      ? Math.floor((new Date() - new Date(paciente.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('FichaNotificacionSIVIGILA', {
        xmlns: 'http://www.ins.gov.co/sivigila',
        version: '2.0',
      })
      .ele('DatosNotificacion')
        .ele('CodigoEvento').txt(notificacion.codigoEvento).up()
        .ele('NombreEvento').txt(notificacion.nombreEvento).up()
        .ele('TipoNotificacion').txt(notificacion.tipoNotificacion).up()
        .ele('SemanaEpidemiologica').txt(notificacion.semanaEpidemiologica.toString()).up()
        .ele('AnioEpidemiologico').txt(notificacion.anioEpidemiologico.toString()).up()
        .ele('FechaNotificacion').txt(notificacion.fechaNotificacion.toISOString().split('T')[0]).up()
      .up()
      .ele('DatosPaciente')
        .ele('TipoDocumento').txt(paciente.tipoDocumento || 'CC').up()
        .ele('NumeroDocumento').txt(paciente.cedula).up()
        .ele('PrimerNombre').txt(paciente.nombre.split(' ')[0]).up()
        .ele('SegundoNombre').txt(paciente.nombre.split(' ')[1] || '').up()
        .ele('PrimerApellido').txt(paciente.apellido.split(' ')[0]).up()
        .ele('SegundoApellido').txt(paciente.apellido.split(' ')[1] || '').up()
        .ele('FechaNacimiento').txt(paciente.fechaNacimiento?.toISOString().split('T')[0] || '').up()
        .ele('Edad').txt(edad?.toString() || '').up()
        .ele('UnidadEdad').txt('A').up() // A = Años
        .ele('Sexo').txt(paciente.genero === 'Masculino' ? 'M' : paciente.genero === 'Femenino' ? 'F' : 'I').up()
        .ele('Direccion').txt(paciente.direccion || '').up()
        .ele('Telefono').txt(paciente.telefono || '').up()
        .ele('Municipio').txt(paciente.municipio || '').up()
        .ele('Departamento').txt(paciente.departamento || '').up()
      .up()
      .ele('DatosClinicosEpidemiologicos')
        .ele('FechaInicioSintomas').txt(notificacion.fechaInicioSintomas?.toISOString().split('T')[0] || '').up()
        .ele('ClasificacionInicial').txt(notificacion.clasificacionInicial || '').up()
        .ele('ClasificacionFinal').txt(notificacion.clasificacionFinal || '').up()
        .ele('Hospitalizacion').txt(notificacion.hospitalizacion ? 'S' : 'N').up()
        .ele('CondicionFinal').txt(notificacion.condicionFinal || '').up()
        .ele('Observaciones').txt(notificacion.observaciones || '').up()
      .up()
      .ele('DatosNotificador')
        .ele('CodigoIPS').txt(process.env.CODIGO_HABILITACION || '').up()
        .ele('NombreIPS').txt(process.env.NOMBRE_IPS || 'Clínica Mía').up()
        .ele('FechaEnvio').txt(new Date().toISOString().split('T')[0]).up()
      .up();

    return xml.end({ prettyPrint: true });
  }

  /**
   * Generar archivo plano para carga masiva al SIVIGILA
   */
  async generarArchivoPlano(semana, anio) {
    const notificaciones = await prisma.notificacionSIVIGILA.findMany({
      where: {
        semanaEpidemiologica: parseInt(semana),
        anioEpidemiologico: parseInt(anio),
      },
      include: {
        paciente: true,
      },
    });

    // Formato: campos separados por pipe (|)
    // Según especificación INS
    let contenido = '';
    const codigoIPS = process.env.CODIGO_HABILITACION || '';

    notificaciones.forEach((n) => {
      const p = n.paciente;
      const edad = p.fechaNacimiento
        ? Math.floor((new Date() - new Date(p.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
        : 0;

      const campos = [
        codigoIPS,                                    // 1. Código IPS
        n.codigoEvento,                               // 2. Código evento
        semana,                                       // 3. Semana epidemiológica
        anio,                                         // 4. Año
        p.tipoDocumento || 'CC',                      // 5. Tipo documento
        p.cedula,                                     // 6. Número documento
        p.nombre.split(' ')[0],                       // 7. Primer nombre
        p.nombre.split(' ')[1] || '',                 // 8. Segundo nombre
        p.apellido.split(' ')[0],                     // 9. Primer apellido
        p.apellido.split(' ')[1] || '',               // 10. Segundo apellido
        p.fechaNacimiento?.toISOString().split('T')[0] || '', // 11. Fecha nacimiento
        edad,                                         // 12. Edad
        'A',                                          // 13. Unidad edad (Años)
        p.genero === 'Masculino' ? 'M' : p.genero === 'Femenino' ? 'F' : 'I', // 14. Sexo
        p.departamento || '',                         // 15. Departamento
        p.municipio || '',                            // 16. Municipio
        n.fechaNotificacion.toISOString().split('T')[0], // 17. Fecha notificación
        n.fechaInicioSintomas?.toISOString().split('T')[0] || '', // 18. Fecha inicio síntomas
        n.clasificacionInicial || '',                 // 19. Clasificación inicial
        n.hospitalizacion ? '1' : '0',                // 20. Hospitalización
        n.condicionFinal || '',                       // 21. Condición final
      ];

      contenido += campos.join('|') + '\n';
    });

    return contenido;
  }

  /**
   * Generar reporte semanal en Excel
   */
  async generarReporteSemanalExcel(semana, anio) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clínica Mía - SIVIGILA';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Notificaciones SIVIGILA', {
      properties: { tabColor: { argb: 'FF6B35' } },
    });

    // Configurar columnas
    sheet.columns = [
      { header: 'Código Evento', key: 'codigoEvento', width: 15 },
      { header: 'Nombre Evento', key: 'nombreEvento', width: 35 },
      { header: 'Tipo', key: 'tipoNotificacion', width: 12 },
      { header: 'Documento Paciente', key: 'documento', width: 18 },
      { header: 'Nombre Paciente', key: 'nombrePaciente', width: 30 },
      { header: 'Edad', key: 'edad', width: 8 },
      { header: 'Sexo', key: 'sexo', width: 8 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Fecha Notificación', key: 'fechaNotificacion', width: 18 },
      { header: 'Fecha Síntomas', key: 'fechaSintomas', width: 18 },
      { header: 'Clasificación', key: 'clasificacion', width: 15 },
      { header: 'Hospitalizado', key: 'hospitalizado', width: 12 },
      { header: 'Enviado INS', key: 'enviadoINS', width: 12 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B35' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Obtener datos
    const notificaciones = await prisma.notificacionSIVIGILA.findMany({
      where: {
        semanaEpidemiologica: parseInt(semana),
        anioEpidemiologico: parseInt(anio),
      },
      include: {
        paciente: true,
      },
      orderBy: { fechaNotificacion: 'asc' },
    });

    // Agregar datos
    notificaciones.forEach((n) => {
      const p = n.paciente;
      const edad = p.fechaNacimiento
        ? Math.floor((new Date() - new Date(p.fechaNacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      sheet.addRow({
        codigoEvento: n.codigoEvento,
        nombreEvento: n.nombreEvento,
        tipoNotificacion: n.tipoNotificacion,
        documento: p.cedula,
        nombrePaciente: `${p.nombre} ${p.apellido}`,
        edad,
        sexo: p.genero === 'Masculino' ? 'M' : p.genero === 'Femenino' ? 'F' : 'O',
        municipio: p.municipio || '',
        fechaNotificacion: n.fechaNotificacion,
        fechaSintomas: n.fechaInicioSintomas || '',
        clasificacion: n.clasificacionInicial || '',
        hospitalizado: n.hospitalizacion ? 'Sí' : 'No',
        enviadoINS: n.enviadoINS ? 'Sí' : 'No',
      });
    });

    // Agregar resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.addRow(['Reporte Semanal SIVIGILA']);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Semana Epidemiológica:', semana]);
    resumenSheet.addRow(['Año:', anio]);
    resumenSheet.addRow(['IPS:', process.env.NOMBRE_IPS || 'Clínica Mía']);
    resumenSheet.addRow(['Código Habilitación:', process.env.CODIGO_HABILITACION || '']);
    resumenSheet.addRow(['Fecha Generación:', new Date().toLocaleDateString('es-CO')]);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Total Notificaciones:', notificaciones.length]);
    resumenSheet.addRow(['Enviadas al INS:', notificaciones.filter((n) => n.enviadoINS).length]);
    resumenSheet.addRow(['Pendientes:', notificaciones.filter((n) => !n.enviadoINS).length]);

    // Contar por evento
    const porEvento = {};
    notificaciones.forEach((n) => {
      const key = `${n.codigoEvento} - ${n.nombreEvento}`;
      porEvento[key] = (porEvento[key] || 0) + 1;
    });

    resumenSheet.addRow([]);
    resumenSheet.addRow(['Notificaciones por Evento:']);
    Object.entries(porEvento).forEach(([evento, count]) => {
      resumenSheet.addRow([evento, count]);
    });

    return workbook;
  }

  /**
   * Generar consolidado mensual
   */
  async generarConsolidadoMensual(mes, anio) {
    // Calcular semanas del mes
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);

    const notificaciones = await prisma.notificacionSIVIGILA.findMany({
      where: {
        anioEpidemiologico: parseInt(anio),
        fechaNotificacion: {
          gte: primerDia,
          lte: ultimoDia,
        },
      },
      include: {
        paciente: true,
      },
    });

    // Agrupar por evento
    const porEvento = {};
    const porSemana = {};

    notificaciones.forEach((n) => {
      // Por evento
      if (!porEvento[n.codigoEvento]) {
        porEvento[n.codigoEvento] = {
          codigo: n.codigoEvento,
          nombre: n.nombreEvento,
          casos: 0,
          hospitalizados: 0,
        };
      }
      porEvento[n.codigoEvento].casos++;
      if (n.hospitalizacion) {
        porEvento[n.codigoEvento].hospitalizados++;
      }

      // Por semana
      if (!porSemana[n.semanaEpidemiologica]) {
        porSemana[n.semanaEpidemiologica] = 0;
      }
      porSemana[n.semanaEpidemiologica]++;
    });

    return {
      mes,
      anio,
      totalNotificaciones: notificaciones.length,
      porEvento: Object.values(porEvento),
      porSemana,
    };
  }
}

module.exports = new ExportadorSIVIGILAService();
