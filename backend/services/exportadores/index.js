/**
 * Exportadores de Calidad IPS
 * Centraliza todos los servicios de exportación a formatos requeridos
 */

const exportadorSISPRO = require('./exportadorSISPRO.service');
const exportadorSIVIGILA = require('./exportadorSIVIGILA.service');
const exportadorINVIMA = require('./exportadorINVIMA.service');
const exportadorREPS = require('./exportadorREPS.service');

module.exports = {
  exportadorSISPRO,
  exportadorSIVIGILA,
  exportadorINVIMA,
  exportadorREPS,
};
