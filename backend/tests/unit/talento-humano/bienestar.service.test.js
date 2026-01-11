/**
 * Tests para BienestarService - Módulo Talento Humano
 */
const prisma = require('../../../db/prisma');
const bienestarService = require('../../../services/talento-humano/bienestar.service');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

describe('BienestarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ BENEFICIOS ============

  describe('listBeneficios', () => {
    it('debe listar beneficios activos', async () => {
      const mockBeneficios = [
        { id: '1', nombre: 'Seguro de vida', tipo: 'SALUD' },
        { id: '2', nombre: 'Auxilio educativo', tipo: 'EDUCACION' }
      ];

      prisma.tHBeneficio.findMany.mockResolvedValue(mockBeneficios);

      const result = await bienestarService.listBeneficios({});

      expect(prisma.tHBeneficio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activo: true })
        })
      );
      expect(result).toHaveLength(2);
    });

    it('debe filtrar por tipo', async () => {
      prisma.tHBeneficio.findMany.mockResolvedValue([]);

      await bienestarService.listBeneficios({ tipo: 'SALUD' });

      expect(prisma.tHBeneficio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipo: 'SALUD' })
        })
      );
    });
  });

  describe('createBeneficio', () => {
    it('debe crear un beneficio', async () => {
      const data = {
        nombre: 'Seguro de vida',
        descripcion: 'Seguro de vida para empleados',
        tipo: 'SALUD',
        valorMensual: 50000
      };

      prisma.tHBeneficio.create.mockResolvedValue({ id: '1', ...data });

      const result = await bienestarService.createBeneficio(data);

      expect(prisma.tHBeneficio.create).toHaveBeenCalledWith({ data });
      expect(result.nombre).toBe('Seguro de vida');
    });
  });

  describe('updateBeneficio', () => {
    it('debe actualizar un beneficio', async () => {
      const mockBeneficio = { id: '1', nombre: 'Beneficio' };
      const updateData = { nombre: 'Beneficio actualizado' };

      prisma.tHBeneficio.findUnique.mockResolvedValue(mockBeneficio);
      prisma.tHBeneficio.update.mockResolvedValue({ ...mockBeneficio, ...updateData });

      const result = await bienestarService.updateBeneficio('1', updateData);

      expect(result.nombre).toBe('Beneficio actualizado');
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHBeneficio.findUnique.mockResolvedValue(null);

      await expect(bienestarService.updateBeneficio('999', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('asignarBeneficio', () => {
    it('debe asignar beneficio a empleado', async () => {
      prisma.tHBeneficio.findUnique.mockResolvedValue({ id: '1' });
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.tHBeneficioEmpleado.create.mockResolvedValue({
        beneficioId: '1',
        empleadoId: 'emp-1',
        fechaInicio: new Date()
      });

      const result = await bienestarService.asignarBeneficio('1', 'emp-1', {});

      expect(prisma.tHBeneficioEmpleado.create).toHaveBeenCalled();
      expect(result.beneficioId).toBe('1');
    });

    it('debe lanzar NotFoundError si beneficio no existe', async () => {
      prisma.tHBeneficio.findUnique.mockResolvedValue(null);
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });

      await expect(bienestarService.asignarBeneficio('999', 'emp-1', {})).rejects.toThrow(NotFoundError);
      await expect(bienestarService.asignarBeneficio('999', 'emp-1', {})).rejects.toThrow('Beneficio no encontrado');
    });

    it('debe lanzar NotFoundError si empleado no existe', async () => {
      prisma.tHBeneficio.findUnique.mockResolvedValue({ id: '1' });
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(bienestarService.asignarBeneficio('1', '999', {})).rejects.toThrow(NotFoundError);
      await expect(bienestarService.asignarBeneficio('1', '999', {})).rejects.toThrow('Empleado no encontrado');
    });
  });

  describe('getBeneficiosEmpleado', () => {
    it('debe obtener beneficios activos de un empleado', async () => {
      const mockBeneficios = [
        { beneficio: { nombre: 'Seguro' } },
        { beneficio: { nombre: 'Auxilio' } }
      ];

      prisma.tHBeneficioEmpleado.findMany.mockResolvedValue(mockBeneficios);

      const result = await bienestarService.getBeneficiosEmpleado('emp-1');

      expect(prisma.tHBeneficioEmpleado.findMany).toHaveBeenCalledWith({
        where: { empleadoId: 'emp-1', estado: 'ACTIVO' },
        include: { beneficio: true }
      });
      expect(result).toHaveLength(2);
    });
  });

  // ============ ENCUESTAS ============

  describe('listEncuestas', () => {
    it('debe listar encuestas', async () => {
      const mockEncuestas = [
        { id: '1', titulo: 'Clima laboral', estado: 'ACTIVA' },
        { id: '2', titulo: 'Satisfacción', estado: 'BORRADOR' }
      ];

      prisma.tHEncuesta.findMany.mockResolvedValue(mockEncuestas);
      prisma.tHEncuesta.count.mockResolvedValue(2);

      const result = await bienestarService.listEncuestas({});

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por tipo y estado', async () => {
      prisma.tHEncuesta.findMany.mockResolvedValue([]);
      prisma.tHEncuesta.count.mockResolvedValue(0);

      await bienestarService.listEncuestas({ tipo: 'CLIMA', estado: 'ACTIVA' });

      expect(prisma.tHEncuesta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipo: 'CLIMA', estado: 'ACTIVA' })
        })
      );
    });
  });

  describe('createEncuesta', () => {
    it('debe crear una encuesta', async () => {
      const data = {
        titulo: 'Encuesta de clima',
        tipo: 'CLIMA',
        fechaInicio: new Date(),
        fechaFin: new Date(),
        preguntas: [{ texto: 'Pregunta 1', tipo: 'escala' }]
      };

      prisma.tHEncuesta.create.mockResolvedValue({ id: '1', ...data });

      const result = await bienestarService.createEncuesta(data);

      expect(prisma.tHEncuesta.create).toHaveBeenCalledWith({ data });
      expect(result.titulo).toBe('Encuesta de clima');
    });
  });

  describe('getEncuesta', () => {
    it('debe obtener encuesta por ID', async () => {
      const mockEncuesta = { id: '1', titulo: 'Clima laboral' };

      prisma.tHEncuesta.findUnique.mockResolvedValue(mockEncuesta);

      const result = await bienestarService.getEncuesta('1');

      expect(result).toEqual(mockEncuesta);
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue(null);

      await expect(bienestarService.getEncuesta('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('activarEncuesta', () => {
    it('debe activar una encuesta', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue({ id: '1', estado: 'BORRADOR' });
      prisma.tHEncuesta.update.mockResolvedValue({ id: '1', estado: 'ACTIVA' });

      const result = await bienestarService.activarEncuesta('1');

      expect(prisma.tHEncuesta.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'ACTIVA' }
      });
      expect(result.estado).toBe('ACTIVA');
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue(null);

      await expect(bienestarService.activarEncuesta('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('responderEncuesta', () => {
    const mockEncuestaActiva = {
      id: '1',
      estado: 'ACTIVA',
      esAnonima: false,
      fechaInicio: new Date(Date.now() - 86400000), // Ayer
      fechaFin: new Date(Date.now() + 86400000)     // Mañana
    };

    it('debe permitir responder encuesta activa', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue(mockEncuestaActiva);
      prisma.tHRespuestaEncuesta.findFirst.mockResolvedValue(null);
      prisma.tHRespuestaEncuesta.create.mockResolvedValue({
        encuestaId: '1',
        empleadoId: 'emp-1',
        respuestas: [5, 4, 3]
      });

      const result = await bienestarService.responderEncuesta('1', 'emp-1', [5, 4, 3]);

      expect(result.respuestas).toEqual([5, 4, 3]);
    });

    it('debe lanzar NotFoundError si encuesta no existe', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue(null);

      await expect(bienestarService.responderEncuesta('999', 'emp-1', [])).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError si encuesta no está activa', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue({ ...mockEncuestaActiva, estado: 'CERRADA' });

      await expect(bienestarService.responderEncuesta('1', 'emp-1', [])).rejects.toThrow(ValidationError);
      await expect(bienestarService.responderEncuesta('1', 'emp-1', [])).rejects.toThrow('La encuesta no está activa');
    });

    it('debe lanzar ValidationError si fuera del periodo', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue({
        ...mockEncuestaActiva,
        fechaInicio: new Date(Date.now() + 86400000), // Mañana
        fechaFin: new Date(Date.now() + 172800000)    // Pasado mañana
      });

      await expect(bienestarService.responderEncuesta('1', 'emp-1', [])).rejects.toThrow(ValidationError);
      await expect(bienestarService.responderEncuesta('1', 'emp-1', [])).rejects.toThrow('La encuesta no está en el periodo de respuesta');
    });

    it('debe lanzar ValidationError si ya respondió (no anónima)', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue(mockEncuestaActiva);
      prisma.tHRespuestaEncuesta.findFirst.mockResolvedValue({ id: 'resp-1' });

      await expect(bienestarService.responderEncuesta('1', 'emp-1', [])).rejects.toThrow(ValidationError);
      await expect(bienestarService.responderEncuesta('1', 'emp-1', [])).rejects.toThrow('Ya respondiste esta encuesta');
    });

    it('debe permitir múltiples respuestas en encuesta anónima', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue({ ...mockEncuestaActiva, esAnonima: true });
      prisma.tHRespuestaEncuesta.create.mockResolvedValue({
        encuestaId: '1',
        empleadoId: null,
        respuestas: [5]
      });

      const result = await bienestarService.responderEncuesta('1', 'emp-1', [5]);

      expect(prisma.tHRespuestaEncuesta.findFirst).not.toHaveBeenCalled();
      expect(result.empleadoId).toBeNull();
    });
  });

  describe('getResultadosEncuesta', () => {
    it('debe obtener resultados agregados', async () => {
      const mockEncuesta = {
        id: '1',
        titulo: 'Clima laboral',
        tipo: 'CLIMA',
        fechaInicio: new Date(),
        fechaFin: new Date(),
        preguntas: [
          { texto: 'Pregunta escala', tipo: 'escala' },
          { texto: 'Pregunta opción', tipo: 'opcion_multiple' }
        ],
        respuestas: [
          { respuestas: [5, 'opcion_a'] },
          { respuestas: [4, 'opcion_b'] },
          { respuestas: [3, 'opcion_a'] }
        ]
      };

      prisma.tHEncuesta.findUnique.mockResolvedValue(mockEncuesta);

      const result = await bienestarService.getResultadosEncuesta('1');

      expect(result.totalRespuestas).toBe(3);
      expect(result.resultados).toHaveLength(2);
      expect(result.resultados[0].promedio).toBe(4);
    });

    it('debe lanzar NotFoundError si encuesta no existe', async () => {
      prisma.tHEncuesta.findUnique.mockResolvedValue(null);

      await expect(bienestarService.getResultadosEncuesta('999')).rejects.toThrow(NotFoundError);
    });
  });

  // ============ EVENTOS ============

  describe('listEventos', () => {
    it('debe listar eventos', async () => {
      const mockEventos = [
        { id: '1', titulo: 'Cumpleaños', tipo: 'CELEBRACION' },
        { id: '2', titulo: 'Integración', tipo: 'INTEGRACION' }
      ];

      prisma.tHEvento.findMany.mockResolvedValue(mockEventos);
      prisma.tHEvento.count.mockResolvedValue(2);

      const result = await bienestarService.listEventos({});

      expect(result.data).toHaveLength(2);
    });

    it('debe filtrar por tipo y fechas', async () => {
      prisma.tHEvento.findMany.mockResolvedValue([]);
      prisma.tHEvento.count.mockResolvedValue(0);

      await bienestarService.listEventos({
        tipo: 'CELEBRACION',
        fechaDesde: '2025-01-01',
        fechaHasta: '2025-12-31'
      });

      expect(prisma.tHEvento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: 'CELEBRACION',
            fecha: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date)
            })
          })
        })
      );
    });
  });

  describe('createEvento', () => {
    it('debe crear un evento', async () => {
      const data = {
        titulo: 'Celebración navideña',
        tipo: 'CELEBRACION',
        fecha: new Date('2025-12-20'),
        ubicacion: 'Salón principal'
      };

      prisma.tHEvento.create.mockResolvedValue({ id: '1', ...data });

      const result = await bienestarService.createEvento(data);

      expect(result.titulo).toBe('Celebración navideña');
    });
  });

  describe('confirmarAsistencia', () => {
    it('debe confirmar asistencia a evento', async () => {
      prisma.tHEvento.findUnique.mockResolvedValue({ id: '1', cupoMaximo: 50 });
      prisma.tHAsistenteEvento.count.mockResolvedValue(10);
      prisma.tHAsistenteEvento.upsert.mockResolvedValue({
        eventoId: '1',
        empleadoId: 'emp-1',
        confirmado: true
      });

      const result = await bienestarService.confirmarAsistencia('1', 'emp-1');

      expect(result.confirmado).toBe(true);
    });

    it('debe lanzar NotFoundError si evento no existe', async () => {
      prisma.tHEvento.findUnique.mockResolvedValue(null);

      await expect(bienestarService.confirmarAsistencia('999', 'emp-1')).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ValidationError si evento está lleno', async () => {
      prisma.tHEvento.findUnique.mockResolvedValue({ id: '1', cupoMaximo: 10 });
      prisma.tHAsistenteEvento.count.mockResolvedValue(10);

      await expect(bienestarService.confirmarAsistencia('1', 'emp-1')).rejects.toThrow(ValidationError);
      await expect(bienestarService.confirmarAsistencia('1', 'emp-1')).rejects.toThrow('El evento está lleno');
    });
  });

  describe('registrarAsistenciaEvento', () => {
    it('debe registrar asistencia', async () => {
      prisma.tHAsistenteEvento.findUnique.mockResolvedValue({ id: 'asis-1' });
      prisma.tHAsistenteEvento.update.mockResolvedValue({ id: 'asis-1', asistio: true });

      const result = await bienestarService.registrarAsistenciaEvento('1', 'emp-1', true);

      expect(result.asistio).toBe(true);
    });

    it('debe lanzar NotFoundError si registro no existe', async () => {
      prisma.tHAsistenteEvento.findUnique.mockResolvedValue(null);

      await expect(bienestarService.registrarAsistenciaEvento('1', 'emp-1', true)).rejects.toThrow(NotFoundError);
    });
  });

  // ============ RECONOCIMIENTOS ============

  describe('createReconocimiento', () => {
    it('debe crear un reconocimiento', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.tHReconocimiento.create.mockResolvedValue({
        empleadoId: 'emp-1',
        otorgadoPor: 'user-1',
        tipo: 'EMPLEADO_MES',
        titulo: 'Empleado del mes'
      });

      const result = await bienestarService.createReconocimiento('emp-1', 'user-1', {
        tipo: 'EMPLEADO_MES',
        titulo: 'Empleado del mes',
        fecha: new Date()
      });

      expect(result.tipo).toBe('EMPLEADO_MES');
    });

    it('debe lanzar NotFoundError si empleado no existe', async () => {
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(bienestarService.createReconocimiento('999', 'user-1', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('listReconocimientos', () => {
    it('debe listar reconocimientos', async () => {
      const mockReconocimientos = [
        { empleado: { nombre: 'Juan' }, tipo: 'EMPLEADO_MES' },
        { empleado: { nombre: 'María' }, tipo: 'ANTIGUEDAD' }
      ];

      prisma.tHReconocimiento.findMany.mockResolvedValue(mockReconocimientos);
      prisma.tHReconocimiento.count.mockResolvedValue(2);

      const result = await bienestarService.listReconocimientos({});

      expect(result.data).toHaveLength(2);
    });

    it('debe filtrar por empleado y tipo', async () => {
      prisma.tHReconocimiento.findMany.mockResolvedValue([]);
      prisma.tHReconocimiento.count.mockResolvedValue(0);

      await bienestarService.listReconocimientos({ empleadoId: 'emp-1', tipo: 'LOGRO' });

      expect(prisma.tHReconocimiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            empleadoId: 'emp-1',
            tipo: 'LOGRO'
          })
        })
      );
    });
  });

  describe('getReconocimientosPublicos', () => {
    it('debe obtener reconocimientos públicos', async () => {
      const mockReconocimientos = [
        { esPublico: true, empleado: { nombre: 'Juan' } },
        { esPublico: true, empleado: { nombre: 'María' } }
      ];

      prisma.tHReconocimiento.findMany.mockResolvedValue(mockReconocimientos);

      const result = await bienestarService.getReconocimientosPublicos(5);

      expect(prisma.tHReconocimiento.findMany).toHaveBeenCalledWith({
        where: { esPublico: true },
        include: expect.any(Object),
        orderBy: { fecha: 'desc' },
        take: 5
      });
      expect(result).toHaveLength(2);
    });
  });
});
