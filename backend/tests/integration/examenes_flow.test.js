const request = require('supertest');
const { serve } = require('@hono/node-server');

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    // Inject mock user context
    c.set('user', { id: 'test-admin', role: 'ADMIN', nombre: 'Test Admin' });
    await next();
  },
  permissionMiddleware: () => async (c, next) => {
    await next();
  }
}));

// Import app (after mocks)
const app = require('../../server');
// Import Prisma for cleanup
const prisma = require('../../db/prisma');

describe('Examenes Module Integration Tests', () => {
  let server;
  let createdExamenId;
  let cupsCode = '902207-' + Date.now(); // Unique CUPS code for testing

  beforeAll(async () => {
    // Start Hono app with node adaptor for supertest
    await new Promise((resolve) => {
      server = serve({
        fetch: app.fetch,
        port: 0 // Random port
      }, (info) => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Cleanup
    if (createdExamenId) {
      try {
        await prisma.examenProcedimiento.delete({ where: { id: createdExamenId } });
      } catch (e) {
        // Ignore if already deleted
      }
    }

    await prisma.$disconnect();
    server.close();
  });

  describe('POST /examenes-procedimientos (Creación)', () => {
    it('should fail when required fields are missing', async () => {
      const res = await request(server)
        .post('/examenes-procedimientos')
        .send({ nombre: 'Hemograma' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Campos requeridos');
    });

    it('should create an exam with CUPS successfully', async () => {
      const newExam = {
        tipo: 'Procedimiento',
        nombre: 'Hemograma Completo Test',
        codigoCUPS: cupsCode,
        codigoCIE11: 'SA00',
        duracionMinutos: 30,
        costoBase: 50000,
        descripcion: 'Test description',
        estado: 'Activo'
      };

      const res = await request(server)
        .post('/examenes-procedimientos')
        .send(newExam);

      if (res.status !== 201) {
        console.error('Create exam failed:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item).toBeDefined();
      expect(res.body.data.item.codigoCUPS).toBe(cupsCode);
      
      createdExamenId = res.body.data.item.id;
    });

    it('should fail to create duplicate CUPS', async () => {
      const duplicateExam = {
        tipo: 'Procedimiento',
        nombre: 'Duplicate CUPS Test',
        codigoCUPS: cupsCode,
        duracionMinutos: 30,
        costoBase: 50000
      };

      const res = await request(server)
        .post('/examenes-procedimientos')
        .send(duplicateExam);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ya está registrado');
    });
  });

  describe('GET /examenes-procedimientos (Búsqueda)', () => {
    it('should search by CUPS code', async () => {
      const res = await request(server)
        .get(`/examenes-procedimientos?search=${cupsCode}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].codigoCUPS).toBe(cupsCode);
    });
  });

  describe('PUT /examenes-procedimientos/:id (Actualización)', () => {
    it('should update CIE-11 code', async () => {
      expect(createdExamenId).toBeDefined();
      
      const updateData = {
        codigoCIE11: 'SA01'
      };

      const res = await request(server)
        .put(`/examenes-procedimientos/${createdExamenId}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.item.codigoCIE11).toBe('SA01');
    });
  });

  describe('DELETE /examenes-procedimientos/:id (Eliminación)', () => {
    it('should delete the exam', async () => {
      expect(createdExamenId).toBeDefined();

      const res = await request(server)
        .delete(`/examenes-procedimientos/${createdExamenId}`);

      expect(res.status).toBe(200);
      
      // Verify deletion
      const checkRes = await request(server)
        .get(`/examenes-procedimientos/${createdExamenId}`);
      
      expect(checkRes.status).toBe(404);
    });
  });
});
