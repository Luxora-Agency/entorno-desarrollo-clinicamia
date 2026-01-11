/**
 * Servicio para gestión de documentos HCE externos
 * Orquesta la subida, extracción de texto, análisis IA y chat
 */
const prisma = require('../db/prisma');
const pdfExtractor = require('./pdfExtractor.service');
const hceAnalyzer = require('./hceAnalyzer.service');
const { saveFile, deleteFile } = require('../utils/upload');
const { ValidationError, NotFoundError } = require('../utils/errors');
const path = require('path');

class DocumentoHCEService {

  /**
   * Subir y procesar documento PDF
   * @param {ArrayBuffer} fileData - Datos del archivo
   * @param {string} fileName - Nombre original del archivo
   * @param {string} doctorId - ID del doctor que sube
   * @param {string|null} pacienteId - ID del paciente (opcional)
   * @returns {Promise<object>} Documento creado
   */
  async uploadAndAnalyze(fileData, fileName, doctorId, pacienteId = null) {
    // 1. Validar tipo de archivo
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      throw new ValidationError('Solo se permiten archivos PDF');
    }

    // 2. Guardar archivo
    const rutaArchivo = await saveFile(fileData, fileName, 'hce-externos');
    const filePath = path.join(__dirname, '..', 'public', rutaArchivo);

    try {
      // 3. Validar que sea un PDF válido
      await pdfExtractor.validatePDF(filePath);

      // 4. Extraer texto
      const { text, pages, hash, metadata } = await pdfExtractor.extractText(filePath);

      // 5. Verificar duplicados
      const existente = await prisma.documentoHCEExterno.findFirst({
        where: {
          textoHash: hash,
          doctorId
        }
      });

      if (existente) {
        await deleteFile(rutaArchivo);
        throw new ValidationError(
          'Este documento ya fue analizado anteriormente. ID: ' + existente.id
        );
      }

      // 6. Crear registro en BD
      const documento = await prisma.documentoHCEExterno.create({
        data: {
          doctorId,
          pacienteId: pacienteId || null,
          nombreArchivo: fileName.replace(/\.[^.]+$/, ''),
          nombreOriginal: fileName,
          rutaArchivo,
          tamanoBytes: fileData.byteLength || fileData.length || 0,
          tipoMime: 'application/pdf',
          textoExtraido: text,
          textoHash: hash,
          paginasTotal: pages,
          estado: 'Procesando'
        }
      });

      // 7. Iniciar análisis con IA (async - no bloqueante)
      this.processAnalysis(documento.id, text).catch(err => {
        console.error('Error en análisis de documento:', err);
      });

      return documento;

    } catch (error) {
      // Limpiar archivo si hubo error
      await deleteFile(rutaArchivo);
      throw error;
    }
  }

  /**
   * Procesar análisis de documento con IA
   * @param {string} documentoId - ID del documento
   * @param {string} texto - Texto extraído
   */
  async processAnalysis(documentoId, texto) {
    try {
      // Verificar que el analizador esté configurado
      if (!hceAnalyzer.isConfigured()) {
        await prisma.documentoHCEExterno.update({
          where: { id: documentoId },
          data: {
            estado: 'Error',
            errorMensaje: 'Servicio de IA no configurado. Verifique OPENAI_API_KEY.'
          }
        });
        return;
      }

      // Ejecutar análisis
      const { analisis, tokensUsados } = await hceAnalyzer.analyzeDocument(texto, documentoId);

      // Actualizar documento con resultados
      await prisma.documentoHCEExterno.update({
        where: { id: documentoId },
        data: {
          analisisCompleto: analisis,
          resumenEjecutivo: analisis.resumenClinico || null,
          tokensUsados,
          estado: 'Completado',
          procesadoAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error procesando análisis:', error);

      await prisma.documentoHCEExterno.update({
        where: { id: documentoId },
        data: {
          estado: 'Error',
          errorMensaje: error.message || 'Error desconocido durante el análisis'
        }
      });
    }
  }

  /**
   * Obtener documento por ID
   * @param {string} id - ID del documento
   * @param {string} doctorId - ID del doctor (para validación)
   * @returns {Promise<object>} Documento con conversaciones
   */
  async getById(id, doctorId) {
    const documento = await prisma.documentoHCEExterno.findFirst({
      where: { id, doctorId },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cedula: true,
            tipoDocumento: true
          }
        },
        conversaciones: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Listar documentos del doctor
   * @param {string} doctorId - ID del doctor
   * @param {object} filters - Filtros opcionales
   * @returns {Promise<{documentos: array, total: number, page: number, limit: number}>}
   */
  async listByDoctor(doctorId, filters = {}) {
    const { pacienteId, estado, page = 1, limit = 20 } = filters;

    const where = { doctorId };
    if (pacienteId) where.pacienteId = pacienteId;
    if (estado) where.estado = estado;

    const [documentos, total] = await Promise.all([
      prisma.documentoHCEExterno.findMany({
        where,
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.documentoHCEExterno.count({ where })
    ]);

    return {
      documentos,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  /**
   * Chat sobre documento
   * @param {string} documentoId - ID del documento
   * @param {string} doctorId - ID del doctor
   * @param {string} pregunta - Pregunta del usuario
   * @returns {Promise<{respuesta: string, tokensUsados: number}>}
   */
  async chat(documentoId, doctorId, pregunta) {
    // Obtener documento
    const documento = await this.getById(documentoId, doctorId);

    if (documento.estado !== 'Completado') {
      throw new ValidationError('El documento aún no ha sido analizado completamente');
    }

    if (!documento.textoExtraido) {
      throw new ValidationError('No hay texto disponible para consultar');
    }

    // Obtener historial de chat (últimos 10 mensajes para contexto)
    const historial = await prisma.chatDocumentoHCE.findMany({
      where: { documentoId },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    // Enviar a IA
    const { respuesta, tokensUsados } = await hceAnalyzer.chatAboutDocument(
      documento.textoExtraido,
      documento.analisisCompleto,
      historial,
      pregunta
    );

    // Guardar mensajes
    await prisma.chatDocumentoHCE.createMany({
      data: [
        {
          documentoId,
          rol: 'user',
          contenido: pregunta,
          tokensUsados: 0
        },
        {
          documentoId,
          rol: 'assistant',
          contenido: respuesta,
          tokensUsados
        }
      ]
    });

    return { respuesta, tokensUsados };
  }

  /**
   * Eliminar documento
   * @param {string} id - ID del documento
   * @param {string} doctorId - ID del doctor
   * @returns {Promise<{message: string}>}
   */
  async delete(id, doctorId) {
    const documento = await this.getById(id, doctorId);

    // Eliminar archivo físico
    await deleteFile(documento.rutaArchivo);

    // Eliminar de BD (cascada eliminará chat)
    await prisma.documentoHCEExterno.delete({
      where: { id }
    });

    return { message: 'Documento eliminado correctamente' };
  }

  /**
   * Re-analizar documento
   * @param {string} id - ID del documento
   * @param {string} doctorId - ID del doctor
   * @returns {Promise<object>} Documento actualizado
   */
  async reanalyze(id, doctorId) {
    const documento = await this.getById(id, doctorId);

    if (!documento.textoExtraido) {
      throw new ValidationError('No hay texto disponible para re-analizar');
    }

    // Actualizar estado
    await prisma.documentoHCEExterno.update({
      where: { id },
      data: {
        estado: 'Procesando',
        errorMensaje: null
      }
    });

    // Iniciar re-análisis
    this.processAnalysis(id, documento.textoExtraido).catch(err => {
      console.error('Error en re-análisis:', err);
    });

    return { message: 'Re-análisis iniciado' };
  }

  /**
   * Obtener estadísticas del doctor
   * @param {string} doctorId - ID del doctor
   * @returns {Promise<object>} Estadísticas
   */
  async getStats(doctorId) {
    const [total, completados, errores, tokensTotal] = await Promise.all([
      prisma.documentoHCEExterno.count({ where: { doctorId } }),
      prisma.documentoHCEExterno.count({ where: { doctorId, estado: 'Completado' } }),
      prisma.documentoHCEExterno.count({ where: { doctorId, estado: 'Error' } }),
      prisma.documentoHCEExterno.aggregate({
        where: { doctorId },
        _sum: { tokensUsados: true }
      })
    ]);

    return {
      totalDocumentos: total,
      completados,
      errores,
      enProceso: total - completados - errores,
      tokensUsados: tokensTotal._sum.tokensUsados || 0
    };
  }
}

module.exports = new DocumentoHCEService();
