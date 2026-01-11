/**
 * Rutas para certificados médicos
 */
const { Hono } = require('hono');
const certificadoService = require('../services/certificado.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const certificados = new Hono();

certificados.use('*', authMiddleware);

/**
 * POST /certificados - Crear nuevo certificado
 */
certificados.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const result = await certificadoService.create(data);
    return c.json(success(result, 'Certificado creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /certificados/paciente/:pacienteId - Obtener certificados de un paciente
 */
certificados.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const data = await certificadoService.getByPaciente(pacienteId);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * GET /certificados/:id/pdf - Descargar PDF del certificado
 */
certificados.get('/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const pdfBuffer = await certificadoService.generatePdf(id);

    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="certificado-${id}.pdf"`);

    return c.body(pdfBuffer);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /certificados/:id - Obtener certificado por ID
 */
certificados.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await certificadoService.getById(id);
    return c.json(success(data));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * PUT /certificados/:id/pdf - Actualizar URL del PDF
 */
certificados.put('/:id/pdf', async (c) => {
  try {
    const { id } = c.req.param();
    const { pdfUrl } = await c.req.json();
    const data = await certificadoService.updatePdfUrl(id, pdfUrl);
    return c.json(success(data, 'PDF actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = certificados;
