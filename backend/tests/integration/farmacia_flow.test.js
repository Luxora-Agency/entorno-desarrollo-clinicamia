const request = require('supertest');
const { serve } = require('@hono/node-server');
const prisma = require('../../db/prisma');
const { v4: uuidv4 } = require('uuid');

// Fixed IDs for test data
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_PRODUCT_ID = 'product-123';
const TEST_PATIENT_ID = 'patient-123';
const TEST_CATEGORY_ID = 'category-123';

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: async (c, next) => {
    c.set('user', { 
        id: TEST_USER_ID, 
        role: 'ADMIN', 
        nombre: 'Test Admin',
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

// Import app (after mocks)
const app = require('../../server');

describe('Pharmacy & Dispensing Integration Flow (Mocked)', () => {
  let server;
  let testData = {
    user: {
        id: TEST_USER_ID,
        nombre: 'Test',
        apellido: 'Admin',
        email: 'test@clinica.com',
        rol: 'ADMIN'
    },
    producto: {
        id: TEST_PRODUCT_ID,
        nombre: 'Paracetamol',
        sku: 'PARA-500',
        cantidadTotal: 100,
        cantidadConsumida: 0,
        precioVenta: 1000,
        activo: true
    },
    paciente: {
        id: TEST_PATIENT_ID,
        nombre: 'Juan',
        apellido: 'Perez',
        cedula: '12345'
    },
    orden: null // Will be populated
  };

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
    
    // Setup common mocks for validation
    prisma.usuario.findUnique.mockResolvedValue(testData.user);
    prisma.paciente.findUnique.mockResolvedValue(testData.paciente);
    prisma.producto.findUnique.mockResolvedValue(testData.producto);
    
    // Mock Transaction to execute callback immediately
    // prisma.$transaction is already mocked in setup.js to run the callback
  });

  describe('Full Dispensing Cycle', () => {
    it('should create a medication order successfully', async () => {
        const orderData = {
            paciente_id: TEST_PATIENT_ID,
            doctor_id: TEST_USER_ID,
            items: [
                {
                    producto_id: TEST_PRODUCT_ID,
                    cantidad: 5,
                    precio_unitario: 1000,
                    indicaciones: 'Tomar 1 diaria'
                }
            ],
            observaciones: 'Test Order'
        };

        // Mock creation
        const mockCreatedOrder = {
            id: 'orden-1',
            pacienteId: TEST_PATIENT_ID,
            doctorId: TEST_USER_ID,
            estado: 'Pendiente',
            items: [{
                productoId: TEST_PRODUCT_ID,
                cantidad: 5
            }]
        };

        prisma.ordenMedicamento.create.mockResolvedValue(mockCreatedOrder);

        const res = await request(server)
            .post('/ordenes-medicamentos')
            .send(orderData);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.orden.estado).toBe('Pendiente');
        
        testData.orden = mockCreatedOrder;
    });

    it('should fail to dispense if stock is insufficient', async () => {
        // Mock validations for this specific test
        prisma.ordenMedicamento.findUnique.mockResolvedValue({
            ...testData.orden,
            items: [{ productoId: TEST_PRODUCT_ID, cantidad: 500 }] // Huge quantity
        });

        // Mock product with normal stock
        prisma.producto.findUnique.mockResolvedValue(testData.producto); // Stock 100

        const res = await request(server)
            .post(`/ordenes-medicamentos/${testData.orden.id}/administrar`);
            
        // The service logic checks stock: available = total - consumed
        // 100 - 0 = 100. Requesting 500. Should fail.
        
        expect(res.status).toBe(400); 
        expect(res.body.message).toMatch(/Stock insuficiente/);
    });

    it('should dispense the valid order successfully', async () => {
        // Setup mocks for success path
        const orderToDispense = {
            ...testData.orden,
            items: [{ productoId: TEST_PRODUCT_ID, cantidad: 5 }]
        };

        prisma.ordenMedicamento.findUnique.mockResolvedValue(orderToDispense);
        prisma.producto.findUnique.mockResolvedValue(testData.producto);

        // Mock the transaction updates
        // 1. Product update (deduct stock)
        prisma.producto.update.mockResolvedValue({
            ...testData.producto,
            cantidadConsumida: 5
        });

        // 2. Order update (change status)
        prisma.ordenMedicamento.update.mockResolvedValue({
            ...orderToDispense,
            estado: 'Despachada',
            despachadoPor: TEST_USER_ID,
            fechaDespacho: new Date()
        });

        const res = await request(server)
            .post(`/ordenes-medicamentos/${testData.orden.id}/administrar`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.orden.estado).toBe('Despachada');
        
        // Verify transaction was called
        expect(prisma.$transaction).toHaveBeenCalled();
        
        // Verify product update was called with correct increment
        // Logic: increment cantidadConsumida by 5
        expect(prisma.producto.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: TEST_PRODUCT_ID },
            data: { cantidadConsumida: { increment: 5 } }
        }));
    });

    it('should not allow dispensing an already dispensed order', async () => {
        // Mock order as already dispensed
        prisma.ordenMedicamento.findUnique.mockResolvedValue({
            ...testData.orden,
            estado: 'Despachada'
        });

        const res = await request(server)
            .post(`/ordenes-medicamentos/${testData.orden.id}/administrar`);
        
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/ya ha sido despachada/);
    });
  });
});
