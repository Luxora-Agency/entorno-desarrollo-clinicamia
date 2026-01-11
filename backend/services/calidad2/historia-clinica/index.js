/**
 * Exportador central de servicios de Historia Clínica - Calidad 2.0
 *
 * Importa y re-exporta todos los servicios del módulo para facilitar el uso
 */

const documentoService = require('./documento.service');
const certificacionService = require('./certificacion.service');
const consentimientoService = require('./consentimiento.service');
const auditoriaService = require('./auditoria.service');
const indicadorService = require('./indicador.service');
const dashboardService = require('./dashboard.service');

module.exports = {
  documentoService,
  certificacionService,
  consentimientoService,
  auditoriaService,
  indicadorService,
  dashboardService,
};
