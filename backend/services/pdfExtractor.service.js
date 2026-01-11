/**
 * Servicio para extracción de texto de PDFs digitales
 * Usa pdf-parse v1.x para PDFs con texto seleccionable
 */
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const crypto = require('crypto');
const { ValidationError } = require('../utils/errors');

class PDFExtractorService {
  /**
   * Extraer texto de un archivo PDF
   * @param {string} filePath - Ruta absoluta al archivo PDF
   * @returns {Promise<{text: string, pages: number, hash: string, metadata: object}>}
   */
  async extractText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      if (!data.text || data.text.trim().length < 50) {
        throw new ValidationError(
          'El PDF no contiene texto seleccionable suficiente. Solo se admiten PDFs digitales, no escaneados.'
        );
      }

      // Limpiar y normalizar texto
      const cleanText = this.cleanText(data.text);

      // Generar hash para detectar duplicados
      const hash = crypto.createHash('sha256').update(cleanText).digest('hex');

      return {
        text: cleanText,
        pages: data.numpages,
        hash,
        metadata: {
          info: data.info || {},
          version: data.version || 'unknown'
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;

      if (error.message.includes('Invalid PDF')) {
        throw new ValidationError('El archivo no es un PDF válido');
      }

      throw new ValidationError(`Error al procesar PDF: ${error.message}`);
    }
  }

  /**
   * Limpiar y normalizar texto extraído
   * @param {string} text - Texto crudo extraído del PDF
   * @returns {string} - Texto limpio y normalizado
   */
  cleanText(text) {
    return text
      // Normalizar saltos de línea
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Máximo 2 saltos de línea seguidos
      .replace(/\n{3,}/g, '\n\n')
      // Múltiples espacios a uno
      .replace(/[ \t]+/g, ' ')
      // Líneas solo con espacios
      .replace(/^\s+$/gm, '')
      // Eliminar caracteres de control excepto saltos de línea
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }

  /**
   * Validar que el archivo sea un PDF válido
   * @param {string} filePath - Ruta al archivo
   * @returns {Promise<boolean>}
   */
  async validatePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const header = dataBuffer.slice(0, 5).toString();

      if (header !== '%PDF-') {
        throw new ValidationError('El archivo no es un PDF válido');
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('No se pudo leer el archivo PDF');
    }
  }

  /**
   * Obtener estadísticas básicas del texto
   * @param {string} text - Texto extraído
   * @returns {object} - Estadísticas
   */
  getTextStats(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const chars = text.length;

    return {
      palabras: words.length,
      lineas: lines.length,
      caracteres: chars,
      estimadoTokens: Math.ceil(words.length * 1.3) // Aproximación
    };
  }
}

module.exports = new PDFExtractorService();
