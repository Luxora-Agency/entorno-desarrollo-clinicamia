const productoService = require('../../services/producto.service');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { ZodError } = require('zod');

// Mock db/prisma
jest.mock('../../db/prisma', () => ({
  producto: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  paciente: {
    findUnique: jest.fn(),
  }
}));

const prisma = require('../../db/prisma');

describe('ProductoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
      it('should return filtered products', async () => {
          prisma.producto.findMany.mockResolvedValue([
              { id: '1', nombre: 'Paracetamol', categoriaId: 'cat1' }
          ]);
          prisma.producto.count.mockResolvedValue(1);

          const result = await productoService.getAll({ search: 'Paracetamol', categoriaId: 'cat1' });
          expect(result).toHaveLength(1);
          expect(result[0].nombre).toBe('Paracetamol');
          
          expect(prisma.producto.findMany).toHaveBeenCalledWith(expect.objectContaining({
              where: expect.objectContaining({
                  OR: expect.arrayContaining([
                      { nombre: { contains: 'Paracetamol', mode: 'insensitive' } }
                  ]),
                  categoriaId: 'cat1'
              })
          }));
      });
  });

  describe('create', () => {
    const validProductoData = {
      nombre: 'Paracetamol',
      categoriaId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      sku: 'PAR-500',
      precioVenta: 5000,
      cantidadTotal: 100,
      cantidadMinAlerta: 10,
      activo: true,
      requiereReceta: false
    };

    it('should create a producto successfully', async () => {
      prisma.producto.findUnique.mockResolvedValue(null); // SKU check
      prisma.producto.create.mockResolvedValue({
        id: 'prod-1',
        ...validProductoData
      });

      const result = await productoService.create(validProductoData);

      expect(result).toHaveProperty('id', 'prod-1');
      expect(prisma.producto.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          nombre: 'Paracetamol',
          sku: 'PAR-500'
        })
      }));
    });

    it('should throw validation error if required fields are missing', async () => {
      const invalidData = {
        nombre: 'Paracetamol'
        // Missing sku, categoriaId, etc.
      };

      // Since we added Zod validation in the service (planned), this should throw
      await expect(productoService.create(invalidData)).rejects.toThrow();
    });
  });

  describe('checkStock', () => {
    it('should return true if enough stock', async () => {
        // We will implement this method in the service
        prisma.producto.findUnique.mockResolvedValue({
            id: 'prod-1',
            cantidadTotal: 10,
            cantidadConsumida: 5
        });

        // 10 - 5 = 5 available. Request 2.
        const result = await productoService.verificarStock('prod-1', 2);
        expect(result).toBe(true);
    });

    it('should return false if not enough stock', async () => {
        prisma.producto.findUnique.mockResolvedValue({
            id: 'prod-1',
            cantidadTotal: 10,
            cantidadConsumida: 9
        });

        // 10 - 9 = 1 available. Request 2.
        const result = await productoService.verificarStock('prod-1', 2);
        expect(result).toBe(false);
    });
  });

  describe('verificarInteracciones', () => {
      it('should detect interactions based on description', async () => {
          prisma.producto.findMany.mockResolvedValue([
              { id: '1', nombre: 'Med A', descripcion: 'Interaccion con Med B' },
              { id: '2', nombre: 'Med B', principioActivo: 'Med B' }
          ]);

          const alertas = await productoService.verificarInteracciones(['1', '2']);
          expect(alertas).toHaveLength(1);
          expect(alertas[0].tipo).toBe('interaccion');
      });
  });
});
