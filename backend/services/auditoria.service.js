/**
 * Service de Auditoría HCE
 */
const prisma = require('../db/prisma');
const firmaDigitalService = require('./firmaDigital.service');

class AuditoriaService {
  /**
   * Registrar acción en auditoría
   */
  async registrarAccion({
    entidad,
    entidadId,
    accion,
    usuarioId,
    nombreUsuario,
    rol,
    valoresAnteriores = null,
    valoresNuevos = null,
    ipOrigen = null,
    navegador = null,
    dispositivo = null,
  }) {
    // Generar hash del registro
    const dataParaHash = {
      entidad,
      entidadId,
      accion,
      usuarioId,
      timestamp: new Date().toISOString(),
    };
    
    const hashRegistro = firmaDigitalService.generarHash(
      dataParaHash,
      usuarioId,
      dataParaHash.timestamp
    );

    const registro = await prisma.auditoriaHCE.create({
      data: {
        entidad,
        entidadId,
        accion,
        usuarioId,
        nombreUsuario,
        rol,
        valoresAnteriores,
        valoresNuevos,
        ipOrigen,
        navegador,
        dispositivo,
        hashRegistro,
      },
    });

    return registro;
  }

  /**
   * Obtener auditoría de una entidad
   */
  async getAuditoriaPorEntidad(entidad, entidadId, { page = 1, limit = 50 }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [registros, total] = await Promise.all([
      prisma.auditoriaHCE.findMany({
        where: {
          entidad,
          entidadId,
        },
        skip,
        take: parseInt(limit),
        orderBy: { fechaAccion: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditoriaHCE.count({
        where: { entidad, entidadId },
      }),
    ]);

    return {
      registros,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener auditoría de un paciente
   */
  async getAuditoriaPaciente(pacienteId, { page = 1, limit = 100 }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener todos los registros relacionados con el paciente
    const [registros, total] = await Promise.all([
      prisma.auditoriaHCE.findMany({
        where: {
          OR: [
            { entidad: 'EvolucionClinica' },
            { entidad: 'SignoVital' },
            { entidad: 'DiagnosticoHCE' },
            { entidad: 'AlertaClinica' },
          ],
        },
        skip,
        take: parseInt(limit),
        orderBy: { fechaAccion: 'desc' },
        include: {
          usuario: {
            select: {
              nombre: true,
              apellido: true,
              rol: true,
            },
          },
        },
      }),
      prisma.auditoriaHCE.count({
        where: {
          OR: [
            { entidad: 'EvolucionClinica' },
            { entidad: 'SignoVital' },
            { entidad: 'DiagnosticoHCE' },
            { entidad: 'AlertaClinica' },
          ],
        },
      }),
    ]);

    return {
      registros,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener acciones de un usuario
   */
  async getAuditoriaPorUsuario(usuarioId, { page = 1, limit = 50 }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [registros, total] = await Promise.all([
      prisma.auditoriaHCE.findMany({
        where: { usuarioId },
        skip,
        take: parseInt(limit),
        orderBy: { fechaAccion: 'desc' },
      }),
      prisma.auditoriaHCE.count({ where: { usuarioId } }),
    ]);

    return {
      registros,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }
}

module.exports = new AuditoriaService();
