const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

// Importar las rutas
const interconsultas = require('./routes/interconsulta');
const procedimientos = require('./routes/procedimiento');

const app = new Hono();

// Root
app.get('/', (c) => {
  return c.json({ message: 'Test Server' });
});

// Montar rutas sin autenticación para probar
app.route('/interconsultas', interconsultas);
app.route('/procedimientos', procedimientos);

console.log('Rutas registradas:');
app.routes.forEach(r => {
  if (r.path.includes('interconsultas') || r.path.includes('procedimientos')) {
    console.log(`  ${r.method} ${r.path}`);
  }
});

const PORT = 4001;
console.log(`\n🚀 Test Server iniciado en puerto ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});
