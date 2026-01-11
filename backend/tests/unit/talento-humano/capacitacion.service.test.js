/**
 * Tests para CapacitacionService - Módulo Talento Humano
 */
const prisma = require('../../../db/prisma');
const capacitacionService = require('../../../services/talento-humano/capacitacion.service');
const { ValidationError, NotFoundError } = require('../../../utils/errors');

describe('CapacitacionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('debe listar capacitaciones sin filtros', async () => {
      const mockCapacitaciones = [
        { id: '1', nombre: 'Primeros Auxilios', estado: 'PROGRAMADA' },
        { id: '2', nombre: 'Manejo de Equipos', estado: 'EN_CURSO' }
      ];

      prisma.tHCapacitacion.findMany.mockResolvedValue(mockCapacitaciones);
      prisma.tHCapacitacion.count.mockResolvedValue(2);

      const result = await capacitacionService.list({});

      expect(prisma.tHCapacitacion.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por estado', async () => {
      prisma.tHCapacitacion.findMany.mockResolvedValue([]);
      prisma.tHCapacitacion.count.mockResolvedValue(0);

      await capacitacionService.list({ estado: 'PROGRAMADA' });

      expect(prisma.tHCapacitacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'PROGRAMADA' })
        })
      );
    });

    it('debe filtrar por categoria', async () => {
      prisma.tHCapacitacion.findMany.mockResolvedValue([]);
      prisma.tHCapacitacion.count.mockResolvedValue(0);

      await capacitacionService.list({ categoria: 'TECNICA' });

      expect(prisma.tHCapacitacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoria: 'TECNICA' })
        })
      );
    });

    it('debe filtrar por modalidad', async () => {
      prisma.tHCapacitacion.findMany.mockResolvedValue([]);
      prisma.tHCapacitacion.count.mockResolvedValue(0);

      await capacitacionService.list({ modalidad: 'VIRTUAL' });

      expect(prisma.tHCapacitacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ modalidad: 'VIRTUAL' })
        })
      );
    });
  });

  describe('getById', () => {
    it('debe obtener capacitación con sesiones y asistentes', async () => {
      const mockCapacitacion = {
        id: '1',
        nombre: 'Primeros Auxilios',
        sesiones: [],
        asistentes: []
      };

      prisma.tHCapacitacion.findUnique.mockResolvedValue(mockCapacitacion);

      const result = await capacitacionService.getById('1');

      expect(prisma.tHCapacitacion.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          sesiones: expect.any(Object),
          asistentes: expect.any(Object)
        })
      });
      expect(result).toEqual(mockCapacitacion);
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.getById('999')).rejects.toThrow(NotFoundError);
      await expect(capacitacionService.getById('999')).rejects.toThrow('Capacitación no encontrada');
    });
  });

  describe('create', () => {
    it('debe crear una capacitación', async () => {
      const data = {
        nombre: 'Primeros Auxilios',
        descripcion: 'Curso básico de primeros auxilios',
        duracionHoras: 8,
        modalidad: 'PRESENCIAL'
      };

      prisma.tHCapacitacion.create.mockResolvedValue({ id: '1', ...data });

      const result = await capacitacionService.create(data);

      expect(prisma.tHCapacitacion.create).toHaveBeenCalledWith({
        data,
        include: expect.any(Object)
      });
      expect(result.nombre).toBe('Primeros Auxilios');
    });
  });

  describe('update', () => {
    it('debe actualizar una capacitación', async () => {
      const mockCapacitacion = { id: '1', nombre: 'Curso Original' };
      const updateData = { nombre: 'Curso Actualizado' };

      prisma.tHCapacitacion.findUnique.mockResolvedValue(mockCapacitacion);
      prisma.tHCapacitacion.update.mockResolvedValue({ ...mockCapacitacion, ...updateData });

      const result = await capacitacionService.update('1', updateData);

      expect(prisma.tHCapacitacion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData
      });
      expect(result.nombre).toBe('Curso Actualizado');
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.update('999', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('addSesion', () => {
    it('debe agregar sesión a capacitación', async () => {
      const mockCapacitacion = { id: '1', nombre: 'Curso' };
      const sesionData = {
        fecha: new Date(),
        horaInicio: '09:00',
        horaFin: '12:00',
        ubicacion: 'Sala A'
      };

      prisma.tHCapacitacion.findUnique.mockResolvedValue(mockCapacitacion);
      prisma.tHSesionCapacitacion.create.mockResolvedValue({ id: 'ses-1', capacitacionId: '1', ...sesionData });

      const result = await capacitacionService.addSesion('1', sesionData);

      expect(prisma.tHSesionCapacitacion.create).toHaveBeenCalledWith({
        data: {
          capacitacionId: '1',
          ...sesionData
        }
      });
      expect(result.capacitacionId).toBe('1');
    });

    it('debe lanzar NotFoundError si capacitación no existe', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.addSesion('999', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('inscribirEmpleado', () => {
    it('debe inscribir empleado correctamente', async () => {
      const mockCapacitacion = { id: '1', cuposMaximos: 20 };
      const mockEmpleado = { id: 'emp-1' };

      prisma.tHCapacitacion.findUnique.mockResolvedValue(mockCapacitacion);
      prisma.tHEmpleado.findUnique.mockResolvedValue(mockEmpleado);
      prisma.tHAsistenteCapacitacion.count.mockResolvedValue(5);
      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(null);
      prisma.tHAsistenteCapacitacion.create.mockResolvedValue({
        capacitacionId: '1',
        empleadoId: 'emp-1',
        estado: 'INSCRITO'
      });

      const result = await capacitacionService.inscribirEmpleado('1', 'emp-1');

      expect(result.estado).toBe('INSCRITO');
    });

    it('debe lanzar NotFoundError si capacitación no existe', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue(null);
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });

      await expect(capacitacionService.inscribirEmpleado('999', 'emp-1')).rejects.toThrow(NotFoundError);
      await expect(capacitacionService.inscribirEmpleado('999', 'emp-1')).rejects.toThrow('Capacitación no encontrada');
    });

    it('debe lanzar NotFoundError si empleado no existe', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue({ id: '1' });
      prisma.tHEmpleado.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.inscribirEmpleado('1', '999')).rejects.toThrow(NotFoundError);
      await expect(capacitacionService.inscribirEmpleado('1', '999')).rejects.toThrow('Empleado no encontrado');
    });

    it('debe lanzar ValidationError si capacitación está llena', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue({ id: '1', cuposMaximos: 10 });
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.tHAsistenteCapacitacion.count.mockResolvedValue(10);

      await expect(capacitacionService.inscribirEmpleado('1', 'emp-1')).rejects.toThrow(ValidationError);
      await expect(capacitacionService.inscribirEmpleado('1', 'emp-1')).rejects.toThrow('La capacitación está llena');
    });

    it('debe lanzar ValidationError si empleado ya está inscrito', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue({ id: '1', cuposMaximos: 20 });
      prisma.tHEmpleado.findUnique.mockResolvedValue({ id: 'emp-1' });
      prisma.tHAsistenteCapacitacion.count.mockResolvedValue(5);
      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue({ id: 'ins-1' });

      await expect(capacitacionService.inscribirEmpleado('1', 'emp-1')).rejects.toThrow(ValidationError);
      await expect(capacitacionService.inscribirEmpleado('1', 'emp-1')).rejects.toThrow('El empleado ya está inscrito');
    });
  });

  describe('cancelarInscripcion', () => {
    it('debe cancelar inscripción', async () => {
      const mockInscripcion = { id: 'ins-1', estado: 'INSCRITO' };

      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(mockInscripcion);
      prisma.tHAsistenteCapacitacion.update.mockResolvedValue({ ...mockInscripcion, estado: 'CANCELADO' });

      const result = await capacitacionService.cancelarInscripcion('1', 'emp-1');

      expect(result.estado).toBe('CANCELADO');
    });

    it('debe lanzar NotFoundError si inscripción no existe', async () => {
      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.cancelarInscripcion('1', 'emp-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('registrarAsistencia', () => {
    it('debe registrar asistencia positiva', async () => {
      const mockInscripcion = { id: 'ins-1' };

      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(mockInscripcion);
      prisma.tHAsistenteCapacitacion.update.mockResolvedValue({
        ...mockInscripcion,
        asistio: true,
        estado: 'ASISTIO'
      });

      const result = await capacitacionService.registrarAsistencia('1', 'emp-1', true);

      expect(result.asistio).toBe(true);
      expect(result.estado).toBe('ASISTIO');
    });

    it('debe registrar no asistencia', async () => {
      const mockInscripcion = { id: 'ins-1' };

      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(mockInscripcion);
      prisma.tHAsistenteCapacitacion.update.mockResolvedValue({
        ...mockInscripcion,
        asistio: false,
        estado: 'NO_ASISTIO'
      });

      const result = await capacitacionService.registrarAsistencia('1', 'emp-1', false);

      expect(result.asistio).toBe(false);
      expect(result.estado).toBe('NO_ASISTIO');
    });

    it('debe lanzar NotFoundError si inscripción no existe', async () => {
      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.registrarAsistencia('1', 'emp-1', true)).rejects.toThrow(NotFoundError);
    });
  });

  describe('registrarEvaluacion', () => {
    it('debe registrar evaluación y certificado', async () => {
      const mockInscripcion = { id: 'ins-1' };
      const evalData = {
        nota: 95,
        certificadoUrl: 'https://storage.com/cert.pdf',
        feedback: 'Excelente curso'
      };

      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(mockInscripcion);
      prisma.tHAsistenteCapacitacion.update.mockResolvedValue({
        ...mockInscripcion,
        notaEvaluacion: evalData.nota,
        certificadoUrl: evalData.certificadoUrl,
        feedbackCurso: evalData.feedback
      });

      const result = await capacitacionService.registrarEvaluacion('1', 'emp-1', evalData);

      expect(result.notaEvaluacion).toBe(95);
      expect(result.certificadoUrl).toBe(evalData.certificadoUrl);
    });

    it('debe lanzar NotFoundError si inscripción no existe', async () => {
      prisma.tHAsistenteCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.registrarEvaluacion('1', 'emp-1', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByEmpleado', () => {
    it('debe obtener capacitaciones de un empleado', async () => {
      const mockData = [
        { capacitacion: { nombre: 'Curso 1' }, estado: 'ASISTIO' },
        { capacitacion: { nombre: 'Curso 2' }, estado: 'INSCRITO' }
      ];

      prisma.tHAsistenteCapacitacion.findMany.mockResolvedValue(mockData);
      prisma.tHAsistenteCapacitacion.count.mockResolvedValue(2);

      const result = await capacitacionService.getByEmpleado('emp-1', {});

      expect(prisma.tHAsistenteCapacitacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ empleadoId: 'emp-1' })
        })
      );
      expect(result.data).toHaveLength(2);
    });

    it('debe filtrar por estado', async () => {
      prisma.tHAsistenteCapacitacion.findMany.mockResolvedValue([]);
      prisma.tHAsistenteCapacitacion.count.mockResolvedValue(0);

      await capacitacionService.getByEmpleado('emp-1', { estado: 'ASISTIO' });

      expect(prisma.tHAsistenteCapacitacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            empleadoId: 'emp-1',
            estado: 'ASISTIO'
          })
        })
      );
    });
  });

  describe('getCertificados', () => {
    it('debe obtener certificados de un empleado', async () => {
      const mockCertificados = [
        { certificadoUrl: 'https://cert1.pdf', capacitacion: { nombre: 'Curso 1' } },
        { certificadoUrl: 'https://cert2.pdf', capacitacion: { nombre: 'Curso 2' } }
      ];

      prisma.tHAsistenteCapacitacion.findMany.mockResolvedValue(mockCertificados);

      const result = await capacitacionService.getCertificados('emp-1');

      expect(prisma.tHAsistenteCapacitacion.findMany).toHaveBeenCalledWith({
        where: {
          empleadoId: 'emp-1',
          certificadoUrl: { not: null }
        },
        include: expect.any(Object),
        orderBy: expect.any(Object)
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('debe obtener estadísticas de capacitaciones', async () => {
      prisma.tHCapacitacion.count
        .mockResolvedValueOnce(20)  // total
        .mockResolvedValueOnce(5)   // programadas
        .mockResolvedValueOnce(3)   // enCurso
        .mockResolvedValueOnce(12); // completadas
      prisma.tHAsistenteCapacitacion.count.mockResolvedValue(100);
      prisma.tHCapacitacion.aggregate.mockResolvedValue({ _sum: { duracionHoras: 500 } });

      const result = await capacitacionService.getStats();

      expect(result).toEqual({
        capacitaciones: { total: 20, programadas: 5, enCurso: 3, completadas: 12 },
        asistentes: 100,
        horasImpartidas: 500
      });
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar estado de capacitación', async () => {
      const mockCapacitacion = { id: '1', estado: 'PROGRAMADA' };

      prisma.tHCapacitacion.findUnique.mockResolvedValue(mockCapacitacion);
      prisma.tHCapacitacion.update.mockResolvedValue({ ...mockCapacitacion, estado: 'EN_CURSO' });

      const result = await capacitacionService.changeStatus('1', 'EN_CURSO');

      expect(prisma.tHCapacitacion.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { estado: 'EN_CURSO' }
      });
      expect(result.estado).toBe('EN_CURSO');
    });

    it('debe lanzar NotFoundError si no existe', async () => {
      prisma.tHCapacitacion.findUnique.mockResolvedValue(null);

      await expect(capacitacionService.changeStatus('999', 'EN_CURSO')).rejects.toThrow(NotFoundError);
    });
  });
});
