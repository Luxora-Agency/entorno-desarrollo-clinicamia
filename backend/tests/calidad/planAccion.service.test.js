/**
 * Tests para PlanAccion Service
 */
const prisma = require('../../db/prisma');
const planAccionService = require('../../services/planAccion.service');

describe('PlanAccionService', () => {
  // ==========================================
  // PLANES DE ACCIÓN
  // ==========================================
  describe('getPlanes', () => {
    it('debe retornar lista paginada de planes de acción', async () => {
      const mockPlanes = [
        { id: '1', codigo: 'PA-001', origen: 'Habilitacion', estado: 'Abierto' },
        { id: '2', codigo: 'PA-002', origen: 'PAMEC', estado: 'En Ejecución' },
      ];

      prisma.planAccionCalidad.findMany.mockResolvedValue(mockPlanes);
      prisma.planAccionCalidad.count.mockResolvedValue(2);

      const result = await planAccionService.getPlanes({ page: 1, limit: 10 });

      expect(result.planes).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por origen', async () => {
      const mockPlanes = [
        { id: '1', codigo: 'PA-001', origen: 'EventoAdverso' },
      ];

      prisma.planAccionCalidad.findMany.mockResolvedValue(mockPlanes);
      prisma.planAccionCalidad.count.mockResolvedValue(1);

      const result = await planAccionService.getPlanes({ origen: 'EventoAdverso' });

      expect(result.planes[0].origen).toBe('EventoAdverso');
    });

    it('debe filtrar por estado', async () => {
      const mockPlanes = [
        { id: '1', codigo: 'PA-001', estado: 'Cerrado' },
      ];

      prisma.planAccionCalidad.findMany.mockResolvedValue(mockPlanes);
      prisma.planAccionCalidad.count.mockResolvedValue(1);

      const result = await planAccionService.getPlanes({ estado: 'Cerrado' });

      expect(result.planes[0].estado).toBe('Cerrado');
    });

    it('debe filtrar por responsable', async () => {
      const mockPlanes = [
        { id: '1', codigo: 'PA-001', responsableId: 'user-1' },
      ];

      prisma.planAccionCalidad.findMany.mockResolvedValue(mockPlanes);
      prisma.planAccionCalidad.count.mockResolvedValue(1);

      const result = await planAccionService.getPlanes({ responsableId: 'user-1' });

      expect(result.planes[0].responsableId).toBe('user-1');
    });
  });

  describe('getPlanById', () => {
    it('debe retornar un plan con sus seguimientos y evidencias', async () => {
      const mockPlan = {
        id: '1',
        codigo: 'PA-001',
        origen: 'PAMEC',
        descripcionProblema: 'Problema identificado',
        accionPropuesta: 'Acción correctiva',
        responsable: { nombre: 'Juan' },
        seguimientos: [
          { id: 's1', avanceReportado: 50 },
        ],
        evidencias: [
          { id: 'e1', nombre: 'Evidencia 1' },
        ],
      };

      prisma.planAccionCalidad.findUnique.mockResolvedValue(mockPlan);

      const result = await planAccionService.getPlanById('1');

      expect(result.codigo).toBe('PA-001');
      expect(result.seguimientos).toHaveLength(1);
      expect(result.evidencias).toHaveLength(1);
    });

    it('debe lanzar error si el plan no existe', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue(null);

      await expect(planAccionService.getPlanById('999')).rejects.toThrow();
    });
  });

  describe('createPlan', () => {
    it('debe crear un nuevo plan de acción', async () => {
      const nuevoPlan = {
        origen: 'Habilitacion',
        autoevaluacionId: 'ae-1',
        descripcionProblema: 'No conformidad detectada',
        causaRaiz: 'Falta de capacitación',
        accionPropuesta: 'Capacitar al personal',
        tipoAccion: 'Correctiva',
        responsableId: 'user-id',
        fechaInicio: new Date('2025-01-01'),
        fechaLimite: new Date('2025-03-01'),
      };

      prisma.usuario.findUnique.mockResolvedValue({ id: 'user-id', nombre: 'Test User' });
      prisma.planAccionCalidad.create.mockResolvedValue({
        id: '1',
        codigo: 'PA-20251217-001',
        ...nuevoPlan,
        estado: 'Abierto',
        avancePorcentaje: 0,
      });

      const result = await planAccionService.createPlan(nuevoPlan);

      expect(prisma.planAccionCalidad.create).toHaveBeenCalled();
      expect(result.estado).toBe('Abierto');
      expect(result.avancePorcentaje).toBe(0);
    });

    it('debe lanzar error si el responsable no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        planAccionService.createPlan({
          origen: 'Habilitacion',
          descripcionProblema: 'Test',
          accionPropuesta: 'Test',
          tipoAccion: 'Correctiva',
          responsableId: 'invalid',
          fechaInicio: new Date(),
          fechaLimite: new Date(),
        })
      ).rejects.toThrow();
    });

    it('debe lanzar error si fecha límite es anterior a fecha inicio', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'user-id' });

      await expect(
        planAccionService.createPlan({
          origen: 'Habilitacion',
          descripcionProblema: 'Test',
          accionPropuesta: 'Test',
          tipoAccion: 'Correctiva',
          responsableId: 'user-id',
          fechaInicio: new Date('2025-03-01'),
          fechaLimite: new Date('2025-01-01'),
        })
      ).rejects.toThrow();
    });
  });

  describe('updatePlan', () => {
    it('debe actualizar un plan existente', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'Abierto' });
      prisma.planAccionCalidad.update.mockResolvedValue({
        id: '1',
        accionPropuesta: 'Acción actualizada',
        recursos: 'Recursos adicionales',
      });

      const result = await planAccionService.updatePlan('1', {
        accionPropuesta: 'Acción actualizada',
        recursos: 'Recursos adicionales',
      });

      expect(prisma.planAccionCalidad.update).toHaveBeenCalled();
      expect(result.accionPropuesta).toBe('Acción actualizada');
    });

    it('debe lanzar error si el plan no existe', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue(null);

      await expect(planAccionService.updatePlan('999', {})).rejects.toThrow();
    });
  });

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================
  describe('registrarSeguimiento', () => {
    it('debe registrar un seguimiento del plan', async () => {
      const seguimiento = {
        planId: 'p1',
        avanceReportado: 50,
        descripcionAvance: 'Se completó la primera fase',
        dificultades: 'Ninguna',
        registradoPor: 'user-id',
      };

      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1', estado: 'Abierto', avancePorcentaje: 25 });
      prisma.seguimientoPlanAccion.create.mockResolvedValue({
        id: 's1',
        ...seguimiento,
        fechaSeguimiento: new Date(),
      });
      prisma.planAccionCalidad.update.mockResolvedValue({
        id: 'p1',
        avancePorcentaje: 50,
        estado: 'En Ejecución',
      });

      const result = await planAccionService.registrarSeguimiento(seguimiento);

      expect(prisma.seguimientoPlanAccion.create).toHaveBeenCalled();
      expect(result.avanceReportado).toBe(50);
    });

    it('debe actualizar estado a En Ejecución si avance > 0', async () => {
      const seguimiento = {
        planId: 'p1',
        avanceReportado: 25,
        descripcionAvance: 'Inicio de actividades',
        registradoPor: 'user-id',
      };

      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1', estado: 'Abierto', avancePorcentaje: 0 });
      prisma.seguimientoPlanAccion.create.mockResolvedValue({ id: 's1', ...seguimiento });
      prisma.planAccionCalidad.update.mockResolvedValue({
        id: 'p1',
        avancePorcentaje: 25,
        estado: 'En Ejecución',
      });

      await planAccionService.registrarSeguimiento(seguimiento);

      expect(prisma.planAccionCalidad.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'En Ejecución' }),
        })
      );
    });

    it('debe lanzar error si el plan está cerrado', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1', estado: 'Cerrado' });

      await expect(
        planAccionService.registrarSeguimiento({
          planId: 'p1',
          avanceReportado: 50,
          descripcionAvance: 'Test',
          registradoPor: 'user-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('getSeguimientos', () => {
    it('debe retornar seguimientos de un plan', async () => {
      const mockSeguimientos = [
        { id: 's1', avanceReportado: 25, fechaSeguimiento: new Date() },
        { id: 's2', avanceReportado: 50, fechaSeguimiento: new Date() },
        { id: 's3', avanceReportado: 75, fechaSeguimiento: new Date() },
      ];

      prisma.seguimientoPlanAccion.findMany.mockResolvedValue(mockSeguimientos);

      const result = await planAccionService.getSeguimientos('p1');

      expect(result).toHaveLength(3);
    });
  });

  // ==========================================
  // EVIDENCIAS
  // ==========================================
  describe('cargarEvidencia', () => {
    it('debe cargar evidencia a un plan', async () => {
      const evidencia = {
        planAccionId: 'p1',
        tipo: 'Documento',
        nombre: 'Informe de avance',
        archivoUrl: '/uploads/informe.pdf',
        cargadoPor: 'user-id',
      };

      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.evidenciaCalidad.create.mockResolvedValue({
        id: 'e1',
        ...evidencia,
        fechaCargue: new Date(),
      });

      const result = await planAccionService.cargarEvidencia(evidencia);

      expect(prisma.evidenciaCalidad.create).toHaveBeenCalled();
      expect(result.tipo).toBe('Documento');
    });

    it('debe lanzar error si el plan no existe', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue(null);

      await expect(
        planAccionService.cargarEvidencia({
          planAccionId: 'invalid',
          tipo: 'Documento',
          nombre: 'Test',
          archivoUrl: '/test.pdf',
          cargadoPor: 'user-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('getEvidencias', () => {
    it('debe retornar evidencias de un plan', async () => {
      const mockEvidencias = [
        { id: 'e1', nombre: 'Evidencia 1', tipo: 'Foto' },
        { id: 'e2', nombre: 'Evidencia 2', tipo: 'Documento' },
      ];

      prisma.evidenciaCalidad.findMany.mockResolvedValue(mockEvidencias);

      const result = await planAccionService.getEvidencias('p1');

      expect(result).toHaveLength(2);
    });
  });

  describe('eliminarEvidencia', () => {
    it('debe eliminar una evidencia', async () => {
      prisma.evidenciaCalidad.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.evidenciaCalidad.delete.mockResolvedValue({ id: 'e1' });

      const result = await planAccionService.eliminarEvidencia('e1');

      expect(prisma.evidenciaCalidad.delete).toHaveBeenCalled();
    });

    it('debe lanzar error si la evidencia no existe', async () => {
      prisma.evidenciaCalidad.findUnique.mockResolvedValue(null);

      await expect(planAccionService.eliminarEvidencia('invalid')).rejects.toThrow();
    });
  });

  // ==========================================
  // CIERRE DE PLANES
  // ==========================================
  describe('cerrarPlan', () => {
    it('debe cerrar un plan con resultado obtenido', async () => {
      const cierre = {
        resultadoObtenido: 'Se logró el objetivo propuesto',
        eficaciaVerificada: true,
      };

      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1', avancePorcentaje: 100 });
      prisma.planAccionCalidad.update.mockResolvedValue({
        id: 'p1',
        estado: 'Cerrado',
        fechaCierre: new Date(),
        ...cierre,
      });

      const result = await planAccionService.cerrarPlan('p1', cierre);

      expect(result.estado).toBe('Cerrado');
      expect(result.eficaciaVerificada).toBe(true);
    });

    it('debe lanzar error si el plan no existe', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue(null);

      await expect(
        planAccionService.cerrarPlan('invalid', { resultadoObtenido: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('cancelarPlan', () => {
    it('debe cancelar un plan', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.planAccionCalidad.update.mockResolvedValue({
        id: 'p1',
        estado: 'Cancelado',
      });

      const result = await planAccionService.cancelarPlan('p1', 'Motivo de cancelación');

      expect(prisma.planAccionCalidad.update).toHaveBeenCalled();
    });
  });

  describe('reabrirPlan', () => {
    it('debe reabrir un plan cerrado', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1', estado: 'Cerrado' });
      prisma.planAccionCalidad.update.mockResolvedValue({
        id: 'p1',
        estado: 'En Ejecución',
      });

      const result = await planAccionService.reabrirPlan('p1', new Date('2025-06-01'));

      expect(result.estado).toBe('En Ejecución');
    });

    it('debe lanzar error si el plan no está cerrado', async () => {
      prisma.planAccionCalidad.findUnique.mockResolvedValue({ id: 'p1', estado: 'Abierto' });

      await expect(planAccionService.reabrirPlan('p1')).rejects.toThrow();
    });
  });

  // ==========================================
  // DASHBOARD Y ESTADÍSTICAS
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar datos del dashboard de planes de acción', async () => {
      prisma.planAccionCalidad.count.mockResolvedValue(50);
      prisma.planAccionCalidad.groupBy.mockResolvedValue([
        { estado: 'Abierto', _count: 20 },
        { estado: 'En Ejecución', _count: 15 },
        { estado: 'Cerrado', _count: 15 },
      ]);
      prisma.planAccionCalidad.aggregate.mockResolvedValue({
        _avg: { avancePorcentaje: 75 },
      });
      prisma.planAccionCalidad.findMany.mockResolvedValue([]);

      const result = await planAccionService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('totalPlanes');
      expect(result).toHaveProperty('planesPorEstado');
      expect(result).toHaveProperty('planesPorOrigen');
    });
  });

  describe('getReporteEficacia', () => {
    it('debe retornar reporte de eficacia de planes', async () => {
      const mockPlanes = [
        { id: 'p1', origen: 'PAMEC', eficaciaVerificada: true },
        { id: 'p2', origen: 'PAMEC', eficaciaVerificada: true },
        { id: 'p3', origen: 'Habilitacion', eficaciaVerificada: false },
      ];

      prisma.planAccionCalidad.findMany.mockResolvedValue(mockPlanes);

      const result = await planAccionService.getReporteEficacia('2025-01-01', '2025-12-31');

      expect(result).toHaveProperty('totales');
      expect(result).toHaveProperty('tasaEficacia');
      expect(result).toHaveProperty('porOrigen');
    });
  });

  describe('getPlanesPorVencer', () => {
    it('debe retornar planes próximos a vencer', async () => {
      const fechaProxima = new Date();
      fechaProxima.setDate(fechaProxima.getDate() + 5);

      const mockPlanes = [
        { id: '1', codigo: 'PA-001', fechaLimite: fechaProxima, estado: 'En Ejecución' },
      ];

      prisma.planAccionCalidad.findMany.mockResolvedValue(mockPlanes);

      const result = await planAccionService.getPlanesPorVencer(7);

      expect(result).toHaveLength(1);
    });
  });
});
