/**
 * Tests para EmpleadoService - Módulo Talento Humano
 */
const prisma = require('../../../db/prisma');
const empleadoService = require('../../../services/talento-humano/empleado.service');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

describe('EmpleadoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('debe listar empleados sin filtros', async () => {
      const mockEmpleados = [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', estado: 'ACTIVO' },
        { id: '2', nombre: 'María', apellido: 'García', estado: 'ACTIVO' }
      ];

      prisma.tHEmpleado.findMany.mockResolvedValue(mockEmpleados);
      prisma.tHEmpleado.count.mockResolvedValue(2);

      const result = await empleadoService.list({});

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalled();
      expect(prisma.tHEmpleado.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por estado', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);
      prisma.tHEmpleado.count.mockResolvedValue(0);

      await empleadoService.list({ estado: 'ACTIVO' });

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'ACTIVO' })
        })
      );
    });

    it('debe filtrar por departamentoId', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);
      prisma.tHEmpleado.count.mockResolvedValue(0);

      await empleadoService.list({ departamentoId: 'dep-123' });

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departamentoId: 'dep-123' })
        })
      );
    });

    it('debe filtrar por cargoId', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);
      prisma.tHEmpleado.count.mockResolvedValue(0);

      await empleadoService.list({ cargoId: 'cargo-123' });

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cargoId: 'cargo-123' })
        })
      );
    });

    it('debe filtrar por tipoEmpleado', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);
      prisma.tHEmpleado.count.mockResolvedValue(0);

      await empleadoService.list({ tipoEmpleado: 'MEDICO' });

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipoEmpleado: 'MEDICO' })
        })
      );
    });

    it('debe buscar por nombre, apellido, email o documento', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);
      prisma.tHEmpleado.count.mockResolvedValue(0);

      await empleadoService.list({ search: 'Juan' });

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nombre: { contains: 'Juan', mode: 'insensitive' } }),
              expect.objectContaining({ apellido: { contains: 'Juan', mode: 'insensitive' } }),
              expect.objectContaining({ email: { contains: 'Juan', mode: 'insensitive' } }),
              expect.objectContaining({ documento: { contains: 'Juan' } })
            ])
          })
        })
      );
    });

    it('debe paginar correctamente', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);
      prisma.tHEmpleado.count.mockResolvedValue(100);

      const result = await empleadoService.list({ page: 2, limit: 10 });

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(10);
    });
  });

  describe('getById', () => {
    it('debe obtener empleado por ID', async () => {
      const mockEmpleado = {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        cargo: { id: 'cargo-1', nombre: 'Médico' },
        jefeDirecto: { id: '2', nombre: 'Director', apellido: 'General' }
      };

      prisma.tHEmpleado.findUnique.mockResolvedValue(mockEmpleado);

      const result = await empleadoService.getById('1');

      expect(prisma.tHEmpleado.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          cargo: true,
          jefeDirecto: expect.any(Object),
          subordinados: expect.any(Object),
          usuario: expect.any(Object)
        })
      });
      expect(result).toEqual(mockEmpleado);
    });

    it('debe lanzar NotFoundError si el empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(empleadoService.getById('999')).rejects.toThrow(NotFoundError);
      await expect(empleadoService.getById('999')).rejects.toThrow('Empleado no encontrado');
    });
  });

  describe('getExpediente', () => {
    it('debe obtener expediente completo del empleado', async () => {
      const mockExpediente = {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        cargo: { nombre: 'Médico' },
        contratos: [],
        movimientos: [],
        documentos: [],
        evaluacionesRecibidas: [],
        capacitaciones: [],
        vacaciones: [],
        permisos: [],
        reconocimientos: [],
        objetivos: []
      };

      prisma.tHEmpleado.findUnique.mockResolvedValue(mockExpediente);

      const result = await empleadoService.getExpediente('1');

      expect(prisma.tHEmpleado.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          cargo: true,
          jefeDirecto: expect.any(Object),
          contratos: expect.any(Object),
          movimientos: expect.any(Object),
          documentos: expect.any(Object),
          evaluacionesRecibidas: expect.any(Object),
          capacitaciones: expect.any(Object),
          vacaciones: expect.any(Object),
          permisos: expect.any(Object),
          reconocimientos: expect.any(Object),
          objetivos: expect.any(Object)
        })
      });
      expect(result).toEqual(mockExpediente);
    });

    it('debe lanzar NotFoundError si el empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(empleadoService.getExpediente('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const validData = {
      documento: '12345678',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      telefono: '3001234567',
      cargoId: 'cargo-1'
    };

    it('debe crear un empleado correctamente', async () => {
      const mockCreatedEmpleado = { id: '1', ...validData };

      prisma.tHEmpleado.findUnique.mockResolvedValue(null);
      prisma.tHCargo.findUnique.mockResolvedValue({ id: 'cargo-1', nombre: 'Médico' });
      prisma.tHEmpleado.create.mockResolvedValue(mockCreatedEmpleado);

      const result = await empleadoService.create(validData);

      expect(prisma.tHEmpleado.findUnique).toHaveBeenCalledWith({
        where: { documento: '12345678' }
      });
      expect(prisma.tHEmpleado.create).toHaveBeenCalledWith({
        data: validData,
        include: { cargo: true }
      });
      expect(result).toEqual(mockCreatedEmpleado);
    });

    it('debe lanzar ValidationError si el documento ya existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: '1', documento: '12345678' });

      await expect(empleadoService.create(validData)).rejects.toThrow(ValidationError);
      await expect(empleadoService.create(validData)).rejects.toThrow('Ya existe un empleado con este documento');
    });

    it('debe lanzar ValidationError si el cargo no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);
      prisma.tHCargo.findUnique.mockResolvedValue(null);

      await expect(empleadoService.create(validData)).rejects.toThrow(ValidationError);
      await expect(empleadoService.create(validData)).rejects.toThrow('Cargo no encontrado');
    });

    it('debe crear empleado sin cargoId', async () => {
      const dataWithoutCargo = { ...validData };
      delete dataWithoutCargo.cargoId;

      prisma.tHEmpleado.findUnique.mockResolvedValue(null);
      prisma.tHEmpleado.create.mockResolvedValue({ id: '1', ...dataWithoutCargo });

      const result = await empleadoService.create(dataWithoutCargo);

      expect(prisma.tHCargo.findUnique).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData = {
      nombre: 'Juan Carlos',
      telefono: '3009876543'
    };

    it('debe actualizar un empleado correctamente', async () => {
      const mockEmpleado = { id: '1', nombre: 'Juan', apellido: 'Pérez' };
      const mockUpdatedEmpleado = { ...mockEmpleado, ...updateData };

      prisma.tHEmpleado.findUnique.mockResolvedValue(mockEmpleado);
      prisma.tHEmpleado.update.mockResolvedValue(mockUpdatedEmpleado);

      const result = await empleadoService.update('1', updateData);

      expect(prisma.tHEmpleado.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
        include: { cargo: true }
      });
      expect(result).toEqual(mockUpdatedEmpleado);
    });

    it('debe lanzar NotFoundError si el empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(empleadoService.update('999', updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el estado del empleado a ACTIVO', async () => {
      const mockEmpleado = { id: '1', estado: 'INACTIVO' };

      prisma.tHEmpleado.findUnique.mockResolvedValue(mockEmpleado);
      prisma.tHEmpleado.update.mockResolvedValue({ ...mockEmpleado, estado: 'ACTIVO' });

      const result = await empleadoService.changeStatus('1', 'ACTIVO');

      expect(prisma.tHEmpleado.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'ACTIVO' }
      });
      expect(result.estado).toBe('ACTIVO');
    });

    it('debe establecer fechaRetiro al cambiar a RETIRADO', async () => {
      const mockEmpleado = { id: '1', estado: 'ACTIVO' };

      prisma.tHEmpleado.findUnique.mockResolvedValue(mockEmpleado);
      prisma.tHEmpleado.update.mockResolvedValue({ ...mockEmpleado, estado: 'RETIRADO', fechaRetiro: new Date() });

      await empleadoService.changeStatus('1', 'RETIRADO');

      expect(prisma.tHEmpleado.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          estado: 'RETIRADO',
          fechaRetiro: expect.any(Date)
        })
      });
    });

    it('debe lanzar NotFoundError si el empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(empleadoService.changeStatus('999', 'ACTIVO')).rejects.toThrow(NotFoundError);
    });
  });

  describe('linkToUser', () => {
    it('debe vincular empleado con usuario correctamente', async () => {
      const mockEmpleado = { id: 'emp-1', nombre: 'Juan' };
      const mockUsuario = { id: 'user-1', email: 'juan@test.com' };

      prisma.tHEmpleado.findUnique
        .mockResolvedValueOnce(mockEmpleado) // Primera llamada: buscar empleado
        .mockResolvedValueOnce(null); // Tercera llamada: verificar usuario no vinculado
      prisma.usuario.findUnique.mockResolvedValue(mockUsuario);
      prisma.tHEmpleado.update.mockResolvedValue({ ...mockEmpleado, usuarioId: 'user-1' });

      const result = await empleadoService.linkToUser('emp-1', 'user-1');

      expect(result.usuarioId).toBe('user-1');
    });

    it('debe lanzar NotFoundError si el empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);
      prisma.usuario.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(empleadoService.linkToUser('999', 'user-1')).rejects.toThrow(NotFoundError);
      await expect(empleadoService.linkToUser('999', 'user-1')).rejects.toThrow('Empleado no encontrado');
    });

    it('debe lanzar NotFoundError si el usuario no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(empleadoService.linkToUser('emp-1', '999')).rejects.toThrow(NotFoundError);
      await expect(empleadoService.linkToUser('emp-1', '999')).rejects.toThrow('Usuario no encontrado');
    });

    it('debe lanzar ValidationError si el usuario ya está vinculado', async () => {
      prisma.tHEmpleado.findUnique
        .mockResolvedValueOnce({ id: 'emp-1' })
        .mockResolvedValueOnce({ id: 'emp-2', usuarioId: 'user-1' }); // Usuario ya vinculado
      prisma.usuario.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(empleadoService.linkToUser('emp-1', 'user-1')).rejects.toThrow(ValidationError);
      await expect(empleadoService.linkToUser('emp-1', 'user-1')).rejects.toThrow('El usuario ya está vinculado a otro empleado');
    });
  });

  describe('getOrganigrama', () => {
    it('debe construir el organigrama jerárquico', async () => {
      const mockEmpleados = [
        { id: '1', nombre: 'Director', jefeDirectoId: null, cargo: { nivel: 1 } },
        { id: '2', nombre: 'Gerente', jefeDirectoId: '1', cargo: { nivel: 2 } },
        { id: '3', nombre: 'Empleado', jefeDirectoId: '2', cargo: { nivel: 3 } }
      ];

      prisma.tHEmpleado.findMany.mockResolvedValue(mockEmpleados);

      const result = await empleadoService.getOrganigrama();

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith({
        where: { estado: 'ACTIVO' },
        select: expect.objectContaining({
          id: true,
          nombre: true,
          apellido: true,
          jefeDirectoId: true,
          cargo: expect.any(Object)
        }),
        orderBy: expect.any(Array)
      });

      // Verificar estructura jerárquica
      expect(result).toHaveLength(1); // Solo el director en el nivel raíz
      expect(result[0].id).toBe('1');
      expect(result[0].subordinados).toHaveLength(1);
      expect(result[0].subordinados[0].id).toBe('2');
    });

    it('debe retornar array vacío si no hay empleados activos', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);

      const result = await empleadoService.getOrganigrama();

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('debe obtener estadísticas de empleados', async () => {
      prisma.tHEmpleado.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(90); // activos
      prisma.tHEmpleado.groupBy
        .mockResolvedValueOnce([
          { tipoEmpleado: 'MEDICO', _count: 30 },
          { tipoEmpleado: 'ENFERMERIA', _count: 40 }
        ])
        .mockResolvedValueOnce([
          { departamentoId: 'dep-1', _count: 50 },
          { departamentoId: 'dep-2', _count: 40 }
        ]);
      prisma.tHContrato.count.mockResolvedValue(5);

      const result = await empleadoService.getStats();

      expect(result).toEqual({
        total: 100,
        activos: 90,
        inactivos: 10,
        porTipo: expect.any(Array),
        porDepartamento: expect.any(Array),
        alertas: {
          contratosProxVencer: 5
        }
      });
    });
  });

  describe('search', () => {
    it('debe buscar empleados activos por query', async () => {
      const mockResults = [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', documento: '123', cargo: { nombre: 'Médico' } }
      ];

      prisma.tHEmpleado.findMany.mockResolvedValue(mockResults);

      const result = await empleadoService.search('Juan');

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith({
        where: {
          estado: 'ACTIVO',
          OR: expect.arrayContaining([
            expect.objectContaining({ nombre: { contains: 'Juan', mode: 'insensitive' } }),
            expect.objectContaining({ apellido: { contains: 'Juan', mode: 'insensitive' } }),
            expect.objectContaining({ documento: { contains: 'Juan' } })
          ])
        },
        select: expect.objectContaining({
          id: true,
          nombre: true,
          apellido: true,
          documento: true
        }),
        take: 10
      });
      expect(result).toEqual(mockResults);
    });

    it('debe respetar el límite especificado', async () => {
      prisma.tHEmpleado.findMany.mockResolvedValue([]);

      await empleadoService.search('test', 5);

      expect(prisma.tHEmpleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });
});
