const request = require('supertest');
const { serve } = require('@hono/node-server');
const prisma = require('../../db/prisma');

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    c.set('user', { 
        id: 'user-123',
        rol: 'ADMIN', 
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@clinica.com' 
    });
    await next();
  },
  permissionMiddleware: () => async (c, next) => { await next(); },
  requirePermission: () => async (c, next) => { await next(); },
  roleMiddleware: () => async (c, next) => { await next(); }
}));

const app = require('../../server');

describe('RIPS Generation Flow (Mocked)', () => {
  let server;

  beforeAll(async () => {
    server = serve({
      fetch: app.fetch,
      port: 0
    });
  });

  afterAll(async () => {
    server.close();
  });

  beforeEach(() => {
    // jest.clearAllMocks(); // Comentado para evitar conflictos con mocks globales
  });

  it('should generate a valid RIPS JSON for a complex invoice', async () => {
    // Mock Data
    const mockFactura = {
      id: 'factura-1',
      numero: 'F-2025-00001',
      pacienteId: 'paciente-1',
      epsAutorizacion: 'AUT-123',
      paciente: {
        id: 'paciente-1',
        tipoDocumento: 'Cédula de Ciudadanía',
        cedula: '123456789',
        tipoUsuario: 'Contributivo',
        fechaNacimiento: new Date('1990-01-01'),
        genero: 'Masculino'
      },
      items: [
        // 1. Consulta
        {
          tipo: 'Consulta',
          subtotal: 50000,
          cita: {
            fecha: new Date('2025-12-01T10:00:00Z'),
            hora: new Date('1970-01-01T10:00:00Z'),
            especialidad: { titulo: 'Medicina General' },
            doctor: { usuario: { nombre: 'Juan', apellido: 'Medico' } }
          }
        },
        // 2. Procedimiento
        {
          tipo: 'OrdenMedica',
          createdAt: new Date('2025-12-01T11:00:00Z'),
          subtotal: 30000,
          ordenMedica: {
            examenProcedimiento: { codigoCUPS: '902210', nombre: 'Hemograma' },
            doctor: { usuario: { nombre: 'Juan', apellido: 'Medico' } }
          }
        },
        // 3. Medicamento
        {
          tipo: 'OrdenMedicamento',
          createdAt: new Date('2025-12-01T12:00:00Z'),
          subtotal: 20000,
          ordenMedicamento: {
            items: [
              {
                producto: { sku: 'CUM-123', nombre: 'Acetaminofen' },
                cantidad: 10,
                precioUnitario: 2000,
                subtotal: 20000
              }
            ],
            doctor: { usuario: { nombre: 'Juan', apellido: 'Medico' } }
          }
        }
      ]
    };

    // Setup Prisma Mock
    prisma.factura.findMany.mockResolvedValue([mockFactura]);

    // Request
    const res = await request(server)
      .post('/facturas/rips/generar')
      .send({ factura_ids: ['factura-1'] });

    // Assertions
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(true);
    
    const rips = res.body.data;
    
    // Validate Header
    expect(rips.numFactura).toBe('F-2025-00001');
    expect(rips.numDocumentoIdObligado).toBeDefined();

    // Validate Users (US)
    expect(rips.usuarios).toHaveLength(1);
    expect(rips.usuarios[0].numDocumentoIdentificacion).toBe('123456789');
    expect(rips.usuarios[0].tipoDocumentoIdentificacion).toBe('CC');

    // Validate Services
    expect(rips.servicios.consultas).toHaveLength(1);
    expect(rips.servicios.consultas[0].codConsulta).toBe('890201');
    
    expect(rips.servicios.procedimientos).toHaveLength(1);
    expect(rips.servicios.procedimientos[0].codProcedimiento).toBe('902210');
    
    expect(rips.servicios.medicamentos).toHaveLength(1);
    expect(rips.servicios.medicamentos[0].nomTecnologiaSalud).toBe('Acetaminofen');
  });

  it('should return error if no invoice IDs provided', async () => {
    const res = await request(server)
      .post('/facturas/rips/generar')
      .send({ factura_ids: [] });

    expect(res.status).toBe(500); // Or 400 depending on implementation
    expect(res.body.message).toMatch(/Debe proporcionar al menos una factura/);
  });
});
