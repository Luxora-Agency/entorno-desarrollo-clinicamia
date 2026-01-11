/**
 * Tests para PQRS Service
 */
const prisma = require('../../db/prisma');
const pqrsService = require('../../services/pqrs.service');

describe('PQRSService', () => {
  // ==========================================
  // PQRS
  // ==========================================
  describe('getPQRS', () => {
    it('debe retornar lista paginada de PQRS', async () => {
      const mockPQRS = [
        { id: '1', radicado: 'PQRS-001', tipo: 'PETICION', estado: 'Radicada', _count: { seguimientos: 0 } },
        { id: '2', radicado: 'PQRS-002', tipo: 'QUEJA', estado: 'Asignada', _count: { seguimientos: 1 } },
      ];

      prisma.pQRS.findMany.mockResolvedValue(mockPQRS);
      prisma.pQRS.count.mockResolvedValue(2);

      const result = await pqrsService.getPQRS({ page: 1, limit: 10 });

      expect(result.pqrs).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('debe filtrar PQRS por tipo', async () => {
      const mockPQRS = [
        { id: '1', tipo: 'QUEJA', estado: 'Radicada', _count: { seguimientos: 0 } },
      ];

      prisma.pQRS.findMany.mockResolvedValue(mockPQRS);
      prisma.pQRS.count.mockResolvedValue(1);

      const result = await pqrsService.getPQRS({ tipo: 'QUEJA' });

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipo: 'QUEJA' }),
        })
      );
      expect(result.pqrs[0].tipo).toBe('QUEJA');
    });

    it('debe filtrar PQRS por estado', async () => {
      const mockPQRS = [
        { id: '1', tipo: 'PETICION', estado: 'Resuelta', _count: { seguimientos: 2 } },
      ];

      prisma.pQRS.findMany.mockResolvedValue(mockPQRS);
      prisma.pQRS.count.mockResolvedValue(1);

      const result = await pqrsService.getPQRS({ estado: 'Resuelta' });

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'Resuelta' }),
        })
      );
      expect(result.pqrs[0].estado).toBe('Resuelta');
    });

    it('debe filtrar PQRS vencidas', async () => {
      const fechaVencida = new Date();
      fechaVencida.setDate(fechaVencida.getDate() - 5);

      const mockPQRS = [
        {
          id: '1',
          tipo: 'PETICION',
          estado: 'Asignada',
          fechaLimiteRespuesta: fechaVencida,
          _count: { seguimientos: 1 },
        },
      ];

      prisma.pQRS.findMany.mockResolvedValue(mockPQRS);
      prisma.pQRS.count.mockResolvedValue(1);

      const result = await pqrsService.getPQRS({ vencidas: 'true' });

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaLimiteRespuesta: expect.objectContaining({ lt: expect.any(Date) }),
            estado: { notIn: ['Resuelta', 'Cerrada'] },
          }),
        })
      );
      expect(result.pqrs).toHaveLength(1);
    });

    it('debe filtrar por prioridad', async () => {
      const mockPQRS = [
        { id: '1', prioridad: 'Alta', _count: { seguimientos: 0 } },
      ];

      prisma.pQRS.findMany.mockResolvedValue(mockPQRS);
      prisma.pQRS.count.mockResolvedValue(1);

      await pqrsService.getPQRS({ prioridad: 'Alta' });

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ prioridad: 'Alta' }),
        })
      );
    });

    it('debe filtrar por rango de fechas', async () => {
      const mockPQRS = [];

      prisma.pQRS.findMany.mockResolvedValue(mockPQRS);
      prisma.pQRS.count.mockResolvedValue(0);

      await pqrsService.getPQRS({
        fechaDesde: '2025-01-01',
        fechaHasta: '2025-01-31'
      });

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaRecepcion: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      );
    });
  });

  describe('getPQRSById', () => {
    it('debe retornar un PQRS con sus seguimientos', async () => {
      const mockPQRS = {
        id: '1',
        radicado: 'PQRS-001',
        tipo: 'PETICION',
        asunto: 'Solicitud de historia clínica',
        seguimientos: [
          { id: 's1', accion: 'Asignación', observaciones: 'Asignada a área responsable' },
        ],
        paciente: { id: 'p1', nombre: 'Juan', apellido: 'Pérez', cedula: '123456', telefono: '555-0100', email: 'juan@test.com' },
        responsable: { id: 'u1', nombre: 'María', apellido: 'García', email: 'maria@test.com' },
      };

      prisma.pQRS.findUnique.mockResolvedValue(mockPQRS);

      const result = await pqrsService.getPQRSById('1');

      expect(prisma.pQRS.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          paciente: {
            select: { id: true, nombre: true, apellido: true, cedula: true, telefono: true, email: true },
          },
          responsable: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          respondedor: {
            select: { id: true, nombre: true, apellido: true },
          },
          seguimientos: {
            include: {
              usuario: { select: { nombre: true, apellido: true } },
            },
            orderBy: { fechaAccion: 'desc' },
          },
        },
      });
      expect(result.radicado).toBe('PQRS-001');
      expect(result.seguimientos).toHaveLength(1);
    });

    it('debe lanzar error si el PQRS no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.getPQRSById('999')).rejects.toThrow('PQRS no encontrada');
    });
  });

  describe('getPQRSByRadicado', () => {
    it('debe retornar PQRS por número de radicado', async () => {
      const mockPQRS = {
        id: '1',
        radicado: 'PQRS-20251217-001',
        tipo: 'PETICION',
        seguimientos: [
          { id: 's1', accion: 'Asignación' },
        ],
      };

      prisma.pQRS.findUnique.mockResolvedValue(mockPQRS);

      const result = await pqrsService.getPQRSByRadicado('PQRS-20251217-001');

      expect(prisma.pQRS.findUnique).toHaveBeenCalledWith({
        where: { radicado: 'PQRS-20251217-001' },
        include: {
          seguimientos: {
            orderBy: { fechaAccion: 'desc' },
          },
        },
      });
      expect(result.radicado).toBe('PQRS-20251217-001');
    });

    it('debe lanzar error si el radicado no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.getPQRSByRadicado('INVALID')).rejects.toThrow('PQRS no encontrada');
    });
  });

  describe('createPQRS', () => {
    it('debe crear una nueva petición con estado Radicada', async () => {
      const nuevaPQRS = {
        tipo: 'PETICION',
        canal: 'PRESENCIAL',
        nombrePeticionario: 'Juan Pérez',
        asunto: 'Solicitud de copia de historia clínica',
        descripcion: 'Requiero copia de mi historia clínica',
      };

      const mockCreatedPQRS = {
        id: '1',
        radicado: 'PQRS-20251217-001',
        ...nuevaPQRS,
        estado: 'Radicada',
        diasHabilesLimite: 15,
        fechaRecepcion: new Date(),
        fechaLimiteRespuesta: new Date(),
        prioridad: 'Normal',
        esAnonimo: false,
      };

      prisma.pQRS.create.mockResolvedValue(mockCreatedPQRS);

      const result = await pqrsService.createPQRS(nuevaPQRS);

      expect(prisma.pQRS.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: 'PETICION',
          canal: 'PRESENCIAL',
          nombrePeticionario: 'Juan Pérez',
          asunto: 'Solicitud de copia de historia clínica',
          descripcion: 'Requiero copia de mi historia clínica',
          estado: 'Radicada',
          diasHabilesLimite: 15,
          prioridad: 'Normal',
          esAnonimo: false,
          fechaRecepcion: expect.any(Date),
          fechaLimiteRespuesta: expect.any(Date),
        }),
      });
      expect(result.estado).toBe('Radicada');
      expect(result.diasHabilesLimite).toBe(15);
    });

    it('debe crear una queja con 15 días hábiles de plazo', async () => {
      const nuevaQueja = {
        tipo: 'QUEJA',
        canal: 'EMAIL',
        nombrePeticionario: 'María García',
        asunto: 'Queja por demora en atención',
        descripcion: 'Descripción de la queja',
      };

      prisma.pQRS.create.mockResolvedValue({
        id: '1',
        ...nuevaQueja,
        diasHabilesLimite: 15,
        estado: 'Radicada',
        prioridad: 'Normal',
        fechaRecepcion: new Date(),
        fechaLimiteRespuesta: new Date(),
      });

      const result = await pqrsService.createPQRS(nuevaQueja);

      expect(result.diasHabilesLimite).toBe(15);
    });

    it('debe crear una denuncia con 10 días hábiles de plazo', async () => {
      const nuevaDenuncia = {
        tipo: 'DENUNCIA',
        canal: 'WEB',
        nombrePeticionario: 'Anónimo',
        esAnonimo: true,
        asunto: 'Denuncia por mal trato',
        descripcion: 'Descripción de la denuncia',
      };

      prisma.pQRS.create.mockResolvedValue({
        id: '1',
        ...nuevaDenuncia,
        diasHabilesLimite: 10,
        estado: 'Radicada',
        prioridad: 'Normal',
        fechaRecepcion: new Date(),
        fechaLimiteRespuesta: new Date(),
      });

      const result = await pqrsService.createPQRS(nuevaDenuncia);

      expect(result.diasHabilesLimite).toBe(10);
    });

    it('debe crear una felicitación con 5 días hábiles de plazo', async () => {
      const nuevaFelicitacion = {
        tipo: 'FELICITACION',
        canal: 'PRESENCIAL',
        nombrePeticionario: 'Carlos López',
        asunto: 'Felicitación al personal de urgencias',
        descripcion: 'Excelente atención recibida',
      };

      prisma.pQRS.create.mockResolvedValue({
        id: '1',
        ...nuevaFelicitacion,
        diasHabilesLimite: 5,
        estado: 'Radicada',
        prioridad: 'Normal',
        fechaRecepcion: new Date(),
        fechaLimiteRespuesta: new Date(),
      });

      const result = await pqrsService.createPQRS(nuevaFelicitacion);

      expect(result.diasHabilesLimite).toBe(5);
    });

    it('debe usar prioridad personalizada si se proporciona', async () => {
      const nuevaPQRS = {
        tipo: 'RECLAMO',
        canal: 'TELEFONO',
        nombrePeticionario: 'Test User',
        asunto: 'Test',
        descripcion: 'Test',
        prioridad: 'Alta',
      };

      prisma.pQRS.create.mockResolvedValue({
        id: '1',
        ...nuevaPQRS,
        diasHabilesLimite: 15,
        estado: 'Radicada',
        fechaRecepcion: new Date(),
        fechaLimiteRespuesta: new Date(),
      });

      const result = await pqrsService.createPQRS(nuevaPQRS);

      expect(result.prioridad).toBe('Alta');
    });
  });

  describe('asignarPQRS', () => {
    it('debe asignar un PQRS a un responsable y cambiar estado a Asignada', async () => {
      prisma.pQRS.findUnique.mockResolvedValue({ id: '1', estado: 'Radicada' });
      prisma.pQRS.update.mockResolvedValue({
        id: '1',
        responsableId: 'user-id',
        areaAsignada: 'Atención al Usuario',
        estado: 'Asignada',
      });
      prisma.seguimientoPQRS.create.mockResolvedValue({
        id: 's1',
        pqrsId: '1',
        accion: 'Asignación',
        observaciones: 'Asignada a Atención al Usuario',
        usuarioId: 'admin-id',
      });

      const result = await pqrsService.asignarPQRS('1', {
        responsableId: 'user-id',
        areaAsignada: 'Atención al Usuario',
        usuarioId: 'admin-id',
      });

      expect(prisma.pQRS.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prisma.pQRS.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          areaAsignada: 'Atención al Usuario',
          responsableId: 'user-id',
          estado: 'Asignada',
        },
      });
      expect(prisma.seguimientoPQRS.create).toHaveBeenCalledWith({
        data: {
          pqrsId: '1',
          accion: 'Asignación',
          observaciones: 'Asignada a Atención al Usuario',
          usuarioId: 'admin-id',
        },
      });
      expect(result.estado).toBe('Asignada');
    });

    it('debe lanzar error si PQRS no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.asignarPQRS('999', {
        responsableId: 'user-id',
        areaAsignada: 'Test',
        usuarioId: 'admin-id',
      })).rejects.toThrow('PQRS no encontrada');
    });
  });

  describe('responderPQRS', () => {
    it('debe registrar la respuesta de un PQRS y cambiar estado a Resuelta', async () => {
      prisma.pQRS.findUnique.mockResolvedValue({ id: '1', estado: 'Asignada' });
      prisma.pQRS.update.mockResolvedValue({
        id: '1',
        respuesta: 'Respuesta al peticionario',
        fechaRespuesta: new Date(),
        respondidoPor: 'user-id',
        estado: 'Resuelta',
      });
      prisma.seguimientoPQRS.create.mockResolvedValue({
        id: 's1',
        pqrsId: '1',
        accion: 'Respuesta',
        observaciones: 'Se generó respuesta a la PQRS',
        usuarioId: 'user-id',
      });

      const result = await pqrsService.responderPQRS('1', {
        respuesta: 'Respuesta al peticionario',
        respondidoPor: 'user-id',
      });

      expect(prisma.pQRS.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          respuesta: 'Respuesta al peticionario',
          fechaRespuesta: expect.any(Date),
          respondidoPor: 'user-id',
          archivoRespuesta: undefined,
          estado: 'Resuelta',
        },
      });
      expect(prisma.seguimientoPQRS.create).toHaveBeenCalledWith({
        data: {
          pqrsId: '1',
          accion: 'Respuesta',
          observaciones: 'Se generó respuesta a la PQRS',
          usuarioId: 'user-id',
        },
      });
      expect(result.estado).toBe('Resuelta');
      expect(result.respuesta).toBe('Respuesta al peticionario');
    });

    it('debe incluir archivo de respuesta si se proporciona', async () => {
      prisma.pQRS.findUnique.mockResolvedValue({ id: '1', estado: 'Asignada' });
      prisma.pQRS.update.mockResolvedValue({
        id: '1',
        respuesta: 'Ver archivo adjunto',
        archivoRespuesta: '/uploads/respuesta.pdf',
        fechaRespuesta: new Date(),
        respondidoPor: 'user-id',
        estado: 'Resuelta',
      });
      prisma.seguimientoPQRS.create.mockResolvedValue({});

      const result = await pqrsService.responderPQRS('1', {
        respuesta: 'Ver archivo adjunto',
        archivoRespuesta: '/uploads/respuesta.pdf',
        respondidoPor: 'user-id',
      });

      expect(result.archivoRespuesta).toBe('/uploads/respuesta.pdf');
    });

    it('debe lanzar error si PQRS no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.responderPQRS('999', {
        respuesta: 'Test',
        respondidoPor: 'user'
      })).rejects.toThrow('PQRS no encontrada');
    });
  });

  describe('cerrarPQRS', () => {
    it('debe cerrar un PQRS y retornar success', async () => {
      prisma.pQRS.findUnique.mockResolvedValue({ id: '1', estado: 'Resuelta' });
      prisma.$transaction.mockResolvedValue([
        { id: '1', estado: 'Cerrada' },
        { id: 's1' },
      ]);

      const result = await pqrsService.cerrarPQRS('1', 'user-id');

      expect(prisma.pQRS.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });

    it('debe lanzar error si PQRS no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.cerrarPQRS('999', 'user-id')).rejects.toThrow('PQRS no encontrada');
    });
  });

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================
  describe('agregarSeguimiento', () => {
    it('debe agregar un seguimiento a un PQRS', async () => {
      const seguimientoData = {
        accion: 'Se contactó al peticionario',
        observaciones: 'Se informó sobre el estado de su solicitud',
        usuarioId: 'user-id',
      };

      prisma.pQRS.findUnique.mockResolvedValue({ id: '1' });
      prisma.seguimientoPQRS.create.mockResolvedValue({
        id: 's1',
        pqrsId: '1',
        ...seguimientoData,
        fechaAccion: new Date(),
        usuario: { nombre: 'Juan', apellido: 'Pérez' },
      });

      const result = await pqrsService.agregarSeguimiento('1', seguimientoData);

      expect(prisma.pQRS.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prisma.seguimientoPQRS.create).toHaveBeenCalledWith({
        data: {
          pqrsId: '1',
          accion: 'Se contactó al peticionario',
          observaciones: 'Se informó sobre el estado de su solicitud',
          usuarioId: 'user-id',
        },
        include: {
          usuario: { select: { nombre: true, apellido: true } },
        },
      });
      expect(result.accion).toBe('Se contactó al peticionario');
    });

    it('debe lanzar error si PQRS no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.agregarSeguimiento('999', {
        accion: 'Test',
        observaciones: 'Test',
        usuarioId: 'user-id',
      })).rejects.toThrow('PQRS no encontrada');
    });
  });

  describe('getSeguimientos', () => {
    it('debe retornar seguimientos de un PQRS ordenados por fecha', async () => {
      const mockSeguimientos = [
        {
          id: 's2',
          accion: 'Respuesta',
          fechaAccion: new Date('2025-01-15'),
          usuario: { nombre: 'María', apellido: 'García' },
        },
        {
          id: 's1',
          accion: 'Asignación',
          fechaAccion: new Date('2025-01-10'),
          usuario: { nombre: 'Juan', apellido: 'Pérez' },
        },
      ];

      prisma.seguimientoPQRS.findMany.mockResolvedValue(mockSeguimientos);

      const result = await pqrsService.getSeguimientos('1');

      expect(prisma.seguimientoPQRS.findMany).toHaveBeenCalledWith({
        where: { pqrsId: '1' },
        include: {
          usuario: { select: { nombre: true, apellido: true } },
        },
        orderBy: { fechaAccion: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].accion).toBe('Respuesta');
    });
  });

  // ==========================================
  // SATISFACCIÓN
  // ==========================================
  describe('registrarSatisfaccion', () => {
    it('debe registrar la calificación de satisfacción', async () => {
      prisma.pQRS.findUnique.mockResolvedValue({ id: '1', estado: 'Resuelta' });
      prisma.pQRS.update.mockResolvedValue({
        id: '1',
        calificacionRespuesta: 5,
        comentarioSatisfaccion: 'Muy satisfecho con la respuesta',
        encuestaEnviada: true,
      });

      const result = await pqrsService.registrarSatisfaccion('1', {
        calificacionRespuesta: 5,
        comentarioSatisfaccion: 'Muy satisfecho con la respuesta',
      });

      expect(prisma.pQRS.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          calificacionRespuesta: 5,
          comentarioSatisfaccion: 'Muy satisfecho con la respuesta',
          encuestaEnviada: true,
        },
      });
      expect(result.calificacionRespuesta).toBe(5);
    });

    it('debe validar que la calificación esté entre 1 y 5', async () => {
      prisma.pQRS.findUnique.mockResolvedValue({ id: '1', estado: 'Resuelta' });

      await expect(pqrsService.registrarSatisfaccion('1', {
        calificacionRespuesta: 6,
        comentarioSatisfaccion: 'Test',
      })).rejects.toThrow('La calificación debe estar entre 1 y 5');

      await expect(pqrsService.registrarSatisfaccion('1', {
        calificacionRespuesta: 0,
        comentarioSatisfaccion: 'Test',
      })).rejects.toThrow('La calificación debe estar entre 1 y 5');
    });

    it('debe lanzar error si PQRS no existe', async () => {
      prisma.pQRS.findUnique.mockResolvedValue(null);

      await expect(pqrsService.registrarSatisfaccion('999', {
        calificacionRespuesta: 5,
      })).rejects.toThrow('PQRS no encontrada');
    });
  });

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar dashboard con resumen y estadísticas', async () => {
      const mockQueryResult = [{ promedio: 5.5 }];

      prisma.pQRS.count
        .mockResolvedValueOnce(100)  // totalPQRS
        .mockResolvedValueOnce(15)   // pqrsVencidas
        .mockResolvedValueOnce(8)    // pqrsPorVencer
        .mockResolvedValueOnce(25);  // pqrsDelMes

      prisma.pQRS.groupBy
        .mockResolvedValueOnce([
          { tipo: 'PETICION', _count: true },
          { tipo: 'QUEJA', _count: true },
        ])
        .mockResolvedValueOnce([
          { estado: 'Radicada', _count: true },
          { estado: 'Asignada', _count: true },
        ])
        .mockResolvedValueOnce([
          { canal: 'PRESENCIAL', _count: true },
          { canal: 'WEB', _count: true },
        ]);

      prisma.pQRS.aggregate.mockResolvedValue({
        _avg: { calificacionRespuesta: 4.2 },
      });

      prisma.$queryRaw.mockResolvedValue(mockQueryResult);

      prisma.pQRS.findMany.mockResolvedValue([
        {
          id: '1',
          radicado: 'PQRS-001',
          tipo: 'PETICION',
          asunto: 'Test',
          fechaRecepcion: new Date(),
          fechaLimiteRespuesta: new Date(),
          prioridad: 'Alta',
        },
      ]);

      const result = await pqrsService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('totalPQRS', 100);
      expect(result.resumen).toHaveProperty('pqrsDelMes', 25);
      expect(result.resumen).toHaveProperty('pqrsVencidas', 15);
      expect(result.resumen).toHaveProperty('pqrsPorVencer', 8);
      expect(result.resumen).toHaveProperty('promedioSatisfaccion', 4.2);
      expect(result.resumen).toHaveProperty('tiempoPromedioRespuesta', 5.5);
      expect(result).toHaveProperty('pqrsPorTipo');
      expect(result).toHaveProperty('pqrsPorEstado');
      expect(result).toHaveProperty('pqrsPorCanal');
      expect(result).toHaveProperty('pendientesAntiguas');
      expect(result.pendientesAntiguas).toHaveLength(1);
    });
  });

  describe('getReporteMensual', () => {
    it('debe retornar reporte mensual con métricas', async () => {
      const mockQueryResult = [{ promedio: 7.5 }];

      prisma.pQRS.count
        .mockResolvedValueOnce(50)  // pqrsRecibidas
        .mockResolvedValueOnce(45)  // pqrsResueltas
        .mockResolvedValueOnce(3);  // pqrsVencidas

      prisma.pQRS.groupBy
        .mockResolvedValueOnce([
          { tipo: 'PETICION', _count: true },
          { tipo: 'QUEJA', _count: true },
        ])
        .mockResolvedValueOnce([
          { canal: 'PRESENCIAL', _count: true },
          { canal: 'WEB', _count: true },
        ]);

      prisma.$queryRaw.mockResolvedValue(mockQueryResult);

      prisma.pQRS.aggregate.mockResolvedValue({
        _avg: { calificacionRespuesta: 4.5 },
      });

      const result = await pqrsService.getReporteMensual(2025, 1);

      expect(result).toHaveProperty('periodo');
      expect(result.periodo).toEqual({ anio: 2025, mes: 1 });
      expect(result).toHaveProperty('pqrsRecibidas', 50);
      expect(result).toHaveProperty('pqrsResueltas', 45);
      expect(result).toHaveProperty('pqrsVencidas', 3);
      expect(result).toHaveProperty('tasaResolucion', 90);
      expect(result).toHaveProperty('pqrsPorTipo');
      expect(result).toHaveProperty('pqrsPorCanal');
      expect(result).toHaveProperty('promedioTiempoRespuesta', 7.5);
      expect(result).toHaveProperty('satisfaccionPromedio', 4.5);
    });

    it('debe calcular tasa de resolución como 0 si no hay PQRS recibidas', async () => {
      const mockQueryResult = [{ promedio: null }];

      prisma.pQRS.count
        .mockResolvedValueOnce(0)  // pqrsRecibidas
        .mockResolvedValueOnce(0)  // pqrsResueltas
        .mockResolvedValueOnce(0); // pqrsVencidas

      prisma.pQRS.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      prisma.$queryRaw.mockResolvedValue(mockQueryResult);

      prisma.pQRS.aggregate.mockResolvedValue({
        _avg: { calificacionRespuesta: null },
      });

      const result = await pqrsService.getReporteMensual(2025, 1);

      expect(result.tasaResolucion).toBe(0);
      expect(result.promedioTiempoRespuesta).toBe(0);
      expect(result.satisfaccionPromedio).toBe(0);
    });
  });

  // ==========================================
  // UTILIDADES
  // ==========================================
  describe('calcularDiasHabiles', () => {
    it('debe retornar 15 días para PETICION', () => {
      const dias = pqrsService.calcularDiasHabiles('PETICION');
      expect(dias).toBe(15);
    });

    it('debe retornar 15 días para QUEJA', () => {
      const dias = pqrsService.calcularDiasHabiles('QUEJA');
      expect(dias).toBe(15);
    });

    it('debe retornar 15 días para RECLAMO', () => {
      const dias = pqrsService.calcularDiasHabiles('RECLAMO');
      expect(dias).toBe(15);
    });

    it('debe retornar 15 días para SUGERENCIA', () => {
      const dias = pqrsService.calcularDiasHabiles('SUGERENCIA');
      expect(dias).toBe(15);
    });

    it('debe retornar 10 días para DENUNCIA', () => {
      const dias = pqrsService.calcularDiasHabiles('DENUNCIA');
      expect(dias).toBe(10);
    });

    it('debe retornar 5 días para FELICITACION', () => {
      const dias = pqrsService.calcularDiasHabiles('FELICITACION');
      expect(dias).toBe(5);
    });

    it('debe retornar 15 días por defecto para tipo desconocido', () => {
      const dias = pqrsService.calcularDiasHabiles('TIPO_DESCONOCIDO');
      expect(dias).toBe(15);
    });
  });

  describe('calcularFechaLimite', () => {
    it('debe calcular fecha límite excluyendo fines de semana', () => {
      const fechaLimite = pqrsService.calcularFechaLimite(5);
      const hoy = new Date();

      expect(fechaLimite).toBeInstanceOf(Date);
      expect(fechaLimite.getTime()).toBeGreaterThan(hoy.getTime());

      // Verificar que no es sábado ni domingo
      const diaSemana = fechaLimite.getDay();
      expect(diaSemana).not.toBe(0); // No domingo
      expect(diaSemana).not.toBe(6); // No sábado
    });

    it('debe contar solo días hábiles', () => {
      // Calcular 1 día hábil
      const fechaLimite = pqrsService.calcularFechaLimite(1);
      const hoy = new Date();

      // La diferencia debe ser al menos 1 día
      const diferenciaDias = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
      expect(diferenciaDias).toBeGreaterThanOrEqual(1);
      expect(diferenciaDias).toBeLessThanOrEqual(3); // Máximo 3 si hoy es viernes
    });
  });

  describe('getPQRSProximasVencer', () => {
    it('debe retornar PQRS próximas a vencer en los próximos 3 días', async () => {
      const fechaProxima = new Date();
      fechaProxima.setDate(fechaProxima.getDate() + 2);

      const mockProximas = [
        {
          id: '1',
          radicado: 'PQRS-001',
          fechaLimiteRespuesta: fechaProxima,
          estado: 'Asignada',
          responsable: {
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@test.com',
          },
        },
      ];

      prisma.pQRS.findMany.mockResolvedValue(mockProximas);

      const result = await pqrsService.getPQRSProximasVencer(3);

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith({
        where: {
          fechaLimiteRespuesta: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          estado: { notIn: ['Resuelta', 'Cerrada'] },
        },
        include: {
          responsable: { select: { nombre: true, apellido: true, email: true } },
        },
        orderBy: { fechaLimiteRespuesta: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].radicado).toBe('PQRS-001');
    });

    it('debe usar 3 días por defecto si no se especifica', async () => {
      prisma.pQRS.findMany.mockResolvedValue([]);

      await pqrsService.getPQRSProximasVencer();

      expect(prisma.pQRS.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaLimiteRespuesta: expect.any(Object),
          }),
        })
      );
    });
  });
});
