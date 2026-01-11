/**
 * Tests para Comite Service
 */
const prisma = require('../../db/prisma');
const comiteService = require('../../services/comite.service');

// Mock para los métodos de Prisma que faltan en setup.js
beforeEach(() => {
  // Asegurar que los mocks existen
  if (!prisma.integranteComite.findFirst) {
    prisma.integranteComite.findFirst = jest.fn();
  }
  if (!prisma.reunionComite.findFirst) {
    prisma.reunionComite.findFirst = jest.fn();
  }
  if (!prisma.reunionComite.count) {
    prisma.reunionComite.count = jest.fn();
  }
  if (!prisma.comiteInstitucional.count) {
    prisma.comiteInstitucional.count = jest.fn();
  }
  if (!prisma.compromisoComite.count) {
    prisma.compromisoComite.count = jest.fn();
  }
});

describe('ComiteService', () => {
  // ==========================================
  // COMITÉS
  // ==========================================
  describe('getComites', () => {
    it('debe retornar lista de comités activos', async () => {
      const mockComites = [
        {
          id: '1',
          codigo: 'CSP',
          nombre: 'Comité de Seguridad del Paciente',
          activo: true,
          _count: { integrantes: 3, reuniones: 5 }
        },
        {
          id: '2',
          codigo: 'COVE',
          nombre: 'Comité de Vigilancia Epidemiológica',
          activo: true,
          _count: { integrantes: 4, reuniones: 3 }
        },
      ];

      prisma.comiteInstitucional.findMany.mockResolvedValue(mockComites);

      const result = await comiteService.getComites({ activo: true });

      expect(prisma.comiteInstitucional.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('_count');
    });
  });

  describe('getComiteById', () => {
    it('debe retornar un comité con sus integrantes y reuniones', async () => {
      const mockComite = {
        id: '1',
        codigo: 'CSP',
        nombre: 'Comité de Seguridad del Paciente',
        normativaBase: 'Res. 3100/2019',
        periodicidad: 'Mensual',
        integrantes: [
          { id: 'i1', rol: 'Presidente', activo: true, usuario: { nombre: 'Juan', apellido: 'Pérez' } },
        ],
        reuniones: [
          { id: 'r1', numeroActa: 'ACT-001', fechaProgramada: new Date() },
        ],
      };

      prisma.comiteInstitucional.findUnique.mockResolvedValue(mockComite);

      const result = await comiteService.getComiteById('1');

      expect(result.codigo).toBe('CSP');
      expect(result.integrantes).toHaveLength(1);
      expect(result.reuniones).toHaveLength(1);
    });

    it('debe lanzar error si el comité no existe', async () => {
      prisma.comiteInstitucional.findUnique.mockResolvedValue(null);

      await expect(comiteService.getComiteById('999')).rejects.toThrow('Comité no encontrado');
    });
  });

  describe('createComite', () => {
    it('debe crear un nuevo comité', async () => {
      const nuevoComite = {
        codigo: 'CNE',
        nombre: 'Comité Nuevo Ejemplo',
        normativaBase: 'Resolución X',
        objetivo: 'Objetivo del comité',
        periodicidad: 'Trimestral',
      };

      prisma.comiteInstitucional.findUnique.mockResolvedValue(null);
      prisma.comiteInstitucional.create.mockResolvedValue({ id: '1', ...nuevoComite, activo: true });

      const result = await comiteService.createComite(nuevoComite);

      expect(prisma.comiteInstitucional.create).toHaveBeenCalled();
      expect(result.codigo).toBe('CNE');
    });

    it('debe lanzar error si el código ya existe', async () => {
      prisma.comiteInstitucional.findUnique.mockResolvedValue({ id: '1', codigo: 'CSP' });

      await expect(
        comiteService.createComite({ codigo: 'CSP', nombre: 'Test' })
      ).rejects.toThrow('Ya existe un comité con este código');
    });
  });

  describe('updateComite', () => {
    it('debe actualizar un comité existente', async () => {
      const datosActualizados = {
        nombre: 'Comité Actualizado',
        periodicidad: 'Mensual',
      };

      prisma.comiteInstitucional.findUnique.mockResolvedValue({ id: '1', codigo: 'CSP' });
      prisma.comiteInstitucional.update.mockResolvedValue({ id: '1', codigo: 'CSP', ...datosActualizados });

      const result = await comiteService.updateComite('1', datosActualizados);

      expect(prisma.comiteInstitucional.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: datosActualizados,
      });
      expect(result.nombre).toBe('Comité Actualizado');
    });
  });

  // ==========================================
  // INTEGRANTES
  // ==========================================
  describe('getIntegrantes', () => {
    it('debe retornar integrantes activos de un comité', async () => {
      const mockIntegrantes = [
        { id: 'i1', rol: 'Presidente', activo: true, usuario: { nombre: 'Juan', apellido: 'Pérez' } },
        { id: 'i2', rol: 'Secretario', activo: true, usuario: { nombre: 'María', apellido: 'García' } },
      ];

      prisma.integranteComite.findMany.mockResolvedValue(mockIntegrantes);

      const result = await comiteService.getIntegrantes('comite-1', false);

      expect(result).toHaveLength(2);
      expect(result[0].rol).toBe('Presidente');
    });
  });

  describe('agregarIntegrante', () => {
    it('debe agregar un integrante al comité', async () => {
      const nuevoIntegrante = {
        comiteId: 'c1',
        usuarioId: 'u1',
        rol: 'Miembro',
        actaDesignacion: 'ACT-001',
      };

      prisma.comiteInstitucional.findUnique.mockResolvedValue({ id: 'c1', nombre: 'Comité Test' });
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u1', nombre: 'Test', apellido: 'User' });
      prisma.integranteComite.findFirst.mockResolvedValue(null);
      prisma.integranteComite.create.mockResolvedValue({
        id: 'i1',
        ...nuevoIntegrante,
        activo: true,
        fechaIngreso: new Date(),
        usuario: { nombre: 'Test', apellido: 'User', email: 'test@example.com' },
        comite: { nombre: 'Comité Test' }
      });

      const result = await comiteService.agregarIntegrante(nuevoIntegrante);

      expect(prisma.integranteComite.create).toHaveBeenCalled();
      expect(result.rol).toBe('Miembro');
    });

    it('debe lanzar error si el usuario ya es integrante', async () => {
      prisma.comiteInstitucional.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.integranteComite.findFirst.mockResolvedValue({ id: 'i1', usuarioId: 'u1', activo: true });

      await expect(
        comiteService.agregarIntegrante({ comiteId: 'c1', usuarioId: 'u1', rol: 'Miembro' })
      ).rejects.toThrow('El usuario ya es integrante activo del comité');
    });

    it('debe lanzar error si ya existe un presidente activo', async () => {
      prisma.comiteInstitucional.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u2' });
      prisma.integranteComite.findFirst
        .mockResolvedValueOnce(null) // No es integrante
        .mockResolvedValueOnce({ id: 'i1', rol: 'Presidente', activo: true }); // Ya hay presidente

      await expect(
        comiteService.agregarIntegrante({ comiteId: 'c1', usuarioId: 'u2', rol: 'Presidente' })
      ).rejects.toThrow('El comité ya tiene un presidente activo');
    });
  });

  describe('retirarIntegrante', () => {
    it('debe retirar un integrante del comité', async () => {
      prisma.integranteComite.findUnique.mockResolvedValue({ id: 'i1', activo: true });
      prisma.integranteComite.update.mockResolvedValue({
        id: 'i1',
        activo: false,
        fechaRetiro: new Date(),
      });

      const result = await comiteService.retirarIntegrante('i1');

      expect(prisma.integranteComite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'i1' },
          data: expect.objectContaining({ activo: false }),
        })
      );
      expect(result.activo).toBe(false);
    });
  });

  // ==========================================
  // REUNIONES
  // ==========================================
  describe('getReuniones', () => {
    it('debe retornar reuniones con paginación', async () => {
      const mockReuniones = [
        { id: 'r1', numeroActa: 'ACT-001', estado: 'Realizada', comite: { id: 'c1', nombre: 'Comité 1' }, _count: { seguimientoCompromisos: 2 } },
        { id: 'r2', numeroActa: 'ACT-002', estado: 'Programada', comite: { id: 'c1', nombre: 'Comité 1' }, _count: { seguimientoCompromisos: 0 } },
      ];

      prisma.reunionComite.findMany.mockResolvedValue(mockReuniones);
      prisma.reunionComite.count.mockResolvedValue(2);

      const result = await comiteService.getReuniones({ page: 1, limit: 10, comiteId: 'c1' });

      expect(result.reuniones).toHaveLength(2);
      expect(result.pagination).toHaveProperty('total', 2);
      expect(result.pagination).toHaveProperty('page', 1);
    });
  });

  describe('getReunionById', () => {
    it('debe retornar una reunión con sus detalles', async () => {
      const mockReunion = {
        id: 'r1',
        numeroActa: 'ACT-001',
        fechaProgramada: new Date(),
        comite: {
          id: 'c1',
          nombre: 'Comité Test',
          integrantes: [
            { usuario: { nombre: 'Juan', apellido: 'Pérez' }, activo: true }
          ]
        },
        seguimientoCompromisos: [],
      };

      prisma.reunionComite.findUnique.mockResolvedValue(mockReunion);

      const result = await comiteService.getReunionById('r1');

      expect(result.numeroActa).toBe('ACT-001');
      expect(result.comite).toHaveProperty('integrantes');
    });
  });

  describe('programarReunion', () => {
    it('debe programar una nueva reunión', async () => {
      const nuevaReunion = {
        comiteId: 'c1',
        fechaProgramada: new Date('2024-12-20'),
        lugar: 'Sala de Reuniones',
        ordenDelDia: ['Tema 1', 'Tema 2'],
      };

      prisma.comiteInstitucional.findUnique.mockResolvedValue({ id: 'c1', codigo: 'CSP', nombre: 'Comité Test' });
      prisma.reunionComite.findFirst.mockResolvedValue({ numeroActa: 'CSP-2024-005' });
      prisma.reunionComite.create.mockResolvedValue({
        id: 'r1',
        numeroActa: 'CSP-2024-006',
        ...nuevaReunion,
        estado: 'Programada',
        comite: { nombre: 'Comité Test' }
      });

      const result = await comiteService.programarReunion(nuevaReunion);

      expect(prisma.reunionComite.create).toHaveBeenCalled();
      expect(result.estado).toBe('Programada');
      expect(result.numeroActa).toMatch(/CSP-\d{4}-\d{3}/);
    });
  });

  describe('registrarReunion', () => {
    it('debe registrar la realización de una reunión', async () => {
      const datosReunion = {
        fechaRealizacion: new Date(),
        asistentes: [{ nombre: 'Juan', cargo: 'Presidente' }],
        temasDiscutidos: ['Tema 1 discutido'],
        decisiones: ['Decisión 1'],
        compromisos: [
          {
            descripcion: 'Compromiso 1',
            responsableId: 'u1',
            fechaLimite: new Date('2024-12-30')
          }
        ],
      };

      prisma.reunionComite.findUnique.mockResolvedValue({ id: 'r1', estado: 'Programada' });
      prisma.reunionComite.update.mockResolvedValue({
        id: 'r1',
        estado: 'Realizada',
        ...datosReunion,
      });
      prisma.compromisoComite.create.mockResolvedValue({
        id: 'cp1',
        reunionId: 'r1',
        descripcion: 'Compromiso 1',
        responsableId: 'u1',
        fechaLimite: new Date('2024-12-30'),
        estado: 'Pendiente',
      });

      const result = await comiteService.registrarReunion('r1', datosReunion);

      expect(prisma.reunionComite.update).toHaveBeenCalled();
      expect(result.estado).toBe('Realizada');
      expect(prisma.compromisoComite.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelarReunion', () => {
    it('debe cancelar una reunión programada', async () => {
      prisma.reunionComite.findUnique.mockResolvedValue({ id: 'r1', estado: 'Programada' });
      prisma.reunionComite.update.mockResolvedValue({
        id: 'r1',
        estado: 'Cancelada',
        temasDiscutidos: { motivo_cancelacion: 'Falta de quorum' },
      });

      const result = await comiteService.cancelarReunion('r1', 'Falta de quorum');

      expect(prisma.reunionComite.update).toHaveBeenCalled();
      expect(result.estado).toBe('Cancelada');
    });
  });

  // ==========================================
  // COMPROMISOS
  // ==========================================
  describe('getCompromisosPendientes', () => {
    it('debe retornar compromisos pendientes', async () => {
      const mockCompromisos = [
        {
          id: 'cp1',
          descripcion: 'Compromiso 1',
          estado: 'Pendiente',
          fechaLimite: new Date('2024-12-30'),
          reunion: { comiteId: 'c1', comite: { nombre: 'Comité Test', codigo: 'CSP' } },
          responsable: { nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com' }
        },
        {
          id: 'cp2',
          descripcion: 'Compromiso 2',
          estado: 'Pendiente',
          fechaLimite: new Date('2024-12-25'),
          reunion: { comiteId: 'c1', comite: { nombre: 'Comité Test', codigo: 'CSP' } },
          responsable: { nombre: 'María', apellido: 'García', email: 'maria@example.com' }
        },
      ];

      prisma.compromisoComite.findMany.mockResolvedValue(mockCompromisos);

      const result = await comiteService.getCompromisosPendientes({ comiteId: 'c1' });

      expect(result).toHaveLength(2);
      expect(result[0].estado).toBe('Pendiente');
    });

    it('debe retornar compromisos vencidos', async () => {
      const mockCompromisos = [
        {
          id: 'cp1',
          descripcion: 'Compromiso vencido',
          estado: 'Pendiente',
          fechaLimite: new Date('2024-11-01'),
          reunion: { comiteId: 'c1', comite: { nombre: 'Comité Test', codigo: 'CSP' } },
          responsable: { nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com' }
        },
      ];

      prisma.compromisoComite.findMany.mockResolvedValue(mockCompromisos);

      const result = await comiteService.getCompromisosPendientes({ vencidos: 'true' });

      expect(result).toHaveLength(1);
    });
  });

  describe('actualizarCompromiso', () => {
    it('debe actualizar el estado de un compromiso a Cumplido', async () => {
      prisma.compromisoComite.findUnique.mockResolvedValue({ id: 'cp1', estado: 'Pendiente' });
      prisma.compromisoComite.update.mockResolvedValue({
        id: 'cp1',
        estado: 'Cumplido',
        observacionCierre: 'Compromiso cumplido satisfactoriamente',
        fechaCierre: new Date(),
      });

      const result = await comiteService.actualizarCompromiso('cp1', {
        estado: 'Cumplido',
        observacionCierre: 'Compromiso cumplido satisfactoriamente',
      });

      expect(result.estado).toBe('Cumplido');
      expect(result.fechaCierre).toBeDefined();
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar estadísticas del dashboard', async () => {
      prisma.comiteInstitucional.count
        .mockResolvedValueOnce(5) // totalComites
        .mockResolvedValueOnce(4); // comitesActivos

      prisma.reunionComite.count
        .mockResolvedValueOnce(3) // reunionesProgramadas
        .mockResolvedValueOnce(10); // reunionesDelMes

      prisma.compromisoComite.count
        .mockResolvedValueOnce(15) // compromisosPendientes
        .mockResolvedValueOnce(5); // compromisosVencidos

      prisma.reunionComite.findMany.mockResolvedValue([
        { id: 'r1', numeroActa: 'ACT-001', fechaProgramada: new Date(), comite: { nombre: 'Comité 1', codigo: 'C1' } }
      ]);

      prisma.comiteInstitucional.findMany.mockResolvedValue([
        {
          codigo: 'CSP',
          nombre: 'Comité Test',
          periodicidad: 'Mensual',
          reuniones: [
            { estado: 'Realizada' },
            { estado: 'Realizada' },
            { estado: 'Programada' },
          ]
        }
      ]);

      const result = await comiteService.getDashboard();

      expect(result.resumen.totalComites).toBe(5);
      expect(result.resumen.comitesActivos).toBe(4);
      expect(result.proximasReuniones).toBeDefined();
      expect(result.estadisticasPorComite).toBeDefined();
    });
  });

  // ==========================================
  // ACTAS
  // ==========================================
  describe('generarActa', () => {
    it('debe generar el acta de una reunión', async () => {
      const mockReunion = {
        id: 'r1',
        numeroActa: 'ACT-001',
        fechaRealizacion: new Date(),
        lugar: 'Sala de Reuniones',
        ordenDelDia: ['Tema 1'],
        asistentes: [{ nombre: 'Juan' }],
        invitados: [],
        temasDiscutidos: ['Tema 1 discutido'],
        decisiones: ['Decisión 1'],
        comite: {
          nombre: 'Comité Test',
          integrantes: [
            {
              rol: 'Presidente',
              usuario: { nombre: 'Juan', apellido: 'Pérez' }
            }
          ]
        },
        seguimientoCompromisos: [
          {
            descripcion: 'Compromiso 1',
            fechaLimite: new Date(),
            estado: 'Pendiente',
            responsable: { nombre: 'María', apellido: 'García' }
          }
        ],
      };

      prisma.reunionComite.findUnique.mockResolvedValue(mockReunion);

      const result = await comiteService.generarActa('r1');

      expect(result).toHaveProperty('numeroActa');
      expect(result.numeroActa).toBe('ACT-001');
      expect(result.compromisos).toHaveLength(1);
      expect(result.integrantes).toHaveLength(1);
    });
  });
});
