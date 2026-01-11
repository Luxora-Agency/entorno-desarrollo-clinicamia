/**
 * Rutas del Módulo de Talento Humano
 */
const { Hono } = require('hono');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const {
  vacanteService,
  candidatoService,
  empleadoService,
  contratoService,
  nominaService,
  asistenciaService,
  evaluacionService,
  capacitacionService,
  bienestarService,
  talentoHumanoAIService
} = require('../services/talento-humano');
const prisma = require('../db/prisma');

const router = new Hono();

// Aplicar middleware de auth a todas las rutas
router.use('*', authMiddleware);
router.use('*', permissionMiddleware('talento-humano'));

// ============================================
// DASHBOARD / STATS
// ============================================

router.get('/dashboard/stats', async (c) => {
  try {
    const [empleados, vacantes, nomina, evaluaciones] = await Promise.all([
      empleadoService.getStats(),
      vacanteService.getStats(),
      nominaService.listPeriodos({ limit: 1 }),
      evaluacionService.getStats()
    ]);

    return c.json(success({
      empleados,
      vacantes,
      ultimosPeriodosNomina: nomina.data,
      evaluaciones
    }, 'Estadísticas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============================================
// CARGOS
// ============================================

router.get('/cargos', async (c) => {
  try {
    const cargos = await prisma.th_cargos.findMany({
      where: { activo: true },
      orderBy: [{ nivel: 'asc' }, { nombre: 'asc' }]
    });
    return c.json(success(cargos, 'Cargos obtenidos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/cargos', async (c) => {
  try {
    const data = await c.req.json();
    const cargo = await prisma.th_cargos.create({ data });
    return c.json(success(cargo, 'Cargo creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.put('/cargos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const cargo = await prisma.th_cargos.update({ where: { id }, data });
    return c.json(success(cargo, 'Cargo actualizado'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.get('/cargos/organigrama', async (c) => {
  try {
    const organigrama = await empleadoService.getOrganigrama();
    return c.json(success(organigrama, 'Organigrama obtenido'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============================================
// VACANTES
// ============================================

router.get('/vacantes', async (c) => {
  try {
    const query = c.req.query();
    const result = await vacanteService.list({
      estado: query.estado,
      departamentoId: query.departamentoId,
      cargoId: query.cargoId,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/vacantes/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const vacante = await vacanteService.getById(id);
    return c.json(success(vacante, 'Vacante obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/vacantes', async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const vacante = await vacanteService.create(data, userId);
    return c.json(success(vacante, 'Vacante creada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.put('/vacantes/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const vacante = await vacanteService.update(id, data);
    return c.json(success(vacante, 'Vacante actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.delete('/vacantes/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await vacanteService.delete(id);
    return c.json(success(null, 'Vacante eliminada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.patch('/vacantes/:id/estado', async (c) => {
  try {
    const { id } = c.req.param();
    const { estado } = await c.req.json();
    const vacante = await vacanteService.changeStatus(id, estado);
    return c.json(success(vacante, 'Estado actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// ============================================
// CANDIDATOS
// ============================================

router.get('/candidatos', async (c) => {
  try {
    const query = c.req.query();
    const result = await candidatoService.list({
      vacanteId: query.vacanteId,
      estado: query.estado,
      search: query.search,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/candidatos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const candidato = await candidatoService.getById(id);
    return c.json(success(candidato, 'Candidato obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/candidatos', async (c) => {
  try {
    const data = await c.req.json();
    const candidato = await candidatoService.create(data);
    return c.json(success(candidato, 'Candidato creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.put('/candidatos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const candidato = await candidatoService.update(id, data);
    return c.json(success(candidato, 'Candidato actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.delete('/candidatos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    await candidatoService.delete(id);
    return c.json(success(null, 'Candidato eliminado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/candidatos/:id/aplicar', async (c) => {
  try {
    const { id } = c.req.param();
    const { vacanteId } = await c.req.json();
    const userId = c.get('user').id;
    const aplicacion = await candidatoService.applyToVacante(id, vacanteId, userId);
    return c.json(success(aplicacion, 'Aplicación registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.patch('/candidatos/:candidatoId/vacantes/:vacanteId/estado', async (c) => {
  try {
    const { candidatoId, vacanteId } = c.req.param();
    const { estado, ...data } = await c.req.json();
    const result = await candidatoService.updateStatus(candidatoId, vacanteId, estado, data);
    return c.json(success(result, 'Estado actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/vacantes/:id/pipeline', async (c) => {
  try {
    const { id } = c.req.param();
    const pipeline = await candidatoService.getByVacante(id);
    return c.json(success(pipeline, 'Pipeline obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/candidatos/:id/contratar', async (c) => {
  try {
    const { id } = c.req.param();
    const { vacanteId, ...empleadoData } = await c.req.json();
    const empleado = await candidatoService.convertToEmpleado(id, vacanteId, empleadoData);
    return c.json(success(empleado, 'Empleado creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// ============================================
// ENTREVISTAS
// ============================================

router.get('/entrevistas', async (c) => {
  try {
    const query = c.req.query();
    const entrevistas = await prisma.th_entrevistas.findMany({
      where: {
        ...(query.candidatoId && { candidatoId: query.candidatoId }),
        ...(query.estado && { estado: query.estado })
      },
      include: {
        candidato: true,
        entrevistador: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { fechaProgramada: 'desc' }
    });
    return c.json(success(entrevistas, 'Entrevistas obtenidas'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/entrevistas', async (c) => {
  try {
    const data = await c.req.json();
    const entrevista = await prisma.th_entrevistas.create({
      data,
      include: { candidato: true, entrevistador: { select: { id: true, nombre: true, apellido: true } } }
    });
    return c.json(success(entrevista, 'Entrevista programada'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.patch('/entrevistas/:id/completar', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const entrevista = await prisma.th_entrevistas.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        respuestas: data.respuestas,
        evaluacion: data.evaluacion,
        observaciones: data.observaciones,
        recomendacion: data.recomendacion
      }
    });
    return c.json(success(entrevista, 'Entrevista completada'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// ============================================
// EMPLEADOS
// ============================================

router.get('/empleados', async (c) => {
  try {
    const query = c.req.query();
    const result = await empleadoService.list({
      estado: query.estado,
      departamentoId: query.departamentoId,
      cargoId: query.cargoId,
      tipoEmpleado: query.tipoEmpleado,
      search: query.search,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/empleados/search', async (c) => {
  try {
    const { q } = c.req.query();
    const empleados = await empleadoService.search(q || '');
    return c.json(success(empleados, 'Búsqueda completada'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/empleados/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const empleado = await empleadoService.getById(id);
    return c.json(success(empleado, 'Empleado obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.get('/empleados/:id/expediente', async (c) => {
  try {
    const { id } = c.req.param();
    const expediente = await empleadoService.getExpediente(id);
    return c.json(success(expediente, 'Expediente obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/empleados', async (c) => {
  try {
    const data = await c.req.json();
    const empleado = await empleadoService.create(data);
    return c.json(success(empleado, 'Empleado creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.put('/empleados/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const empleado = await empleadoService.update(id, data);
    return c.json(success(empleado, 'Empleado actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.patch('/empleados/:id/estado', async (c) => {
  try {
    const { id } = c.req.param();
    const { estado, motivo } = await c.req.json();
    const empleado = await empleadoService.changeStatus(id, estado, motivo);
    return c.json(success(empleado, 'Estado actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/empleados/:id/vincular-usuario', async (c) => {
  try {
    const { id } = c.req.param();
    const { usuarioId } = await c.req.json();
    const empleado = await empleadoService.linkToUser(id, usuarioId);
    return c.json(success(empleado, 'Usuario vinculado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// ============================================
// CONTRATOS
// ============================================

router.get('/contratos', async (c) => {
  try {
    const query = c.req.query();
    const result = await contratoService.list({
      empleadoId: query.empleadoId,
      estado: query.estado,
      tipoContrato: query.tipoContrato,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/contratos/proximos-vencer', async (c) => {
  try {
    const { dias } = c.req.query();
    const contratos = await contratoService.getExpiringContracts(parseInt(dias) || 30);
    return c.json(success(contratos, 'Contratos próximos a vencer'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/contratos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const contrato = await contratoService.getById(id);
    return c.json(success(contrato, 'Contrato obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/contratos', async (c) => {
  try {
    const data = await c.req.json();
    const contrato = await contratoService.create(data);
    return c.json(success(contrato, 'Contrato creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/contratos/:id/terminar', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const contrato = await contratoService.terminate(id, data);
    return c.json(success(contrato, 'Contrato terminado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/contratos/:id/renovar', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const contrato = await contratoService.renew(id, data);
    return c.json(success(contrato, 'Contrato renovado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/empleados/:empleadoId/liquidacion', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const liquidacion = await contratoService.calculateLiquidation(empleadoId);
    return c.json(success(liquidacion, 'Liquidación calculada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ============================================
// NÓMINA
// ============================================

router.get('/nomina/periodos', async (c) => {
  try {
    const query = c.req.query();
    const result = await nominaService.listPeriodos({
      anio: query.anio ? parseInt(query.anio) : undefined,
      estado: query.estado,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 12
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/nomina/periodos', async (c) => {
  try {
    const data = await c.req.json();
    const periodo = await nominaService.createPeriodo(data);
    return c.json(success(periodo, 'Periodo creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/nomina/periodos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const periodo = await nominaService.getPeriodo(id);
    return c.json(success(periodo, 'Periodo obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/nomina/periodos/:id/procesar', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const periodo = await nominaService.procesarNomina(id, userId);
    return c.json(success(periodo, 'Nómina procesada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/nomina/periodos/:id/cerrar', async (c) => {
  try {
    const { id } = c.req.param();
    const periodo = await nominaService.cerrarPeriodo(id);
    return c.json(success(periodo, 'Periodo cerrado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// Contabilizar nómina en Siigo
router.post('/nomina/periodos/:id/contabilizar-siigo', async (c) => {
  try {
    const { id } = c.req.param();
    const payrollSiigoService = require('../services/siigo/payroll.siigo.service');
    const result = await payrollSiigoService.contabilizarNomina(id);
    return c.json(success(result, 'Nómina contabilizada en Siigo'));
  } catch (err) {
    console.error('Error contabilizando nómina en Siigo:', err);
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.get('/nomina/periodos/:id/resumen', async (c) => {
  try {
    const { id } = c.req.param();
    const resumen = await nominaService.getResumenPeriodo(id);
    return c.json(success(resumen, 'Resumen obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.get('/nomina/colilla/:empleadoId/:periodoId', async (c) => {
  try {
    const { empleadoId, periodoId } = c.req.param();
    const colilla = await nominaService.getColilla(empleadoId, periodoId);
    return c.json(success(colilla, 'Colilla obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.get('/nomina/novedades', async (c) => {
  try {
    const query = c.req.query();
    const result = await nominaService.listNovedades({
      empleadoId: query.empleadoId,
      periodoId: query.periodoId,
      tipo: query.tipo,
      estado: query.estado,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/nomina/novedades', async (c) => {
  try {
    const data = await c.req.json();
    const novedad = await nominaService.createNovedad(data);
    return c.json(success(novedad, 'Novedad creada'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.patch('/nomina/novedades/:id/aprobar', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const novedad = await nominaService.aprobarNovedad(id, userId);
    return c.json(success(novedad, 'Novedad aprobada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// ============================================
// ASISTENCIA
// ============================================

router.get('/asistencia', async (c) => {
  try {
    const query = c.req.query();
    const result = await asistenciaService.list({
      empleadoId: query.empleadoId,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      estado: query.estado,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 31
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/asistencia/entrada', async (c) => {
  try {
    const { empleadoId, ...data } = await c.req.json();
    const asistencia = await asistenciaService.registrarEntrada(empleadoId, data);
    return c.json(success(asistencia, 'Entrada registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/asistencia/salida', async (c) => {
  try {
    const { empleadoId, ...data } = await c.req.json();
    const asistencia = await asistenciaService.registrarSalida(empleadoId, data);
    return c.json(success(asistencia, 'Salida registrada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/asistencia/reporte', async (c) => {
  try {
    const { fechaInicio, fechaFin, departamentoId } = c.req.query();
    const reporte = await asistenciaService.getReporte(fechaInicio, fechaFin, departamentoId);
    return c.json(success(reporte, 'Reporte obtenido'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Turnos
router.get('/turnos', async (c) => {
  try {
    const turnos = await asistenciaService.listTurnos();
    return c.json(success(turnos, 'Turnos obtenidos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/turnos', async (c) => {
  try {
    const data = await c.req.json();
    const turno = await asistenciaService.createTurno(data);
    return c.json(success(turno, 'Turno creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/turnos/asignar', async (c) => {
  try {
    const { empleadoId, turnoId, ...data } = await c.req.json();
    const asignacion = await asistenciaService.asignarTurno(empleadoId, turnoId, data);
    return c.json(success(asignacion, 'Turno asignado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// Vacaciones
router.get('/vacaciones', async (c) => {
  try {
    const query = c.req.query();
    const where = {};
    if (query.empleadoId) where.empleadoId = query.empleadoId;
    if (query.estado) where.estado = query.estado;

    const vacaciones = await prisma.th_vacaciones.findMany({
      where,
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { solicitadoEl: 'desc' }
    });
    return c.json(success(vacaciones, 'Vacaciones obtenidas'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/vacaciones', async (c) => {
  try {
    const data = await c.req.json();
    const vacacion = await asistenciaService.solicitarVacaciones(data.empleadoId, data);
    return c.json(success(vacacion, 'Vacaciones solicitadas'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.patch('/vacaciones/:id/aprobar', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const vacacion = await asistenciaService.aprobarVacaciones(id, userId);
    return c.json(success(vacacion, 'Vacaciones aprobadas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.patch('/vacaciones/:id/rechazar', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const { motivo } = await c.req.json();
    const vacacion = await asistenciaService.rechazarVacaciones(id, userId, motivo);
    return c.json(success(vacacion, 'Vacaciones rechazadas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/vacaciones/saldo/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const saldo = await asistenciaService.getSaldoVacaciones(empleadoId);
    return c.json(success(saldo, 'Saldo obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Permisos
router.get('/permisos', async (c) => {
  try {
    const query = c.req.query();
    const where = {};
    if (query.empleadoId) where.empleadoId = query.empleadoId;
    if (query.estado) where.estado = query.estado;

    const permisos = await prisma.th_permisos.findMany({
      where,
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true } },
        aprobador: { select: { id: true, nombre: true, apellido: true } }
      },
      orderBy: { solicitadoEl: 'desc' }
    });
    return c.json(success(permisos, 'Permisos obtenidos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/permisos', async (c) => {
  try {
    const data = await c.req.json();
    const permiso = await asistenciaService.solicitarPermiso(data.empleadoId, data);
    return c.json(success(permiso, 'Permiso solicitado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.patch('/permisos/:id/aprobar', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const permiso = await asistenciaService.aprobarPermiso(id, userId);
    return c.json(success(permiso, 'Permiso aprobado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// ============================================
// EVALUACIONES
// ============================================

router.get('/evaluaciones/periodos', async (c) => {
  try {
    const query = c.req.query();
    const result = await evaluacionService.listPeriodos({
      anio: query.anio ? parseInt(query.anio) : undefined,
      estado: query.estado,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/evaluaciones/periodos', async (c) => {
  try {
    const data = await c.req.json();
    const periodo = await evaluacionService.createPeriodo(data);
    return c.json(success(periodo, 'Periodo creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.get('/evaluaciones/periodos/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const periodo = await evaluacionService.getPeriodo(id);
    return c.json(success(periodo, 'Periodo obtenido'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/evaluaciones/periodos/:id/iniciar', async (c) => {
  try {
    const { id } = c.req.param();
    const periodo = await evaluacionService.iniciarPeriodo(id);
    return c.json(success(periodo, 'Periodo iniciado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/evaluaciones/pendientes', async (c) => {
  try {
    const userId = c.get('user').id;
    // Buscar empleado por usuario
    const empleado = await prisma.th_empleados.findUnique({ where: { usuarioId: userId } });
    if (!empleado) {
      return c.json(success([], 'No hay evaluaciones pendientes'));
    }
    const pendientes = await evaluacionService.getEvaluacionesPendientes(empleado.id);
    return c.json(success(pendientes, 'Evaluaciones pendientes'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/evaluaciones/:id/responder', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const empleado = await prisma.th_empleados.findUnique({ where: { usuarioId: userId } });
    if (!empleado) {
      return c.json(error('No eres un empleado registrado'), 403);
    }
    const data = await c.req.json();
    const evaluacion = await evaluacionService.responderEvaluacion(id, empleado.id, data);
    return c.json(success(evaluacion, 'Evaluación respondida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/evaluaciones/resultados/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const { anio } = c.req.query();
    const resultados = await evaluacionService.getResultadosEmpleado(empleadoId, anio ? parseInt(anio) : null);
    return c.json(success(resultados, 'Resultados obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Objetivos
router.get('/objetivos', async (c) => {
  try {
    const { empleadoId, anio } = c.req.query();
    const objetivos = await evaluacionService.listObjetivos(empleadoId, anio ? parseInt(anio) : null);
    return c.json(success(objetivos, 'Objetivos obtenidos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/objetivos', async (c) => {
  try {
    const data = await c.req.json();
    const objetivo = await evaluacionService.createObjetivo(data.empleadoId, data);
    return c.json(success(objetivo, 'Objetivo creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.patch('/objetivos/:id/progreso', async (c) => {
  try {
    const { id } = c.req.param();
    const { progreso, valorActual } = await c.req.json();
    const objetivo = await evaluacionService.updateProgresoObjetivo(id, progreso, valorActual);
    return c.json(success(objetivo, 'Progreso actualizado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// Feedback
router.get('/feedback', async (c) => {
  try {
    const { empleadoId, tipo } = c.req.query();
    const result = await evaluacionService.listFeedback(empleadoId, { tipo });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/feedback', async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const empleado = await prisma.th_empleados.findUnique({ where: { usuarioId: userId } });
    if (!empleado) {
      return c.json(error('No eres un empleado registrado'), 403);
    }
    const feedback = await evaluacionService.createFeedback(data.empleadoId, empleado.id, data);
    return c.json(success(feedback, 'Feedback creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// ============================================
// CAPACITACIONES
// ============================================

router.get('/capacitaciones', async (c) => {
  try {
    const query = c.req.query();
    const result = await capacitacionService.list({
      estado: query.estado,
      categoria: query.categoria,
      modalidad: query.modalidad,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// IMPORTANTE: Rutas específicas ANTES de /:id
router.get('/capacitaciones/stats', async (c) => {
  try {
    const stats = await capacitacionService.getStats();
    return c.json(success(stats, 'Estadísticas de capacitaciones'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/capacitaciones/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const capacitacion = await capacitacionService.getById(id);
    return c.json(success(capacitacion, 'Capacitación obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/capacitaciones', async (c) => {
  try {
    const data = await c.req.json();
    const capacitacion = await capacitacionService.create(data);
    return c.json(success(capacitacion, 'Capacitación creada'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.put('/capacitaciones/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const capacitacion = await capacitacionService.update(id, data);
    return c.json(success(capacitacion, 'Capacitación actualizada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/capacitaciones/:id/sesiones', async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const sesion = await capacitacionService.addSesion(id, data);
    return c.json(success(sesion, 'Sesión agregada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/capacitaciones/:id/inscribir', async (c) => {
  try {
    const { id } = c.req.param();
    const { empleadoId } = await c.req.json();
    const inscripcion = await capacitacionService.inscribirEmpleado(id, empleadoId);
    return c.json(success(inscripcion, 'Inscripción realizada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/capacitaciones/certificados/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const certificados = await capacitacionService.getCertificados(empleadoId);
    return c.json(success(certificados, 'Certificados obtenidos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// ============================================
// BIENESTAR
// ============================================

// Beneficios
router.get('/beneficios', async (c) => {
  try {
    const { tipo, activo } = c.req.query();
    const beneficios = await bienestarService.listBeneficios({
      tipo,
      activo: activo !== 'false'
    });
    return c.json(success(beneficios, 'Beneficios obtenidos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/beneficios', async (c) => {
  try {
    const data = await c.req.json();
    const beneficio = await bienestarService.createBeneficio(data);
    return c.json(success(beneficio, 'Beneficio creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.post('/beneficios/asignar', async (c) => {
  try {
    const { beneficioId, empleadoId, ...data } = await c.req.json();
    const asignacion = await bienestarService.asignarBeneficio(beneficioId, empleadoId, data);
    return c.json(success(asignacion, 'Beneficio asignado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/beneficios/empleado/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const beneficios = await bienestarService.getBeneficiosEmpleado(empleadoId);
    return c.json(success(beneficios, 'Beneficios del empleado'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Encuestas
router.get('/encuestas', async (c) => {
  try {
    const query = c.req.query();
    const result = await bienestarService.listEncuestas({
      tipo: query.tipo,
      estado: query.estado,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/encuestas', async (c) => {
  try {
    const data = await c.req.json();
    const encuesta = await bienestarService.createEncuesta(data);
    return c.json(success(encuesta, 'Encuesta creada'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.get('/encuestas/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const encuesta = await bienestarService.getEncuesta(id);
    return c.json(success(encuesta, 'Encuesta obtenida'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.patch('/encuestas/:id/activar', async (c) => {
  try {
    const { id } = c.req.param();
    const encuesta = await bienestarService.activarEncuesta(id);
    return c.json(success(encuesta, 'Encuesta activada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.post('/encuestas/:id/responder', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const empleado = await prisma.tHEmpleado.findUnique({ where: { usuarioId: userId } });
    const { respuestas } = await c.req.json();
    const respuesta = await bienestarService.responderEncuesta(id, empleado?.id, respuestas);
    return c.json(success(respuesta, 'Respuesta registrada'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

router.get('/encuestas/:id/resultados', async (c) => {
  try {
    const { id } = c.req.param();
    const resultados = await bienestarService.getResultadosEncuesta(id);
    return c.json(success(resultados, 'Resultados obtenidos'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Eventos
router.get('/eventos', async (c) => {
  try {
    const query = c.req.query();
    const result = await bienestarService.listEventos({
      tipo: query.tipo,
      estado: query.estado,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/eventos', async (c) => {
  try {
    const data = await c.req.json();
    const evento = await bienestarService.createEvento(data);
    return c.json(success(evento, 'Evento creado'), 201);
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

router.post('/eventos/:id/confirmar', async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get('user').id;
    const empleado = await prisma.tHEmpleado.findUnique({ where: { usuarioId: userId } });
    if (!empleado) {
      return c.json(error('No eres un empleado registrado'), 403);
    }
    const confirmacion = await bienestarService.confirmarAsistencia(id, empleado.id);
    return c.json(success(confirmacion, 'Asistencia confirmada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// Reconocimientos
router.get('/reconocimientos', async (c) => {
  try {
    const query = c.req.query();
    const result = await bienestarService.listReconocimientos({
      empleadoId: query.empleadoId,
      tipo: query.tipo,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20
    });
    return c.json(paginated(result.data, result.pagination));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.get('/reconocimientos/publicos', async (c) => {
  try {
    const { limit } = c.req.query();
    const reconocimientos = await bienestarService.getReconocimientosPublicos(parseInt(limit) || 10);
    return c.json(success(reconocimientos, 'Reconocimientos públicos'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/reconocimientos', async (c) => {
  try {
    const data = await c.req.json();
    const userId = c.get('user').id;
    const reconocimiento = await bienestarService.createReconocimiento(data.empleadoId, userId, data);
    return c.json(success(reconocimiento, 'Reconocimiento creado'), 201);
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 400);
  }
});

// ============================================
// NORMATIVIDAD COLOMBIANA 2025
// ============================================

// Obtener parámetros de normatividad vigente
router.get('/normatividad/parametros', async (c) => {
  try {
    const parametros = nominaService.getParametrosVigentes();
    return c.json(success(parametros, 'Parámetros de normatividad 2025'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Obtener fechas importantes del año (primas, cesantías, dotación)
router.get('/normatividad/fechas-importantes', async (c) => {
  try {
    const { anio } = c.req.query();
    const fechas = nominaService.getFechasImportantes(anio ? parseInt(anio) : undefined);
    return c.json(success(fechas, 'Fechas importantes del año'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

// Validar contrato según normatividad colombiana
router.post('/normatividad/validar-contrato', async (c) => {
  try {
    const contrato = await c.req.json();
    const validacion = nominaService.validarContrato(contrato);
    return c.json(success(validacion, 'Validación de contrato'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// Calcular incapacidad según normatividad
router.post('/normatividad/calcular-incapacidad', async (c) => {
  try {
    const { salarioBase, diasIncapacidad, tipoIncapacidad } = await c.req.json();
    const calculo = nominaService.calcularIncapacidad(salarioBase, diasIncapacidad, tipoIncapacidad);
    return c.json(success(calculo, 'Cálculo de incapacidad'));
  } catch (err) {
    return c.json(error(err.message), 400);
  }
});

// Generar liquidación definitiva
router.post('/nomina/liquidacion/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const { fechaRetiro, motivoRetiro } = await c.req.json();
    const liquidacion = await nominaService.generarLiquidacion(
      empleadoId,
      new Date(fechaRetiro),
      motivoRetiro
    );
    return c.json(success(liquidacion, 'Liquidación calculada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generar planilla PILA
router.get('/nomina/periodos/:id/pila', async (c) => {
  try {
    const { id } = c.req.param();
    const pila = await nominaService.generarPILA(id);
    return c.json(success(pila, 'Planilla PILA generada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generar certificado laboral
router.get('/certificados/laboral/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const { dirigidoA } = c.req.query();
    const certificado = await nominaService.generarCertificadoLaboral(empleadoId, dirigidoA);
    return c.json(success(certificado, 'Certificado laboral generado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generar certificado de ingresos y retenciones
router.get('/certificados/ingresos-retenciones/:empleadoId/:anio', async (c) => {
  try {
    const { empleadoId, anio } = c.req.param();
    const certificado = await nominaService.generarCertificadoIngresos(empleadoId, parseInt(anio));
    return c.json(success(certificado, 'Certificado de ingresos y retenciones generado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Generar colilla de pago detallada
router.get('/nomina/colilla-detallada/:empleadoId/:periodoId', async (c) => {
  try {
    const { empleadoId, periodoId } = c.req.param();
    const colilla = await nominaService.generarColillaDetallada(empleadoId, periodoId);
    return c.json(success(colilla, 'Colilla de pago generada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// Calcular nómina completa de un empleado (preview)
router.post('/nomina/calcular/:empleadoId', async (c) => {
  try {
    const { empleadoId } = c.req.param();
    const novedades = await c.req.json();
    const calculo = await nominaService.calcularNominaCompleta(empleadoId, novedades);
    return c.json(success(calculo, 'Cálculo de nómina'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

// ============================================
// INTELIGENCIA ARTIFICIAL
// ============================================

router.get('/ai/status', async (c) => {
  try {
    const configured = talentoHumanoAIService.isConfigured();
    return c.json(success({ configured }, 'Estado del servicio de IA'));
  } catch (err) {
    return c.json(error(err.message), 500);
  }
});

router.post('/ai/screening-cv', async (c) => {
  try {
    const { cvText, vacanteId } = await c.req.json();
    const vacante = await prisma.th_vacantes.findUnique({ where: { id: vacanteId } });
    if (!vacante) {
      return c.json(error('Vacante no encontrada'), 404);
    }
    const resultado = await talentoHumanoAIService.screenCV(cvText, vacante);
    return c.json(success(resultado, 'Screening completado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/ai/generar-preguntas', async (c) => {
  try {
    const { candidatoId, vacanteId, tipoEntrevista } = await c.req.json();
    const [candidato, vacante] = await Promise.all([
      prisma.th_candidatos.findUnique({ where: { id: candidatoId } }),
      prisma.th_vacantes.findUnique({ where: { id: vacanteId } })
    ]);
    if (!candidato || !vacante) {
      return c.json(error('Candidato o vacante no encontrada'), 404);
    }
    const preguntas = await talentoHumanoAIService.generateInterviewQuestions(candidato, vacante, tipoEntrevista);
    return c.json(success(preguntas, 'Preguntas generadas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/ai/analizar-desempeno', async (c) => {
  try {
    const { empleadoId } = await c.req.json();
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: empleadoId },
      include: {
        th_cargos: true,
        evaluacionesRecibidas: { take: 5, orderBy: { fechaAsignacion: 'desc' } },
        feedbackRecibido: { take: 10, orderBy: { createdAt: 'desc' } },
        capacitaciones: { include: { capacitacion: true }, take: 5 },
        reconocimientos: { take: 5 }
      }
    });
    if (!empleado) {
      return c.json(error('Empleado no encontrado'), 404);
    }

    // Obtener datos de asistencia del último mes
    const unMesAtras = new Date();
    unMesAtras.setMonth(unMesAtras.getMonth() - 1);
    const asistencias = await prisma.th_asistencia.findMany({
      where: { empleadoId, fecha: { gte: unMesAtras } }
    });

    const asistencia = {
      tardanzas: asistencias.filter(a => a.estado === 'TARDANZA').length,
      ausencias: asistencias.filter(a => a.estado === 'AUSENTE').length,
      horasPromedio: asistencias.reduce((acc, a) => acc + Number(a.horasTrabajadas || 0), 0) / (asistencias.length || 1)
    };

    const analisis = await talentoHumanoAIService.analyzePerformance(
      empleado,
      empleado.evaluacionesRecibidas,
      empleado.feedbackRecibido,
      asistencia
    );
    return c.json(success(analisis, 'Análisis completado'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/ai/predecir-rotacion', async (c) => {
  try {
    const empleados = await prisma.th_empleados.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        th_cargos: true,
        evaluacionesRecibidas: { take: 1, orderBy: { fechaAsignacion: 'desc' } },
        capacitaciones: { take: 3 },
        reconocimientos: { take: 3 }
      }
    });
    const prediccion = await talentoHumanoAIService.predictTurnover(empleados);
    return c.json(success(prediccion, 'Predicción completada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/ai/sugerir-capacitacion', async (c) => {
  try {
    const { empleadoId } = await c.req.json();
    const empleado = await prisma.th_empleados.findUnique({
      where: { id: empleadoId },
      include: {
        th_cargos: true,
        evaluacionesRecibidas: { take: 1, orderBy: { fechaAsignacion: 'desc' } },
        capacitaciones: { include: { capacitacion: true } }
      }
    });
    if (!empleado) {
      return c.json(error('Empleado no encontrado'), 404);
    }
    const sugerencias = await talentoHumanoAIService.suggestTraining(empleado);
    return c.json(success(sugerencias, 'Sugerencias generadas'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

router.post('/ai/chat', async (c) => {
  try {
    const { messages, context } = await c.req.json();
    const userId = c.get('user').id;
    const resultado = await talentoHumanoAIService.chat(messages, context, userId);
    return c.json(success(resultado, 'Respuesta generada'));
  } catch (err) {
    return c.json(error(err.message), err.statusCode || 500);
  }
});

module.exports = router;
