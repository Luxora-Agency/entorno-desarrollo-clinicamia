const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { cors } = require('hono/cors');

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Test route
app.get('/test', (c) => {
  return c.json({ message: 'Test works!' });
});

// Try to mount interconsultas
try {
  const interconsultas = require('./routes/interconsulta');
  app.route('/interconsultas', interconsultas);
  console.log('✅ Interconsultas route mounted');
} catch (error) {
  console.log('❌ Error mounting interconsultas:', error.message);
}

console.log('\nAll routes:');
app.routes.forEach(r => {
  console.log(`  ${r.method} ${r.path}`);
});

const PORT = 4002;
console.log(`\n🚀 Server starting on port ${PORT}...`);

serve({
  fetch: app.fetch,
  port: PORT,
});
