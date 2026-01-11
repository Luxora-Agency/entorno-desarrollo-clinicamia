// Procesos Prioritarios Services
const protocoloService = require('./protocolo.service');
const eventoAdversoService = require('./eventoAdverso.service');
const gpcService = require('./gpc.service');
const comiteService = require('./comite.service');
const actaService = require('./acta.service');
const encuestaService = require('./encuesta.service');
const pqrsfService = require('./pqrsf.service');
const indicadorService = require('./indicador.service');
const dashboardService = require('./dashboard.service');
const alertaService = require('./alerta.service');

module.exports = {
  protocoloService,
  eventoAdversoService,
  gpcService,
  comiteService,
  actaService,
  encuestaService,
  pqrsfService,
  indicadorService,
  dashboardService,
  alertaService,
};
