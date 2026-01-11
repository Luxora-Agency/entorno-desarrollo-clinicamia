/**
 * Tests para EventoAdverso Service
 */
const prisma = require('../../db/prisma');
const eventoAdversoService = require('../../services/eventoAdverso.service');

describe('EventoAdversoService', () => {
  // ==========================================
  // EVENTOS ADVERSOS
  // ==========================================
  describe('getEventos', () => {
    it('debe retornar lista paginada de eventos adversos', async () => {
      const mockEventos = [
        {
          id: '1',
          tipoEvento: 'INCIDENTE',
          severidad: 'LEVE',
          estado: 'Reportado',
          paciente: { id: 'p1', nombre: 'Juan', apellido: 'Pérez', cedula: '123456' },
          reportador: { id: 'u1', nombre: 'María', apellido: 'García' },
          _count: { factoresContributivos: 0, planesAccion: 0 }
        },
        {
          id: '2',
          tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE',
          severidad: 'MODERADO',
          estado: 'En Investigación',
          paciente: { id: 'p2', nombre: 'Ana', apellido: 'López', cedula: '654321' },
          reportador: { id: 'u2', nombre: 'Carlos', apellido: 'Ruiz' },
          _count: { factoresContributivos: 2, planesAccion: 1 }
        },
      ];

      prisma.eventoAdverso.findMany.mockResolvedValue(mockEventos);
      prisma.eventoAdverso.count.mockResolvedValue(2);

      const result = await eventoAdversoService.getEventos({ page: 1, limit: 10 });

      expect(result.eventos).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('debe filtrar eventos por severidad', async () => {
      const mockEventos = [
        {
          id: '1',
          severidad: 'GRAVE',
          estado: 'Reportado',
          paciente: { id: 'p1', nombre: 'Juan', apellido: 'Pérez', cedula: '123456' },
          reportador: { id: 'u1', nombre: 'María', apellido: 'García' },
          _count: { factoresContributivos: 0, planesAccion: 0 }
        },
      ];

      prisma.eventoAdverso.findMany.mockResolvedValue(mockEventos);
      prisma.eventoAdverso.count.mockResolvedValue(1);

      const result = await eventoAdversoService.getEventos({ severidad: 'GRAVE' });

      expect(prisma.eventoAdverso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ severidad: 'GRAVE' })
        })
      );
      expect(result.eventos[0].severidad).toBe('GRAVE');
    });

    it('debe filtrar eventos por tipo', async () => {
      const mockEventos = [
        {
          id: '1',
          tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE',
          paciente: { id: 'p1', nombre: 'Juan', apellido: 'Pérez', cedula: '123456' },
          reportador: { id: 'u1', nombre: 'María', apellido: 'García' },
          _count: { factoresContributivos: 0, planesAccion: 0 }
        },
      ];

      prisma.eventoAdverso.findMany.mockResolvedValue(mockEventos);
      prisma.eventoAdverso.count.mockResolvedValue(1);

      const result = await eventoAdversoService.getEventos({ tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE' });

      expect(result.eventos[0].tipoEvento).toBe('EVENTO_ADVERSO_PREVENIBLE');
    });
  });

  describe('getEventoById', () => {
    it('debe retornar un evento con sus relaciones', async () => {
      const mockEvento = {
        id: '1',
        tipoEvento: 'INCIDENTE',
        severidad: 'LEVE',
        paciente: {
          id: 'p1',
          nombre: 'Juan',
          apellido: 'Pérez',
          cedula: '123456',
          fechaNacimiento: new Date('1990-01-01'),
          genero: 'M'
        },
        cita: { id: 'c1', fecha: new Date(), motivo: 'Consulta', estado: 'Completada' },
        admision: null,
        reportador: { id: 'u1', nombre: 'María', apellido: 'García', email: 'maria@test.com', rol: 'MEDICO' },
        analisisCausaRaiz: null,
        factoresContributivos: [],
        planesAccion: []
      };

      prisma.eventoAdverso.findUnique.mockResolvedValue(mockEvento);

      const result = await eventoAdversoService.getEventoById('1');

      expect(result.id).toBe('1');
      expect(result).toHaveProperty('paciente');
      expect(result).toHaveProperty('reportador');
    });

    it('debe lanzar error si el evento no existe', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.getEventoById('999')).rejects.toThrow('Evento adverso no encontrado');
    });
  });

  describe('reportarEvento', () => {
    it('debe reportar un nuevo evento adverso', async () => {
      const nuevoEvento = {
        tipoEvento: 'INCIDENTE',
        severidad: 'LEVE',
        fechaEvento: '2025-12-17',
        horaEvento: '10:30',
        servicioOcurrencia: 'Urgencias',
        descripcionEvento: 'Descripción del incidente',
        reportadoPor: 'user-id',
      };

      prisma.eventoAdverso.create.mockResolvedValue({
        id: '1',
        ...nuevoEvento,
        fechaEvento: new Date(nuevoEvento.fechaEvento),
        estado: 'Reportado',
        requiereAnalisis: false,
        esAnonimo: false,
        paciente: null,
        reportador: { nombre: 'María', apellido: 'García' }
      });

      const result = await eventoAdversoService.reportarEvento(nuevoEvento);

      expect(prisma.eventoAdverso.create).toHaveBeenCalled();
      expect(result.estado).toBe('Reportado');
      expect(result.requiereAnalisis).toBe(false);
    });

    it('debe marcar requiereAnalisis=true para severidad GRAVE', async () => {
      const eventoGrave = {
        tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE',
        severidad: 'GRAVE',
        fechaEvento: '2025-12-17',
        horaEvento: '14:30',
        servicioOcurrencia: 'Cirugía',
        descripcionEvento: 'Evento grave',
        reportadoPor: 'user-id',
      };

      prisma.eventoAdverso.create.mockResolvedValue({
        id: '1',
        ...eventoGrave,
        fechaEvento: new Date(eventoGrave.fechaEvento),
        requiereAnalisis: true,
        estado: 'Reportado',
        esAnonimo: false,
        paciente: null,
        reportador: { nombre: 'María', apellido: 'García' }
      });

      const result = await eventoAdversoService.reportarEvento(eventoGrave);

      expect(result.severidad).toBe('GRAVE');
      expect(result.requiereAnalisis).toBe(true);
    });

    it('debe marcar requiereAnalisis=true para severidad CENTINELA', async () => {
      const eventoCentinela = {
        tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE',
        severidad: 'CENTINELA',
        fechaEvento: '2025-12-17',
        horaEvento: '16:00',
        servicioOcurrencia: 'Cirugía',
        descripcionEvento: 'Evento centinela - cirugía en sitio equivocado',
        reportadoPor: 'user-id',
      };

      prisma.eventoAdverso.create.mockResolvedValue({
        id: '1',
        ...eventoCentinela,
        fechaEvento: new Date(eventoCentinela.fechaEvento),
        requiereAnalisis: true,
        estado: 'Reportado',
        esAnonimo: false,
        paciente: null,
        reportador: { nombre: 'María', apellido: 'García' }
      });

      const result = await eventoAdversoService.reportarEvento(eventoCentinela);

      expect(result.severidad).toBe('CENTINELA');
      expect(result.requiereAnalisis).toBe(true);
    });

    it('debe validar que el paciente exista', async () => {
      const nuevoEvento = {
        pacienteId: 'invalid-id',
        tipoEvento: 'INCIDENTE',
        severidad: 'LEVE',
        fechaEvento: '2025-12-17',
        servicioOcurrencia: 'Urgencias',
        descripcionEvento: 'Descripción del incidente',
        reportadoPor: 'user-id',
      };

      prisma.paciente.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.reportarEvento(nuevoEvento)).rejects.toThrow('Paciente no encontrado');
    });
  });

  describe('updateEvento', () => {
    it('debe actualizar un evento existente', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: '1', estado: 'Reportado' });
      prisma.eventoAdverso.update.mockResolvedValue({
        id: '1',
        estado: 'En Investigación',
        accionesInmediatas: 'Acciones tomadas',
      });

      const result = await eventoAdversoService.updateEvento('1', {
        accionesInmediatas: 'Acciones tomadas',
      });

      expect(prisma.eventoAdverso.update).toHaveBeenCalled();
      expect(result.accionesInmediatas).toBe('Acciones tomadas');
    });

    it('debe lanzar error si el evento no existe', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.updateEvento('999', { estado: 'Cerrado' }))
        .rejects.toThrow('Evento adverso no encontrado');
    });
  });

  describe('cambiarEstado', () => {
    it('debe cambiar el estado del evento', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: '1', estado: 'Reportado' });
      prisma.eventoAdverso.update.mockResolvedValue({
        id: '1',
        estado: 'En Investigación',
      });

      const result = await eventoAdversoService.cambiarEstado('1', 'En Investigación');

      expect(prisma.eventoAdverso.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'En Investigación' }
      });
      expect(result.estado).toBe('En Investigación');
    });

    it('debe validar que el estado sea válido', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: '1', estado: 'Reportado' });

      await expect(eventoAdversoService.cambiarEstado('1', 'EstadoInvalido'))
        .rejects.toThrow('Estado no válido');
    });
  });

  // ==========================================
  // ANÁLISIS DE CAUSA RAÍZ
  // ==========================================
  describe('crearAnalisisCausaRaiz', () => {
    it('debe crear análisis de causa raíz con Protocolo de Londres', async () => {
      const analisis = {
        eventoId: 'e1',
        metodoAnalisis: 'ProtocoloLondres',
        analistaId: 'user-id',
      };

      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: 'e1', requiereAnalisis: true });
      prisma.analisisCausaRaiz.findUnique.mockResolvedValue(null);

      const mockAnalisis = {
        id: 'acr-1',
        eventoId: 'e1',
        metodoAnalisis: 'ProtocoloLondres',
        analistaId: 'user-id',
        estado: 'En Análisis',
        fechaAnalisis: expect.any(Date)
      };

      prisma.$transaction.mockResolvedValue([
        mockAnalisis,
        { id: 'e1', estado: 'En Investigación' }
      ]);

      const result = await eventoAdversoService.crearAnalisisCausaRaiz(analisis);

      expect(result.metodoAnalisis).toBe('ProtocoloLondres');
      expect(result.estado).toBe('En Análisis');
    });

    it('debe lanzar error si el evento no existe', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.crearAnalisisCausaRaiz({
        eventoId: 'invalid',
        metodoAnalisis: 'CincoPorques',
        analistaId: 'user-id'
      })).rejects.toThrow('Evento adverso no encontrado');
    });

    it('debe lanzar error si ya existe un análisis', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.analisisCausaRaiz.findUnique.mockResolvedValue({ id: 'acr-1', eventoId: 'e1' });

      await expect(eventoAdversoService.crearAnalisisCausaRaiz({
        eventoId: 'e1',
        metodoAnalisis: 'CincoPorques',
        analistaId: 'user-id'
      })).rejects.toThrow('Ya existe un análisis de causa raíz para este evento');
    });
  });

  describe('actualizarAnalisisProtocoloLondres', () => {
    it('debe actualizar análisis con fallas activas (Protocolo Londres)', async () => {
      const actualizacion = {
        fallas_activas: ['Falla 1', 'Falla 2'],
        condiciones_latentes: ['Condición 1'],
        barreras_defensas: ['Barrera que falló'],
        conclusiones: 'Conclusiones del análisis',
        recomendaciones: 'Recomendaciones',
      };

      prisma.analisisCausaRaiz.findUnique.mockResolvedValue({
        id: 'acr-1',
        eventoId: 'e1',
        metodoAnalisis: 'ProtocoloLondres',
      });
      prisma.analisisCausaRaiz.update.mockResolvedValue({
        id: 'acr-1',
        eventoId: 'e1',
        ...actualizacion,
      });

      const result = await eventoAdversoService.actualizarAnalisisProtocoloLondres('e1', actualizacion);

      expect(prisma.analisisCausaRaiz.update).toHaveBeenCalledWith({
        where: { eventoId: 'e1' },
        data: actualizacion
      });
      expect(result.fallas_activas).toHaveLength(2);
    });

    it('debe lanzar error si el análisis no existe', async () => {
      prisma.analisisCausaRaiz.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.actualizarAnalisisProtocoloLondres('e999', {}))
        .rejects.toThrow('Análisis de causa raíz no encontrado');
    });
  });

  describe('actualizarAnalisisIshikawa', () => {
    it('debe actualizar análisis con diagrama de Ishikawa', async () => {
      const actualizacion = {
        causa_metodo: 'Falta de protocolo',
        causa_maquina: 'Equipo defectuoso',
        causa_material: 'Insumos inadecuados',
        causa_mano_obra: 'Personal no capacitado',
        causa_medio_ambiente: 'Iluminación deficiente',
        causa_medicion: 'Falta de controles',
        conclusiones: 'Conclusiones',
        recomendaciones: 'Recomendaciones',
      };

      prisma.analisisCausaRaiz.findUnique.mockResolvedValue({
        id: 'acr-1',
        eventoId: 'e1',
        metodoAnalisis: 'Ishikawa',
      });
      prisma.analisisCausaRaiz.update.mockResolvedValue({
        id: 'acr-1',
        eventoId: 'e1',
        ...actualizacion,
      });

      const result = await eventoAdversoService.actualizarAnalisisIshikawa('e1', actualizacion);

      expect(result.causa_metodo).toBe('Falta de protocolo');
      expect(result.causa_maquina).toBe('Equipo defectuoso');
    });
  });

  describe('actualizarAnalisis5Porques', () => {
    it('debe actualizar análisis con 5 Porqués', async () => {
      const actualizacion = {
        porque_1: '¿Por qué ocurrió el evento?',
        porque_2: '¿Por qué esa condición?',
        porque_3: '¿Por qué no se detectó?',
        porque_4: '¿Por qué el proceso falló?',
        porque_5: '¿Por qué no había control?',
        causa_raiz_final: 'Falta de supervisión en el proceso',
        conclusiones: 'Conclusiones',
        recomendaciones: 'Recomendaciones',
      };

      prisma.analisisCausaRaiz.findUnique.mockResolvedValue({
        id: 'acr-1',
        eventoId: 'e1',
        metodoAnalisis: 'CincoPorques',
      });
      prisma.analisisCausaRaiz.update.mockResolvedValue({
        id: 'acr-1',
        eventoId: 'e1',
        ...actualizacion,
      });

      const result = await eventoAdversoService.actualizarAnalisis5Porques('e1', actualizacion);

      expect(result.causa_raiz_final).toBe('Falta de supervisión en el proceso');
      expect(result.porque_1).toBe('¿Por qué ocurrió el evento?');
    });
  });

  describe('cerrarAnalisis', () => {
    it('debe cerrar el análisis y actualizar el estado del evento', async () => {
      prisma.analisisCausaRaiz.findUnique.mockResolvedValue({ id: 'acr-1', eventoId: 'e1' });

      prisma.$transaction.mockResolvedValue([
        { id: 'acr-1', estado: 'Completado' },
        { id: 'e1', estado: 'Analizado' }
      ]);

      const result = await eventoAdversoService.cerrarAnalisis('e1');

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('debe lanzar error si el análisis no existe', async () => {
      prisma.analisisCausaRaiz.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.cerrarAnalisis('e999'))
        .rejects.toThrow('Análisis de causa raíz no encontrado');
    });
  });

  // ==========================================
  // FACTORES CONTRIBUTIVOS
  // ==========================================
  describe('agregarFactorContributivo', () => {
    it('debe agregar un factor contributivo al evento', async () => {
      const factor = {
        eventoId: 'e1',
        categoria: 'Paciente',
        subcategoria: 'Condición clínica',
        descripcion: 'Paciente con múltiples comorbilidades',
        nivelContribucion: 'Alto',
      };

      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.factorContributivo.create.mockResolvedValue({
        id: 'f1',
        ...factor,
      });

      const result = await eventoAdversoService.agregarFactorContributivo(factor);

      expect(prisma.factorContributivo.create).toHaveBeenCalled();
      expect(result.categoria).toBe('Paciente');
      expect(result.nivelContribucion).toBe('Alto');
    });

    it('debe validar categorías válidas', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: 'e1' });

      await expect(eventoAdversoService.agregarFactorContributivo({
        eventoId: 'e1',
        categoria: 'CategoriaInvalida',
        descripcion: 'Test',
        nivelContribucion: 'Alto'
      })).rejects.toThrow('Categoría de factor no válida');
    });

    it('debe lanzar error si el evento no existe', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.agregarFactorContributivo({
        eventoId: 'invalid',
        categoria: 'Paciente',
        descripcion: 'Test',
        nivelContribucion: 'Alto'
      })).rejects.toThrow('Evento adverso no encontrado');
    });
  });

  describe('getFactoresContributivos', () => {
    it('debe retornar factores contributivos de un evento', async () => {
      const mockFactores = [
        { id: 'f1', categoria: 'Paciente', descripcion: 'Factor 1', nivelContribucion: 'Alto' },
        { id: 'f2', categoria: 'Equipo', descripcion: 'Factor 2', nivelContribucion: 'Medio' },
      ];

      prisma.eventoAdverso.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.factorContributivo.findMany.mockResolvedValue(mockFactores);

      const result = await eventoAdversoService.getFactoresContributivos('e1');

      expect(result).toHaveLength(2);
      expect(result[0].categoria).toBe('Paciente');
    });

    it('debe lanzar error si el evento no existe', async () => {
      prisma.eventoAdverso.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.getFactoresContributivos('invalid'))
        .rejects.toThrow('Evento adverso no encontrado');
    });
  });

  describe('eliminarFactorContributivo', () => {
    it('debe eliminar un factor contributivo', async () => {
      prisma.factorContributivo.findUnique.mockResolvedValue({ id: 'f1', eventoId: 'e1' });
      prisma.factorContributivo.delete.mockResolvedValue({ id: 'f1' });

      const result = await eventoAdversoService.eliminarFactorContributivo('f1');

      expect(prisma.factorContributivo.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
      expect(result.id).toBe('f1');
    });

    it('debe lanzar error si el factor no existe', async () => {
      prisma.factorContributivo.findUnique.mockResolvedValue(null);

      await expect(eventoAdversoService.eliminarFactorContributivo('invalid'))
        .rejects.toThrow('Factor contributivo no encontrado');
    });
  });

  // ==========================================
  // ESTADÍSTICAS Y DASHBOARD
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar estadísticas del dashboard de eventos adversos', async () => {
      const mockCounts = [10, 5, 3, 2, 1, 8, 1, 2];
      const mockGroupBy = [
        { tipoEvento: 'INCIDENTE', _count: true },
        { tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE', _count: true }
      ];

      prisma.eventoAdverso.count
        .mockResolvedValueOnce(mockCounts[0])
        .mockResolvedValueOnce(mockCounts[5])
        .mockResolvedValueOnce(mockCounts[6])
        .mockResolvedValueOnce(mockCounts[7]);

      prisma.eventoAdverso.groupBy
        .mockResolvedValueOnce(mockGroupBy) // por tipo
        .mockResolvedValueOnce(mockGroupBy) // por severidad
        .mockResolvedValueOnce(mockGroupBy) // por servicio
        .mockResolvedValueOnce(mockGroupBy); // por estado

      prisma.eventoAdverso.findMany.mockResolvedValue([
        { id: '1', tipoEvento: 'INCIDENTE', paciente: { nombre: 'Juan', apellido: 'Pérez' } }
      ]);

      const result = await eventoAdversoService.getDashboard({
        fechaDesde: '2025-01-01',
        fechaHasta: '2025-12-31'
      });

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('totalEventos');
      expect(result.resumen).toHaveProperty('eventosUltimos30Dias');
      expect(result.resumen).toHaveProperty('eventosCentinela');
      expect(result.resumen).toHaveProperty('eventosRequierenAnalisis');
      expect(result).toHaveProperty('eventosPorTipo');
      expect(result).toHaveProperty('eventosPorSeveridad');
      expect(result).toHaveProperty('eventosPorServicio');
      expect(result).toHaveProperty('eventosPorEstado');
      expect(result).toHaveProperty('ultimosEventos');
    });

    it('debe funcionar sin filtros de fecha', async () => {
      prisma.eventoAdverso.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      prisma.eventoAdverso.groupBy.mockResolvedValue([]);
      prisma.eventoAdverso.findMany.mockResolvedValue([]);

      const result = await eventoAdversoService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result).toHaveProperty('eventosPorTipo');
    });
  });

  describe('getTendenciaMensual', () => {
    it('debe retornar tendencia mensual de eventos', async () => {
      const mockEventos = [
        {
          fechaEvento: new Date('2025-01-15'),
          tipoEvento: 'INCIDENTE',
          severidad: 'LEVE'
        },
        {
          fechaEvento: new Date('2025-01-20'),
          tipoEvento: 'EVENTO_ADVERSO_PREVENIBLE',
          severidad: 'MODERADO'
        },
        {
          fechaEvento: new Date('2025-02-10'),
          tipoEvento: 'INCIDENTE',
          severidad: 'LEVE'
        },
      ];

      prisma.eventoAdverso.findMany.mockResolvedValue(mockEventos);

      const result = await eventoAdversoService.getTendenciaMensual(2025);

      expect(result).toHaveProperty('1');
      expect(result).toHaveProperty('2');
      expect(result[1].total).toBe(2);
      expect(result[2].total).toBe(1);
      expect(result[1].porTipo).toHaveProperty('INCIDENTE');
      expect(result[1].porSeveridad).toHaveProperty('LEVE');
    });

    it('debe usar el año actual si no se proporciona', async () => {
      prisma.eventoAdverso.findMany.mockResolvedValue([]);

      const result = await eventoAdversoService.getTendenciaMensual();

      expect(Object.keys(result)).toHaveLength(12);
      expect(result[1].total).toBe(0);
    });
  });
});
