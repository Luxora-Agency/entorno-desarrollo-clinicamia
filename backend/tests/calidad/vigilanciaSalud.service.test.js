/**
 * Tests para VigilanciaSalud Service
 */
const prisma = require('../../db/prisma');
const vigilanciaSaludService = require('../../services/vigilanciaSalud.service');

describe('VigilanciaSaludService', () => {
  // ==========================================
  // SIVIGILA
  // ==========================================
  describe('getNotificacionesSIVIGILA', () => {
    it('debe retornar lista paginada de notificaciones', async () => {
      const mockNotificaciones = [
        { id: '1', codigoEvento: '210', nombreEvento: 'Dengue', tipoNotificacion: 'Semanal' },
        { id: '2', codigoEvento: '220', nombreEvento: 'Dengue grave', tipoNotificacion: 'Inmediata' },
      ];

      prisma.notificacionSIVIGILA.findMany.mockResolvedValue(mockNotificaciones);
      prisma.notificacionSIVIGILA.count.mockResolvedValue(2);

      const result = await vigilanciaSaludService.getNotificacionesSIVIGILA({ page: 1, limit: 10 });

      expect(result.notificaciones).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por semana epidemiológica', async () => {
      prisma.notificacionSIVIGILA.findMany.mockResolvedValue([]);
      prisma.notificacionSIVIGILA.count.mockResolvedValue(0);

      await vigilanciaSaludService.getNotificacionesSIVIGILA({ semanaEpidemiologica: 1 });

      expect(prisma.notificacionSIVIGILA.findMany).toHaveBeenCalled();
    });

    it('debe filtrar por código de evento', async () => {
      const mockNotificaciones = [
        { id: '1', codigoEvento: '210', nombreEvento: 'Dengue' },
      ];

      prisma.notificacionSIVIGILA.findMany.mockResolvedValue(mockNotificaciones);
      prisma.notificacionSIVIGILA.count.mockResolvedValue(1);

      const result = await vigilanciaSaludService.getNotificacionesSIVIGILA({ codigoEvento: '210' });

      expect(result.notificaciones[0].codigoEvento).toBe('210');
    });
  });

  describe('getNotificacionSIVIGILAById', () => {
    it('debe retornar una notificación con datos del paciente', async () => {
      const mockNotificacion = {
        id: '1',
        codigoEvento: '210',
        nombreEvento: 'Dengue',
        paciente: { id: 'p1', nombre: 'Juan', apellido: 'Pérez' },
        notificador: { nombre: 'Dr', apellido: 'Smith' },
      };

      prisma.notificacionSIVIGILA.findUnique.mockResolvedValue(mockNotificacion);

      const result = await vigilanciaSaludService.getNotificacionSIVIGILAById('1');

      expect(result.codigoEvento).toBe('210');
      expect(result.paciente).toBeDefined();
    });

    it('debe lanzar error si la notificación no existe', async () => {
      prisma.notificacionSIVIGILA.findUnique.mockResolvedValue(null);

      await expect(vigilanciaSaludService.getNotificacionSIVIGILAById('999')).rejects.toThrow();
    });
  });

  describe('createNotificacionSIVIGILA', () => {
    it('debe crear una notificación semanal', async () => {
      const nuevaNotificacion = {
        pacienteId: 'p1',
        codigoEvento: '210',
        nombreEvento: 'Dengue',
        tipoNotificacion: 'Semanal',
        clasificacionInicial: 'Probable',
        notificadoPor: 'user-id',
      };

      prisma.paciente.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.notificacionSIVIGILA.create.mockResolvedValue({
        id: '1',
        ...nuevaNotificacion,
        semanaEpidemiologica: 51,
        anioEpidemiologico: 2025,
      });

      const result = await vigilanciaSaludService.createNotificacionSIVIGILA(nuevaNotificacion);

      expect(prisma.notificacionSIVIGILA.create).toHaveBeenCalled();
      expect(result.codigoEvento).toBe('210');
    });

    it('debe lanzar error si el paciente no existe', async () => {
      prisma.paciente.findUnique.mockResolvedValue(null);

      await expect(
        vigilanciaSaludService.createNotificacionSIVIGILA({
          pacienteId: 'invalid',
          codigoEvento: '210',
          nombreEvento: 'Dengue',
          notificadoPor: 'user-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateNotificacionSIVIGILA', () => {
    it('debe actualizar la clasificación final del caso', async () => {
      prisma.notificacionSIVIGILA.findUnique.mockResolvedValue({ id: '1' });
      prisma.notificacionSIVIGILA.update.mockResolvedValue({
        id: '1',
        clasificacionFinal: 'Confirmado por laboratorio',
        condicionFinal: 'Vivo',
      });

      const result = await vigilanciaSaludService.updateNotificacionSIVIGILA('1', {
        clasificacionFinal: 'Confirmado por laboratorio',
        condicionFinal: 'Vivo',
      });

      expect(result.clasificacionFinal).toBe('Confirmado por laboratorio');
    });

    it('debe lanzar error si la notificación no existe', async () => {
      prisma.notificacionSIVIGILA.findUnique.mockResolvedValue(null);

      await expect(
        vigilanciaSaludService.updateNotificacionSIVIGILA('999', {})
      ).rejects.toThrow();
    });
  });

  describe('marcarEnviadoINS', () => {
    it('debe marcar notificación como enviada al INS', async () => {
      prisma.notificacionSIVIGILA.findUnique.mockResolvedValue({ id: '1' });
      prisma.notificacionSIVIGILA.update.mockResolvedValue({
        id: '1',
        enviadoINS: true,
        fechaEnvioINS: new Date(),
      });

      const result = await vigilanciaSaludService.marcarEnviadoINS('1');

      expect(result.enviadoINS).toBe(true);
    });

    it('debe lanzar error si la notificación no existe', async () => {
      prisma.notificacionSIVIGILA.findUnique.mockResolvedValue(null);

      await expect(vigilanciaSaludService.marcarEnviadoINS('999')).rejects.toThrow();
    });
  });

  // ==========================================
  // FARMACOVIGILANCIA
  // ==========================================
  describe('getReportesFarmacovigilancia', () => {
    it('debe retornar lista de reportes de RAM', async () => {
      const mockReportes = [
        { id: '1', tipoReporte: 'RAM', gravedadReaccion: 'Leve' },
        { id: '2', tipoReporte: 'RAM', gravedadReaccion: 'Grave' },
      ];

      prisma.reporteFarmacovigilancia.findMany.mockResolvedValue(mockReportes);
      prisma.reporteFarmacovigilancia.count.mockResolvedValue(2);

      const result = await vigilanciaSaludService.getReportesFarmacovigilancia({ page: 1, limit: 10 });

      expect(result.reportes).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por tipo de reporte', async () => {
      const mockReportes = [
        { id: '1', tipoReporte: 'RAM' },
      ];

      prisma.reporteFarmacovigilancia.findMany.mockResolvedValue(mockReportes);
      prisma.reporteFarmacovigilancia.count.mockResolvedValue(1);

      const result = await vigilanciaSaludService.getReportesFarmacovigilancia({ tipoReporte: 'RAM' });

      expect(result.reportes[0].tipoReporte).toBe('RAM');
    });
  });

  describe('createReporteFarmacovigilancia', () => {
    it('debe crear un reporte de RAM', async () => {
      const nuevoReporte = {
        pacienteId: 'p1',
        productoId: 'prod1',
        tipoReporte: 'RAM',
        fechaEvento: '2025-01-15',
        descripcionReaccion: 'Reacción alérgica',
        gravedadReaccion: 'Moderada',
        reportadoPor: 'user-id',
      };

      prisma.paciente.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.producto.findUnique.mockResolvedValue({ id: 'prod1' });
      prisma.reporteFarmacovigilancia.create.mockResolvedValue({
        id: '1',
        ...nuevoReporte,
        reportadoINVIMA: false,
      });

      const result = await vigilanciaSaludService.createReporteFarmacovigilancia(nuevoReporte);

      expect(prisma.reporteFarmacovigilancia.create).toHaveBeenCalled();
      expect(result.tipoReporte).toBe('RAM');
    });
  });

  describe('marcarReporteFarmacoEnviadoINVIMA', () => {
    it('debe marcar reporte de farmacovigilancia como reportado al INVIMA', async () => {
      prisma.reporteFarmacovigilancia.findUnique.mockResolvedValue({ id: '1' });
      prisma.reporteFarmacovigilancia.update.mockResolvedValue({
        id: '1',
        reportadoINVIMA: true,
        fechaReporteINVIMA: new Date(),
      });

      const result = await vigilanciaSaludService.marcarReporteFarmacoEnviadoINVIMA('1');

      expect(result.reportadoINVIMA).toBe(true);
    });

    it('debe lanzar error si el reporte no existe', async () => {
      prisma.reporteFarmacovigilancia.findUnique.mockResolvedValue(null);

      await expect(vigilanciaSaludService.marcarReporteFarmacoEnviadoINVIMA('999')).rejects.toThrow();
    });
  });

  // ==========================================
  // TECNOVIGILANCIA
  // ==========================================
  describe('getReportesTecnovigilancia', () => {
    it('debe retornar lista de reportes de tecnovigilancia', async () => {
      const mockReportes = [
        { id: '1', nombreDispositivo: 'Bomba de infusión', gravedadIncidente: 'Grave' },
        { id: '2', nombreDispositivo: 'Monitor cardíaco', gravedadIncidente: 'Leve' },
      ];

      prisma.reporteTecnovigilancia.findMany.mockResolvedValue(mockReportes);
      prisma.reporteTecnovigilancia.count.mockResolvedValue(2);

      const result = await vigilanciaSaludService.getReportesTecnovigilancia({ page: 1, limit: 10 });

      expect(result.reportes).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('createReporteTecnovigilancia', () => {
    it('debe crear un reporte de incidente con dispositivo médico', async () => {
      const nuevoReporte = {
        pacienteId: 'p1',
        nombreDispositivo: 'Bomba de infusión',
        fabricante: 'FabricanteMed',
        fechaEvento: '2025-01-15',
        descripcionIncidente: 'Falla en el dispositivo',
        gravedadIncidente: 'Grave',
        reportadoPor: 'user-id',
      };

      prisma.paciente.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.reporteTecnovigilancia.create.mockResolvedValue({
        id: '1',
        ...nuevoReporte,
        reportadoINVIMA: false,
      });

      const result = await vigilanciaSaludService.createReporteTecnovigilancia(nuevoReporte);

      expect(prisma.reporteTecnovigilancia.create).toHaveBeenCalled();
      expect(result.nombreDispositivo).toBe('Bomba de infusión');
    });
  });

  describe('marcarReporteTecnoEnviadoINVIMA', () => {
    it('debe marcar reporte de tecnovigilancia como reportado al INVIMA', async () => {
      prisma.reporteTecnovigilancia.findUnique.mockResolvedValue({ id: '1' });
      prisma.reporteTecnovigilancia.update.mockResolvedValue({
        id: '1',
        reportadoINVIMA: true,
        fechaReporteINVIMA: new Date(),
      });

      const result = await vigilanciaSaludService.marcarReporteTecnoEnviadoINVIMA('1');

      expect(result.reportadoINVIMA).toBe(true);
    });

    it('debe lanzar error si el reporte no existe', async () => {
      prisma.reporteTecnovigilancia.findUnique.mockResolvedValue(null);

      await expect(vigilanciaSaludService.marcarReporteTecnoEnviadoINVIMA('999')).rejects.toThrow();
    });
  });

  // ==========================================
  // DASHBOARD
  // ==========================================
  describe('getDashboard', () => {
    it('debe retornar datos del dashboard de vigilancia', async () => {
      prisma.notificacionSIVIGILA.count.mockResolvedValue(100);
      prisma.reporteFarmacovigilancia.count.mockResolvedValue(50);
      prisma.reporteTecnovigilancia.count.mockResolvedValue(20);
      prisma.notificacionSIVIGILA.groupBy.mockResolvedValue([
        { semanaEpidemiologica: 1, _count: 10 },
      ]);
      prisma.notificacionSIVIGILA.findMany.mockResolvedValue([]);

      const result = await vigilanciaSaludService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('sivigila');
      expect(result.resumen).toHaveProperty('farmacovigilancia');
      expect(result.resumen).toHaveProperty('tecnovigilancia');
    });
  });

  describe('getReporteSemanal', () => {
    it('debe retornar reporte semanal SIVIGILA', async () => {
      const mockNotificaciones = [
        { codigoEvento: '210', nombreEvento: 'Dengue', tipoNotificacion: 'Semanal' },
        { codigoEvento: '210', nombreEvento: 'Dengue', tipoNotificacion: 'Semanal' },
      ];

      prisma.notificacionSIVIGILA.findMany.mockResolvedValue(mockNotificaciones);

      const result = await vigilanciaSaludService.getReporteSemanal(1, 2025);

      expect(result).toHaveProperty('semana');
      expect(result).toHaveProperty('anio');
      expect(result).toHaveProperty('totalCasos');
      expect(result).toHaveProperty('resumenPorEvento');
    });
  });

  // ==========================================
  // UTILIDADES
  // ==========================================
  describe('calcularSemanaEpidemiologica', () => {
    it('debe calcular la semana epidemiológica correctamente', () => {
      const result = vigilanciaSaludService.calcularSemanaEpidemiologica(new Date('2025-01-15'));

      expect(result).toHaveProperty('semana');
      expect(result).toHaveProperty('anio');
      expect(result.semana).toBeGreaterThan(0);
      expect(result.semana).toBeLessThanOrEqual(53);
    });
  });

  describe('getEventosNotificacionObligatoria', () => {
    it('debe retornar lista de eventos de notificación obligatoria', () => {
      const result = vigilanciaSaludService.getEventosNotificacionObligatoria();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('codigo');
      expect(result[0]).toHaveProperty('nombre');
      expect(result[0]).toHaveProperty('tipo');
    });
  });
});
