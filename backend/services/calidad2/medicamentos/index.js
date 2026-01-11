const farmacovigilanciaService = require('./farmacovigilancia.service');
const tecnovigilanciaService = require('./tecnovigilancia.service');
const inventarioService = require('./inventario.service');
const temperaturaHumedadService = require('./temperaturaHumedad.service');
const formatoService = require('./formato.service');
const alertaMedicamentoService = require('./alerta.service');
const dashboardMedicamentosService = require('./dashboard.service');

module.exports = {
  farmacovigilanciaService,
  tecnovigilanciaService,
  inventarioService,
  temperaturaHumedadService,
  formatoService,
  alertaMedicamentoService,
  dashboardMedicamentosService,
};
