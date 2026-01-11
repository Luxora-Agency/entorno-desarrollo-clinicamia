/**
 * Tests para SeguridadPaciente Service
 */
const prisma = require('../../db/prisma');
const seguridadPacienteService = require('../../services/seguridadPaciente.service');

describe('SeguridadPacienteService', () => {
  // ==========================================
  // PRÁCTICAS SEGURAS
  // ==========================================
  describe('getPracticas', () => {
    it('debe retornar lista de prácticas seguras activas', async () => {
      const mockPracticas = [
        {
          id: '1',
          codigo: 'PS01',
          nombre: 'Identificación correcta del paciente',
          categoria: 'Identificacion',
          activo: true,
          _count: { adherencias: 5 }
        },
        {
          id: '2',
          codigo: 'PS02',
          nombre: 'Comunicación efectiva (SBAR)',
          categoria: 'Comunicacion',
          activo: true,
          _count: { adherencias: 3 }
        },
      ];

      prisma.practicaSegura.findMany.mockResolvedValue(mockPracticas);

      const result = await seguridadPacienteService.getPracticas({});

      expect(prisma.practicaSegura.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('_count');
    });

    it('debe filtrar por categoría', async () => {
      const mockPracticas = [
        {
          id: '1',
          codigo: 'PS03',
          nombre: 'Medicamentos de alto riesgo',
          categoria: 'MedicamentosAltoRiesgo',
          _count: { adherencias: 2 }
        },
      ];

      prisma.practicaSegura.findMany.mockResolvedValue(mockPracticas);

      const result = await seguridadPacienteService.getPracticas({ categoria: 'MedicamentosAltoRiesgo' });

      expect(result[0].categoria).toBe('MedicamentosAltoRiesgo');
    });

    it('debe filtrar por estado activo', async () => {
      const mockPracticas = [
        {
          id: '1',
          codigo: 'PS01',
          nombre: 'Práctica activa',
          activo: true,
          _count: { adherencias: 1 }
        },
      ];

      prisma.practicaSegura.findMany.mockResolvedValue(mockPracticas);

      const result = await seguridadPacienteService.getPracticas({ activo: true });

      expect(result[0].activo).toBe(true);
    });
  });

  describe('getPracticaById', () => {
    it('debe retornar una práctica con sus adherencias', async () => {
      const mockPractica = {
        id: '1',
        codigo: 'PS01',
        nombre: 'Identificación correcta del paciente',
        checklistItems: ['Item 1', 'Item 2'],
        adherencias: [
          {
            id: 'a1',
            periodo: '2025-01',
            porcentajeAdherencia: 95,
            evaluador: { nombre: 'Juan', apellido: 'Pérez' }
          },
        ],
      };

      prisma.practicaSegura.findUnique.mockResolvedValue(mockPractica);

      const result = await seguridadPacienteService.getPracticaById('1');

      expect(result.codigo).toBe('PS01');
      expect(result.adherencias).toHaveLength(1);
      expect(prisma.practicaSegura.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          adherencias: {
            orderBy: { periodo: 'desc' },
            take: 12,
            include: {
              evaluador: { select: { nombre: true, apellido: true } },
            },
          },
        },
      });
    });

    it('debe lanzar error si la práctica no existe', async () => {
      prisma.practicaSegura.findUnique.mockResolvedValue(null);

      await expect(seguridadPacienteService.getPracticaById('999')).rejects.toThrow('Práctica segura no encontrada');
    });
  });

  describe('createPractica', () => {
    it('debe crear una nueva práctica segura', async () => {
      const nuevaPractica = {
        codigo: 'PS08',
        nombre: 'Nueva Práctica',
        categoria: 'Otra',
        descripcion: 'Descripción de la práctica',
        checklistItems: ['Verificar A', 'Verificar B'],
        frecuenciaMonitoreo: 'Mensual',
        responsable: 'Calidad',
      };

      prisma.practicaSegura.findUnique.mockResolvedValue(null);
      prisma.practicaSegura.create.mockResolvedValue({ id: '1', ...nuevaPractica, activo: true });

      const result = await seguridadPacienteService.createPractica(nuevaPractica);

      expect(prisma.practicaSegura.findUnique).toHaveBeenCalledWith({ where: { codigo: 'PS08' } });
      expect(prisma.practicaSegura.create).toHaveBeenCalled();
      expect(result.codigo).toBe('PS08');
    });

    it('debe lanzar error si el código ya existe', async () => {
      const nuevaPractica = {
        codigo: 'PS01',
        nombre: 'Práctica duplicada',
        categoria: 'Otra',
        descripcion: 'Descripción',
        checklistItems: [],
      };

      prisma.practicaSegura.findUnique.mockResolvedValue({ id: '1', codigo: 'PS01' });

      await expect(seguridadPacienteService.createPractica(nuevaPractica)).rejects.toThrow('Ya existe una práctica segura con este código');
    });
  });

  describe('updatePractica', () => {
    it('debe actualizar una práctica existente', async () => {
      const updates = {
        nombre: 'Nombre actualizado',
        descripcion: 'Nueva descripción',
      };

      prisma.practicaSegura.findUnique.mockResolvedValue({ id: '1', codigo: 'PS01' });
      prisma.practicaSegura.update.mockResolvedValue({ id: '1', codigo: 'PS01', ...updates });

      const result = await seguridadPacienteService.updatePractica('1', updates);

      expect(prisma.practicaSegura.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updates,
      });
      expect(result.nombre).toBe('Nombre actualizado');
    });

    it('debe lanzar error si la práctica no existe', async () => {
      prisma.practicaSegura.findUnique.mockResolvedValue(null);

      await expect(seguridadPacienteService.updatePractica('999', {})).rejects.toThrow('Práctica segura no encontrada');
    });
  });

  // ==========================================
  // ADHERENCIA A PRÁCTICAS SEGURAS
  // ==========================================
  describe('registrarAdherencia', () => {
    it('debe registrar evaluación de adherencia (nuevo registro)', async () => {
      const adherencia = {
        practicaId: 'p1',
        periodo: '2025-01',
        totalEvaluados: 100,
        totalCumplen: 92,
        evaluadorId: 'user-id',
        observaciones: 'Evaluación mensual',
      };

      prisma.practicaSegura.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.adherenciaPracticaSegura.findFirst.mockResolvedValue(null);
      prisma.adherenciaPracticaSegura.create.mockResolvedValue({
        id: 'a1',
        ...adherencia,
        porcentajeAdherencia: 92.00,
        fechaEvaluacion: new Date(),
      });

      const result = await seguridadPacienteService.registrarAdherencia(adherencia);

      expect(prisma.adherenciaPracticaSegura.create).toHaveBeenCalled();
      expect(result.porcentajeAdherencia).toBe(92.00);
    });

    it('debe actualizar evaluación existente si ya existe para el periodo', async () => {
      const adherencia = {
        practicaId: 'p1',
        periodo: '2025-01',
        totalEvaluados: 100,
        totalCumplen: 95,
        evaluadorId: 'user-id',
      };

      const existingAdherencia = {
        id: 'a1',
        practicaId: 'p1',
        periodo: '2025-01',
        totalEvaluados: 80,
        totalCumplen: 70,
        porcentajeAdherencia: 87.5,
      };

      prisma.practicaSegura.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.adherenciaPracticaSegura.findFirst.mockResolvedValue(existingAdherencia);
      prisma.adherenciaPracticaSegura.update.mockResolvedValue({
        ...existingAdherencia,
        ...adherencia,
        porcentajeAdherencia: 95.00,
        fechaEvaluacion: new Date(),
      });

      const result = await seguridadPacienteService.registrarAdherencia(adherencia);

      expect(prisma.adherenciaPracticaSegura.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: expect.objectContaining({
          totalEvaluados: 100,
          totalCumplen: 95,
          porcentajeAdherencia: 95,
        }),
      });
      expect(result.porcentajeAdherencia).toBe(95.00);
    });

    it('debe lanzar error si la práctica no existe', async () => {
      const adherencia = {
        practicaId: 'p999',
        periodo: '2025-01',
        totalEvaluados: 100,
        totalCumplen: 92,
      };

      prisma.practicaSegura.findUnique.mockResolvedValue(null);

      await expect(seguridadPacienteService.registrarAdherencia(adherencia)).rejects.toThrow('Práctica segura no encontrada');
    });
  });

  describe('getHistorialAdherencia', () => {
    it('debe retornar historial de adherencia de una práctica', async () => {
      const mockAdherencias = [
        {
          id: 'a1',
          periodo: '2025-01',
          porcentajeAdherencia: 92,
          evaluador: { nombre: 'Juan', apellido: 'Pérez' }
        },
        {
          id: 'a2',
          periodo: '2024-12',
          porcentajeAdherencia: 88,
          evaluador: { nombre: 'María', apellido: 'García' }
        },
      ];

      prisma.adherenciaPracticaSegura.findMany.mockResolvedValue(mockAdherencias);

      const result = await seguridadPacienteService.getHistorialAdherencia('p1');

      expect(prisma.adherenciaPracticaSegura.findMany).toHaveBeenCalledWith({
        where: { practicaId: 'p1' },
        include: {
          evaluador: { select: { nombre: true, apellido: true } },
        },
        orderBy: { periodo: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].porcentajeAdherencia).toBe(92);
    });

    it('debe filtrar por rango de periodos', async () => {
      const mockAdherencias = [
        { id: 'a1', periodo: '2025-01', porcentajeAdherencia: 92 },
      ];

      prisma.adherenciaPracticaSegura.findMany.mockResolvedValue(mockAdherencias);

      const result = await seguridadPacienteService.getHistorialAdherencia('p1', {
        periodoDesde: '2025-01',
        periodoHasta: '2025-03',
      });

      expect(prisma.adherenciaPracticaSegura.findMany).toHaveBeenCalledWith({
        where: {
          practicaId: 'p1',
          periodo: {
            gte: '2025-01',
            lte: '2025-03',
          },
        },
        include: {
          evaluador: { select: { nombre: true, apellido: true } },
        },
        orderBy: { periodo: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  // ==========================================
  // RONDAS DE SEGURIDAD
  // ==========================================
  describe('getRondas', () => {
    it('debe retornar lista paginada de rondas', async () => {
      const mockRondas = [
        {
          id: 'r1',
          estado: 'Programada',
          fechaProgramada: new Date(),
          ejecutor: { id: '1', nombre: 'Juan', apellido: 'Pérez' },
          _count: { accionesCorrectivas: 0 }
        },
        {
          id: 'r2',
          estado: 'Ejecutada',
          fechaProgramada: new Date(),
          ejecutor: { id: '2', nombre: 'María', apellido: 'García' },
          _count: { accionesCorrectivas: 2 }
        },
      ];

      prisma.rondaSeguridad.findMany.mockResolvedValue(mockRondas);
      prisma.rondaSeguridad.count.mockResolvedValue(2);

      const result = await seguridadPacienteService.getRondas({ page: 1, limit: 10 });

      expect(result.rondas).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('debe filtrar por estado', async () => {
      const mockRondas = [
        {
          id: 'r1',
          estado: 'Ejecutada',
          ejecutor: { id: '1', nombre: 'Juan', apellido: 'Pérez' },
          _count: { accionesCorrectivas: 1 }
        },
      ];

      prisma.rondaSeguridad.findMany.mockResolvedValue(mockRondas);
      prisma.rondaSeguridad.count.mockResolvedValue(1);

      const result = await seguridadPacienteService.getRondas({ estado: 'Ejecutada' });

      expect(result.rondas[0].estado).toBe('Ejecutada');
    });

    it('debe filtrar por servicio y unidad', async () => {
      const mockRondas = [
        { id: 'r1', estado: 'Programada', servicioId: 's1', unidadId: 'u1' },
      ];

      prisma.rondaSeguridad.findMany.mockResolvedValue(mockRondas);
      prisma.rondaSeguridad.count.mockResolvedValue(1);

      await seguridadPacienteService.getRondas({ servicioId: 's1', unidadId: 'u1' });

      expect(prisma.rondaSeguridad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            servicioId: 's1',
            unidadId: 'u1',
          }),
        })
      );
    });
  });

  describe('getRondaById', () => {
    it('debe retornar una ronda con sus detalles', async () => {
      const mockRonda = {
        id: 'r1',
        estado: 'Ejecutada',
        fechaProgramada: new Date(),
        fechaEjecucion: new Date(),
        ejecutor: { id: '1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com' },
        accionesCorrectivas: [
          { id: 'ac1', descripcion: 'Acción 1', responsable: { nombre: 'Pedro', apellido: 'López' } },
        ],
      };

      prisma.rondaSeguridad.findUnique.mockResolvedValue(mockRonda);

      const result = await seguridadPacienteService.getRondaById('r1');

      expect(result.id).toBe('r1');
      expect(result.ejecutor).toHaveProperty('email');
      expect(result.accionesCorrectivas).toHaveLength(1);
    });

    it('debe lanzar error si la ronda no existe', async () => {
      prisma.rondaSeguridad.findUnique.mockResolvedValue(null);

      await expect(seguridadPacienteService.getRondaById('999')).rejects.toThrow('Ronda de seguridad no encontrada');
    });
  });

  describe('programarRonda', () => {
    it('debe programar una nueva ronda de seguridad', async () => {
      const nuevaRonda = {
        servicioId: 's1',
        unidadId: 'u1',
        fechaProgramada: '2025-12-20',
        checklistUsado: 'Checklist General',
        observaciones: 'Ronda programada',
      };

      prisma.rondaSeguridad.create.mockResolvedValue({
        id: 'r1',
        ...nuevaRonda,
        fechaProgramada: new Date(nuevaRonda.fechaProgramada),
        estado: 'Programada',
      });

      const result = await seguridadPacienteService.programarRonda(nuevaRonda);

      expect(prisma.rondaSeguridad.create).toHaveBeenCalledWith({
        data: {
          servicioId: 's1',
          unidadId: 'u1',
          fechaProgramada: new Date('2025-12-20'),
          checklistUsado: 'Checklist General',
          observaciones: 'Ronda programada',
          estado: 'Programada',
        },
      });
      expect(result.estado).toBe('Programada');
    });
  });

  describe('ejecutarRonda', () => {
    it('debe registrar la ejecución de una ronda', async () => {
      const datosEjecucion = {
        ejecutorId: 'user-id',
        hallazgos: [
          { tipo: 'Riesgo', descripcion: 'Piso mojado sin señalización' },
        ],
        observaciones: 'Se requiere señalización',
        fotosEvidencia: ['foto1.jpg', 'foto2.jpg'],
      };

      prisma.rondaSeguridad.findUnique.mockResolvedValue({ id: 'r1', estado: 'Programada' });
      prisma.rondaSeguridad.update.mockResolvedValue({
        id: 'r1',
        estado: 'Ejecutada',
        fechaEjecucion: new Date(),
        ...datosEjecucion,
      });

      const result = await seguridadPacienteService.ejecutarRonda('r1', datosEjecucion);

      expect(prisma.rondaSeguridad.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: expect.objectContaining({
          ejecutorId: 'user-id',
          fechaEjecucion: expect.any(Date),
          hallazgos: datosEjecucion.hallazgos,
          fotosEvidencia: ['foto1.jpg', 'foto2.jpg'],
          observaciones: 'Se requiere señalización',
          estado: 'Ejecutada',
        }),
      });
      expect(result.estado).toBe('Ejecutada');
      expect(result.hallazgos).toHaveLength(1);
    });

    it('debe manejar ejecución sin fotos de evidencia', async () => {
      const datosEjecucion = {
        ejecutorId: 'user-id',
        hallazgos: [],
        observaciones: 'Sin hallazgos',
      };

      prisma.rondaSeguridad.findUnique.mockResolvedValue({ id: 'r1', estado: 'Programada' });
      prisma.rondaSeguridad.update.mockResolvedValue({
        id: 'r1',
        estado: 'Ejecutada',
        ...datosEjecucion,
        fotosEvidencia: [],
      });

      const result = await seguridadPacienteService.ejecutarRonda('r1', datosEjecucion);

      expect(result.fotosEvidencia).toEqual([]);
    });

    it('debe lanzar error si la ronda no existe', async () => {
      prisma.rondaSeguridad.findUnique.mockResolvedValue(null);

      await expect(seguridadPacienteService.ejecutarRonda('999', {})).rejects.toThrow('Ronda de seguridad no encontrada');
    });
  });

  describe('cerrarRonda', () => {
    it('debe cerrar una ronda ejecutada', async () => {
      prisma.rondaSeguridad.findUnique.mockResolvedValue({ id: 'r1', estado: 'Ejecutada' });
      prisma.rondaSeguridad.update.mockResolvedValue({
        id: 'r1',
        estado: 'Cerrada',
      });

      const result = await seguridadPacienteService.cerrarRonda('r1');

      expect(prisma.rondaSeguridad.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { estado: 'Cerrada' },
      });
      expect(result.estado).toBe('Cerrada');
    });

    it('debe lanzar error si la ronda no existe', async () => {
      prisma.rondaSeguridad.findUnique.mockResolvedValue(null);

      await expect(seguridadPacienteService.cerrarRonda('999')).rejects.toThrow('Ronda de seguridad no encontrada');
    });
  });

  // ==========================================
  // DASHBOARD DE SEGURIDAD
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar datos del dashboard de seguridad', async () => {
      // Mock para contar prácticas activas
      prisma.practicaSegura.count.mockResolvedValue(7);

      // Mock para contar rondas
      prisma.rondaSeguridad.count
        .mockResolvedValueOnce(5) // rondasProgramadas
        .mockResolvedValueOnce(10) // rondasEjecutadas
        .mockResolvedValueOnce(2); // rondasPendientes

      // Mock para contar eventos adversos
      prisma.eventoAdverso.count
        .mockResolvedValueOnce(15) // eventosUltimos30Dias
        .mockResolvedValueOnce(2); // eventosCentinela

      // Mock para promedio de adherencia
      prisma.adherenciaPracticaSegura.aggregate.mockResolvedValue({
        _avg: { porcentajeAdherencia: 87.5 },
      });

      // Mock para prácticas con baja adherencia
      prisma.adherenciaPracticaSegura.findMany.mockResolvedValueOnce([
        {
          porcentajeAdherencia: 75,
          practica: { codigo: 'PS01', nombre: 'Práctica 1' }
        },
        {
          porcentajeAdherencia: 70,
          practica: { codigo: 'PS02', nombre: 'Práctica 2' }
        },
      ]);

      // Mock para próximas rondas
      prisma.rondaSeguridad.findMany.mockResolvedValueOnce([
        { id: 'r1', estado: 'Programada', fechaProgramada: new Date() },
      ]);

      // Mock para adherencia por práctica
      prisma.practicaSegura.findMany.mockResolvedValue([
        {
          codigo: 'PS01',
          nombre: 'Práctica 1',
          adherencias: [
            { periodo: '2025-01', porcentajeAdherencia: 90 },
            { periodo: '2024-12', porcentajeAdherencia: 88 },
          ],
        },
      ]);

      const result = await seguridadPacienteService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen.totalPracticas).toBe(7);
      expect(result.resumen.rondasProgramadas).toBe(5);
      expect(result.resumen.eventosUltimos30Dias).toBe(15);
      expect(result.resumen.promedioAdherencia).toBe(87.5);
      expect(result).toHaveProperty('practicasBajaAdherencia');
      expect(result).toHaveProperty('proximasRondas');
      expect(result).toHaveProperty('adherenciaPorPractica');
    });
  });

  // ==========================================
  // REPORTES
  // ==========================================
  describe('generarReportePracticas', () => {
    it('debe generar reporte de prácticas para un periodo', async () => {
      const mockPracticas = [
        {
          codigo: 'PS01',
          nombre: 'Práctica 1',
          categoria: 'Identificacion',
          frecuenciaMonitoreo: 'Mensual',
          adherencias: [
            {
              totalEvaluados: 100,
              totalCumplen: 92,
              porcentajeAdherencia: 92,
            },
          ],
        },
        {
          codigo: 'PS02',
          nombre: 'Práctica 2',
          categoria: 'Comunicacion',
          frecuenciaMonitoreo: 'Mensual',
          adherencias: [],
        },
      ];

      prisma.practicaSegura.findMany.mockResolvedValue(mockPracticas);

      const result = await seguridadPacienteService.generarReportePracticas('2025-01');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('codigo');
      expect(result[0]).toHaveProperty('adherencia');
      expect(result[0].adherencia.porcentaje).toBe(92);
      expect(result[1].adherencia).toBeNull();
    });
  });

  describe('getIndicadoresSeguridad', () => {
    it('debe calcular indicadores de seguridad del paciente', async () => {
      // Mock para eventos adversos agrupados por tipo
      prisma.eventoAdverso.groupBy.mockResolvedValue([
        { tipoEvento: 'Caída', _count: 5 },
        { tipoEvento: 'Medicación', _count: 3 },
      ]);

      // Mock para adherencia agrupada por práctica
      prisma.adherenciaPracticaSegura.groupBy.mockResolvedValue([
        { practicaId: 'p1', _avg: { porcentajeAdherencia: 92 } },
        { practicaId: 'p2', _avg: { porcentajeAdherencia: 88 } },
      ]);

      // Mock para rondas agrupadas por estado
      prisma.rondaSeguridad.groupBy.mockResolvedValue([
        { estado: 'Programada', _count: 5 },
        { estado: 'Ejecutada', _count: 12 },
        { estado: 'Cerrada', _count: 8 },
      ]);

      const result = await seguridadPacienteService.getIndicadoresSeguridad(2025);

      expect(result).toHaveProperty('eventosAdversos');
      expect(result).toHaveProperty('adherenciaPorPractica');
      expect(result).toHaveProperty('rondasStats');
      expect(result).toHaveProperty('periodo');
      expect(result.periodo.anio).toBe(2025);
      expect(result.eventosAdversos).toHaveLength(2);
      expect(result.adherenciaPorPractica).toHaveLength(2);
      expect(result.rondasStats).toHaveLength(3);
    });

    it('debe usar el año actual si no se proporciona', async () => {
      prisma.eventoAdverso.groupBy.mockResolvedValue([]);
      prisma.adherenciaPracticaSegura.groupBy.mockResolvedValue([]);
      prisma.rondaSeguridad.groupBy.mockResolvedValue([]);

      const result = await seguridadPacienteService.getIndicadoresSeguridad();

      expect(result.periodo.anio).toBe(new Date().getFullYear());
    });
  });
});
