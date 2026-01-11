const request = require('supertest');
const { serve } = require('@hono/node-server');
const prisma = require('../../db/prisma');
const { v4: uuidv4 } = require('uuid');

// Fixed IDs for test data - Valid UUIDs
const mockDoctorId = '123e4567-e89b-12d3-a456-426614174000';
const mockPatientId = '123e4567-e89b-12d3-a456-426614174001';
const mockCitaId = '123e4567-e89b-12d3-a456-426614174002';

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    c.set('user', { 
        id: '123e4567-e89b-12d3-a456-426614174000', // Hardcoded here to avoid hoisting issues
        rol: 'DOCTOR', 
        nombre: 'Dr. Test',
        apellido: 'Medico',
        email: 'doctor@clinica.com' 
    });
    await next();
  },
  permissionMiddleware: () => async (c, next) => { await next(); },
  requirePermission: () => async (c, next) => { await next(); },
  roleMiddleware: () => async (c, next) => { await next(); }
}));

// Mock Audit Service (so we can check if it's called, although we test the direct prisma call)
jest.mock('../../services/auditoria.service', () => ({
    registrarAccion: jest.fn()
}));

// Mock Digital Signature Service
jest.mock('../../services/firmaDigital.service', () => ({
    crearFirma: jest.fn().mockReturnValue({
        firmaDigital: 'mock-signature-123',
        hashRegistro: 'mock-hash-123',
        fechaFirma: new Date()
    })
}));

const app = require('../../server');

describe('HCE & Consultation Integration Flow (Mocked)', () => {
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
    
    // Default mocks
    prisma.evolucionClinica.create.mockResolvedValue({
        id: 'evolucion-1',
        pacienteId: mockPatientId,
        citaId: mockCitaId,
        doctorId: mockDoctorId,
        subjetivo: 'Patient complains of headache',
        objetivo: 'BP 120/80',
        analisis: 'Tension headache',
        plan: 'Paracetamol',
        fechaEvolucion: new Date()
    });

    prisma.evolucionClinica.update.mockResolvedValue({
        id: 'evolucion-1',
        firmada: true,
        firmaDigital: 'mock-signature-123',
        hashRegistro: 'mock-hash-123'
    });

    prisma.cita.update.mockResolvedValue({
        id: mockCitaId,
        estado: 'Completada'
    });
  });

  describe('Finalize Consultation Flow', () => {
    it('should successfully finalize a consultation with SOAP, Diagnosis, and Vitals', async () => {
        const consultationData = {
            citaId: mockCitaId,
            pacienteId: mockPatientId,
            doctorId: mockDoctorId,
            soap: {
                subjetivo: 'Patient complains of headache',
                objetivo: 'BP 120/80',
                analisis: 'Tension headache',
                plan: 'Paracetamol 500mg'
            },
            vitales: {
                presionSistolica: 120,
                presionDiastolica: 80,
                temperatura: 36.5,
                frecuenciaCardiaca: 70
            },
            diagnostico: {
                codigoCIE11: '8A80',
                descripcionCIE11: 'Migraine',
                tipoDiagnostico: 'Principal',
                observaciones: 'Chronic'
            },
            alertas: {
                tipoAlerta: 'Alergia',
                titulo: 'Penicillin',
                descripcion: 'Rash',
                severidad: 'Alta'
            }
        };

        const res = await request(server)
            .post('/consultas/finalizar')
            .send(consultationData);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify SOAP creation
        expect(prisma.evolucionClinica.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                pacienteId: mockPatientId,
                citaId: mockCitaId,
                subjetivo: consultationData.soap.subjetivo
            })
        }));

        // Verify Digital Signature Update
        expect(prisma.evolucionClinica.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'evolucion-1' },
            data: expect.objectContaining({
                firmada: true,
                hashRegistro: 'mock-hash-123'
            })
        }));

        // Verify Audit Log Creation
        expect(prisma.auditoriaHCE.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                entidad: 'EvolucionClinica',
                accion: 'Creacion_Firma',
                usuarioId: mockDoctorId
            })
        }));

        // Verify Vitals Creation
        expect(prisma.signoVital.create).toHaveBeenCalled();

        // Verify Diagnosis Creation
        expect(prisma.diagnosticoHCE.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                codigoCIE11: '8A80'
            })
        }));

        // Verify Alert Creation
        expect(prisma.alertaClinica.create).toHaveBeenCalled();

        // Verify Appointment Status Update
        expect(prisma.cita.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: mockCitaId },
            data: { estado: 'Completada' }
        }));
    });

    it('should fail if SOAP data is missing', async () => {
        const invalidData = {
            citaId: mockCitaId,
            pacienteId: mockPatientId,
            doctorId: mockDoctorId,
            // Missing SOAP
        };

        const res = await request(server)
            .post('/consultas/finalizar')
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/SOAP son obligatorios/);
    });
  });
});
