/**
 * Rutas de Historia Clínica Electrónica (HCE)
 * Incluye generación de PDF conforme a normatividad colombiana
 */
const { Hono } = require('hono');
const hcePdfService = require('../services/hce-pdf.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const hce = new Hono();

// Todas las rutas requieren autenticación
hce.use('*', authMiddleware);

/**
 * @swagger
 * /hce/{pacienteId}/pdf:
 *   get:
 *     summary: Generar PDF de Historia Clínica Electrónica
 *     description: Genera un documento PDF completo con toda la información de la HCE del paciente conforme a la normatividad colombiana (Res. 1995/1999, Res. 839/2017)
 *     tags: [HCE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del paciente
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del rango (YYYY-MM-DD)
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del rango (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error al generar el PDF
 */
hce.get('/:pacienteId/pdf', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const fechaDesde = c.req.query('fechaDesde');
    const fechaHasta = c.req.query('fechaHasta');

    // Construir opciones de filtro por fecha
    const opciones = {};
    if (fechaDesde && fechaHasta) {
      // Parsear fechas como fecha local (no UTC) para Colombia
      const [yearD, monthD, dayD] = fechaDesde.split('-').map(Number);
      const [yearH, monthH, dayH] = fechaHasta.split('-').map(Number);

      opciones.fechaDesde = new Date(yearD, monthD - 1, dayD, 0, 0, 0, 0);
      opciones.fechaHasta = new Date(yearH, monthH - 1, dayH, 23, 59, 59, 999);
    }

    // Generar el PDF
    const pdfBuffer = await hcePdfService.generarPDF(pacienteId, opciones);

    // Obtener nombre del paciente para el archivo
    const prisma = require('../db/prisma');
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { nombre: true, apellido: true, cedula: true },
    });

    const nombreArchivo = paciente
      ? `HCE_${paciente.cedula}_${paciente.apellido}_${paciente.nombre}.pdf`
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_.-]/g, '')
      : `HCE_${pacienteId}.pdf`;

    // Configurar headers para descarga de PDF
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    c.header('Content-Length', pdfBuffer.length.toString());

    return c.body(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF de HCE:', err);
    return c.json(error(err.message || 'Error al generar el PDF'), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /hce/{pacienteId}/pdf/preview:
 *   get:
 *     summary: Vista previa del PDF de HCE (inline)
 *     description: Muestra el PDF en el navegador en lugar de descargarlo
 *     tags: [HCE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: PDF para visualización
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
hce.get('/:pacienteId/pdf/preview', async (c) => {
  try {
    const { pacienteId } = c.req.param();

    // Generar el PDF
    const pdfBuffer = await hcePdfService.generarPDF(pacienteId);

    // Configurar headers para visualización en navegador
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', 'inline');
    c.header('Content-Length', pdfBuffer.length.toString());

    return c.body(pdfBuffer);
  } catch (err) {
    console.error('Error generando preview de HCE:', err);
    return c.json(error(err.message || 'Error al generar el PDF'), err.statusCode || 500);
  }
});

/**
 * @swagger
 * /hce/{pacienteId}/resumen:
 *   get:
 *     summary: Obtener resumen de la HCE
 *     description: Retorna un resumen con las estadísticas de la historia clínica
 *     tags: [HCE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pacienteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Resumen de la HCE
 */
hce.get('/:pacienteId/resumen', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const prisma = require('../db/prisma');

    // Obtener conteos en paralelo
    const [
      evolucionesCount,
      signosVitalesCount,
      diagnosticosCount,
      alertasCount,
      prescripcionesCount,
      procedimientosCount,
      urgenciasCount,
      hospitalizacionesCount,
      interconsultasCount,
      notasEnfermeriaCount,
    ] = await Promise.all([
      prisma.evolucionClinica.count({ where: { pacienteId } }),
      prisma.signoVital.count({ where: { pacienteId } }),
      prisma.diagnosticoHCE.count({ where: { pacienteId } }),
      prisma.alertaClinica.count({ where: { pacienteId } }),
      prisma.prescripcion.count({ where: { pacienteId } }),
      prisma.procedimiento.count({ where: { pacienteId } }),
      prisma.atencionUrgencia.count({ where: { pacienteId } }),
      prisma.admision.count({ where: { pacienteId } }),
      prisma.interconsulta.count({ where: { pacienteId } }),
      prisma.notaEnfermeria.count({ where: { pacienteId } }),
    ]);

    // Obtener última actualización
    const ultimaEvolucion = await prisma.evolucionClinica.findFirst({
      where: { pacienteId },
      orderBy: { fecha: 'desc' },
      select: { fecha: true },
    });

    return c.json(success({
      resumen: {
        evoluciones: evolucionesCount,
        signosVitales: signosVitalesCount,
        diagnosticos: diagnosticosCount,
        alertas: alertasCount,
        prescripciones: prescripcionesCount,
        procedimientos: procedimientosCount,
        urgencias: urgenciasCount,
        hospitalizaciones: hospitalizacionesCount,
        interconsultas: interconsultasCount,
        notasEnfermeria: notasEnfermeriaCount,
        totalRegistros: evolucionesCount + signosVitalesCount + diagnosticosCount +
                       prescripcionesCount + procedimientosCount + urgenciasCount +
                       hospitalizacionesCount + interconsultasCount + notasEnfermeriaCount,
        ultimaActualizacion: ultimaEvolucion?.fecha || null,
      },
    }, 'Resumen de HCE obtenido'));
  } catch (err) {
    console.error('Error obteniendo resumen de HCE:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = hce;
