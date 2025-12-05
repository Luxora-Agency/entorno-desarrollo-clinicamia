require('dotenv').config();
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { cors } = require('hono/cors');
const prisma = require('./db/prisma');

// Importar rutas
const auth = require('./routes/auth');
const pacientes = require('./routes/pacientes');
const citas = require('./routes/citas');
const departamentos = require('./routes/departamentos');
const especialidades = require('./routes/especialidades');
const usuarios = require('./routes/usuarios');
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

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

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

// Montar rutas
app.route('/auth', auth);
app.route('/pacientes', pacientes);
app.route('/citas', citas);
app.route('/departamentos', departamentos);
app.route('/especialidades', especialidades);
app.route('/usuarios', usuarios);
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

// Inicializar servidor
const PORT = process.env.PORT || 4000;

console.log(`🚀 Servidor Hono.js con Prisma iniciado en puerto ${PORT}`);
serve({
  fetch: app.fetch,
  port: PORT,
});

module.exports = app;
