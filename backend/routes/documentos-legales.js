/**
 * Rutas para documentos legales de pacientes
 * (términos y condiciones, política de privacidad)
 */
const { Hono } = require('hono');
const documentoLegalService = require('../services/documentoLegal.service');
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const documentosLegales = new Hono();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

/**
 * GET /documentos-legales/public/terminos
 * Obtener términos y condiciones (público)
 */
documentosLegales.get('/public/terminos', async (c) => {
  try {
    const documento = await documentoLegalService.getTerminosCondiciones();

    if (!documento) {
      return c.json(error('Términos y condiciones no disponibles'), 404);
    }

    return c.json(success({
      titulo: documento.titulo,
      contenido: documento.contenido,
      version: documento.version,
      updatedAt: documento.updatedAt
    }));
  } catch (err) {
    console.error('Error fetching términos:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-legales/public/privacidad
 * Obtener política de privacidad (público)
 */
documentosLegales.get('/public/privacidad', async (c) => {
  try {
    const documento = await documentoLegalService.getPoliticaPrivacidad();

    if (!documento) {
      return c.json(error('Política de privacidad no disponible'), 404);
    }

    return c.json(success({
      titulo: documento.titulo,
      contenido: documento.contenido,
      version: documento.version,
      updatedAt: documento.updatedAt
    }));
  } catch (err) {
    console.error('Error fetching privacidad:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-legales/public/:tipo
 * Obtener cualquier documento legal público por tipo
 */
documentosLegales.get('/public/:tipo', async (c) => {
  try {
    const tipo = c.req.param('tipo').toUpperCase();
    const documento = await documentoLegalService.getByTipo(tipo);

    if (!documento.activo) {
      return c.json(error('Documento no disponible'), 404);
    }

    return c.json(success({
      titulo: documento.titulo,
      contenido: documento.contenido,
      version: documento.version,
      updatedAt: documento.updatedAt
    }));
  } catch (err) {
    console.error('Error fetching documento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ============================================
// RUTAS ADMINISTRATIVAS (requieren autenticación)
// ============================================

/**
 * GET /documentos-legales
 * Listar todos los documentos legales (admin)
 */
documentosLegales.get('/', authMiddleware, async (c) => {
  try {
    const documentos = await documentoLegalService.getAll();
    return c.json(success(documentos));
  } catch (err) {
    console.error('Error listing documentos:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-legales/:id
 * Obtener un documento por ID (admin)
 */
documentosLegales.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const documento = await documentoLegalService.getById(id);
    return c.json(success(documento));
  } catch (err) {
    console.error('Error fetching documento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-legales
 * Crear un nuevo documento legal (admin)
 */
documentosLegales.post('/', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user')?.id;

    if (!data.tipo || !data.titulo || !data.contenido) {
      return c.json(error('Tipo, título y contenido son requeridos'), 400);
    }

    const documento = await documentoLegalService.create(data, userId);
    return c.json(success(documento, 'Documento creado exitosamente'), 201);
  } catch (err) {
    console.error('Error creating documento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /documentos-legales/:id
 * Actualizar un documento legal (admin)
 */
documentosLegales.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const userId = c.get('user')?.id;

    const documento = await documentoLegalService.update(id, data, userId);
    return c.json(success(documento, 'Documento actualizado exitosamente'));
  } catch (err) {
    console.error('Error updating documento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /documentos-legales/tipo/:tipo
 * Actualizar o crear documento por tipo (upsert) - admin
 */
documentosLegales.put('/tipo/:tipo', authMiddleware, async (c) => {
  try {
    const tipo = c.req.param('tipo').toUpperCase();
    const data = await c.req.json();
    const userId = c.get('user')?.id;

    if (!data.titulo || !data.contenido) {
      return c.json(error('Título y contenido son requeridos'), 400);
    }

    const documento = await documentoLegalService.upsertByTipo(tipo, data, userId);
    return c.json(success(documento, 'Documento guardado exitosamente'));
  } catch (err) {
    console.error('Error upserting documento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /documentos-legales/:id
 * Eliminar un documento legal (admin)
 */
documentosLegales.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await documentoLegalService.delete(id);
    return c.json(success(null, 'Documento eliminado exitosamente'));
  } catch (err) {
    console.error('Error deleting documento:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /documentos-legales/seed
 * Crear documentos de ejemplo (admin)
 */
documentosLegales.post('/seed', authMiddleware, async (c) => {
  try {
    const results = await documentoLegalService.seedDocumentos();

    if (results.length === 0) {
      return c.json(success(null, 'Los documentos ya existen'));
    }

    return c.json(success(results, `${results.length} documentos creados exitosamente`), 201);
  } catch (err) {
    console.error('Error seeding documentos:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = documentosLegales;
