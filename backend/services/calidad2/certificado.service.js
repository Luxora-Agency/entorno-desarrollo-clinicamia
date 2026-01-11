const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');
const { safeDate } = require('../../utils/date');
const crypto = require('crypto');

class CertificadoCapacitacionService {
  /**
   * Obtener todos los certificados
   */
  async findAll(query = {}) {
    const { page = 1, limit = 20, personalId, sesionId, search, anio } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(personalId && { personalId }),
      ...(sesionId && { sesionId }),
      ...(anio && {
        fechaCapacitacion: {
          gte: new Date(`${anio}-01-01`),
          lt: new Date(`${parseInt(anio) + 1}-01-01`),
        }
      }),
      ...(search && {
        OR: [
          { nombreParticipante: { contains: search, mode: 'insensitive' } },
          { temaCapacitacion: { contains: search, mode: 'insensitive' } },
          { numero: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.certificadoCapacitacion.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { fechaEmision: 'desc' },
      }),
      prisma.certificadoCapacitacion.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener certificado por ID
   */
  async findById(id) {
    const certificado = await prisma.certificadoCapacitacion.findUnique({
      where: { id },
    });

    if (!certificado) {
      throw new NotFoundError('Certificado no encontrado');
    }

    return certificado;
  }

  /**
   * Verificar certificado por código QR
   */
  async verificar(codigoVerificacion) {
    const certificado = await prisma.certificadoCapacitacion.findUnique({
      where: { codigoVerificacion },
    });

    if (!certificado) {
      return { valido: false, mensaje: 'Certificado no encontrado' };
    }

    return {
      valido: true,
      certificado: {
        numero: certificado.numero,
        nombreParticipante: certificado.nombreParticipante,
        temaCapacitacion: certificado.temaCapacitacion,
        fechaCapacitacion: certificado.fechaCapacitacion,
        duracionHoras: certificado.duracionHoras,
        instructor: certificado.instructor,
        fechaEmision: certificado.fechaEmision,
      },
    };
  }

  /**
   * Generar número de certificado consecutivo
   */
  async generarNumeroCertificado() {
    const year = new Date().getFullYear();
    const prefix = `CERT-${year}`;

    const ultimoCertificado = await prisma.certificadoCapacitacion.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
    });

    if (!ultimoCertificado) {
      return `${prefix}-0001`;
    }

    const numeroActual = parseInt(ultimoCertificado.numero.split('-').pop()) || 0;
    const nuevoNumero = (numeroActual + 1).toString().padStart(4, '0');
    return `${prefix}-${nuevoNumero}`;
  }

  /**
   * Generar código de verificación único
   */
  generarCodigoVerificacion() {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  /**
   * Crear certificado manual
   */
  async create(data, userId) {
    const numero = await this.generarNumeroCertificado();
    const codigoVerificacion = this.generarCodigoVerificacion();

    return prisma.certificadoCapacitacion.create({
      data: {
        numero,
        sesionId: data.sesionId,
        personalId: data.personalId,
        nombreParticipante: data.nombreParticipante,
        cedulaParticipante: data.cedulaParticipante,
        temaCapacitacion: data.temaCapacitacion,
        fechaCapacitacion: safeDate(data.fechaCapacitacion) || new Date(),
        duracionHoras: data.duracionHoras,
        instructor: data.instructor,
        puntajeEvaluacion: data.puntajeEvaluacion,
        codigoVerificacion,
        emitidoPor: userId,
      },
    });
  }

  /**
   * Generar certificados automáticamente para una sesión completada
   */
  async generarParaSesion(sesionId, userId) {
    // Obtener la sesión con asistentes y capacitación
    const sesion = await prisma.sesionCapacitacion.findUnique({
      where: { id: sesionId },
      include: {
        capacitacion: true,
        asistentes: {
          where: { asistio: true },
          include: {
            personal: true,
          },
        },
      },
    });

    if (!sesion) {
      throw new NotFoundError('Sesión no encontrada');
    }

    if (sesion.estado !== 'COMPLETADA') {
      throw new ValidationError('Solo se pueden generar certificados para sesiones completadas');
    }

    // Verificar asistentes que aún no tienen certificado
    const existentes = await prisma.certificadoCapacitacion.findMany({
      where: { sesionId },
      select: { personalId: true },
    });
    const personalIdsConCertificado = new Set(existentes.map(e => e.personalId));

    const asistentesNuevos = sesion.asistentes.filter(
      a => a.personal && !personalIdsConCertificado.has(a.personal.id)
    );

    if (asistentesNuevos.length === 0) {
      return { generados: 0, mensaje: 'Todos los asistentes ya tienen certificado' };
    }

    // Obtener puntajes de evaluación si existen
    const respuestasEvaluacion = await prisma.respuestaEvaluacion.findMany({
      where: {
        sesionId,
        tipo: 'POST',
      },
      select: {
        asistente: { select: { personalId: true } },
        puntaje: true,
      },
    });

    const puntajesPorPersonal = {};
    for (const r of respuestasEvaluacion) {
      if (r.asistente?.personalId) {
        puntajesPorPersonal[r.asistente.personalId] = r.puntaje;
      }
    }

    // Generar certificados
    const certificados = [];
    for (const asistente of asistentesNuevos) {
      const personal = asistente.personal;
      const numero = await this.generarNumeroCertificado();
      const codigoVerificacion = this.generarCodigoVerificacion();

      const certificado = await prisma.certificadoCapacitacion.create({
        data: {
          numero,
          sesionId,
          personalId: personal.id,
          nombreParticipante: personal.nombreCompleto,
          cedulaParticipante: personal.numeroDocumento,
          temaCapacitacion: sesion.capacitacion.tema,
          fechaCapacitacion: sesion.fecha,
          duracionHoras: sesion.capacitacion.duracionHoras,
          instructor: sesion.facilitador,
          puntajeEvaluacion: puntajesPorPersonal[personal.id] || null,
          codigoVerificacion,
          emitidoPor: userId,
        },
      });

      certificados.push(certificado);
    }

    return {
      generados: certificados.length,
      certificados,
    };
  }

  /**
   * Obtener certificados por personal
   */
  async findByPersonal(personalId) {
    return prisma.certificadoCapacitacion.findMany({
      where: { personalId },
      orderBy: { fechaCapacitacion: 'desc' },
    });
  }

  /**
   * Obtener certificados por sesión
   */
  async findBySesion(sesionId) {
    return prisma.certificadoCapacitacion.findMany({
      where: { sesionId },
      orderBy: { nombreParticipante: 'asc' },
    });
  }

  /**
   * Eliminar certificado
   */
  async delete(id) {
    const certificado = await prisma.certificadoCapacitacion.findUnique({ where: { id } });
    if (!certificado) {
      throw new NotFoundError('Certificado no encontrado');
    }

    await prisma.certificadoCapacitacion.delete({ where: { id } });
    return { message: 'Certificado eliminado correctamente' };
  }

  /**
   * Estadísticas de certificados
   */
  async getStats(query = {}) {
    const { anio } = query;
    const year = anio ? parseInt(anio) : new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const [total, porMes, ultimosCertificados] = await Promise.all([
      prisma.certificadoCapacitacion.count({
        where: { fechaEmision: { gte: startDate, lt: endDate } },
      }),
      prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM fecha_emision)::int as mes,
          COUNT(*)::int as cantidad
        FROM certificados_capacitacion
        WHERE fecha_emision >= ${startDate} AND fecha_emision < ${endDate}
        GROUP BY EXTRACT(MONTH FROM fecha_emision)
        ORDER BY mes
      `,
      prisma.certificadoCapacitacion.findMany({
        where: { fechaEmision: { gte: startDate, lt: endDate } },
        orderBy: { fechaEmision: 'desc' },
        take: 10,
      }),
    ]);

    return {
      total,
      porMes,
      ultimosCertificados,
    };
  }
}

module.exports = new CertificadoCapacitacionService();
