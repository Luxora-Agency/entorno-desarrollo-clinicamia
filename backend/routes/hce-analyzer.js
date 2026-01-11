/**
 * Rutas para Analizador de HCE con IA
 * Permite subir documentos médicos externos, analizarlos y chatear sobre ellos
 */
const { Hono } = require('hono');
const documentoHCEService = require('../services/documentoHCE.service');
const hceAnalyzer = require('../services/hceAnalyzer.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

const hceAnalyzerRouter = new Hono();

// Todas las rutas requieren autenticación
hceAnalyzerRouter.use('*', authMiddleware);

/**
 * GET /hce-analyzer/status - Verificar estado del servicio
 */
hceAnalyzerRouter.get('/status', async (c) => {
  try {
    return c.json(success({
      configured: hceAnalyzer.isConfigured(),
      model: process.env.OPENAI_MODEL || 'gpt-4o'
    }));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

/**
 * POST /hce-analyzer/upload - Subir y analizar documento PDF
 * Body: FormData con 'file' y opcionalmente 'pacienteId'
 */
hceAnalyzerRouter.post('/upload', async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.parseBody();

    const file = formData.file;
    const pacienteId = formData.pacienteId || null;

    // Validar archivo
    if (!file || !file.name) {
      return c.json(error('Se requiere un archivo PDF'), 400);
    }

    // Validar tipo
    if (!file.type || file.type !== 'application/pdf') {
      return c.json(error('Solo se permiten archivos PDF'), 400);
    }

    // Validar tamaño (max 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(error('El archivo excede el límite de 15MB'), 400);
    }

    // Procesar archivo
    const fileData = await file.arrayBuffer();
    const documento = await documentoHCEService.uploadAndAnalyze(
      fileData,
      file.name,
      user.id,
      pacienteId
    );

    return c.json(success(documento, 'Documento subido. Análisis en proceso.'), 201);
  } catch (err) {
    console.error('Error en upload HCE:', err);
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /hce-analyzer/documentos - Listar documentos del doctor
 * Query params: pacienteId, estado, page, limit
 */
hceAnalyzerRouter.get('/documentos', async (c) => {
  try {
    const user = c.get('user');
    const { pacienteId, estado, page, limit } = c.req.query();

    const result = await documentoHCEService.listByDoctor(user.id, {
      pacienteId,
      estado,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    return c.json(paginated(result.documentos, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit)
    }));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /hce-analyzer/stats - Obtener estadísticas del doctor
 */
hceAnalyzerRouter.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    const stats = await documentoHCEService.getStats(user.id);
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * GET /hce-analyzer/documentos/:id - Obtener documento con análisis
 */
hceAnalyzerRouter.get('/documentos/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const documento = await documentoHCEService.getById(id, user.id);
    return c.json(success(documento));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /hce-analyzer/documentos/:id/chat - Chat sobre documento
 * Body: { pregunta: string }
 */
hceAnalyzerRouter.post('/documentos/:id/chat', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { pregunta } = await c.req.json();

    if (!pregunta || pregunta.trim().length < 3) {
      return c.json(error('La pregunta es muy corta'), 400);
    }

    if (pregunta.length > 2000) {
      return c.json(error('La pregunta es muy larga (máximo 2000 caracteres)'), 400);
    }

    const result = await documentoHCEService.chat(id, user.id, pregunta.trim());
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * POST /hce-analyzer/documentos/:id/reanalyze - Re-analizar documento
 */
hceAnalyzerRouter.post('/documentos/:id/reanalyze', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const result = await documentoHCEService.reanalyze(id, user.id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * DELETE /hce-analyzer/documentos/:id - Eliminar documento
 */
hceAnalyzerRouter.delete('/documentos/:id', async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    await documentoHCEService.delete(id, user.id);
    return c.json(success(null, 'Documento eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = hceAnalyzerRouter;
