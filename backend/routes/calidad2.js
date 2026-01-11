const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, error, paginated } = require('../utils/response');
const {
  carpetaService,
  documentoService,
  checklistService,
  personalService,
  capacidadService,
  alertaService,
} = require('../services/calidad2');
const categoriaCapacitacionService = require('../services/calidad2/categoriaCapacitacion.service');
const capacitacionService = require('../services/calidad2/capacitacion.service');
const sesionService = require('../services/calidad2/sesion.service');
const evaluacionService = require('../services/calidad2/evaluacion.service');
const actaService = require('../services/calidad2/acta.service');
const manualFuncionesService = require('../services/calidad2/manualFunciones.service');
const induccionService = require('../services/calidad2/induccion.service');
const certificadoService = require('../services/calidad2/certificado.service');
const formatoService = require('../services/calidad2/formato.service');
const formatoInstanciaService = require('../services/calidad2/formatoInstancia.service');

// Medicamentos Module Services
const protocoloMedicamentosService = require('../services/calidad2/medicamentos/protocolo.service');
const inventarioService = require('../services/calidad2/medicamentos/inventario.service');
const farmacovigilanciaService = require('../services/calidad2/medicamentos/farmacovigilancia.service');
const tecnovigilanciaService = require('../services/calidad2/medicamentos/tecnovigilancia.service');
const temperaturaHumedadService = require('../services/calidad2/medicamentos/temperaturaHumedad.service');
const formatoMedicamentoService = require('../services/calidad2/medicamentos/formato.service');
const alertaMedicamentoService = require('../services/calidad2/medicamentos/alerta.service');
const dashboardMedicamentosService = require('../services/calidad2/medicamentos/dashboard.service');

// Procesos Prioritarios Module Services
const protocoloPPService = require('../services/calidad2/procesos-prioritarios/protocolo.service');
const eventoAdversoService = require('../services/calidad2/procesos-prioritarios/eventoAdverso.service');
const gpcService = require('../services/calidad2/procesos-prioritarios/gpc.service');
const comiteService = require('../services/calidad2/procesos-prioritarios/comite.service');
const actaPPService = require('../services/calidad2/procesos-prioritarios/acta.service');
const encuestaService = require('../services/calidad2/procesos-prioritarios/encuesta.service');
const pqrsfService = require('../services/calidad2/procesos-prioritarios/pqrsf.service');
const indicadorService = require('../services/calidad2/procesos-prioritarios/indicador.service');
const alertaPPService = require('../services/calidad2/procesos-prioritarios/alerta.service');
const dashboardPPService = require('../services/calidad2/procesos-prioritarios/dashboard.service');

// Historia Clínica Module Services
const documentoHCService = require('../services/calidad2/historia-clinica/documento.service');
const certificacionHCService = require('../services/calidad2/historia-clinica/certificacion.service');
const consentimientoHCService = require('../services/calidad2/historia-clinica/consentimiento.service');
const auditoriaHCService = require('../services/calidad2/historia-clinica/auditoria.service');
const indicadorHCService = require('../services/calidad2/historia-clinica/indicador.service');
const dashboardHCService = require('../services/calidad2/historia-clinica/dashboard.service');

const {
  createCarpetaSchema,
  updateCarpetaSchema,
  createDocumentoSchema,
  updateDocumentoSchema,
  moverDocumentoSchema,
  createPersonalSchema,
  updatePersonalSchema,
  createFromCandidatoSchema,
  uploadDocumentoPersonalSchema,
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  updateEstadoChecklistSchema,
  createCapacidadSchema,
  updateCapacidadSchema,
  createOfertaSchema,
  updateOfertaSchema,
  saveResumenSchema,
  queryPersonalSchema,
  queryAlertasSchema,
} = require('../validators/calidad2.schema');
const {
  createCategoriaCapacitacionSchema,
  updateCategoriaCapacitacionSchema,
  reorderCategoriasSchema,
  createCapacitacionSchema,
  updateCapacitacionSchema,
  createSesionSchema,
  updateSesionSchema,
  addAsistentesSchema,
  updateAsistenteSchema,
  marcarAsistenciaMasivaSchema,
  createEvaluacionSchema,
  updateEvaluacionSchema,
  createPreguntaSchema,
  updatePreguntaSchema,
  reorderPreguntasSchema,
  createOpcionSchema,
  updateOpcionSchema,
  registrarRespuestaSchema,
  createActaSchema,
  updateActaSchema,
  addAsistenteActaSchema,
  updateAsistenteActaSchema,
} = require('../validators/capacitaciones.schema');

// Medicamentos Module Validators
const {
  createProtocoloSchema,
  updateProtocoloSchema,
  createInventarioSchema,
  updateInventarioSchema,
  createReporteFarmacoSchema,
  updateReporteFarmacoSchema,
  createReporteTecnoSchema,
  updateReporteTecnoSchema,
  createTemperaturaSchema,
  updateTemperaturaSchema,
  createFormatoSchema,
  updateFormatoSchema,
  createInstanciaFormatoSchema,
  updateInstanciaFormatoSchema,
} = require('../validators/medicamentos.schema');

const calidad2 = new Hono();

// Aplicar auth a todas las rutas
calidad2.use('*', authMiddleware);

// ==========================================
// CARPETAS
// ==========================================

calidad2.get('/carpetas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const carpetas = await carpetaService.findAll(query);
    return c.json(success({ carpetas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/carpetas/tree/:tipo', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { tipo } = c.req.param();
    const tree = await carpetaService.getTree(tipo);
    return c.json(success({ tree }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/carpetas/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const carpeta = await carpetaService.findById(id);
    return c.json(success({ carpeta }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/carpetas', permissionMiddleware('calidad2'), validate(createCarpetaSchema), async (c) => {
  try {
    const data = c.req.validData;
    const carpeta = await carpetaService.create(data);
    return c.json(success({ carpeta }, 'Carpeta creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/carpetas/:id', permissionMiddleware('calidad2'), validate(updateCarpetaSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const carpeta = await carpetaService.update(id, data);
    return c.json(success({ carpeta }, 'Carpeta actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/carpetas/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await carpetaService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DOCUMENTOS
// ==========================================

calidad2.get('/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await documentoService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/documentos/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const documento = await documentoService.findById(id);
    return c.json(success({ documento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    const data = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      carpetaId: body.carpetaId,
      tipo: body.tipo,
    };
    const userId = c.get('user').id;
    const documento = await documentoService.create(data, file, userId);
    return c.json(success({ documento }, 'Documento subido correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/documentos/:id', permissionMiddleware('calidad2'), validate(updateDocumentoSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const documento = await documentoService.update(id, data);
    return c.json(success({ documento }, 'Documento actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/documentos/:id/mover', permissionMiddleware('calidad2'), validate(moverDocumentoSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { carpetaId } = c.req.validData;
    const documento = await documentoService.mover(id, carpetaId);
    return c.json(success({ documento }, 'Documento movido correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/documentos/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await documentoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PERSONAL
// ==========================================

calidad2.get('/personal', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await personalService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/personal/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await personalService.getStats();
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/personal/export', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await personalService.exportData();
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/personal/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const personal = await personalService.findById(id);
    return c.json(success({ personal }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/personal', permissionMiddleware('calidad2'), validate(createPersonalSchema), async (c) => {
  try {
    const data = c.req.validData;
    const personal = await personalService.create(data);
    return c.json(success({ personal }, 'Personal creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/personal/from-candidato/:id', permissionMiddleware('calidad2'), validate(createFromCandidatoSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const personal = await personalService.createFromCandidato(id, data);
    return c.json(success({ personal }, 'Personal creado desde candidato correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/personal/:id', permissionMiddleware('calidad2'), validate(updatePersonalSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const personal = await personalService.update(id, data);
    return c.json(success({ personal }, 'Personal actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/personal/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await personalService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Personal - Documentos
calidad2.get('/personal/:id/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const documentos = await personalService.getDocumentos(id);
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/personal/:id/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.parseBody();
    const file = body.file;
    const data = {
      nombre: body.nombre,
      checklistItemId: body.checklistItemId,
      fechaEmision: body.fechaEmision,
      fechaVencimiento: body.fechaVencimiento,
    };
    const userId = c.get('user').id;
    const documento = await personalService.uploadDocumento(id, data, file, userId);
    return c.json(success({ documento }, 'Documento subido correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/personal/:personalId/documentos/:docId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { personalId, docId } = c.req.param();
    const result = await personalService.deleteDocumento(personalId, docId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Personal - Checklist
calidad2.get('/personal/:id/checklist', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const checklist = await personalService.getChecklist(id);
    return c.json(success({ checklist }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/personal/:id/checklist/:itemId', permissionMiddleware('calidad2'), validate(updateEstadoChecklistSchema), async (c) => {
  try {
    const { id, itemId } = c.req.param();
    const data = c.req.validData;
    const userId = c.get('user').id;
    const estado = await personalService.updateChecklistItem(id, itemId, data, userId);
    return c.json(success({ estado }, 'Estado actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CHECKLISTS (Admin)
// ==========================================

calidad2.get('/checklists', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const templates = await checklistService.findAllTemplates(query);
    return c.json(success({ templates }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/checklists/by-entity/:tipo', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { tipo } = c.req.param();
    const templates = await checklistService.findByEntityType(tipo);
    return c.json(success({ templates }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/checklists/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const template = await checklistService.findTemplateById(id);
    return c.json(success({ template }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/checklists', permissionMiddleware('calidad2'), validate(createChecklistTemplateSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const template = await checklistService.createTemplate(data, userId);
    return c.json(success({ template }, 'Template creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/checklists/:id', permissionMiddleware('calidad2'), validate(updateChecklistTemplateSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const template = await checklistService.updateTemplate(id, data);
    return c.json(success({ template }, 'Template actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/checklists/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await checklistService.deleteTemplate(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Checklist Items
calidad2.post('/checklists/:id/items', permissionMiddleware('calidad2'), validate(createChecklistItemSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const item = await checklistService.addItem(id, data);
    return c.json(success({ item }, 'Item agregado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/checklists/items/:itemId', permissionMiddleware('calidad2'), validate(updateChecklistItemSchema), async (c) => {
  try {
    const { itemId } = c.req.param();
    const data = c.req.validData;
    const item = await checklistService.updateItem(itemId, data);
    return c.json(success({ item }, 'Item actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/checklists/items/:itemId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { itemId } = c.req.param();
    const result = await checklistService.deleteItem(itemId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CAPACIDAD INSTALADA
// ==========================================

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros dinámicos (:id)

// Resumen - debe ir antes de /capacidad/:id para que no confunda "resumen" con un ID
calidad2.get('/capacidad/resumen/:mes/:anio', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { mes, anio } = c.req.param();
    const resumen = await capacidadService.getResumenCompleto(parseInt(mes), parseInt(anio));
    return c.json(success({ resumen }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacidad/resumen', permissionMiddleware('calidad2'), validate(saveResumenSchema), async (c) => {
  try {
    const data = c.req.validData;
    const resumen = await capacidadService.saveResumen(data);
    return c.json(success({ resumen }, 'Resumen guardado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Resumen completo (capacidad + oferta + resumen mensual) - debe ir antes de /capacidad/:id
calidad2.get('/capacidad/resumen-completo', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { mes, anio } = c.req.query();
    const mesNum = parseInt(mes) || new Date().getMonth() + 1;
    const anioNum = parseInt(anio) || new Date().getFullYear();
    const result = await capacidadService.getResumenCompleto(mesNum, anioNum);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Documentos de capacidad - stub para evitar errores 404, implementación pendiente
calidad2.get('/capacidad/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    // TODO: Implementar servicio de documentos de capacidad
    return c.json(success([]));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacidad/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    // TODO: Implementar subida de documentos
    return c.json(success({ message: 'Funcionalidad pendiente de implementar' }), 501);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacidad', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await capacidadService.findAllCapacidad(query);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacidad/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const capacidad = await capacidadService.findCapacidadById(id);
    return c.json(success({ capacidad }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacidad', permissionMiddleware('calidad2'), validate(createCapacidadSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const capacidad = await capacidadService.createCapacidad(data, userId);
    return c.json(success({ capacidad }, 'Capacidad creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacidad/:id', permissionMiddleware('calidad2'), validate(updateCapacidadSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const capacidad = await capacidadService.updateCapacidad(id, data);
    return c.json(success({ capacidad }, 'Capacidad actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacidad/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await capacidadService.deleteCapacidad(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// OFERTA
// ==========================================

calidad2.get('/oferta', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await capacidadService.findAllOferta(query);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/oferta/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const oferta = await capacidadService.findOfertaById(id);
    return c.json(success({ oferta }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/oferta', permissionMiddleware('calidad2'), validate(createOfertaSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const oferta = await capacidadService.createOferta(data, userId);
    return c.json(success({ oferta }, 'Oferta creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/oferta/:id', permissionMiddleware('calidad2'), validate(updateOfertaSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const oferta = await capacidadService.updateOferta(id, data);
    return c.json(success({ oferta }, 'Oferta actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/oferta/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await capacidadService.deleteOferta(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ALERTAS
// ==========================================

calidad2.get('/alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await alertaPPService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/alertas/dashboard', permissionMiddleware('calidad2'), async (c) => {
  try {
    const dashboard = await alertaPPService.getDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/alertas/proximos-vencer', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { dias = 30 } = c.req.query();
    const documentos = await alertaPPService.getProximosVencer(parseInt(dias));
    return c.json(success({ documentos }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/alertas/:id/atender', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const alerta = await alertaPPService.atender(id, userId);
    return c.json(success({ alerta }, 'Alerta atendida correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/alertas/:id/descartar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const alerta = await alertaPPService.descartar(id, userId);
    return c.json(success({ alerta }, 'Alerta descartada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/alertas/generar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await alertaPPService.generarAlertas();
    return c.json(success({ result }, 'Alertas generadas correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CAPACITACIONES - CATEGORÍAS
// ==========================================

calidad2.get('/capacitaciones/categorias', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const categorias = await categoriaCapacitacionService.findAll(query);
    return c.json(success({ categorias }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/categorias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const categoria = await categoriaCapacitacionService.findById(id);
    return c.json(success({ categoria }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/categorias', permissionMiddleware('calidad2'), validate(createCategoriaCapacitacionSchema), async (c) => {
  try {
    const data = c.req.validData;
    const categoria = await categoriaCapacitacionService.create(data);
    return c.json(success({ categoria }, 'Categoría creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/categorias/:id', permissionMiddleware('calidad2'), validate(updateCategoriaCapacitacionSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const categoria = await categoriaCapacitacionService.update(id, data);
    return c.json(success({ categoria }, 'Categoría actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/categorias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await categoriaCapacitacionService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/categorias/reorder', permissionMiddleware('calidad2'), validate(reorderCategoriasSchema), async (c) => {
  try {
    const { orderedIds } = c.req.validData;
    const result = await categoriaCapacitacionService.reorder(orderedIds);
    return c.json(success({ result }, 'Orden actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CAPACITACIONES - CRONOGRAMA
// ==========================================

calidad2.get('/capacitaciones', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await capacitacionService.findAll(query);
    return c.json(paginated(result.capacitaciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/cronograma/:anio', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { anio } = c.req.param();
    const cronograma = await capacitacionService.getCronogramaAnual(anio);
    return c.json(success({ cronograma }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { anio } = c.req.query();
    const stats = await capacitacionService.getStats(anio);
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const capacitacion = await capacitacionService.findById(id);
    return c.json(success({ capacitacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones', permissionMiddleware('calidad2'), validate(createCapacitacionSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const capacitacion = await capacitacionService.create(data, userId);
    return c.json(success({ capacitacion }, 'Capacitación creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/:id', permissionMiddleware('calidad2'), validate(updateCapacitacionSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const capacitacion = await capacitacionService.update(id, data);
    return c.json(success({ capacitacion }, 'Capacitación actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await capacitacionService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/:id/materiales', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const materiales = await capacitacionService.getMateriales(id);
    return c.json(success({ materiales }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/:id/materiales', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.parseBody();
    const file = body.file;
    const data = {
      nombre: body.nombre,
      descripcion: body.descripcion,
      tipo: body.tipo,
    };
    const userId = c.get('user').id;

    // TODO: Implementar método uploadMaterial en capacitacion.service.js
    // Por ahora, retornar error indicando que está en desarrollo
    return c.json(error('La funcionalidad de subir materiales está en desarrollo. Próximamente disponible.'), 501);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CAPACITACIONES - SESIONES
// ==========================================

calidad2.get('/capacitaciones/:id/sesiones', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const query = c.req.query();
    const result = await sesionService.findByCapacitacion(id, query);
    return c.json(paginated(result.sesiones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/:id/sesiones', permissionMiddleware('calidad2'), validate(createSesionSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const userId = c.get('user').id;
    const sesion = await sesionService.create(id, data, userId);
    return c.json(success({ sesion }, 'Sesión creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/sesiones/:sesionId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const sesion = await sesionService.findById(sesionId);
    return c.json(success({ sesion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/sesiones/:sesionId', permissionMiddleware('calidad2'), validate(updateSesionSchema), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const data = c.req.validData;
    const sesion = await sesionService.update(sesionId, data);
    return c.json(success({ sesion }, 'Sesión actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/sesiones/:sesionId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const result = await sesionService.delete(sesionId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/sesiones/:sesionId/iniciar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const sesion = await sesionService.iniciar(sesionId);
    return c.json(success({ sesion }, 'Sesión iniciada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/sesiones/:sesionId/finalizar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const sesion = await sesionService.finalizar(sesionId);
    return c.json(success({ sesion }, 'Sesión finalizada y acta generada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Sesiones - Asistentes
calidad2.get('/capacitaciones/sesiones/:sesionId/asistentes', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const asistentes = await sesionService.getAsistentes(sesionId);
    return c.json(success({ asistentes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/sesiones/:sesionId/asistentes', permissionMiddleware('calidad2'), validate(addAsistentesSchema), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const { asistentes } = c.req.validData;
    const result = await sesionService.addAsistentes(sesionId, asistentes);
    return c.json(success({ asistentes: result }, 'Asistentes agregados correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/sesiones/:sesionId/asistentes/:asId', permissionMiddleware('calidad2'), validate(updateAsistenteSchema), async (c) => {
  try {
    const { sesionId, asId } = c.req.param();
    const data = c.req.validData;
    const asistente = await sesionService.updateAsistente(sesionId, asId, data);
    return c.json(success({ asistente }, 'Asistente actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/sesiones/:sesionId/asistentes/:asId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId, asId } = c.req.param();
    const result = await sesionService.removeAsistente(sesionId, asId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/sesiones/:sesionId/asistencia-masiva', permissionMiddleware('calidad2'), validate(marcarAsistenciaMasivaSchema), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const { asistentesIds, asistio } = c.req.validData;
    const asistentes = await sesionService.marcarAsistenciaMasiva(sesionId, asistentesIds, asistio);
    return c.json(success({ asistentes }, 'Asistencia marcada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CAPACITACIONES - EVALUACIONES (KAHOOT)
// ==========================================

calidad2.get('/capacitaciones/:id/evaluaciones', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const evaluaciones = await evaluacionService.findByCapacitacion(id);
    return c.json(success({ evaluaciones }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/:id/evaluaciones', permissionMiddleware('calidad2'), validate(createEvaluacionSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const userId = c.get('user').id;
    const evaluacion = await evaluacionService.create(id, data, userId);
    return c.json(success({ evaluacion }, 'Evaluación creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/evaluaciones/:evalId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { evalId } = c.req.param();
    const evaluacion = await evaluacionService.findById(evalId);
    return c.json(success({ evaluacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/evaluaciones/:evalId', permissionMiddleware('calidad2'), validate(updateEvaluacionSchema), async (c) => {
  try {
    const { evalId } = c.req.param();
    const data = c.req.validData;
    const evaluacion = await evaluacionService.update(evalId, data);
    return c.json(success({ evaluacion }, 'Evaluación actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/evaluaciones/:evalId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { evalId } = c.req.param();
    const result = await evaluacionService.delete(evalId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Evaluaciones - Preguntas
calidad2.post('/capacitaciones/evaluaciones/:evalId/preguntas', permissionMiddleware('calidad2'), validate(createPreguntaSchema), async (c) => {
  try {
    const { evalId } = c.req.param();
    const data = c.req.validData;
    const pregunta = await evaluacionService.addPregunta(evalId, data);
    return c.json(success({ pregunta }, 'Pregunta agregada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/evaluaciones/preguntas/:pregId', permissionMiddleware('calidad2'), validate(updatePreguntaSchema), async (c) => {
  try {
    const { pregId } = c.req.param();
    const data = c.req.validData;
    const pregunta = await evaluacionService.updatePregunta(pregId, data);
    return c.json(success({ pregunta }, 'Pregunta actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/evaluaciones/preguntas/:pregId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { pregId } = c.req.param();
    const result = await evaluacionService.deletePregunta(pregId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/evaluaciones/:evalId/preguntas/reorder', permissionMiddleware('calidad2'), validate(reorderPreguntasSchema), async (c) => {
  try {
    const { evalId } = c.req.param();
    const { orderedIds } = c.req.validData;
    const result = await evaluacionService.reorderPreguntas(evalId, orderedIds);
    return c.json(success({ result }, 'Orden actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Evaluaciones - Opciones
calidad2.post('/capacitaciones/evaluaciones/preguntas/:pregId/opciones', permissionMiddleware('calidad2'), validate(createOpcionSchema), async (c) => {
  try {
    const { pregId } = c.req.param();
    const data = c.req.validData;
    const opcion = await evaluacionService.addOpcion(pregId, data);
    return c.json(success({ opcion }, 'Opción agregada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/capacitaciones/evaluaciones/opciones/:opId', permissionMiddleware('calidad2'), validate(updateOpcionSchema), async (c) => {
  try {
    const { opId } = c.req.param();
    const data = c.req.validData;
    const opcion = await evaluacionService.updateOpcion(opId, data);
    return c.json(success({ opcion }, 'Opción actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/capacitaciones/evaluaciones/opciones/:opId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { opId } = c.req.param();
    const result = await evaluacionService.deleteOpcion(opId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CAPACITACIONES - EJECUCIÓN DE EVALUACIÓN (KAHOOT)
// ==========================================

calidad2.get('/capacitaciones/sesiones/:sesionId/evaluacion/:tipo', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId, tipo } = c.req.param();
    const evaluacion = await evaluacionService.getEvaluacionParaResponder(sesionId, tipo);
    return c.json(success({ evaluacion }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/capacitaciones/sesiones/:sesionId/respuestas', permissionMiddleware('calidad2'), validate(registrarRespuestaSchema), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const data = c.req.validData;
    const respuesta = await evaluacionService.registrarRespuesta(sesionId, data);
    return c.json(success({ respuesta }, 'Respuesta registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/sesiones/:sesionId/resultados', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const resultados = await evaluacionService.getResultadosSesion(sesionId);
    return c.json(success({ resultados }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/sesiones/:sesionId/comparativo', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const comparativo = await evaluacionService.getComparativoPrePost(sesionId);
    return c.json(success({ comparativo }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/capacitaciones/sesiones/:sesionId/ranking', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const ranking = await evaluacionService.getRankingParticipantes(sesionId);
    return c.json(success({ ranking }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ACTAS DE REUNIÓN
// ==========================================

calidad2.get('/actas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await actaService.findAll(query);
    return c.json(paginated(result.actas, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/actas/siguiente-numero', permissionMiddleware('calidad2'), async (c) => {
  try {
    const numero = await actaService.getSiguienteNumero();
    return c.json(success({ numero }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/actas/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const stats = await actaService.getStats(query);
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/actas/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const acta = await actaService.findById(id);
    return c.json(success({ acta }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/actas', permissionMiddleware('calidad2'), validate(createActaSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const acta = await actaService.create(data, userId);
    return c.json(success({ acta }, 'Acta creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/actas/:id', permissionMiddleware('calidad2'), validate(updateActaSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const acta = await actaService.update(id, data);
    return c.json(success({ acta }, 'Acta actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/actas/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await actaService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/actas/:id/pdf', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const pdfBuffer = await actaService.generatePDF(id);
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="acta-${id}.pdf"`
      }
    });
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actas - Asistentes
calidad2.post('/actas/:id/asistentes', permissionMiddleware('calidad2'), validate(addAsistenteActaSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.validData;
    const asistente = await actaService.addAsistente(id, data);
    return c.json(success({ asistente }, 'Asistente agregado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/actas/:id/asistentes/:asId', permissionMiddleware('calidad2'), validate(updateAsistenteActaSchema), async (c) => {
  try {
    const { id, asId } = c.req.param();
    const data = c.req.validData;
    const asistente = await actaService.updateAsistente(id, asId, data);
    return c.json(success({ asistente }, 'Asistente actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/actas/:id/asistentes/:asId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id, asId } = c.req.param();
    const result = await actaService.removeAsistente(id, asId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MANUALES DE FUNCIONES
// ==========================================

// Listar manuales
calidad2.get('/manuales', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await manualFuncionesService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener estadísticas
calidad2.get('/manuales/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await manualFuncionesService.getStats();
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener áreas únicas
calidad2.get('/manuales/areas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const areas = await manualFuncionesService.getAreas();
    return c.json(success({ areas }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener manual por ID
calidad2.get('/manuales/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const manual = await manualFuncionesService.findById(id);
    return c.json(success({ manual }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear manual
calidad2.post('/manuales', permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');
    const manual = await manualFuncionesService.create(data, user.id);
    return c.json(success({ manual }, 'Manual creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar manual
calidad2.put('/manuales/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const manual = await manualFuncionesService.update(id, data, user.id);
    return c.json(success({ manual }, 'Manual actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar manual
calidad2.delete('/manuales/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await manualFuncionesService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Aprobar manual
calidad2.post('/manuales/:id/aprobar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const manual = await manualFuncionesService.aprobar(id, user.id);
    return c.json(success({ manual }, 'Manual aprobado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Marcar como obsoleto
calidad2.post('/manuales/:id/obsoleto', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const manual = await manualFuncionesService.marcarObsoleto(id);
    return c.json(success({ manual }, 'Manual marcado como obsoleto'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Duplicar manual
calidad2.post('/manuales/:id/duplicar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const user = c.get('user');
    const manual = await manualFuncionesService.duplicar(id, data, user.id);
    return c.json(success({ manual }, 'Manual duplicado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ALERTAS TALENTO HUMANO
// ==========================================

calidad2.get('/alertas-th', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await alertaPPService.getAlertasTalentoHumano(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/alertas-th/dashboard', permissionMiddleware('calidad2'), async (c) => {
  try {
    const dashboard = await alertaPPService.getDashboardTalentoHumano();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/alertas-th/:id/atender', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const alerta = await alertaPPService.atenderAlertaTH(id, userId);
    return c.json(success({ alerta }, 'Alerta atendida correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/alertas-th/generar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await alertaPPService.generarAlertasTalentoHumano();
    return c.json(success({ result }, 'Alertas generadas correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PROCESOS DE INDUCCIÓN / REINDUCCIÓN
// ==========================================

calidad2.get('/induccion', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await induccionService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/induccion/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const stats = await induccionService.getStats(query);
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/induccion/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const proceso = await induccionService.findById(id);
    return c.json(success({ proceso }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/induccion', permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const proceso = await induccionService.create(data, userId);
    return c.json(success({ proceso }, 'Proceso de inducción creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/induccion/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const proceso = await induccionService.update(id, data);
    return c.json(success({ proceso }, 'Proceso actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/induccion/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await induccionService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/induccion/:id/iniciar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const proceso = await induccionService.iniciar(id);
    return c.json(success({ proceso }, 'Proceso iniciado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/induccion/:id/completar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const proceso = await induccionService.completar(id);
    return c.json(success({ proceso }, 'Proceso completado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/induccion/:id/cancelar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const { motivo } = await c.req.json();
    const proceso = await induccionService.cancelar(id, motivo);
    return c.json(success({ proceso }, 'Proceso cancelado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Inducción - Fases
calidad2.post('/induccion/:id/fases', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const fase = await induccionService.addFase(id, data);
    return c.json(success({ fase }, 'Fase agregada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/induccion/fases/:faseId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { faseId } = c.req.param();
    const data = await c.req.json();
    const fase = await induccionService.updateFase(faseId, data);
    return c.json(success({ fase }, 'Fase actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/induccion/fases/:faseId/completar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { faseId } = c.req.param();
    const fase = await induccionService.completarFase(faseId);
    return c.json(success({ fase }, 'Fase completada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/induccion/fases/:faseId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { faseId } = c.req.param();
    const result = await induccionService.deleteFase(faseId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Inducción - Evaluación
calidad2.post('/induccion/:id/evaluacion', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const userId = c.get('user').id;
    const evaluacion = await induccionService.registrarEvaluacion(id, data, userId);
    return c.json(success({ evaluacion }, 'Evaluación registrada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CERTIFICADOS DE CAPACITACIÓN
// ==========================================

calidad2.get('/certificados', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await certificadoService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/certificados/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const stats = await certificadoService.getStats(query);
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/certificados/verificar/:codigo', async (c) => {
  try {
    const { codigo } = c.req.param();
    const result = await certificadoService.verificar(codigo);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/certificados/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const certificado = await certificadoService.findById(id);
    return c.json(success({ certificado }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/certificados', permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const certificado = await certificadoService.create(data, userId);
    return c.json(success({ certificado }, 'Certificado creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/certificados/generar-sesion/:sesionId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const userId = c.get('user').id;
    const result = await certificadoService.generarParaSesion(sesionId, userId);
    return c.json(success(result, `${result.generados} certificados generados`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/certificados/personal/:personalId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { personalId } = c.req.param();
    const certificados = await certificadoService.findByPersonal(personalId);
    return c.json(success({ certificados }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/certificados/sesion/:sesionId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { sesionId } = c.req.param();
    const certificados = await certificadoService.findBySesion(sesionId);
    return c.json(success({ certificados }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/certificados/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await certificadoService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FORMATOS DINÁMICOS - TEMPLATES
// ==========================================

calidad2.get('/formatos/templates', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await formatoService.findAllTemplates(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/formatos/templates/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const template = await formatoService.findTemplateById(id);
    return c.json(success({ template }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/formatos/templates', permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const template = await formatoService.createTemplate(data, userId);
    return c.json(success({ template }, 'Template creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/templates/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const template = await formatoService.updateTemplate(id, data);
    return c.json(success({ template }, 'Template actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/templates/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await formatoService.deleteTemplate(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/formatos/templates/:id/duplicar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const userId = c.get('user').id;
    const template = await formatoService.duplicateTemplate(id, data, userId);
    return c.json(success({ template }, 'Template duplicado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Templates - Secciones
calidad2.post('/formatos/templates/:id/secciones', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const seccion = await formatoService.addSeccion(id, data);
    return c.json(success({ seccion }, 'Sección agregada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/secciones/:seccionId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { seccionId } = c.req.param();
    const data = await c.req.json();
    const seccion = await formatoService.updateSeccion(seccionId, data);
    return c.json(success({ seccion }, 'Sección actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/secciones/:seccionId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { seccionId } = c.req.param();
    const result = await formatoService.deleteSeccion(seccionId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/templates/:id/secciones/reordenar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const { orderedIds } = await c.req.json();
    const result = await formatoService.reorderSecciones(id, orderedIds);
    return c.json(success(result, 'Orden actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Templates - Campos
calidad2.post('/formatos/templates/:id/campos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const campo = await formatoService.addCampo(id, data);
    return c.json(success({ campo }, 'Campo agregado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/campos/:campoId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { campoId } = c.req.param();
    const data = await c.req.json();
    const campo = await formatoService.updateCampo(campoId, data);
    return c.json(success({ campo }, 'Campo actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/campos/:campoId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { campoId } = c.req.param();
    const result = await formatoService.deleteCampo(campoId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/templates/:id/campos/reordenar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const { orderedIds } = await c.req.json();
    const result = await formatoService.reorderCampos(id, orderedIds);
    return c.json(success(result, 'Orden actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FORMATOS DINÁMICOS - INSTANCIAS
// ==========================================

calidad2.get('/formatos/instancias', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await formatoInstanciaService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/formatos/instancias/stats', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const stats = await formatoInstanciaService.getStats(query);
    return c.json(success({ stats }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/formatos/instancias/cumplimiento', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const cumplimiento = await formatoInstanciaService.getCumplimiento(query);
    return c.json(success({ cumplimiento }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/formatos/instancias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const instancia = await formatoInstanciaService.findById(id);
    return c.json(success({ instancia }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/formatos/instancias', permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const instancia = await formatoInstanciaService.create(data, userId);
    return c.json(success({ instancia }, 'Instancia creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/instancias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const instancia = await formatoInstanciaService.update(id, data);
    return c.json(success({ instancia }, 'Instancia actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/instancias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const result = await formatoInstanciaService.delete(id);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/instancias/:id/completar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const instancia = await formatoInstanciaService.completar(id, userId);
    return c.json(success({ instancia }, 'Instancia completada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/instancias/:id/cancelar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const instancia = await formatoInstanciaService.cancelar(id);
    return c.json(success({ instancia }, 'Instancia cancelada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Instancias - Respuestas
calidad2.put('/formatos/instancias/:id/respuestas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const { respuestas } = await c.req.json();
    const result = await formatoInstanciaService.saveRespuestas(id, respuestas);
    return c.json(success({ respuestas: result }, 'Respuestas guardadas correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Instancias - Asistentes
calidad2.get('/formatos/instancias/:id/asistentes', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const asistentes = await formatoInstanciaService.getAsistentes(id);
    return c.json(success({ asistentes }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/formatos/instancias/:id/asistentes', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const asistente = await formatoInstanciaService.addAsistente(id, data);
    return c.json(success({ asistente }, 'Asistente agregado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/instancias/:id/asistentes/:asId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id, asId } = c.req.param();
    const data = await c.req.json();
    const asistente = await formatoInstanciaService.updateAsistente(asId, data);
    return c.json(success({ asistente }, 'Asistente actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/instancias/:id/asistentes/:asId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { asId } = c.req.param();
    const result = await formatoInstanciaService.deleteAsistente(asId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Instancias - Firmas
calidad2.post('/formatos/instancias/:id/firmas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const firma = await formatoInstanciaService.addFirma(id, data);
    return c.json(success({ firma }, 'Firma agregada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/instancias/:id/firmas/:firmaId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { firmaId } = c.req.param();
    const data = await c.req.json();
    const firma = await formatoInstanciaService.updateFirma(firmaId, data);
    return c.json(success({ firma }, 'Firma actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/instancias/:id/firmas/:firmaId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { firmaId } = c.req.param();
    const result = await formatoInstanciaService.deleteFirma(firmaId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Instancias - Historial
calidad2.get('/formatos/instancias/:id/historial', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const historial = await formatoInstanciaService.getHistorial(id);
    return c.json(success({ historial }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Instancias - Archivos
calidad2.post('/formatos/instancias/:id/archivos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.parseBody();
    const file = body.file;
    const data = {
      nombre: body.nombre,
    };
    const userId = c.get('user').id;
    const archivo = await formatoInstanciaService.addArchivo(id, data, file, userId);
    return c.json(success({ archivo }, 'Archivo subido correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.delete('/formatos/instancias/:id/archivos/:archivoId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { archivoId } = c.req.param();
    const result = await formatoInstanciaService.deleteArchivo(archivoId);
    return c.json(success(result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// FORMATOS DINÁMICOS - ALERTAS
// ==========================================

calidad2.get('/formatos/alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await formatoInstanciaService.getAlertas(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.get('/formatos/alertas/dashboard', permissionMiddleware('calidad2'), async (c) => {
  try {
    const dashboard = await formatoInstanciaService.getAlertasDashboard();
    return c.json(success({ dashboard }));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.put('/formatos/alertas/:id/atender', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const alerta = await formatoInstanciaService.atenderAlerta(id, userId);
    return c.json(success({ alerta }, 'Alerta atendida correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

calidad2.post('/formatos/alertas/generar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await formatoInstanciaService.generarAlertas();
    return c.json(success({ result }, 'Alertas generadas correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MÓDULO INFRAESTRUCTURA
// ==========================================
const infraestructuraRoutes = require('./calidad2/infraestructura');
calidad2.route('/infraestructura', infraestructuraRoutes);

// ==========================================
// MÓDULO MEDICAMENTOS - PROTOCOLOS
// ==========================================

// Obtener todos los protocolos
calidad2.get('/medicamentos/protocolos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await protocoloMedicamentosService.findAll(c.req.query());
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener protocolos vigentes
calidad2.get('/medicamentos/protocolos/vigentes', permissionMiddleware('calidad2'), async (c) => {
  try {
    const protocolos = await protocoloMedicamentosService.getVigentes();
    return c.json(success('Protocolos vigentes obtenidos', protocolos));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener protocolos próximos a revisión
calidad2.get('/medicamentos/protocolos/proximas-revisiones', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { dias } = c.req.query();
    const protocolos = await protocoloMedicamentosService.getProximasRevisiones(dias ? parseInt(dias) : 30);
    return c.json(success('Protocolos próximos a revisión obtenidos', protocolos));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener un protocolo por ID
calidad2.get('/medicamentos/protocolos/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const protocolo = await protocoloMedicamentosService.findById(c.req.param('id'));
    return c.json(success('Protocolo obtenido', protocolo));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear un nuevo protocolo
calidad2.post('/medicamentos/protocolos', permissionMiddleware('calidad2'), validate(createProtocoloSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const protocolo = await protocoloMedicamentosService.create(data, userId);
    return c.json(success('Protocolo creado exitosamente', protocolo), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar un protocolo
calidad2.put('/medicamentos/protocolos/:id', permissionMiddleware('calidad2'), validate(updateProtocoloSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const protocolo = await protocoloMedicamentosService.update(c.req.param('id'), data, userId);
    return c.json(success('Protocolo actualizado exitosamente', protocolo));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar un protocolo
calidad2.delete('/medicamentos/protocolos/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await protocoloMedicamentosService.delete(c.req.param('id'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Aprobar un protocolo
calidad2.post('/medicamentos/protocolos/:id/aprobar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const userId = c.get('user').id;
    const protocolo = await protocoloMedicamentosService.aprobar(c.req.param('id'), userId);
    return c.json(success('Protocolo aprobado exitosamente', protocolo));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar documento de protocolo
calidad2.delete('/medicamentos/protocolos/documentos/:documentoId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await protocoloMedicamentosService.deleteDocumento(c.req.param('documentoId'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MÓDULO MEDICAMENTOS - INVENTARIO
// ==========================================

// Obtener estadísticas de inventario
calidad2.get('/medicamentos/inventario/estadisticas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const estadisticas = await inventarioService.getEstadisticas();
    return c.json(success(estadisticas, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener items próximos a vencer
calidad2.get('/medicamentos/inventario/proximos-vencer', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { dias } = c.req.query();
    const items = await inventarioService.getProximosVencer(dias ? parseInt(dias) : 30);
    return c.json(success('Items próximos a vencer obtenidos', items));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener items vencidos
calidad2.get('/medicamentos/inventario/vencidos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const items = await inventarioService.getVencidos();
    return c.json(success('Items vencidos obtenidos', items));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener items con stock bajo
calidad2.get('/medicamentos/inventario/stock-bajo', permissionMiddleware('calidad2'), async (c) => {
  try {
    const items = await inventarioService.getStockBajo();
    return c.json(success('Items con stock bajo obtenidos', items));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener solo medicamentos
calidad2.get('/medicamentos/inventario/medicamentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await inventarioService.getMedicamentos(c.req.query());
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener solo dispositivos médicos
calidad2.get('/medicamentos/inventario/dispositivos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await inventarioService.getDispositivos(c.req.query());
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener solo insumos médico-quirúrgicos
calidad2.get('/medicamentos/inventario/insumos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await inventarioService.getInsumos(c.req.query());
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Recalcular todas las alertas (cron job trigger)
calidad2.post('/medicamentos/inventario/recalcular-alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await inventarioService.recalcularTodasAlertas();
    return c.json(success('Alertas recalculadas exitosamente', result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener todos los items de inventario
calidad2.get('/medicamentos/inventario', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await inventarioService.findAll(c.req.query());
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener un item de inventario por ID
calidad2.get('/medicamentos/inventario/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const item = await inventarioService.findById(c.req.param('id'));
    return c.json(success('Item de inventario obtenido', item));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear un nuevo item de inventario
calidad2.post('/medicamentos/inventario', permissionMiddleware('calidad2'), validate(createInventarioSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const item = await inventarioService.create(data, userId);
    return c.json(success('Item de inventario creado exitosamente', item), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar un item de inventario
calidad2.put('/medicamentos/inventario/:id', permissionMiddleware('calidad2'), validate(updateInventarioSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const item = await inventarioService.update(c.req.param('id'), data, userId);
    return c.json(success('Item de inventario actualizado exitosamente', item));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar un item de inventario
calidad2.delete('/medicamentos/inventario/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    await inventarioService.delete(c.req.param('id'));
    return c.json(success('Item de inventario eliminado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Calcular alertas para un item específico
calidad2.post('/medicamentos/inventario/:id/calcular-alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await inventarioService.calcularAlertas(c.req.param('id'));
    return c.json(success('Alertas calculadas exitosamente', result));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MÓDULO MEDICAMENTOS - FARMACOVIGILANCIA
// ==========================================

// Obtener estadísticas de farmacovigilancia
calidad2.get('/medicamentos/farmacovigilancia/estadisticas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const estadisticas = await farmacovigilanciaService.getEstadisticas(c.req.query());
    return c.json(success('Estadísticas obtenidas', estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener reportes pendientes de INVIMA
calidad2.get('/medicamentos/farmacovigilancia/pendientes-invima', permissionMiddleware('calidad2'), async (c) => {
  try {
    const reportes = await farmacovigilanciaService.getPendientesINVIMA();
    return c.json(success('Reportes pendientes obtenidos', reportes));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener todos los reportes de farmacovigilancia
calidad2.get('/medicamentos/farmacovigilancia', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await farmacovigilanciaService.findAll(c.req.query());
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener un reporte por ID
calidad2.get('/medicamentos/farmacovigilancia/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const reporte = await farmacovigilanciaService.findById(c.req.param('id'));
    return c.json(success('Reporte obtenido', reporte));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear un nuevo reporte
calidad2.post('/medicamentos/farmacovigilancia', permissionMiddleware('calidad2'), validate(createReporteFarmacoSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const reporte = await farmacovigilanciaService.create(data, userId);
    return c.json(success('Reporte creado exitosamente', reporte), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar un reporte
calidad2.put('/medicamentos/farmacovigilancia/:id', permissionMiddleware('calidad2'), validate(updateReporteFarmacoSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const reporte = await farmacovigilanciaService.update(c.req.param('id'), data, userId);
    return c.json(success('Reporte actualizado exitosamente', reporte));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar un reporte
calidad2.delete('/medicamentos/farmacovigilancia/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await farmacovigilanciaService.delete(c.req.param('id'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Reportar a INVIMA
calidad2.post('/medicamentos/farmacovigilancia/:id/reportar-invima', permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const reporte = await farmacovigilanciaService.reportarINVIMA(c.req.param('id'), data, userId);
    return c.json(success('Reporte enviado a INVIMA exitosamente', reporte));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Upload documento a reporte
calidad2.post('/medicamentos/farmacovigilancia/:id/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const reporteId = c.req.param('id');
    // This would need multipart handling - placeholder for now
    const body = await c.req.json();
    const userId = c.get('user').id;
    const documento = await farmacovigilanciaService.uploadDocumento(reporteId, body.file, body.metadata, userId);
    return c.json(success('Documento cargado exitosamente', documento), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar documento de reporte
calidad2.delete('/medicamentos/farmacovigilancia/documentos/:documentoId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await farmacovigilanciaService.deleteDocumento(c.req.param('documentoId'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MÓDULO MEDICAMENTOS - TECNOVIGILANCIA
// ==========================================

// Obtener estadísticas de tecnovigilancia
calidad2.get('/medicamentos/tecnovigilancia/estadisticas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const filters = c.req.query();
    const estadisticas = await tecnovigilanciaService.getEstadisticas(filters);
    return c.json(success('Estadísticas obtenidas exitosamente', estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener consolidado trimestral
calidad2.get('/medicamentos/tecnovigilancia/consolidado/:trimestre/:anio', permissionMiddleware('calidad2'), async (c) => {
  try {
    const trimestre = c.req.param('trimestre');
    const anio = c.req.param('anio');
    const consolidado = await tecnovigilanciaService.getConsolidadoTrimestral(trimestre, anio);
    return c.json(success('Consolidado trimestral obtenido exitosamente', consolidado));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener reportes pendientes de INVIMA
calidad2.get('/medicamentos/tecnovigilancia/pendientes-invima', permissionMiddleware('calidad2'), async (c) => {
  try {
    const reportes = await tecnovigilanciaService.getPendientesINVIMA();
    return c.json(success('Reportes pendientes obtenidos exitosamente', reportes));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener todos los reportes de tecnovigilancia con filtros
calidad2.get('/medicamentos/tecnovigilancia', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await tecnovigilanciaService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener reporte por ID
calidad2.get('/medicamentos/tecnovigilancia/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const reporte = await tecnovigilanciaService.findById(c.req.param('id'));
    return c.json(success('Reporte obtenido exitosamente', reporte));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nuevo reporte de tecnovigilancia
calidad2.post('/medicamentos/tecnovigilancia', permissionMiddleware('calidad2'), validate(createReporteTecnoSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const reporte = await tecnovigilanciaService.create(data, userId);
    return c.json(success(reporte, 'Reporte creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar reporte
calidad2.put('/medicamentos/tecnovigilancia/:id', permissionMiddleware('calidad2'), validate(updateReporteTecnoSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const reporte = await tecnovigilanciaService.update(c.req.param('id'), data, userId);
    return c.json(success('Reporte actualizado exitosamente', reporte));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar reporte
calidad2.delete('/medicamentos/tecnovigilancia/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await tecnovigilanciaService.delete(c.req.param('id'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Reportar a INVIMA
calidad2.post('/medicamentos/tecnovigilancia/:id/reportar-invima', permissionMiddleware('calidad2'), async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user').id;
    const reporte = await tecnovigilanciaService.reportarINVIMA(c.req.param('id'), body, userId);
    return c.json(success('Reporte enviado a INVIMA exitosamente', reporte));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Cargar documento al reporte
calidad2.post('/medicamentos/tecnovigilancia/:id/documentos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('user').id;

    // TODO: Implement file upload handling with multipart/form-data
    const mockFile = {
      name: body.nombre || 'documento.pdf',
      type: body.tipo || 'application/pdf',
      size: body.size || 0,
    };

    const metadata = {
      nombre: body.nombre,
      archivoUrl: body.archivoUrl || '/uploads/temp/documento.pdf',
    };

    const documento = await tecnovigilanciaService.uploadDocumento(c.req.param('id'), mockFile, metadata, userId);
    return c.json(success('Documento cargado exitosamente', documento), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar documento de reporte
calidad2.delete('/medicamentos/tecnovigilancia/documentos/:documentoId', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await tecnovigilanciaService.deleteDocumento(c.req.param('documentoId'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MÓDULO MEDICAMENTOS - TEMPERATURA Y HUMEDAD
// ==========================================

// Obtener estadísticas
calidad2.get('/medicamentos/temperatura-humedad/estadisticas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const filters = c.req.query();
    const estadisticas = await temperaturaHumedadService.getEstadisticas(filters);
    return c.json(success('Estadísticas obtenidas exitosamente', estadisticas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener alertas (registros fuera de rango)
calidad2.get('/medicamentos/temperatura-humedad/alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { area } = c.req.query();
    const alertas = await temperaturaHumedadService.getAlertas(area);
    return c.json(success('Alertas obtenidas exitosamente', alertas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener tendencias para gráficas
calidad2.get('/medicamentos/temperatura-humedad/tendencias/:area', permissionMiddleware('calidad2'), async (c) => {
  try {
    const area = c.req.param('area');
    const { periodo = '30' } = c.req.query();
    const tendencias = await temperaturaHumedadService.getTendencias(area, periodo);
    return c.json(success('Tendencias obtenidas exitosamente', tendencias));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener registros por área
calidad2.get('/medicamentos/temperatura-humedad/area/:area', permissionMiddleware('calidad2'), async (c) => {
  try {
    const area = c.req.param('area');
    const { fechaInicio, fechaFin } = c.req.query();
    const registros = await temperaturaHumedadService.getByArea(area, fechaInicio, fechaFin);
    return c.json(success('Registros obtenidos exitosamente', registros));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Exportar datos
calidad2.get('/medicamentos/temperatura-humedad/exportar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const { area, fechaInicio, fechaFin } = c.req.query();
    const data = await temperaturaHumedadService.exportar(area, fechaInicio, fechaFin);
    return c.json(success('Datos exportados exitosamente', data));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener todos los registros con filtros
calidad2.get('/medicamentos/temperatura-humedad', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await temperaturaHumedadService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener registro por ID
calidad2.get('/medicamentos/temperatura-humedad/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const registro = await temperaturaHumedadService.findById(c.req.param('id'));
    return c.json(success('Registro obtenido exitosamente', registro));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nuevo registro
calidad2.post('/medicamentos/temperatura-humedad', permissionMiddleware('calidad2'), validate(createTemperaturaSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const registro = await temperaturaHumedadService.create(data, userId);
    return c.json(success('Registro creado exitosamente', registro), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar registro
calidad2.put('/medicamentos/temperatura-humedad/:id', permissionMiddleware('calidad2'), validate(updateTemperaturaSchema), async (c) => {
  try {
    const data = c.req.validData;
    const userId = c.get('user').id;
    const registro = await temperaturaHumedadService.update(c.req.param('id'), data, userId);
    return c.json(success('Registro actualizado exitosamente', registro));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar registro
calidad2.delete('/medicamentos/temperatura-humedad/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await temperaturaHumedadService.delete(c.req.param('id'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MEDICAMENTOS - FORMATOS
// ==========================================

// Get formatos statistics
calidad2.get('/medicamentos/formatos/estadisticas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await formatoMedicamentoService.getEstadisticas();
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get vigentes formatos (for dropdown)
calidad2.get('/medicamentos/formatos/vigentes', permissionMiddleware('calidad2'), async (c) => {
  try {
    const formatos = await formatoMedicamentoService.getFormatosVigentes();
    return c.json(success(formatos));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get all formatos with filters
calidad2.get('/medicamentos/formatos', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await formatoMedicamentoService.findAllFormatos(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get formato by ID
calidad2.get('/medicamentos/formatos/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const formato = await formatoMedicamentoService.findFormatoById(c.req.param('id'));
    return c.json(success(formato));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create formato
calidad2.post('/medicamentos/formatos', permissionMiddleware('calidad2'), validate(createFormatoSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = c.req.validData;
    const formato = await formatoMedicamentoService.createFormato(data, userId);
    return c.json(success(formato, 'Formato creado correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update formato
calidad2.put('/medicamentos/formatos/:id', permissionMiddleware('calidad2'), validate(updateFormatoSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = c.req.validData;
    const formato = await formatoMedicamentoService.updateFormato(c.req.param('id'), data, userId);
    return c.json(success(formato, 'Formato actualizado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete formato
calidad2.delete('/medicamentos/formatos/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await formatoMedicamentoService.deleteFormato(c.req.param('id'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MEDICAMENTOS - INSTANCIAS DE FORMATOS
// ==========================================

// Get all instancias with filters
calidad2.get('/medicamentos/formatos/instancias', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await formatoMedicamentoService.findAllInstancias(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get instancias by formato ID
calidad2.get('/medicamentos/formatos/:formatoId/instancias', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await formatoMedicamentoService.getInstancesByFormato(c.req.param('formatoId'), query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get instancia by ID
calidad2.get('/medicamentos/formatos/instancias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const instancia = await formatoMedicamentoService.findInstanciaById(c.req.param('id'));
    return c.json(success(instancia));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create instancia
calidad2.post('/medicamentos/formatos/:formatoId/instancias', permissionMiddleware('calidad2'), validate(createInstanciaFormatoSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = {
      ...c.req.validData,
      formatoId: c.req.param('formatoId'),
    };
    const instancia = await formatoMedicamentoService.createInstancia(data, userId);
    return c.json(success(instancia, 'Instancia creada correctamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update instancia
calidad2.put('/medicamentos/formatos/instancias/:id', permissionMiddleware('calidad2'), validate(updateInstanciaFormatoSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = c.req.validData;
    const instancia = await formatoMedicamentoService.updateInstancia(c.req.param('id'), data, userId);
    return c.json(success(instancia, 'Instancia actualizada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Revisar instancia
calidad2.post('/medicamentos/formatos/instancias/:id/revisar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const userId = c.get('userId');
    const { observaciones } = await c.req.json();
    const instancia = await formatoMedicamentoService.revisarInstancia(c.req.param('id'), userId, observaciones);
    return c.json(success(instancia, 'Instancia revisada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete instancia
calidad2.delete('/medicamentos/formatos/instancias/:id', permissionMiddleware('calidad2'), async (c) => {
  try {
    const result = await formatoMedicamentoService.deleteInstancia(c.req.param('id'));
    return c.json(success(result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MEDICAMENTOS - ALERTAS
// ==========================================

// Get statistics
calidad2.get('/medicamentos/alertas/estadisticas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await alertaMedicamentoService.getEstadisticas();
    return c.json(success(stats));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get active alerts
calidad2.get('/medicamentos/alertas/activas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const alertas = await alertaMedicamentoService.getActivas(query);
    return c.json(success(alertas));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generate all alerts manually (admin only)
calidad2.post('/medicamentos/alertas/generar', permissionMiddleware('calidad2'), async (c) => {
  try {
    const userId = c.get('userId');
    const resultado = await alertaMedicamentoService.generarTodasAlertas(userId);
    return c.json(success(resultado, 'Alertas generadas correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get all alerts with filters
calidad2.get('/medicamentos/alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await alertaMedicamentoService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Mark alert as attended
calidad2.post('/medicamentos/alertas/:id/atender', permissionMiddleware('calidad2'), async (c) => {
  try {
    const userId = c.get('userId');
    const { observaciones } = await c.req.json();
    const alerta = await alertaMedicamentoService.marcarAtendida(c.req.param('id'), userId, observaciones);
    return c.json(success(alerta, 'Alerta marcada como atendida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MEDICAMENTOS - DASHBOARD
// ==========================================

// Get comprehensive general summary
calidad2.get('/medicamentos/dashboard/resumen-general', permissionMiddleware('calidad2'), async (c) => {
  try {
    const resumen = await dashboardMedicamentosService.getResumenGeneral();
    return c.json(success(resumen, 'Resumen general obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get detailed inventory statistics
calidad2.get('/medicamentos/dashboard/inventario', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await dashboardMedicamentosService.getEstadisticasInventario();
    return c.json(success(stats, 'Estadísticas de inventario obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get farmacovigilancia statistics
calidad2.get('/medicamentos/dashboard/farmacovigilancia', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await dashboardMedicamentosService.getEstadisticasFarmacovigilancia();
    return c.json(success(stats, 'Estadísticas de farmacovigilancia obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get tecnovigilancia statistics
calidad2.get('/medicamentos/dashboard/tecnovigilancia', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await dashboardMedicamentosService.getEstadisticasTecnovigilancia();
    return c.json(success(stats, 'Estadísticas de tecnovigilancia obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get alerts statistics
calidad2.get('/medicamentos/dashboard/alertas', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await dashboardMedicamentosService.getEstadisticasAlertas();
    return c.json(success(stats, 'Estadísticas de alertas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get temperature/humidity statistics
calidad2.get('/medicamentos/dashboard/temperatura', permissionMiddleware('calidad2'), async (c) => {
  try {
    const stats = await dashboardMedicamentosService.getEstadisticasTemperatura();
    return c.json(success(stats, 'Estadísticas de temperatura obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get monthly report trends
calidad2.get('/medicamentos/dashboard/reportes-mensuales/:anio', permissionMiddleware('calidad2'), async (c) => {
  try {
    const anio = parseInt(c.req.param('anio'));
    const reportes = await dashboardMedicamentosService.getReportesMensuales(anio);
    return c.json(success(reportes, 'Reportes mensuales obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get temperature/humidity graphs for specific area
calidad2.get('/medicamentos/dashboard/graficas-temperatura/:area', permissionMiddleware('calidad2'), async (c) => {
  try {
    const area = c.req.param('area');
    const periodo = c.req.query('periodo') || 'mes';
    const graficas = await dashboardMedicamentosService.getGraficasTemperatura(area, periodo);
    return c.json(success(graficas, 'Gráficas de temperatura obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PROCESOS PRIORITARIOS - PROTOCOLOS
// ==========================================

// GET /calidad2/procesos-prioritarios/protocolos
calidad2.get('/procesos-prioritarios/protocolos', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const query = c.req.query();
    const result = await protocoloPPService.findAll(query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// GET /calidad2/procesos-prioritarios/protocolos/categoria/:categoria
calidad2.get('/procesos-prioritarios/protocolos/categoria/:categoria', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const categoria = c.req.param('categoria');
    const query = c.req.query();
    const result = await protocoloPPService.findByCategoria(categoria, query);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// GET /calidad2/procesos-prioritarios/protocolos/stats
calidad2.get('/procesos-prioritarios/protocolos/stats', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const filters = c.req.query();
    const stats = await protocoloPPService.getEstadisticas(filters);
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// GET /calidad2/procesos-prioritarios/protocolos/:id
calidad2.get('/procesos-prioritarios/protocolos/:id', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const id = c.req.param('id');
    const protocolo = await protocoloPPService.findById(id);
    return c.json(success(protocolo, 'Protocolo obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /calidad2/procesos-prioritarios/protocolos
calidad2.post('/procesos-prioritarios/protocolos', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const protocolo = await protocoloPPService.create(data, userId);
    return c.json(success(protocolo, 'Protocolo creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// PUT /calidad2/procesos-prioritarios/protocolos/:id
calidad2.put('/procesos-prioritarios/protocolos/:id', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const protocolo = await protocoloPPService.update(id, data);
    return c.json(success(protocolo, 'Protocolo actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// DELETE /calidad2/procesos-prioritarios/protocolos/:id
calidad2.delete('/procesos-prioritarios/protocolos/:id', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const id = c.req.param('id');
    const result = await protocoloPPService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /calidad2/procesos-prioritarios/protocolos/:id/aprobar
calidad2.post('/procesos-prioritarios/protocolos/:id/aprobar', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').id;
    const protocolo = await protocoloPPService.aprobar(id, userId);
    return c.json(success(protocolo, 'Protocolo aprobado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /calidad2/procesos-prioritarios/protocolos/:id/obsoleto
calidad2.post('/procesos-prioritarios/protocolos/:id/obsoleto', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').id;
    const protocolo = await protocoloPPService.marcarObsoleto(id, userId);
    return c.json(success(protocolo, 'Protocolo marcado como obsoleto'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// POST /calidad2/procesos-prioritarios/protocolos/:id/documentos
calidad2.post('/procesos-prioritarios/protocolos/:id/documentos', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('user').id;
    const body = await c.req.json();
    const file = { name: body.archivoNombre, type: body.archivoTipo, size: body.archivoTamano };
    const metadata = { nombre: body.nombre, archivoUrl: body.archivoUrl, version: body.version, esPrincipal: body.esPrincipal };
    const documento = await protocoloPPService.uploadDocumento(id, file, metadata, userId);
    return c.json(success(documento, 'Documento cargado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// DELETE /calidad2/procesos-prioritarios/protocolos/documentos/:documentoId
calidad2.delete('/procesos-prioritarios/protocolos/documentos/:documentoId', authMiddleware, permissionMiddleware('calidad2'), async (c) => {
  try {
    const documentoId = c.req.param('documentoId');
    const result = await protocoloPPService.deleteDocumento(documentoId);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// EVENTOS ADVERSOS
// ==========================================

// Get all eventos adversos with filters
calidad2.get('/procesos-prioritarios/eventos-adversos', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await eventoAdversoService.findAll(query);
    return c.json(success(result.data, 'Eventos adversos obtenidos', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get eventos adversos statistics
calidad2.get('/procesos-prioritarios/eventos-adversos/stats', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const stats = await eventoAdversoService.getEstadisticas(query);
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get eventos adversos pendientes de análisis
calidad2.get('/procesos-prioritarios/eventos-adversos/pendientes-analisis', authMiddleware, async (c) => {
  try {
    const eventos = await eventoAdversoService.getPendientesAnalisis();
    return c.json(success(eventos, 'Eventos pendientes de análisis obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get evento adverso by ID
calidad2.get('/procesos-prioritarios/eventos-adversos/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const evento = await eventoAdversoService.findById(id);
    return c.json(success(evento, 'Evento adverso obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new evento adverso
calidad2.post('/procesos-prioritarios/eventos-adversos', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const evento = await eventoAdversoService.create(data, userId);
    return c.json(success(evento, 'Evento adverso creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update evento adverso
calidad2.put('/procesos-prioritarios/eventos-adversos/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const evento = await eventoAdversoService.update(id, data);
    return c.json(success(evento, 'Evento adverso actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete evento adverso
calidad2.delete('/procesos-prioritarios/eventos-adversos/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await eventoAdversoService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Analizar evento adverso (Protocolo de Londres)
calidad2.post('/procesos-prioritarios/eventos-adversos/:id/analizar', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const analisis = await c.req.json();
    const userId = c.get('userId');
    const evento = await eventoAdversoService.analizarEvento(id, analisis, userId);
    return c.json(success(evento, 'Evento adverso analizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Cerrar evento adverso
calidad2.post('/procesos-prioritarios/eventos-adversos/:id/cerrar', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const userId = c.get('userId');
    const evento = await eventoAdversoService.cerrarEvento(id, data, userId);
    return c.json(success(evento, 'Evento adverso cerrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Upload documento to evento adverso
calidad2.post('/procesos-prioritarios/eventos-adversos/:id/documentos', authMiddleware, async (c) => {
  try {
    const eventoId = c.req.param('id');
    const data = await c.req.json();
    const userId = c.get('userId');
    const documento = await eventoAdversoService.uploadDocumento(eventoId, data.file, data.metadata, userId);
    return c.json(success(documento, 'Documento cargado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete documento from evento adverso
calidad2.delete('/procesos-prioritarios/eventos-adversos/documentos/:documentoId', authMiddleware, async (c) => {
  try {
    const documentoId = c.req.param('documentoId');
    const result = await eventoAdversoService.deleteDocumento(documentoId);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// GPC - GUÍAS DE PRÁCTICA CLÍNICA
// ==========================================

// Get all GPCs with filters
calidad2.get('/procesos-prioritarios/gpc', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await gpcService.findAll(query);
    return c.json(success(result.data, 'Guías de práctica clínica obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get GPC statistics
calidad2.get('/procesos-prioritarios/gpc/stats', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const stats = await gpcService.getEstadisticas(query);
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get GPCs by pathology
calidad2.get('/procesos-prioritarios/gpc/patologia/:patologia', authMiddleware, async (c) => {
  try {
    const patologia = c.req.param('patologia');
    const query = c.req.query();
    const result = await gpcService.findByPatologia(patologia, query);
    return c.json(success(result.data, 'Guías obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get GPC by ID
calidad2.get('/procesos-prioritarios/gpc/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const guia = await gpcService.findById(id);
    return c.json(success(guia, 'Guía obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new GPC
calidad2.post('/procesos-prioritarios/gpc', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const guia = await gpcService.create(data, userId);
    return c.json(success(guia, 'Guía creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update GPC
calidad2.put('/procesos-prioritarios/gpc/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const guia = await gpcService.update(id, data);
    return c.json(success(guia, 'Guía actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete GPC
calidad2.delete('/procesos-prioritarios/gpc/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await gpcService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Mark GPC as obsolete
calidad2.post('/procesos-prioritarios/gpc/:id/obsoleto', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const guia = await gpcService.marcarObsoleta(id, userId);
    return c.json(success(guia, 'Guía marcada como obsoleta'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Upload documento to GPC
calidad2.post('/procesos-prioritarios/gpc/:id/documentos', authMiddleware, async (c) => {
  try {
    const gpcId = c.req.param('id');
    const data = await c.req.json();
    const userId = c.get('userId');
    const documento = await gpcService.uploadDocumento(gpcId, data.file, data.metadata, userId);
    return c.json(success(documento, 'Documento cargado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete documento from GPC
calidad2.delete('/procesos-prioritarios/gpc/documentos/:documentoId', authMiddleware, async (c) => {
  try {
    const documentoId = c.req.param('documentoId');
    const result = await gpcService.deleteDocumento(documentoId);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Evaluate GPC with AGREE II
calidad2.post('/procesos-prioritarios/gpc/:id/evaluacion-agree', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const evaluacion = await c.req.json();
    const userId = c.get('userId');
    const guia = await gpcService.evaluarAGREE(id, evaluacion, userId);
    return c.json(success(guia, 'Evaluación AGREE II realizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update AGREE II evaluation
calidad2.put('/procesos-prioritarios/gpc/:id/evaluacion-agree', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const evaluacion = await c.req.json();
    const userId = c.get('userId');
    const guia = await gpcService.actualizarEvaluacionAGREE(id, evaluacion, userId);
    return c.json(success(guia, 'Evaluación AGREE II actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Register GPC screening (tamizaje)
calidad2.post('/procesos-prioritarios/gpc/:id/tamizaje', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const tamizaje = await c.req.json();
    const userId = c.get('userId');
    const guia = await gpcService.registrarTamizaje(id, tamizaje, userId);
    return c.json(success(guia, 'Tamizaje registrado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get bibliografia for GPC
calidad2.get('/procesos-prioritarios/gpc/:id/bibliografia', authMiddleware, async (c) => {
  try {
    const gpcId = c.req.param('id');
    const bibliografia = await gpcService.getBibliografia(gpcId);
    return c.json(success(bibliografia, 'Bibliografía obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Add bibliografia to GPC
calidad2.post('/procesos-prioritarios/gpc/:id/bibliografia', authMiddleware, async (c) => {
  try {
    const gpcId = c.req.param('id');
    const data = await c.req.json();
    const bibliografia = await gpcService.addBibliografia(gpcId, data);
    return c.json(success(bibliografia, 'Bibliografía agregada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update bibliografia
calidad2.put('/procesos-prioritarios/gpc/bibliografia/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const bibliografia = await gpcService.updateBibliografia(id, data);
    return c.json(success(bibliografia, 'Bibliografía actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete bibliografia
calidad2.delete('/procesos-prioritarios/gpc/bibliografia/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await gpcService.deleteBibliografia(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get adherence evaluations for GPC
calidad2.get('/procesos-prioritarios/gpc/:id/adherencia', authMiddleware, async (c) => {
  try {
    const gpcId = c.req.param('id');
    const evaluaciones = await gpcService.getEvaluacionesAdherencia(gpcId);
    return c.json(success(evaluaciones, 'Evaluaciones de adherencia obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create adherence evaluation
calidad2.post('/procesos-prioritarios/gpc/:id/adherencia', authMiddleware, async (c) => {
  try {
    const gpcId = c.req.param('id');
    const data = await c.req.json();
    const userId = c.get('userId');
    const evaluacion = await gpcService.createEvaluacionAdherencia(gpcId, data, userId);
    return c.json(success(evaluacion, 'Evaluación de adherencia creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// COMITÉS
// ==========================================

// Get all comités with filters
calidad2.get('/procesos-prioritarios/comites', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await comiteService.findAll(query);
    return c.json(success(result.data, 'Comités obtenidos', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get comités statistics
calidad2.get('/procesos-prioritarios/comites/stats', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const stats = await comiteService.getEstadisticas(query);
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get comité by ID
calidad2.get('/procesos-prioritarios/comites/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const comite = await comiteService.findById(id);
    return c.json(success(comite, 'Comité obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new comité
calidad2.post('/procesos-prioritarios/comites', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const comite = await comiteService.create(data, userId);
    return c.json(success(comite, 'Comité creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update comité
calidad2.put('/procesos-prioritarios/comites/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const comite = await comiteService.update(id, data);
    return c.json(success(comite, 'Comité actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete comité
calidad2.delete('/procesos-prioritarios/comites/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await comiteService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get miembros of comité
calidad2.get('/procesos-prioritarios/comites/:id/miembros', authMiddleware, async (c) => {
  try {
    const comiteId = c.req.param('id');
    const miembros = await comiteService.getMiembros(comiteId);
    return c.json(success(miembros, 'Miembros obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Add miembro to comité
calidad2.post('/procesos-prioritarios/comites/:id/miembros', authMiddleware, async (c) => {
  try {
    const comiteId = c.req.param('id');
    const data = await c.req.json();
    const miembro = await comiteService.addMiembro(comiteId, data);
    return c.json(success(miembro, 'Miembro agregado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Remove miembro from comité
calidad2.delete('/procesos-prioritarios/comites/:id/miembros/:miembroId', authMiddleware, async (c) => {
  try {
    const comiteId = c.req.param('id');
    const miembroId = c.req.param('miembroId');
    const result = await comiteService.removeMiembro(comiteId, miembroId);
    return c.json(success(result, 'Miembro removido exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get cronograma of comité
calidad2.get('/procesos-prioritarios/comites/:id/cronograma', authMiddleware, async (c) => {
  try {
    const comiteId = c.req.param('id');
    const { anio } = c.req.query();
    const cronograma = await comiteService.getCronograma(comiteId, anio || new Date().getFullYear());
    return c.json(success(cronograma, 'Cronograma obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create cronograma entry
calidad2.post('/procesos-prioritarios/comites/:id/cronograma', authMiddleware, async (c) => {
  try {
    const comiteId = c.req.param('id');
    const data = await c.req.json();
    const cronograma = await comiteService.createCronograma(comiteId, data);
    return c.json(success(cronograma, 'Cronograma creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update cronograma entry
calidad2.put('/procesos-prioritarios/comites/cronograma/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const cronograma = await comiteService.updateCronograma(id, data);
    return c.json(success(cronograma, 'Cronograma actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ACTAS DE COMITÉ
// ==========================================

// Get all actas with filters
calidad2.get('/procesos-prioritarios/actas', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await actaPPService.findAll(query);
    return c.json(success(result.data, 'Actas obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get actas by comité
calidad2.get('/procesos-prioritarios/actas/comite/:comiteId', authMiddleware, async (c) => {
  try {
    const comiteId = c.req.param('comiteId');
    const query = c.req.query();
    const result = await actaPPService.findByComite(comiteId, query);
    return c.json(success(result.data, 'Actas del comité obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get acta by ID
calidad2.get('/procesos-prioritarios/actas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const acta = await actaPPService.findById(id);
    return c.json(success(acta, 'Acta obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new acta
calidad2.post('/procesos-prioritarios/actas', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const acta = await actaPPService.create(data, userId);
    return c.json(success(acta, 'Acta creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update acta
calidad2.put('/procesos-prioritarios/actas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const acta = await actaPPService.update(id, data);
    return c.json(success(acta, 'Acta actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete acta
calidad2.delete('/procesos-prioritarios/actas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await actaPPService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Approve acta
calidad2.post('/procesos-prioritarios/actas/:id/aprobar', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const acta = await actaPPService.aprobar(id);
    return c.json(success(acta, 'Acta aprobada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Add asistente to acta
calidad2.post('/procesos-prioritarios/actas/:id/asistentes', authMiddleware, async (c) => {
  try {
    const actaId = c.req.param('id');
    const data = await c.req.json();
    const asistente = await actaPPService.addAsistente(actaId, data);
    return c.json(success(asistente, 'Asistente agregado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update asistente
calidad2.put('/procesos-prioritarios/actas/asistentes/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const asistente = await actaPPService.updateAsistente(id, data);
    return c.json(success(asistente, 'Asistencia actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Upload anexo to acta
calidad2.post('/procesos-prioritarios/actas/:id/anexos', authMiddleware, async (c) => {
  try {
    const actaId = c.req.param('id');
    const data = await c.req.json();
    const userId = c.get('userId');
    const anexo = await actaPPService.uploadAnexo(actaId, data.file, data.metadata, userId);
    return c.json(success(anexo, 'Anexo cargado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete anexo from acta
calidad2.delete('/procesos-prioritarios/actas/anexos/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await actaPPService.deleteAnexo(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ENCUESTAS DE SATISFACCIÓN
// ==========================================

// Get all encuestas with filters
calidad2.get('/procesos-prioritarios/encuestas', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await encuestaService.findAll(query);
    return c.json(success(result.data, 'Encuestas obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get encuesta by ID
calidad2.get('/procesos-prioritarios/encuestas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const encuesta = await encuestaService.findById(id);
    return c.json(success(encuesta, 'Encuesta obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new encuesta
calidad2.post('/procesos-prioritarios/encuestas', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const encuesta = await encuestaService.create(data, userId);
    return c.json(success(encuesta, 'Encuesta registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update encuesta
calidad2.put('/procesos-prioritarios/encuestas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const encuesta = await encuestaService.update(id, data);
    return c.json(success(encuesta, 'Encuesta actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete encuesta
calidad2.delete('/procesos-prioritarios/encuestas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await encuestaService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get encuestas statistics
calidad2.get('/procesos-prioritarios/encuestas/stats/general', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const stats = await encuestaService.getEstadisticas(filters);
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// PQRSF
// ==========================================

// Get all PQRSF with filters
calidad2.get('/procesos-prioritarios/pqrsf', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await pqrsfService.findAll(query);
    return c.json(success(result.data, 'PQRSF obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get PQRSF by ID
calidad2.get('/procesos-prioritarios/pqrsf/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const pqrsf = await pqrsfService.findById(id);
    return c.json(success(pqrsf, 'PQRSF obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new PQRSF
calidad2.post('/procesos-prioritarios/pqrsf', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const pqrsf = await pqrsfService.create(data, userId);
    return c.json(success(pqrsf, 'PQRSF radicada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update PQRSF
calidad2.put('/procesos-prioritarios/pqrsf/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const pqrsf = await pqrsfService.update(id, data);
    return c.json(success(pqrsf, 'PQRSF actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete PQRSF
calidad2.delete('/procesos-prioritarios/pqrsf/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await pqrsfService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Responder PQRSF
calidad2.post('/procesos-prioritarios/pqrsf/:id/responder', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const respuesta = await c.req.json();
    const userId = c.get('userId');
    const pqrsf = await pqrsfService.responder(id, respuesta, userId);
    return c.json(success(pqrsf, 'PQRSF respondida exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get PQRSF vencidas
calidad2.get('/procesos-prioritarios/pqrsf/stats/vencidas', authMiddleware, async (c) => {
  try {
    const vencidas = await pqrsfService.getVencidas();
    return c.json(success(vencidas, 'PQRSF vencidas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get PQRSF statistics
calidad2.get('/procesos-prioritarios/pqrsf/stats/general', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const stats = await pqrsfService.getEstadisticas(filters);
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// INDICADORES
// ==========================================

// Get all indicadores with filters
calidad2.get('/procesos-prioritarios/indicadores', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await indicadorService.findAll(query);
    return c.json(success(result.data, 'Indicadores obtenidos', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get indicador by ID
calidad2.get('/procesos-prioritarios/indicadores/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const indicador = await indicadorService.findById(id);
    return c.json(success(indicador, 'Indicador obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Create new indicador
calidad2.post('/procesos-prioritarios/indicadores', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('userId');
    const indicador = await indicadorService.create(data, userId);
    return c.json(success(indicador, 'Indicador creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Update indicador
calidad2.put('/procesos-prioritarios/indicadores/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const indicador = await indicadorService.update(id, data);
    return c.json(success(indicador, 'Indicador actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Delete indicador
calidad2.delete('/procesos-prioritarios/indicadores/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const result = await indicadorService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Register medición for indicador
calidad2.post('/procesos-prioritarios/indicadores/:id/mediciones', authMiddleware, async (c) => {
  try {
    const indicadorId = c.req.param('id');
    const medicion = await c.req.json();
    const userId = c.get('userId');
    const nueva = await indicadorService.registrarMedicion(indicadorId, medicion, userId);
    return c.json(success(nueva, 'Medición registrada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get mediciones for indicador
calidad2.get('/procesos-prioritarios/indicadores/:id/mediciones', authMiddleware, async (c) => {
  try {
    const indicadorId = c.req.param('id');
    const mediciones = await indicadorService.getMediciones(indicadorId);
    return c.json(success(mediciones, 'Mediciones obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get indicadores dashboard
calidad2.get('/procesos-prioritarios/indicadores/stats/dashboard', authMiddleware, async (c) => {
  try {
    const dashboard = await indicadorService.getDashboard();
    return c.json(success(dashboard, 'Dashboard obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// ALERTAS
// ==========================================

// Get all alertas with filters
calidad2.get('/procesos-prioritarios/alertas', authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const result = await alertaPPService.findAll(query);
    return c.json(success(result.data, 'Alertas obtenidas', result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get alertas activas (no atendidas)
calidad2.get('/procesos-prioritarios/alertas/activas', authMiddleware, async (c) => {
  try {
    const alertas = await alertaPPService.findActivas();
    return c.json(success(alertas, 'Alertas activas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Atender alerta
calidad2.post('/procesos-prioritarios/alertas/:id/atender', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { observaciones } = await c.req.json();
    const userId = c.get('userId');
    const alerta = await alertaPPService.atenderAlerta(id, observaciones, userId);
    return c.json(success(alerta, 'Alerta atendida exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generar todas las alertas (manual trigger)
calidad2.post('/procesos-prioritarios/alertas/generar', authMiddleware, async (c) => {
  try {
    const result = await alertaPPService.generarTodasAlertas();
    return c.json(success(result, `${result.generadas} alertas generadas`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get alertas statistics
calidad2.get('/procesos-prioritarios/alertas/stats/general', authMiddleware, async (c) => {
  try {
    const stats = await alertaPPService.getEstadisticas();
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// DASHBOARD PROCESOS PRIORITARIOS
// ==========================================

// Get resumen general
calidad2.get('/procesos-prioritarios/dashboard/resumen', authMiddleware, async (c) => {
  try {
    const resumen = await dashboardPPService.getResumenGeneral();
    return c.json(success(resumen, 'Resumen general obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get estadísticas con filtros
calidad2.get('/procesos-prioritarios/dashboard/estadisticas', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const estadisticas = await dashboardPPService.getEstadisticas(filters);
    return c.json(success(estadisticas, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get gráficas (time-series data)
calidad2.get('/procesos-prioritarios/dashboard/graficas', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const graficas = await dashboardPPService.getGraficas(filters);
    return c.json(success(graficas, 'Datos de gráficas obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// HISTORIA CLÍNICA - DOCUMENTOS NORMATIVOS
// ==========================================

// Get estadísticas de documentos (DEBE IR PRIMERO - antes del /:id)
calidad2.get('/historia-clinica/documentos/stats', authMiddleware, async (c) => {
  try {
    const stats = await documentoHCService.getStats();
    return c.json(success(stats, 'Estadísticas de documentos obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get todos los documentos con filtros
calidad2.get('/historia-clinica/documentos', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const result = await documentoHCService.getAll(filters);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get versiones de un documento (DEBE IR ANTES DEL /:id genérico)
calidad2.get('/historia-clinica/documentos/:id/versiones', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const versiones = await documentoHCService.getVersiones(id);
    return c.json(success(versiones, 'Versiones obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Get documento por ID
calidad2.get('/historia-clinica/documentos/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const documento = await documentoHCService.getById(id);
    return c.json(success(documento, 'Documento obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear documento
calidad2.post('/historia-clinica/documentos', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const documento = await documentoHCService.create(data);
    return c.json(success(documento, 'Documento creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar documento
calidad2.put('/historia-clinica/documentos/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const documento = await documentoHCService.update(id, data);
    return c.json(success(documento, 'Documento actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar documento (soft delete)
calidad2.delete('/historia-clinica/documentos/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await documentoHCService.delete(id);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Aprobar documento (revisar o aprobar)
calidad2.post('/historia-clinica/documentos/:id/aprobar', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const { aprobadoPor, tipo } = await c.req.json(); // tipo: 'revisar' o 'aprobar'
    const documento = await documentoHCService.aprobar(id, aprobadoPor, tipo);
    return c.json(success(documento, `Documento ${tipo === 'revisar' ? 'revisado' : 'aprobado'} exitosamente`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Distribuir documento a usuarios
calidad2.post('/historia-clinica/documentos/:id/distribuir', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const { usuariosIds } = await c.req.json();
    const result = await documentoHCService.distribuir(id, usuariosIds);
    return c.json(success(result, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nueva versión de documento
calidad2.post('/historia-clinica/documentos/:id/versiones', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const versionData = await c.req.json();
    const version = await documentoHCService.crearVersion(id, versionData);
    return c.json(success(version, 'Nueva versión creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Confirmar lectura de documento distribuido
calidad2.post('/historia-clinica/documentos/:id/confirmar-lectura', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const { usuarioId } = await c.req.json();
    const result = await documentoHCService.confirmarLectura(id, usuarioId);
    return c.json(success(result, 'Lectura confirmada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CERTIFICACIONES HC - Control de Vigencias
// ==========================================

// Obtener estadísticas de certificaciones
calidad2.get('/historia-clinica/certificaciones/stats', authMiddleware, async (c) => {
  try {
    const stats = await certificacionHCService.getStats();
    return c.json(success(stats, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener certificaciones próximas a vencer
calidad2.get('/historia-clinica/certificaciones/vencimientos', authMiddleware, async (c) => {
  try {
    const { dias } = c.req.query();
    const diasAnticipacion = dias ? parseInt(dias) : 60;
    const vencimientos = await certificacionHCService.getVencimientos(diasAnticipacion);
    return c.json(success(vencimientos, `Certificaciones próximas a vencer en ${diasAnticipacion} días`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Verificar y generar alertas de vencimiento (trigger manual)
calidad2.post('/historia-clinica/certificaciones/check-alerts', authMiddleware, async (c) => {
  try {
    const result = await certificacionHCService.checkAndGenerateAlerts();
    return c.json(success(result, 'Alertas generadas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Listar todas las certificaciones con filtros
calidad2.get('/historia-clinica/certificaciones', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const result = await certificacionHCService.getAll(filters);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener certificación por ID
calidad2.get('/historia-clinica/certificaciones/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const certificacion = await certificacionHCService.getById(id);
    return c.json(success(certificacion, 'Certificación obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nueva certificación
calidad2.post('/historia-clinica/certificaciones', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const certificacion = await certificacionHCService.create(data);
    return c.json(success(certificacion, 'Certificación creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar certificación
calidad2.put('/historia-clinica/certificaciones/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const certificacion = await certificacionHCService.update(id, data);
    return c.json(success(certificacion, 'Certificación actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar certificación (soft delete)
calidad2.delete('/historia-clinica/certificaciones/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await certificacionHCService.delete(id);
    return c.json(success(result, 'Certificación eliminada correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// CONSENTIMIENTOS INFORMADOS HC
// ==========================================

// TIPOS DE CONSENTIMIENTO (Plantillas)

// Obtener estadísticas de tipos
calidad2.get('/historia-clinica/consentimientos/tipos/stats', authMiddleware, async (c) => {
  try {
    const stats = await consentimientoHCService.getStatsTipos();
    return c.json(success(stats, 'Estadísticas de tipos obtenidas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener tipos por servicio
calidad2.get('/historia-clinica/consentimientos/tipos/servicio/:servicio', authMiddleware, async (c) => {
  try {
    const { servicio } = c.req.param();
    const tipos = await consentimientoHCService.getTiposByServicio(servicio);
    return c.json(success(tipos, `Tipos de consentimiento para ${servicio}`));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener tipo por código
calidad2.get('/historia-clinica/consentimientos/tipos/codigo/:codigo', authMiddleware, async (c) => {
  try {
    const { codigo } = c.req.param();
    const tipo = await consentimientoHCService.getTipoByCodigo(codigo);
    return c.json(success(tipo, 'Tipo de consentimiento obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Listar todos los tipos con filtros
calidad2.get('/historia-clinica/consentimientos/tipos', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const result = await consentimientoHCService.getAllTipos(filters);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener tipo por ID
calidad2.get('/historia-clinica/consentimientos/tipos/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const tipo = await consentimientoHCService.getTipoById(id);
    return c.json(success(tipo, 'Tipo de consentimiento obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nuevo tipo
calidad2.post('/historia-clinica/consentimientos/tipos', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const tipo = await consentimientoHCService.createTipo(data);
    return c.json(success(tipo, 'Tipo de consentimiento creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar tipo
calidad2.put('/historia-clinica/consentimientos/tipos/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const tipo = await consentimientoHCService.updateTipo(id, data);
    return c.json(success(tipo, 'Tipo de consentimiento actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar tipo (soft delete)
calidad2.delete('/historia-clinica/consentimientos/tipos/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await consentimientoHCService.deleteTipo(id);
    return c.json(success(result, 'Tipo de consentimiento eliminado correctamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// CONSENTIMIENTOS APLICADOS

// Obtener estadísticas de aplicados
calidad2.get('/historia-clinica/consentimientos/aplicados/stats', authMiddleware, async (c) => {
  try {
    const stats = await consentimientoHCService.getStatsAplicados();
    return c.json(success(stats, 'Estadísticas de consentimientos aplicados'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener consentimientos de un paciente
calidad2.get('/historia-clinica/consentimientos/aplicados/paciente/:pacienteId', authMiddleware, async (c) => {
  try {
    const { pacienteId } = c.req.param();
    const consentimientos = await consentimientoHCService.getByPaciente(pacienteId);
    return c.json(success(consentimientos, 'Consentimientos del paciente obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Aplicar consentimiento a paciente
calidad2.post('/historia-clinica/consentimientos/aplicar', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const aplicado = await consentimientoHCService.aplicar(data);
    return c.json(success(aplicado, 'Consentimiento aplicado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Listar todos los consentimientos aplicados con filtros
calidad2.get('/historia-clinica/consentimientos/aplicados', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const result = await consentimientoHCService.getAllAplicados(filters);
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener consentimiento aplicado por ID
calidad2.get('/historia-clinica/consentimientos/aplicados/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const aplicado = await consentimientoHCService.getAplicadoById(id);
    return c.json(success(aplicado, 'Consentimiento aplicado obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Registrar/actualizar firma
calidad2.post('/historia-clinica/consentimientos/aplicados/:id/firma', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const { tipoFirma, firmaBase64 } = await c.req.json();
    const aplicado = await consentimientoHCService.registrarFirma(id, tipoFirma, firmaBase64);
    return c.json(success(aplicado, 'Firma registrada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generar PDF del consentimiento aplicado
calidad2.post('/historia-clinica/consentimientos/aplicados/:id/pdf', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await consentimientoHCService.generarPDF(id);
    return c.json(success(result.data, result.message));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// AUDITORÍAS HC - Historia Clínica
// ==========================================

// Listar auditorías con filtros
calidad2.get('/historia-clinica/auditorias', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const result = await auditoriaHCService.getAll(filters);
    return c.json(paginated(result.auditorias, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener una auditoría por ID
calidad2.get('/historia-clinica/auditorias/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const auditoria = await auditoriaHCService.getById(id);
    return c.json(success(auditoria, 'Auditoría obtenida exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nueva auditoría
calidad2.post('/historia-clinica/auditorias', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const auditoria = await auditoriaHCService.create(data);
    return c.json(success(auditoria, 'Auditoría creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar auditoría
calidad2.put('/historia-clinica/auditorias/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const auditoria = await auditoriaHCService.update(id, data);
    return c.json(success(auditoria, 'Auditoría actualizada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar auditoría
calidad2.delete('/historia-clinica/auditorias/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await auditoriaHCService.delete(id);
    return c.json(success(result, 'Auditoría eliminada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Cerrar auditoría
calidad2.post('/historia-clinica/auditorias/:id/cerrar', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const auditoria = await auditoriaHCService.cerrarAuditoria(id, data);
    return c.json(success(auditoria, 'Auditoría cerrada exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener estadísticas de auditorías
calidad2.get('/historia-clinica/auditorias/stats', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const stats = await auditoriaHCService.getStats(filters);
    return c.json(success(stats, 'Estadísticas obtenidas exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// HALLAZGOS HC - Historia Clínica
// ==========================================

// Crear hallazgo en una auditoría
calidad2.post('/historia-clinica/auditorias/:auditoriaId/hallazgos', authMiddleware, async (c) => {
  try {
    const { auditoriaId } = c.req.param();
    const data = await c.req.json();
    const hallazgo = await auditoriaHCService.createHallazgo(auditoriaId, data);
    return c.json(success(hallazgo, 'Hallazgo creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Listar hallazgos de una auditoría
calidad2.get('/historia-clinica/auditorias/:auditoriaId/hallazgos', authMiddleware, async (c) => {
  try {
    const { auditoriaId } = c.req.param();
    const filters = c.req.query();
    const hallazgos = await auditoriaHCService.getHallazgosByAuditoria(auditoriaId, filters);
    return c.json(success(hallazgos, 'Hallazgos obtenidos exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar hallazgo
calidad2.put('/historia-clinica/auditorias/hallazgos/:hallazgoId', authMiddleware, async (c) => {
  try {
    const { hallazgoId } = c.req.param();
    const data = await c.req.json();
    const hallazgo = await auditoriaHCService.updateHallazgo(hallazgoId, data);
    return c.json(success(hallazgo, 'Hallazgo actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// INDICADORES HC - Historia Clínica
// ==========================================

// Listar indicadores con filtros
calidad2.get('/historia-clinica/indicadores', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const result = await indicadorHCService.getAll(filters);
    return c.json(paginated(result.indicadores, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Obtener un indicador por ID
calidad2.get('/historia-clinica/indicadores/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const indicador = await indicadorHCService.getById(id);
    return c.json(success(indicador, 'Indicador obtenido exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Crear nuevo indicador
calidad2.post('/historia-clinica/indicadores', authMiddleware, async (c) => {
  try {
    const data = await c.req.json();
    const indicador = await indicadorHCService.create(data);
    return c.json(success(indicador, 'Indicador creado exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Actualizar indicador
calidad2.put('/historia-clinica/indicadores/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const indicador = await indicadorHCService.update(id, data);
    return c.json(success(indicador, 'Indicador actualizado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eliminar indicador
calidad2.delete('/historia-clinica/indicadores/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await indicadorHCService.delete(id);
    return c.json(success(result, 'Indicador eliminado exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// MEDICIONES DE INDICADORES HC
// ==========================================

// Crear medición de indicador
calidad2.post('/historia-clinica/indicadores/:indicadorId/mediciones', authMiddleware, async (c) => {
  try {
    const { indicadorId } = c.req.param();
    const data = await c.req.json();
    const medicion = await indicadorHCService.createMedicion(indicadorId, data);
    return c.json(success(medicion, 'Medición creada exitosamente'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Listar mediciones de un indicador
calidad2.get('/historia-clinica/indicadores/:indicadorId/mediciones', authMiddleware, async (c) => {
  try {
    const { indicadorId } = c.req.param();
    const filters = c.req.query();
    const result = await indicadorHCService.getMedicionesByIndicador(indicadorId, filters);
    return c.json(paginated(result.mediciones, result.pagination));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Dashboard de indicadores
calidad2.get('/historia-clinica/indicadores/dashboard', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const dashboard = await indicadorHCService.getDashboard(filters);
    return c.json(success(dashboard, 'Dashboard obtenido exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ==========================================
// HISTORIA CLÍNICA - DASHBOARD GENERAL
// ==========================================

// Resumen general del dashboard (incluye todos los módulos)
calidad2.get('/historia-clinica/dashboard/resumen', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const resumen = await dashboardHCService.getResumen(filters);
    return c.json(success(resumen, 'Resumen obtenido exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Tendencias de indicadores para gráficas
calidad2.get('/historia-clinica/dashboard/tendencias-indicadores', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const tendencias = await dashboardHCService.getTendenciasIndicadores(filters);
    return c.json(success(tendencias, 'Tendencias obtenidas exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Timeline de auditorías por mes
calidad2.get('/historia-clinica/dashboard/timeline-auditorias', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const timeline = await dashboardHCService.getTimelineAuditorias(filters);
    return c.json(success(timeline, 'Timeline obtenido exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Distribución de consentimientos por servicio
calidad2.get('/historia-clinica/dashboard/distribucion-consentimientos', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const distribucion = await dashboardHCService.getDistribucionConsentimientos(filters);
    return c.json(success(distribucion, 'Distribución obtenida exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Top hallazgos recurrentes
calidad2.get('/historia-clinica/dashboard/top-hallazgos', authMiddleware, async (c) => {
  try {
    const filters = c.req.query();
    const topHallazgos = await dashboardHCService.getTopHallazgos(filters);
    return c.json(success(topHallazgos, 'Top hallazgos obtenidos exitosamente'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = calidad2;
