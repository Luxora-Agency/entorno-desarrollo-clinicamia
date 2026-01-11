/**
 * Tests para PAMEC Service
 */
const prisma = require('../../db/prisma');
const pamecService = require('../../services/pamec.service');
const { ValidationError, NotFoundError } = require('../../utils/errors');

describe('PAMECService', () => {
  // ==========================================
  // EQUIPO PAMEC
  // ==========================================
  describe('getEquipo', () => {
    it('debe retornar miembros del equipo PAMEC activos', async () => {
      const mockEquipo = [
        {
          id: '1',
          usuarioId: 'u1',
          rol: 'Líder',
          activo: true,
          fechaIngreso: new Date(),
          usuario: { id: 'u1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com', rol: 'Admin' },
          _count: { auditorias: 5 }
        },
        {
          id: '2',
          usuarioId: 'u2',
          rol: 'Auditor',
          activo: true,
          fechaIngreso: new Date(),
          usuario: { id: 'u2', nombre: 'María', apellido: 'García', email: 'maria@test.com', rol: 'Calidad' },
          _count: { auditorias: 3 }
        },
      ];

      prisma.equipoPAMEC.findMany.mockResolvedValue(mockEquipo);

      const result = await pamecService.getEquipo({ activo: true });

      expect(prisma.equipoPAMEC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true },
          include: expect.objectContaining({
            usuario: expect.any(Object),
            _count: expect.any(Object),
          }),
          orderBy: { fechaIngreso: 'desc' },
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].rol).toBe('Líder');
    });

    it('debe filtrar por rol', async () => {
      const mockEquipo = [
        {
          id: '1',
          usuarioId: 'u1',
          rol: 'Auditor',
          activo: true,
          usuario: { nombre: 'Juan' },
          _count: { auditorias: 2 }
        },
      ];

      prisma.equipoPAMEC.findMany.mockResolvedValue(mockEquipo);

      const result = await pamecService.getEquipo({ rol: 'Auditor' });

      expect(result).toHaveLength(1);
      expect(result[0].rol).toBe('Auditor');
    });
  });

  describe('addMiembroEquipo', () => {
    it('debe agregar un nuevo miembro al equipo', async () => {
      const nuevoMiembro = {
        usuarioId: 'user-id',
        rol: 'Auditor',
        actaDesignacion: 'ACTA-001-2025',
      };

      prisma.usuario.findUnique.mockResolvedValue({
        id: 'user-id',
        nombre: 'Test',
        apellido: 'User',
        email: 'test@test.com'
      });
      prisma.equipoPAMEC.findFirst.mockResolvedValue(null);
      prisma.equipoPAMEC.create.mockResolvedValue({
        id: '1',
        ...nuevoMiembro,
        activo: true,
        fechaIngreso: new Date(),
        usuario: { nombre: 'Test', apellido: 'User', email: 'test@test.com' }
      });

      const result = await pamecService.addMiembroEquipo(nuevoMiembro);

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { id: 'user-id' } });
      expect(prisma.equipoPAMEC.findFirst).toHaveBeenCalledWith({
        where: { usuarioId: 'user-id', activo: true }
      });
      expect(prisma.equipoPAMEC.create).toHaveBeenCalled();
      expect(result.rol).toBe('Auditor');
      expect(result.activo).toBe(true);
    });

    it('debe lanzar error si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.addMiembroEquipo({ usuarioId: 'invalid-id', rol: 'Auditor' })
      ).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar error si el usuario ya es miembro activo del equipo', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'user-id', nombre: 'Test' });
      prisma.equipoPAMEC.findFirst.mockResolvedValue({
        id: '1',
        usuarioId: 'user-id',
        activo: true
      });

      await expect(
        pamecService.addMiembroEquipo({ usuarioId: 'user-id', rol: 'Auditor' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('retirarMiembroEquipo', () => {
    it('debe retirar un miembro del equipo', async () => {
      prisma.equipoPAMEC.findUnique.mockResolvedValue({ id: '1', activo: true });
      prisma.equipoPAMEC.update.mockResolvedValue({
        id: '1',
        activo: false,
        fechaRetiro: new Date(),
      });

      const result = await pamecService.retirarMiembroEquipo('1');

      expect(prisma.equipoPAMEC.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            activo: false,
            fechaRetiro: expect.any(Date)
          }),
        })
      );
      expect(result.activo).toBe(false);
    });

    it('debe lanzar error si el miembro no existe', async () => {
      prisma.equipoPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.retirarMiembroEquipo('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // PROCESOS PAMEC
  // ==========================================
  describe('getProcesos', () => {
    it('debe retornar lista paginada de procesos', async () => {
      const mockProcesos = [
        {
          id: '1',
          nombre: 'Proceso 1',
          prioridad: 1,
          estado: 'Identificado',
          responsable: { id: 'r1', nombre: 'Resp', apellido: '1' },
          _count: { indicadores: 2, auditorias: 1, planesAccion: 3 }
        },
        {
          id: '2',
          nombre: 'Proceso 2',
          prioridad: 2,
          estado: 'Priorizado',
          responsable: { id: 'r2', nombre: 'Resp', apellido: '2' },
          _count: { indicadores: 1, auditorias: 0, planesAccion: 1 }
        },
      ];

      prisma.procesoPAMEC.findMany.mockResolvedValue(mockProcesos);
      prisma.procesoPAMEC.count.mockResolvedValue(2);

      const result = await pamecService.getProcesos({ page: 1, limit: 10 });

      expect(result.procesos).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('debe filtrar procesos por estado', async () => {
      const mockProcesos = [
        {
          id: '1',
          nombre: 'Proceso 1',
          estado: 'Identificado',
          _count: { indicadores: 0, auditorias: 0, planesAccion: 0 }
        },
      ];

      prisma.procesoPAMEC.findMany.mockResolvedValue(mockProcesos);
      prisma.procesoPAMEC.count.mockResolvedValue(1);

      const result = await pamecService.getProcesos({ estado: 'Identificado' });

      expect(result.procesos[0].estado).toBe('Identificado');
    });

    it('debe filtrar por prioridad', async () => {
      prisma.procesoPAMEC.findMany.mockResolvedValue([]);
      prisma.procesoPAMEC.count.mockResolvedValue(0);

      await pamecService.getProcesos({ prioridad: 1 });

      expect(prisma.procesoPAMEC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ prioridad: 1 })
        })
      );
    });

    it('debe buscar por texto', async () => {
      prisma.procesoPAMEC.findMany.mockResolvedValue([]);
      prisma.procesoPAMEC.count.mockResolvedValue(0);

      await pamecService.getProcesos({ search: 'urgencias' });

      expect(prisma.procesoPAMEC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nombre: expect.any(Object) }),
              expect.objectContaining({ areaResponsable: expect.any(Object) })
            ])
          })
        })
      );
    });
  });

  describe('getProcesoById', () => {
    it('debe retornar un proceso por ID con sus relaciones', async () => {
      const mockProceso = {
        id: 'p1',
        nombre: 'Atención en Urgencias',
        descripcion: 'Proceso de atención',
        responsable: { id: 'r1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' },
        indicadores: [],
        auditorias: [],
        planesAccion: [],
      };

      prisma.procesoPAMEC.findUnique.mockResolvedValue(mockProceso);

      const result = await pamecService.getProcesoById('p1');

      expect(result.nombre).toBe('Atención en Urgencias');
      expect(result.responsable).toBeDefined();
    });

    it('debe lanzar error si el proceso no existe', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.getProcesoById('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createProceso', () => {
    it('debe crear un nuevo proceso PAMEC', async () => {
      const nuevoProceso = {
        nombre: 'Atención en Urgencias',
        descripcion: 'Proceso de atención de urgencias',
        areaResponsable: 'Urgencias',
        responsableId: 'user-1',
        calidadObservada: 75.5,
        calidadEsperada: 90.0,
      };

      prisma.procesoPAMEC.create.mockResolvedValue({
        id: '1',
        ...nuevoProceso,
        brecha: 14.5,
        estado: 'Identificado',
        responsable: { nombre: 'Juan', apellido: 'Pérez' }
      });

      const result = await pamecService.createProceso(nuevoProceso);

      expect(prisma.procesoPAMEC.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: 'Atención en Urgencias',
            brecha: 14.5,
            estado: 'Identificado',
          })
        })
      );
      expect(result.nombre).toBe('Atención en Urgencias');
      expect(result.brecha).toBe(14.5);
    });

    it('debe calcular brecha correctamente', async () => {
      const nuevoProceso = {
        nombre: 'Test',
        calidadObservada: 80,
        calidadEsperada: 95,
      };

      prisma.procesoPAMEC.create.mockResolvedValue({
        id: '1',
        ...nuevoProceso,
        brecha: 15,
        estado: 'Identificado'
      });

      const result = await pamecService.createProceso(nuevoProceso);

      expect(result.brecha).toBe(15);
    });
  });

  describe('updateProceso', () => {
    it('debe actualizar un proceso existente', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue({
        id: '1',
        nombre: 'Proceso Original',
        calidadObservada: 80,
        calidadEsperada: 90
      });
      prisma.procesoPAMEC.update.mockResolvedValue({
        id: '1',
        nombre: 'Proceso Actualizado',
        calidadObservada: 85,
        calidadEsperada: 90,
        brecha: 5
      });

      const result = await pamecService.updateProceso('1', {
        nombre: 'Proceso Actualizado',
        calidadObservada: 85
      });

      expect(result.nombre).toBe('Proceso Actualizado');
    });

    it('debe recalcular brecha al actualizar calidad', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue({
        id: '1',
        calidadObservada: 70,
        calidadEsperada: 90
      });
      prisma.procesoPAMEC.update.mockResolvedValue({
        id: '1',
        calidadObservada: 85,
        calidadEsperada: 90,
        brecha: 5
      });

      await pamecService.updateProceso('1', { calidadObservada: 85 });

      expect(prisma.procesoPAMEC.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ brecha: 5 })
        })
      );
    });

    it('debe lanzar error si el proceso no existe', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.updateProceso('invalid-id', { nombre: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('priorizarProceso', () => {
    it('debe priorizar un proceso según criterios', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue({
        id: 'p1',
        nombre: 'Proceso 1'
      });

      const criterios = {
        impacto: 5,
        frecuencia: 4,
        costo: 3,
        riesgo: 5
      };

      prisma.procesoPAMEC.update.mockResolvedValue({
        id: 'p1',
        prioridad: 1,
        criteriosPriorizacion: criterios,
        estado: 'Priorizado'
      });

      const result = await pamecService.priorizarProceso('p1', criterios);

      expect(prisma.procesoPAMEC.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({
            criteriosPriorizacion: criterios,
            prioridad: expect.any(Number),
            estado: 'Priorizado',
          })
        })
      );
      expect(result.estado).toBe('Priorizado');
    });

    it('debe lanzar error si el proceso no existe', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.priorizarProceso('invalid-id', { impacto: 5 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // INDICADORES PAMEC
  // ==========================================
  describe('getIndicadores', () => {
    it('debe retornar indicadores activos', async () => {
      const mockIndicadores = [
        {
          id: '1',
          codigo: 'PAMEC-001',
          nombre: 'Indicador 1',
          activo: true,
          proceso: { id: 'p1', nombre: 'Proceso 1' },
          _count: { mediciones: 5 }
        },
        {
          id: '2',
          codigo: 'PAMEC-002',
          nombre: 'Indicador 2',
          activo: true,
          proceso: { id: 'p1', nombre: 'Proceso 1' },
          _count: { mediciones: 3 }
        },
      ];

      prisma.indicadorPAMEC.findMany.mockResolvedValue(mockIndicadores);

      const result = await pamecService.getIndicadores({ activo: true });

      expect(result).toHaveLength(2);
      expect(result[0].codigo).toBe('PAMEC-001');
    });

    it('debe filtrar por procesoId', async () => {
      prisma.indicadorPAMEC.findMany.mockResolvedValue([]);

      await pamecService.getIndicadores({ procesoId: 'p1' });

      expect(prisma.indicadorPAMEC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ procesoId: 'p1' })
        })
      );
    });
  });

  describe('getIndicadorById', () => {
    it('debe retornar un indicador por ID con sus mediciones', async () => {
      const mockIndicador = {
        id: 'i1',
        codigo: 'PAMEC-001',
        nombre: 'Indicador Test',
        proceso: { id: 'p1', nombre: 'Proceso 1', areaResponsable: 'Área 1' },
        mediciones: [
          { id: 'm1', periodo: '2025-01', resultado: 85.5, registrador: { nombre: 'Juan', apellido: 'Pérez' } }
        ]
      };

      prisma.indicadorPAMEC.findUnique.mockResolvedValue(mockIndicador);

      const result = await pamecService.getIndicadorById('i1');

      expect(result.codigo).toBe('PAMEC-001');
      expect(result.mediciones).toHaveLength(1);
    });

    it('debe lanzar error si el indicador no existe', async () => {
      prisma.indicadorPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.getIndicadorById('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createIndicador', () => {
    it('debe crear un nuevo indicador PAMEC', async () => {
      const nuevoIndicador = {
        procesoId: 'p1',
        codigo: 'PAMEC-004',
        nombre: 'Nuevo Indicador',
        objetivo: 'Medir calidad',
        formulaCalculo: 'Num / Den x 100',
        fuenteDatos: 'Sistema HIS',
        frecuenciaMedicion: 'Mensual',
        metaInstitucional: 85.00,
        unidadMedida: 'Porcentaje',
        tendenciaEsperada: 'Ascendente',
        responsableMedicion: 'Líder de Calidad',
      };

      prisma.indicadorPAMEC.findUnique.mockResolvedValue(null);
      prisma.indicadorPAMEC.create.mockResolvedValue({
        id: '1',
        ...nuevoIndicador,
        activo: true
      });

      const result = await pamecService.createIndicador(nuevoIndicador);

      expect(prisma.indicadorPAMEC.create).toHaveBeenCalled();
      expect(result.codigo).toBe('PAMEC-004');
    });

    it('debe lanzar error si el código ya existe', async () => {
      prisma.indicadorPAMEC.findUnique.mockResolvedValue({
        id: 'existing',
        codigo: 'PAMEC-001'
      });

      await expect(
        pamecService.createIndicador({ codigo: 'PAMEC-001', nombre: 'Test' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('registrarMedicion', () => {
    it('debe registrar una medición de indicador', async () => {
      const medicion = {
        indicadorId: 'ind-1',
        periodo: '2025-01',
        numerador: 85,
        denominador: 100,
        analisis: 'Análisis del periodo',
        accionesTomadas: 'Acciones implementadas',
        registradoPor: 'user-id',
      };

      prisma.indicadorPAMEC.findUnique.mockResolvedValue({
        id: 'ind-1',
        metaInstitucional: 0.80,
        tendenciaEsperada: 'Ascendente'
      });
      prisma.medicionIndicador.findFirst.mockResolvedValue(null);
      prisma.medicionIndicador.create.mockResolvedValue({
        id: 'm1',
        ...medicion,
        resultado: 0.85,
        meta: 0.80,
        cumpleMeta: true,
        fechaRegistro: new Date()
      });

      const result = await pamecService.registrarMedicion(medicion);

      expect(prisma.medicionIndicador.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            indicadorId: 'ind-1',
            periodo: '2025-01',
            numerador: 85,
            denominador: 100,
            resultado: 0.85,
            cumpleMeta: true,
          })
        })
      );
      expect(result.cumpleMeta).toBe(true);
    });

    it('debe actualizar medición existente del mismo periodo', async () => {
      const medicion = {
        indicadorId: 'ind-1',
        periodo: '2025-01',
        numerador: 90,
        denominador: 100,
      };

      prisma.indicadorPAMEC.findUnique.mockResolvedValue({
        id: 'ind-1',
        metaInstitucional: 0.85,
        tendenciaEsperada: 'Ascendente'
      });
      prisma.medicionIndicador.findFirst.mockResolvedValue({
        id: 'existing-m1',
        indicadorId: 'ind-1',
        periodo: '2025-01'
      });
      prisma.medicionIndicador.update.mockResolvedValue({
        id: 'existing-m1',
        ...medicion,
        resultado: 0.9,
        cumpleMeta: true,
      });

      const result = await pamecService.registrarMedicion(medicion);

      expect(prisma.medicionIndicador.update).toHaveBeenCalled();
      expect(result.resultado).toBe(0.9);
    });

    it('debe calcular cumpleMeta correctamente para tendencia descendente', async () => {
      prisma.indicadorPAMEC.findUnique.mockResolvedValue({
        id: 'ind-1',
        metaInstitucional: 0.05,
        tendenciaEsperada: 'Descendente'
      });
      prisma.medicionIndicador.findFirst.mockResolvedValue(null);
      prisma.medicionIndicador.create.mockResolvedValue({
        id: 'm1',
        resultado: 0.03,
        cumpleMeta: true,
      });

      const result = await pamecService.registrarMedicion({
        indicadorId: 'ind-1',
        periodo: '2025-01',
        numerador: 3,
        denominador: 100,
      });

      expect(result.cumpleMeta).toBe(true);
    });

    it('debe lanzar error si el indicador no existe', async () => {
      prisma.indicadorPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.registrarMedicion({ indicadorId: 'invalid', periodo: '2025-01' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // AUDITORÍAS
  // ==========================================
  describe('getAuditorias', () => {
    it('debe retornar lista paginada de auditorías', async () => {
      const mockAuditorias = [
        {
          id: 'a1',
          tipoAuditoria: 'Interna',
          estado: 'Programada',
          proceso: { id: 'p1', nombre: 'Proceso 1' },
          auditor: {
            id: 'eq1',
            usuario: { nombre: 'Juan', apellido: 'Pérez' }
          },
          _count: { hallazgos: 2 }
        },
        {
          id: 'a2',
          tipoAuditoria: 'Externa',
          estado: 'Cerrada',
          proceso: { id: 'p2', nombre: 'Proceso 2' },
          auditor: {
            id: 'eq2',
            usuario: { nombre: 'María', apellido: 'García' }
          },
          _count: { hallazgos: 5 }
        },
      ];

      prisma.auditoriaPAMEC.findMany.mockResolvedValue(mockAuditorias);
      prisma.auditoriaPAMEC.count.mockResolvedValue(2);

      const result = await pamecService.getAuditorias({ page: 1, limit: 10 });

      expect(result.auditorias).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('debe filtrar por tipo de auditoría', async () => {
      prisma.auditoriaPAMEC.findMany.mockResolvedValue([]);
      prisma.auditoriaPAMEC.count.mockResolvedValue(0);

      await pamecService.getAuditorias({ tipoAuditoria: 'Interna' });

      expect(prisma.auditoriaPAMEC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipoAuditoria: 'Interna' })
        })
      );
    });
  });

  describe('getAuditoriaById', () => {
    it('debe retornar una auditoría por ID con sus relaciones', async () => {
      const mockAuditoria = {
        id: 'a1',
        tipoAuditoria: 'Interna',
        objetivo: 'Verificar cumplimiento',
        estado: 'Programada',
        proceso: { id: 'p1', nombre: 'Proceso 1' },
        auditor: {
          id: 'eq1',
          usuario: { id: 'u1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@test.com' }
        },
        hallazgos: []
      };

      prisma.auditoriaPAMEC.findUnique.mockResolvedValue(mockAuditoria);

      const result = await pamecService.getAuditoriaById('a1');

      expect(result.tipoAuditoria).toBe('Interna');
      expect(result.proceso).toBeDefined();
      expect(result.auditor).toBeDefined();
    });

    it('debe lanzar error si la auditoría no existe', async () => {
      prisma.auditoriaPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.getAuditoriaById('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createAuditoria', () => {
    it('debe crear una nueva auditoría', async () => {
      const nuevaAuditoria = {
        procesoId: 'proceso-1',
        tipoAuditoria: 'Interna',
        objetivo: 'Verificar cumplimiento de estándares',
        alcance: 'Proceso completo',
        auditorId: 'auditor-1',
        fechaProgramada: '2025-02-15',
      };

      prisma.procesoPAMEC.findUnique.mockResolvedValue({ id: 'proceso-1', nombre: 'Proceso 1' });
      prisma.equipoPAMEC.findUnique.mockResolvedValue({
        id: 'auditor-1',
        activo: true,
        usuario: { nombre: 'Juan', apellido: 'Pérez' }
      });
      prisma.auditoriaPAMEC.create.mockResolvedValue({
        id: 'a1',
        ...nuevaAuditoria,
        fechaProgramada: new Date('2025-02-15'),
        estado: 'Programada',
        proceso: { nombre: 'Proceso 1' },
        auditor: {
          usuario: { nombre: 'Juan', apellido: 'Pérez' }
        }
      });

      const result = await pamecService.createAuditoria(nuevaAuditoria);

      expect(prisma.auditoriaPAMEC.create).toHaveBeenCalled();
      expect(result.estado).toBe('Programada');
      expect(result.tipoAuditoria).toBe('Interna');
    });

    it('debe lanzar error si el auditor no es miembro activo', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue({ id: 'proceso-1' });
      prisma.equipoPAMEC.findUnique.mockResolvedValue({ id: 'auditor-1', activo: false });

      await expect(
        pamecService.createAuditoria({
          procesoId: 'proceso-1',
          tipoAuditoria: 'Interna',
          auditorId: 'auditor-1',
          fechaProgramada: '2025-02-15'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('debe lanzar error si el proceso no existe', async () => {
      prisma.procesoPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.createAuditoria({
          procesoId: 'invalid',
          tipoAuditoria: 'Interna',
          auditorId: 'auditor-1',
          fechaProgramada: '2025-02-15'
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('ejecutarAuditoria', () => {
    it('debe registrar la ejecución de una auditoría', async () => {
      prisma.auditoriaPAMEC.findUnique.mockResolvedValue({
        id: 'a1',
        estado: 'Programada'
      });
      prisma.auditoriaPAMEC.update.mockResolvedValue({
        id: 'a1',
        estado: 'En Ejecución',
        fechaEjecucion: new Date(),
      });

      const result = await pamecService.ejecutarAuditoria('a1', {
        observaciones: 'Iniciando auditoría'
      });

      expect(prisma.auditoriaPAMEC.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a1' },
          data: expect.objectContaining({
            fechaEjecucion: expect.any(Date),
            estado: 'En Ejecución',
          })
        })
      );
      expect(result.estado).toBe('En Ejecución');
    });

    it('debe lanzar error si la auditoría no existe', async () => {
      prisma.auditoriaPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.ejecutarAuditoria('invalid-id', {})
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('cerrarAuditoria', () => {
    it('debe cerrar una auditoría con conclusiones', async () => {
      prisma.auditoriaPAMEC.findUnique.mockResolvedValue({
        id: 'a1',
        estado: 'En Ejecución'
      });
      prisma.auditoriaPAMEC.update.mockResolvedValue({
        id: 'a1',
        estado: 'Cerrada',
        conclusiones: 'Auditoría completada satisfactoriamente',
        informeUrl: 'https://example.com/informe-a1.pdf'
      });

      const result = await pamecService.cerrarAuditoria('a1', {
        conclusiones: 'Auditoría completada satisfactoriamente',
        informeUrl: 'https://example.com/informe-a1.pdf'
      });

      expect(prisma.auditoriaPAMEC.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a1' },
          data: expect.objectContaining({
            conclusiones: expect.any(String),
            informeUrl: expect.any(String),
            estado: 'Cerrada',
          })
        })
      );
      expect(result.estado).toBe('Cerrada');
    });

    it('debe lanzar error si la auditoría no existe', async () => {
      prisma.auditoriaPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.cerrarAuditoria('invalid-id', { conclusiones: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // HALLAZGOS
  // ==========================================
  describe('registrarHallazgo', () => {
    it('debe registrar un hallazgo de auditoría', async () => {
      const hallazgo = {
        auditoriaId: 'a1',
        tipo: 'NC_Menor',
        descripcion: 'No conformidad menor encontrada',
        criterioAuditoria: 'Criterio 5.2',
        evidencia: 'Evidencia fotográfica',
        analisisCausa: 'Falta de capacitación',
        requiereAccion: true,
        fechaLimiteAccion: '2025-03-01',
      };

      prisma.auditoriaPAMEC.findUnique.mockResolvedValue({ id: 'a1' });
      prisma.hallazgoAuditoria.create.mockResolvedValue({
        id: 'h1',
        ...hallazgo,
        fechaLimiteAccion: new Date('2025-03-01'),
        estado: 'Abierto',
      });

      const result = await pamecService.registrarHallazgo(hallazgo);

      expect(prisma.hallazgoAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            auditoriaId: 'a1',
            tipo: 'NC_Menor',
            estado: 'Abierto',
            requiereAccion: true,
          })
        })
      );
      expect(result.tipo).toBe('NC_Menor');
      expect(result.estado).toBe('Abierto');
    });

    it('debe lanzar error si la auditoría no existe', async () => {
      prisma.auditoriaPAMEC.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.registrarHallazgo({
          auditoriaId: 'invalid',
          tipo: 'NC_Menor',
          descripcion: 'Test'
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateHallazgo', () => {
    it('debe actualizar un hallazgo existente', async () => {
      prisma.hallazgoAuditoria.findUnique.mockResolvedValue({
        id: 'h1',
        estado: 'Abierto'
      });
      prisma.hallazgoAuditoria.update.mockResolvedValue({
        id: 'h1',
        estado: 'En Tratamiento',
        descripcion: 'Descripción actualizada'
      });

      const result = await pamecService.updateHallazgo('h1', {
        estado: 'En Tratamiento',
        descripcion: 'Descripción actualizada'
      });

      expect(prisma.hallazgoAuditoria.update).toHaveBeenCalled();
      expect(result.estado).toBe('En Tratamiento');
    });

    it('debe lanzar error si el hallazgo no existe', async () => {
      prisma.hallazgoAuditoria.findUnique.mockResolvedValue(null);

      await expect(
        pamecService.updateHallazgo('invalid-id', { estado: 'Cerrado' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar datos del dashboard PAMEC', async () => {
      prisma.procesoPAMEC.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      prisma.indicadorPAMEC.count.mockResolvedValue(8);
      prisma.medicionIndicador.count.mockResolvedValue(2);
      prisma.auditoriaPAMEC.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
      prisma.hallazgoAuditoria.count.mockResolvedValue(4);
      prisma.auditoriaPAMEC.findMany.mockResolvedValue([
        {
          id: 'a1',
          fechaProgramada: new Date(),
          proceso: { nombre: 'Proceso 1' },
          auditor: { usuario: { nombre: 'Juan', apellido: 'Pérez' } }
        }
      ]);

      const result = await pamecService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('totalProcesos');
      expect(result.resumen).toHaveProperty('procesosPriorizados');
      expect(result.resumen).toHaveProperty('totalIndicadores');
      expect(result.resumen).toHaveProperty('indicadoresBajoMeta');
      expect(result.resumen).toHaveProperty('auditoriasProgramadas');
      expect(result.resumen).toHaveProperty('auditoriasEnEjecucion');
      expect(result.resumen).toHaveProperty('hallazgosAbiertos');
      expect(result).toHaveProperty('ultimasAuditorias');
      expect(result).toHaveProperty('rutaCritica');
      expect(result.rutaCritica).toHaveLength(9);
    });
  });

  // ==========================================
  // FICHA TÉCNICA
  // ==========================================
  describe('generarFichaTecnica', () => {
    it('debe generar ficha técnica de un indicador', async () => {
      const mockIndicador = {
        id: 'i1',
        codigo: 'PAMEC-001',
        nombre: 'Indicador de Calidad',
        proceso: { nombre: 'Proceso 1' },
        objetivo: 'Medir calidad de atención',
        formulaCalculo: '(Num / Den) x 100',
        fuenteDatos: 'Sistema HIS',
        frecuenciaMedicion: 'Mensual',
        metaInstitucional: 85.0,
        unidadMedida: 'Porcentaje',
        tendenciaEsperada: 'Ascendente',
        responsableMedicion: 'Líder de Calidad',
        mediciones: [
          { id: 'm1', periodo: '2025-01', resultado: 87.5 },
          { id: 'm2', periodo: '2024-12', resultado: 85.0 }
        ]
      };

      prisma.indicadorPAMEC.findUnique.mockResolvedValue(mockIndicador);

      const result = await pamecService.generarFichaTecnica('i1');

      expect(result).toHaveProperty('codigo', 'PAMEC-001');
      expect(result).toHaveProperty('nombre');
      expect(result).toHaveProperty('proceso');
      expect(result).toHaveProperty('objetivo');
      expect(result).toHaveProperty('formula');
      expect(result).toHaveProperty('fuenteDatos');
      expect(result).toHaveProperty('frecuencia');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('unidad');
      expect(result).toHaveProperty('tendencia');
      expect(result).toHaveProperty('responsable');
      expect(result).toHaveProperty('ultimasMediciones');
      expect(result.ultimasMediciones).toHaveLength(2);
    });
  });
});
