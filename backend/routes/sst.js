/**
 * Rutas API de SST (Seguridad y Salud en el Trabajo)
 * Expone todos los endpoints del modulo SST
 * Normativa: Decreto 1072/2015, Resolucion 0312/2019
 */

const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');

// Servicios SST
const accidenteService = require('../services/sst/accidente.service');
const investigacionService = require('../services/sst/investigacion.service');
const incidenteService = require('../services/sst/incidente.service');
const enfermedadService = require('../services/sst/enfermedad.service');
const matrizIPVRService = require('../services/sst/matrizIPVR.service');
const examenMedicoService = require('../services/sst/examenMedico.service');
const profesiogramaService = require('../services/sst/profesiograma.service');
const copasstService = require('../services/sst/copasst.service');
const comiteConvivenciaService = require('../services/sst/comiteConvivencia.service');
const planAnualService = require('../services/sst/planAnual.service');
const capacitacionSSTService = require('../services/sst/capacitacionSST.service');
const inspeccionService = require('../services/sst/inspeccion.service');
const indicadoresService = require('../services/sst/indicadores.service');
const eppService = require('../services/sst/epp.service');
const planEmergenciasService = require('../services/sst/planEmergencias.service');
const brigadaService = require('../services/sst/brigada.service');
const simulacroService = require('../services/sst/simulacro.service');
const documentoSSTService = require('../services/sst/documentoSST.service');
const auditoriaService = require('../services/sst/auditoria.service');
const accionCorrectivaService = require('../services/sst/accionCorrectiva.service');
const evaluacionEstandaresService = require('../services/sst/evaluacionEstandares.service');
const furatService = require('../services/sst/furat.service');
const dashboardSSTService = require('../services/sst/dashboardSST.service');
const integracionService = require('../services/sst/integracion.service');

const router = new Hono();

// Middleware de autenticacion para todas las rutas
router.use('*', authMiddleware);
router.use('*', permissionMiddleware('sst'));

// ===================== DASHBOARD =====================
router.get('/dashboard', async (c) => {
  try {
    const { anio } = c.req.query();
    const dashboard = await dashboardSSTService.getDashboard({ anio: anio ? parseInt(anio) : undefined });
    return c.json(success(dashboard, 'Dashboard SST'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== ACCIDENTES =====================
router.get('/accidentes', async (c) => {
  try {
    const query = c.req.query();
    const result = await accidenteService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      estado: query.estado,
      tipo: query.tipo,
      empleadoId: query.empleadoId,
      desde: query.desde,
      hasta: query.hasta,
      search: query.search,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/accidentes/pendientes-investigacion', async (c) => {
  try {
    const result = await accidenteService.getPendientesInvestigacion();
    return c.json(success(result, 'Accidentes pendientes de investigacion'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/accidentes/estadisticas', async (c) => {
  try {
    const { anio, mes } = c.req.query();
    const result = await accidenteService.getEstadisticas({
      anio: parseInt(anio) || new Date().getFullYear(),
      mes: mes ? parseInt(mes) : undefined,
    });
    return c.json(success(result, 'Estadisticas de accidentes'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/accidentes/:id', async (c) => {
  try {
    const result = await accidenteService.findById(c.req.param('id'));
    return c.json(success(result, 'Accidente encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/accidentes', async (c) => {
  try {
    const data = await c.req.json();
    data.reportanteId = c.get('user').id;
    const result = await accidenteService.create(data);
    return c.json(success(result, 'Accidente registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/accidentes/:id', async (c) => {
  try {
    const data = await c.req.json();
    const result = await accidenteService.update(c.req.param('id'), data);
    return c.json(success(result, 'Accidente actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/accidentes/:id/testigo', async (c) => {
  try {
    const data = await c.req.json();
    const result = await accidenteService.agregarTestigo(c.req.param('id'), data);
    return c.json(success(result, 'Testigo agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/accidentes/:id/furat/pdf', async (c) => {
  try {
    const pdf = await furatService.generarFURAT(c.req.param('id'));
    await furatService.marcarFURATGenerado(c.req.param('id'));
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="FURAT-${c.req.param('id')}.pdf"`);
    return c.body(pdf);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.delete('/accidentes/:id', async (c) => {
  try {
    const result = await accidenteService.delete(c.req.param('id'));
    return c.json(success(result, 'Accidente eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== INVESTIGACIONES =====================
router.get('/investigaciones', async (c) => {
  try {
    const query = c.req.query();
    const result = await investigacionService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      estado: query.estado,
      desde: query.desde,
      hasta: query.hasta,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/investigaciones/medidas-vencidas', async (c) => {
  try {
    const result = await investigacionService.getMedidasVencidas();
    return c.json(success(result, 'Medidas vencidas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/investigaciones/:id', async (c) => {
  try {
    const result = await investigacionService.findById(c.req.param('id'));
    return c.json(success(result, 'Investigacion encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/investigaciones', async (c) => {
  try {
    const data = await c.req.json();
    const result = await investigacionService.create(data);
    return c.json(success(result, 'Investigacion iniciada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/investigaciones/:id', async (c) => {
  try {
    const data = await c.req.json();
    const result = await investigacionService.update(c.req.param('id'), data);
    return c.json(success(result, 'Investigacion actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/investigaciones/:id/miembros', async (c) => {
  try {
    const data = await c.req.json();
    const result = await investigacionService.agregarMiembro(c.req.param('id'), data);
    return c.json(success(result, 'Miembro agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/investigaciones/:id/medidas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await investigacionService.agregarMedidaControl(c.req.param('id'), data);
    return c.json(success(result, 'Medida agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/investigaciones/:id/completar', async (c) => {
  try {
    const result = await investigacionService.completar(c.req.param('id'));
    return c.json(success(result, 'Investigacion completada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/investigaciones/:id/cerrar', async (c) => {
  try {
    const result = await investigacionService.cerrar(c.req.param('id'));
    return c.json(success(result, 'Investigacion cerrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== INCIDENTES =====================
router.get('/incidentes', async (c) => {
  try {
    const query = c.req.query();
    const result = await incidenteService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      empleadoId: query.empleadoId,
      desde: query.desde,
      hasta: query.hasta,
      search: query.search,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/incidentes/:id', async (c) => {
  try {
    const result = await incidenteService.findById(c.req.param('id'));
    return c.json(success(result, 'Incidente encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/incidentes', async (c) => {
  try {
    const data = await c.req.json();
    data.reportanteId = c.get('user').id;
    const result = await incidenteService.create(data);
    return c.json(success(result, 'Incidente registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/incidentes/:id', async (c) => {
  try {
    const data = await c.req.json();
    const result = await incidenteService.update(c.req.param('id'), data);
    return c.json(success(result, 'Incidente actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== ENFERMEDADES LABORALES =====================
router.get('/enfermedades', async (c) => {
  try {
    const query = c.req.query();
    const result = await enfermedadService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      estado: query.estado,
      empleadoId: query.empleadoId,
      desde: query.desde,
      hasta: query.hasta,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/enfermedades/:id', async (c) => {
  try {
    const result = await enfermedadService.findById(c.req.param('id'));
    return c.json(success(result, 'Enfermedad encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/enfermedades', async (c) => {
  try {
    const data = await c.req.json();
    const result = await enfermedadService.create(data);
    return c.json(success(result, 'Enfermedad registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/enfermedades/:id', async (c) => {
  try {
    const data = await c.req.json();
    const result = await enfermedadService.update(c.req.param('id'), data);
    return c.json(success(result, 'Enfermedad actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/enfermedades/:id/seguimiento', async (c) => {
  try {
    const data = await c.req.json();
    const result = await enfermedadService.agregarSeguimiento(c.req.param('id'), data);
    return c.json(success(result, 'Seguimiento agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/enfermedades/:id/furel/pdf', async (c) => {
  try {
    const pdf = await furatService.generarFUREL(c.req.param('id'));
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="FUREL-${c.req.param('id')}.pdf"`);
    return c.body(pdf);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== MATRIZ IPVR =====================
router.get('/matriz-ipvr', async (c) => {
  try {
    const query = c.req.query();
    const result = await matrizIPVRService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      estado: query.estado,
      area: query.area,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/matriz-ipvr/vigente', async (c) => {
  try {
    const result = await matrizIPVRService.getVigente();
    return c.json(success(result, 'Matriz vigente'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/matriz-ipvr/factores-riesgo', async (c) => {
  try {
    const result = await matrizIPVRService.getFactoresRiesgo();
    return c.json(success(result, 'Factores de riesgo'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/matriz-ipvr/resumen', async (c) => {
  try {
    const result = await matrizIPVRService.getResumenRiesgos();
    return c.json(success(result, 'Resumen de riesgos'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/matriz-ipvr/:id', async (c) => {
  try {
    const result = await matrizIPVRService.findById(c.req.param('id'));
    return c.json(success(result, 'Matriz encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/matriz-ipvr', async (c) => {
  try {
    const data = await c.req.json();
    const result = await matrizIPVRService.create(data);
    return c.json(success(result, 'Matriz creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/matriz-ipvr/:id/peligros', async (c) => {
  try {
    const data = await c.req.json();
    const result = await matrizIPVRService.agregarPeligro(c.req.param('id'), data);
    return c.json(success(result, 'Peligro agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/peligros/:id/valoracion', async (c) => {
  try {
    const data = await c.req.json();
    const result = await matrizIPVRService.agregarValoracion(c.req.param('id'), data);
    return c.json(success(result, 'Valoracion agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/peligros/:id/medidas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await matrizIPVRService.agregarMedida(c.req.param('id'), data);
    return c.json(success(result, 'Medida agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== EXAMENES MEDICOS =====================
router.get('/examenes-medicos', async (c) => {
  try {
    const query = c.req.query();
    const result = await examenMedicoService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      estado: query.estado,
      empleadoId: query.empleadoId,
      desde: query.desde,
      hasta: query.hasta,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/examenes-medicos/proximos-vencer', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await examenMedicoService.getProximosVencer(parseInt(dias) || 30);
    return c.json(success(result, 'Examenes proximos a vencer'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/examenes-medicos/vencidos', async (c) => {
  try {
    const result = await examenMedicoService.getVencidos();
    return c.json(success(result, 'Examenes vencidos'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/examenes-medicos/cobertura', async (c) => {
  try {
    const result = await examenMedicoService.getCobertura();
    return c.json(success(result, 'Cobertura de examenes'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/examenes-medicos/proveedores', async (c) => {
  try {
    const result = await examenMedicoService.getProveedores();
    return c.json(success(result, 'Proveedores'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/examenes-medicos/:id', async (c) => {
  try {
    const result = await examenMedicoService.findById(c.req.param('id'));
    return c.json(success(result, 'Examen encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/examenes-medicos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await examenMedicoService.create(data);
    return c.json(success(result, 'Examen programado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/examenes-medicos/:id/resultado', async (c) => {
  try {
    const data = await c.req.json();
    const result = await examenMedicoService.registrarResultado(c.req.param('id'), data);
    return c.json(success(result, 'Resultado registrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== PROFESIOGRAMAS =====================
router.get('/profesiogramas', async (c) => {
  try {
    const query = c.req.query();
    const result = await profesiogramaService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      vigente: query.vigente === 'true',
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/profesiogramas/sin-profesiograma', async (c) => {
  try {
    const result = await profesiogramaService.getCargosSinProfesiograma();
    return c.json(success(result, 'Cargos sin profesiograma'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/profesiogramas/cargo/:cargoId', async (c) => {
  try {
    const result = await profesiogramaService.findByCargo(c.req.param('cargoId'));
    return c.json(success(result, 'Profesiograma encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/profesiogramas/:id', async (c) => {
  try {
    const result = await profesiogramaService.findById(c.req.param('id'));
    return c.json(success(result, 'Profesiograma encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/profesiogramas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await profesiogramaService.create(data);
    return c.json(success(result, 'Profesiograma creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/profesiogramas/:id/examenes', async (c) => {
  try {
    const data = await c.req.json();
    const result = await profesiogramaService.agregarExamen(c.req.param('id'), data);
    return c.json(success(result, 'Examen agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/profesiogramas/:id/riesgos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await profesiogramaService.agregarRiesgo(c.req.param('id'), data);
    return c.json(success(result, 'Riesgo agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== COPASST =====================
router.get('/copasst', async (c) => {
  try {
    const query = c.req.query();
    const result = await copasstService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      estado: query.estado,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/copasst/vigente', async (c) => {
  try {
    const result = await copasstService.getVigente();
    return c.json(success(result, 'COPASST vigente'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/copasst/compromisos-pendientes', async (c) => {
  try {
    const result = await copasstService.getCompromisosPendientes();
    return c.json(success(result, 'Compromisos pendientes'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/copasst/:id', async (c) => {
  try {
    const result = await copasstService.findById(c.req.param('id'));
    return c.json(success(result, 'COPASST encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/copasst/:id/estadisticas', async (c) => {
  try {
    const result = await copasstService.getEstadisticas(c.req.param('id'));
    return c.json(success(result, 'Estadisticas COPASST'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/copasst', async (c) => {
  try {
    const data = await c.req.json();
    const result = await copasstService.create(data);
    return c.json(success(result, 'COPASST creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/copasst/:id/integrantes', async (c) => {
  try {
    const data = await c.req.json();
    const result = await copasstService.agregarIntegrante(c.req.param('id'), data);
    return c.json(success(result, 'Integrante agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/copasst/:id/reuniones', async (c) => {
  try {
    const data = await c.req.json();
    const result = await copasstService.crearReunion(c.req.param('id'), data);
    return c.json(success(result, 'Reunion creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/copasst/reuniones/:reunionId', async (c) => {
  try {
    const result = await copasstService.getReunion(c.req.param('reunionId'));
    return c.json(success(result, 'Reunion encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/copasst/reuniones/:reunionId', async (c) => {
  try {
    const data = await c.req.json();
    const result = await copasstService.actualizarReunion(c.req.param('reunionId'), data);
    return c.json(success(result, 'Reunion actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/copasst/reuniones/:reunionId/compromisos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await copasstService.agregarCompromiso(c.req.param('reunionId'), data);
    return c.json(success(result, 'Compromiso agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== COMITE CONVIVENCIA =====================
router.get('/comite-convivencia', async (c) => {
  try {
    const query = c.req.query();
    const result = await comiteConvivenciaService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      estado: query.estado,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/comite-convivencia/vigente', async (c) => {
  try {
    const result = await comiteConvivenciaService.getVigente();
    return c.json(success(result, 'CCL vigente'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/comite-convivencia/quejas-pendientes', async (c) => {
  try {
    const result = await comiteConvivenciaService.getQuejasPendientes();
    return c.json(success(result, 'Quejas pendientes'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/comite-convivencia/:id', async (c) => {
  try {
    const result = await comiteConvivenciaService.findById(c.req.param('id'));
    return c.json(success(result, 'CCL encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/comite-convivencia', async (c) => {
  try {
    const data = await c.req.json();
    const result = await comiteConvivenciaService.create(data);
    return c.json(success(result, 'CCL creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/comite-convivencia/:id/quejas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await comiteConvivenciaService.registrarQueja(c.req.param('id'), data);
    return c.json(success(result, 'Queja registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/comite-convivencia/quejas/:quejaId', async (c) => {
  try {
    const result = await comiteConvivenciaService.getQueja(c.req.param('quejaId'));
    return c.json(success(result, 'Queja encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/comite-convivencia/quejas/:quejaId', async (c) => {
  try {
    const data = await c.req.json();
    const result = await comiteConvivenciaService.actualizarQueja(c.req.param('quejaId'), data);
    return c.json(success(result, 'Queja actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== PLAN ANUAL =====================
router.get('/plan-anual', async (c) => {
  try {
    const query = c.req.query();
    const result = await planAnualService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/plan-anual/actual', async (c) => {
  try {
    const result = await planAnualService.getPlanActual();
    return c.json(success(result, 'Plan actual'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/plan-anual/actividades-mes', async (c) => {
  try {
    const result = await planAnualService.getActividadesMesActual();
    return c.json(success(result, 'Actividades del mes'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/plan-anual/:id', async (c) => {
  try {
    const result = await planAnualService.findById(c.req.param('id'));
    return c.json(success(result, 'Plan encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/plan-anual/:id/cumplimiento', async (c) => {
  try {
    const result = await planAnualService.getCumplimiento(c.req.param('id'));
    return c.json(success(result, 'Cumplimiento del plan'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-anual', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planAnualService.create(data);
    return c.json(success(result, 'Plan creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-anual/:id/metas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planAnualService.agregarMeta(c.req.param('id'), data);
    return c.json(success(result, 'Meta agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-anual/:id/actividades', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planAnualService.agregarActividad(c.req.param('id'), data);
    return c.json(success(result, 'Actividad agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/plan-anual/actividades/:actividadId', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planAnualService.actualizarActividad(c.req.param('actividadId'), data);
    return c.json(success(result, 'Actividad actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-anual/clonar/:anio', async (c) => {
  try {
    const result = await planAnualService.clonarPlanAnterior(parseInt(c.req.param('anio')));
    return c.json(success(result, 'Plan clonado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== CAPACITACIONES =====================
router.get('/capacitaciones', async (c) => {
  try {
    const query = c.req.query();
    const result = await capacitacionSSTService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      estado: query.estado,
      tipo: query.tipo,
      desde: query.desde,
      hasta: query.hasta,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/capacitaciones/proximas', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await capacitacionSSTService.getProximas(parseInt(dias) || 30);
    return c.json(success(result, 'Capacitaciones proximas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/capacitaciones/cobertura', async (c) => {
  try {
    const { anio } = c.req.query();
    const result = await capacitacionSSTService.getCobertura({ anio: parseInt(anio) || new Date().getFullYear() });
    return c.json(success(result, 'Cobertura de capacitacion'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/capacitaciones/:id', async (c) => {
  try {
    const result = await capacitacionSSTService.findById(c.req.param('id'));
    return c.json(success(result, 'Capacitacion encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/capacitaciones', async (c) => {
  try {
    const data = await c.req.json();
    const result = await capacitacionSSTService.create(data);
    return c.json(success(result, 'Capacitacion creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/capacitaciones/:id/inscribir', async (c) => {
  try {
    const { empleadoIds } = await c.req.json();
    const result = await capacitacionSSTService.inscribirEmpleados(c.req.param('id'), empleadoIds);
    return c.json(success(result, 'Empleados inscritos'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/capacitaciones/:id/asistencia', async (c) => {
  try {
    const data = await c.req.json();
    const result = await capacitacionSSTService.registrarAsistencia(c.req.param('id'), data);
    return c.json(success(result, 'Asistencia registrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/capacitaciones/:id/finalizar', async (c) => {
  try {
    const data = await c.req.json();
    const result = await capacitacionSSTService.finalizar(c.req.param('id'), data);
    return c.json(success(result, 'Capacitacion finalizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== INSPECCIONES =====================
router.get('/inspecciones', async (c) => {
  try {
    const query = c.req.query();
    const result = await inspeccionService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      estado: query.estado,
      desde: query.desde,
      hasta: query.hasta,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/inspecciones/hallazgos-abiertos', async (c) => {
  try {
    const result = await inspeccionService.getHallazgosAbiertos();
    return c.json(success(result, 'Hallazgos abiertos'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/inspecciones/listas-verificacion', async (c) => {
  try {
    const result = await inspeccionService.getListasVerificacion();
    return c.json(success(result, 'Listas de verificacion'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/inspecciones/:id', async (c) => {
  try {
    const result = await inspeccionService.findById(c.req.param('id'));
    return c.json(success(result, 'Inspeccion encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/inspecciones', async (c) => {
  try {
    const data = await c.req.json();
    const result = await inspeccionService.create(data);
    return c.json(success(result, 'Inspeccion creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/inspecciones/:id/hallazgos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await inspeccionService.agregarHallazgo(c.req.param('id'), data);
    return c.json(success(result, 'Hallazgo agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/inspecciones/hallazgos/:hallazgoId', async (c) => {
  try {
    const data = await c.req.json();
    const result = await inspeccionService.actualizarHallazgo(c.req.param('hallazgoId'), data);
    return c.json(success(result, 'Hallazgo actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/inspecciones/:id/finalizar', async (c) => {
  try {
    const data = await c.req.json();
    const result = await inspeccionService.finalizar(c.req.param('id'), data);
    return c.json(success(result, 'Inspeccion finalizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== INDICADORES =====================
router.get('/indicadores', async (c) => {
  try {
    const result = await indicadoresService.getCatalogo();
    return c.json(success(result, 'Catalogo de indicadores'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/indicadores/dashboard', async (c) => {
  try {
    const { anio } = c.req.query();
    const result = await indicadoresService.getDashboard({ anio: parseInt(anio) || new Date().getFullYear() });
    return c.json(success(result, 'Dashboard de indicadores'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/indicadores/accidentalidad', async (c) => {
  try {
    const { anio, mes } = c.req.query();
    const result = await indicadoresService.calcularAccidentalidad({
      anio: parseInt(anio) || new Date().getFullYear(),
      mes: mes ? parseInt(mes) : undefined,
    });
    return c.json(success(result, 'Indicadores de accidentalidad'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/indicadores/enfermedad-laboral', async (c) => {
  try {
    const { anio } = c.req.query();
    const result = await indicadoresService.calcularEnfermedadLaboral({ anio: parseInt(anio) || new Date().getFullYear() });
    return c.json(success(result, 'Indicadores de enfermedad laboral'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/indicadores/ausentismo', async (c) => {
  try {
    const { anio, mes } = c.req.query();
    const result = await indicadoresService.calcularAusentismo({
      anio: parseInt(anio) || new Date().getFullYear(),
      mes: mes ? parseInt(mes) : undefined,
    });
    return c.json(success(result, 'Indicadores de ausentismo'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/indicadores/coberturas', async (c) => {
  try {
    const { anio } = c.req.query();
    const result = await indicadoresService.calcularCoberturas({ anio: parseInt(anio) || new Date().getFullYear() });
    return c.json(success(result, 'Indicadores de cobertura'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/indicadores/medicion', async (c) => {
  try {
    const data = await c.req.json();
    data.registradoPorId = c.get('user').id;
    const result = await indicadoresService.registrarMedicion(data);
    return c.json(success(result, 'Medicion registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== EPP =====================
router.get('/epp', async (c) => {
  try {
    const { categoria } = c.req.query();
    const result = await eppService.getCatalogo({ categoria });
    return c.json(success(result, 'Catalogo EPP'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/epp/entregas', async (c) => {
  try {
    const query = c.req.query();
    const result = await eppService.getEntregas({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      empleadoId: query.empleadoId,
      elementoId: query.elementoId,
      desde: query.desde,
      hasta: query.hasta,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/epp/proximos-vencer', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await eppService.getProximosVencer(parseInt(dias) || 30);
    return c.json(success(result, 'EPP proximos a vencer'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/epp/vencidos', async (c) => {
  try {
    const result = await eppService.getVencidos();
    return c.json(success(result, 'EPP vencidos'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/epp/empleado/:empleadoId', async (c) => {
  try {
    const result = await eppService.getEntregasEmpleado(c.req.param('empleadoId'));
    return c.json(success(result, 'Entregas del empleado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/epp', async (c) => {
  try {
    const data = await c.req.json();
    const result = await eppService.crearElemento(data);
    return c.json(success(result, 'Elemento creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/epp/entrega', async (c) => {
  try {
    const data = await c.req.json();
    data.entregadoPorId = c.get('user').id;
    const result = await eppService.registrarEntrega(data);
    return c.json(success(result, 'Entrega registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/epp/entrega/:id/devolucion', async (c) => {
  try {
    const data = await c.req.json();
    const result = await eppService.registrarDevolucion(c.req.param('id'), data);
    return c.json(success(result, 'Devolucion registrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== PLAN EMERGENCIAS =====================
router.get('/plan-emergencias/vigente', async (c) => {
  try {
    const result = await planEmergenciasService.getVigente();
    return c.json(success(result, 'Plan vigente'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/plan-emergencias/:id', async (c) => {
  try {
    const result = await planEmergenciasService.findById(c.req.param('id'));
    return c.json(success(result, 'Plan encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/plan-emergencias/:id/matriz-amenazas', async (c) => {
  try {
    const result = await planEmergenciasService.getMatrizAmenazas(c.req.param('id'));
    return c.json(success(result, 'Matriz de amenazas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-emergencias', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planEmergenciasService.create(data);
    return c.json(success(result, 'Plan creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-emergencias/:id/amenazas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planEmergenciasService.agregarAmenaza(c.req.param('id'), data);
    return c.json(success(result, 'Amenaza agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-emergencias/:id/procedimientos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planEmergenciasService.agregarProcedimiento(c.req.param('id'), data);
    return c.json(success(result, 'Procedimiento agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/plan-emergencias/:id/recursos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await planEmergenciasService.agregarRecurso(c.req.param('id'), data);
    return c.json(success(result, 'Recurso agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== BRIGADA =====================
router.get('/brigada/activa', async (c) => {
  try {
    const result = await brigadaService.getActiva();
    return c.json(success(result, 'Brigada activa'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/brigada/:id', async (c) => {
  try {
    const result = await brigadaService.findById(c.req.param('id'));
    return c.json(success(result, 'Brigada encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/brigada/:id/directorio', async (c) => {
  try {
    const result = await brigadaService.getDirectorioEmergencias(c.req.param('id'));
    return c.json(success(result, 'Directorio de emergencias'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/brigada/:id/estadisticas', async (c) => {
  try {
    const result = await brigadaService.getEstadisticas(c.req.param('id'));
    return c.json(success(result, 'Estadisticas de brigada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/brigada', async (c) => {
  try {
    const data = await c.req.json();
    const result = await brigadaService.create(data);
    return c.json(success(result, 'Brigada creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/brigada/:id/miembros', async (c) => {
  try {
    const data = await c.req.json();
    const result = await brigadaService.agregarMiembro(c.req.param('id'), data);
    return c.json(success(result, 'Miembro agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/brigada/:id/entrenamiento', async (c) => {
  try {
    const data = await c.req.json();
    const result = await brigadaService.registrarEntrenamiento(c.req.param('id'), data);
    return c.json(success(result, 'Entrenamiento programado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== SIMULACROS =====================
router.get('/simulacros', async (c) => {
  try {
    const query = c.req.query();
    const result = await simulacroService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      estado: query.estado,
      anio: query.anio ? parseInt(query.anio) : undefined,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/simulacros/proximos', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await simulacroService.getProximos(parseInt(dias) || 30);
    return c.json(success(result, 'Simulacros proximos'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/simulacros/:id', async (c) => {
  try {
    const result = await simulacroService.findById(c.req.param('id'));
    return c.json(success(result, 'Simulacro encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/simulacros', async (c) => {
  try {
    const data = await c.req.json();
    const result = await simulacroService.create(data);
    return c.json(success(result, 'Simulacro programado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/simulacros/:id/participantes', async (c) => {
  try {
    const data = await c.req.json();
    const result = await simulacroService.registrarParticipante(c.req.param('id'), data);
    return c.json(success(result, 'Participante registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/simulacros/:id/resultados', async (c) => {
  try {
    const data = await c.req.json();
    const result = await simulacroService.registrarResultados(c.req.param('id'), data);
    return c.json(success(result, 'Resultados registrados'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/simulacros/:id/acciones-mejora', async (c) => {
  try {
    const data = await c.req.json();
    const result = await simulacroService.agregarAccionMejora(c.req.param('id'), data);
    return c.json(success(result, 'Accion de mejora agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== DOCUMENTOS SST =====================
router.get('/documentos', async (c) => {
  try {
    const query = c.req.query();
    const result = await documentoSSTService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      estado: query.estado,
      proceso: query.proceso,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/documentos/listado-maestro', async (c) => {
  try {
    const result = await documentoSSTService.getListadoMaestro();
    return c.json(success(result, 'Listado maestro'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/documentos/proximos-vencer', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await documentoSSTService.getProximosVencer(parseInt(dias) || 30);
    return c.json(success(result, 'Documentos proximos a vencer'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/documentos/:id', async (c) => {
  try {
    const result = await documentoSSTService.findById(c.req.param('id'));
    return c.json(success(result, 'Documento encontrado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/documentos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await documentoSSTService.create(data);
    return c.json(success(result, 'Documento creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/documentos/:id', async (c) => {
  try {
    const data = await c.req.json();
    const result = await documentoSSTService.update(c.req.param('id'), data);
    return c.json(success(result, 'Documento actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/documentos/:id/aprobar', async (c) => {
  try {
    const data = await c.req.json();
    const result = await documentoSSTService.aprobar(c.req.param('id'), data);
    return c.json(success(result, 'Documento aprobado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== AUDITORIAS =====================
router.get('/auditorias', async (c) => {
  try {
    const query = c.req.query();
    const result = await auditoriaService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      estado: query.estado,
      anio: query.anio ? parseInt(query.anio) : undefined,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/auditorias/programa-anual', async (c) => {
  try {
    const { anio } = c.req.query();
    const result = await auditoriaService.getProgramaAnual(parseInt(anio) || new Date().getFullYear());
    return c.json(success(result, 'Programa anual de auditorias'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/auditorias/hallazgos-abiertos', async (c) => {
  try {
    const result = await auditoriaService.getHallazgosAbiertos();
    return c.json(success(result, 'Hallazgos abiertos'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/auditorias/:id', async (c) => {
  try {
    const result = await auditoriaService.findById(c.req.param('id'));
    return c.json(success(result, 'Auditoria encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/auditorias', async (c) => {
  try {
    const data = await c.req.json();
    const result = await auditoriaService.create(data);
    return c.json(success(result, 'Auditoria creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/auditorias/:id/hallazgos', async (c) => {
  try {
    const data = await c.req.json();
    const result = await auditoriaService.registrarHallazgo(c.req.param('id'), data);
    return c.json(success(result, 'Hallazgo registrado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/auditorias/:id/finalizar', async (c) => {
  try {
    const data = await c.req.json();
    const result = await auditoriaService.finalizar(c.req.param('id'), data);
    return c.json(success(result, 'Auditoria finalizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== ACCIONES CORRECTIVAS =====================
router.get('/acciones-correctivas', async (c) => {
  try {
    const query = c.req.query();
    const result = await accionCorrectivaService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      tipo: query.tipo,
      estado: query.estado,
      origen: query.origen,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/acciones-correctivas/vencidas', async (c) => {
  try {
    const result = await accionCorrectivaService.getVencidas();
    return c.json(success(result, 'Acciones vencidas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/acciones-correctivas/:id', async (c) => {
  try {
    const result = await accionCorrectivaService.findById(c.req.param('id'));
    return c.json(success(result, 'Accion encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/acciones-correctivas', async (c) => {
  try {
    const data = await c.req.json();
    const result = await accionCorrectivaService.create(data);
    return c.json(success(result, 'Accion creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/acciones-correctivas/:id', async (c) => {
  try {
    const data = await c.req.json();
    const result = await accionCorrectivaService.update(c.req.param('id'), data);
    return c.json(success(result, 'Accion actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/acciones-correctivas/:id/implementar', async (c) => {
  try {
    const data = await c.req.json();
    const result = await accionCorrectivaService.registrarImplementacion(c.req.param('id'), data);
    return c.json(success(result, 'Implementacion registrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/acciones-correctivas/:id/seguimiento', async (c) => {
  try {
    const data = await c.req.json();
    data.realizadoPorId = c.get('user').id;
    const result = await accionCorrectivaService.agregarSeguimiento(c.req.param('id'), data);
    return c.json(success(result, 'Seguimiento agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/acciones-correctivas/:id/verificar', async (c) => {
  try {
    const data = await c.req.json();
    data.verificadoPorId = c.get('user').id;
    const result = await accionCorrectivaService.verificarEficacia(c.req.param('id'), data);
    return c.json(success(result, 'Eficacia verificada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/acciones-correctivas/:id/cerrar', async (c) => {
  try {
    const data = await c.req.json();
    const result = await accionCorrectivaService.cerrar(c.req.param('id'), data);
    return c.json(success(result, 'Accion cerrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== EVALUACION ESTANDARES =====================
router.get('/evaluacion-estandares', async (c) => {
  try {
    const query = c.req.query();
    const result = await evaluacionEstandaresService.findAll({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/evaluacion-estandares/actual', async (c) => {
  try {
    const result = await evaluacionEstandaresService.getActual();
    return c.json(success(result, 'Evaluacion actual'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/evaluacion-estandares/comparativo', async (c) => {
  try {
    const { anioInicio, anioFin } = c.req.query();
    const result = await evaluacionEstandaresService.getComparativoAnual(
      parseInt(anioInicio) || new Date().getFullYear() - 2,
      parseInt(anioFin) || new Date().getFullYear()
    );
    return c.json(success(result, 'Comparativo anual'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.get('/evaluacion-estandares/:id', async (c) => {
  try {
    const result = await evaluacionEstandaresService.findById(c.req.param('id'));
    return c.json(success(result, 'Evaluacion encontrada'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/evaluacion-estandares', async (c) => {
  try {
    const data = await c.req.json();
    const result = await evaluacionEstandaresService.create(data);
    return c.json(success(result, 'Evaluacion creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.put('/evaluacion-estandares/items/:itemId', async (c) => {
  try {
    const data = await c.req.json();
    const result = await evaluacionEstandaresService.evaluarItem(c.req.param('itemId'), data);
    return c.json(success(result, 'Item evaluado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/evaluacion-estandares/:id/calcular', async (c) => {
  try {
    const result = await evaluacionEstandaresService.calcularResultados(c.req.param('id'));
    return c.json(success(result, 'Resultados calculados'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

router.post('/evaluacion-estandares/:id/plan-mejoramiento', async (c) => {
  try {
    const data = await c.req.json();
    const result = await evaluacionEstandaresService.agregarPlanMejoramiento(c.req.param('id'), data);
    return c.json(success(result, 'Plan agregado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

// ===================== INTEGRACION SST-RRHH =====================

/**
 * Obtener perfil SST completo de un empleado
 * GET /sst/empleado/:id/perfil-sst
 */
router.get('/empleado/:id/perfil-sst', async (c) => {
  try {
    const result = await integracionService.getPerfilSSTEmpleado(c.req.param('id'));
    return c.json(success(result, 'Perfil SST del empleado'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Obtener riesgos asociados a un cargo
 * GET /sst/cargo/:id/riesgos
 */
router.get('/cargo/:id/riesgos', async (c) => {
  try {
    const result = await integracionService.getRiesgosPorCargo(c.req.param('id'));
    return c.json(success(result, 'Riesgos del cargo'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Inicializar SST para nuevo empleado (onboarding)
 * POST /sst/empleado/:id/onboarding-sst
 */
router.post('/empleado/:id/onboarding-sst', async (c) => {
  try {
    const result = await integracionService.inicializarSSTEmpleado(c.req.param('id'));
    return c.json(success(result, 'SST inicializado para empleado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Sincronizar capacitacion SST con RRHH
 * POST /sst/capacitaciones/:id/sincronizar-rrhh
 */
router.post('/capacitaciones/:id/sincronizar-rrhh', async (c) => {
  try {
    const result = await integracionService.sincronizarCapacitacionConRRHH(c.req.param('id'));
    return c.json(success(result, 'Capacitacion sincronizada con RRHH'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Obtener documentos SST proximos a vencer
 * GET /sst/alertas/documentos-vencer
 */
router.get('/alertas/documentos-vencer', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await integracionService.getDocumentosProximosVencer(dias ? parseInt(dias) : 30);
    return c.json(success(result, 'Documentos proximos a vencer'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Obtener examenes medicos proximos a vencer
 * GET /sst/alertas/examenes-vencer
 */
router.get('/alertas/examenes-vencer', async (c) => {
  try {
    const { dias } = c.req.query();
    const result = await integracionService.getExamenesProximosVencer(dias ? parseInt(dias) : 30);
    return c.json(success(result, 'Examenes proximos a vencer'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Programar alertas de vencimientos SST (para cron job)
 * POST /sst/alertas/programar
 */
router.post('/alertas/programar', async (c) => {
  try {
    const result = await integracionService.programarTodasLasAlertas();
    return c.json(success(result, 'Alertas programadas y procesadas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Programar alertas de documentos SST
 * POST /sst/alertas/programar-documentos
 */
router.post('/alertas/programar-documentos', async (c) => {
  try {
    const result = await integracionService.programarAlertasDocumentos();
    return c.json(success(result, 'Alertas de documentos programadas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

/**
 * Programar alertas de examenes medicos SST
 * POST /sst/alertas/programar-examenes
 */
router.post('/alertas/programar-examenes', async (c) => {
  try {
    const result = await integracionService.programarAlertasExamenes();
    return c.json(success(result, 'Alertas de examenes programadas'));
  } catch (err) {
    return c.json(error(err.message), err.status || 500);
  }
});

module.exports = router;
