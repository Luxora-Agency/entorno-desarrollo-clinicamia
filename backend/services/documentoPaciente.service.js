/**
 * Service de documentos de pacientes
 */
const prisma = require('../db/prisma');
const fs = require('fs').promises;
const path = require('path');

class DocumentoPacienteService {
  /**
   * Guardar información del documento en BD
   */
  async create(data) {
    const documento = await prisma.documentoPaciente.create({
      data: {
        pacienteId: data.pacienteId,
        nombreArchivo: data.nombreArchivo,
        nombreOriginal: data.nombreOriginal,
        tipoArchivo: data.tipoArchivo,
        tamano: data.tamano,
        rutaArchivo: data.rutaArchivo,
        descripcion: data.descripcion || null,
        categoria: data.categoria || null,
        uploadedBy: data.uploadedBy || null,
      },
    });

    return documento;
  }

  /**
   * Obtener todos los documentos de un paciente
   */
  async getByPacienteId(pacienteId) {
    const documentos = await prisma.documentoPaciente.findMany({
      where: { pacienteId },
      orderBy: { createdAt: 'desc' },
    });

    return documentos;
  }

  /**
   * Obtener un documento por ID
   */
  async getById(id) {
    const documento = await prisma.documentoPaciente.findUnique({
      where: { id },
    });

    if (!documento) {
      const error = new Error('Documento no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return documento;
  }

  /**
   * Eliminar un documento
   */
  async delete(id) {
    const documento = await this.getById(id);

    // Eliminar archivo físico
    try {
      await fs.unlink(documento.rutaArchivo);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
    }

    // Eliminar registro de BD
    await prisma.documentoPaciente.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Verificar si un archivo existe
   */
  async fileExists(rutaArchivo) {
    try {
      await fs.access(rutaArchivo);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new DocumentoPacienteService();
