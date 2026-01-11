/**
 * Tests para Acreditacion Service
 */
const prisma = require('../../db/prisma');
const acreditacionService = require('../../services/acreditacion.service');

describe('AcreditacionService', () => {
  // ==========================================
  // ESTÁNDARES
  // ==========================================
  describe('getEstandares', () => {
    it('debe retornar todos los estándares de acreditación activos', async () => {
      const mockEstandares = [
        { id: '1', grupo: 'ATENCION_CLIENTE', codigo: 'AC01', nombre: 'Estándar 1', activo: true },
        { id: '2', grupo: 'GERENCIA', codigo: 'GER01', nombre: 'Estándar 2', activo: true },
      ];

      prisma.estandarAcreditacion.findMany.mockResolvedValue(mockEstandares);

      const result = await acreditacionService.getEstandares({});

      expect(prisma.estandarAcreditacion.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('debe filtrar por grupo de estándares', async () => {
      const mockEstandares = [
        { id: '1', grupo: 'ATENCION_CLIENTE', codigo: 'AC01', nombre: 'Estándar 1' },
      ];

      prisma.estandarAcreditacion.findMany.mockResolvedValue(mockEstandares);

      const result = await acreditacionService.getEstandares({ grupo: 'ATENCION_CLIENTE' });

      expect(result[0].grupo).toBe('ATENCION_CLIENTE');
    });
  });

  describe('getEstandarById', () => {
    it('debe retornar un estándar con sus evaluaciones', async () => {
      const mockEstandar = {
        id: '1',
        grupo: 'ATENCION_CLIENTE',
        codigo: 'AC01',
        nombre: 'Estándar 1',
        evaluaciones: [
          { id: 'e1', calificacion: 4, fechaEvaluacion: new Date() },
        ],
      };

      prisma.estandarAcreditacion.findUnique.mockResolvedValue(mockEstandar);

      const result = await acreditacionService.getEstandarById('1');

      expect(result.codigo).toBe('AC01');
      expect(result.evaluaciones).toBeDefined();
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarAcreditacion.findUnique.mockResolvedValue(null);

      await expect(acreditacionService.getEstandarById('999')).rejects.toThrow();
    });
  });

  describe('createEstandar', () => {
    it('debe crear un nuevo estándar de acreditación', async () => {
      const nuevoEstandar = {
        grupo: 'ATENCION_CLIENTE',
        codigo: 'AC02',
        nombre: 'Nuevo Estándar',
        descripcion: 'Descripción',
        criterios: ['Criterio 1', 'Criterio 2'],
      };

      prisma.estandarAcreditacion.findUnique.mockResolvedValue(null);
      prisma.estandarAcreditacion.create.mockResolvedValue({ id: '1', ...nuevoEstandar });

      const result = await acreditacionService.createEstandar(nuevoEstandar);

      expect(prisma.estandarAcreditacion.create).toHaveBeenCalled();
      expect(result.codigo).toBe('AC02');
    });

    it('debe lanzar error si el código ya existe', async () => {
      prisma.estandarAcreditacion.findUnique.mockResolvedValue({ id: '1', codigo: 'AC01' });

      await expect(
        acreditacionService.createEstandar({ codigo: 'AC01' })
      ).rejects.toThrow();
    });
  });

  describe('updateEstandar', () => {
    it('debe actualizar un estándar existente', async () => {
      prisma.estandarAcreditacion.findUnique.mockResolvedValue({ id: '1' });
      prisma.estandarAcreditacion.update.mockResolvedValue({
        id: '1',
        nombre: 'Estándar Actualizado',
      });

      const result = await acreditacionService.updateEstandar('1', { nombre: 'Estándar Actualizado' });

      expect(prisma.estandarAcreditacion.update).toHaveBeenCalled();
      expect(result.nombre).toBe('Estándar Actualizado');
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarAcreditacion.findUnique.mockResolvedValue(null);

      await expect(
        acreditacionService.updateEstandar('999', {})
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // EVALUACIONES
  // ==========================================
  describe('getEvaluaciones', () => {
    it('debe retornar lista de evaluaciones de acreditación', async () => {
      const mockEvaluaciones = [
        { id: 'e1', calificacion: 4, estandar: { codigo: 'AC01' } },
        { id: 'e2', calificacion: 3, estandar: { codigo: 'GER01' } },
      ];

      prisma.evaluacionAcreditacion.findMany.mockResolvedValue(mockEvaluaciones);
      prisma.evaluacionAcreditacion.count.mockResolvedValue(2);

      const result = await acreditacionService.getEvaluaciones({ page: 1, limit: 10 });

      expect(result.evaluaciones).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por estándar', async () => {
      const mockEvaluaciones = [
        { id: 'e1', calificacion: 4, estandarId: '1' },
      ];

      prisma.evaluacionAcreditacion.findMany.mockResolvedValue(mockEvaluaciones);
      prisma.evaluacionAcreditacion.count.mockResolvedValue(1);

      const result = await acreditacionService.getEvaluaciones({ estandarId: '1' });

      expect(result.evaluaciones).toHaveLength(1);
    });
  });

  describe('registrarEvaluacion', () => {
    it('debe crear una nueva evaluación de acreditación', async () => {
      const nuevaEvaluacion = {
        estandarId: '1',
        calificacion: 4,
        fortalezas: 'Fortalezas identificadas',
        oportunidadesMejora: 'Oportunidades de mejora',
        evaluadorId: 'user-id',
      };

      prisma.estandarAcreditacion.findUnique.mockResolvedValue({ id: '1' });
      prisma.evaluacionAcreditacion.create.mockResolvedValue({
        id: 'e1',
        ...nuevaEvaluacion,
        fechaEvaluacion: new Date(),
      });

      const result = await acreditacionService.registrarEvaluacion(nuevaEvaluacion);

      expect(prisma.evaluacionAcreditacion.create).toHaveBeenCalled();
      expect(result.calificacion).toBe(4);
    });

    it('debe validar que la calificación esté entre 1 y 5', async () => {
      prisma.estandarAcreditacion.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        acreditacionService.registrarEvaluacion({
          estandarId: '1',
          calificacion: 6,
          evaluadorId: 'user-id',
        })
      ).rejects.toThrow();
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarAcreditacion.findUnique.mockResolvedValue(null);

      await expect(
        acreditacionService.registrarEvaluacion({
          estandarId: '999',
          calificacion: 4,
          evaluadorId: 'user-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateEvaluacion', () => {
    it('debe actualizar una evaluación existente', async () => {
      prisma.evaluacionAcreditacion.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.evaluacionAcreditacion.update.mockResolvedValue({
        id: 'e1',
        calificacion: 5,
        fortalezas: 'Fortalezas actualizadas',
      });

      const result = await acreditacionService.updateEvaluacion('e1', {
        calificacion: 5,
        fortalezas: 'Fortalezas actualizadas',
      });

      expect(prisma.evaluacionAcreditacion.update).toHaveBeenCalled();
      expect(result.calificacion).toBe(5);
    });

    it('debe lanzar error si la evaluación no existe', async () => {
      prisma.evaluacionAcreditacion.findUnique.mockResolvedValue(null);

      await expect(
        acreditacionService.updateEvaluacion('999', {})
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar datos del dashboard de acreditación', async () => {
      prisma.estandarAcreditacion.count.mockResolvedValue(20);
      prisma.estandarAcreditacion.groupBy.mockResolvedValue([
        { grupo: 'ATENCION_CLIENTE', _count: 5 },
        { grupo: 'GERENCIA', _count: 5 },
      ]);
      prisma.$queryRaw.mockResolvedValue([{ promedio: 3.5 }]);
      prisma.evaluacionAcreditacion.findMany.mockResolvedValue([]);
      prisma.estandarAcreditacion.findMany.mockResolvedValue([]);

      const result = await acreditacionService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('totalEstandares');
      expect(result).toHaveProperty('estandaresPorGrupo');
    });
  });

  describe('getAutoevaluacionPorGrupo', () => {
    it('debe retornar autoevaluación de un grupo específico', async () => {
      const mockEstandares = [
        {
          id: '1',
          codigo: 'AC01',
          nombre: 'Estándar 1',
          criterios: ['Criterio 1'],
          evaluaciones: [{ calificacion: 4, fechaEvaluacion: new Date() }],
        },
        {
          id: '2',
          codigo: 'AC02',
          nombre: 'Estándar 2',
          criterios: ['Criterio 2'],
          evaluaciones: [],
        },
      ];

      prisma.estandarAcreditacion.findMany.mockResolvedValue(mockEstandares);

      const result = await acreditacionService.getAutoevaluacionPorGrupo('ATENCION_CLIENTE');

      expect(result).toHaveProperty('grupo');
      expect(result.grupo).toBe('ATENCION_CLIENTE');
      expect(result).toHaveProperty('totalEstandares');
      expect(result).toHaveProperty('evaluados');
      expect(result).toHaveProperty('sinEvaluar');
      expect(result).toHaveProperty('porcentajeEvaluado');
      expect(result).toHaveProperty('calificacionPromedio');
    });
  });

  describe('getReporteConsolidado', () => {
    it('debe generar reporte consolidado de acreditación', async () => {
      const mockEstandares = [
        {
          id: '1',
          codigo: 'AC01',
          nombre: 'Estándar 1',
          criterios: [],
          evaluaciones: [{ calificacion: 4, fechaEvaluacion: new Date() }],
        },
      ];

      prisma.estandarAcreditacion.findMany.mockResolvedValue(mockEstandares);

      const result = await acreditacionService.getReporteConsolidado();

      expect(result).toHaveProperty('fechaGeneracion');
      expect(result).toHaveProperty('resumenGeneral');
      expect(result).toHaveProperty('grupos');
      expect(result).toHaveProperty('nivelesCalificacion');
    });
  });

  describe('getBrechasYOportunidades', () => {
    it('debe retornar brechas y oportunidades de mejora', async () => {
      const mockBrechas = [
        { id: '1', codigo: 'AC01', calificacion: 2, oportunidades: 'Oportunidad 1' },
        { id: '2', codigo: 'GER01', calificacion: 3, oportunidades: 'Oportunidad 2' },
      ];

      prisma.$queryRaw.mockResolvedValue(mockBrechas);

      const result = await acreditacionService.getBrechasYOportunidades();

      expect(result).toHaveProperty('totalBrechas');
      expect(result).toHaveProperty('porNivel');
      expect(result).toHaveProperty('brechas');
      expect(result.porNivel).toHaveProperty('critico');
      expect(result.porNivel).toHaveProperty('deficiente');
      expect(result.porNivel).toHaveProperty('aceptable');
    });
  });
});
