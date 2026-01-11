/**
 * Tests para Habilitación Service
 */
const prisma = require('../../db/prisma');
const habilitacionService = require('../../services/habilitacion.service');

describe('HabilitacionService', () => {
  // ==========================================
  // ESTÁNDARES DE HABILITACIÓN
  // ==========================================
  describe('getEstandares', () => {
    it('debe retornar todos los estándares activos', async () => {
      const mockEstandares = [
        { id: '1', codigo: 'TH-001', nombre: 'Talento Humano', tipo: 'TALENTO_HUMANO', activo: true },
        { id: '2', codigo: 'INF-001', nombre: 'Infraestructura', tipo: 'INFRAESTRUCTURA', activo: true },
      ];

      prisma.estandarHabilitacion.findMany.mockResolvedValue(mockEstandares);

      const result = await habilitacionService.getEstandares({});

      expect(prisma.estandarHabilitacion.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].codigo).toBe('TH-001');
    });

    it('debe filtrar por tipo de estándar', async () => {
      const mockEstandares = [
        { id: '1', codigo: 'TH-001', nombre: 'Talento Humano', tipo: 'TALENTO_HUMANO', activo: true },
      ];

      prisma.estandarHabilitacion.findMany.mockResolvedValue(mockEstandares);

      const result = await habilitacionService.getEstandares({ tipo: 'TALENTO_HUMANO' });

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('TALENTO_HUMANO');
    });
  });

  describe('getEstandarById', () => {
    it('debe retornar un estándar por ID con sus criterios', async () => {
      const mockEstandar = {
        id: '1',
        codigo: 'TH-001',
        nombre: 'Talento Humano',
        tipo: 'TALENTO_HUMANO',
        criterios: [
          { id: 'c1', codigo: 'TH-001-01', descripcion: 'Criterio 1' },
        ],
        autoevaluaciones: [],
      };

      prisma.estandarHabilitacion.findUnique.mockResolvedValue(mockEstandar);

      const result = await habilitacionService.getEstandarById('1');

      expect(prisma.estandarHabilitacion.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        })
      );
      expect(result.codigo).toBe('TH-001');
      expect(result.criterios).toHaveLength(1);
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarHabilitacion.findUnique.mockResolvedValue(null);

      await expect(habilitacionService.getEstandarById('999')).rejects.toThrow('Estándar de habilitación no encontrado');
    });
  });

  describe('createEstandar', () => {
    it('debe crear un nuevo estándar correctamente', async () => {
      const nuevoEstandar = {
        codigo: 'NEW-001',
        nombre: 'Nuevo Estándar',
        tipo: 'TALENTO_HUMANO',
        descripcion: 'Descripción del estándar',
      };

      // findUnique should return null (no existing standard)
      prisma.estandarHabilitacion.findUnique.mockResolvedValue(null);
      prisma.estandarHabilitacion.create.mockResolvedValue({ id: '1', ...nuevoEstandar });

      const result = await habilitacionService.createEstandar(nuevoEstandar);

      expect(prisma.estandarHabilitacion.findUnique).toHaveBeenCalledWith({ where: { codigo: 'NEW-001' } });
      expect(prisma.estandarHabilitacion.create).toHaveBeenCalled();
      expect(result.codigo).toBe('NEW-001');
    });

    it('debe lanzar error si el código ya existe', async () => {
      // findUnique should return an existing standard
      prisma.estandarHabilitacion.findUnique.mockResolvedValue({ id: '1', codigo: 'TH-001' });

      await expect(
        habilitacionService.createEstandar({ codigo: 'TH-001', nombre: 'Test', tipo: 'TALENTO_HUMANO' })
      ).rejects.toThrow('Ya existe un estándar con este código');
    });
  });

  describe('updateEstandar', () => {
    it('debe actualizar un estándar existente', async () => {
      const estandarExistente = { id: '1', codigo: 'TH-001', nombre: 'Talento Humano' };
      const datosActualizados = { nombre: 'Talento Humano Actualizado' };

      prisma.estandarHabilitacion.findUnique.mockResolvedValue(estandarExistente);
      prisma.estandarHabilitacion.update.mockResolvedValue({ ...estandarExistente, ...datosActualizados });

      const result = await habilitacionService.updateEstandar('1', datosActualizados);

      expect(prisma.estandarHabilitacion.update).toHaveBeenCalled();
      expect(result.nombre).toBe('Talento Humano Actualizado');
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.updateEstandar('999', { nombre: 'Test' })
      ).rejects.toThrow('Estándar no encontrado');
    });
  });

  // ==========================================
  // CRITERIOS DE HABILITACIÓN
  // ==========================================
  describe('getCriteriosByEstandar', () => {
    it('debe retornar criterios de un estándar', async () => {
      const mockCriterios = [
        { id: 'c1', codigo: 'TH-001-01', descripcion: 'Criterio 1', peso: 3 },
        { id: 'c2', codigo: 'TH-001-02', descripcion: 'Criterio 2', peso: 2 },
      ];

      prisma.criterioHabilitacion.findMany.mockResolvedValue(mockCriterios);

      const result = await habilitacionService.getCriteriosByEstandar('estandar-id');

      expect(prisma.criterioHabilitacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { estandarId: 'estandar-id', activo: true },
        })
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('createCriterio', () => {
    it('debe crear un nuevo criterio', async () => {
      const nuevoCriterio = {
        estandarId: 'estandar-id',
        codigo: 'TH-001-03',
        descripcion: 'Nuevo criterio',
        peso: 2,
      };

      prisma.estandarHabilitacion.findUnique.mockResolvedValue({ id: 'estandar-id' });
      prisma.criterioHabilitacion.create.mockResolvedValue({ id: 'c3', ...nuevoCriterio });

      const result = await habilitacionService.createCriterio(nuevoCriterio);

      expect(prisma.estandarHabilitacion.findUnique).toHaveBeenCalledWith({ where: { id: 'estandar-id' } });
      expect(prisma.criterioHabilitacion.create).toHaveBeenCalled();
      expect(result.codigo).toBe('TH-001-03');
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.createCriterio({
          estandarId: 'invalid-id',
          codigo: 'TEST-001',
          descripcion: 'Test',
        })
      ).rejects.toThrow('Estándar no encontrado');
    });
  });

  describe('updateCriterio', () => {
    it('debe actualizar un criterio existente', async () => {
      const criterioExistente = { id: 'c1', codigo: 'TH-001-01', descripcion: 'Criterio 1' };
      const datosActualizados = { descripcion: 'Criterio 1 Actualizado' };

      prisma.criterioHabilitacion.findUnique.mockResolvedValue(criterioExistente);
      prisma.criterioHabilitacion.update.mockResolvedValue({ ...criterioExistente, ...datosActualizados });

      const result = await habilitacionService.updateCriterio('c1', datosActualizados);

      expect(prisma.criterioHabilitacion.update).toHaveBeenCalled();
      expect(result.descripcion).toBe('Criterio 1 Actualizado');
    });

    it('debe lanzar error si el criterio no existe', async () => {
      prisma.criterioHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.updateCriterio('invalid-id', { descripcion: 'Test' })
      ).rejects.toThrow('Criterio no encontrado');
    });
  });

  // ==========================================
  // AUTOEVALUACIONES
  // ==========================================
  describe('getAutoevaluaciones', () => {
    it('debe retornar autoevaluaciones con paginación', async () => {
      const mockAutoevaluaciones = [
        {
          id: 'auto-1',
          estado: 'En Proceso',
          estandar: { codigo: 'TH-001', nombre: 'Talento Humano' },
          evaluador: { nombre: 'Juan', apellido: 'Pérez' },
        },
      ];

      prisma.autoevaluacionHabilitacion.findMany.mockResolvedValue(mockAutoevaluaciones);
      prisma.autoevaluacionHabilitacion.count.mockResolvedValue(1);

      const result = await habilitacionService.getAutoevaluaciones({ page: 1, limit: 10 });

      expect(result.autoevaluaciones).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getAutoevaluacionById', () => {
    it('debe retornar una autoevaluación por ID', async () => {
      const mockAutoevaluacion = {
        id: 'auto-1',
        estado: 'En Proceso',
        estandar: { codigo: 'TH-001', nombre: 'Talento Humano', criterios: [] },
        evaluador: { nombre: 'Juan', apellido: 'Pérez' },
        criteriosEvaluados: [],
        evidencias: [],
        planesAccion: [],
      };

      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(mockAutoevaluacion);

      const result = await habilitacionService.getAutoevaluacionById('auto-1');

      expect(prisma.autoevaluacionHabilitacion.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'auto-1' },
        })
      );
      expect(result.id).toBe('auto-1');
    });

    it('debe lanzar error si la autoevaluación no existe', async () => {
      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.getAutoevaluacionById('invalid-id')
      ).rejects.toThrow('Autoevaluación no encontrada');
    });
  });

  describe('createAutoevaluacion', () => {
    it('debe crear una nueva autoevaluación', async () => {
      const nuevaAutoevaluacion = {
        estandarId: 'estandar-id',
        servicioId: 'servicio-id',
        evaluadorId: 'user-id',
        observaciones: 'Observaciones de la autoevaluación',
      };

      prisma.estandarHabilitacion.findUnique.mockResolvedValue({ id: 'estandar-id' });
      prisma.autoevaluacionHabilitacion.create.mockResolvedValue({
        id: 'auto-1',
        ...nuevaAutoevaluacion,
        porcentajeCumplimiento: 0,
        estado: 'En Proceso',
        fechaEvaluacion: new Date(),
        estandar: { codigo: 'TH-001', nombre: 'Talento Humano' },
        evaluador: { nombre: 'Juan', apellido: 'Pérez' },
      });

      const result = await habilitacionService.createAutoevaluacion(nuevaAutoevaluacion);

      expect(prisma.estandarHabilitacion.findUnique).toHaveBeenCalledWith({ where: { id: 'estandar-id' } });
      expect(prisma.autoevaluacionHabilitacion.create).toHaveBeenCalled();
      expect(result.estado).toBe('En Proceso');
      expect(result.porcentajeCumplimiento).toBe(0);
    });

    it('debe lanzar error si el estándar no existe', async () => {
      prisma.estandarHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.createAutoevaluacion({
          estandarId: 'invalid-id',
          evaluadorId: 'user-id',
        })
      ).rejects.toThrow('Estándar no encontrado');
    });
  });

  describe('evaluarCriterio', () => {
    it('debe registrar evaluación de un criterio nuevo', async () => {
      const evaluacion = {
        autoevaluacionId: 'auto-1',
        criterioId: 'criterio-1',
        cumplimiento: 'CUMPLE',
        observacion: 'Cumple completamente',
      };

      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue({ id: 'auto-1' });
      prisma.evaluacionCriterio.findFirst.mockResolvedValue(null);
      prisma.evaluacionCriterio.create.mockResolvedValue({
        id: 'eval-1',
        ...evaluacion,
        fechaEvaluacion: new Date(),
      });

      const result = await habilitacionService.evaluarCriterio(evaluacion);

      expect(prisma.autoevaluacionHabilitacion.findUnique).toHaveBeenCalledWith({ where: { id: 'auto-1' } });
      expect(prisma.evaluacionCriterio.findFirst).toHaveBeenCalledWith({
        where: { autoevaluacionId: 'auto-1', criterioId: 'criterio-1' },
      });
      expect(prisma.evaluacionCriterio.create).toHaveBeenCalled();
      expect(result.cumplimiento).toBe('CUMPLE');
    });

    it('debe actualizar evaluación de un criterio existente', async () => {
      const evaluacion = {
        autoevaluacionId: 'auto-1',
        criterioId: 'criterio-1',
        cumplimiento: 'NO_CUMPLE',
        observacion: 'No cumple',
      };

      const evaluacionExistente = { id: 'eval-1', ...evaluacion };

      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue({ id: 'auto-1' });
      prisma.evaluacionCriterio.findFirst.mockResolvedValue(evaluacionExistente);
      prisma.evaluacionCriterio.update.mockResolvedValue({
        ...evaluacionExistente,
        cumplimiento: 'NO_CUMPLE',
        fechaEvaluacion: new Date(),
      });

      const result = await habilitacionService.evaluarCriterio(evaluacion);

      expect(prisma.evaluacionCriterio.update).toHaveBeenCalled();
      expect(result.cumplimiento).toBe('NO_CUMPLE');
    });

    it('debe lanzar error si la autoevaluación no existe', async () => {
      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.evaluarCriterio({
          autoevaluacionId: 'invalid-id',
          criterioId: 'criterio-1',
          cumplimiento: 'CUMPLE',
        })
      ).rejects.toThrow('Autoevaluación no encontrada');
    });
  });

  describe('calcularPorcentajeCumplimiento', () => {
    it('debe calcular el porcentaje de cumplimiento correctamente', async () => {
      const mockAutoevaluacion = {
        id: 'auto-1',
        estandar: {
          criterios: [
            { id: 'c1', peso: 2 },
            { id: 'c2', peso: 3 },
            { id: 'c3', peso: 1 },
          ],
        },
        criteriosEvaluados: [
          { criterioId: 'c1', cumplimiento: 'CUMPLE' },
          { criterioId: 'c2', cumplimiento: 'CUMPLE_PARCIAL' },
          { criterioId: 'c3', cumplimiento: 'NO_CUMPLE' },
        ],
      };

      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(mockAutoevaluacion);
      prisma.autoevaluacionHabilitacion.update.mockResolvedValue({
        ...mockAutoevaluacion,
        porcentajeCumplimiento: 58.33,
      });

      const result = await habilitacionService.calcularPorcentajeCumplimiento('auto-1');

      // Calculation: (2*1 + 3*0.5 + 1*0) / (2+3+1) * 100 = 3.5/6 * 100 = 58.33%
      expect(prisma.autoevaluacionHabilitacion.update).toHaveBeenCalled();
      expect(result).toBeCloseTo(58.33, 1);
    });

    it('debe retornar 0 si no hay criterios', async () => {
      const mockAutoevaluacion = {
        id: 'auto-1',
        estandar: { criterios: [] },
        criteriosEvaluados: [],
      };

      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(mockAutoevaluacion);

      const result = await habilitacionService.calcularPorcentajeCumplimiento('auto-1');

      expect(result).toBe(0);
    });

    it('debe lanzar error si la autoevaluación no existe', async () => {
      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.calcularPorcentajeCumplimiento('invalid-id')
      ).rejects.toThrow('Autoevaluación no encontrada');
    });
  });

  describe('cerrarAutoevaluacion', () => {
    it('debe cerrar una autoevaluación y calcular el porcentaje final', async () => {
      const mockAutoevaluacion = {
        id: 'auto-1',
        estado: 'En Proceso',
        estandar: {
          criterios: [{ id: 'c1', peso: 1 }],
        },
        criteriosEvaluados: [{ criterioId: 'c1', cumplimiento: 'CUMPLE' }],
      };

      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(mockAutoevaluacion);
      prisma.autoevaluacionHabilitacion.update.mockResolvedValue({
        ...mockAutoevaluacion,
        estado: 'Cerrada',
        fechaCierre: new Date(),
      });

      const result = await habilitacionService.cerrarAutoevaluacion('auto-1');

      expect(prisma.autoevaluacionHabilitacion.update).toHaveBeenCalled();
      expect(result.estado).toBe('Cerrada');
    });

    it('debe lanzar error si la autoevaluación no existe', async () => {
      prisma.autoevaluacionHabilitacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.cerrarAutoevaluacion('invalid-id')
      ).rejects.toThrow('Autoevaluación no encontrada');
    });
  });

  // ==========================================
  // VISITAS DE VERIFICACIÓN
  // ==========================================
  describe('getVisitas', () => {
    it('debe retornar lista de visitas con paginación', async () => {
      const mockVisitas = [
        { id: 'v1', tipoVisita: 'Verificación', estado: 'Programada' },
        { id: 'v2', tipoVisita: 'Seguimiento', estado: 'Realizada' },
      ];

      prisma.visitaVerificacion.findMany.mockResolvedValue(mockVisitas);
      prisma.visitaVerificacion.count.mockResolvedValue(2);

      const result = await habilitacionService.getVisitas({ page: 1, limit: 10 });

      expect(result.visitas).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });
  });

  describe('getVisitaById', () => {
    it('debe retornar una visita por ID', async () => {
      const mockVisita = {
        id: 'v1',
        tipoVisita: 'Verificación',
        estado: 'Programada',
        planesMejora: [],
      };

      prisma.visitaVerificacion.findUnique.mockResolvedValue(mockVisita);

      const result = await habilitacionService.getVisitaById('v1');

      expect(prisma.visitaVerificacion.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'v1' },
        })
      );
      expect(result.id).toBe('v1');
    });

    it('debe lanzar error si la visita no existe', async () => {
      prisma.visitaVerificacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.getVisitaById('invalid-id')
      ).rejects.toThrow('Visita de verificación no encontrada');
    });
  });

  describe('createVisita', () => {
    it('debe crear una nueva visita de verificación', async () => {
      const nuevaVisita = {
        tipoVisita: 'Verificación',
        entidadVisitadora: 'Secretaría de Salud',
        fechaVisita: '2024-12-25',
      };

      prisma.visitaVerificacion.create.mockResolvedValue({
        id: 'v1',
        ...nuevaVisita,
        fechaVisita: new Date(nuevaVisita.fechaVisita),
        estado: 'Programada',
      });

      const result = await habilitacionService.createVisita(nuevaVisita);

      expect(prisma.visitaVerificacion.create).toHaveBeenCalled();
      expect(result.estado).toBe('Programada');
      expect(result.tipoVisita).toBe('Verificación');
    });
  });

  describe('updateVisita', () => {
    it('debe actualizar una visita existente', async () => {
      const visitaExistente = { id: 'v1', tipoVisita: 'Verificación', estado: 'Programada' };
      const datosActualizados = { estado: 'Realizada' };

      prisma.visitaVerificacion.findUnique.mockResolvedValue(visitaExistente);
      prisma.visitaVerificacion.update.mockResolvedValue({ ...visitaExistente, ...datosActualizados });

      const result = await habilitacionService.updateVisita('v1', datosActualizados);

      expect(prisma.visitaVerificacion.update).toHaveBeenCalled();
      expect(result.estado).toBe('Realizada');
    });

    it('debe lanzar error si la visita no existe', async () => {
      prisma.visitaVerificacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.updateVisita('invalid-id', { estado: 'Realizada' })
      ).rejects.toThrow('Visita no encontrada');
    });
  });

  describe('registrarHallazgosVisita', () => {
    it('debe registrar hallazgos de una visita', async () => {
      const hallazgos = [
        { tipo: 'Hallazgo 1', descripcion: 'Descripción 1' },
        { tipo: 'Hallazgo 2', descripcion: 'Descripción 2' },
      ];

      prisma.visitaVerificacion.findUnique.mockResolvedValue({ id: 'v1' });
      prisma.visitaVerificacion.update.mockResolvedValue({
        id: 'v1',
        hallazgos,
        estado: 'Realizada',
        requierePlanMejora: true,
      });

      const result = await habilitacionService.registrarHallazgosVisita('v1', hallazgos);

      expect(prisma.visitaVerificacion.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          hallazgos,
          estado: 'Realizada',
          requierePlanMejora: true,
        },
      });
      expect(result.estado).toBe('Realizada');
      expect(result.requierePlanMejora).toBe(true);
    });

    it('debe lanzar error si la visita no existe', async () => {
      prisma.visitaVerificacion.findUnique.mockResolvedValue(null);

      await expect(
        habilitacionService.registrarHallazgosVisita('invalid-id', [])
      ).rejects.toThrow('Visita no encontrada');
    });
  });

  // ==========================================
  // REPORTES Y ESTADÍSTICAS
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar el dashboard con estadísticas', async () => {
      prisma.estandarHabilitacion.count.mockResolvedValue(10);
      prisma.autoevaluacionHabilitacion.count
        .mockResolvedValueOnce(5)  // En Proceso
        .mockResolvedValueOnce(15); // Cerrada
      prisma.visitaVerificacion.count
        .mockResolvedValueOnce(3)  // Programada
        .mockResolvedValueOnce(7); // Realizada
      prisma.autoevaluacionHabilitacion.findMany.mockResolvedValue([]);
      prisma.visitaVerificacion.findMany.mockResolvedValue([]);
      prisma.autoevaluacionHabilitacion.groupBy.mockResolvedValue([]);

      const result = await habilitacionService.getDashboard();

      expect(result.resumen).toEqual({
        totalEstandares: 10,
        autoevaluacionesEnProceso: 5,
        autoevaluacionesCerradas: 15,
        visitasProgramadas: 3,
        visitasRealizadas: 7,
      });
      expect(result).toHaveProperty('ultimasAutoevaluaciones');
      expect(result).toHaveProperty('proximasVisitas');
      expect(result).toHaveProperty('promediosPorEstandar');
    });
  });

  describe('generarDeclaracionREPS', () => {
    it('debe generar declaración para REPS', async () => {
      const mockEstandares = [
        {
          codigo: 'TH-001',
          nombre: 'Talento Humano',
          tipo: 'TALENTO_HUMANO',
          activo: true,
          autoevaluaciones: [
            {
              porcentajeCumplimiento: 85,
              fechaCierre: new Date('2024-12-01'),
            },
          ],
        },
      ];

      prisma.estandarHabilitacion.findMany.mockResolvedValue(mockEstandares);

      const result = await habilitacionService.generarDeclaracionREPS();

      expect(result).toHaveProperty('fechaGeneracion');
      expect(result).toHaveProperty('codigoHabilitacion');
      expect(result.estandares).toHaveLength(1);
      expect(result.estandares[0].codigo).toBe('TH-001');
      expect(result.estandares[0].cumplimiento).toBe(85);
    });
  });
});
