/**
 * Servicio de Plan de Emergencias
 * Gestiona analisis de amenazas, vulnerabilidad y respuesta
 * Normativa: Decreto 1072/2015, Ley 1523/2012
 */

const prisma = require('../../db/prisma');
const { ValidationError, NotFoundError } = require('../../utils/errors');

class PlanEmergenciasService {
  /**
   * Obtener plan de emergencias vigente
   */
  async getVigente() {
    return prisma.sSTPlanEmergencias.findFirst({
      where: { estado: 'VIGENTE' },
      include: {
        amenazas: true,
        procedimientos: true,
        recursos: true,
      },
    });
  }

  /**
   * Listar planes de emergencia
   */
  async findAll({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [planes, total] = await Promise.all([
      prisma.sSTPlanEmergencias.findMany({
        skip,
        take: limit,
        orderBy: { version: 'desc' },
        include: {
          _count: {
            select: { amenazas: true, procedimientos: true },
          },
        },
      }),
      prisma.sSTPlanEmergencias.count(),
    ]);

    return {
      data: planes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener plan por ID
   */
  async findById(id) {
    const plan = await prisma.sSTPlanEmergencias.findUnique({
      where: { id },
      include: {
        amenazas: {
          orderBy: { nivelRiesgo: 'asc' },
        },
        procedimientos: {
          orderBy: { orden: 'asc' },
        },
        recursos: true,
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan de emergencias no encontrado');
    }

    return plan;
  }

  /**
   * Crear plan de emergencias
   */
  async create(data) {
    // Poner planes anteriores en revision
    await prisma.sSTPlanEmergencias.updateMany({
      where: { estado: 'VIGENTE' },
      data: { estado: 'EN_REVISION' },
    });

    const ultimoPlan = await prisma.sSTPlanEmergencias.findFirst({
      orderBy: { version: 'desc' },
    });

    const plan = await prisma.sSTPlanEmergencias.create({
      data: {
        version: (ultimoPlan?.version || 0) + 1,
        fechaElaboracion: new Date(),
        objetivoGeneral: data.objetivoGeneral,
        objetivosEspecificos: data.objetivosEspecificos,
        alcance: data.alcance,
        descripcionOrganizacion: data.descripcionOrganizacion,
        ubicacionInstalaciones: data.ubicacionInstalaciones,
        horariosOperacion: data.horariosOperacion,
        poblacionFija: data.poblacionFija,
        poblacionFlotante: data.poblacionFlotante,
        elaboradoPor: data.elaboradoPor,
        revisadoPor: data.revisadoPor,
        aprobadoPor: data.aprobadoPor,
        estado: 'VIGENTE',
      },
    });

    return plan;
  }

  /**
   * Actualizar plan
   */
  async update(id, data) {
    const plan = await prisma.sSTPlanEmergencias.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError('Plan de emergencias no encontrado');
    }

    return prisma.SSTPlanEmergencias.update({
      where: { id },
      data,
    });
  }

  /**
   * Agregar amenaza al plan
   */
  async agregarAmenaza(planId, data) {
    const plan = await prisma.sSTPlanEmergencias.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan de emergencias no encontrado');
    }

    // Calcular nivel de riesgo
    // Amenaza (probabilidad) x Vulnerabilidad = Riesgo
    const nivelRiesgo = this.calcularNivelRiesgo(data.probabilidad, data.vulnerabilidadPersonas, data.vulnerabilidadRecursos, data.vulnerabilidadSistemas);

    const amenaza = await prisma.sSTAmenaza.create({
      data: {
        planId,
        tipoAmenaza: data.tipoAmenaza, // NATURAL, TECNOLOGICA, SOCIAL, BIOLOGICA
        descripcion: data.descripcion,
        fuente: data.fuente,
        probabilidad: data.probabilidad, // POSIBLE, PROBABLE, INMINENTE
        vulnerabilidadPersonas: data.vulnerabilidadPersonas, // ALTA, MEDIA, BAJA
        vulnerabilidadRecursos: data.vulnerabilidadRecursos,
        vulnerabilidadSistemas: data.vulnerabilidadSistemas,
        nivelRiesgo, // ALTO, MEDIO, BAJO
        medidasPrevencion: data.medidasPrevencion,
        medidasMitigacion: data.medidasMitigacion,
      },
    });

    return amenaza;
  }

  /**
   * Calcular nivel de riesgo
   */
  calcularNivelRiesgo(probabilidad, vulnPersonas, vulnRecursos, vulnSistemas) {
    const valorProb = { POSIBLE: 1, PROBABLE: 2, INMINENTE: 3 };
    const valorVuln = { BAJA: 1, MEDIA: 2, ALTA: 3 };

    const probNum = valorProb[probabilidad] || 1;
    const vulnPromedio = (
      (valorVuln[vulnPersonas] || 1) +
      (valorVuln[vulnRecursos] || 1) +
      (valorVuln[vulnSistemas] || 1)
    ) / 3;

    const riesgo = probNum * vulnPromedio;

    if (riesgo >= 6) return 'ALTO';
    if (riesgo >= 3) return 'MEDIO';
    return 'BAJO';
  }

  /**
   * Agregar procedimiento operativo
   */
  async agregarProcedimiento(planId, data) {
    const plan = await prisma.sSTPlanEmergencias.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan de emergencias no encontrado');
    }

    const ultimoProc = await prisma.ssTProcedimientoEmergencia.findFirst({
      where: { planId },
      orderBy: { orden: 'desc' },
    });

    const procedimiento = await prisma.ssTProcedimientoEmergencia.create({
      data: {
        planId,
        tipoEmergencia: data.tipoEmergencia,
        nombre: data.nombre,
        objetivo: data.objetivo,
        alcance: data.alcance,
        responsable: data.responsable,
        pasosAntes: data.pasosAntes,
        pasosDurante: data.pasosDurante,
        pasosDespues: data.pasosDespues,
        recursosNecesarios: data.recursosNecesarios,
        puntosReunion: data.puntosReunion,
        numerosEmergencia: data.numerosEmergencia,
        orden: (ultimoProc?.orden || 0) + 1,
      },
    });

    return procedimiento;
  }

  /**
   * Agregar recurso de emergencia
   */
  async agregarRecurso(planId, data) {
    const plan = await prisma.sSTPlanEmergencias.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundError('Plan de emergencias no encontrado');
    }

    const recurso = await prisma.sSTRecursoEmergencia.create({
      data: {
        planId,
        tipoRecurso: data.tipoRecurso, // EXTINTOR, CAMILLA, BOTIQUIN, SENALIZACION, ALARMA, COMUNICACION
        nombre: data.nombre,
        cantidad: data.cantidad,
        ubicacion: data.ubicacion,
        estado: data.estado,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        responsableMantenimiento: data.responsableMantenimiento,
        observaciones: data.observaciones,
      },
    });

    return recurso;
  }

  /**
   * Actualizar estado de recurso
   */
  async actualizarRecurso(recursoId, data) {
    const recurso = await prisma.sSTRecursoEmergencia.findUnique({
      where: { id: recursoId },
    });

    if (!recurso) {
      throw new NotFoundError('Recurso no encontrado');
    }

    return prisma.sSTRecursoEmergencia.update({
      where: { id: recursoId },
      data: {
        estado: data.estado,
        fechaUltimaInspeccion: data.fechaUltimaInspeccion ? new Date(data.fechaUltimaInspeccion) : undefined,
        observaciones: data.observaciones,
      },
    });
  }

  /**
   * Obtener recursos proximos a vencer
   */
  async getRecursosProximosVencer(diasAnticipacion = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return prisma.sSTRecursoEmergencia.findMany({
      where: {
        fechaVencimiento: {
          lte: fechaLimite,
          gte: new Date(),
        },
        plan: { estado: 'VIGENTE' },
      },
      include: {
        plan: { select: { id: true, version: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  /**
   * Obtener matriz de amenazas
   */
  async getMatrizAmenazas(planId) {
    const amenazas = await prisma.sSTAmenaza.findMany({
      where: { planId },
      orderBy: [{ nivelRiesgo: 'asc' }, { tipoAmenaza: 'asc' }],
    });

    // Agrupar por tipo y nivel
    const matriz = {
      porTipo: {},
      porNivel: { ALTO: 0, MEDIO: 0, BAJO: 0 },
    };

    amenazas.forEach(a => {
      if (!matriz.porTipo[a.tipoAmenaza]) {
        matriz.porTipo[a.tipoAmenaza] = [];
      }
      matriz.porTipo[a.tipoAmenaza].push(a);
      matriz.porNivel[a.nivelRiesgo]++;
    });

    return matriz;
  }
}

module.exports = new PlanEmergenciasService();
