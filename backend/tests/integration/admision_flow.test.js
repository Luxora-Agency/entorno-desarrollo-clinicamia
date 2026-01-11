const request = require('supertest');
const { serve } = require('@hono/node-server');
const app = require('../../server');
const prisma = require('../../db/prisma');

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    // We will inject the user ID later or rely on the test setting it up
    // But since this runs before beforeAll, we need a static mock or dynamic.
    // However, for integration tests, we can just let the real middleware run if we could generate a token,
    // OR we mock it to simply pass.
    // The previous test mocked it to inject a user object.
    // We need to match the ID we create in beforeAll.
    // Since we can't easily share state between the mock factory and the test,
    // we'll assume the service uses the ID passed in the body for `responsableIngreso`
    // and the middleware just needs to populate `c.get('user')` for any logging/audit if used.
    // Our updated service uses `data.responsableIngreso` from body.
    
    c.set('user', { id: 'mock-user-id', role: 'ADMIN', nombre: 'Test Admin' });
    await next();
  },
  permissionMiddleware: () => async (c, next) => {
    await next();
  }
}));

describe('Admision Module Integration Tests', () => {
  let server;
  let testUsuarioId;
  let testPacienteId;
  let testUnidadId;
  let testCamaId;
  let testAdmisionId;

  beforeAll(async () => {
    // Start Server
    server = serve({
      fetch: app.fetch,
      port: 0
    }, (info) => {});

    // 1. Create User (Real user needed for FK constraints)
    try {
      const user = await prisma.usuario.create({
        data: {
          nombre: 'Test',
          apellido: 'Admin',
          email: `admin-${Date.now()}@test.com`,
          password: 'hash',
          rol: 'ADMIN'
        }
      });
      testUsuarioId = user.id;

      // 2. Create Paciente
      const paciente = await prisma.paciente.create({
        data: {
          nombre: 'Paciente',
          apellido: 'Test',
          tipoDocumento: 'CC',
          cedula: `TEST-${Date.now()}`,
          fechaNacimiento: new Date('1990-01-01'),
          genero: 'MASCULINO',
          email: `paciente-${Date.now()}@test.com`,
          telefono: '1234567890',
          direccion: 'Test Address',
          estadoCivil: 'SOLTERO',
          ocupacion: 'Test'
        }
      });
      testPacienteId = paciente.id;

      // 3. Create Unidad
      const unidad = await prisma.unidad.create({
        data: {
          nombre: `Unidad Test ${Date.now()}`,
          tipo: 'HOSPITALIZACION',
          capacidad: 10,
          activo: true
        }
      });
      testUnidadId = unidad.id;

      // 4. Create Habitacion & Cama
      const habitacion = await prisma.habitacion.create({
        data: {
          numero: `101-${Date.now().toString().slice(-4)}`,
          unidadId: testUnidadId
        }
      });

      const cama = await prisma.cama.create({
        data: {
          numero: `101-A-${Date.now().toString().slice(-4)}`,
          estado: 'Disponible',
          habitacionId: habitacion.id
        }
      });
      testCamaId = cama.id;

    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (testAdmisionId) await prisma.admision.delete({ where: { id: testAdmisionId } });
      if (testCamaId) await prisma.cama.delete({ where: { id: testCamaId } });
      if (testUnidadId) await prisma.unidad.delete({ where: { id: testUnidadId } });
      if (testPacienteId) await prisma.paciente.delete({ where: { id: testPacienteId } });
      if (testUsuarioId) await prisma.usuario.delete({ where: { id: testUsuarioId } });
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
    await prisma.$disconnect();
    server.close();
  });

  describe('POST /admisiones', () => {
    it('should fail when required fields are missing', async () => {
      const res = await request(server)
        .post('/admisiones')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Error de validación');
    });

    it('should create an admission and occupy the bed', async () => {
      const res = await request(server)
        .post('/admisiones')
        .send({
          pacienteId: testPacienteId,
          unidadId: testUnidadId,
          camaId: testCamaId,
          motivoIngreso: 'Urgencia Test',
          diagnosticoIngreso: 'Fiebre',
          responsableIngreso: testUsuarioId
        });

      if (res.status !== 201) {
        console.error('Create failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
      expect(res.body.data.admision).toBeDefined();
      expect(res.body.data.admision.id).toBeDefined();
      
      testAdmisionId = res.body.data.admision.id;

      // Verify Bed Status
      const cama = await prisma.cama.findUnique({ where: { id: testCamaId } });
      expect(cama.estado).toBe('Ocupada');
    });
  });

  describe('GET /admisiones', () => {
    it('should list admissions including the new one', async () => {
      const res = await request(server).get('/admisiones');
      expect(res.status).toBe(200);
      
      const found = res.body.data.admisiones.find(a => a.id === testAdmisionId);
      expect(found).toBeDefined();
      expect(found.responsableIngresoInfo).toBeDefined();
      expect(found.responsableIngresoInfo.nombre).toContain('Test Admin');
    });
  });

  describe('POST /admisiones/:id/administrar (Egreso)', () => {
    it('should discharge the patient and free the bed', async () => {
      const res = await request(server)
        .post(`/admisiones/${testAdmisionId}/administrar`)
        .send({
          diagnosticoEgreso: 'Recuperado',
          responsableEgreso: testUsuarioId
        });

      expect(res.status).toBe(200);
      
      // Verify Bed Status Released
      const cama = await prisma.cama.findUnique({ where: { id: testCamaId } });
      expect(cama.estado).toBe('Disponible');

      // Verify Admission Status
      const admision = await prisma.admision.findUnique({ where: { id: testAdmisionId } });
      expect(admision.estado).toBe('Egresada');
    });
  });
});
