/**
 * Módulo de Talento Humano - Exportación de servicios
 */

module.exports = {
  vacanteService: require('./vacante.service'),
  candidatoService: require('./candidato.service'),
  empleadoService: require('./empleado.service'),
  contratoService: require('./contrato.service'),
  nominaService: require('./nomina.service'),
  asistenciaService: require('./asistencia.service'),
  evaluacionService: require('./evaluacion.service'),
  capacitacionService: require('./capacitacion.service'),
  bienestarService: require('./bienestar.service'),
  talentoHumanoAIService: require('./talentoHumanoAI.service')
};
