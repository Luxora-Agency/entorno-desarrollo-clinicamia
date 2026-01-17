import * as XLSX from 'xlsx';

// Zona horaria de Colombia para formateo de fechas
const TIMEZONE_BOGOTA = 'America/Bogota';

/**
 * Export inventory data to Excel
 */
export function exportInventarioToExcel(items, tipo = 'TODOS') {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Inventario_${tipo}_${timestamp}.xlsx`;

  // Prepare data rows
  const data = items.map((item, index) => ({
    '#': index + 1,
    'Código': item.codigo || '',
    'Nombre': item.nombre || '',
    'Tipo': item.tipo || '',
    'Lote': item.lote || '',
    'Fecha Vencimiento': item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString('es-CO', { timeZone: TIMEZONE_BOGOTA }) : '',
    'Cantidad': item.cantidadActual || 0,
    'Unidad': item.unidadMedida || '',
    'Stock Mínimo': item.stockMinimo || '',
    'Stock Máximo': item.stockMaximo || '',
    'Ubicación': item.ubicacionFisica || '',
    'Laboratorio': item.laboratorio || '',
    'Registro Sanitario': item.registroSanitario || '',
    'Estado': item.tieneAlertaVencimiento ? 'Alerta Vencimiento' : item.tieneAlertaStock ? 'Stock Bajo' : 'Normal',
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const wscols = [
    { wch: 5 },  // #
    { wch: 15 }, // Código
    { wch: 40 }, // Nombre
    { wch: 20 }, // Tipo
    { wch: 15 }, // Lote
    { wch: 18 }, // Fecha Vencimiento
    { wch: 10 }, // Cantidad
    { wch: 10 }, // Unidad
    { wch: 12 }, // Stock Mínimo
    { wch: 12 }, // Stock Máximo
    { wch: 20 }, // Ubicación
    { wch: 25 }, // Laboratorio
    { wch: 20 }, // Registro Sanitario
    { wch: 18 }, // Estado
  ];
  ws['!cols'] = wscols;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

  // Add summary sheet
  const summary = [
    ['Reporte de Inventario'],
    ['Tipo:', tipo],
    ['Fecha:', new Date().toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA })],
    ['Total Items:', items.length],
    [],
    ['Resumen por Tipo'],
  ];

  // Count by type
  const countByType = items.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  }, {});

  Object.entries(countByType).forEach(([tipo, count]) => {
    summary.push([tipo, count]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // Download
  XLSX.writeFile(wb, filename);
}

/**
 * Export farmacovigilancia reports to Excel
 */
export function exportFarmacovigilanciaToExcel(reportes) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Farmacovigilancia_${timestamp}.xlsx`;

  const data = reportes.map((reporte, index) => ({
    '#': index + 1,
    'Fecha Evento': reporte.fechaEvento ? new Date(reporte.fechaEvento).toLocaleDateString('es-CO', { timeZone: TIMEZONE_BOGOTA }) : '',
    'Medicamento': reporte.medicamento || '',
    'Lote': reporte.lote || '',
    'Laboratorio': reporte.laboratorio || '',
    'Tipo Reporte': reporte.tipoReporte || '',
    'Gravedad': reporte.gravedadReaccion || '',
    'Causalidad': reporte.causalidad || '',
    'Descripción Reacción': reporte.descripcionReaccion || '',
    'Desenlace': reporte.desenlace || '',
    'Reportado INVIMA': reporte.reportadoINVIMA ? 'Sí' : 'No',
    'N° INVIMA': reporte.numeroReporteINVIMA || '',
    'Estado': reporte.estado || '',
    'Reportado Por': reporte.reportador?.nombre || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 },
    { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 50 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

  // Summary
  const summary = [
    ['Reporte de Farmacovigilancia'],
    ['Fecha:', new Date().toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA })],
    ['Total Reportes:', reportes.length],
    [],
    ['Por Gravedad'],
  ];

  const countByGravedad = reportes.reduce((acc, r) => {
    acc[r.gravedadReaccion] = (acc[r.gravedadReaccion] || 0) + 1;
    return acc;
  }, {});

  Object.entries(countByGravedad).forEach(([gravedad, count]) => {
    summary.push([gravedad, count]);
  });

  summary.push([]);
  summary.push(['Reportados a INVIMA:', reportes.filter(r => r.reportadoINVIMA).length]);
  summary.push(['Pendientes INVIMA:', reportes.filter(r => !r.reportadoINVIMA).length]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  XLSX.writeFile(wb, filename);
}

/**
 * Export tecnovigilancia reports to Excel
 */
export function exportTecnovigilanciaToExcel(reportes) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Tecnovigilancia_${timestamp}.xlsx`;

  const data = reportes.map((reporte, index) => ({
    '#': index + 1,
    'Fecha Evento': reporte.fechaEvento ? new Date(reporte.fechaEvento).toLocaleDateString('es-CO', { timeZone: TIMEZONE_BOGOTA }) : '',
    'Dispositivo': reporte.dispositivoMedico || '',
    'Fabricante': reporte.fabricante || '',
    'Modelo': reporte.modelo || '',
    'N° Serie': reporte.numeroSerie || '',
    'Lote': reporte.lote || '',
    'Clasificación': reporte.clasificacion || '',
    'Tipo Evento': reporte.tipoEvento || '',
    'Gravedad': reporte.gravedadEvento || '',
    'Descripción': reporte.descripcionEvento || '',
    'Desenlace': reporte.desenlace || '',
    'Reportado INVIMA': reporte.reportadoINVIMA ? 'Sí' : 'No',
    'N° INVIMA': reporte.numeroReporteINVIMA || '',
    'Estado': reporte.estado || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 12 },
    { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

  // Summary
  const summary = [
    ['Reporte de Tecnovigilancia'],
    ['Fecha:', new Date().toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA })],
    ['Total Reportes:', reportes.length],
    [],
    ['Por Tipo de Evento'],
  ];

  const countByTipo = reportes.reduce((acc, r) => {
    const tipo = r.tipoEvento || 'Sin clasificar';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  Object.entries(countByTipo).forEach(([tipo, count]) => {
    summary.push([tipo, count]);
  });

  summary.push([]);
  summary.push(['Reportados a INVIMA:', reportes.filter(r => r.reportadoINVIMA).length]);
  summary.push(['Pendientes INVIMA:', reportes.filter(r => !r.reportadoINVIMA).length]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  XLSX.writeFile(wb, filename);
}

/**
 * Export temperature/humidity logs to Excel
 */
export function exportTemperaturaToExcel(registros, area = 'TODAS') {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Temperatura_Humedad_${area}_${timestamp}.xlsx`;

  const data = registros.map((registro, index) => ({
    '#': index + 1,
    'Fecha': registro.fecha ? new Date(registro.fecha).toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA }) : '',
    'Área': registro.area || '',
    'Temperatura (°C)': registro.temperatura || '',
    'Temperatura Min': registro.temperaturaMin || '',
    'Temperatura Max': registro.temperaturaMax || '',
    'En Rango Temp': registro.temperaturaEnRango ? 'Sí' : 'No',
    'Humedad (%)': registro.humedad || '',
    'Humedad Min': registro.humedadMin || '',
    'Humedad Max': registro.humedadMax || '',
    'En Rango Hum': registro.humedadEnRango ? 'Sí' : 'No',
    'Alerta': registro.requiereAlerta ? 'Sí' : 'No',
    'Acción Correctiva': registro.accionCorrectiva || '',
    'Registrado Por': registro.registrador?.nombre || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 8 }, { wch: 40 }, { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');

  // Summary
  const summary = [
    ['Registro de Temperatura y Humedad'],
    ['Área:', area],
    ['Fecha:', new Date().toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA })],
    ['Total Registros:', registros.length],
    [],
    ['Estadísticas'],
    ['Fuera de Rango:', registros.filter(r => r.requiereAlerta).length],
    ['Dentro de Rango:', registros.filter(r => !r.requiereAlerta).length],
  ];

  if (registros.length > 0) {
    const temps = registros.map(r => r.temperatura).filter(t => t != null);
    const hums = registros.map(r => r.humedad).filter(h => h != null);

    summary.push([]);
    summary.push(['Temperatura Promedio:', temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) + '°C' : 'N/A']);
    summary.push(['Temperatura Mínima:', temps.length > 0 ? Math.min(...temps).toFixed(2) + '°C' : 'N/A']);
    summary.push(['Temperatura Máxima:', temps.length > 0 ? Math.max(...temps).toFixed(2) + '°C' : 'N/A']);
    summary.push([]);
    summary.push(['Humedad Promedio:', hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(2) + '%' : 'N/A']);
    summary.push(['Humedad Mínima:', hums.length > 0 ? Math.min(...hums).toFixed(2) + '%' : 'N/A']);
    summary.push(['Humedad Máxima:', hums.length > 0 ? Math.max(...hums).toFixed(2) + '%' : 'N/A']);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  XLSX.writeFile(wb, filename);
}

/**
 * Export alerts to Excel
 */
export function exportAlertasToExcel(alertas) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Alertas_Medicamentos_${timestamp}.xlsx`;

  const data = alertas.map((alerta, index) => ({
    '#': index + 1,
    'Fecha Alerta': alerta.fechaAlerta ? new Date(alerta.fechaAlerta).toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA }) : '',
    'Tipo': alerta.tipo || '',
    'Prioridad': alerta.prioridad || '',
    'Título': alerta.titulo || '',
    'Descripción': alerta.descripcion || '',
    'Atendida': alerta.atendida ? 'Sí' : 'No',
    'Fecha Atención': alerta.fechaAtencion ? new Date(alerta.fechaAtencion).toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA }) : '',
    'Atendedor': alerta.atendedor?.nombre || '',
    'Observaciones': alerta.observacionesAtencion || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 30 },
    { wch: 50 }, { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alertas');

  // Summary
  const summary = [
    ['Reporte de Alertas'],
    ['Fecha:', new Date().toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA })],
    ['Total Alertas:', alertas.length],
    ['Atendidas:', alertas.filter(a => a.atendida).length],
    ['Pendientes:', alertas.filter(a => !a.atendida).length],
    [],
    ['Por Prioridad'],
  ];

  const countByPrioridad = alertas.reduce((acc, a) => {
    acc[a.prioridad] = (acc[a.prioridad] || 0) + 1;
    return acc;
  }, {});

  Object.entries(countByPrioridad).forEach(([prioridad, count]) => {
    summary.push([prioridad, count]);
  });

  summary.push([]);
  summary.push(['Por Tipo']);

  const countByTipo = alertas.reduce((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] || 0) + 1;
    return acc;
  }, {});

  Object.entries(countByTipo).forEach(([tipo, count]) => {
    summary.push([tipo, count]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  XLSX.writeFile(wb, filename);
}

/**
 * Export general dashboard summary to Excel
 */
export function exportDashboardToExcel(resumenGeneral) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Dashboard_Medicamentos_${timestamp}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summary = [
    ['Dashboard General - Medicamentos, Dispositivos e Insumos'],
    ['Fecha Generación:', new Date().toLocaleString('es-CO', { timeZone: TIMEZONE_BOGOTA })],
    [],
    ['INVENTARIO'],
    ['Total Items:', resumenGeneral.inventario?.totales?.total || 0],
    ['Medicamentos:', resumenGeneral.inventario?.totales?.medicamentos || 0],
    ['Dispositivos:', resumenGeneral.inventario?.totales?.dispositivos || 0],
    ['Insumos:', resumenGeneral.inventario?.totales?.insumos || 0],
    ['Próximos a Vencer (30d):', resumenGeneral.inventario?.alertas?.proximosVencer30 || 0],
    ['Stock Bajo:', resumenGeneral.inventario?.alertas?.stockBajo || 0],
    ['Vencidos:', resumenGeneral.inventario?.alertas?.vencidos || 0],
    [],
    ['FARMACOVIGILANCIA'],
    ['Total Reportes:', resumenGeneral.farmacovigilancia?.totales?.total || 0],
    ['Este Mes:', resumenGeneral.farmacovigilancia?.totales?.mes || 0],
    ['Pendientes INVIMA:', resumenGeneral.farmacovigilancia?.totales?.pendientesINVIMA || 0],
    ['Reportados INVIMA:', resumenGeneral.farmacovigilancia?.totales?.reportadosINVIMA || 0],
    [],
    ['TECNOVIGILANCIA'],
    ['Total Reportes:', resumenGeneral.tecnovigilancia?.totales?.total || 0],
    ['Este Mes:', resumenGeneral.tecnovigilancia?.totales?.mes || 0],
    ['Pendientes INVIMA:', resumenGeneral.tecnovigilancia?.totales?.pendientesINVIMA || 0],
    ['Reportados INVIMA:', resumenGeneral.tecnovigilancia?.totales?.reportadosINVIMA || 0],
    [],
    ['ALERTAS'],
    ['Total Activas:', resumenGeneral.alertas?.totales?.activas || 0],
    ['Críticas:', resumenGeneral.alertas?.totales?.criticas || 0],
    ['Atendidas:', resumenGeneral.alertas?.totales?.atendidas || 0],
    [],
    ['TEMPERATURA Y HUMEDAD'],
    ['Total Registros:', resumenGeneral.temperatura?.totales?.total || 0],
    ['Fuera de Rango:', resumenGeneral.temperatura?.totales?.fueraDeRango || 0],
    [],
    ['DOCUMENTOS'],
    ['Protocolos Vigentes:', resumenGeneral.protocolos?.totales?.vigentes || 0],
    ['Formatos:', resumenGeneral.formatos?.totales?.formatos || 0],
    ['Instancias Formatos:', resumenGeneral.formatos?.totales?.instancias || 0],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  XLSX.writeFile(wb, filename);
}
