/**
 * MCP Routes - Integrado con Backend Principal
 *
 * Expone las herramientas MCP como endpoints REST.
 * Montado en /api/v1/mcp
 */

const { Hono } = require('hono');

// Import tool modules
const appointments = require('../mcp/tools/appointments');
const patients = require('../mcp/tools/patients');
const doctors = require('../mcp/tools/doctors');
const hce = require('../mcp/tools/hce');
const catalogs = require('../mcp/tools/catalogs');

const router = new Hono();

// Combine all tools
const allDefinitions = [
  ...appointments.definitions,
  ...patients.definitions,
  ...doctors.definitions,
  ...hce.definitions,
  ...catalogs.definitions,
];

const allHandlers = {
  ...appointments.handlers,
  ...patients.handlers,
  ...doctors.handlers,
  ...hce.handlers,
  ...catalogs.handlers,
};

// Optional API Key middleware for MCP endpoints
const mcpAuthMiddleware = async (c, next) => {
  const apiKey = process.env.MCP_API_KEY;

  // Si no hay API key configurada, permitir acceso
  if (!apiKey) {
    return next();
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'API key required. Use Authorization: Bearer <api_key>',
    }, 401);
  }

  const token = authHeader.substring(7);

  if (token !== apiKey) {
    return c.json({
      success: false,
      error: 'Invalid API key',
    }, 401);
  }

  return next();
};

// Apply auth middleware to all routes
router.use('*', mcpAuthMiddleware);

// Health check / Info
router.get('/', (c) => {
  return c.json({
    success: true,
    service: 'clinicamia-mcp',
    version: '1.0.0',
    tools_count: allDefinitions.length,
    endpoints: {
      list_tools: 'GET /api/v1/mcp/tools',
      tool_info: 'GET /api/v1/mcp/tools/:name',
      execute_tool: 'POST /api/v1/mcp/tools/:name',
      batch_execute: 'POST /api/v1/mcp/batch',
      clinic_info: 'GET /api/v1/mcp/info',
    },
  });
});

// Clinic info resource
router.get('/info', (c) => {
  return c.json({
    success: true,
    data: {
      nombre: 'Clínica Mía',
      descripcion: 'Centro médico integral con atención especializada',
      horarios: {
        lunes_viernes: '6:00 AM - 8:00 PM',
        sabados: '7:00 AM - 2:00 PM',
        domingos: 'Urgencias 24 horas',
      },
      contacto: {
        telefono: '324 333 8555',
        email: 'contacto@clinicamia.com',
        direccion: 'Calle Principal #123, Ciudad',
      },
      servicios: [
        'Consulta Externa',
        'Urgencias 24h',
        'Hospitalización',
        'Laboratorio Clínico',
        'Imagenología',
        'Cirugía',
        'Farmacia',
      ],
    },
  });
});

// List all tools
router.get('/tools', (c) => {
  return c.json({
    success: true,
    count: allDefinitions.length,
    tools: allDefinitions.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema.properties || {},
      required: tool.inputSchema.required || [],
    })),
  });
});

// Get specific tool info
router.get('/tools/:name', (c) => {
  const { name } = c.req.param();
  const tool = allDefinitions.find((t) => t.name === name);

  if (!tool) {
    return c.json({
      success: false,
      error: `Tool '${name}' not found`,
      available_tools: allDefinitions.map((t) => t.name),
    }, 404);
  }

  return c.json({
    success: true,
    tool: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema.properties || {},
      required: tool.inputSchema.required || [],
    },
  });
});

// Execute a tool
router.post('/tools/:name', async (c) => {
  const { name } = c.req.param();
  const handler = allHandlers[name];

  if (!handler) {
    return c.json({
      success: false,
      error: `Tool '${name}' not found`,
      available_tools: allDefinitions.map((t) => t.name),
    }, 404);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await handler(body);

    return c.json({
      success: true,
      tool: name,
      result,
    });
  } catch (error) {
    console.error(`[MCP] Error executing tool ${name}:`, error);

    return c.json({
      success: false,
      tool: name,
      error: error.message,
    }, 400);
  }
});

// Batch execute multiple tools
router.post('/batch', async (c) => {
  try {
    const { calls } = await c.req.json();

    if (!Array.isArray(calls)) {
      return c.json({
        success: false,
        error: 'Request body must contain "calls" array',
        example: {
          calls: [
            { tool: 'buscar_paciente', arguments: { documento: '123456789' } },
            { tool: 'listar_especialidades', arguments: {} },
          ],
        },
      }, 400);
    }

    const results = await Promise.all(
      calls.map(async (call) => {
        const handler = allHandlers[call.tool];

        if (!handler) {
          return {
            tool: call.tool,
            success: false,
            error: `Tool '${call.tool}' not found`,
          };
        }

        try {
          const result = await handler(call.arguments || {});
          return {
            tool: call.tool,
            success: true,
            result,
          };
        } catch (error) {
          return {
            tool: call.tool,
            success: false,
            error: error.message,
          };
        }
      })
    );

    return c.json({
      success: true,
      results,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
    }, 400);
  }
});

module.exports = router;
