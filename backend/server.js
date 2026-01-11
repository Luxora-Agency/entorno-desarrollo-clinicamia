require('dotenv').config();
const { Hono } = require('hono');
const { logger } = require('hono/logger');
const { serve } = require('@hono/node-server');
const { serveStatic } = require('@hono/node-server/serve-static');
const { cors } = require('hono/cors');
const { swaggerUI } = require('@hono/swagger-ui');
const swaggerSpec = require('./config/swagger');
const prisma = require('./db/prisma');

// Importar rutas
const auth = require('./routes/auth');
const pacientes = require('./routes/pacientes');
const citas = require('./routes/citas.routes');
const agenda = require('./routes/agenda');
const departamentos = require('./routes/departamentos');
const especialidades = require('./routes/especialidades');
const usuarios = require('./routes/usuarios');
const roles = require('./routes/roles');
const permissions = require('./routes/permissions');
const audit = require('./routes/audit');
const doctores = require('./routes/doctores');
const categoriaExamen = require('./routes/categoriaExamen');
const examenProcedimiento = require('./routes/examenProcedimiento');
const categoriaProducto = require('./routes/categoriaProducto');
const etiquetaProducto = require('./routes/etiquetaProducto');
const productos = require('./routes/productos');
const documentosPaciente = require('./routes/documentosPaciente');
// Rutas de hospitalización
const unidad = require('./routes/unidad');
const habitacion = require('./routes/habitacion');
const cama = require('./routes/cama');
const admision = require('./routes/admision');
const movimiento = require('./routes/movimiento');
// Rutas de facturación y órdenes
const ordenesMedicas = require('./routes/ordenesMedicas');
const ordenesMedicamentos = require('./routes/ordenesMedicamentos');
const facturas = require('./routes/facturas');
const paquetesHospitalizacion = require('./routes/paquetesHospitalizacion');
// Rutas de HCE
const evoluciones = require('./routes/evoluciones');
const signosVitales = require('./routes/signosVitales');
const diagnosticos = require('./routes/diagnosticos');
const alertas = require('./routes/alertas');
const auditoria = require('./routes/auditoria');
const hce = require('./routes/hce');
// Rutas de egresos
const egresos = require('./routes/egresos');
// Rutas de disponibilidad
const disponibilidad = require('./routes/disponibilidad');
// Rutas de interconsultas
const interconsultas = require('./routes/interconsulta');
// Rutas de procedimientos
const procedimientos = require('./routes/procedimiento');
// Rutas de prescripción médica (usa modelo Producto como vademécum)
const prescripciones = require('./routes/prescripciones');
const administraciones = require('./routes/administraciones');
// Rutas de consultas
const consultas = require('./routes/consultas');
// Rutas de urgencias
const urgencias = require('./routes/urgencias');
// Rutas de asignaciones de enfermería
const asignacionesEnfermeria = require('./routes/asignacionesEnfermeria');
// Rutas de notas de enfermería
const notasEnfermeria = require('./routes/notasEnfermeria');
const glucometrias = require('./routes/glucometrias');
const balanceLiquidos = require('./routes/balanceLiquidos');
const drogueria = require('./routes/drogueria');
const transfusiones = require('./routes/transfusiones');
const plantillasNotas = require('./routes/plantillasNotas');
const plantillasDoctor = require('./routes/plantillasDoctor');
const plantillasPlanes = require('./routes/plantillas-planes');
const dashboard = require('./routes/dashboard');
// Rutas de Calidad IPS
const habilitacion = require('./routes/habilitacion');
const pamec = require('./routes/pamec');
const eventosAdversos = require('./routes/eventosAdversos');
const seguridadPaciente = require('./routes/seguridadPaciente');
const indicadoresSIC = require('./routes/indicadoresSIC');
const pqrs = require('./routes/pqrs');
const comites = require('./routes/comites');
const vigilanciaSalud = require('./routes/vigilanciaSalud');
const documentosCalidad = require('./routes/documentosCalidad');
const planesAccion = require('./routes/planesAccion');
const acreditacion = require('./routes/acreditacion');
const quirofano = require('./routes/quirofano');
const imagenologia = require('./routes/imagenologia');
const reportes = require('./routes/reportes');
const miaPass = require('./routes/miaPass');
const formularioMiaPass = require('./routes/formularioMiaPass');
const publicaciones = require('./routes/publicaciones');
const tickets = require('./routes/tickets');
const ordenesTienda = require('./routes/ordenesTienda');
// Trabaja con nosotros - Candidatos de talento humano
const candidatos = require('./routes/candidatos');
// Calidad 2.0 - Sistema de Gestión de Calidad Mejorado
const calidad2 = require('./routes/calidad2');
// Catálogos oficiales (CUPS, CIE-10, CIE-11)
const catalogos = require('./routes/catalogos');
// Antecedentes médicos estructurados
const antecedentes = require('./routes/antecedentes');
// Incapacidades, Certificados y Seguimientos
const incapacidades = require('./routes/incapacidades');
const certificados = require('./routes/certificados');
const seguimientos = require('./routes/seguimientos');
// MCP - Herramientas para agentes de IA (n8n, WhatsApp, etc.)
const mcp = require('./routes/mcp');
// AI Assistant - Asistente IA médico para consultas
const aiAssistant = require('./routes/ai-assistant');
// HCE Analyzer - Analizador de historias clínicas externas con IA
const hceAnalyzer = require('./routes/hce-analyzer');
// Talento Humano - Módulo completo de RRHH con IA
const talentoHumano = require('./routes/talento-humano');
// SST - Seguridad y Salud en el Trabajo (Decreto 1072/2015, Res. 0312/2019)
const sst = require('./routes/sst');
// Alertas y Notificaciones por Email (Resend)
const alertasNotificaciones = require('./routes/alertas-notificaciones');
// Rutas públicas y pagos (ePayco)
const publicRoutes = require('./routes/public');
const payments = require('./routes/payments');
// API v1 para frontend usuario (Front_Usuario_ClinicaMia)
const apiV1 = require('./routes/api-v1');
// Sistema de Reservas Temporales de Horarios
const reservas = require('./routes/reservas');
// Sistema de Bloqueos de Agenda (vacaciones, permisos, etc.)
const bloqueos = require('./routes/bloqueos');
// Siigo - Facturación Electrónica y Contabilidad
const siigoRoutes = require('./routes/siigo');
const compras = require('./routes/compras');
const contabilidad = require('./routes/contabilidad');
const bancos = require('./routes/bancos');
const activosFijos = require('./routes/activos-fijos');
const dashboardFinanciero = require('./routes/dashboard-financiero');
// Cron Jobs
const limpiarReservasJob = require('./cron/limpiarReservas');
const depreciacionJob = require('./cron/depreciacion');
const siigoSyncJob = require('./cron/siigoSync');
const { initMiaPassExpirationCron } = require('./cron/miaPassExpiration');

const app = new Hono();

app.use('*', logger());

// CORS - Allow all origins for local network access
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Servir archivos estáticos (uploads de doctores, etc.)
app.use('/uploads/*', serveStatic({ root: './public' }));

// Swagger Documentation
app.get('/swagger.json', (c) => {
  return c.json(swaggerSpec);
});
app.get('/api-docs', swaggerUI({ url: '/swagger.json' }));

// Rutas principales
app.get('/', (c) => {
  return c.json({
    message: 'API de Clínica Mía - Sistema de Gestión Hospitalaria',
    version: '2.1.0',
    features: ['Prisma ORM', 'Departamentos', 'Especialidades', 'Hospitalización'],
    endpoints: {
      auth: '/auth',
      pacientes: '/pacientes',
      citas: '/citas',
      departamentos: '/departamentos',
      especialidades: '/especialidades',
      usuarios: '/usuarios',
      doctores: '/doctores',
      categoriasExamenes: '/categorias-examenes',
      examenesProcedimientos: '/examenes-procedimientos',
      categoriasProductos: '/categorias-productos',
      etiquetasProductos: '/etiquetas-productos',
      documentosPaciente: '/documentos-paciente',
      // Hospitalización
      unidades: '/unidades',
      habitaciones: '/habitaciones',
      camas: '/camas',
      admisiones: '/admisiones',
      movimientos: '/movimientos',
      // Facturación y órdenes
      ordenesMedicas: '/ordenes-medicas',
      ordenesMedicamentos: '/ordenes-medicamentos',
      facturas: '/facturas',
      paquetesHospitalizacion: '/paquetes-hospitalizacion',
      // HCE
      evoluciones: '/evoluciones',
      signosVitales: '/signos-vitales',
      diagnosticos: '/diagnosticos',
      alertas: '/alertas',
      auditoria: '/auditoria',
      // Egresos
      egresos: '/egresos',
      // Disponibilidad
      disponibilidad: '/disponibilidad',
      // Urgencias
      urgencias: '/urgencias',
      // Calidad IPS
      habilitacion: '/habilitacion',
      pamec: '/pamec',
      eventosAdversos: '/eventos-adversos',
      seguridadPaciente: '/seguridad-paciente',
      indicadoresSIC: '/indicadores-sic',
      pqrs: '/pqrs',
      comites: '/comites',
      vigilanciaSalud: '/vigilancia-salud',
      documentosCalidad: '/documentos-calidad',
      planesAccion: '/planes-accion',
      acreditacion: '/acreditacion',
      miaPass: '/mia-pass',
      formularioMiaPass: '/formulario-mia-pass',
      // Trabaja con nosotros
      candidates: '/candidates',
      // Calidad 2.0
      calidad2: '/calidad2',
      // Talento Humano
      talentoHumano: '/talento-humano',
      // SST - Seguridad y Salud en el Trabajo
      sst: '/sst',
      // MCP - Herramientas para agentes de IA
      mcp: '/api/v1/mcp',
      // Rutas públicas (sin auth)
      public: '/public',
      payments: '/payments',
    }
  });
});

// Health check
app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: 'ok', database: 'connected', orm: 'prisma' });
  } catch (error) {
    return c.json({ status: 'error', database: 'disconnected' }, 500);
  }
});

// Rutas públicas (sin autenticación)
app.route('/public', publicRoutes);
app.route('/payments', payments);

// API v1 para frontend usuario (Front_Usuario_ClinicaMia)
// Estas rutas siguen el esquema OpenAPI esperado por el frontend
app.route('/api/v1', apiV1);

// MCP - Herramientas para agentes de IA (n8n, WhatsApp, etc.)
// Endpoints: GET /tools, POST /tools/:name, POST /batch
app.route('/api/v1/mcp', mcp);

// Montar rutas
app.route('/auth', auth);
app.route('/drogueria', drogueria);
app.route('/pacientes', pacientes);
app.route('/citas', citas);
app.route('/agenda', agenda);
app.route('/reservas', reservas);
app.route('/bloqueos', bloqueos);
app.route('/departamentos', departamentos);
app.route('/especialidades', especialidades);
app.route('/usuarios', usuarios);
app.route('/roles', roles);
app.route('/permissions', permissions);
app.route('/audit', audit);
app.route('/doctores', doctores);
app.route('/categorias-examenes', categoriaExamen);
app.route('/examenes-procedimientos', examenProcedimiento);
app.route('/categorias-productos', categoriaProducto);
app.route('/etiquetas-productos', etiquetaProducto);
app.route('/productos', productos);
app.route('/documentos-paciente', documentosPaciente);
// Rutas de hospitalización
app.route('/unidades', unidad);
app.route('/habitaciones', habitacion);
app.route('/camas', cama);
app.route('/admisiones', admision);
app.route('/movimientos', movimiento);
// Rutas de facturación y órdenes
app.route('/ordenes-medicas', ordenesMedicas);
app.route('/ordenes-medicamentos', ordenesMedicamentos);
app.route('/facturas', facturas);
app.route('/paquetes-hospitalizacion', paquetesHospitalizacion);
// Rutas de HCE
app.route('/evoluciones', evoluciones);
app.route('/signos-vitales', signosVitales);
app.route('/diagnosticos', diagnosticos);
app.route('/alertas', alertas);
app.route('/auditoria', auditoria);
app.route('/hce', hce);
// Rutas de egresos
app.route('/egresos', egresos);
// Rutas de disponibilidad
app.route('/disponibilidad', disponibilidad);
// Rutas de interconsultas
app.route('/interconsultas', interconsultas);
// Rutas de procedimientos
app.route('/procedimientos', procedimientos);
// Rutas de prescripción médica (medicamentos = productos)
app.route('/prescripciones', prescripciones);
app.route('/administraciones', administraciones);
// Rutas de consultas
app.route('/consultas', consultas);
// Rutas de urgencias
app.route('/urgencias', urgencias);
// Rutas de asignaciones de enfermería
app.route('/asignaciones-enfermeria', asignacionesEnfermeria);
// Rutas de notas de enfermería
app.route('/notas-enfermeria', notasEnfermeria);
app.route('/glucometrias', glucometrias);
app.route('/balance-liquidos', balanceLiquidos);
app.route('/transfusiones', transfusiones);
app.route('/plantillas-notas', plantillasNotas);
app.route('/plantillas-doctor', plantillasDoctor);
app.route('/plantillas-planes', plantillasPlanes);
app.route('/dashboard', dashboard);
// Rutas de Calidad IPS - Sistema de Gestión de Calidad
app.route('/habilitacion', habilitacion);
app.route('/pamec', pamec);
app.route('/eventos-adversos', eventosAdversos);
app.route('/seguridad-paciente', seguridadPaciente);
app.route('/indicadores-sic', indicadoresSIC);
app.route('/pqrs', pqrs);
app.route('/comites', comites);
app.route('/vigilancia-salud', vigilanciaSalud);
app.route('/documentos-calidad', documentosCalidad);
app.route('/planes-accion', planesAccion);
app.route('/acreditacion', acreditacion);
app.route('/quirofanos', quirofano);
app.route('/imagenologia', imagenologia);
app.route('/reportes', reportes);
app.route('/mia-pass', miaPass);
app.route('/formulario-mia-pass', formularioMiaPass);
app.route('/publicaciones', publicaciones);
app.route('/tickets', tickets);
app.route('/ordenes-tienda', ordenesTienda);
// Trabaja con nosotros - Candidatos de talento humano
app.route('/candidates', candidatos);
// Calidad 2.0 - Sistema de Gestión de Calidad Mejorado
app.route('/calidad2', calidad2);
app.route('/catalogos', catalogos);
app.route('/antecedentes', antecedentes);
app.route('/incapacidades', incapacidades);
app.route('/certificados', certificados);
app.route('/seguimientos', seguimientos);
// AI Assistant - Asistente IA médico para consultas
app.route('/ai-assistant', aiAssistant);
// HCE Analyzer - Analizador de historias clínicas externas con IA
app.route('/hce-analyzer', hceAnalyzer);
// Talento Humano - Módulo completo de RRHH con IA
app.route('/talento-humano', talentoHumano);
// SST - Seguridad y Salud en el Trabajo (Decreto 1072/2015, Res. 0312/2019)
app.route('/sst', sst);
// Alertas y Notificaciones por Email
app.route('/alertas-notificaciones', alertasNotificaciones);
// Siigo - Facturación Electrónica DIAN y Contabilidad
app.route('/siigo', siigoRoutes);
// Compras - Proveedores, Órdenes de Compra, Cuentas por Pagar
app.route('/compras', compras);
// Contabilidad - Asientos, Reportes, Centros de Costo, Nómina
app.route('/contabilidad', contabilidad);
// Bancos - Cuentas, Movimientos, Conciliación, Tributario
app.route('/bancos', bancos);
// Activos Fijos - Equipos médicos, Depreciación, Mantenimientos
app.route('/activos-fijos', activosFijos);
// Dashboard Financiero - KPIs, Tendencias, Reportes
app.route('/dashboard-financiero', dashboardFinanciero);

app.notFound((c) => {
  console.log(`[404] Not Found: ${c.req.method} ${c.req.url}`);
  return c.json({ success: false, message: `Ruta no encontrada: ${c.req.url}` }, 404);
});

// ==========================================
// INICIALIZAR CRON JOBS
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  // Cron job para alertas de documentos legales (diario a las 8:00 AM)
  require('./jobs/alertasDocumentosLegales.job');
  console.log('✓ Cron jobs inicializados');
}

// Inicializar servidor
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

console.log(`🚀 Servidor Hono.js con Prisma iniciado en ${HOST}:${PORT}`);

// Iniciar cron jobs
limpiarReservasJob.iniciar();
depreciacionJob.iniciar();
siigoSyncJob.start();
initMiaPassExpirationCron();

// Auto-inicializar conexión Siigo
const siigoService = require('./services/siigo/siigo.service');
siigoService.autoInitialize().catch(err => {
  console.error('[Siigo] Error en auto-inicialización:', err.message);
});

if (require.main === module) {
  serve({
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  });
}

module.exports = app;
