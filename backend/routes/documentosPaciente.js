/**
 * Rutas de documentos de pacientes
 */
const { Hono } = require('hono');
const documentoService = require('../services/documentoPaciente.service');
const { authMiddleware } = require('../middleware/auth');
const { success, error } = require('../utils/responses');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const documentos = new Hono();

// Aplicar autenticación a todas las rutas
documentos.use('*', authMiddleware);

/**
 * POST /documentos-paciente/upload - Subir archivo
 */
documentos.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    const pacienteId = body.pacienteId;
    const descripcion = body.descripcion;
    const categoria = body.categoria;

    if (!file || !pacienteId) {
      return c.json(error('Archivo y pacienteId son requeridos'), 400);
    }

    // Validar tamaño (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(error('El archivo excede el tamaño máximo de 10MB'), 400);
    }

    // Generar nombre único
    const extension = path.extname(file.name);
    const nombreArchivo = `${uuidv4()}${extension}`;
    const rutaArchivo = path.join(__dirname, '../uploads/pacientes', nombreArchivo);

    // Guardar archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(rutaArchivo, buffer);

    // Guardar info en BD
    const user = c.get('user');
    const documento = await documentoService.create({
      pacienteId,
      nombreArchivo,
      nombreOriginal: file.name,
      tipoArchivo: file.type || 'application/octet-stream',
      tamano: file.size,
      rutaArchivo,
      descripcion,
      categoria,
      uploadedBy: user?.id,
    });

    return c.json(success({ documento }), 201);
  } catch (err) {
    console.error('Error al subir archivo:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-paciente/paciente/:pacienteId - Obtener documentos de un paciente
 */
documentos.get('/paciente/:pacienteId', async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const docs = await documentoService.getByPacienteId(pacienteId);
    return c.json(success({ documentos: docs }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * GET /documentos-paciente/download/:id - Descargar archivo
 */
documentos.get('/download/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const documento = await documentoService.getById(id);

    // Verificar que el archivo existe
    const exists = await documentoService.fileExists(documento.rutaArchivo);
    if (!exists) {
      return c.json(error('Archivo no encontrado en el servidor'), 404);
    }

    // Leer archivo
    const fileBuffer = await fs.readFile(documento.rutaArchivo);

    // Configurar headers para descarga
    c.header('Content-Type', documento.tipoArchivo);
    c.header('Content-Disposition', `attachment; filename="${documento.nombreOriginal}"`);
    c.header('Content-Length', documento.tamano.toString());

    return c.body(fileBuffer);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

/**
 * DELETE /documentos-paciente/:id - Eliminar documento
 */
documentos.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await documentoService.delete(id);
    return c.json(success({ message: 'Documento eliminado' }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = documentos;
