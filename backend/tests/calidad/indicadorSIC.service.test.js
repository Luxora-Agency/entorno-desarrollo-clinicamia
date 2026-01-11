/**
 * Tests para IndicadorSIC Service
 */
const prisma = require('../../db/prisma');
const indicadorSICService = require('../../services/indicadorSIC.service');

describe('IndicadorSICService', () => {
  // ==========================================
  // INDICADORES SIC
  // ==========================================
  describe('getIndicadores', () => {
    it('debe retornar todos los indicadores SIC activos', async () => {
      const mockIndicadores = [
        { id: '1', codigo: 'P.1.1', nombre: 'Indicador 1', dominio: 'EFECTIVIDAD', activo: true },
        { id: '2', codigo: 'P.2.9', nombre: 'Indicador 2', dominio: 'SEGURIDAD', activo: true },
        { id: '3', codigo: 'P.3.14', nombre: 'Indicador 3', dominio: 'EXPERIENCIA', activo: true },
      ];

      prisma.indicadorSIC.findMany.mockResolvedValue(mockIndicadores);

      const result = await indicadorSICService.getIndicadores({});

      expect(prisma.indicadorSIC.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('debe filtrar indicadores por dominio', async () => {
      const mockIndicadores = [
        { id: '1', codigo: 'P.1.1', dominio: 'EFECTIVIDAD' },
        { id: '2', codigo: 'P.1.2', dominio: 'EFECTIVIDAD' },
      ];

      prisma.indicadorSIC.findMany.mockResolvedValue(mockIndicadores);

      const result = await indicadorSICService.getIndicadores({ dominio: 'EFECTIVIDAD' });

      expect(result).toHaveLength(2);
      result.forEach(ind => {
        expect(ind.dominio).toBe('EFECTIVIDAD');
      });
    });

    it('debe buscar indicadores por texto', async () => {
      const mockIndicadores = [
        { id: '1', codigo: 'P.1.1', nombre: 'Proporción de gestantes' },
      ];

      prisma.indicadorSIC.findMany.mockResolvedValue(mockIndicadores);

      const result = await indicadorSICService.getIndicadores({ search: 'gestantes' });

      expect(result).toHaveLength(1);
    });
  });

  describe('getIndicadorById', () => {
    it('debe retornar un indicador con sus mediciones', async () => {
      const mockIndicador = {
        id: '1',
        codigo: 'P.1.1',
        nombre: 'Proporción de gestantes con control prenatal < 12 semanas',
        dominio: 'EFECTIVIDAD',
        metaNacional: 90.00,
        metaInstitucional: 85.00,
        mediciones: [
          { id: 'm1', periodo: '2025-S1', resultado: 82.50 },
        ],
      };

      prisma.indicadorSIC.findUnique.mockResolvedValue(mockIndicador);

      const result = await indicadorSICService.getIndicadorById('1');

      expect(result.codigo).toBe('P.1.1');
      expect(result.mediciones).toHaveLength(1);
    });

    it('debe lanzar error si el indicador no existe', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue(null);

      await expect(indicadorSICService.getIndicadorById('999')).rejects.toThrow();
    });
  });

  describe('getIndicadorByCodigo', () => {
    it('debe retornar indicador por código', async () => {
      const mockIndicador = {
        id: '1',
        codigo: 'P.1.1',
        nombre: 'Indicador Test',
        mediciones: [],
      };

      prisma.indicadorSIC.findUnique.mockResolvedValue(mockIndicador);

      const result = await indicadorSICService.getIndicadorByCodigo('P.1.1');

      expect(result.codigo).toBe('P.1.1');
    });

    it('debe lanzar error si el código no existe', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue(null);

      await expect(indicadorSICService.getIndicadorByCodigo('XXX')).rejects.toThrow();
    });
  });

  describe('createIndicador', () => {
    it('debe crear un nuevo indicador SIC', async () => {
      const nuevoIndicador = {
        codigo: 'P.1.1',
        nombre: 'Nuevo Indicador',
        dominio: 'EFECTIVIDAD',
        definicionOperacional: 'Definición',
        formulaNumerador: 'Numerador',
        formulaDenominador: 'Denominador',
        unidadMedida: 'Porcentaje',
        metaNacional: 90.00,
        fuenteDatos: 'HC',
        periodicidadReporte: 'Semestral',
      };

      prisma.indicadorSIC.findUnique.mockResolvedValue(null);
      prisma.indicadorSIC.create.mockResolvedValue({ id: '1', ...nuevoIndicador });

      const result = await indicadorSICService.createIndicador(nuevoIndicador);

      expect(prisma.indicadorSIC.create).toHaveBeenCalled();
      expect(result.codigo).toBe('P.1.1');
    });

    it('debe lanzar error si el código ya existe', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue({ id: '1', codigo: 'P.1.1' });

      await expect(
        indicadorSICService.createIndicador({ codigo: 'P.1.1' })
      ).rejects.toThrow();
    });
  });

  describe('updateIndicador', () => {
    it('debe actualizar un indicador existente', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue({ id: '1' });
      prisma.indicadorSIC.update.mockResolvedValue({
        id: '1',
        metaInstitucional: 85.00,
      });

      const result = await indicadorSICService.updateIndicador('1', { metaInstitucional: 85.00 });

      expect(prisma.indicadorSIC.update).toHaveBeenCalled();
      expect(result.metaInstitucional).toBe(85.00);
    });

    it('debe lanzar error si el indicador no existe', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue(null);

      await expect(
        indicadorSICService.updateIndicador('999', {})
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // MEDICIONES
  // ==========================================
  describe('getMediciones', () => {
    it('debe retornar mediciones paginadas', async () => {
      const mockMediciones = [
        { id: 'm1', periodo: '2025-S1', resultado: 85.00, cumpleMeta: true },
        { id: 'm2', periodo: '2024-S2', resultado: 80.00, cumpleMeta: false },
      ];

      prisma.medicionSIC.findMany.mockResolvedValue(mockMediciones);
      prisma.medicionSIC.count.mockResolvedValue(2);

      const result = await indicadorSICService.getMediciones({ page: 1, limit: 10 });

      expect(result.mediciones).toHaveLength(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar mediciones por indicador y periodo', async () => {
      const mockMediciones = [
        { id: 'm1', periodo: '2025-S1', resultado: 85.00, indicadorId: 'ind-1' },
      ];

      prisma.medicionSIC.findMany.mockResolvedValue(mockMediciones);
      prisma.medicionSIC.count.mockResolvedValue(1);

      const result = await indicadorSICService.getMediciones({ indicadorId: 'ind-1', periodo: '2025-S1' });

      expect(result.mediciones[0].periodo).toBe('2025-S1');
    });
  });

  describe('registrarMedicion', () => {
    it('debe registrar una nueva medición', async () => {
      const medicion = {
        indicadorId: 'ind-1',
        periodo: '2025-S1',
        numerador: 85,
        denominador: 100,
        registradoPor: 'user-id',
      };

      prisma.indicadorSIC.findUnique.mockResolvedValue({
        id: 'ind-1',
        metaInstitucional: 80.00,
      });
      prisma.medicionSIC.findFirst.mockResolvedValue(null);
      prisma.medicionSIC.create.mockResolvedValue({
        id: 'm1',
        ...medicion,
        resultado: 0.85,
        cumpleMeta: true,
        semaforoEstado: 'Verde',
      });

      const result = await indicadorSICService.registrarMedicion(medicion);

      expect(prisma.medicionSIC.create).toHaveBeenCalled();
      expect(result.semaforoEstado).toBe('Verde');
    });

    it('debe actualizar medición si ya existe para el periodo', async () => {
      const medicion = {
        indicadorId: 'ind-1',
        periodo: '2025-S1',
        numerador: 90,
        denominador: 100,
        registradoPor: 'user-id',
      };

      prisma.indicadorSIC.findUnique.mockResolvedValue({
        id: 'ind-1',
        metaInstitucional: 80.00,
      });
      prisma.medicionSIC.findFirst.mockResolvedValue({ id: 'm1', periodo: '2025-S1' });
      prisma.medicionSIC.update.mockResolvedValue({
        id: 'm1',
        resultado: 0.90,
        semaforoEstado: 'Verde',
      });

      const result = await indicadorSICService.registrarMedicion(medicion);

      expect(prisma.medicionSIC.update).toHaveBeenCalled();
    });

    it('debe calcular el semáforo correctamente', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue({
        id: 'ind-1',
        metaInstitucional: 100.00,
      });
      prisma.medicionSIC.findFirst.mockResolvedValue(null);
      prisma.medicionSIC.create.mockResolvedValue({
        resultado: 0.75,
        semaforoEstado: 'Amarillo',
      });

      const result = await indicadorSICService.registrarMedicion({
        indicadorId: 'ind-1',
        periodo: '2025-S1',
        numerador: 75,
        denominador: 100,
        registradoPor: 'user-id',
      });

      expect(result.semaforoEstado).toBe('Amarillo');
    });
  });

  // ==========================================
  // TENDENCIAS
  // ==========================================
  describe('getTendencia', () => {
    it('debe retornar tendencia de un indicador', async () => {
      const mockIndicador = {
        id: 'ind-1',
        codigo: 'P.1.1',
        nombre: 'Indicador Test',
        metaInstitucional: 80.00,
      };

      const mockMediciones = [
        { periodo: '2025-S1', resultado: 85.00, cumpleMeta: true, semaforoEstado: 'Verde' },
        { periodo: '2024-S2', resultado: 80.00, cumpleMeta: true, semaforoEstado: 'Verde' },
        { periodo: '2024-S1', resultado: 75.00, cumpleMeta: false, semaforoEstado: 'Amarillo' },
      ];

      prisma.indicadorSIC.findUnique.mockResolvedValue(mockIndicador);
      prisma.medicionSIC.findMany.mockResolvedValue(mockMediciones);

      const result = await indicadorSICService.getTendencia('ind-1', 6);

      expect(result).toHaveProperty('indicador');
      expect(result).toHaveProperty('tendencia');
      expect(result.tendencia).toHaveLength(3);
      expect(result.indicador.codigo).toBe('P.1.1');
    });

    it('debe lanzar error si el indicador no existe', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue(null);

      await expect(indicadorSICService.getTendencia('999', 6)).rejects.toThrow();
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar datos del dashboard de indicadores SIC', async () => {
      prisma.indicadorSIC.count.mockResolvedValue(20);
      prisma.indicadorSIC.groupBy.mockResolvedValue([
        { dominio: 'EFECTIVIDAD', _count: 10 },
        { dominio: 'SEGURIDAD', _count: 5 },
        { dominio: 'EXPERIENCIA', _count: 5 },
      ]);
      prisma.medicionSIC.count.mockResolvedValueOnce(15)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5);
      prisma.medicionSIC.groupBy.mockResolvedValue([
        { semaforoEstado: 'Verde', _count: 10 },
        { semaforoEstado: 'Amarillo', _count: 3 },
        { semaforoEstado: 'Rojo', _count: 2 },
      ]);
      prisma.indicadorSIC.findMany.mockResolvedValue([]);
      prisma.medicionSIC.findMany.mockResolvedValue([]);

      const result = await indicadorSICService.getDashboard('2025-01');

      expect(result).toHaveProperty('periodo');
      expect(result).toHaveProperty('resumen');
      expect(result).toHaveProperty('indicadoresPorDominio');
      expect(result).toHaveProperty('semaforoStats');
    });
  });

  // ==========================================
  // REPORTE SISPRO
  // ==========================================
  describe('marcarReportadoSISPRO', () => {
    it('debe marcar mediciones como reportadas a SISPRO', async () => {
      prisma.medicionSIC.updateMany.mockResolvedValue({ count: 5 });

      const result = await indicadorSICService.marcarReportadoSISPRO('2025-S1');

      expect(prisma.medicionSIC.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { periodo: '2025-S1', reportadoSISPRO: false },
          data: expect.objectContaining({ reportadoSISPRO: true }),
        })
      );
      expect(result.actualizados).toBe(5);
    });
  });

  describe('generarReporteSemestral', () => {
    it('debe generar reporte semestral', async () => {
      prisma.medicionSIC.findMany.mockResolvedValue([
        {
          indicadorId: 'i1',
          periodo: '2025-01',
          numerador: 85,
          denominador: 100,
          resultado: 0.85,
          indicador: { codigo: 'P.1.1', nombre: 'Indicador 1', dominio: 'EFECTIVIDAD' },
        },
      ]);

      const result = await indicadorSICService.generarReporteSemestral('2025-S1');

      expect(result).toHaveProperty('semestre');
      expect(result).toHaveProperty('fechaGeneracion');
      expect(result).toHaveProperty('indicadores');
    });
  });

  // ==========================================
  // FICHA TÉCNICA
  // ==========================================
  describe('getFichaTecnica', () => {
    it('debe retornar la ficha técnica completa del indicador', async () => {
      const mockIndicador = {
        id: 'i1',
        codigo: 'P.1.1',
        nombre: 'Indicador de prueba',
        dominio: 'EFECTIVIDAD',
        definicionOperacional: 'Definición del indicador',
        formulaNumerador: 'Numerador',
        formulaDenominador: 'Denominador',
        unidadMedida: 'Porcentaje',
        metaNacional: 90.00,
        metaInstitucional: 85.00,
        fuenteDatos: 'Historia Clínica',
        periodicidadReporte: 'Semestral',
        serviciosAplica: ['Consulta Externa'],
        mediciones: [],
      };

      prisma.indicadorSIC.findUnique.mockResolvedValue(mockIndicador);

      const result = await indicadorSICService.getFichaTecnica('i1');

      expect(result).toHaveProperty('codigo');
      expect(result).toHaveProperty('definicionOperacional');
      expect(result).toHaveProperty('formula');
      expect(result.formula).toHaveProperty('numerador');
      expect(result.formula).toHaveProperty('denominador');
    });

    it('debe lanzar error si el indicador no existe', async () => {
      prisma.indicadorSIC.findUnique.mockResolvedValue(null);

      await expect(indicadorSICService.getFichaTecnica('999')).rejects.toThrow();
    });
  });

  // ==========================================
  // UTILIDADES
  // ==========================================
  describe('getPeriodoActual', () => {
    it('debe retornar el periodo en formato YYYY-MM', () => {
      const result = indicadorSICService.getPeriodoActual();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('getSemestreActual', () => {
    it('debe retornar el semestre en formato YYYY-S1 o YYYY-S2', () => {
      const result = indicadorSICService.getSemestreActual();
      expect(result).toMatch(/^\d{4}-S[12]$/);
    });
  });
});
