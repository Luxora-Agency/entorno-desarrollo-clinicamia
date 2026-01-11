/**
 * Tests para DocumentoCalidad Service
 */
const prisma = require('../../db/prisma');
const documentoCalidadService = require('../../services/documentoCalidad.service');

describe('DocumentoCalidadService', () => {
  // ==========================================
  // DOCUMENTOS
  // ==========================================
  describe('getDocumentos', () => {
    it('debe retornar lista paginada de documentos', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', nombre: 'Protocolo 1', tipo: 'PROTOCOLO' },
        { id: '2', codigo: 'GU-001', nombre: 'Guía 1', tipo: 'GUIA' },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);
      prisma.documentoCalidad.count.mockResolvedValue(2);

      const result = await documentoCalidadService.getDocumentos({ page: 1, limit: 10 });

      expect(result.documentos).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('debe filtrar por tipo de documento', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', tipo: 'PROTOCOLO' },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);
      prisma.documentoCalidad.count.mockResolvedValue(1);

      const result = await documentoCalidadService.getDocumentos({ tipo: 'PROTOCOLO' });

      expect(result.documentos[0].tipo).toBe('PROTOCOLO');
    });

    it('debe filtrar por estado', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', estado: 'VIGENTE' },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);
      prisma.documentoCalidad.count.mockResolvedValue(1);

      const result = await documentoCalidadService.getDocumentos({ estado: 'VIGENTE' });

      expect(result.documentos[0].estado).toBe('VIGENTE');
    });

    it('debe buscar por texto', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', nombre: 'Protocolo de Lavado de Manos' },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);
      prisma.documentoCalidad.count.mockResolvedValue(1);

      const result = await documentoCalidadService.getDocumentos({ search: 'lavado' });

      expect(result.documentos).toHaveLength(1);
    });
  });

  describe('getDocumentoById', () => {
    it('debe retornar un documento con su historial y socializaciones', async () => {
      const mockDocumento = {
        id: '1',
        codigo: 'PRO-001',
        nombre: 'Protocolo 1',
        historialVersiones: [{ versionAnterior: '1.0', versionNueva: '2.0' }],
        socializaciones: [{ metodologia: 'Capacitación' }],
      };

      prisma.documentoCalidad.findUnique.mockResolvedValue(mockDocumento);

      const result = await documentoCalidadService.getDocumentoById('1');

      expect(result.codigo).toBe('PRO-001');
      expect(result.historialVersiones).toBeDefined();
      expect(result.socializaciones).toBeDefined();
    });

    it('debe lanzar error si el documento no existe', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue(null);

      await expect(documentoCalidadService.getDocumentoById('999')).rejects.toThrow();
    });
  });

  describe('getDocumentoByCodigo', () => {
    it('debe retornar documento por código', async () => {
      const mockDocumento = {
        id: '1',
        codigo: 'PRO-001',
        nombre: 'Protocolo 1',
      };

      prisma.documentoCalidad.findUnique.mockResolvedValue(mockDocumento);

      const result = await documentoCalidadService.getDocumentoByCodigo('PRO-001');

      expect(result.codigo).toBe('PRO-001');
    });

    it('debe lanzar error si el código no existe', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue(null);

      await expect(documentoCalidadService.getDocumentoByCodigo('XXX')).rejects.toThrow();
    });
  });

  describe('createDocumento', () => {
    it('debe crear un nuevo documento en estado borrador', async () => {
      const nuevoDocumento = {
        codigo: 'PRO-001',
        nombre: 'Nuevo Protocolo',
        tipo: 'PROTOCOLO',
        version: '1.0',
        resumen: 'Resumen del protocolo',
        archivoUrl: '/uploads/doc.pdf',
        elaboradoPor: 'user-id',
      };

      prisma.documentoCalidad.findUnique.mockResolvedValue(null);
      prisma.documentoCalidad.create.mockResolvedValue({
        id: '1',
        ...nuevoDocumento,
        estado: 'BORRADOR',
        fechaElaboracion: new Date(),
      });

      const result = await documentoCalidadService.createDocumento(nuevoDocumento);

      expect(prisma.documentoCalidad.create).toHaveBeenCalled();
      expect(result.estado).toBe('BORRADOR');
    });

    it('debe lanzar error si el código ya existe', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', codigo: 'PRO-001' });

      await expect(
        documentoCalidadService.createDocumento({ codigo: 'PRO-001', nombre: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('updateDocumento', () => {
    it('debe actualizar un documento existente', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1' });
      prisma.documentoCalidad.update.mockResolvedValue({
        id: '1',
        nombre: 'Documento Actualizado',
      });

      const result = await documentoCalidadService.updateDocumento('1', { nombre: 'Documento Actualizado' });

      expect(prisma.documentoCalidad.update).toHaveBeenCalled();
      expect(result.nombre).toBe('Documento Actualizado');
    });

    it('debe lanzar error si el documento no existe', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue(null);

      await expect(
        documentoCalidadService.updateDocumento('999', {})
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // FLUJO DE APROBACIÓN
  // ==========================================
  describe('enviarARevision', () => {
    it('debe cambiar estado a EN_REVISION', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'BORRADOR' });
      prisma.documentoCalidad.update.mockResolvedValue({
        id: '1',
        estado: 'EN_REVISION',
      });

      const result = await documentoCalidadService.enviarARevision('1', 'reviewer-id');

      expect(result.estado).toBe('EN_REVISION');
    });

    it('debe lanzar error si el documento no está en borrador', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'VIGENTE' });

      await expect(
        documentoCalidadService.enviarARevision('1', 'reviewer-id')
      ).rejects.toThrow();
    });
  });

  describe('aprobarDocumento', () => {
    it('debe aprobar y poner vigente el documento', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'EN_REVISION' });
      prisma.documentoCalidad.update.mockResolvedValue({
        id: '1',
        estado: 'VIGENTE',
        fechaAprobacion: new Date(),
      });

      const result = await documentoCalidadService.aprobarDocumento('1', 'approver-id');

      expect(result.estado).toBe('VIGENTE');
    });

    it('debe lanzar error si el documento no está en revisión', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'BORRADOR' });

      await expect(
        documentoCalidadService.aprobarDocumento('1', 'approver-id')
      ).rejects.toThrow();
    });
  });

  describe('rechazarDocumento', () => {
    it('debe rechazar y devolver a borrador', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({
        id: '1',
        estado: 'EN_REVISION',
        resumen: 'Resumen original',
      });
      prisma.documentoCalidad.update.mockResolvedValue({
        id: '1',
        estado: 'BORRADOR',
      });

      const result = await documentoCalidadService.rechazarDocumento('1', 'Observaciones de rechazo');

      expect(result.estado).toBe('BORRADOR');
    });
  });

  describe('marcarObsoleto', () => {
    it('debe marcar un documento como obsoleto', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'VIGENTE' });
      prisma.documentoCalidad.update.mockResolvedValue({
        id: '1',
        estado: 'OBSOLETO',
      });

      const result = await documentoCalidadService.marcarObsoleto('1');

      expect(result.estado).toBe('OBSOLETO');
    });
  });

  // ==========================================
  // CONTROL DE VERSIONES
  // ==========================================
  describe('crearNuevaVersion', () => {
    it('debe crear una nueva versión del documento', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({
        id: '1',
        version: '1.0',
        archivoUrl: '/uploads/doc-v1.pdf',
      });
      prisma.historialVersionDocumento.create.mockResolvedValue({});
      prisma.documentoCalidad.update.mockResolvedValue({
        id: '1',
        version: '2.0',
        estado: 'BORRADOR',
      });

      const result = await documentoCalidadService.crearNuevaVersion('1', {
        nuevaVersion: '2.0',
        cambiosRealizados: 'Cambios realizados',
        archivoUrl: '/uploads/doc-v2.pdf',
        modificadoPor: 'user-id',
      });

      expect(prisma.historialVersionDocumento.create).toHaveBeenCalled();
      expect(result.version).toBe('2.0');
    });
  });

  describe('getHistorialVersiones', () => {
    it('debe retornar historial de versiones de un documento', async () => {
      const mockHistorial = [
        { versionAnterior: '1.0', versionNueva: '2.0' },
        { versionAnterior: '2.0', versionNueva: '3.0' },
      ];

      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1' });
      prisma.historialVersionDocumento.findMany.mockResolvedValue(mockHistorial);

      const result = await documentoCalidadService.getHistorialVersiones('1');

      expect(result).toHaveLength(2);
    });
  });

  // ==========================================
  // SOCIALIZACIÓN
  // ==========================================
  describe('registrarSocializacion', () => {
    it('debe registrar una socialización del documento', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'VIGENTE' });
      prisma.socializacionDocumento.create.mockResolvedValue({
        id: 's1',
        metodologia: 'Capacitación',
        participantes: ['Usuario 1', 'Usuario 2'],
      });

      const result = await documentoCalidadService.registrarSocializacion({
        documentoId: '1',
        metodologia: 'Capacitación',
        participantes: ['Usuario 1', 'Usuario 2'],
        realizadoPor: 'user-id',
      });

      expect(prisma.socializacionDocumento.create).toHaveBeenCalled();
      expect(result.metodologia).toBe('Capacitación');
    });

    it('debe lanzar error si el documento no está vigente', async () => {
      prisma.documentoCalidad.findUnique.mockResolvedValue({ id: '1', estado: 'BORRADOR' });

      await expect(
        documentoCalidadService.registrarSocializacion({
          documentoId: '1',
          metodologia: 'Capacitación',
          realizadoPor: 'user-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('getSocializaciones', () => {
    it('debe retornar socializaciones de un documento', async () => {
      const mockSocializaciones = [
        { id: 's1', metodologia: 'Capacitación' },
        { id: 's2', metodologia: 'Reunión' },
      ];

      prisma.socializacionDocumento.findMany.mockResolvedValue(mockSocializaciones);

      const result = await documentoCalidadService.getSocializaciones('1');

      expect(result).toHaveLength(2);
    });
  });

  // ==========================================
  // LISTADO MAESTRO Y REPORTES
  // ==========================================
  describe('getListadoMaestro', () => {
    it('debe retornar listado maestro de documentos', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', tipo: 'PROTOCOLO' },
        { id: '2', codigo: 'GU-001', tipo: 'GUIA' },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);

      const result = await documentoCalidadService.getListadoMaestro();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('documentos');
      expect(result).toHaveProperty('porTipo');
    });
  });

  describe('getDocumentosProximosVencer', () => {
    it('debe retornar documentos próximos a fecha de revisión', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', fechaVigencia: new Date() },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);

      const result = await documentoCalidadService.getDocumentosProximosVencer(90);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getDashboard', () => {
    it('debe retornar estadísticas de documentos', async () => {
      prisma.documentoCalidad.count.mockResolvedValue(50);
      prisma.documentoCalidad.groupBy.mockResolvedValue([
        { estado: 'VIGENTE', _count: 30 },
        { estado: 'BORRADOR', _count: 10 },
      ]);
      prisma.documentoCalidad.findMany.mockResolvedValue([]);

      const result = await documentoCalidadService.getDashboard();

      expect(result).toHaveProperty('resumen');
      expect(result.resumen).toHaveProperty('totalDocumentos');
      expect(result).toHaveProperty('documentosPorEstado');
      expect(result).toHaveProperty('documentosPorTipo');
    });
  });

  describe('buscarPorPalabraClave', () => {
    it('debe buscar documentos por palabra clave', async () => {
      const mockDocumentos = [
        { id: '1', codigo: 'PRO-001', nombre: 'Protocolo de Higiene' },
      ];

      prisma.documentoCalidad.findMany.mockResolvedValue(mockDocumentos);

      const result = await documentoCalidadService.buscarPorPalabraClave('higiene');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
