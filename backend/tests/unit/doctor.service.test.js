const doctorService = require('../../services/doctor.service');
const { PrismaClient } = require('@prisma/client');
const { ValidationError, NotFoundError, AppError } = require('../../utils/errors');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrisma = {
    usuario: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    doctor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    especialidad: {
      count: jest.fn(),
    },
    doctorEspecialidad: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mPrisma)),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('DoctorService', () => {
  let prisma;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('crear', () => {
    const mockData = {
      nombre: 'Juan',
      apellido: 'Perez',
      cedula: '1234567890',
      email: 'juan@test.com',
      telefono: '3001234567',
      especialidades_ids: ['esp-1'],
    };

    it('should throw ValidationError if email or cedula exists', async () => {
      prisma.usuario.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(doctorService.crear(mockData)).rejects.toThrow(ValidationError);
    });

    it('should create a doctor successfully', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      prisma.especialidad.count.mockResolvedValue(1);
      
      const mockUsuario = { id: 'user-1', ...mockData };
      const mockDoctor = { id: 'doc-1', usuarioId: 'user-1' };
      
      prisma.usuario.create.mockResolvedValue(mockUsuario);
      prisma.doctor.create.mockResolvedValue(mockDoctor);
      
      // Mock obtenerPorId response (since crear calls it at the end)
      prisma.doctor.findUnique.mockResolvedValue({
        ...mockDoctor,
        usuario: mockUsuario,
        especialidades: [{ especialidad: { id: 'esp-1', titulo: 'General' } }]
      });

      const result = await doctorService.crear(mockData);

      expect(result).toHaveProperty('id', 'doc-1');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.usuario.create).toHaveBeenCalled();
      expect(prisma.doctor.create).toHaveBeenCalled();
      expect(prisma.doctorEspecialidad.createMany).toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('should return list of doctors', async () => {
      const mockDoctores = [
        {
          id: 'doc-1',
          usuarioId: 'user-1',
          usuario: { nombre: 'Juan', apellido: 'Perez', cedula: '123', email: 'j@t.com', telefono: '123', activo: true },
          especialidades: [],
          createdAt: new Date(),
        }
      ];

      prisma.doctor.findMany.mockResolvedValue(mockDoctores);
      prisma.doctor.count.mockResolvedValue(1);

      const result = await doctorService.listar({});

      expect(result.doctores).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('actualizar', () => {
    const updateData = {
      nombre: 'Juan Updated',
      horarios: { Lunes: { start: '8:00', end: '12:00' } }
    };

    it('should throw NotFoundError if doctor does not exist', async () => {
      prisma.doctor.findUnique.mockResolvedValue(null);

      await expect(doctorService.actualizar('invalid-id', updateData)).rejects.toThrow(NotFoundError);
    });

    it('should update doctor successfully', async () => {
      prisma.doctor.findUnique.mockResolvedValue({ id: 'doc-1', usuarioId: 'user-1' });
      
      // Mock obtenerPorId for return
      prisma.doctor.findUnique.mockResolvedValueOnce({ id: 'doc-1', usuarioId: 'user-1' }) // first call in check
        .mockResolvedValueOnce({ // second call in obtenerPorId
           id: 'doc-1', 
           usuario: { nombre: 'Juan Updated' }, 
           especialidades: [] 
        });

      const result = await doctorService.actualizar('doc-1', updateData);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.usuario.update).toHaveBeenCalled();
      expect(prisma.doctor.update).toHaveBeenCalled();
    });
  });
});
