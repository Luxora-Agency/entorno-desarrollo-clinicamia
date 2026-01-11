/**
 * Tests para VacanteService - Módulo Talento Humano
 */
const prisma = require('../../../db/prisma');
const vacanteService = require('../../../services/talento-humano/vacante.service');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

describe('VacanteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('debe listar vacantes sin filtros', async () => {
      const mockVacantes = [
        { id: '1', titulo: 'Médico General', estado: 'ABIERTA' },
        { id: '2', titulo: 'Enfermera', estado: 'ABIERTA' }
      ];

      prisma.tHVacante.findMany.mockResolvedValue(mockVacantes);
      prisma.tHVacante.count.mockResolvedValue(2);

      const result = await vacanteService.list({});

      expect(prisma.tHVacante.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por estado', async () => {
      prisma.tHVacante.findMany.mockResolvedValue([]);
      prisma.tHVacante.count.mockResolvedValue(0);

      await vacanteService.list({ estado: 'ABIERTA' });

      expect(prisma.tHVacante.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'ABIERTA' })
        })
      );
    });

    it('debe filtrar por departamentoId', async () => {
      prisma.tHVacante.findMany.mockResolvedValue([]);
      prisma.tHVacante.count.mockResolvedValue(0);

      await vacanteService.list({ departamentoId: 'dep-1' });

      expect(prisma.tHVacante.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departamentoId: 'dep-1' })
        })
      );
    });

    it('debe filtrar por cargoId', async () => {
      prisma.tHVacante.findMany.mockResolvedValue([]);
      prisma.tHVacante.count.mockResolvedValue(0);

      await vacanteService.list({ cargoId: 'cargo-1' });

      expect(prisma.tHVacante.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cargoId: 'cargo-1' })
        })
      );
    });

    it('debe paginar correctamente', async () => {
      prisma.tHVacante.findMany.mockResolvedValue([]);
      prisma.tHVacante.count.mockResolvedValue(50);

      const result = await vacanteService.list({ page: 3, limit: 10 });

      expect(prisma.tHVacante.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10
        })
      );
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('getById', () => {
    it('debe obtener vacante por ID con candidatos', async () => {
      const mockVacante = {
        id: '1',
        titulo: 'Médico General',
        cargo: { nombre: 'Médico' },
        candidatos: []
      };

      prisma.tHVacante.findUnique.mockResolvedValue(mockVacante);

      const result = await vacanteService.getById('1');

      expect(prisma.tHVacante.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          cargo: true,
          candidatos: expect.any(Object)
        })
      });
      expect(result).toEqual(mockVacante);
    });

    it('debe lanzar NotFoundError si la vacante no existe', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue(null);

      await expect(vacanteService.getById('999')).rejects.toThrow(NotFoundError);
      await expect(vacanteService.getById('999')).rejects.toThrow('Vacante no encontrada');
    });
  });

  describe('create', () => {
    const validData = {
      titulo: 'Médico General',
      descripcion: 'Se busca médico general',
      cargoId: 'cargo-1',
      salarioMin: 3000000,
      salarioMax: 5000000
    };

    it('debe crear una vacante correctamente', async () => {
      const mockCreatedVacante = { id: '1', ...validData, createdBy: 'user-1' };

      prisma.tHCargo.findUnique.mockResolvedValue({ id: 'cargo-1', nombre: 'Médico' });
      prisma.tHVacante.create.mockResolvedValue(mockCreatedVacante);

      const result = await vacanteService.create(validData, 'user-1');

      expect(prisma.tHVacante.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...validData,
          createdBy: 'user-1'
        }),
        include: expect.any(Object)
      });
      expect(result).toEqual(mockCreatedVacante);
    });

    it('debe lanzar ValidationError si el cargo no existe', async () => {
      prisma.tHCargo.findUnique.mockResolvedValue(null);

      await expect(vacanteService.create(validData, 'user-1')).rejects.toThrow(ValidationError);
      await expect(vacanteService.create(validData, 'user-1')).rejects.toThrow('Cargo no encontrado');
    });

    it('debe crear vacante sin cargoId', async () => {
      const dataWithoutCargo = { ...validData };
      delete dataWithoutCargo.cargoId;

      prisma.tHVacante.create.mockResolvedValue({ id: '1', ...dataWithoutCargo });

      await vacanteService.create(dataWithoutCargo, 'user-1');

      expect(prisma.tHCargo.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateData = {
      titulo: 'Médico Especialista',
      salarioMax: 7000000
    };

    it('debe actualizar una vacante correctamente', async () => {
      const mockVacante = { id: '1', titulo: 'Médico General' };
      const mockUpdatedVacante = { ...mockVacante, ...updateData };

      prisma.tHVacante.findUnique.mockResolvedValue(mockVacante);
      prisma.tHVacante.update.mockResolvedValue(mockUpdatedVacante);

      const result = await vacanteService.update('1', updateData);

      expect(prisma.tHVacante.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
        include: expect.any(Object)
      });
      expect(result).toEqual(mockUpdatedVacante);
    });

    it('debe lanzar NotFoundError si la vacante no existe', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue(null);

      await expect(vacanteService.update('999', updateData)).rejects.toThrow(NotFoundError);
    });

    it('debe validar cargo si se actualiza cargoId', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue({ id: '1' });
      prisma.tHCargo.findUnique.mockResolvedValue(null);

      await expect(vacanteService.update('1', { cargoId: 'cargo-invalid' }))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('debe eliminar una vacante sin candidatos activos', async () => {
      const mockVacante = { id: '1', titulo: 'Vacante Test' };

      prisma.tHVacante.findUnique.mockResolvedValue(mockVacante);
      prisma.tHCandidatoVacante.count.mockResolvedValue(0);
      prisma.tHVacante.delete.mockResolvedValue(mockVacante);

      const result = await vacanteService.delete('1');

      expect(prisma.tHVacante.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockVacante);
    });

    it('debe lanzar NotFoundError si la vacante no existe', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue(null);

      await expect(vacanteService.delete('999')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError si tiene candidatos activos', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue({ id: '1' });
      prisma.tHCandidatoVacante.count.mockResolvedValue(3);

      await expect(vacanteService.delete('1')).rejects.toThrow(ValidationError);
      await expect(vacanteService.delete('1')).rejects.toThrow('No se puede eliminar una vacante con candidatos activos');
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el estado de la vacante', async () => {
      const mockVacante = { id: '1', estado: 'ABIERTA' };

      prisma.tHVacante.findUnique.mockResolvedValue(mockVacante);
      prisma.tHVacante.update.mockResolvedValue({ ...mockVacante, estado: 'EN_PROCESO' });

      const result = await vacanteService.changeStatus('1', 'EN_PROCESO');

      expect(prisma.tHVacante.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'EN_PROCESO' }
      });
      expect(result.estado).toBe('EN_PROCESO');
    });

    it('debe establecer fechaCierre al cerrar vacante', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue({ id: '1', estado: 'ABIERTA' });
      prisma.tHVacante.update.mockResolvedValue({ id: '1', estado: 'CERRADA', fechaCierre: new Date() });

      await vacanteService.changeStatus('1', 'CERRADA');

      expect(prisma.tHVacante.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          estado: 'CERRADA',
          fechaCierre: expect.any(Date)
        })
      });
    });

    it('debe lanzar NotFoundError si la vacante no existe', async () => {
      prisma.tHVacante.findUnique.mockResolvedValue(null);

      await expect(vacanteService.changeStatus('999', 'CERRADA')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStats', () => {
    it('debe obtener estadísticas de vacantes', async () => {
      prisma.tHVacante.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // abiertas
        .mockResolvedValueOnce(3)  // enProceso
        .mockResolvedValueOnce(2); // cerradas

      const result = await vacanteService.getStats();

      expect(result).toEqual({
        total: 10,
        abiertas: 5,
        enProceso: 3,
        cerradas: 2
      });
    });
  });
});
