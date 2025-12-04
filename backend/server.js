require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { cors } = require('hono/cors');
const { pool, initDatabase } = require('./db');

// Importar rutas
const auth = require('./routes/auth');
const pacientes = require('./routes/pacientes');
const citas = require('./routes/citas');

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
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      pacientes: '/pacientes',
      citas: '/citas'
    }
  });
});

// Health check
app.get('/health', async (c) => {
  try {
    await pool.query('SELECT 1');
    return c.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return c.json({ status: 'error', database: 'disconnected' }, 500);
  }
});

// Montar rutas
app.route('/auth', auth);
app.route('/pacientes', pacientes);
app.route('/citas', citas);

// Inicializar base de datos y servidor
const PORT = process.env.HONO_PORT || 4000;

(async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos inicializada');
    
    console.log(`🚀 Servidor Hono.js iniciado en http://localhost:${PORT}`);
    serve({
      fetch: app.fetch,
      port: PORT,
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
})();

module.exports = app;
