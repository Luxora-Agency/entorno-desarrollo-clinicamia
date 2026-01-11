
const request = require('supertest');
const { serve } = require('@hono/node-server');

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    c.set('user', { 
        id: 'user-123', 
        role: 'ADMIN', 
        nombre: 'Test User',
        email: 'test@clinica.com' 
    });
    await next();
  },
  permissionMiddleware: () => async (c, next) => {
    await next();
  },
  requirePermission: () => async (c, next) => {
    await next();
  },
  roleMiddleware: () => async (c, next) => {
    await next();
  }
}));

// Mock Prisma
jest.mock('../../db/prisma', () => {
  const mockPrisma = {
    ticketSoporte: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pQRS: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
  };
  mockPrisma.$transaction = jest.fn((callback) => callback(mockPrisma));
  return mockPrisma;
});

const prisma = require('../../db/prisma');

const app = require('../../server');

describe('Soporte & Tickets Integration Flow', () => {
  let server;

  beforeAll(async () => {
    server = serve({
      fetch: app.fetch,
      port: 0
    });
  });

  afterAll(async () => {
    if (server) server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tickets Management', () => {
    it('should create a ticket linked to admission successfully', async () => {
      const ticketData = {
        asunto: 'Error en HCE',
        descripcion: 'No puedo ver la evolución',
        categoria: 'HCE',
        prioridad: 'ALTA',
        usuarioReportaId: 'user-123',
        admisionId: 'adm-123'
      };

      const createdTicket = { id: 'ticket-1', ...ticketData, estado: 'ABIERTO', createdAt: new Date() };
      prisma.ticketSoporte.create.mockResolvedValue(createdTicket);

      const res = await request(server)
        .post('/tickets')
        .send(ticketData);

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(expect.objectContaining({
        id: 'ticket-1',
        asunto: 'Error en HCE',
        admisionId: 'adm-123'
      }));
      expect(prisma.ticketSoporte.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          asunto: 'Error en HCE',
          admisionId: 'adm-123'
        })
      });
    });

    it('should get tickets with filters', async () => {
      const mockTickets = [
        { id: 'ticket-1', asunto: 'Test 1' },
        { id: 'ticket-2', asunto: 'Test 2' }
      ];
      prisma.ticketSoporte.findMany.mockResolvedValue(mockTickets);
      prisma.ticketSoporte.count.mockResolvedValue(2);

      const res = await request(server).get('/tickets?estado=ABIERTO');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(prisma.ticketSoporte.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ estado: 'ABIERTO' })
      }));
    });

    it('should update ticket status', async () => {
      const ticketId = 'ticket-1';
      const updateData = { estado: 'RESUELTO', solucion: 'Reiniciado servicio' };
      
      prisma.ticketSoporte.findUnique.mockResolvedValue({ id: ticketId, estado: 'ABIERTO' });
      prisma.ticketSoporte.update.mockResolvedValue({ id: ticketId, ...updateData });

      const res = await request(server)
        .put(`/tickets/${ticketId}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('RESUELTO');
      expect(prisma.ticketSoporte.update).toHaveBeenCalled();
    });
  });

  describe('PQRS HCE Integration', () => {
    it('should create PQRS linked to Cita', async () => {
      const pqrsData = {
        tipo: 'QUEJA',
        asunto: 'Demora en atención',
        descripcion: 'El doctor llegó tarde',
        pacienteId: 'pat-123',
        citaId: 'cita-123',
        esAnonimo: false
      };

      const createdPQRS = { id: 'pqrs-1', ...pqrsData, estado: 'Radicada' };
      prisma.pQRS.create.mockResolvedValue(createdPQRS);

      const res = await request(server)
        .post('/pqrs')
        .send(pqrsData);

      expect(res.status).toBe(201);
      expect(res.body.data.pqrs.citaId).toBe('cita-123');
      expect(prisma.pQRS.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          citaId: 'cita-123'
        })
      }));
    });
  });
});
