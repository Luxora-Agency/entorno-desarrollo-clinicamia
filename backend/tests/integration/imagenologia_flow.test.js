const request = require('supertest');
const { serve } = require('@hono/node-server');
const app = require('../../server'); // Adjust path if needed
const prisma = require('../../db/prisma');

// Fixed IDs
const doctorId = 'doctor-uuid';
const pacienteId = 'paciente-uuid';

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    const user = { 
        id: doctorId, 
        rol: 'DOCTOR', 
        nombre: 'Test',
        apellido: 'Doctor',
        email: 'doctor@test.com' 
    };
    c.set('user', user);
    c.set('jwtPayload', user);
    await next();
  },
  authorize: () => async (c, next) => { await next(); },
  protect: async (c, next) => { await next(); },
  permissionMiddleware: () => async (c, next) => { await next(); },
  roleMiddleware: () => async (c, next) => { await next(); },
  requirePermission: () => async (c, next) => { await next(); }
}));

describe('Imagenologia Flow Integration Test', () => {
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
      jest.clearAllMocks();
  });

  describe('POST /imagenologia', () => {
    it('should create a new imaging study request', async () => {
      const studyData = {
        pacienteId: pacienteId,
        tipoEstudio: 'Radiografía',
        zonaCuerpo: 'Tórax',
        prioridad: 'Normal',
        indicacionClinica: 'Tos persistente',
        observaciones: 'Descartar neumonía'
      };

      // Mock prisma response
      prisma.estudioImagenologia.create.mockResolvedValue({
        id: 'study-uuid',
        ...studyData,
        medicoSolicitanteId: doctorId,
        estado: 'Pendiente',
        fechaSolicitud: new Date().toISOString(),
        paciente: { id: pacienteId, nombre: 'Juan', apellido: 'Perez' },
        medicoSolicitante: { nombre: 'Test', apellido: 'Doctor' }
      });

      const res = await request(server)
        .post('/imagenologia')
        .send(studyData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tipoEstudio).toBe('Radiografía');
      expect(prisma.estudioImagenologia.create).toHaveBeenCalled();
    });

    it('should fail if required fields are missing', async () => {
        const res = await request(server)
          .post('/imagenologia')
          .send({ pacienteId: '123' }); // Missing fields
  
        expect(res.status).toBe(400); // 400 Bad Request? ValidationError returns 400?
        // Service throws ValidationError. Controller/Route catches it.
        // If ValidationError is not mapped to status code, it might be 500.
        // But usually ValidationError has statusCode 400.
        // Let's check 'utils/errors.js'.
    });
  });

  describe('GET /imagenologia', () => {
    it('should return a list of studies', async () => {
      prisma.estudioImagenologia.findMany.mockResolvedValue([
        {
          id: 'study-1',
          tipoEstudio: 'TAC',
          estado: 'Pendiente',
          paciente: { id: 'p1', nombre: 'Ana' },
          medicoSolicitante: { nombre: 'Dr' }
        }
      ]);
      prisma.estudioImagenologia.count.mockResolvedValue(1);

      const res = await request(server)
        .get('/imagenologia');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe('PUT /imagenologia/:id/informe', () => {
    it('should update the report', async () => {
      const reportData = {
        hallazgos: 'Normal',
        conclusion: 'Sin alteraciones',
        recomendaciones: 'Control anual'
      };

      // Mock getById first (service calls it)
      prisma.estudioImagenologia.findUnique.mockResolvedValue({
        id: 'study-uuid',
        estado: 'Pendiente',
        radiologoId: null
      });

      // Mock update
      prisma.estudioImagenologia.update.mockResolvedValue({
        id: 'study-uuid',
        ...reportData,
        estado: 'Completado',
        radiologoId: doctorId,
        paciente: {},
        radiologo: { id: doctorId }
      });

      const res = await request(server)
        .put('/imagenologia/study-uuid/informe')
        .send(reportData);

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('Completado');
      expect(prisma.estudioImagenologia.update).toHaveBeenCalled();
    });
  });
});
