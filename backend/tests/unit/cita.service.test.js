const { ValidationError, NotFoundError } = require('../../utils/errors');
const { ZodError } = require('zod');

// Mock Prisma singleton before importing the service
const mockPrisma = {
  cita: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  factura: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  facturaItem: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  pago: {
    create: jest.fn(),
  },
  bloqueoAgenda: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

jest.mock('../../db/prisma', () => mockPrisma);

// Import service after mocking
const citaService = require('../../services/cita.service');

const { v4: uuidv4 } = require('uuid');

describe('CitaService', () => {
  let prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = mockPrisma;
    // Default mock: no bloqueos de agenda
    prisma.bloqueoAgenda.findMany.mockResolvedValue([]);
    // Default mock: audit log
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
  });

  describe('create', () => {
    const validCitaData = {
      paciente_id: uuidv4(),
      doctor_id: uuidv4(),
      fecha: '2025-01-20',
      hora: '10:00',
      motivo: 'Consulta General',
      duracion_minutos: 30,
      costo: 50000,
      estado: 'Programada'
    };

    it('should create a cita successfully', async () => {
      // Mock availability check (no overlapping citas)
      prisma.cita.findMany.mockResolvedValue([]);
      
      // Mock creation
      prisma.cita.create.mockResolvedValue({
        id: 'cita-1',
        ...validCitaData,
        fecha: new Date('2025-01-20T00:00:00.000Z'),
        hora: new Date('1970-01-01T10:00:00.000Z')
      });

      // Mock factura creation
      prisma.factura.findFirst.mockResolvedValue(null);
      prisma.factura.create.mockResolvedValue({ id: 'factura-1' });

      const result = await citaService.create(validCitaData);

      expect(result).toHaveProperty('id', 'cita-1');
      expect(prisma.cita.create).toHaveBeenCalled();
      expect(prisma.factura.create).toHaveBeenCalled();
    });

    it('should throw validation error if fecha/hora are missing for Programada', async () => {
      const invalidData = {
        ...validCitaData,
        fecha: null,
        hora: null,
        estado: 'Programada'
      };

      await expect(citaService.create(invalidData)).rejects.toThrow(ZodError);
    });

    it('should allow missing fecha/hora for PorAgendar', async () => {
      const porAgendarData = {
        paciente_id: uuidv4(),
        motivo: 'Examen pendiente',
        costo: 0,
        estado: 'PorAgendar'
      };

      prisma.cita.create.mockResolvedValue({
        id: 'cita-2',
        ...porAgendarData
      });

      const result = await citaService.create(porAgendarData);

      expect(result).toHaveProperty('id', 'cita-2');
      // Should not check availability if no date provided
      expect(prisma.cita.findMany).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if doctor is not available', async () => {
      // Mock existing overlapping cita
      prisma.cita.findMany.mockResolvedValue([
        {
          id: 'existing-cita',
          hora: new Date('1970-01-01T10:00:00.000Z'),
          duracionMinutos: 30
        }
      ]);

      await expect(citaService.create(validCitaData)).rejects.toThrow(ValidationError);
      await expect(citaService.create(validCitaData)).rejects.toThrow(/no está disponible/);
    });
  });

  describe('update', () => {
    const citaId = 'cita-1';
    const updateData = {
      fecha: '2025-01-21',
      hora: '11:00'
    };

    const existingCita = {
      id: citaId,
      doctorId: uuidv4(),
      fecha: new Date('2025-01-20T00:00:00.000Z'),
      hora: new Date('1970-01-01T10:00:00.000Z'),
      duracionMinutos: 30,
      estado: 'Programada',
      costo: 50000
    };

    it('should update cita successfully', async () => {
      prisma.cita.findUnique.mockResolvedValue(existingCita);
      prisma.cita.findMany.mockResolvedValue([]); // No overlaps
      prisma.cita.update.mockResolvedValue({ ...existingCita, ...updateData });

      const result = await citaService.update(citaId, updateData);

      expect(prisma.cita.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if cita does not exist', async () => {
      prisma.cita.findUnique.mockResolvedValue(null);

      await expect(citaService.update('non-existent', updateData)).rejects.toThrow(NotFoundError);
    });

    it('should check availability when changing date/time', async () => {
      prisma.cita.findUnique.mockResolvedValue(existingCita);
      
      // Overlap on new time
      prisma.cita.findMany.mockResolvedValue([
        {
          id: 'other-cita',
          hora: new Date('1970-01-01T11:00:00.000Z'),
          duracionMinutos: 30
        }
      ]);

      await expect(citaService.update(citaId, updateData)).rejects.toThrow(ValidationError);
    });
  });

  describe('checkAvailability', () => {
    it('should return true if no overlaps', async () => {
      prisma.cita.findMany.mockResolvedValue([]);
      
      const result = await citaService.checkAvailability('doc-1', '2025-01-20', '10:00', 30);
      expect(result).toBe(true);
    });

    it('should return false if overlap exists', async () => {
      prisma.cita.findMany.mockResolvedValue([
        {
          id: 'existing',
          hora: new Date('1970-01-01T10:15:00.000Z'), // Starts 15 mins later
          duracionMinutos: 30
        }
      ]);
      
      // New cita 10:00 - 10:30. Existing 10:15 - 10:45. Overlap!
      const result = await citaService.checkAvailability('doc-1', '2025-01-20', '10:00', 30);
      expect(result).toBe(false);
    });

    it('should ignore the cita being updated (excludeCitaId)', async () => {
      prisma.cita.findMany.mockResolvedValue([
        // findMany should filter out excludeCitaId via query, but since we mock return value:
        // We simulate that the DB returns nothing because the query filtered it out
      ]);
      
      // If we manually verify the query args:
      await citaService.checkAvailability('doc-1', '2025-01-20', '10:00', 30, 'my-id');
      
      expect(prisma.cita.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'my-id' }
        })
      }));
    });
  });
});
