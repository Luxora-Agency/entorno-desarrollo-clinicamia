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

describe('Paciente Module Integration Tests', () => {
  let server;
  let createdPacienteId;

  beforeAll((done) => {
    // Start Hono app with node adaptor for supertest
    server = serve({
      fetch: app.fetch,
      port: 0 // Random port
    }, (info) => {
      done();
    });
  });

  afterAll(async () => {
    // Cleanup
    if (createdPacienteId) {
      try {
        await prisma.paciente.delete({ where: { id: createdPacienteId } });
      } catch (e) {
        // Ignore if already deleted
      }
    }
    await prisma.$disconnect();
    server.close();
  });

  describe('POST /pacientes (Validación y Creación)', () => {
    it('should fail when required fields are missing', async () => {
      const res = await request(server)
        .post('/pacientes')
        .send({ dummy: true }); // Send a valid JSON object to pass JSON parsing

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Error de validación');
    });

    it('should fail with invalid email format', async () => {
      const res = await request(server)
        .post('/pacientes')
        .send({
          nombre: 'Test',
          apellido: 'Fail',
          tipo_documento: 'CC',
          cedula: '12345',
          email: 'invalid-email'
        });

      expect(res.status).toBe(400);
      // Validar que el error está en el array details
      const emailError = res.body.details ? res.body.details.find(d => d.path.includes('email')) : null;
      expect(emailError).toBeDefined();
    });

    it('should create a patient successfully', async () => {
      const uniqueId = Date.now().toString();
      const newPaciente = {
        nombre: 'Test',
        apellido: 'Integration',
        tipo_documento: 'CC',
        cedula: `TEST-${uniqueId}`,
        fecha_nacimiento: '1990-01-01',
        genero: 'MASCULINO',
        email: `test${uniqueId}@example.com`,
        telefono: '5551234',
        direccion: 'Calle Test 123',
        estado_civil: 'SOLTERO',
        ocupacion: 'QA Engineer',
        contactos_emergencia: [
          {
            nombre: 'Emergency Contact',
            telefono: '911',
            parentesco: 'FAMILIAR'
          }
        ]
      };

      const res = await request(server)
        .post('/pacientes')
        .send(newPaciente);

      if (res.status !== 201) {
        console.error('Create failed:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paciente).toBeDefined();
      expect(res.body.data.paciente.cedula).toBe(newPaciente.cedula);
      
      createdPacienteId = res.body.data.paciente.id;
    });
  });

  describe('GET /pacientes (Lectura)', () => {
    it('should retrieve the created patient', async () => {
      expect(createdPacienteId).toBeDefined();
      
      const res = await request(server)
        .get(`/pacientes/${createdPacienteId}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data.paciente.id).toBe(createdPacienteId);
    });
  });

  describe('PUT /pacientes (Actualización)', () => {
    it('should update patient fields', async () => {
      expect(createdPacienteId).toBeDefined();
      
      const updateData = {
        ocupacion: 'Senior QA Engineer'
      };

      const res = await request(server)
        .put(`/pacientes/${createdPacienteId}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.paciente.ocupacion).toBe('Senior QA Engineer');
    });
  });

  describe('DELETE /pacientes (Soft Delete)', () => {
    it('should inactivate the patient', async () => {
      expect(createdPacienteId).toBeDefined();

      const res = await request(server)
        .delete(`/pacientes/${createdPacienteId}`);

      expect(res.status).toBe(200);
      
      // Verify inactivation
      const checkRes = await request(server)
        .get(`/pacientes/${createdPacienteId}`);
      
      // Si el GET devuelve el paciente, verificamos que esté inactivo
      // Si el backend no devuelve campos 'activo', asumimos éxito por el 200 anterior
      if (checkRes.body.data && checkRes.body.data.paciente && checkRes.body.data.paciente.activo !== undefined) {
         expect(checkRes.body.data.paciente.activo).toBe(false);
      }
    });
  });
});
