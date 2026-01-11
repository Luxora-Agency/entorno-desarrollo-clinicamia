const request = require('supertest');
const { serve } = require('@hono/node-server');
const prisma = require('../../db/prisma');

// Ensure Prisma is not mocked
jest.unmock('../../db/prisma');
jest.unmock('@prisma/client');

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    // Inject mock user context
    c.set('user', { id: 'test-admin-id', role: 'ADMIN', nombre: 'Test Admin' });
    await next();
  },
  permissionMiddleware: () => async (c, next) => {
    await next();
  },
  requirePermission: () => async (c, next) => {
    await next();
  }
}));

// Import app (after mocks)
const app = require('../../server');

describe('Quirofano & Procedimiento Integration Tests', () => {
  let server;
  let createdQuirofanoId;
  let createdPacienteId;
  let createdMedicoId;
  let createdProcedimientoId;

  beforeAll(async () => {
    // Start Hono app with node adaptor for supertest
    server = serve({
      fetch: app.fetch,
      port: 0 // Random port
    });

    // Create a dummy doctor
    const uniqueId = Date.now().toString();
    try {
        const medico = await prisma.usuario.create({
            data: {
                email: `medico${uniqueId}@test.com`,
                password: 'hashedpassword',
                nombre: 'Medico',
                apellido: 'Test',
                rol: 'DOCTOR'
            }
        });
        createdMedicoId = medico.id;
    } catch (e) {
        console.error('Error creating medico:', e);
    }

    // Create a dummy patient for procedures
    const uniqueIdPaciente = Date.now().toString();
    try {
      console.log('Creating patient...');
      const paciente = await prisma.paciente.create({
        data: {
          nombre: 'Test',
          apellido: 'Quirofano',
          tipoDocumento: 'CC', // camelCase based on schema
          cedula: `QX-${uniqueIdPaciente}`,
          fechaNacimiento: new Date('1990-01-01'), // camelCase
          genero: 'MASCULINO',
          email: `qx${uniqueIdPaciente}@example.com`,
          telefono: '5551234',
          activo: true
        }
      });
      console.log('Patient created:', paciente);
      if (paciente) {
        createdPacienteId = paciente.id;
      } else {
        console.error('Patient creation returned null/undefined');
      }
    } catch (e) {
      console.error('Error creating patient:', e);
    }
  });

  afterAll(async () => {
    // Cleanup
    if (createdProcedimientoId) {
        await prisma.procedimiento.delete({ where: { id: createdProcedimientoId } }).catch(() => {});
    }
    if (createdQuirofanoId) {
        await prisma.quirofano.delete({ where: { id: createdQuirofanoId } }).catch(() => {});
    }
    if (createdPacienteId) {
        await prisma.paciente.delete({ where: { id: createdPacienteId } }).catch(() => {});
    }
    
    await prisma.$disconnect();
    server.close();
  });

  describe('Quirofano Management', () => {
    it('should create a new quirofano', async () => {
      const res = await request(server)
        .post('/quirofanos')
        .send({
          nombre: 'Quirofano Test Integration',
          tipo: 'General',
          ubicacion: 'Piso 3',
          capacidad: 1
        });

      if (res.status !== 201) {
        console.error('Create Quirofano Failed:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      createdQuirofanoId = res.body.data.id;
    });

    it('should list quirofanos', async () => {
      const res = await request(server).get('/quirofanos');
      expect(res.status).toBe(200);
      expect(res.body.data.quirofanos).toBeDefined();
      expect(res.body.data.quirofanos.length).toBeGreaterThan(0);
      const found = res.body.data.quirofanos.find(q => q.id === createdQuirofanoId);
      expect(found).toBeDefined();
    });
  });

  describe('Procedimiento Scheduling', () => {
    it('should schedule a procedure in the quirofano', async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1); // Tomorrow
      fecha.setHours(10, 0, 0, 0);

      const res = await request(server)
        .post('/procedimientos')
        .send({
          pacienteId: createdPacienteId,
          medicoResponsableId: createdMedicoId,
          nombre: 'Cirugía de Prueba',
          tipo: 'Quirurgico', // Enum value
          tipoCirugia: 'General',
          descripcion: 'Prueba de integración',
          indicacion: 'Dolor agudo',
          fechaProgramada: fecha.toISOString(),
          duracionEstimada: 60,
          quirofanoId: createdQuirofanoId,
          
          // New fields
          prioridad: 'Urgente',
          nivelComplejidad: 'Alta',
          riesgosPotenciales: 'Infección, sangrado',
          tiempoAyuno: 8,
          clasificacionASA: 'II'
          // admisionId is optional now
        });

      if (res.status !== 201) {
          console.error('Create Procedure Failed:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      createdProcedimientoId = res.body.data.id;
    });

    it('should check availability and find conflict', async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1); // Tomorrow
      fecha.setHours(10, 30, 0, 0); // Overlapping time (starts 30 mins into 60 min surgery)

      const res = await request(server)
        .get(`/quirofanos/${createdQuirofanoId}/disponibilidad`)
        .query({
          fechaInicio: fecha.toISOString(),
          duracionMinutos: 60
        });

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
      expect(res.body.data.conflict).toBeDefined();
    });

    it('should check availability for free slot', async () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1); // Tomorrow
      fecha.setHours(12, 0, 0, 0); // After the surgery (10:00 - 11:00)

      const res = await request(server)
        .get(`/quirofanos/${createdQuirofanoId}/disponibilidad`)
        .query({
          fechaInicio: fecha.toISOString(),
          duracionMinutos: 60
        });

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(true);
    });
  });
});
