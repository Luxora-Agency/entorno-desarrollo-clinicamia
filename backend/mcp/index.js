#!/usr/bin/env node
/**
 * MCP Server - ClinicaMia WhatsApp Agent
 *
 * Model Context Protocol server for AI agents (WhatsApp, etc.)
 * Provides tools for managing medical appointments and accessing patient data.
 *
 * Usage:
 *   node mcp/index.js
 *
 * Or via MCP client configuration:
 *   {
 *     "mcpServers": {
 *       "clinicamia": {
 *         "command": "node",
 *         "args": ["mcp/index.js"],
 *         "cwd": "/path/to/backend"
 *       }
 *     }
 *   }
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Import tools
const appointmentTools = require('./tools/appointments');
const patientTools = require('./tools/patients');
const doctorTools = require('./tools/doctors');
const hceTools = require('./tools/hce');
const catalogTools = require('./tools/catalogs');

// Create MCP Server
const server = new Server(
  {
    name: 'clinicamia-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Combine all tools
const allTools = [
  ...appointmentTools.definitions,
  ...patientTools.definitions,
  ...doctorTools.definitions,
  ...hceTools.definitions,
  ...catalogTools.definitions,
];

// Tool handlers map
const toolHandlers = {
  ...appointmentTools.handlers,
  ...patientTools.handlers,
  ...doctorTools.handlers,
  ...hceTools.handlers,
  ...catalogTools.handlers,
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers[name];
  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: Herramienta "${name}" no encontrada.`,
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await handler(args || {});
    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// List resources (for context)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'clinicamia://info/horarios',
        name: 'Horarios de Atención',
        description: 'Información sobre horarios de la clínica',
        mimeType: 'text/plain',
      },
      {
        uri: 'clinicamia://info/servicios',
        name: 'Servicios Disponibles',
        description: 'Lista de servicios y especialidades',
        mimeType: 'text/plain',
      },
      {
        uri: 'clinicamia://info/contacto',
        name: 'Información de Contacto',
        description: 'Datos de contacto de la clínica',
        mimeType: 'text/plain',
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const resources = {
    'clinicamia://info/horarios': `
HORARIOS DE ATENCIÓN - CLÍNICA MÍA

Consulta Externa:
- Lunes a Viernes: 7:00 AM - 7:00 PM
- Sábados: 8:00 AM - 2:00 PM
- Domingos y Festivos: Cerrado

Urgencias:
- 24 horas, todos los días

Laboratorio:
- Lunes a Viernes: 6:00 AM - 6:00 PM
- Sábados: 6:00 AM - 12:00 PM

Imagenología:
- Lunes a Viernes: 7:00 AM - 5:00 PM
- Sábados: 8:00 AM - 12:00 PM

Farmacia:
- Lunes a Viernes: 7:00 AM - 8:00 PM
- Sábados: 8:00 AM - 4:00 PM
    `.trim(),

    'clinicamia://info/servicios': `
SERVICIOS DISPONIBLES - CLÍNICA MÍA

ESPECIALIDADES MÉDICAS:
• Medicina General
• Medicina Interna
• Endocrinología (Tiroides y Metabolismo)
• Cardiología
• Gastroenterología
• Neurología
• Dermatología
• Ginecología y Obstetricia
• Pediatría
• Cirugía General
• Cirugía Plástica
• Ortopedia y Traumatología
• Oftalmología
• Otorrinolaringología
• Urología
• Psiquiatría
• Nutrición

SERVICIOS DIAGNÓSTICOS:
• Laboratorio Clínico
• Rayos X
• Ecografías
• Tomografía
• Electrocardiograma
• Endoscopias

OTROS SERVICIOS:
• Urgencias 24 horas
• Hospitalización
• Cirugía Ambulatoria
• Farmacia
• Vacunación
    `.trim(),

    'clinicamia://info/contacto': `
INFORMACIÓN DE CONTACTO - CLÍNICA MÍA

Dirección: Cra. 5 #28-85, Ibagué, Tolima, Colombia

Teléfonos:
• Central: 324 333 8555
• WhatsApp: 324 333 8686
• Urgencias: 324 333 8600

Correo electrónico: info@clinicamiacolombia.com

Sitio web: www.clinicamiacolombia.com

Redes Sociales:
• Instagram: @clinicamiacolombia
• Facebook: Clínica Mía Colombia
    `.trim(),
  };

  const content = resources[uri];
  if (!content) {
    throw new Error(`Recurso no encontrado: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'text/plain',
        text: content,
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ClinicaMia MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
