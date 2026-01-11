const quirofanoService = require('../../services/quirofano.service');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrisma = {
    quirofano: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    procedimiento: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('QuirofanoService', () => {
  let prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('createQuirofano', () => {
    const data = {
      nombre: 'Quirofano 1',
      tipo: 'General',
      ubicacion: 'Piso 1'
    };

    it('should create a quirofano successfully', async () => {
      prisma.quirofano.findUnique.mockResolvedValue(null);
      prisma.quirofano.create.mockResolvedValue({ id: '1', ...data });

      const result = await quirofanoService.createQuirofano(data);
      expect(result).toHaveProperty('id', '1');
      expect(prisma.quirofano.create).toHaveBeenCalled();
    });

    it('should throw error if name exists', async () => {
      prisma.quirofano.findUnique.mockResolvedValue({ id: '1', ...data });
      await expect(quirofanoService.createQuirofano(data)).rejects.toThrow('Ya existe un quirófano con este nombre');
    });
  });

  describe('checkAvailability', () => {
    const quirofanoId = 'q1';
    const fechaInicio = new Date('2025-01-20T10:00:00Z');
    const duracion = 60; // 1 hour -> 11:00

    it('should return available if no procedures exist', async () => {
      prisma.procedimiento.findMany.mockResolvedValue([]);
      
      const result = await quirofanoService.checkAvailability(quirofanoId, fechaInicio, duracion);
      expect(result.available).toBe(true);
    });

    it('should return conflict if procedure overlaps', async () => {
      prisma.procedimiento.findMany.mockResolvedValue([
        {
          id: 'p1',
          fechaProgramada: new Date('2025-01-20T10:30:00Z'),
          duracionEstimada: 60 // Ends 11:30. Overlaps with 10:00-11:00
        }
      ]);

      const result = await quirofanoService.checkAvailability(quirofanoId, fechaInicio, duracion);
      expect(result.available).toBe(false);
      expect(result.conflict).toBeDefined();
    });

    it('should return available if procedure is before', async () => {
      prisma.procedimiento.findMany.mockResolvedValue([
        {
          id: 'p1',
          fechaProgramada: new Date('2025-01-20T08:00:00Z'),
          duracionEstimada: 60 // Ends 09:00. No overlap with 10:00
        }
      ]);

      const result = await quirofanoService.checkAvailability(quirofanoId, fechaInicio, duracion);
      expect(result.available).toBe(true);
    });

    it('should return available if procedure is after', async () => {
      prisma.procedimiento.findMany.mockResolvedValue([
        {
          id: 'p1',
          fechaProgramada: new Date('2025-01-20T11:00:00Z'),
          duracionEstimada: 60 // Starts 11:00. No overlap with 10:00-11:00 (assuming inclusive end)
        }
      ]);
      
      // Note: My logic uses start < pEnd && end > pStart.
      // 10:00 < 12:00 (True) && 11:00 > 11:00 (False). So no overlap.
      
      const result = await quirofanoService.checkAvailability(quirofanoId, fechaInicio, duracion);
      expect(result.available).toBe(true);
    });
  });
});
