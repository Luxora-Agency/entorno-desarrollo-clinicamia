/**
 * Service de Firma Digital y Hash
 */
const crypto = require('crypto');

class FirmaDigitalService {
  /**
   * Generar hash SHA-256 de un registro
   */
  generarHash(data, usuarioId, timestamp) {
    const contenido = JSON.stringify(data);
    const datosParaFirmar = `${contenido}|${usuarioId}|${timestamp}`;
    
    const hash = crypto
      .createHash('sha256')
      .update(datosParaFirmar)
      .digest('hex');
    
    return hash;
  }

  /**
   * Crear firma digital completa
   */
  crearFirma(data, usuarioId) {
    const timestamp = new Date().toISOString();
    const hash = this.generarHash(data, usuarioId, timestamp);
    
    return {
      firmaDigital: hash,
      hashRegistro: hash,
      fechaFirma: new Date(timestamp),
      usuarioId,
    };
  }

  /**
   * Verificar integridad de firma
   */
  verificarFirma(data, usuarioId, timestamp, hashGuardado) {
    const hashCalculado = this.generarHash(data, usuarioId, timestamp);
    return hashCalculado === hashGuardado;
  }

  /**
   * Generar hash corto para mostrar (primeros 16 caracteres)
   */
  hashCorto(hash) {
    return hash ? hash.substring(0, 16) : null;
  }
}

module.exports = new FirmaDigitalService();
