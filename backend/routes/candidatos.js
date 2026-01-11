const { Hono } = require('hono');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const candidatoService = require('../services/candidato.service');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, error, paginated } = require('../utils/response');
const {
  createCandidatoSchema,
  updateCandidatoSchema,
  updateStatusSchema,
  queryCandidatoSchema,
} = require('../validators/candidato.schema');

const router = new Hono();

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/candidatos');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// =====================
// PUBLIC ROUTES - No authentication required
// =====================

/**
 * GET /candidates/public/vacantes - Listar vacantes abiertas
 */
router.get('/public/vacantes', async (c) => {
  try {
    const query = c.req.query();
    const result = await candidatoService.getVacantesPublicas({
      departamento: query.departamento,
      tipoContrato: query.tipoContrato,
      search: query.search,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
    return c.json(success(result, 'Vacantes obtenidas'));
  } catch (err) {
    console.error('Error fetching vacantes:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /candidates/public/vacantes/:id - Detalle de una vacante
 */
router.get('/public/vacantes/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const vacante = await candidatoService.getVacantePublica(id);
    return c.json(success(vacante, 'Vacante obtenida'));
  } catch (err) {
    console.error('Error fetching vacante:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /candidates/public/departamentos - Departamentos con vacantes abiertas
 */
router.get('/public/departamentos', async (c) => {
  try {
    const departamentos = await candidatoService.getDepartamentosConVacantes();
    return c.json(success(departamentos, 'Departamentos obtenidos'));
  } catch (err) {
    console.error('Error fetching departamentos:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /candidates/public/upload - Subir documento de candidato (CV, diplomas, etc.)
 * Public endpoint for file uploads during job application
 */
router.post('/public/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    const fileType = body.fileType || 'documento'; // hojaVida, diplomaMedico, etc.

    if (!file) {
      return c.json(error('Archivo es requerido'), 400);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(error('El archivo excede el tamaño máximo de 10MB'), 400);
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      return c.json(error('Tipo de archivo no permitido. Use PDF, Word o imágenes'), 400);
    }

    // Generate unique filename
    const extension = path.extname(file.name);
    const nombreArchivo = `${uuidv4()}${extension}`;
    const rutaArchivo = path.join(UPLOAD_DIR, nombreArchivo);

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(rutaArchivo, buffer);

    // Generate public URL
    const publicUrl = `/uploads/candidatos/${nombreArchivo}`;

    // Return file info (compatible with frontend StorageService expectations)
    return c.json(success({
      id: uuidv4(), // Generate a unique ID for the document
      filename: nombreArchivo,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileType: fileType,
      url: publicUrl,
      uploadStatus: 'completed',
    }, 'Archivo subido exitosamente'), 201);
  } catch (err) {
    console.error('Error uploading file:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /candidates/public/vacantes/:id/aplicar - Aplicar a una vacante específica
 */
router.post('/public/vacantes/:id/aplicar', validate(createCandidatoSchema), async (c) => {
  try {
    const { id: vacanteId } = c.req.param();
    const data = c.req.validData;
    const result = await candidatoService.aplicarAVacante(vacanteId, data);
    return c.json(success(result, 'Aplicación enviada exitosamente'), 201);
  } catch (err) {
    console.error('Error applying to vacante:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * POST /candidates/public - Submit a new job application (public) - Legacy endpoint
 */
router.post('/public', validate(createCandidatoSchema), async (c) => {
  try {
    const data = c.req.validData;
    const candidato = await candidatoService.create(data);
    return c.json(success({ id: candidato.id }, 'Solicitud enviada exitosamente'), 201);
  } catch (err) {
    console.error('Error creating candidate:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// =====================
// PROTECTED ROUTES - Require authentication and permissions
// =====================

/**
 * GET /candidates - Get all candidates with pagination (admin)
 */
router.get('/', authMiddleware, permissionMiddleware('candidatos'), async (c) => {
  try {
    const query = c.req.query();
    const parsed = queryCandidatoSchema.parse({
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      estado: query.estado,
      profession: query.profession,
      specialty: query.specialty,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const result = await candidatoService.findAll(parsed);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    console.error('Error fetching candidates:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /candidates/stats - Get statistics for dashboard (admin)
 */
router.get('/stats', authMiddleware, permissionMiddleware('candidatos'), async (c) => {
  try {
    const stats = await candidatoService.getStats();
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    console.error('Error fetching stats:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /candidates/export - Export candidates (admin)
 */
router.get('/export', authMiddleware, permissionMiddleware('candidatos'), async (c) => {
  try {
    const query = c.req.query();
    const candidatos = await candidatoService.exportAll(query);
    return c.json(success(candidatos, 'Candidatos exportados'));
  } catch (err) {
    console.error('Error exporting candidates:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /candidates/:id - Get a single candidate (admin)
 */
router.get('/:id', authMiddleware, permissionMiddleware('candidatos'), async (c) => {
  try {
    const { id } = c.req.param();
    const candidato = await candidatoService.findById(id);
    return c.json(success(candidato, 'Candidato obtenido'));
  } catch (err) {
    console.error('Error fetching candidate:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PUT /candidates/:id - Update a candidate (admin)
 */
router.put('/:id', authMiddleware, permissionMiddleware('candidatos'), validate(updateCandidatoSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const candidato = await candidatoService.update(id, data);
    return c.json(success(candidato, 'Candidato actualizado'));
  } catch (err) {
    console.error('Error updating candidate:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * PATCH /candidates/:id/status - Update candidate status (admin)
 */
router.patch('/:id/status', authMiddleware, permissionMiddleware('candidatos'), validate(updateStatusSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const statusData = c.req.validData;
    const candidato = await candidatoService.updateStatus(id, userId, statusData);
    return c.json(success(candidato, 'Estado del candidato actualizado'));
  } catch (err) {
    console.error('Error updating candidate status:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /candidates/:id - Delete a candidate (admin)
 */
router.delete('/:id', authMiddleware, permissionMiddleware('candidatos'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await candidatoService.delete(id);
    return c.json(success(null, result.message));
  } catch (err) {
    console.error('Error deleting candidate:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = router;
